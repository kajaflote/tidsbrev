// ================================================================
// Tidsbrev.no — PDF Generator for Letter & Capsule Delivery
// ================================================================
// Two exported functions:
//
//   generateLetterPdf(order, letterContent)
//     → beautiful A4 PDF of the letter, returned as base64 string
//
//   generateCapsulePdf(order, files, personalMessage)
//     → beautiful A4 PDF receipt for time capsule delivery, base64
//
// Both call the Browserless /pdf endpoint. If anything fails they
// log the error and return null — they never throw.
//
// Environment variables:
//   BROWSERLESS_API_KEY — API token for chrome.browserless.io
// ================================================================

// ── Helpers ──────────────────────────────────────────────────────

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

function datNO(iso) {
  try {
    return new Date(iso).toLocaleDateString('nb-NO', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  } catch { return String(iso); }
}

function nl2br(text) {
  return esc(text).replace(/\n/g, '<br/>');
}

function formatSize(bytes) {
  if (!bytes) return '';
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? mb.toFixed(1) + ' MB' : (bytes / 1024).toFixed(0) + ' KB';
}

function fileIcon(mimeType) {
  if (!mimeType) return '📄';
  if (mimeType.startsWith('image/')) return '📷';
  if (mimeType.startsWith('video/')) return '🎬';
  if (mimeType.startsWith('audio/')) return '🎙️';
  return '📄';
}

// ── Shared Browserless caller ────────────────────────────────────

async function htmlToPdfBase64(html) {
  const apiKey = process.env.BROWSERLESS_API_KEY;
  if (!apiKey) {
    console.error('[generate-pdf] BROWSERLESS_API_KEY is not set');
    return null;
  }

  const res = await fetch(
    `https://chrome.browserless.io/pdf?token=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({
        html,
        options: {
          printBackground: true,
          format: 'A4',
          margin: { top: '0', right: '0', bottom: '0', left: '0' }
        }
      })
    }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Browserless ${res.status}: ${body.slice(0, 200)}`);
  }

  const buf = await res.arrayBuffer();
  return Buffer.from(buf).toString('base64');
}

// ── Shared page shell ────────────────────────────────────────────

function pageShell(cardInnerHtml) {
  return `<!DOCTYPE html>
<html lang="nb">
<head>
<meta charset="UTF-8"/>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    width: 210mm; height: 297mm;
    background: #3B0D18;
    font-family: Georgia, 'Playfair Display', serif;
    color: #2A1C12;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  body {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
  }
  .page {
    width: 210mm; height: 297mm;
    background: #3B0D18;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    padding: 22mm 24mm 14mm;
  }
  .card {
    width: 100%;
    flex: 1;
    background: linear-gradient(180deg, #FBF6EC 0%, #EDE0C4 100%);
    border: 1px solid #C9B38A;
    border-radius: 3px;
    box-shadow: 0 30px 80px rgba(0,0,0,.50), 0 0 0 1px rgba(107,39,55,.06);
    padding: 44px 52px;
    display: flex;
    flex-direction: column;
  }
  .gold-line {
    height: 1px;
    background: rgba(176,138,62,0.6);
  }
  .gold-line-center {
    height: 1px;
    background: linear-gradient(to right, transparent, rgba(176,138,62,0.6), transparent);
  }
  .page-footer {
    text-align: center;
    margin-top: 12px;
    font-style: italic;
    font-size: 11px;
    color: rgba(245,240,232,0.4);
    font-family: Georgia, serif;
  }
</style>
</head>
<body>
<div class="page">
  <div class="card">
    ${cardInnerHtml}
  </div>
  <div class="page-footer">Tidsbrev.no &mdash; Brev til fremtiden, skrevet i dag</div>
</div>
</body>
</html>`;
}


// ================================================================
// 1) LETTER PDF
// ================================================================

function buildLetterHtml(order, letterContent) {
  const sender  = order.customer_name || 'en som er glad i deg';
  const written = datNO(order.created_at);

  return pageShell(`
    <!-- Header row -->
    <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:14px;">
      <span style="font-style:italic;font-size:13px;color:#9A7A50;">${esc(sender)}</span>
      <span style="font-style:italic;font-size:13px;color:#9A7A50;">Skrevet ${esc(written)}</span>
    </div>
    <div class="gold-line" style="margin-bottom:26px;"></div>

    <!-- Intro -->
    <p style="font-style:italic;font-size:14px;color:#5A4535;line-height:1.7;margin-bottom:10px;">
      Dette brevet ble skrevet til deg av <strong style="color:#4E141C;">${esc(sender)}</strong>.
      I dag, endelig, er det her.
    </p>
    <div class="gold-line" style="opacity:0.4;margin-bottom:28px;"></div>

    <!-- Letter body -->
    <div style="flex:1;font-size:17px;line-height:1.95;color:#2A1C12;white-space:pre-wrap;overflow:hidden;">
      ${nl2br(letterContent || '')}
    </div>

    <!-- Bottom divider -->
    <div class="gold-line-center" style="margin:32px 0 22px;"></div>

    <!-- Signature -->
    <div style="text-align:right;">
      <div style="font-style:italic;color:#6B2737;font-size:22px;margin-bottom:4px;">Med kjærlighet,</div>
      <div style="font-style:italic;color:#4E141C;font-size:26px;font-weight:bold;">&mdash; ${esc(sender)}</div>
      <div style="font-size:12px;color:#9A7A50;margin-top:6px;">${esc(written)}</div>
    </div>
  `);
}

async function generateLetterPdf(order, letterContent) {
  try {
    const html = buildLetterHtml(order, letterContent);
    return await htmlToPdfBase64(html);
  } catch (err) {
    console.error('[generate-pdf] Letter PDF failed:', err.message);
    return null;
  }
}


// ================================================================
// 2) CAPSULE PDF
// ================================================================

function buildCapsuleHtml(order, files, personalMessage) {
  const sender  = order.customer_name || 'en som er glad i deg';
  const written = datNO(order.created_at);

  const messageBlock = (personalMessage && personalMessage.trim()) ? `
    <div style="margin:24px 0 28px;padding:20px 24px;background:#F5EDDB;border-left:3px solid #B08A3E;border-radius:0 6px 6px 0;">
      <div style="font-style:italic;font-size:17px;line-height:1.85;color:#2A1C12;">
        ${nl2br(personalMessage)}
      </div>
    </div>
  ` : '';

  const fileRows = (files || []).map(f => `
    <div style="display:flex;align-items:center;padding:10px 0;border-bottom:1px solid rgba(201,179,138,0.3);">
      <span style="font-size:20px;margin-right:12px;">${fileIcon(f.type)}</span>
      <span style="font-size:15px;color:#2A1C12;flex:1;">${esc(f.name)}</span>
      <span style="font-size:12px;color:#9A7A50;">${formatSize(f.size)}</span>
    </div>
  `).join('');

  return pageShell(`
    <!-- Heading -->
    <h1 style="font-size:28px;color:#4E141C;text-align:center;margin-bottom:8px;font-weight:700;">
      Din tidskapsel er ankommet
    </h1>
    <p style="text-align:center;font-style:italic;font-size:15px;color:#9A7A50;margin-bottom:20px;">
      ~ lagret av ${esc(sender)} den ${esc(written)} ~
    </p>
    <div class="gold-line" style="margin-bottom:28px;"></div>

    <!-- Personal message -->
    ${messageBlock}

    <!-- Files section -->
    <div style="font-size:13px;color:#6B2737;text-transform:uppercase;letter-spacing:2px;font-weight:700;margin-bottom:14px;">
      Dine filer
    </div>
    <div style="flex:1;overflow:hidden;">
      ${fileRows || '<p style="color:#9A7A50;font-style:italic;">Ingen filer tilgjengelig.</p>'}
    </div>
    <p style="font-style:italic;font-size:13px;color:#9A7A50;margin-top:16px;">
      Last ned filene via lenken i e-posten. Lenkene utl&oslash;per om 30 dager.
    </p>

    <!-- Bottom divider -->
    <div class="gold-line-center" style="margin:28px 0 20px;"></div>

    <!-- Signature -->
    <div style="text-align:right;">
      <div style="font-style:italic;color:#6B2737;font-size:22px;margin-bottom:4px;">Med varme hilsener,</div>
      <div style="font-style:italic;color:#4E141C;font-size:26px;font-weight:bold;">&mdash; Teamet bak Tidsbrev</div>
    </div>
  `);
}

async function generateCapsulePdf(order, files, personalMessage) {
  try {
    const html = buildCapsuleHtml(order, files, personalMessage);
    return await htmlToPdfBase64(html);
  } catch (err) {
    console.error('[generate-pdf] Capsule PDF failed:', err.message);
    return null;
  }
}


module.exports = { generateLetterPdf, generateCapsulePdf };
