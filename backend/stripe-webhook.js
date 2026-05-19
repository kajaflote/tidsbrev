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
// ================================================================

const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');
const { sendEmail } = require('./send-email');

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
        const { error } = await supabase
          .from('orders')
          .update({
            payment_status:    'paid',
            stripe_session_id: session.id
          })
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
