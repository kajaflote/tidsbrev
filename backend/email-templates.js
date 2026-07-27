// ================================================================
// Tidsbrev.no — E-postmaler
// ================================================================
// Fire HTML-maler brukt av backend/send-email.js:
//   1. orderConfirmation — ordrebekreftelse til kunden
//   2. adminNewOrder     — intern varsel til admin
//   3. deliverLetter     — selve tidsbrevet, sendes på leveringsdag
//   4. adminReminder     — 30-dagers varsel før fysiske brev postes
//
// Stilen er satt med inline CSS (bruker <table>-layout) for
// maksimal e-postklient-kompatibilitet.
//
// Farger matcher merkevaren:
//   krem     #F5F0E8
//   burgunder #6B2737
//   skoggrønn #2D4A3E
//   gull     #B08A3E
// ================================================================

// ---- Hjelpefunksjoner ----

function formatDateNO(iso) {
  try {
    return new Date(iso).toLocaleDateString('nb-NO', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  } catch { return iso; }
}

function formatDateEN(iso) {
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  } catch { return iso; }
}

// Velg dato-formatter ut fra språk ('no' | 'en')
function formatDate(iso, lang) {
  return lang === 'en' ? formatDateEN(iso) : formatDateNO(iso);
}

function formatNOK(belop) {
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency', currency: 'NOK', maximumFractionDigits: 0
  }).format(belop);
}

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

// Konverterer linjeskift i brevtekst til <br>-tags (etter escaping)
function formatLetterBody(text) {
  return escapeHtml(text).replace(/\n/g, '<br/>');
}

const PRODUKT_NAVN = {
  digitalt:    'Digitalt Brev',
  fysisk:      'Fysisk Brev',
  tidskapsell: 'Tidskapsell',
  // Eldre produkter (bakoverkompatibelt)
  standard: 'Standard Brev',
  premium:  'Premium Brev',
  legacy:   'Legacy Pakke'
};

const PRODUKT_NAVN_EN = {
  digitalt:    'Digital Letter',
  fysisk:      'Physical Letter',
  tidskapsell: 'Time Capsule',
  standard: 'Standard Letter',
  premium:  'Premium Letter',
  legacy:   'Legacy Package'
};

// Produktnavn ut fra språk ('no' | 'en')
function produktNavn(type, lang) {
  const map = lang === 'en' ? PRODUKT_NAVN_EN : PRODUKT_NAVN;
  return map[type] || type;
}

const LEVERING_TEKST = {
  digitalt: 'Digital levering (e-post)',
  fysisk:   'Fysisk brev'
};

const ANLEDNING_TEKST = {
  meg_selv:     'Til meg selv',
  konfirmasjon: 'Konfirmasjon',
  bursdag:      'Bursdag',
  bryllup:      'Bryllup',
  nyfodt:       'Nyfødt barn',
  jubileum:     'Jubileum',
  bare_fordi:   'Bare fordi'
};

// ================================================================
// Felles wrapper — hode, bunn, fargepalett
// ================================================================
function baseLayout({ title, preheader, bodyHtml, lang = 'no' }) {
  const isEn = lang === 'en';
  const htmlLang = isEn ? 'en' : 'nb';
  const footerTagline = isEn
    ? 'Letters to the future, written today.'
    : 'Brev til fremtiden, skrevet i dag.';
  const footerLinks = isEn
    ? `<a href="https://tidsbrev.no/personvern.html" style="color:#B08A3E;text-decoration:underline;margin:0 8px;">Privacy</a>
              <a href="https://tidsbrev.no/vilkaar.html" style="color:#B08A3E;text-decoration:underline;margin:0 8px;">Terms</a>
              <a href="mailto:tidsbrev@outlook.com" style="color:#B08A3E;text-decoration:underline;margin:0 8px;">Contact</a>`
    : `<a href="https://tidsbrev.no/personvern.html" style="color:#B08A3E;text-decoration:underline;margin:0 8px;">Personvern</a>
              <a href="https://tidsbrev.no/vilkaar.html" style="color:#B08A3E;text-decoration:underline;margin:0 8px;">Vilkår</a>
              <a href="mailto:tidsbrev@outlook.com" style="color:#B08A3E;text-decoration:underline;margin:0 8px;">Kontakt</a>`;
  return `<!DOCTYPE html>
<html lang="${htmlLang}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:'Inter','Helvetica Neue',Arial,sans-serif;color:#2A231C;line-height:1.6;-webkit-font-smoothing:antialiased;">

<!-- Preheader (skjult forhåndsvisningstekst) -->
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader || '')}</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F5F0E8;">
  <tr>
    <td align="center" style="padding:40px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#FBF6EC;border-radius:16px;border:1px solid #E8DCC4;overflow:hidden;box-shadow:0 20px 60px rgba(42,35,28,.08);">

        <!-- Topp -->
        <tr>
          <td align="center" style="padding:36px 32px 14px;background:#FBF6EC;">
            <div style="font-family:Georgia,'Playfair Display',serif;font-size:1.6rem;font-weight:700;color:#6B2737;letter-spacing:.4px;">
              Tidsbrev<span style="color:#2D4A3E;">.no</span>
            </div>
            <div style="height:2px;width:56px;background:#B08A3E;margin:14px auto 0;"></div>
          </td>
        </tr>

        <!-- Innhold -->
        <tr>
          <td style="padding:20px 36px 40px;">
            ${bodyHtml}
          </td>
        </tr>

        <!-- Bunn -->
        <tr>
          <td align="center" style="padding:26px 32px;background:#4E141C;color:rgba(245,240,232,.85);font-size:12px;">
            <div style="font-family:Georgia,serif;color:#F5F0E8;font-size:14px;font-weight:600;margin-bottom:8px;">Tidsbrev.no</div>
            <div style="margin-bottom:6px;">${footerTagline}</div>
            <div>
              ${footerLinks}
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

</body>
</html>`;
}


// ================================================================
// 1) ORDREBEKREFTELSE TIL KUNDEN
// ================================================================
// English variant of orderConfirmation — Norwegian original left untouched below.
function orderConfirmationEN(order) {
  const produkt = PRODUKT_NAVN_EN[order.product_type] || order.product_type;
  const levering = order.delivery_type === 'fysisk' ? 'Physical letter' : 'Digital delivery (email)';
  const mottakerTekst = order.recipient_type === 'meg_selv'
    ? 'To yourself'
    : (order.recipient_name || 'To someone else');

  const isFysisk = order.delivery_type === 'fysisk';

  const premiumKonvoluttRad = (isFysisk && order.premium_envelope) ? `
          <tr>
            <td style="color:#6B5D4C;">Premium envelope</td>
            <td style="color:#2A231C;">Yes (+79 kr)</td>
          </tr>` : '';

  const body = `
    <p style="font-family:Georgia,'Caveat',cursive;font-size:20px;color:#6B2737;margin:0 0 6px;font-style:italic;">~ thank you ~</p>
    <h1 style="font-family:Georgia,serif;font-size:28px;color:#2A231C;margin:0 0 18px;line-height:1.2;">Your letter is safe with us</h1>

    <p style="margin:0 0 16px;color:#6B5D4C;font-size:16px;">
      Dear ${escapeHtml(order.customer_name || 'you')},
    </p>

    <p style="margin:0 0 22px;color:#2A231C;font-size:16px;">
      We have received and stored your letter. The moment you pressed "send",
      your words were sealed in time — and we will keep them safe until the day
      they are to be delivered.
    </p>

    <!-- Order details -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
      style="background:#F5F0E8;border:1px solid #E8DCC4;border-radius:12px;margin:24px 0;">
      <tr><td style="padding:20px 24px;">
        <div style="font-family:Georgia,serif;color:#6B2737;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Your order</div>

        <table role="presentation" width="100%" cellpadding="6" cellspacing="0" border="0" style="font-size:14px;">
          <tr>
            <td style="color:#6B5D4C;width:40%;">Order number</td>
            <td style="color:#2A231C;font-weight:600;">${escapeHtml(order.order_number || '')}</td>
          </tr>
          <tr>
            <td style="color:#6B5D4C;">Product</td>
            <td style="color:#2A231C;">${escapeHtml(produkt)}</td>
          </tr>
          <tr>
            <td style="color:#6B5D4C;">Delivery method</td>
            <td style="color:#2A231C;">${escapeHtml(levering)}</td>
          </tr>${premiumKonvoluttRad}
          <tr>
            <td style="color:#6B5D4C;">Recipient</td>
            <td style="color:#2A231C;">${escapeHtml(mottakerTekst)}</td>
          </tr>
          <tr>
            <td style="color:#6B5D4C;">Delivery date</td>
            <td style="color:#6B2737;font-weight:700;font-family:Georgia,serif;font-size:16px;">${escapeHtml(formatDateEN(order.delivery_date))}</td>
          </tr>
          <tr>
            <td style="color:#6B5D4C;">Amount paid</td>
            <td style="color:#2A231C;">${escapeHtml(formatNOK(order.amount))}</td>
          </tr>
        </table>
      </td></tr>
    </table>
${isFysisk ? `
    <!-- Send your letter to us -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
      style="background:#F5F0E8;border:1px solid #E8DCC4;border-radius:12px;margin:0 0 24px;">
      <tr><td style="padding:20px 24px;">
        <div style="font-family:Georgia,serif;color:#6B2737;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Send your letter to us</div>
        <p style="margin:0 0 14px;color:#2A231C;font-size:14px;line-height:1.6;">
          So that we can keep your letter safe, please send it physically to us at the following address:
        </p>
        <div style="background:#fffdf7;border:1px dashed #c9b9a0;border-radius:8px;padding:16px 20px;margin:0 0 14px;font-family:Georgia,serif;font-size:15px;line-height:1.7;color:#2A231C;">
          Tidsbrev<br/>
          Fr&oslash;yasvei 19a<br/>
          1412 Sofiemyr<br/>
          Norway
        </div>
        <p style="margin:0 0 6px;color:#2A231C;font-size:14px;line-height:1.6;">
          Mark the envelope with your order number: <strong style="color:#6B2737;">${escapeHtml(order.order_number || '')}</strong>
        </p>
        <p style="margin:0;color:#6B5D4C;font-size:13px;font-style:italic;">
          We will confirm receipt by email as soon as your letter arrives.
        </p>
      </td></tr>
    </table>

    <!-- What happens next? -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
      style="background:#F5F0E8;border:1px solid #E8DCC4;border-radius:12px;margin:0 0 24px;">
      <tr><td style="padding:20px 24px;">
        <div style="font-family:Georgia,serif;color:#6B2737;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">What happens next?</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:14px;line-height:1.6;">
          <tr><td style="color:#2A231C;padding:6px 0;">&#10022; We will send you a confirmation when your letter has reached us</td></tr>
          <tr><td style="color:#2A231C;padding:6px 0;">&#10022; 30 days before the delivery date we will email you so you can update the delivery address if needed</td></tr>
          <tr><td style="color:#2A231C;padding:6px 0;">&#10022; On the delivery date we will send the letter to the given address</td></tr>
        </table>
      </td></tr>
    </table>
` : `
    <p style="margin:22px 0 10px;color:#2A231C;font-size:16px;">
      From today until ${escapeHtml(formatDateEN(order.delivery_date))} we will keep
      your letter encrypted and safe in our archive. You don't need to do
      anything — we'll take care of the rest.
    </p>
`}
    <p style="margin:0 0 26px;color:#2A231C;font-size:16px;font-style:italic;font-family:Georgia,serif;">
      We look forward to delivering this moment to the future.
    </p>

    <p style="margin:0;color:#6B5D4C;font-size:14px;">
      Warm regards,<br/>
      <span style="font-family:Georgia,'Caveat',cursive;color:#6B2737;font-size:18px;font-style:italic;">The Tidsbrev team</span>
    </p>
  `;

  return {
    subject: `Your letter is safe with us — order ${order.order_number}`,
    html: baseLayout({
      title: 'Order confirmation',
      preheader: `Your letter will be delivered ${formatDateEN(order.delivery_date)}.`,
      bodyHtml: body,
      lang: 'en'
    })
  };
}

function orderConfirmation(order, lang = 'no') {
  if (lang === 'en') return orderConfirmationEN(order);

  const produkt = PRODUKT_NAVN[order.product_type] || order.product_type;
  const levering = LEVERING_TEKST[order.delivery_type] || order.delivery_type;
  const mottakerTekst = order.recipient_type === 'meg_selv'
    ? 'Til deg selv'
    : (order.recipient_name || 'Til en annen');

  const isFysisk = order.delivery_type === 'fysisk';

  // Premium envelope row — only for fysisk orders with premium_envelope
  const premiumKonvoluttRad = (isFysisk && order.premium_envelope) ? `
          <tr>
            <td style="color:#6B5D4C;">Premiumkonvolutt</td>
            <td style="color:#2A231C;">Ja (+79 kr)</td>
          </tr>` : '';

  const body = `
    <p style="font-family:Georgia,'Caveat',cursive;font-size:20px;color:#6B2737;margin:0 0 6px;font-style:italic;">~ takk skal du ha ~</p>
    <h1 style="font-family:Georgia,serif;font-size:28px;color:#2A231C;margin:0 0 18px;line-height:1.2;">Brevet ditt er trygt hos oss</h1>

    <p style="margin:0 0 16px;color:#6B5D4C;font-size:16px;">
      Kjære ${escapeHtml(order.customer_name || 'du')},
    </p>

    <p style="margin:0 0 22px;color:#2A231C;font-size:16px;">
      Vi har mottatt og lagret brevet ditt. I det øyeblikket du trykket "send",
      ble ordene dine forseglet i tid — og vi passer på dem til dagen de skal
      leveres.
    </p>

    <!-- Ordredetaljer -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
      style="background:#F5F0E8;border:1px solid #E8DCC4;border-radius:12px;margin:24px 0;">
      <tr><td style="padding:20px 24px;">
        <div style="font-family:Georgia,serif;color:#6B2737;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Din ordre</div>

        <table role="presentation" width="100%" cellpadding="6" cellspacing="0" border="0" style="font-size:14px;">
          <tr>
            <td style="color:#6B5D4C;width:40%;">Ordrenummer</td>
            <td style="color:#2A231C;font-weight:600;">${escapeHtml(order.order_number || '')}</td>
          </tr>
          <tr>
            <td style="color:#6B5D4C;">Produkt</td>
            <td style="color:#2A231C;">${escapeHtml(produkt)}</td>
          </tr>
          <tr>
            <td style="color:#6B5D4C;">Leveringsform</td>
            <td style="color:#2A231C;">${escapeHtml(levering)}</td>
          </tr>${premiumKonvoluttRad}
          <tr>
            <td style="color:#6B5D4C;">Mottaker</td>
            <td style="color:#2A231C;">${escapeHtml(mottakerTekst)}</td>
          </tr>
          <tr>
            <td style="color:#6B5D4C;">Leveringsdato</td>
            <td style="color:#6B2737;font-weight:700;font-family:Georgia,serif;font-size:16px;">${escapeHtml(formatDateNO(order.delivery_date))}</td>
          </tr>
          <tr>
            <td style="color:#6B5D4C;">Beløp betalt</td>
            <td style="color:#2A231C;">${escapeHtml(formatNOK(order.amount))}</td>
          </tr>
        </table>
      </td></tr>
    </table>
${isFysisk ? `
    <!-- Send brevet ditt til oss -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
      style="background:#F5F0E8;border:1px solid #E8DCC4;border-radius:12px;margin:0 0 24px;">
      <tr><td style="padding:20px 24px;">
        <div style="font-family:Georgia,serif;color:#6B2737;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Send brevet ditt til oss</div>
        <p style="margin:0 0 14px;color:#2A231C;font-size:14px;line-height:1.6;">
          For at vi skal kunne ta vare p&aring; brevet ditt, m&aring; du sende det fysisk til oss p&aring; f&oslash;lgende adresse:
        </p>
        <div style="background:#fffdf7;border:1px dashed #c9b9a0;border-radius:8px;padding:16px 20px;margin:0 0 14px;font-family:Georgia,serif;font-size:15px;line-height:1.7;color:#2A231C;">
          Tidsbrev<br/>
          Fr&oslash;yasvei 19a<br/>
          1412 Sofiemyr<br/>
          Norge
        </div>
        <p style="margin:0 0 6px;color:#2A231C;font-size:14px;line-height:1.6;">
          Merk konvolutten med ordrenummeret ditt: <strong style="color:#6B2737;">${escapeHtml(order.order_number || '')}</strong>
        </p>
        <p style="margin:0;color:#6B5D4C;font-size:13px;font-style:italic;">
          Vi bekrefter mottak p&aring; e-post s&aring; snart brevet er ankommet.
        </p>
      </td></tr>
    </table>

    <!-- Hva skjer videre? -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
      style="background:#F5F0E8;border:1px solid #E8DCC4;border-radius:12px;margin:0 0 24px;">
      <tr><td style="padding:20px 24px;">
        <div style="font-family:Georgia,serif;color:#6B2737;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Hva skjer videre?</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:14px;line-height:1.6;">
          <tr><td style="color:#2A231C;padding:6px 0;">&#10022; Vi sender deg en bekreftelse n&aring;r brevet er mottatt hos oss</td></tr>
          <tr><td style="color:#2A231C;padding:6px 0;">&#10022; 30 dager f&oslash;r leveringsdato sender vi deg en e-post hvor du kan oppdatere leveringsadressen om n&oslash;dvendig</td></tr>
          <tr><td style="color:#2A231C;padding:6px 0;">&#10022; P&aring; leveringsdatoen sender vi brevet til oppgitt adresse</td></tr>
        </table>
      </td></tr>
    </table>
` : `
    <p style="margin:22px 0 10px;color:#2A231C;font-size:16px;">
      Fra i dag og frem til ${escapeHtml(formatDateNO(order.delivery_date))} holder
      vi brevet ditt kryptert og trygt i v&aring;rt arkiv. Du trenger ikke &aring; gj&oslash;re
      noe — vi tar oss av resten.
    </p>
`}
    <p style="margin:0 0 26px;color:#2A231C;font-size:16px;font-style:italic;font-family:Georgia,serif;">
      Vi gleder oss til å levere dette øyeblikket til fremtiden.
    </p>

    <p style="margin:0;color:#6B5D4C;font-size:14px;">
      Varme hilsener,<br/>
      <span style="font-family:Georgia,'Caveat',cursive;color:#6B2737;font-size:18px;font-style:italic;">Teamet bak Tidsbrev</span>
    </p>
  `;

  return {
    subject: `Brevet ditt er trygt hos oss — ordre ${order.order_number}`,
    html: baseLayout({
      title: 'Ordrebekreftelse',
      preheader: `Brevet ditt leveres ${formatDateNO(order.delivery_date)}.`,
      bodyHtml: body
    })
  };
}


// ================================================================
// 2) INTERN VARSEL TIL ADMIN
// ================================================================
function adminNewOrder(order, letterContent) {
  const produkt = PRODUKT_NAVN[order.product_type] || order.product_type;
  const levering = LEVERING_TEKST[order.delivery_type] || order.delivery_type;
  const anledning = ANLEDNING_TEKST[order.occasion] || order.occasion || '—';

  const adresseBlokk = order.delivery_type === 'fysisk' ? `
    <tr><td style="color:#6B5D4C;">Leveringsadresse</td>
        <td style="color:#2A231C;">
          ${escapeHtml(order.recipient_name || '')}<br/>
          ${escapeHtml(order.recipient_address || '')}<br/>
          ${escapeHtml(order.recipient_zip || '')} ${escapeHtml(order.recipient_city || '')}
        </td></tr>
  ` : '';

  const body = `
    <h1 style="font-family:Georgia,serif;font-size:22px;color:#2A231C;margin:0 0 8px;">Ny ordre mottatt</h1>
    <p style="margin:0 0 18px;color:#6B5D4C;font-size:14px;">
      En ny bestilling har kommet inn. Detaljene er listet nedenfor.
    </p>

    <!-- Oversikt -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
      style="background:#F5F0E8;border:1px solid #E8DCC4;border-radius:10px;margin:12px 0 24px;">
      <tr><td style="padding:18px 22px;">
        <table role="presentation" width="100%" cellpadding="5" cellspacing="0" border="0" style="font-size:13px;">
          <tr>
            <td style="color:#6B5D4C;width:40%;">Ordrenummer</td>
            <td style="color:#6B2737;font-weight:700;">${escapeHtml(order.order_number || '')}</td>
          </tr>
          <tr><td style="color:#6B5D4C;">Opprettet</td>
              <td style="color:#2A231C;">${escapeHtml(formatDateNO(order.created_at))}</td></tr>
          <tr><td style="color:#6B5D4C;">Produkt</td>
              <td style="color:#2A231C;">${escapeHtml(produkt)} — ${escapeHtml(levering)}</td></tr>
          <tr><td style="color:#6B5D4C;">Leveringsdato</td>
              <td style="color:#2A231C;"><strong>${escapeHtml(formatDateNO(order.delivery_date))}</strong></td></tr>
          <tr><td style="color:#6B5D4C;">Anledning</td>
              <td style="color:#2A231C;">${escapeHtml(anledning)}</td></tr>
          <tr><td colspan="2" style="padding-top:12px;"><hr style="border:none;border-top:1px dashed #c9b9a0;margin:0;"/></td></tr>
          <tr><td style="color:#6B5D4C;">Avsender</td>
              <td style="color:#2A231C;">${escapeHtml(order.customer_name || '')}</td></tr>
          <tr><td style="color:#6B5D4C;">E-post (avsender)</td>
              <td style="color:#2A231C;">${escapeHtml(order.customer_email || '')}</td></tr>
          <tr><td style="color:#6B5D4C;">Mottakertype</td>
              <td style="color:#2A231C;">${escapeHtml(order.recipient_type === 'meg_selv' ? 'Til seg selv' : 'Til en annen')}</td></tr>
          ${order.recipient_name ? `<tr><td style="color:#6B5D4C;">Mottakers navn</td><td style="color:#2A231C;">${escapeHtml(order.recipient_name)}</td></tr>` : ''}
          ${order.recipient_email ? `<tr><td style="color:#6B5D4C;">Mottakers e-post</td><td style="color:#2A231C;">${escapeHtml(order.recipient_email)}</td></tr>` : ''}
          ${adresseBlokk}
          <tr><td colspan="2" style="padding-top:12px;"><hr style="border:none;border-top:1px dashed #c9b9a0;margin:0;"/></td></tr>
          <tr><td style="color:#6B5D4C;">Betalingsmetode</td>
              <td style="color:#2A231C;">${escapeHtml((order.payment_method || '').toUpperCase())}</td></tr>
          <tr><td style="color:#6B5D4C;">Beløp</td>
              <td style="color:#2A231C;font-weight:700;">${escapeHtml(formatNOK(order.amount))}</td></tr>
          <tr><td style="color:#6B5D4C;">Status</td>
              <td style="color:#2D4A3E;font-weight:600;">${escapeHtml(order.payment_status || 'pending')}</td></tr>
        </table>
      </td></tr>
    </table>

    <!-- Brevinnhold -->
    <div style="font-family:Georgia,serif;color:#6B2737;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin:10px 0;">Brevinnhold</div>
    <div style="background:#fffdf7;border:1px solid #E8DCC4;border-radius:10px;padding:20px 24px;font-family:Georgia,serif;font-size:15px;line-height:1.7;color:#2A231C;white-space:pre-wrap;">
      ${formatLetterBody(letterContent || '(tomt)')}
    </div>
  `;

  return {
    subject: `[Tidsbrev] Ny ordre ${order.order_number} — ${formatNOK(order.amount)}`,
    html: baseLayout({
      title: 'Ny ordre',
      preheader: `Ny bestilling fra ${order.customer_name} — ${produkt}`,
      bodyHtml: body
    })
  };
}


// ================================================================
// 3) SELVE BREVET — leveres på leveringsdagen
// ================================================================
// Designet skal ligne et ekte brev på varmt papir.
function deliverLetter(order, letterContent) {
  const avsenderNavn = order.customer_name || 'en som er glad i deg';
  const skrevetDato  = formatDateNO(order.created_at);
  const mottakerHilsen = order.recipient_name
    ? order.recipient_name.split(' ')[0]
    : 'deg';

  // Her bruker vi en mer spesiell layout enn baseLayout —
  // papiret skal være i fokus.
  return {
    subject: `Et brev fra ${avsenderNavn} — skrevet ${skrevetDato}`,
    html: `<!DOCTYPE html>
<html lang="nb">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Et tidsbrev til deg</title>
</head>
<body style="margin:0;padding:0;background:#4E141C;font-family:Georgia,'Playfair Display',serif;color:#2A231C;line-height:1.75;-webkit-font-smoothing:antialiased;">

<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Et brev skrevet til deg ${escapeHtml(skrevetDato)} — nå har tiden kommet.</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#4E141C;">
  <tr>
    <td align="center" style="padding:50px 16px;">

      <!-- "Brevet har kommet frem"-introduksjon -->
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;margin-bottom:30px;">
        <tr>
          <td align="center" style="color:#F5F0E8;font-family:Georgia,serif;">
            <div style="font-family:Georgia,'Caveat',cursive;font-size:22px;color:#B08A3E;font-style:italic;margin-bottom:10px;">~ et tidsbrev har ankommet ~</div>
            <div style="font-size:14px;color:rgba(245,240,232,.75);letter-spacing:.5px;">Tidsbrev.no</div>
          </td>
        </tr>
      </table>

      <!-- Selve brevpapiret -->
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
        style="max-width:600px;width:100%;background:#FBF6EC;background-image:linear-gradient(to bottom,#FBF6EC,#F5EEDB);border:1px solid #d9c9a8;border-radius:4px;box-shadow:0 40px 80px rgba(0,0,0,.4), 0 0 0 1px rgba(107,39,55,.05);">
        <tr>
          <td style="padding:56px 56px 20px;">
            <div style="font-family:Georgia,'Caveat',cursive;font-style:italic;color:#6B2737;font-size:15px;margin-bottom:8px;">
              Skrevet ${escapeHtml(skrevetDato)}
            </div>
            <div style="height:1px;background:linear-gradient(to right,#B08A3E,transparent);margin-bottom:28px;"></div>

            <p style="margin:0 0 24px;color:#2A231C;font-size:15px;font-style:italic;font-family:Georgia,serif;">
              Dette brevet ble skrevet til deg av <strong style="color:#6B2737;">${escapeHtml(avsenderNavn)}</strong>
              den <strong style="color:#6B2737;">${escapeHtml(skrevetDato)}</strong>.
              I dag, endelig, finner det veien til deg.
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:0 56px 56px;">
            <!-- Brevteksten -->
            <div style="font-family:Georgia,'Playfair Display',serif;font-size:17px;line-height:1.9;color:#2A231C;white-space:pre-wrap;">
              ${formatLetterBody(letterContent || '')}
            </div>

            <div style="height:1px;background:linear-gradient(to right,transparent,#B08A3E,transparent);margin:40px 0 20px;"></div>

            <div style="text-align:right;font-family:Georgia,'Caveat',cursive;font-style:italic;color:#6B2737;font-size:20px;">
              — ${escapeHtml(avsenderNavn)}
            </div>
          </td>
        </tr>
      </table>

      <!-- Bunntekst -->
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;margin-top:30px;">
        <tr>
          <td align="center" style="color:rgba(245,240,232,.65);font-family:'Inter',Arial,sans-serif;font-size:12px;padding:0 20px;">
            <p style="margin:0 0 8px;">Dette brevet ble lagret hos Tidsbrev.no og levert automatisk på den valgte datoen.</p>
            <p style="margin:0;">
              <a href="https://tidsbrev.no" style="color:#B08A3E;text-decoration:underline;">tidsbrev.no</a>
              &nbsp;·&nbsp;
              <a href="mailto:tidsbrev@outlook.com" style="color:#B08A3E;text-decoration:underline;">tidsbrev@outlook.com</a>
            </p>
          </td>
        </tr>
      </table>

    </td>
  </tr>
</table>

</body>
</html>`
  };
}


// ================================================================
// 4) PÅMINNELSE TIL ADMIN — 30 dager før fysiske brev skal postes
// ================================================================
function adminReminder(orders) {
  const rader = orders.map(o => `
    <tr style="border-top:1px solid #E8DCC4;">
      <td style="padding:14px 18px;font-size:13px;color:#6B2737;font-weight:700;vertical-align:top;">
        ${escapeHtml(o.order_number || '')}
      </td>
      <td style="padding:14px 18px;font-size:13px;color:#2A231C;vertical-align:top;">
        ${escapeHtml(o.recipient_name || '')}<br/>
        ${escapeHtml(o.recipient_address || '')}<br/>
        ${escapeHtml(o.recipient_zip || '')} ${escapeHtml(o.recipient_city || '')}
      </td>
      <td style="padding:14px 18px;font-size:13px;color:#2D4A3E;font-weight:600;vertical-align:top;white-space:nowrap;">
        ${escapeHtml(formatDateNO(o.delivery_date))}
      </td>
    </tr>
  `).join('');

  const body = `
    <h1 style="font-family:Georgia,serif;font-size:22px;color:#2A231C;margin:0 0 8px;">Fysiske brev som må postes snart</h1>
    <p style="margin:0 0 22px;color:#6B5D4C;font-size:14px;">
      Følgende ${orders.length} fysiske brev har leveringsdato innen de neste 30 dagene
      og må skrives ut, legges i konvolutt og postes i tide.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
      style="background:#F5F0E8;border:1px solid #E8DCC4;border-radius:10px;overflow:hidden;">
      <tr style="background:#2D4A3E;">
        <td style="padding:12px 18px;color:#F5F0E8;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Ordre</td>
        <td style="padding:12px 18px;color:#F5F0E8;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Mottaker & adresse</td>
        <td style="padding:12px 18px;color:#F5F0E8;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Leveres</td>
      </tr>
      ${rader || '<tr><td colspan="3" style="padding:20px;text-align:center;color:#6B5D4C;">Ingen brev i denne perioden.</td></tr>'}
    </table>

    <p style="margin:24px 0 0;color:#6B5D4C;font-size:13px;">
      Logg inn på <a href="https://tidsbrev.no/admin.html" style="color:#6B2737;">admin-dashbordet</a> for full oversikt og brevinnhold.
    </p>
  `;

  return {
    subject: `[Tidsbrev] ${orders.length} fysiske brev skal postes innen 30 dager`,
    html: baseLayout({
      title: 'Påminnelse — fysiske brev',
      preheader: `${orders.length} fysiske brev må postes innen 30 dager.`,
      bodyHtml: body
    })
  };
}


// ================================================================
// 5) BRANDED HTML EMAIL — digital letter delivery with viewer URL
// ================================================================
function deliverLetterHtml({ recipientName, senderName, deliveryDate, viewerUrl, lang = 'no' }) {
  const isEn = lang === 'en';
  const previewText = isEn
    ? 'A time-capsule letter has arrived. Open it when you are ready.'
    : 'Et tidskapselbrev har nådd frem. Åpne det når du er klar.';
  const htmlLang   = isEn ? 'en' : 'nb';
  const docTitle   = isEn ? 'A letter is waiting for you' : 'Et brev venter på deg';
  const subtitle   = isEn ? '~ a letter to the future ~' : '~ et brev til fremtiden ~';
  const heading    = isEn ? 'A letter has arrived' : 'Et brev har kommet frem';
  const intro      = isEn
    ? `${escapeHtml(senderName)} wrote a letter to you — and now the day is finally here. Press the button below to read it.`
    : `${escapeHtml(senderName)} skrev et brev til deg — og nå er dagen endelig her. Trykk på knappen under for å lese det.`;
  const cta        = isEn ? 'Open your letter &rarr;' : 'Åpne brevet &rarr;';
  const reassure   = isEn
    ? 'This link is personal and meant only for you.'
    : 'Lenken er personlig og kun ment for deg.';
  const footerLine = isEn
    ? `Delivered by <a href="https://tidsbrev.no" style="color:#6b2737;">Tidsbrev.no</a> — letters to the future, written today.`
    : `Levert av <a href="https://tidsbrev.no" style="color:#6b2737;">Tidsbrev.no</a> — brev til fremtiden, skrevet i dag.`;
  const footerLinks = isEn
    ? `<a href="https://tidsbrev.no/personvern.html" style="color:#6b5d4c;">Privacy</a>
            &nbsp;&middot;&nbsp;
            <a href="mailto:tidsbrev@outlook.com" style="color:#6b5d4c;">Contact</a>`
    : `<a href="https://tidsbrev.no/personvern.html" style="color:#6b5d4c;">Personvern</a>
            &nbsp;&middot;&nbsp;
            <a href="mailto:tidsbrev@outlook.com" style="color:#6b5d4c;">Kontakt</a>`;

  return `<!DOCTYPE html>
<html lang="${htmlLang}">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${docTitle}</title>
</head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:Arial,Helvetica,sans-serif;">
  <!-- Preheader (hidden preview text) -->
  <div style="display:none;max-height:0;overflow:hidden;">${previewText}</div>

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="text-align:center;padding-bottom:32px;">
          <p style="font-family:Georgia,serif;font-size:1.4rem;font-weight:700;color:#6b2737;margin:0;letter-spacing:.3px;">Tidsbrev</p>
          <p style="color:#6b5d4c;font-size:.88rem;margin:4px 0 0;">${subtitle}</p>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#fffdf7;border-radius:12px;padding:48px 44px;box-shadow:0 4px 20px rgba(42,35,28,.08);">

          <!-- Envelope icon -->
          <p style="text-align:center;margin:0 0 24px;">
            <span style="display:inline-block;width:64px;height:64px;background:#6b2737;border-radius:50%;line-height:64px;text-align:center;font-size:28px;">&#9993;</span>
          </p>

          <!-- Heading -->
          <h1 style="font-family:Georgia,serif;font-size:1.8rem;color:#2a231c;text-align:center;margin:0 0 12px;line-height:1.25;">
            ${heading}
          </h1>
          <p style="text-align:center;color:#6b5d4c;font-size:1rem;margin:0 0 32px;line-height:1.6;">
            ${intro}
          </p>

          <!-- CTA button -->
          <p style="text-align:center;margin:0 0 36px;">
            <a href="${escapeHtml(viewerUrl)}"
               style="display:inline-block;background:#6b2737;color:#f5f0e8;text-decoration:none;padding:16px 40px;border-radius:50px;font-family:Arial,sans-serif;font-size:1rem;font-weight:600;letter-spacing:.3px;">
              ${cta}
            </a>
          </p>

          <!-- Reassurance -->
          <p style="text-align:center;color:#6b5d4c;font-size:.85rem;margin:0;line-height:1.5;">
            ${reassure}
          </p>

        </td></tr>

        <!-- Footer -->
        <tr><td style="text-align:center;padding:28px 0 0;">
          <p style="color:#6b5d4c;font-size:.8rem;margin:0 0 8px;">
            ${footerLine}
          </p>
          <p style="color:#6b5d4c;font-size:.75rem;margin:0;">
            ${footerLinks}
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}


// ================================================================
// 6) PLAIN TEXT EMAIL — digital letter delivery fallback
// ================================================================
function deliverLetterText({ recipientName, senderName, deliveryDate, viewerUrl, lang = 'no' }) {
  if (lang === 'en') {
    return `Hi ${recipientName},

${senderName} wrote a letter to you — and now the day is finally here.

Open your letter here:
${viewerUrl}

This link is personal and meant only for you.

---

Delivered by Tidsbrev.no — letters to the future, written today.
https://tidsbrev.no
`;
  }

  return `Hei ${recipientName},

${senderName} skrev et brev til deg — og nå er dagen endelig her.

Åpne brevet her:
${viewerUrl}

Lenken er personlig og kun ment for deg.

---

Levert av Tidsbrev.no — brev til fremtiden, skrevet i dag.
https://tidsbrev.no
`;
}


// ================================================================
// 7) TIDSKAPSEL-LEVERING — sendes til mottaker på leveringsdag
// ================================================================
// English variant of deliverTidskapsell — Norwegian original left untouched below.
function deliverTidskapsellEN({ order, files, personalMessage }) {
  const avsenderNavn = order.customer_name || 'someone who cares about you';
  const mottakerNavn = order.recipient_type === 'andre'
    ? (order.recipient_name || 'you').split(' ')[0]
    : order.customer_name.split(' ')[0];
  const skrevetDato = formatDateEN(order.created_at);

  const audioFiles = files.filter(f => f.type && f.type.startsWith('audio/'));
  const mediaFiles = files.filter(f => !(f.type && f.type.startsWith('audio/')));

  const filListe = mediaFiles.map(f => {
    const isVideo = f.type && f.type.startsWith('video/');
    const icon = isVideo ? '&#9654;' : '&#128247;';
    const sizeMB = (f.size / (1024 * 1024)).toFixed(1);
    return `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #E8DCC4;">
          <span style="font-size:18px;margin-right:8px;">${icon}</span>
          <a href="${escapeHtml(f.url)}" style="color:#6B2737;font-weight:600;text-decoration:underline;font-size:14px;">
            ${escapeHtml(f.name)}
          </a>
          <span style="color:#6B5D4C;font-size:12px;margin-left:8px;">(${sizeMB} MB)</span>
        </td>
      </tr>`;
  }).join('');

  const mediaTabell = mediaFiles.length ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
      style="background:#F5F0E8;border:1px solid #E8DCC4;border-radius:12px;margin:24px 0;overflow:hidden;">
      <tr>
        <td style="padding:14px 16px;background:#2D4A3E;color:#F5F0E8;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:700;">
          Your files — download within 30 days
        </td>
      </tr>
      ${filListe}
    </table>` : '';

  const taleListe = audioFiles.map((f, i) => {
    const sizeMB = (f.size / (1024 * 1024)).toFixed(1);
    const navn = (f.name && !/^tale-/i.test(f.name)) ? f.name : `Voice recording ${i + 1}`;
    return `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #E8DCC4;">
          <span style="font-size:18px;margin-right:8px;">&#127897;</span>
          <a href="${escapeHtml(f.url)}" style="color:#6B2737;font-weight:600;text-decoration:underline;font-size:14px;">
            ${escapeHtml(navn)}
          </a>
          <span style="color:#6B5D4C;font-size:12px;margin-left:8px;">(${sizeMB} MB)</span>
        </td>
      </tr>`;
  }).join('');

  const taleSeksjon = audioFiles.length ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
      style="background:#F5F0E8;border:1px solid #E8DCC4;border-radius:12px;margin:24px 0;overflow:hidden;">
      <tr>
        <td style="padding:14px 16px;background:#2D4A3E;color:#F5F0E8;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:700;">
          Voice recordings
        </td>
      </tr>
      <tr>
        <td style="padding:10px 16px 4px;color:#6B5D4C;font-size:12px;font-style:italic;border-bottom:1px solid #E8DCC4;">
          Click to listen or download.
        </td>
      </tr>
      ${taleListe}
    </table>` : '';

  const meldingsBlokk = personalMessage && personalMessage.trim() ? `
    <div style="margin:28px 0 0;">
      <div style="font-family:Georgia,serif;color:#6B2737;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Personal message</div>
      <div style="background:#fffdf7;border:1px solid #E8DCC4;border-radius:10px;padding:20px 24px;font-family:Georgia,serif;font-size:15px;line-height:1.7;color:#2A231C;font-style:italic;">
        ${formatLetterBody(personalMessage)}
      </div>
    </div>` : '';

  const body = `
    <p style="font-family:Georgia,'Caveat',cursive;font-size:20px;color:#6B2737;margin:0 0 6px;font-style:italic;">~ your time capsule has arrived ~</p>
    <h1 style="font-family:Georgia,serif;font-size:26px;color:#2A231C;margin:0 0 18px;line-height:1.2;">Memories from the past have found you</h1>

    <p style="margin:0 0 16px;color:#2A231C;font-size:16px;">
      Dear ${escapeHtml(mottakerNavn)},
    </p>

    <p style="margin:0 0 22px;color:#2A231C;font-size:16px;">
      <strong style="color:#6B2737;">${escapeHtml(avsenderNavn)}</strong> stored this time capsule
      on ${escapeHtml(skrevetDato)} — and now the day is finally here. Below you will find
      ${files.length === 1 ? 'the file' : `all ${files.length} files`} that were attached.
    </p>

    <!-- Files -->
    ${mediaTabell}
    ${taleSeksjon}

    <p style="margin:0 0 8px;color:#6B5D4C;font-size:13px;font-style:italic;">
      The links expire in 30 days. Download the files you wish to keep.
    </p>

    ${meldingsBlokk}

    <p style="margin:28px 0 0;color:#6B5D4C;font-size:14px;">
      Warm regards,<br/>
      <span style="font-family:Georgia,'Caveat',cursive;color:#6B2737;font-size:18px;font-style:italic;">The Tidsbrev team</span>
    </p>
  `;

  return {
    subject: 'Your time capsule has arrived',
    html: baseLayout({
      title: 'Your time capsule has arrived',
      preheader: `${avsenderNavn} stored a time capsule for you — now it's here.`,
      bodyHtml: body,
      lang: 'en'
    })
  };
}

function deliverTidskapsell({ order, files, personalMessage, lang = 'no' }) {
  if (lang === 'en') return deliverTidskapsellEN({ order, files, personalMessage });

  const avsenderNavn = order.customer_name || 'en som er glad i deg';
  const mottakerNavn = order.recipient_type === 'andre'
    ? (order.recipient_name || 'deg').split(' ')[0]
    : order.customer_name.split(' ')[0];
  const skrevetDato = formatDateNO(order.created_at);

  const audioFiles = files.filter(f => f.type && f.type.startsWith('audio/'));
  const mediaFiles = files.filter(f => !(f.type && f.type.startsWith('audio/')));

  const filListe = mediaFiles.map(f => {
    const isVideo = f.type && f.type.startsWith('video/');
    const icon = isVideo ? '&#9654;' : '&#128247;';
    const sizeMB = (f.size / (1024 * 1024)).toFixed(1);
    return `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #E8DCC4;">
          <span style="font-size:18px;margin-right:8px;">${icon}</span>
          <a href="${escapeHtml(f.url)}" style="color:#6B2737;font-weight:600;text-decoration:underline;font-size:14px;">
            ${escapeHtml(f.name)}
          </a>
          <span style="color:#6B5D4C;font-size:12px;margin-left:8px;">(${sizeMB} MB)</span>
        </td>
      </tr>`;
  }).join('');

  const mediaTabell = mediaFiles.length ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
      style="background:#F5F0E8;border:1px solid #E8DCC4;border-radius:12px;margin:24px 0;overflow:hidden;">
      <tr>
        <td style="padding:14px 16px;background:#2D4A3E;color:#F5F0E8;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:700;">
          Dine filer — last ned innen 30 dager
        </td>
      </tr>
      ${filListe}
    </table>` : '';

  const taleListe = audioFiles.map((f, i) => {
    const sizeMB = (f.size / (1024 * 1024)).toFixed(1);
    const navn = (f.name && !/^tale-/i.test(f.name)) ? f.name : `Taleopptak ${i + 1}`;
    return `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #E8DCC4;">
          <span style="font-size:18px;margin-right:8px;">&#127897;</span>
          <a href="${escapeHtml(f.url)}" style="color:#6B2737;font-weight:600;text-decoration:underline;font-size:14px;">
            ${escapeHtml(navn)}
          </a>
          <span style="color:#6B5D4C;font-size:12px;margin-left:8px;">(${sizeMB} MB)</span>
        </td>
      </tr>`;
  }).join('');

  const taleSeksjon = audioFiles.length ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
      style="background:#F5F0E8;border:1px solid #E8DCC4;border-radius:12px;margin:24px 0;overflow:hidden;">
      <tr>
        <td style="padding:14px 16px;background:#2D4A3E;color:#F5F0E8;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:700;">
          Taleopptak
        </td>
      </tr>
      <tr>
        <td style="padding:10px 16px 4px;color:#6B5D4C;font-size:12px;font-style:italic;border-bottom:1px solid #E8DCC4;">
          Klikk for å lytte eller laste ned.
        </td>
      </tr>
      ${taleListe}
    </table>` : '';

  const meldingsBlokk = personalMessage && personalMessage.trim() ? `
    <div style="margin:28px 0 0;">
      <div style="font-family:Georgia,serif;color:#6B2737;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Personlig hilsen</div>
      <div style="background:#fffdf7;border:1px solid #E8DCC4;border-radius:10px;padding:20px 24px;font-family:Georgia,serif;font-size:15px;line-height:1.7;color:#2A231C;font-style:italic;">
        ${formatLetterBody(personalMessage)}
      </div>
    </div>` : '';

  const body = `
    <p style="font-family:Georgia,'Caveat',cursive;font-size:20px;color:#6B2737;margin:0 0 6px;font-style:italic;">~ din tidskapsel er ankommet ~</p>
    <h1 style="font-family:Georgia,serif;font-size:26px;color:#2A231C;margin:0 0 18px;line-height:1.2;">Minner fra fortiden har funnet deg</h1>

    <p style="margin:0 0 16px;color:#2A231C;font-size:16px;">
      Kjære ${escapeHtml(mottakerNavn)},
    </p>

    <p style="margin:0 0 22px;color:#2A231C;font-size:16px;">
      <strong style="color:#6B2737;">${escapeHtml(avsenderNavn)}</strong> lagret denne tidskapselen
      den ${escapeHtml(skrevetDato)} — og nå er dagen endelig her. Nedenfor finner du
      ${files.length === 1 ? 'filen' : `alle ${files.length} filene`} som ble lagt ved.
    </p>

    <!-- Filer -->
    ${mediaTabell}
    ${taleSeksjon}

    <p style="margin:0 0 8px;color:#6B5D4C;font-size:13px;font-style:italic;">
      Lenkene utløper om 30 dager. Last ned filene du vil beholde.
    </p>

    ${meldingsBlokk}

    <p style="margin:28px 0 0;color:#6B5D4C;font-size:14px;">
      Varme hilsener,<br/>
      <span style="font-family:Georgia,'Caveat',cursive;color:#6B2737;font-size:18px;font-style:italic;">Teamet bak Tidsbrev</span>
    </p>
  `;

  return {
    subject: 'Din tidskapsel er ankommet',
    html: baseLayout({
      title: 'Din tidskapsel er ankommet',
      preheader: `${avsenderNavn} lagret en tidskapsel til deg — nå er den her.`,
      bodyHtml: body
    })
  };
}


// ================================================================
// 8) AVSENDERPÅMINNELSE — 30 dager før levering
// ================================================================
// English variant of senderReminder — Norwegian original left untouched below.
function senderReminderEN(order) {
  const produktNavn = PRODUKT_NAVN_EN[order.product_type] || order.product_type;
  const leveringsDato = formatDateEN(order.delivery_date);
  const mottakerTekst = order.recipient_type === 'meg_selv'
    ? 'yourself'
    : (order.recipient_name || 'the recipient');

  const body = `
    <p style="font-family:Georgia,'Caveat',cursive;font-size:20px;color:#6B2737;margin:0 0 6px;font-style:italic;">~ a reminder ~</p>
    <h1 style="font-family:Georgia,serif;font-size:26px;color:#2A231C;margin:0 0 18px;line-height:1.2;">Your letter will be delivered soon</h1>

    <p style="margin:0 0 16px;color:#2A231C;font-size:16px;">
      Dear ${escapeHtml(order.customer_name || 'you')},
    </p>

    <p style="margin:0 0 22px;color:#2A231C;font-size:16px;">
      In 30 days — on <strong style="color:#6B2737;">${escapeHtml(leveringsDato)}</strong> —
      we will deliver your <strong>${escapeHtml(produktNavn)}</strong> to ${escapeHtml(mottakerTekst)}.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
      style="background:#F5F0E8;border:1px solid #E8DCC4;border-radius:12px;margin:24px 0;">
      <tr><td style="padding:20px 24px;">
        <table role="presentation" width="100%" cellpadding="6" cellspacing="0" border="0" style="font-size:14px;">
          <tr>
            <td style="color:#6B5D4C;width:40%;">Order number</td>
            <td style="color:#2A231C;font-weight:600;">${escapeHtml(order.order_number || '')}</td>
          </tr>
          <tr>
            <td style="color:#6B5D4C;">Delivery date</td>
            <td style="color:#6B2737;font-weight:700;font-family:Georgia,serif;">${escapeHtml(leveringsDato)}</td>
          </tr>
          <tr>
            <td style="color:#6B5D4C;">Product</td>
            <td style="color:#2A231C;">${escapeHtml(produktNavn)}</td>
          </tr>
        </table>
      </td></tr>
    </table>

    <p style="margin:0 0 22px;color:#2A231C;font-size:16px;">
      You don't need to do anything — we'll take care of everything. Just wait for the magical day.
    </p>

    <p style="margin:0;color:#6B5D4C;font-size:14px;">
      Warm regards,<br/>
      <span style="font-family:Georgia,'Caveat',cursive;color:#6B2737;font-size:18px;font-style:italic;">The Tidsbrev team</span>
    </p>
  `;

  return {
    subject: `Reminder: your letter will be delivered ${leveringsDato}`,
    html: baseLayout({
      title: 'Your letter will be delivered soon',
      preheader: `In 30 days we will deliver your letter to ${mottakerTekst}.`,
      bodyHtml: body,
      lang: 'en'
    })
  };
}

function senderReminder(order, lang = 'no') {
  if (lang === 'en') return senderReminderEN(order);

  const produktNavn = PRODUKT_NAVN[order.product_type] || order.product_type;
  const leveringsDato = formatDateNO(order.delivery_date);
  const mottakerTekst = order.recipient_type === 'meg_selv'
    ? 'deg selv'
    : (order.recipient_name || 'mottakeren');

  const body = `
    <p style="font-family:Georgia,'Caveat',cursive;font-size:20px;color:#6B2737;margin:0 0 6px;font-style:italic;">~ en påminnelse ~</p>
    <h1 style="font-family:Georgia,serif;font-size:26px;color:#2A231C;margin:0 0 18px;line-height:1.2;">Snart leveres brevet ditt</h1>

    <p style="margin:0 0 16px;color:#2A231C;font-size:16px;">
      Kjære ${escapeHtml(order.customer_name || 'du')},
    </p>

    <p style="margin:0 0 22px;color:#2A231C;font-size:16px;">
      Om 30 dager — den <strong style="color:#6B2737;">${escapeHtml(leveringsDato)}</strong> —
      leverer vi din <strong>${escapeHtml(produktNavn)}</strong> til ${escapeHtml(mottakerTekst)}.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
      style="background:#F5F0E8;border:1px solid #E8DCC4;border-radius:12px;margin:24px 0;">
      <tr><td style="padding:20px 24px;">
        <table role="presentation" width="100%" cellpadding="6" cellspacing="0" border="0" style="font-size:14px;">
          <tr>
            <td style="color:#6B5D4C;width:40%;">Ordrenummer</td>
            <td style="color:#2A231C;font-weight:600;">${escapeHtml(order.order_number || '')}</td>
          </tr>
          <tr>
            <td style="color:#6B5D4C;">Leveringsdato</td>
            <td style="color:#6B2737;font-weight:700;font-family:Georgia,serif;">${escapeHtml(leveringsDato)}</td>
          </tr>
          <tr>
            <td style="color:#6B5D4C;">Produkt</td>
            <td style="color:#2A231C;">${escapeHtml(produktNavn)}</td>
          </tr>
        </table>
      </td></tr>
    </table>

    <p style="margin:0 0 22px;color:#2A231C;font-size:16px;">
      Du trenger ikke gjøre noe — vi tar oss av alt. Bare vent på den magiske dagen.
    </p>

    <p style="margin:0;color:#6B5D4C;font-size:14px;">
      Med varme hilsener,<br/>
      <span style="font-family:Georgia,'Caveat',cursive;color:#6B2737;font-size:18px;font-style:italic;">Teamet bak Tidsbrev</span>
    </p>
  `;

  return {
    subject: `Påminnelse: Brevet ditt leveres ${leveringsDato}`,
    html: baseLayout({
      title: 'Snart leveres brevet ditt',
      preheader: `Om 30 dager leverer vi brevet ditt til ${mottakerTekst}.`,
      bodyHtml: body
    })
  };
}


// ================================================================
// 9) BEKREFT/OPPDATER LEVERINGSDETALJER — 30 dager før levering
// ================================================================
// Sendes til kunden ~30 dager før leveringsdato. Lar kunden bekrefte
// eller oppdatere leveringsdetaljene via en sikker lenke som kun
// inneholder ordrenummer + update_token (ingen persondata i URL-en).
//
//   digitalt / tidskapsell → bekreft/oppdater mottakers E-POST
//   fysisk                 → bekreft/oppdater mottakers POSTADRESSE
//
// E-posten går alltid til kunden (customer_email). Er mottakeren en
// annen ('andre'), ber vi kunden bekrefte mottakerens detaljer.
// English variant of recipientConfirm — Norwegian original left untouched below.
// Note: the update link still points to the existing oppdater.html page,
// which remains in Norwegian (out of scope for this change).
function recipientConfirmEN(order) {
  const sideUrl = process.env.SIDE_URL || 'https://tidsbrev.no';
  const produktNavn = PRODUKT_NAVN_EN[order.product_type] || order.product_type;
  const leveringsDato = formatDateEN(order.delivery_date);
  const erFysisk = order.product_type === 'fysisk';
  const tilSegSelv = order.recipient_type === 'meg_selv';

  const oppdaterUrl =
    `${sideUrl}/oppdater.html?order=${encodeURIComponent(order.order_number || '')}` +
    `&token=${encodeURIComponent(order.update_token || '')}`;

  let detaljerHtml;
  if (erFysisk) {
    const navnLinje = order.recipient_name ? `${escapeHtml(order.recipient_name)}<br/>` : '';
    const adresseLinje = order.recipient_address ? `${escapeHtml(order.recipient_address)}<br/>` : '';
    const stedLinje = `${escapeHtml(order.recipient_zip || '')} ${escapeHtml(order.recipient_city || '')}`.trim();
    detaljerHtml = `
        <div style="font-family:Georgia,serif;color:#6B2737;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Current delivery address</div>
        <div style="background:#fffdf7;border:1px dashed #c9b9a0;border-radius:8px;padding:16px 20px;font-family:Georgia,serif;font-size:15px;line-height:1.7;color:#2A231C;">
          ${navnLinje}${adresseLinje}${stedLinje || '<span style="color:#6B5D4C;font-style:italic;">(no address registered)</span>'}
        </div>`;
  } else {
    const leveringsEpost = tilSegSelv
      ? (order.customer_email || '')
      : (order.recipient_email || '');
    detaljerHtml = `
        <div style="font-family:Georgia,serif;color:#6B2737;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Current delivery email</div>
        <div style="background:#fffdf7;border:1px dashed #c9b9a0;border-radius:8px;padding:16px 20px;font-family:Georgia,serif;font-size:15px;line-height:1.7;color:#2A231C;">
          ${escapeHtml(leveringsEpost) || '<span style="color:#6B5D4C;font-style:italic;">(no email registered)</span>'}
        </div>`;
  }

  const mottakerSetning = tilSegSelv
    ? `we will deliver your <strong>${escapeHtml(produktNavn)}</strong> to you.`
    : `we will deliver your <strong>${escapeHtml(produktNavn)}</strong> to ${escapeHtml(order.recipient_name || 'the recipient')}.`;

  const oppdaterTekst = erFysisk
    ? 'Is the address below correct? Then you don\'t need to do anything. If the recipient has moved, or something is wrong, you can update the address with the button below.'
    : 'Is the email address below correct? Then you don\'t need to do anything. If it\'s wrong, or you\'d like to change it, you can update it with the button below.';

  const body = `
    <p style="font-family:Georgia,'Caveat',cursive;font-size:20px;color:#6B2737;margin:0 0 6px;font-style:italic;">~ a quick check before delivery ~</p>
    <h1 style="font-family:Georgia,serif;font-size:26px;color:#2A231C;margin:0 0 18px;line-height:1.2;">Are the delivery details correct?</h1>

    <p style="margin:0 0 16px;color:#2A231C;font-size:16px;">
      Dear ${escapeHtml(order.customer_name || 'you')},
    </p>

    <p style="margin:0 0 22px;color:#2A231C;font-size:16px;">
      In about 30 days — on <strong style="color:#6B2737;">${escapeHtml(leveringsDato)}</strong> —
      ${mottakerSetning}
      We just want to be completely sure we're sending to the right place.
    </p>

    <p style="margin:0 0 18px;color:#2A231C;font-size:16px;">
      ${oppdaterTekst}
    </p>

    <!-- Current details -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
      style="background:#F5F0E8;border:1px solid #E8DCC4;border-radius:12px;margin:0 0 24px;">
      <tr><td style="padding:20px 24px;">
        ${detaljerHtml}
      </td></tr>
    </table>

    <!-- CTA -->
    <p style="text-align:center;margin:0 0 26px;">
      <a href="${escapeHtml(oppdaterUrl)}"
         style="display:inline-block;background:#6B2737;color:#F5F0E8;text-decoration:none;padding:16px 40px;border-radius:50px;font-family:'Inter',Arial,sans-serif;font-size:1rem;font-weight:600;letter-spacing:.3px;">
        Confirm or update &rarr;
      </a>
    </p>

    <p style="margin:0 0 22px;color:#6B5D4C;font-size:14px;text-align:center;font-style:italic;">
      If everything is correct, you can safely ignore this email — we'll take care of the rest.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
      style="background:#F5F0E8;border:1px solid #E8DCC4;border-radius:12px;margin:0 0 24px;">
      <tr><td style="padding:18px 22px;">
        <table role="presentation" width="100%" cellpadding="6" cellspacing="0" border="0" style="font-size:14px;">
          <tr>
            <td style="color:#6B5D4C;width:40%;">Order number</td>
            <td style="color:#2A231C;font-weight:600;">${escapeHtml(order.order_number || '')}</td>
          </tr>
          <tr>
            <td style="color:#6B5D4C;">Delivery date</td>
            <td style="color:#6B2737;font-weight:700;font-family:Georgia,serif;">${escapeHtml(leveringsDato)}</td>
          </tr>
          <tr>
            <td style="color:#6B5D4C;">Product</td>
            <td style="color:#2A231C;">${escapeHtml(produktNavn)}</td>
          </tr>
        </table>
      </td></tr>
    </table>

    <p style="margin:0;color:#6B5D4C;font-size:14px;">
      Warm regards,<br/>
      <span style="font-family:Georgia,'Caveat',cursive;color:#6B2737;font-size:18px;font-style:italic;">The Tidsbrev team</span>
    </p>
  `;

  return {
    subject: `Are the delivery details correct? — order ${order.order_number}`,
    html: baseLayout({
      title: 'Confirm delivery details',
      preheader: `We deliver ${leveringsDato}. Please check the details are correct.`,
      bodyHtml: body,
      lang: 'en'
    })
  };
}

function recipientConfirm(order, lang = 'no') {
  if (lang === 'en') return recipientConfirmEN(order);

  const sideUrl = process.env.SIDE_URL || 'https://tidsbrev.no';
  const produktNavn = PRODUKT_NAVN[order.product_type] || order.product_type;
  const leveringsDato = formatDateNO(order.delivery_date);
  const erFysisk = order.product_type === 'fysisk';
  const tilSegSelv = order.recipient_type === 'meg_selv';

  // Sikker lenke — kun ordrenummer + token, ingen persondata.
  const oppdaterUrl =
    `${sideUrl}/oppdater.html?order=${encodeURIComponent(order.order_number || '')}` +
    `&token=${encodeURIComponent(order.update_token || '')}`;

  // Nåværende leveringsdetaljer som vises i e-posten.
  let detaljerHtml;
  if (erFysisk) {
    const navnLinje = order.recipient_name ? `${escapeHtml(order.recipient_name)}<br/>` : '';
    const adresseLinje = order.recipient_address ? `${escapeHtml(order.recipient_address)}<br/>` : '';
    const stedLinje = `${escapeHtml(order.recipient_zip || '')} ${escapeHtml(order.recipient_city || '')}`.trim();
    detaljerHtml = `
        <div style="font-family:Georgia,serif;color:#6B2737;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Nåværende leveringsadresse</div>
        <div style="background:#fffdf7;border:1px dashed #c9b9a0;border-radius:8px;padding:16px 20px;font-family:Georgia,serif;font-size:15px;line-height:1.7;color:#2A231C;">
          ${navnLinje}${adresseLinje}${stedLinje || '<span style="color:#6B5D4C;font-style:italic;">(ingen adresse registrert)</span>'}
        </div>`;
  } else {
    const leveringsEpost = tilSegSelv
      ? (order.customer_email || '')
      : (order.recipient_email || '');
    detaljerHtml = `
        <div style="font-family:Georgia,serif;color:#6B2737;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Nåværende leverings-e-post</div>
        <div style="background:#fffdf7;border:1px dashed #c9b9a0;border-radius:8px;padding:16px 20px;font-family:Georgia,serif;font-size:15px;line-height:1.7;color:#2A231C;">
          ${escapeHtml(leveringsEpost) || '<span style="color:#6B5D4C;font-style:italic;">(ingen e-post registrert)</span>'}
        </div>`;
  }

  const mottakerSetning = tilSegSelv
    ? `leverer vi <strong>${escapeHtml(produktNavn)}</strong> til deg.`
    : `leverer vi <strong>${escapeHtml(produktNavn)}</strong> til ${escapeHtml(order.recipient_name || 'mottakeren')}.`;

  const oppdaterTekst = erFysisk
    ? 'Stemmer adressen nedenfor? Da trenger du ikke gjøre noe. Har mottakeren flyttet, eller er noe feil, kan du oppdatere adressen med knappen under.'
    : 'Stemmer e-postadressen nedenfor? Da trenger du ikke gjøre noe. Er den feil, eller ønsker du å bytte den, kan du oppdatere den med knappen under.';

  const body = `
    <p style="font-family:Georgia,'Caveat',cursive;font-size:20px;color:#6B2737;margin:0 0 6px;font-style:italic;">~ en liten sjekk før levering ~</p>
    <h1 style="font-family:Georgia,serif;font-size:26px;color:#2A231C;margin:0 0 18px;line-height:1.2;">Stemmer leveringsdetaljene?</h1>

    <p style="margin:0 0 16px;color:#2A231C;font-size:16px;">
      Kjære ${escapeHtml(order.customer_name || 'du')},
    </p>

    <p style="margin:0 0 22px;color:#2A231C;font-size:16px;">
      Om omtrent 30 dager — den <strong style="color:#6B2737;">${escapeHtml(leveringsDato)}</strong> —
      ${mottakerSetning}
      Vi vil bare være helt sikre på at vi sender til rett sted.
    </p>

    <p style="margin:0 0 18px;color:#2A231C;font-size:16px;">
      ${oppdaterTekst}
    </p>

    <!-- Nåværende detaljer -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
      style="background:#F5F0E8;border:1px solid #E8DCC4;border-radius:12px;margin:0 0 24px;">
      <tr><td style="padding:20px 24px;">
        ${detaljerHtml}
      </td></tr>
    </table>

    <!-- CTA -->
    <p style="text-align:center;margin:0 0 26px;">
      <a href="${escapeHtml(oppdaterUrl)}"
         style="display:inline-block;background:#6B2737;color:#F5F0E8;text-decoration:none;padding:16px 40px;border-radius:50px;font-family:'Inter',Arial,sans-serif;font-size:1rem;font-weight:600;letter-spacing:.3px;">
        Bekreft eller oppdater &rarr;
      </a>
    </p>

    <p style="margin:0 0 22px;color:#6B5D4C;font-size:14px;text-align:center;font-style:italic;">
      Er alt riktig, kan du trygt se bort fra denne e-posten — vi tar oss av resten.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
      style="background:#F5F0E8;border:1px solid #E8DCC4;border-radius:12px;margin:0 0 24px;">
      <tr><td style="padding:18px 22px;">
        <table role="presentation" width="100%" cellpadding="6" cellspacing="0" border="0" style="font-size:14px;">
          <tr>
            <td style="color:#6B5D4C;width:40%;">Ordrenummer</td>
            <td style="color:#2A231C;font-weight:600;">${escapeHtml(order.order_number || '')}</td>
          </tr>
          <tr>
            <td style="color:#6B5D4C;">Leveringsdato</td>
            <td style="color:#6B2737;font-weight:700;font-family:Georgia,serif;">${escapeHtml(leveringsDato)}</td>
          </tr>
          <tr>
            <td style="color:#6B5D4C;">Produkt</td>
            <td style="color:#2A231C;">${escapeHtml(produktNavn)}</td>
          </tr>
        </table>
      </td></tr>
    </table>

    <p style="margin:0;color:#6B5D4C;font-size:14px;">
      Varme hilsener,<br/>
      <span style="font-family:Georgia,'Caveat',cursive;color:#6B2737;font-size:18px;font-style:italic;">Teamet bak Tidsbrev</span>
    </p>
  `;

  return {
    subject: `Stemmer leveringsdetaljene? — ordre ${order.order_number}`,
    html: baseLayout({
      title: 'Bekreft leveringsdetaljer',
      preheader: `Vi leverer ${leveringsDato}. Sjekk at detaljene stemmer.`,
      bodyHtml: body
    })
  };
}


module.exports = {
  orderConfirmation,
  adminNewOrder,
  deliverLetter,
  adminReminder,
  deliverLetterHtml,
  deliverLetterText,
  deliverTidskapsell,
  senderReminder,
  recipientConfirm
};
