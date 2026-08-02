// ================================================================
// SQL-MIGRERING — kjør manuelt i Supabase SQL Editor:
//
//   ALTER TABLE orders ADD COLUMN IF NOT EXISTS premium_envelope boolean DEFAULT false;
//   ALTER TABLE orders ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'no' CHECK (language IN ('no','en'));
//
//   -- Betalingsplan (A engang / B årlig nedbetaling):
//   ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_plan text NOT NULL DEFAULT 'full' CHECK (payment_plan IN ('full','yearly'));
//   ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
//   ALTER TABLE orders ADD COLUMN IF NOT EXISTS subscription_status text CHECK (subscription_status IN ('active','past_due','canceled'));
//
// Merk:
//   • language styrer språket i ALL mottaker-rettet kommunikasjon (e-post + viewer).
//     Eksisterende rader fylles automatisk med 'no' av DEFAULT — ingen backfill nødvendig.
//     Admin-varsler til egen Gmail forblir alltid på norsk.
//   • payment_plan = 'full' (betal alt nå) eller 'yearly' (årlig nedbetaling).
//     Eksisterende rader får 'full' av DEFAULT. subscription_status er NULL for
//     engangsordre og settes av stripe-webhook.js for årlige abonnement.
// ================================================================

// ================================================================
// Tidsbrev.no — Netlify Function: Opprett Stripe Checkout Session
// ================================================================
// Denne funksjonen kalles fra frontend når kunden klikker
// "Betal med kort" på siste steg av bestillingsskjemaet.
//
// Flyt:
//   1. Motta bestillingsdata fra frontend
//   2. Lagre ordre i Supabase (orders + letters) med status 'pending'
//   3. Opprett Stripe Checkout Session
//   4. Returner session.url til frontend for videresending
//
// Miljøvariabler som MÅ settes i Netlify dashboard
// (Site settings → Environment variables):
//
//   STRIPE_SECRET_KEY         — sk_test_... eller sk_live_...
//                               (Stripe dashboard → Developers → API keys)
//   SUPABASE_URL              — https://xxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY — service_role-nøkkel (IKKE anon!)
//                               (Supabase dashboard → Settings → API)
//   SIDE_URL                  — https://tidsbrev.no (eller localhost under test)
// ================================================================

const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');
// Sentral beløpslogikk — ÉN kilde for både engang (A) og årlig (B).
// (js/config.js eksporterer også som Node-modul.)
const { getBetalingsplan } = require('../js/config.js');

const PRODUKT_NAVN = {
  digitalt:    'Digitalt Brev',
  fysisk:      'Fysisk Brev i konvolutt',
  tidskapsell: 'Tidskapsell',
  standard:    'Standard Brev',
  premium:     'Premium Brev',
  legacy:      'Legacy Pakke'
};

exports.handler = async (event) => {
  // Kun POST tillatt
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // Sjekk at nødvendige miljøvariabler finnes
  const envCheck = {
    STRIPE_SECRET_KEY:        !!process.env.STRIPE_SECRET_KEY,
    SUPABASE_URL:             !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY:!!process.env.SUPABASE_SERVICE_ROLE_KEY,
    SIDE_URL:                 !!process.env.SIDE_URL
  };
  console.log('[create-stripe-session] Env check:', envCheck);

  const missingEnv = Object.entries(envCheck).filter(([,v]) => !v).map(([k]) => k);
  if (missingEnv.length > 0) {
    console.error('[create-stripe-session] Mangler miljøvariabler:', missingEnv);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Serverkonfigurasjon mangler: ${missingEnv.join(', ')}` })
    };
  }

  try {
    const data = JSON.parse(event.body || '{}');

    // ---- 1. Valider innkommende data ----
    const isTidskapsell = data.product_type === 'tidskapsell';
    const isFysisk      = data.product_type === 'fysisk';
    const required = ['customer_name','customer_email','recipient_type',
                      'delivery_type','product_type','delivery_date'];
    if (!isTidskapsell && !isFysisk) required.push('letter_content');
    for (const f of required) {
      if (!data[f]) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: `Mangler felt: ${f}` })
        };
      }
    }

    if (isTidskapsell && (!data.uploaded_files || data.uploaded_files.length === 0)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Tidskapsell krever minst én opplastet fil' })
      };
    }

    const gyldigeTyper = ['digitalt', 'fysisk', 'tidskapsell'];
    if (!gyldigeTyper.includes(data.product_type)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: `Ugyldig product_type: ${data.product_type}` })
      };
    }

    // Premium envelope add-on (kun fysisk)
    const premiumEnvelope = data.premium_envelope === true && data.product_type === 'fysisk';

    // Betalingsplan (A engang / B årlig) — samme beløpslogikk som frontend.
    const plan = getBetalingsplan(data.product_type, data.delivery_date, premiumEnvelope);
    const prisNok = plan.engang; // total ordreverdi (= det A trekker på én gang)

    // Årlig nedbetaling (B) tilbys kun når det finnes minst ett lagringsår å spre.
    // Sendes 'yearly' uten lagringsår, faller vi trygt tilbake til engang.
    const paymentPlan = (data.payment_plan === 'yearly' && plan.kanAarlig) ? 'yearly' : 'full';

    // Språk for mottaker-rettet kommunikasjon ('no' | 'en'), default 'no'
    const language = data.language === 'en' ? 'en' : 'no';

    // ---- 2. Opprett ordre i Supabase ----
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        customer_name:     data.customer_name,
        customer_email:    data.customer_email,
        recipient_type:    data.recipient_type,
        delivery_type:     data.delivery_type,
        recipient_name:    data.recipient_name    || null,
        recipient_email:   data.recipient_email   || null,
        recipient_address: data.recipient_address || null,
        recipient_zip:     data.recipient_zip     || null,
        recipient_city:    data.recipient_city    || null,
        delivery_date:     data.delivery_date,
        occasion:          data.occasion          || null,
        product_type:      data.product_type,
        premium_envelope:  premiumEnvelope,
        payment_plan:      paymentPlan,
        language:          language,
        amount:            prisNok,
        payment_status:    'pending',
        payment_method:    'stripe'
      })
      .select()
      .single();

    if (orderErr) {
      console.error('[create-stripe-session] Supabase insert feilet:', JSON.stringify(orderErr, null, 2));
      console.error('[create-stripe-session] Insert-data var:', JSON.stringify({
        product_type: data.product_type,
        delivery_type: data.delivery_type,
        delivery_date: data.delivery_date,
        has_uploaded_files: !!(data.uploaded_files && data.uploaded_files.length)
      }));
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Kunne ikke opprette ordre: ' + (orderErr.message || orderErr.code || 'ukjent databasefeil') })
      };
    }

    if (isTidskapsell) {
      // Store file metadata in tidskapsell_files
      const fileRows = (data.uploaded_files || []).map(f => ({
        order_id:  order.id,
        file_path: f.path,
        file_name: f.name,
        file_size: f.size,
        mime_type: f.type
      }));
      const { error: fileErr } = await supabase
        .from('tidskapsell_files')
        .insert(fileRows);

      if (fileErr) {
        console.error('[create-stripe-session] Tidskapsell files insert feilet:', fileErr);
        await supabase.from('orders').delete().eq('id', order.id);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Kunne ikke lagre filinformasjon' })
        };
      }

      // Store optional personal message in letters table
      const { error: letterErr } = await supabase
        .from('letters')
        .insert({
          order_id: order.id,
          letter_content: data.message_content || '',
          status: 'stored'
        });

      if (letterErr) {
        console.error('[create-stripe-session] Message insert feilet:', letterErr);
        await supabase.from('orders').delete().eq('id', order.id);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Kunne ikke lagre melding' })
        };
      }
    } else {
      // Store letter content for digitalt/fysisk
      const { error: letterErr } = await supabase
        .from('letters')
        .insert({
          order_id: order.id,
          letter_content: data.letter_content,
          status: 'stored'
        });

      if (letterErr) {
        console.error('[create-stripe-session] Letter insert feilet:', letterErr);
        await supabase.from('orders').delete().eq('id', order.id);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Kunne ikke lagre brev' })
        };
      }
    }

    // ---- 3. Opprett Stripe Checkout Session ----
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const produktTekst = `${PRODUKT_NAVN[data.product_type]} — ${data.delivery_type === 'fysisk' ? 'fysisk levering' : 'digital levering'}${premiumEnvelope ? ', inkl. premiumkonvolutt' : ''}`;
    const sideUrl = process.env.SIDE_URL || 'https://tidsbrev.no';

    // Felles metadata + URL-er for begge betalingsplaner
    const metadata = {
      order_id:      order.id,
      order_number:  order.order_number || '',
      product_type:  data.product_type,
      delivery_type: data.delivery_type,
      payment_plan:  paymentPlan
    };
    const sessionConfig = {
      payment_method_types: ['card'],
      locale: language === 'en' ? 'en' : 'nb',
      customer_email: data.customer_email,
      metadata,
      success_url: `${sideUrl}/takk.html?order=${order.order_number}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${sideUrl}/feil.html?reason=cancelled`
    };

    if (paymentPlan === 'yearly') {
      // ---- B) Årlig nedbetaling — Stripe Subscription (interval: year) ----
      // Første faktura = startpris (+ evt. konvolutt) som engangslinje + første
      // årssats. Deretter trekkes årssatsen automatisk hvert år. Abonnementet
      // avsluttes automatisk på leveringsdato (cancel_at settes i
      // stripe-webhook.js når abonnementet opprettes). Sum = plan.engang.
      sessionConfig.mode = 'subscription';
      sessionConfig.line_items = [
        {
          price_data: {
            currency: 'nok',
            unit_amount: plan.aarlig * 100,
            recurring: { interval: 'year' },
            product_data: {
              name: `${produktTekst} — årlig lagring`,
              description: `Årlig trekk frem til levering ${data.delivery_date}`
            }
          },
          quantity: 1
        },
        {
          price_data: {
            currency: 'nok',
            unit_amount: (plan.base + plan.konvolutt) * 100,
            product_data: {
              name: `${produktTekst} — startpris`,
              description: 'Engangsbeløp lagt på første trekk'
            }
          },
          quantity: 1
        }
      ];
      // order_id + leveringsdato følger abonnementet slik at webhooken kan
      // koble faktura-hendelser til riktig ordre og sette cancel_at.
      sessionConfig.subscription_data = {
        metadata: {
          order_id:      order.id,
          order_number:  order.order_number || '',
          delivery_date: data.delivery_date
        }
      };
    } else {
      // ---- A) Betal alt på én gang — engangsbetaling (uendret) ----
      sessionConfig.mode = 'payment';
      sessionConfig.line_items = [{
        price_data: {
          currency: 'nok',
          unit_amount: prisNok * 100, // Stripe bruker øre
          product_data: {
            name: produktTekst,
            description: `Tidsbrev leveres ${data.delivery_date}`
          }
        },
        quantity: 1
      }];
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    // Lagre session_id på ordren så webhooken kan matche på den
    await supabase
      .from('orders')
      .update({ stripe_session_id: session.id })
      .eq('id', order.id);

    // ---- 4. Returner URL til frontend ----
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: session.url,
        order_id: order.id,
        order_number: order.order_number
      })
    };

  } catch (err) {
    console.error('[create-stripe-session] Uventet feil:', err.message || err);
    console.error('[create-stripe-session] Stack:', err.stack || 'ingen stack');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || 'Ukjent serverfeil' })
    };
  }
};
