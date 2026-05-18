// ================================================================
// Tidsbrev.no — Netlify Function: Vipps webhook/callback
// ================================================================
// SLIK AKTIVERER DU VIPPS:
//   1) Lim inn client_id i miljøvariabelen VIPPS_CLIENT_ID
//   2) Lim inn client_secret i VIPPS_CLIENT_SECRET
//   3) Lim inn subscriptionKey i VIPPS_SUBSCRIPTION_KEY
//   4) Endre VIPPS_ACTIVE til true i js/config.js
// ================================================================
// Denne funksjonen mottar webhook-events fra Vipps når status på
// en betaling endrer seg (AUTHORIZED, CAPTURED, ABORTED, EXPIRED,
// TERMINATED). Vi oppdaterer da ordren i Supabase tilsvarende.
//
// Webhooken må registreres mot Vipps via deres webhook-API eller
// merchant-portalen:
//   https://tidsbrev.no/api/vipps-callback
//
// API-dokumentasjon:
//   https://developer.vippsmobilepay.com/docs/APIs/webhooks-api/
//
// Miljøvariabler:
//   VIPPS_CLIENT_ID
//   VIPPS_CLIENT_SECRET
//   VIPPS_SUBSCRIPTION_KEY
//   VIPPS_MSN
//   VIPPS_MILJO                 — "test" eller "production"
//   VIPPS_WEBHOOK_SECRET        — secret som ble returnert da du
//                                 registrerte webhooken
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
// ================================================================

const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const { sendEmail } = require('./send-email');

// ---- Verifiser HMAC-signatur fra Vipps ----
// Vipps signerer webhooks med HMAC-SHA256 over body, timestamp og path.
// Header: "X-Ms-Content-Sha256" + "Authorization: HMAC-SHA256 ..."
function verifyVippsSignature(event) {
  const secret = process.env.VIPPS_WEBHOOK_SECRET;
  if (!secret) {
    console.warn('[vipps-callback] VIPPS_WEBHOOK_SECRET ikke satt — hopper over verifisering');
    return true; // Ikke blokker i utvikling
  }

  const contentSha = event.headers['x-ms-content-sha256'];
  const dateHeader = event.headers['x-ms-date'];
  const auth = event.headers['authorization'];

  if (!contentSha || !dateHeader || !auth) {
    return false;
  }

  // Bygg string-to-sign: METHOD\npath\ndate;host;contentSha
  const host = event.headers['host'] || 'tidsbrev.no';
  const path = event.path || '/.netlify/functions/vipps-callback';
  const stringToSign = `POST\n${path}\n${dateHeader};${host};${contentSha}`;

  const expected = crypto
    .createHmac('sha256', Buffer.from(secret, 'base64'))
    .update(stringToSign, 'utf8')
    .digest('base64');

  return auth.includes(expected);
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    // ---- 1. Verifiser signatur ----
    if (!verifyVippsSignature(event)) {
      console.warn('[vipps-callback] Ugyldig signatur');
      return { statusCode: 401, body: 'Invalid signature' };
    }

    // ---- 2. Parse payload ----
    const body = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64').toString('utf8')
      : event.body;

    const payload = JSON.parse(body);
    const reference = payload.reference;     // vårt vipps_order_id
    const name = payload.name || '';         // event-navn: CREATED, AUTHORIZED, ...

    console.log(`[vipps-callback] Mottok event ${name} for ${reference}`);

    if (!reference) {
      return { statusCode: 400, body: 'Missing reference' };
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // ---- 3. Oppdater ordre-status basert på event ----
    let newStatus = null;
    let logAction = null;

    switch (name.toUpperCase()) {
      case 'AUTHORIZED':
      case 'CAPTURED':
        newStatus = 'paid';
        logAction = 'payment_completed';
        break;
      case 'ABORTED':
      case 'EXPIRED':
      case 'TERMINATED':
      case 'CANCELLED':
        newStatus = 'failed';
        logAction = 'payment_failed';
        break;
      default:
        console.log(`[vipps-callback] Ignorerer event ${name}`);
        return { statusCode: 200, body: JSON.stringify({ received: true }) };
    }

    const { data: order, error: fetchErr } = await supabase
      .from('orders')
      .select('id')
      .eq('vipps_order_id', reference)
      .single();

    if (fetchErr || !order) {
      console.error('[vipps-callback] Fant ikke ordre for referanse', reference);
      return { statusCode: 404, body: 'Order not found' };
    }

    const { error: updateErr } = await supabase
      .from('orders')
      .update({ payment_status: newStatus })
      .eq('id', order.id);

    if (updateErr) throw updateErr;

    // ---- 4. Logg i admin_log ----
    await supabase.from('admin_log').insert({
      action: logAction,
      order_id: order.id,
      note: `Vipps event: ${name} for reference ${reference}`
    });

    // ---- 5. Send e-post ved vellykket betaling ----
    if (newStatus === 'paid') {
      // Bekreftelses-e-post til kunden
      try {
        await sendEmail({ type: 'order_confirmation', order_id: order.id });
        console.log(`[vipps-callback] ✓ Bekreftelses-e-post sendt for ordre ${order.id}`);
      } catch (emailErr) {
        // La ikke e-postfeil stoppe webhook-responsen — ordren er betalt uansett
        console.error('[vipps-callback] Kunne ikke sende bekreftelse:', emailErr.message);
        await supabase.from('admin_log').insert({
          action: 'email_failed_order_confirmation',
          order_id: order.id,
          note: `Bekreftelse feilet (Vipps): ${emailErr.message}`
        });
      }

      // Intern varsel til admin
      try {
        await sendEmail({ type: 'admin_new_order', order_id: order.id });
        console.log(`[vipps-callback] ✓ Admin-varsel sendt for ordre ${order.id}`);
      } catch (emailErr) {
        console.error('[vipps-callback] Kunne ikke sende admin-varsel:', emailErr.message);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true })
    };

  } catch (err) {
    console.error('[vipps-callback]', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
