// ================================================================
// Tidsbrev.no — Delte hjelpefunksjoner
// ================================================================
// Små funksjoner som brukes på tvers av siden.
// ================================================================

const Utils = {

  // Formater dato til norsk format (f.eks. "15. juni 2030")
  formaterDato(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('nb-NO', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch { return iso; }
  },

  // Formater pris i NOK (f.eks. "349 kr")
  formaterPris(belop) {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
      maximumFractionDigits: 0
    }).format(belop);
  },

  // Valider e-postadresse
  gyldigEpost(epost) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(epost);
  },

  // Sjekk at leveringsdato er mellom i morgen og 30 år frem i tid
  gyldigLeveringsdato(iso) {
    const dato = new Date(iso);
    const naa = new Date();
    const min = new Date(); min.setDate(naa.getDate() + 1); min.setHours(0,0,0,0);
    const max = new Date(); max.setFullYear(naa.getFullYear() + 30);
    return dato >= min && dato <= max;
  },

  // Hent URL-parameter (f.eks. ?order=123)
  urlParam(navn) {
    return new URLSearchParams(window.location.search).get(navn);
  },

  // Enkel "toast"-melding
  visMelding(tekst, type = 'info') {
    const el = document.createElement('div');
    el.className = `alert alert-${type}`;
    el.textContent = tekst;
    el.style.position = 'fixed';
    el.style.bottom = '20px';
    el.style.right = '20px';
    el.style.zIndex = '1000';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  },

  // Generer unik ordre-ID
  genererOrdreId() {
    return 'TB-' + Date.now().toString(36).toUpperCase() +
      Math.random().toString(36).substr(2, 4).toUpperCase();
  }
};

if (typeof window !== 'undefined') window.Utils = Utils;
if (typeof module !== 'undefined' && module.exports) module.exports = Utils;
