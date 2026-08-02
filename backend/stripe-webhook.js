// ================================================================
// Tidsbrev.no — Netlify Function: Stripe webhook
// ================================================================
// Stripe sender et POST-kall hit hver gang en betalingshendelse
// skjer (f.eks. når en Checkout Session fullføres). Vi verifiserer
// signaturen, oppdaterer ordren til 'paid' i Supabase, og logger
// handlingen i admin_log.
//
// VIKTIG: Denne funksjonen må motta RÅ body (ikke parsed JSON) for
// at signaturverifiseringen skal fungere. Netlify gir oss base64-
// encoded body når vi ber om det via konfigurasjonen.
//
// Miljøvariabler som MÅ settes i Netlify dashboard:
//
//   STRIPE_SECRET_KEY         — sk_test_... eller sk_live_...
//                               (Stripe dashboard → Developers → API keys)
//   STRIPE_WEBHOOK_SECRET     — whsec_...
//                               (Stripe dashboard → Developers → Webhooks
//                                → Velg endpoint → "Signing secret")
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//
// Webhook-URL som registreres hos Stripe:
//   https://tidsbrev.no/api/stripe-webhook
//
// Events å abonnere på:
//   - checkout.session.completed
//   - checkout.session.async_payment_succeeded
//   - checkout.session.async_payment_failed
//   - checkout.session.expired
//   Årlig nedbetaling (Subscription):
//   - invoice.paid
//   - invoice.payment_failed
//   - customer.subscription.deleted
// ================================================================

const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');
const { sendEmail } = require('./send-email');

// ----------------------------------------------------------------
// Finn ordren som hører til et abonnement.
// Prøver først lagret stripe_subscription_id på ordren; faller tilbake til
// subscription-metadata (order_id) dersom en faktura-hendelse kommer før
// checkout.session.completed rakk å lagre abonnements-id-en på ordren.
// ----------------------------------------------------------------
async function finnOrdreForAbonnement(supabase, stripe, subscriptionId) {
  const { data: order } = await supabase
    .from('orders')
    .select('id, delivery_date')
    .eq('stripe_subscription_id', subscriptionId)
    .maybeSingle();
  if (order) return order;

  try {
    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    const orderId = sub.metadata && sub.metadata.order_id;
    if (!orderId) return null;
    const { data: byId } = await supabase
      .from('orders')
      .select('id, delivery_date')
      .eq('id', orderId)
      .maybeSingle();
    return byId || null;
  } catch (e) {
    console.error('[stripe-webhook] Kunne ikke hente abonnement:', e.message);
    return null;
  }
}

exports.handler = async (event) => {
  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // ---- 1. Verifiser signatur ----
  const signature = event.headers['stripe-signature'];
  if (!signature) {
    console.warn('[stripe-webhook] Mangler stripe-signature header');
    return { statusCode: 400, body: 'Missing signature' };
  }

  // Netlify gir oss bodyen som string (evt. base64 hvis binær)
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body;

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('[stripe-webhook] Signaturverifisering feilet:', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  console.log(`[stripe-webhook] Mottok: ${stripeEvent.type}`);

  try {
    // ---- 2. Håndter forskjellige event-typer ----
    switch (stripeEvent.type) {

      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const session = stripeEvent.data.object;
        const orderId = session.metadata && session.metadata.order_id;

        if (!orderId) {
          console.error('[stripe-webhook] Mangler order_id i metadata');
          break;
        }

        // Oppdater ordren til 'paid'
        const orderUpdate = {
          payment_status:    'paid',
          stripe_session_id: session.id
        };

        // Årlig nedbetaling (B): lagre abonnements-id + status, og sett abonnementet
        // til å avsluttes automatisk på leveringsdato (cancel_at).
        if (session.mode === 'subscription' && session.subscription) {
          orderUpdate.stripe_subscription_id = session.subscription;
          orderUpdate.subscription_status    = 'active';

          try {
            const { data: ord } = await supabase
              .from('orders')
              .select('delivery_date')
              .eq('id', orderId)
              .single();
            if (ord && ord.delivery_date) {
              const cancelAt = Math.floor(new Date(ord.delivery_date).getTime() / 1000);
              // Kun frem i tid — Stripe avviser cancel_at i fortiden.
              if (cancelAt > Math.floor(Date.now() / 1000)) {
                await stripe.subscriptions.update(session.subscription, { cancel_at: cancelAt });
              }
            }
          } catch (subErr) {
            console.error('[stripe-webhook] Kunne ikke sette cancel_at på abonnement:', subErr.message);
            await supabase.from('admin_log').insert({
              action: 'subscription_cancel_at_failed',
              order_id: orderId,
              note: `Abonnement ${session.subscription}: ${subErr.message}`
            });
          }
        }

        const { error } = await supabase
          .from('orders')
          .update(orderUpdate)
          .eq('id', orderId);

        if (error) {
          console.error('[stripe-webhook] Kunne ikke oppdatere ordre:', error);
          throw error;
        }

        // Logg handlingen i admin_log
        await supabase.from('admin_log').insert({
          action: 'payment_completed',
          order_id: orderId,
          note: `Stripe session ${session.id} fullført. Beløp: ${session.amount_total / 100} ${session.currency.toUpperCase()}`
        });

        // Send bekreftelses-e-post til kunden
        try {
          await sendEmail({ type: 'order_confirmation', order_id: orderId });
          console.log(`[stripe-webhook] Bekreftelses-e-post sendt for ordre ${orderId}`);
        } catch (emailErr) {
          // Ikke la e-postfeil stoppe webhook-responsen — ordren er betalt uansett
          console.error(`[stripe-webhook] Kunne ikke sende bekreftelse:`, emailErr.message);
          await supabase.from('admin_log').insert({
            action: 'email_failed_order_confirmation',
            order_id: orderId,
            note: `Bekreftelse feilet: ${emailErr.message}`
          });
        }

        // Send intern varsel til admin
        try {
          await sendEmail({ type: 'admin_new_order', order_id: orderId });
          console.log(`[stripe-webhook] Admin-varsel sendt for ordre ${orderId}`);
        } catch (emailErr) {
          console.error(`[stripe-webhook] Kunne ikke sende admin-varsel:`, emailErr.message);
        }

        // Trigger video conversion for tidskapsell orders
        if (session.metadata && session.metadata.delivery_type === 'tidskapsell') {
          try {
            const sideUrl = process.env.SIDE_URL || 'https://tidsbrev.no';
            await fetch(`${sideUrl}/api/convert-video-background`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ order_id: orderId })
            });
            console.log(`[stripe-webhook] Video-konvertering trigget for ordre ${orderId}`);
          } catch (convErr) {
            console.error(`[stripe-webhook] Kunne ikke trigge video-konvertering:`, convErr.message);
            await supabase.from('admin_log').insert({
              action: 'video_conversion_trigger_failed',
              order_id: orderId,
              note: `Kunne ikke trigge konvertering: ${convErr.message}`
            });
          }
        }

        console.log(`[stripe-webhook] Ordre ${orderId} markert som betalt`);
        break;
      }

      case 'checkout.session.async_payment_failed':
      case 'checkout.session.expired': {
        const session = stripeEvent.data.object;
        const orderId = session.metadata && session.metadata.order_id;
        if (!orderId) break;

        await supabase
          .from('orders')
          .update({ payment_status: 'failed' })
          .eq('id', orderId);

        await supabase.from('admin_log').insert({
          action: 'payment_failed',
          order_id: orderId,
          note: `Stripe-betaling feilet eller utløp. Event: ${stripeEvent.type}`
        });
        break;
      }

      // ------------------------------------------------
      // ÅRLIG NEDBETALING (Subscription) — B
      // ------------------------------------------------

      // Årlig trekk gjennomført (også første faktura ved oppstart).
      case 'invoice.paid': {
        const invoice = stripeEvent.data.object;
        const subId = invoice.subscription;
        if (!subId) break; // ikke en abonnements-faktura

        const order = await finnOrdreForAbonnement(supabase, stripe, subId);
        if (!order) {
          console.warn(`[stripe-webhook] invoice.paid: fant ingen ordre for abonnement ${subId}`);
          break;
        }

        await supabase
          .from('orders')
          .update({ payment_status: 'paid', subscription_status: 'active' })
          .eq('id', order.id);

        await supabase.from('admin_log').insert({
          action: 'subscription_invoice_paid',
          order_id: order.id,
          note: `Årlig trekk OK. Faktura ${invoice.id}, beløp ${(invoice.amount_paid || 0) / 100} ${(invoice.currency || 'nok').toUpperCase()}`
        });
        break;
      }

      // Årlig trekk feilet — marker forfalt og varsle kunde + admin.
      case 'invoice.payment_failed': {
        const invoice = stripeEvent.data.object;
        const subId = invoice.subscription;
        if (!subId) break;

        const order = await finnOrdreForAbonnement(supabase, stripe, subId);
        if (!order) {
          console.warn(`[stripe-webhook] invoice.payment_failed: fant ingen ordre for abonnement ${subId}`);
          break;
        }

        await supabase
          .from('orders')
          .update({ subscription_status: 'past_due' })
          .eq('id', order.id);

        await supabase.from('admin_log').insert({
          action: 'subscription_payment_failed',
          order_id: order.id,
          note: `Årlig trekk feilet. Faktura ${invoice.id}. Stripe forsøker automatisk på nytt.`
        });

        // Varsle kunde + admin. E-postfeil skal ikke velte webhook-responsen.
        try {
          await sendEmail({ type: 'subscription_payment_failed', order_id: order.id });
        } catch (e) {
          console.error('[stripe-webhook] Kunne ikke varsle kunde (past_due):', e.message);
        }
        try {
          await sendEmail({ type: 'admin_subscription_failed', order_id: order.id });
        } catch (e) {
          console.error('[stripe-webhook] Kunne ikke varsle admin (past_due):', e.message);
        }
        break;
      }

      // Abonnement avsluttet (nådd cancel_at på leveringsdato, eller kansellert).
      case 'customer.subscription.deleted': {
        const sub = stripeEvent.data.object;
        const order = await finnOrdreForAbonnement(supabase, stripe, sub.id);
        if (!order) break;

        await supabase
          .from('orders')
          .update({ subscription_status: 'canceled' })
          .eq('id', order.id);

        await supabase.from('admin_log').insert({
          action: 'subscription_deleted',
          order_id: order.id,
          note: `Abonnement ${sub.id} avsluttet${sub.cancellation_details && sub.cancellation_details.reason ? ' (' + sub.cancellation_details.reason + ')' : ''}.`
        });
        break;
      }

      default:
        console.log(`[stripe-webhook] Ignorerer event-type ${stripeEvent.type}`);
    }

    // Stripe forventer 200 for at webhook skal regnes som "levert"
    return {
      statusCode: 200,
      body: JSON.stringify({ received: true })
    };

  } catch (err) {
    console.error('[stripe-webhook] Behandlingsfeil:', err);
    // Returner 500 slik at Stripe prøver på nytt
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
