// ================================================================
// Tidsbrev.no — Netlify Function: verify-update-token
// ================================================================
// Brukes av oppdater.html for å verifisere en sikker oppdaterings-
// lenke FØR siden viser nåværende leveringsdetaljer.
//
// Sikkerhet:
//   • Validerer at order_number + update_token matcher én ordre.
//     Oppslaget gjøres med .eq('order_number', ...).eq('update_token', ...)
//     slik at ingen rad returneres med mindre BEGGE stemmer.
//   • Returnerer kun et minimalt, trygt sett av felter som trengs for å
//     vise skjemaet — aldri betalingsdata, brevinnhold eller andre ordrer.
//   • Krever POST (token sendes i body, ikke i URL/loggene).
//
// Forventer SQL-migreringen i send-email.js (update_token-kolonnen).
// Mangler kolonnen, returnerer oppslaget feil → behandles som ugyldig.
//
// Miljøvariabler:
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
// ================================================================

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { order, token } = JSON.parse(event.body || '{}');

    if (!order || !token) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Mangler ordrenummer eller token' }) };
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Hent ordren KUN hvis både ordrenummer og token matcher.
    const { data: row, error } = await supabase
      .from('orders')
      .select('product_type, delivery_type, recipient_type, delivery_date, recipient_name, recipient_email, recipient_address, recipient_zip, recipient_city, customer_email')
      .eq('order_number', order)
      .eq('update_token', token)
      .maybeSingle();

    if (error || !row) {
      // Generisk svar — ikke avslør om ordren finnes eller ikke.
      return { statusCode: 404, body: JSON.stringify({ error: 'Ugyldig eller utløpt lenke' }) };
    }

    const erFysisk = row.product_type === 'fysisk';
    const tilSegSelv = row.recipient_type === 'meg_selv';

    // Bygg et minimalt, trygt svar.
    const safe = {
      ok: true,
      product_type:   row.product_type,
      delivery_type:  row.delivery_type,
      recipient_type: row.recipient_type,
      delivery_date:  row.delivery_date
    };

    if (erFysisk) {
      // Fysisk → postadresse.
      safe.recipient_name    = row.recipient_name    || '';
      safe.recipient_address = row.recipient_address || '';
      safe.recipient_zip     = row.recipient_zip     || '';
      safe.recipient_city    = row.recipient_city    || '';
    } else {
      // Digitalt / tidskapsell → leverings-e-post.
      // meg_selv leveres til customer_email; andre til recipient_email.
      safe.delivery_email = tilSegSelv
        ? (row.customer_email || '')
        : (row.recipient_email || '');
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(safe)
    };

  } catch (err) {
    console.error('[verify-update-token]', err.message || err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Serverfeil' }) };
  }
};
