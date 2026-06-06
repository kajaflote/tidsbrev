// ================================================================
// Tidsbrev.no — Netlify Function: update-recipient
// ================================================================
// Mottar innsendingen fra oppdater.html og oppdaterer leverings-
// detaljene for ÉN ordre — kun etter at brukeren aktivt har sendt
// inn skjemaet.
//
// Sikkerhet (kritisk):
//   • Re-validerer at order_number + update_token matcher samme ordre
//     før noe som helst oppdateres. Ingen match → 401, ingen endring.
//   • Oppdaterer KUN leveringsfeltene som hører til ordretypen:
//       fysisk                 → recipient_name/address/zip/city
//       digitalt/tidskapsell, andre    → recipient_email
//       digitalt/tidskapsell, meg_selv → customer_email (kundens leverings-e-post)
//     Oppdateringsobjektet bygges på server-siden ut fra ordrens egen
//     type — klienten kan ikke injisere andre felter.
//   • Oppdaterer kun raden med matchende id. Eksponerer aldri andre
//     ordrer eller andre felter.
//   • Krever POST.
//
// Miljøvariabler:
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
// ================================================================

const { createClient } = require('@supabase/supabase-js');

function isValidEmail(s) {
  return typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

function clean(s) {
  return typeof s === 'string' ? s.trim() : '';
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const data = JSON.parse(event.body || '{}');
    const { order, token } = data;

    if (!order || !token) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Mangler ordrenummer eller token' }) };
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Re-valider: hent ordren KUN hvis ordrenummer + token matcher.
    const { data: row, error: lookupErr } = await supabase
      .from('orders')
      .select('id, order_number, product_type, recipient_type')
      .eq('order_number', order)
      .eq('update_token', token)
      .maybeSingle();

    if (lookupErr || !row) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Ugyldig eller utløpt lenke' }) };
    }

    const erFysisk = row.product_type === 'fysisk';
    const tilSegSelv = row.recipient_type === 'meg_selv';

    // Bygg oppdateringsobjektet på server-siden — kun tillatte felter.
    const update = {};

    if (erFysisk) {
      const navn    = clean(data.recipient_name);
      const adresse = clean(data.recipient_address);
      const zip     = clean(data.recipient_zip);
      const by      = clean(data.recipient_city);

      if (!navn || !adresse || !zip || !by) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Fyll inn navn, adresse, postnummer og poststed.' })
        };
      }
      update.recipient_name    = navn;
      update.recipient_address = adresse;
      update.recipient_zip     = zip;
      update.recipient_city    = by;
    } else {
      const epost = clean(data.delivery_email);
      if (!isValidEmail(epost)) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Oppgi en gyldig e-postadresse.' })
        };
      }
      // meg_selv leveres til customer_email; andre til recipient_email.
      if (tilSegSelv) {
        update.customer_email = epost;
      } else {
        update.recipient_email = epost;
      }
    }

    // Oppdater KUN denne ene ordren.
    const { error: updateErr } = await supabase
      .from('orders')
      .update(update)
      .eq('id', row.id);

    if (updateErr) {
      console.error('[update-recipient] Oppdatering feilet:', updateErr.message);
      return { statusCode: 500, body: JSON.stringify({ error: 'Kunne ikke lagre endringene' }) };
    }

    await supabase.from('admin_log').insert({
      action: 'recipient_updated',
      order_id: row.id,
      note: `Leveringsdetaljer oppdatert av kunde via sikker lenke (${Object.keys(update).join(', ')})`
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true })
    };

  } catch (err) {
    console.error('[update-recipient]', err.message || err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Serverfeil' }) };
  }
};
