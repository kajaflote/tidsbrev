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

// --- Prismodell (må matche js/config.js) ---
// Modell: startpris + (år - 1) × årsavgift
const PRIS_DIGITALT_BASE      = 99;
const PRIS_DIGITALT_PER_AAR   = 19;
const PRIS_FYSISK_BASE        = 249;
const PRIS_FYSISK_PER_AAR     = 29;
const PRIS_TIDSKAPSELL_BASE   = 79;
const PRIS_TIDSKAPSELL_PER_AAR = 49;

// Legacy-tabell for bakoverkompatibilitet
const PRISER_LEGACY = {
  standard_digitalt: 349, standard_fysisk: 449,
  premium_digitalt:  599, premium_fysisk:  699,
  legacy_digitalt:  1299, legacy_fysisk:  1499
};

const PRODUKT_NAVN = {
  digitalt:    'Digitalt Brev',
  fysisk:      'Fysisk Brev i konvolutt',
  tidskapsell: 'Tidskapsell',
  standard:    'Standard Brev',
  premium:     'Premium Brev',
  legacy:      'Legacy Pakke'
};

/**
 * Beregn antall ekstra lagringsår fra i dag til leveringsdato.
 * Returnerer 0 for datoer under 1 år frem.
 */
function antallAar(leveringsdato) {
  if (!leveringsdato) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const levering = new Date(leveringsdato);
  const aar = Math.floor((levering - today) / (1000 * 60 * 60 * 24 * 365.25));
  return Math.max(0, aar);
}

/**
 * Beregn korrekt pris ut fra produkttype og dato.
 * Støtter ny modell (digitalt/fysisk/tidskapsell) og legacy (standard/premium/legacy).
 */
function beregnPris(produkttype, leveringsdato) {
  const aar = antallAar(leveringsdato);

  switch (produkttype) {
    case 'fysisk':
      return PRIS_FYSISK_BASE + aar * PRIS_FYSISK_PER_AAR;
    case 'tidskapsell':
      return PRIS_TIDSKAPSELL_BASE + aar * PRIS_TIDSKAPSELL_PER_AAR;
    case 'digitalt':
      return PRIS_DIGITALT_BASE + aar * PRIS_DIGITALT_PER_AAR;
    default:
      return null;
  }
}

exports.handler = async (event) => {
  // Kun POST tillatt
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const data = JSON.parse(event.body || '{}');

    // ---- 1. Valider innkommende data ----
    const required = ['customer_name','customer_email','recipient_type',
                      'delivery_type','product_type','delivery_date','letter_content'];
    for (const f of required) {
      if (!data[f]) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: `Mangler felt: ${f}` })
        };
      }
    }

    const gyldigeTyper = ['digitalt', 'fysisk', 'tidskapsell'];
    if (!gyldigeTyper.includes(data.product_type)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: `Ugyldig product_type: ${data.product_type}` })
      };
    }

    const prisNok = beregnPris(data.product_type, data.delivery_date);
    if (!prisNok) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Ugyldig produkt- eller leveringskombinasjon' })
      };
    }

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
        amount:            prisNok,
        payment_status:    'pending',
        payment_method:    'stripe'
      })
      .select()
      .single();

    if (orderErr) {
      console.error('[create-stripe-session] Supabase insert feilet:', orderErr);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Kunne ikke opprette ordre' })
      };
    }

    // Lagre brevinnholdet i letters-tabellen
    const { error: letterErr } = await supabase
      .from('letters')
      .insert({
        order_id: order.id,
        letter_content: data.letter_content,
        status: 'stored'
      });

    if (letterErr) {
      console.error('[create-stripe-session] Letter insert feilet:', letterErr);
      // Rull tilbake ordren så vi ikke sitter igjen med et foreldreløst kjøp
      await supabase.from('orders').delete().eq('id', order.id);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Kunne ikke lagre brev' })
      };
    }

    // ---- 3. Opprett Stripe Checkout Session ----
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const produktTekst = `${PRODUKT_NAVN[data.product_type]} — ${data.delivery_type === 'fysisk' ? 'fysisk levering' : 'digital levering'}`;
    const sideUrl = process.env.SIDE_URL || 'https://tidsbrev.no';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      locale: 'nb',
      customer_email: data.customer_email,
      line_items: [{
        price_data: {
          currency: 'nok',
          unit_amount: prisNok * 100, // Stripe bruker øre
          product_data: {
            name: produktTekst,
            description: `Tidsbrev leveres ${data.delivery_date}`
          }
        },
        quantity: 1
      }],
      metadata: {
        order_id:     order.id,
        order_number: order.order_number || '',
        product_type: data.product_type,
        delivery_type: data.delivery_type
      },
      success_url: `${sideUrl}/takk.html?order=${order.order_number}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${sideUrl}/feil.html?reason=cancelled`
    });

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
    console.error('[create-stripe-session]', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || 'Ukjent feil' })
    };
  }
};
