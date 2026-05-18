// ================================================================
// Tidsbrev.no — Stripe kortbetaling (frontend)
// ================================================================
// Bruker Stripe Checkout Session. Selve sessionen opprettes
// i backend/stripe-webhook.js (Netlify Function) med den hemmelige
// nøkkelen — frontend kaller bare den funksjonen og mottar en URL
// å videresende brukeren til.
//
// Last inn Stripe.js i HTML før denne filen:
// <script src="https://js.stripe.com/v3/"></script>
// <script src="js/config.js"></script>
// <script src="js/stripe.js"></script>
// ================================================================

const Stripe = {

  async startCheckout(brev) {
    try {
      // Kall Netlify-funksjonen som oppretter en Checkout Session
      const res = await fetch('/api/create-stripe-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ordre_id: brev.ordre_id,
          produkt: brev.produkt,
          epost: brev.avsender_epost
        })
      });

      if (!res.ok) throw new Error('Kunne ikke opprette betaling.');

      const { url } = await res.json();
      // Videresend brukeren til Stripe Checkout
      window.location.href = url;
    } catch (err) {
      console.error('[Stripe]', err);
      Utils.visMelding('Betalingen kunne ikke startes. Prøv igjen.', 'error');
    }
  }
};

if (typeof window !== 'undefined') window.Stripe = Stripe;
