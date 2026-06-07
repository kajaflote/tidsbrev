// ================================================================
// SQL-MIGRERING — kjør manuelt i Supabase SQL Editor:
//
//   ALTER TABLE orders ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'no' CHECK (language IN ('no','en'));
//
// language styrer språket i ALL mottaker-rettet kommunikasjon (e-post + viewer).
// Admin-varsler forblir alltid på norsk. Eksisterende rader → 'no' via DEFAULT.
// ================================================================

// ================================================================
// Tidsbrev.no — Netlify Function: Opprett Vipps ePayment
// ================================================================
// SLIK AKTIVERER DU VIPPS:
//   1) Lim inn client_id i miljøvariabelen VIPPS_CLIENT_ID
//   2) Lim inn client_secret i VIPPS_CLIENT_SECRET
//   3) Lim inn subscriptionKey i VIPPS_SUBSCRIPTION_KEY
//   4) Endre VIPPS_ACTIVE til true i js/config.js
// ================================================================
// Denne funksjonen:
//   1. Mottar bestillingsdata fra frontend
//   2. Lagrer ordren i Supabase med status 'pending'
//   3. Henter Vipps access token via client credentials
//   4. Oppretter en ePayment-betaling hos Vipps
//   5. Returnerer redirectUrl til frontend (enten Vipps-appen på
//      mobil eller Vipps på nett på desktop)
//
// API-dokumentasjon:
//   https://developer.vippsmobilepay.com/docs/APIs/epayment-api/
//
// Miljøvariabler som MÅ settes i Netlify når du aktiverer Vipps:
//
//   VIPPS_CLIENT_ID             — fra portal.vipps.no → Utvikler → API-nøkler
//   VIPPS_CLIENT_SECRET         — samme sted
//   VIPPS_SUBSCRIPTION_KEY      — "Ocp-Apim-Subscription-Key"
//   VIPPS_MSN                   — Merchant Serial Number (salgsstedet ditt)
//   VIPPS_MILJO                 — "test" eller "production"
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   SIDE_URL                    — https://tidsbrev.no
// ================================================================

const { createClient } = require('@supabase/supabase-js');

// --- Prismodell (må matche js/config.js) ---
// Modell: startpris + (år - 1) × årsavgift
const PRIS_DIGITALT_BASE      = 99;
const PRIS_DIGITALT_PER_AAR   = 19;
const PRIS_FYSISK_BASE        = 249;
const PRIS_FYSISK_PER_AAR     = 29;
const PRIS_TIDSKAPSELL_BASE   = 79;
const PRIS_TIDSKAPSELL_PER_AAR = 49;

const PRODUKT_NAVN = {
  digitalt:    'Digitalt Brev',
  fysisk:      'Fysisk Brev i konvolutt',
  tidskapsell: 'Tidskapsell'
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

// Vipps API-endepunkter
function vippsBaseUrl(miljo) {
  return miljo === 'production'
    ? 'https://api.vipps.no'
    : 'https://apitest.vipps.no';
}

// ---- Hent access token via client credentials ----
async function hentAccessToken(miljo) {
  const res = await fetch(`${vippsBaseUrl(miljo)}/accesstoken/get`, {
    method: 'POST',
    headers: {
      'client_id':     process.env.VIPPS_CLIENT_ID,
      'client_secret': process.env.VIPPS_CLIENT_SECRET,
      'Ocp-Apim-Subscription-Key': process.env.VIPPS_SUBSCRIPTION_KEY
    }
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Vipps accesstoken feilet: ${res.status} ${txt}`);
  }
  const data = await res.json();
  return data.access_token;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const data = JSON.parse(event.body || '{}');
    const miljo = process.env.VIPPS_MILJO || 'test';

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

    // Språk for mottaker-rettet kommunikasjon ('no' | 'en'), default 'no'
    const language = data.language === 'en' ? 'en' : 'no';

    // ---- 2. Lagre ordre i Supabase ----
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
        language:          language,
        amount:            prisNok,
        payment_status:    'pending',
        payment_method:    'vipps'
      })
      .select()
      .single();

    if (orderErr) {
      console.error('[create-vipps-payment] Supabase insert feilet:', orderErr);
      return { statusCode: 500, body: JSON.stringify({ error: 'Kunne ikke opprette ordre' }) };
    }

    const { error: letterErr } = await supabase.from('letters').insert({
      order_id: order.id,
      letter_content: data.letter_content,
      status: 'stored'
    });
    if (letterErr) {
      await supabase.from('orders').delete().eq('id', order.id);
      return { statusCode: 500, body: JSON.stringify({ error: 'Kunne ikke lagre brev' }) };
    }

    // ---- 3. Hent access token ----
    const accessToken = await hentAccessToken(miljo);

    // ---- 4. Opprett ePayment ----
    const sideUrl = process.env.SIDE_URL || 'https://tidsbrev.no';
    const vippsReference = `tidsbrev-${order.order_number || order.id}`.replace(/[^a-zA-Z0-9-]/g, '');

    const ePaymentBody = {
      amount: {
        currency: 'NOK',
        value: prisNok * 100 // Vipps bruker øre
      },
      paymentMethod: { type: 'WALLET' },
      customer: data.customer_phone
        ? { phoneNumber: data.customer_phone.replace(/\s+/g,'') }
        : undefined,
      reference: vippsReference,
      returnUrl: `${sideUrl}/takk.html?order=${order.order_number}`,
      userFlow: 'WEB_REDIRECT',
      paymentDescription: `Tidsbrev — ${data.product_type} ${data.delivery_type}`
    };

    const vippsRes = await fetch(`${vippsBaseUrl(miljo)}/epayment/v1/payments`, {
      method: 'POST',
      headers: {
        'Content-Type':               'application/json',
        'Authorization':              `Bearer ${accessToken}`,
        'Ocp-Apim-Subscription-Key':  process.env.VIPPS_SUBSCRIPTION_KEY,
        'Merchant-Serial-Number':     process.env.VIPPS_MSN,
        'Vipps-System-Name':          'tidsbrev-no',
        'Vipps-System-Version':       '1.0.0',
        'Vipps-System-Plugin-Name':   'custom-node',
        'Vipps-System-Plugin-Version':'1.0.0',
        'Idempotency-Key':            `${order.id}-${Date.now()}`
      },
      body: JSON.stringify(ePaymentBody)
    });

    if (!vippsRes.ok) {
      const txt = await vippsRes.text();
      console.error('[create-vipps-payment] Vipps API feilet:', vippsRes.status, txt);
      await supabase.from('orders').update({ payment_status: 'failed' }).eq('id', order.id);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Kunne ikke opprette Vipps-betaling' })
      };
    }

    const vippsData = await vippsRes.json();

    // Lagre vipps_order_id på ordren for senere matching
    await supabase
      .from('orders')
      .update({ vipps_order_id: vippsReference })
      .eq('id', order.id);

    // ---- 5. Returner redirectUrl til frontend ----
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        redirectUrl:   vippsData.redirectUrl,
        order_id:      order.id,
        order_number:  order.order_number
      })
    };

  } catch (err) {
    console.error('[create-vipps-payment]', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || 'Ukjent feil' })
    };
  }
};
