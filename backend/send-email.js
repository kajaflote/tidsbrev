// ================================================================
// Tidsbrev.no — Netlify Function: send-email
// ================================================================
// Én universell e-postsender som håndterer alle fire maltypene:
//
//   1. order_confirmation — sendes til kunde etter betaling
//   2. admin_new_order    — sendes til admin etter ny betaling
//   3. deliver_letter     — sendes til mottaker på leveringsdag
//   4. admin_reminder     — sendes til admin 30 dager før fysisk utsending
//
// Funksjonen kan kalles på to måter:
//   a) Som HTTP POST fra andre backend-funksjoner eller admin:
//        fetch('/api/send-email', {
//          method: 'POST',
//          body: JSON.stringify({ type: 'order_confirmation', order_id: '...' })
//        })
//   b) Som import fra andre Netlify Functions:
//        const { sendEmail } = require('./send-email');
//        await sendEmail({ type: 'order_confirmation', order_id });
//
// Miljøvariabler som MÅ settes i Netlify dashboard:
//
//   RESEND_API_KEY           — re_...  (https://resend.com/api-keys)
//   EPOST_AVSENDER           — "Tidsbrev.no <post@tidsbrev.no>"
//                              (må være verifisert domene i Resend)
//   ADMIN_EPOST              — din admin-e-post for interne varsler
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   BROWSERLESS_API_KEY          — for PDF generation (chrome.browserless.io)
//
// MERK: For å sende e-post fra @tidsbrev.no må domenet være
// verifisert hos Resend (DNS SPF + DKIM). Frem til da kan du bruke
// onboarding@resend.dev som avsender for testing.
// ================================================================

const { Resend } = require('resend');
const { createClient } = require('@supabase/supabase-js');
const templates = require('./email-templates');


// ================================================================
// Hovedfunksjon — kan kalles både via HTTP og som import
// ================================================================
async function sendEmail({ type, order_id, letter_id, orders }) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  const avsender = process.env.EPOST_AVSENDER || 'Tidsbrev.no <post@tidsbrev.no>';
  const adminEpost = process.env.ADMIN_EPOST || 'hei@tidsbrev.no';

  switch (type) {

    // ------------------------------------------------
    // 1. ORDREBEKREFTELSE TIL KUNDEN
    // ------------------------------------------------
    case 'order_confirmation': {
      if (!order_id) throw new Error('Mangler order_id');

      const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', order_id)
        .single();
      if (error || !order) throw new Error('Fant ikke ordre: ' + order_id);

      const mail = templates.orderConfirmation(order);
      const res = await resend.emails.send({
        from: avsender,
        to: order.customer_email,
        subject: mail.subject,
        html: mail.html,
        reply_to: 'hei@tidsbrev.no'
      });

      await supabase.from('admin_log').insert({
        action: 'email_sent_order_confirmation',
        order_id: order.id,
        note: `Bekreftelse sendt til ${order.customer_email}`
      });

      return { ok: true, result: res };
    }

    // ------------------------------------------------
    // 2. INTERN VARSEL TIL ADMIN
    // ------------------------------------------------
    case 'admin_new_order': {
      if (!order_id) throw new Error('Mangler order_id');

      const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', order_id)
        .single();
      if (error || !order) throw new Error('Fant ikke ordre: ' + order_id);

      const { data: letter } = await supabase
        .from('letters')
        .select('letter_content')
        .eq('order_id', order.id)
        .single();

      const mail = templates.adminNewOrder(order, letter ? letter.letter_content : '');
      const res = await resend.emails.send({
        from: avsender,
        to: adminEpost,
        subject: mail.subject,
        html: mail.html
      });

      return { ok: true, result: res };
    }

    // ------------------------------------------------
    // 3. SELVE BREVET — SENDES PÅ LEVERINGSDAG
    // ------------------------------------------------
    // New flow: generate token → build viewer URL → send branded HTML email
    case 'deliver_letter': {
      const crypto = require('crypto');
      const { deliverLetterHtml, deliverLetterText } = require('./email-templates');
      const sideUrl = process.env.SIDE_URL || 'https://tidsbrev.no';

      // 1. Fetch letter + order
      const { data: letter, error: letterErr } = await supabase
        .from('letters')
        .select('id, letter_content, design_theme, order_id, orders(*)')
        .eq('id', letter_id || '')
        .single();

      if (letterErr || !letter) {
        throw new Error(`Letter not found: ${letterErr?.message || 'no data'}`);
      }

      const order = letter.orders;

      // 2. Determine recipient email
      const toEmail = order.recipient_type === 'andre'
        ? order.recipient_email
        : order.customer_email;

      if (!toEmail) {
        throw new Error(`No recipient email for order ${order.id}`);
      }

      // 3. Generate secure token (32 bytes = 64 hex chars)
      const token = crypto.randomBytes(32).toString('hex');

      const { data: tokenRow, error: tokenErr } = await supabase
        .from('letter_tokens')
        .insert({
          letter_id:    letter.id,
          token,
          allow_reopen: true,
          expires_at:   null
        })
        .select()
        .single();

      if (tokenErr) {
        throw new Error(`Token insert failed: ${tokenErr.message}`);
      }

      // 4. Build viewer URL
      const viewerUrl = `${sideUrl}/brev-viewer.html?token=${token}`;

      // 5. Format names and date
      const recipientName = order.recipient_type === 'andre'
        ? (order.recipient_name || 'deg').split(' ')[0]
        : order.customer_name.split(' ')[0];
      const senderName    = order.customer_name;
      const deliveryDate  = new Date(order.delivery_date).toLocaleDateString('nb-NO', {
        day: 'numeric', month: 'long', year: 'numeric'
      });

      // 6. Generate PDF attachment (non-blocking — email sends even if this fails)
      const { generateLetterPdf } = require('./generate-letter-pdf');
      const pdfBase64 = await generateLetterPdf(order, letter.letter_content);
      const attachments = pdfBase64
        ? [{ filename: 'ditt-tidsbrev.pdf', content: pdfBase64 }]
        : undefined;
      if (pdfBase64) {
        console.log(`[send-email] PDF generated for letter ${letter.id}`);
      } else {
        console.warn(`[send-email] PDF generation returned null for letter ${letter.id} — sending without attachment`);
      }

      // 7. Send email via Resend
      const emailPayload = {
        from:    avsender,
        to:      toEmail,
        subject: `Ditt tidsbrev er ankommet`,
        html:    deliverLetterHtml({
                   recipientName, senderName, deliveryDate,
                   viewerUrl, letterContent: letter.letter_content
                 }),
        text:    deliverLetterText({
                   recipientName, senderName, deliveryDate,
                   viewerUrl, letterContent: letter.letter_content
                 }),
        reply_to: 'hei@tidsbrev.no'
      };
      if (attachments) {
        emailPayload.attachments = attachments;
      }
      const { error: emailErr } = await resend.emails.send(emailPayload);

      if (emailErr) {
        throw new Error(`Resend send failed: ${emailErr.message}`);
      }

      // 8. Mark letter as sent
      await supabase
        .from('letters')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', letter.id);

      await supabase.from('admin_log').insert({
        action: 'letter_delivered',
        order_id: order.id,
        note: `Digitalt brev sendt til ${toEmail} — viewer token opprettet`
      });

      console.log(`[send-email] Letter delivered to ${toEmail} — token created`);
      return { ok: true, viewerUrl, token: tokenRow.token };
    }

    // ------------------------------------------------
    // 4. TIDSKAPSEL-LEVERING PÅ LEVERINGSDAG
    // ------------------------------------------------
    case 'deliver_tidskapsell': {
      if (!order_id) throw new Error('Mangler order_id');

      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .select('*')
        .eq('id', order_id)
        .single();
      if (orderErr || !order) throw new Error('Fant ikke ordre: ' + order_id);

      // Get the personal message (stored in letters table)
      const { data: letter } = await supabase
        .from('letters')
        .select('id, letter_content, status')
        .eq('order_id', order_id)
        .single();

      if (letter && letter.status === 'sent') {
        console.log(`[send-email] Tidskapsel allerede sendt for ordre ${order_id}`);
        return { ok: true, skipped: true };
      }

      // Get file metadata
      const { data: files, error: filesErr } = await supabase
        .from('tidskapsell_files')
        .select('*')
        .eq('order_id', order_id);
      if (filesErr) throw new Error('Kunne ikke hente filer: ' + filesErr.message);

      // Generate signed URLs (30-day expiry)
      const fileLinks = [];
      for (const file of (files || [])) {
        const { data: signedData, error: signErr } = await supabase.storage
          .from('tidskapsell-uploads')
          .createSignedUrl(file.file_path, 60 * 60 * 24 * 30); // 30 days

        if (signErr) {
          console.error(`[send-email] Signed URL feilet for ${file.file_name}:`, signErr.message);
          continue;
        }
        fileLinks.push({
          name: file.file_name,
          url:  signedData.signedUrl,
          size: file.file_size,
          type: file.mime_type
        });
      }

      if (fileLinks.length === 0) {
        throw new Error('Ingen gyldige nedlastingslenker generert');
      }

      // Determine recipient email
      const toEmail = order.recipient_type === 'andre'
        ? order.recipient_email
        : order.customer_email;
      if (!toEmail) throw new Error(`Mangler mottaker-e-post for ordre ${order.id}`);

      const personalMessage = letter ? letter.letter_content : '';

      const mail = templates.deliverTidskapsell({
        order,
        files: fileLinks,
        personalMessage
      });

      // Generate PDF attachment (non-blocking — email sends even if this fails)
      const { generateCapsulePdf } = require('./generate-letter-pdf');
      const capsulePdf = await generateCapsulePdf(order, fileLinks, personalMessage);
      if (capsulePdf) {
        console.log(`[send-email] Capsule PDF generated for order ${order_id}`);
      } else {
        console.warn(`[send-email] Capsule PDF returned null for order ${order_id} — sending without attachment`);
      }

      const capsuleEmailPayload = {
        from:     avsender,
        to:       toEmail,
        subject:  mail.subject,
        html:     mail.html,
        reply_to: 'hei@tidsbrev.no'
      };
      if (capsulePdf) {
        capsuleEmailPayload.attachments = [{ filename: 'din-tidskapsel.pdf', content: capsulePdf }];
      }
      const res = await resend.emails.send(capsuleEmailPayload);

      // Mark as sent
      if (letter) {
        await supabase
          .from('letters')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', letter.id);
      }

      await supabase.from('admin_log').insert({
        action: 'capsule_delivered',
        order_id: order.id,
        note: `Tidskapsel levert til ${toEmail} — ${fileLinks.length} filer med 30-dagers signerte URL-er`
      });

      return { ok: true, result: res, filesDelivered: fileLinks.length };
    }

    // ------------------------------------------------
    // 5. AVSENDERPÅMINNELSE — 30 DAGER FØR LEVERING
    // ------------------------------------------------
    case 'sender_reminder': {
      if (!order_id) throw new Error('Mangler order_id');

      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .select('*')
        .eq('id', order_id)
        .single();
      if (orderErr || !order) throw new Error('Fant ikke ordre: ' + order_id);

      const mail = templates.senderReminder(order);
      const res = await resend.emails.send({
        from:     avsender,
        to:       order.customer_email,
        subject:  mail.subject,
        html:     mail.html,
        reply_to: 'hei@tidsbrev.no'
      });

      await supabase.from('admin_log').insert({
        action: 'sender_reminder_sent',
        order_id: order.id,
        note: `Avsenderpåminnelse sendt til ${order.customer_email} — 30 dager til levering`
      });

      return { ok: true, result: res };
    }

    // ------------------------------------------------
    // 6. PÅMINNELSE TIL ADMIN — 30 DAGER FØR FYSISKE BREV
    // ------------------------------------------------
    case 'admin_reminder': {
      // Hvis kaller har gitt orders direkte, bruk dem. Ellers hent.
      let ordrer = orders;
      if (!ordrer) {
        const today = new Date();
        const in30 = new Date();
        in30.setDate(today.getDate() + 30);

        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('delivery_type', 'fysisk')
          .eq('payment_status', 'paid')
          .gte('delivery_date', today.toISOString().split('T')[0])
          .lte('delivery_date', in30.toISOString().split('T')[0])
          .order('delivery_date', { ascending: true });
        if (error) throw error;
        ordrer = data || [];
      }

      if (ordrer.length === 0) {
        console.log('[send-email] Ingen fysiske brev innen 30 dager — ingen påminnelse sendt');
        return { ok: true, skipped: true, count: 0 };
      }

      const mail = templates.adminReminder(ordrer);
      const res = await resend.emails.send({
        from: avsender,
        to: adminEpost,
        subject: mail.subject,
        html: mail.html
      });

      return { ok: true, result: res, count: ordrer.length };
    }

    default:
      throw new Error('Ukjent e-posttype: ' + type);
  }
}


// ================================================================
// HTTP-wrapper (når funksjonen kalles som Netlify Function)
// ================================================================
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const result = await sendEmail(body);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    };
  } catch (err) {
    console.error('[send-email]', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || 'Ukjent feil' })
    };
  }
};

// Eksporter også som modul slik at andre backend-funksjoner kan
// importere sendEmail direkte (uten HTTP-kall).
exports.sendEmail = sendEmail;
