// ================================================================
// Tidsbrev.no — Netlify Scheduled Function: Daglig brevsending
// ================================================================
// Kjører automatisk hver dag kl 09:00 norsk tid (07:00 UTC).
//
// Tre oppgaver:
//   1. Finn alle DIGITALE brev med leveringsdato = i dag, betalt,
//      og ikke allerede sendt → send via Resend
//   2. Finn alle FYSISKE brev med leveringsdato innen 30 dager →
//      send påminnelse til admin
//   3. Logg alt i admin_log
//
// Miljøvariabler (settes i Netlify dashboard):
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   RESEND_API_KEY
//   EPOST_AVSENDER
//   ADMIN_EPOST
//
// Konfigurert i netlify.toml:
//   [functions."send-brev"]
//   schedule = "0 7 * * *"
// ================================================================

const { schedule } = require('@netlify/functions');
const { sendEmail } = require('./send-email');

async function dailyLetterJob() {
  const { createClient } = require('@supabase/supabase-js');

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const idag = new Date().toISOString().split('T')[0];
  console.log(`[send-brev] Daglig jobb startet — dato: ${idag}`);

  const resultater = {
    digitale_sendt: 0,
    digitale_feilet: 0,
    fysisk_paaminnelse: false,
    feil: []
  };

  // ================================================================
  // 1. SEND DIGITALE BREV SOM HAR LEVERINGSDATO I DAG
  // ================================================================
  try {
    const { data: ordrer, error } = await supabase
      .from('orders')
      .select('id, order_number')
      .eq('delivery_type', 'digitalt')
      .eq('payment_status', 'paid')
      .eq('delivery_date', idag);

    if (error) {
      console.error('[send-brev] Feil ved henting av digitale ordrer:', error);
      resultater.feil.push('Henting av digitale ordrer feilet: ' + error.message);
    } else if (ordrer && ordrer.length > 0) {
      console.log(`[send-brev] Fant ${ordrer.length} digitale brev å sende`);

      // Sjekk at brevet ikke allerede er sendt (status !== 'sent')
      for (const ordre of ordrer) {
        try {
          // Sjekk brevstatus først
          const { data: letter } = await supabase
            .from('letters')
            .select('id, status')
            .eq('order_id', ordre.id)
            .single();

          if (!letter) {
            console.warn(`[send-brev] Ingen lagret brev funnet for ordre ${ordre.order_number} — hopper over`);
            continue;
          }

          if (letter.status === 'sent') {
            console.log(`[send-brev] Brev for ordre ${ordre.order_number} er allerede sendt — hopper over`);
            continue;
          }

          await sendEmail({
            type:      'deliver_letter',
            order_id:  ordre.id,
            letter_id: letter.id
          });

          resultater.digitale_sendt++;
          console.log(`[send-brev] ✓ Sendt brev for ordre ${ordre.order_number}`);
        } catch (err) {
          resultater.digitale_feilet++;
          resultater.feil.push(`Ordre ${ordre.order_number}: ${err.message}`);
          console.error(`[send-brev] ✗ Feil ved sending for ordre ${ordre.order_number}:`, err.message);

          // Logg feilen i admin_log
          await supabase.from('admin_log').insert({
            action: 'letter_delivery_failed',
            order_id: ordre.id,
            note: `Automatisk brevsending feilet: ${err.message}`
          });
        }
      }
    } else {
      console.log('[send-brev] Ingen digitale brev å sende i dag');
    }
  } catch (err) {
    console.error('[send-brev] Uventet feil i digital brevsending:', err);
    resultater.feil.push('Digital brevsending krasjet: ' + err.message);
  }

  // ================================================================
  // 2. PÅMINNELSE TIL ADMIN OM FYSISKE BREV (kun når et brev treffer 30-dagersmerket)
  // ================================================================
  // Vi sender én påminnelse pr. brev, nøyaktig 30 dager før leveringsdato.
  // E-posten inneholder en samlet liste over ALLE fysiske brev innen 30 dager.
  // Slik unngår vi at admin drukner i daglige påminnelses-e-poster.
  try {
    const om30 = new Date();
    om30.setDate(om30.getDate() + 30);
    const om30str = om30.toISOString().split('T')[0];

    const { data: paaminnelseOrdrer } = await supabase
      .from('orders')
      .select('id')
      .eq('delivery_type', 'fysisk')
      .eq('payment_status', 'paid')
      .eq('delivery_date', om30str);   // Nøyaktig 30 dager frem — én e-post per brev

    if (paaminnelseOrdrer && paaminnelseOrdrer.length > 0) {
      await sendEmail({ type: 'admin_reminder' });
      resultater.fysisk_paaminnelse = true;
      console.log(`[send-brev] ✓ Admin-påminnelse sendt — ${paaminnelseOrdrer.length} brev treffer 30-dagersmerket`);
    } else {
      console.log('[send-brev] Ingen fysiske brev treffer 30-dagersmerket i dag — ingen påminnelse');
    }
  } catch (err) {
    console.error('[send-brev] Feil ved admin-påminnelse:', err.message);
    resultater.feil.push('Admin-påminnelse feilet: ' + err.message);
  }

  // ================================================================
  // 3. LOGG DAGLIG KJØRING
  // ================================================================
  await supabase.from('admin_log').insert({
    action: 'daily_job_completed',
    note: `Dato: ${idag} | Sendt: ${resultater.digitale_sendt} | Feilet: ${resultater.digitale_feilet} | Fysisk påminnelse: ${resultater.fysisk_paaminnelse}`
  });

  console.log('[send-brev] Daglig jobb fullført:', resultater);

  return {
    statusCode: 200,
    body: JSON.stringify(resultater)
  };
}

// Netlify Scheduled Function — kjører kl 07:00 UTC (09:00 norsk tid)
exports.handler = schedule('0 7 * * *', dailyLetterJob);
