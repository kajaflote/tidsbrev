// ================================================================
// Tidsbrev.no — Netlify Function: Vipps webhook
// ================================================================
// Mottar callback fra Vipps ePayment API når en betaling er
// fullført, avbrutt eller utløpt.
//
// Miljøvariabler som må settes i Netlify:
//   VIPPS_CLIENT_ID
//   VIPPS_CLIENT_SECRET
//   VIPPS_SUBSCRIPTION_KEY
//   VIPPS_MSN                — Merchant Serial Number
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//
// Webhook URL (registreres hos Vipps):
//   https://tidsbrev.no/api/vipps-webhook
// ================================================================

// TODO: Implementer
// 1. Verifiser signatur (HMAC) fra Vipps
// 2. Slå opp transaksjonsstatus via Vipps API
// 3. Oppdater brev.betalt i Supabase
// 4. Send bekreftelses-e-post via Resend

exports.handler = async (event) => {
  try {
    // const payload = JSON.parse(event.body);
    // const ordreId = payload.reference;
    // const status = payload.state; // AUTHORIZED, CAPTURED, ABORTED, ...

    // const { createClient } = require('@supabase/supabase-js');
    // const supabase = createClient(
    //   process.env.SUPABASE_URL,
    //   process.env.SUPABASE_SERVICE_ROLE_KEY
    // );

    // if (status === 'AUTHORIZED' || status === 'CAPTURED') {
    //   await supabase
    //     .from('brev')
    //     .update({ betalt: true, betalt_tidspunkt: new Date().toISOString() })
    //     .eq('ordre_id', ordreId);
    // }

    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  } catch (err) {
    console.error('[vipps-webhook]', err);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }
};
