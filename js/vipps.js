// ================================================================
// Tidsbrev.no — Vipps mobilbetaling (frontend)
// ================================================================
// Vipps krever at selve ePayment-forespørselen opprettes
// serverside med client_secret + subscription_key.
// Frontend kaller derfor Netlify-funksjonen /api/vipps-init som
// returnerer en redirectUrl til Vipps-appen / Vipps på nett.
// ================================================================

const Vipps = {

  async startBetaling(brev) {
    try {
      const res = await fetch('/api/vipps-init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ordre_id: brev.ordre_id,
          produkt: brev.produkt,
          belop: brev.pris, // i hele kroner — backend ganger med 100
          telefon: brev.avsender_telefon || null
        })
      });

      if (!res.ok) throw new Error('Kunne ikke starte Vipps-betaling.');

      const { redirectUrl } = await res.json();
      window.location.href = redirectUrl;
    } catch (err) {
      console.error('[Vipps]', err);
      Utils.visMelding('Vipps-betalingen kunne ikke startes. Prøv igjen.', 'error');
    }
  }
};

if (typeof window !== 'undefined') window.Vipps = Vipps;
