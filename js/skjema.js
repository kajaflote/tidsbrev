// ================================================================
// Tidsbrev.no — Skjemalogikk for bestillingssiden
// ================================================================
// Håndterer:
//  - Validering av skjemaet (bestill.html)
//  - Lagring av utkast til Supabase
//  - Videresending til betaling (Stripe eller Vipps)
// ================================================================

const Skjema = {

  async lagreBrev(data) {
    if (!window.db) {
      console.error('[Skjema] Supabase ikke tilgjengelig.');
      return { error: 'database ikke tilgjengelig' };
    }

    // Valider
    if (!Utils.gyldigEpost(data.avsender_epost)) {
      return { error: 'Ugyldig e-postadresse.' };
    }
    if (!Utils.gyldigLeveringsdato(data.leveringsdato)) {
      return { error: 'Leveringsdatoen må være mellom 1 og 30 år frem i tid.' };
    }

    // Lagre til Supabase
    const { data: brev, error } = await window.db
      .from('brev')
      .insert({
        ...data,
        ordre_id: Utils.genererOrdreId(),
        betalt: false,
        opprettet: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('[Skjema]', error);
      return { error: error.message };
    }
    return { brev };
  },

  // Kobler til form i bestill.html
  init(formId) {
    const form = document.getElementById(formId);
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      const result = await Skjema.lagreBrev(data);

      if (result.error) {
        Utils.visMelding(result.error, 'error');
        return;
      }

      // Gå videre til betaling
      const betalingsmetode = data.betalingsmetode || 'stripe';
      if (betalingsmetode === 'vipps') {
        await Vipps.startBetaling(result.brev);
      } else {
        await Stripe.startCheckout(result.brev);
      }
    });
  }
};

if (typeof window !== 'undefined') window.Skjema = Skjema;
