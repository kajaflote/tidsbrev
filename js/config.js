// ================================================================
// Tidsbrev.no — Sentral konfigurasjon
// ================================================================
// ALLE API-nøkler og offentlige konfigurasjonsverdier samles her.
// Dette er en "public config" — bare nøkler som er trygge å vise
// i nettleseren skal ligge her (publiske/anon nøkler).
//
// HEMMELIGE nøkler (service_role, Stripe secret key, webhook
// secrets, Vipps client_secret) skal ALDRI ligge her — de lagres
// som miljøvariabler i Netlify og brukes kun i backend/*.js
// ================================================================

// ================================================================
// VIPPS AV/PÅ-BRYTER
// ================================================================
// Når du har lagt inn Vipps-nøklene i Netlify miljøvariabler og er
// klar til å aktivere Vipps, setter du denne til TRUE.
// Frontend sjekker denne og aktiverer/deaktiverer Vipps-knappen
// automatisk. Ingen andre endringer trengs for å skru Vipps på.
// ================================================================
const VIPPS_ACTIVE = false;


const CONFIG = {

  // ----------------------------------------------------------------
  // SUPABASE — Database og autentisering
  // ----------------------------------------------------------------
  // Hvor finner du disse?
  //   1. Gå til https://supabase.com/dashboard
  //   2. Velg prosjektet ditt → Settings → API
  //   3. Kopier "Project URL" og "anon / public"-nøkkelen
  // ----------------------------------------------------------------
  SUPABASE_URL: "https://bfnrccknrluxbukwdsjy.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmbnJjY2tucmx1eGJ1a3dkc2p5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MjAzODEsImV4cCI6MjA5MTQ5NjM4MX0.p0dr-XU_ALJlPZFTFFSnONppaXlv2Dbr3RgFKCB36VU",


  // ----------------------------------------------------------------
  // STRIPE — Kortbetaling (publiserbar nøkkel)
  // ----------------------------------------------------------------
  // Hvor finner du denne?
  //   1. Gå til https://dashboard.stripe.com/apikeys
  //   2. Kopier "Publishable key" (starter med pk_live_ eller pk_test_)
  //   Bruk pk_test_ mens du utvikler, pk_live_ når du går live.
  // ----------------------------------------------------------------
  STRIPE_PUBLISHABLE_KEY: "pk_test_LIM-INN-STRIPE-PUBLISHABLE-KEY-HER",


  // ----------------------------------------------------------------
  // VIPPS — Mobilbetaling (kun klient-ID, ikke secret!)
  // ----------------------------------------------------------------
  // Hvor finner du dette?
  //   1. Logg inn på https://portal.vipps.no
  //   2. Gå til "Utvikler" → "Test-nøkler" eller "Produksjons-nøkler"
  //   3. Merchant Serial Number (MSN) finner du under "Salgsstedet mitt"
  // MERK: client_secret og subscription_key skal KUN ligge i
  // Netlify miljøvariabler — aldri her.
  // ----------------------------------------------------------------
  VIPPS_MSN: "DIN-MERCHANT-SERIAL-NUMBER",
  VIPPS_MILJO: "test", // bytt til "production" når du går live


  // ----------------------------------------------------------------
  // RESEND — E-postutsending
  // ----------------------------------------------------------------
  // Resend-API-nøkkelen er HEMMELIG og skal ALDRI ligge her.
  // Den legges som miljøvariabel "RESEND_API_KEY" i Netlify.
  // Hvor finner du den?
  //   1. Gå til https://resend.com/api-keys
  //   2. Opprett en ny API-nøkkel (starter med re_...)
  // Avsender-adresse kan derimot ligge her:
  // ----------------------------------------------------------------
  EPOST_AVSENDER: "Tidsbrev.no <tidsbrev@outlook.com>",
  EPOST_SVAR_TIL: "tidsbrev@outlook.com",


  // ----------------------------------------------------------------
  // ANALYTICS
  // ----------------------------------------------------------------
  GA4_MEASUREMENT_ID: "G-RZQLZH8Z2G",
  META_PIXEL_ID: "",            // la stå tom hvis du ikke bruker den
  POSTHOG_API_KEY: "157370",
  POSTHOG_HOST: "https://eu.i.posthog.com",


  // ----------------------------------------------------------------
  // NETTSIDEN — Generelle innstillinger
  // ----------------------------------------------------------------
  SIDE_URL: "https://tidsbrev.no",
  STOTTE_EPOST: "tidsbrev@outlook.com",

  // ----------------------------------------------------------------
  // PRODUKTPRISER — i hele kroner NOK
  // Prismodell: startpris + årsavgift × lagringsår (avrundet ned)
  // Under 1 år = kun startpris. Eksempler:
  // Digitalt 10 år: 99 + 10×19 = 289 kr
  // Fysisk 5 år:    249 + 5×29 = 394 kr
  // Tidskapsell 10 år: 149 + 10×49 = 639 kr
  // ----------------------------------------------------------------
  PRIS_DIGITALT_BASE:      99,   // startpris digitalt brev
  PRIS_DIGITALT_PER_AAR:   19,   // årsavgift digitalt

  PRIS_FYSISK_BASE:       249,   // startpris fysisk brev
  PRIS_FYSISK_PER_AAR:    29,    // årsavgift fysisk

  PRIS_TIDSKAPSELL_BASE:  149,   // startpris tidskapsell
  PRIS_TIDSKAPSELL_PER_AAR: 49,  // årsavgift tidskapsell

  PRIS_KONVOLUTT:          79,   // tillegg for premium konvolutt (fysisk)

  // Bakoverkompatibel tabell (brukes ikke lenger aktivt, men beholdes
  // slik at eldre ordre kan vises riktig i admin-dashboardet)
  PRISER_LEGACY: {
    standard_digitalt: 349,
    standard_fysisk:   449,
    premium_digitalt:  599,
    premium_fysisk:    699,
    legacy_digitalt:  1299,
    legacy_fysisk:    1499
  },

  // Produktnavn
  PRODUKTER: {
    digitalt:    { navn: 'Digitalt Brev' },
    fysisk:      { navn: 'Fysisk Brev i konvolutt' },
    tidskapsell: { navn: 'Tidskapsell' }
  }
};


// ================================================================
// Hjelpefunksjoner — prisberegning
// ================================================================

/**
 * Beregn antall ekstra lagringsår fra i dag til leveringsdato.
 * Returnerer 0 for datoer under 1 år frem.
 */
function antallAar(leveringsdato) {
  if (!leveringsdato) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const levering = new Date(leveringsdato);
  const ms = levering - today;
  const aar = Math.floor(ms / (1000 * 60 * 60 * 24 * 365.25));
  return Math.max(0, aar);
}

/**
 * Beregn pris for en bestilling.
 * Modell: base + år × perYear
 *
 * @param {string} produkttype  'digitalt' | 'fysisk' | 'tidskapsell'
 * @param {string} leveringsdato  ISO-dato, f.eks. "2035-06-15"
 * @returns {number} pris i NOK (hele kroner)
 */
function getPris(produkttype, leveringsdato) {
  const aar = antallAar(leveringsdato);

  switch (produkttype) {
    case 'fysisk':
      return CONFIG.PRIS_FYSISK_BASE + aar * CONFIG.PRIS_FYSISK_PER_AAR;
    case 'tidskapsell':
      return CONFIG.PRIS_TIDSKAPSELL_BASE + aar * CONFIG.PRIS_TIDSKAPSELL_PER_AAR;
    case 'digitalt':
    default:
      return CONFIG.PRIS_DIGITALT_BASE + aar * CONFIG.PRIS_DIGITALT_PER_AAR;
  }
}

/**
 * Returnerer en lesbar prisforklaring for visning i UI.
 * Eksempel: "99 kr + 9 × 19 kr = 270 kr"
 *
 * @param {string} produkttype
 * @param {string} leveringsdato
 * @returns {{ total: number, base: number, perAar: number, aar: number, tekst: string }}
 */
function getPrisDetaljer(produkttype, leveringsdato) {
  const aar = antallAar(leveringsdato);
  let base, perAar;

  switch (produkttype) {
    case 'fysisk':
      base = CONFIG.PRIS_FYSISK_BASE;
      perAar = CONFIG.PRIS_FYSISK_PER_AAR;
      break;
    case 'tidskapsell':
      base = CONFIG.PRIS_TIDSKAPSELL_BASE;
      perAar = CONFIG.PRIS_TIDSKAPSELL_PER_AAR;
      break;
    default:
      base = CONFIG.PRIS_DIGITALT_BASE;
      perAar = CONFIG.PRIS_DIGITALT_PER_AAR;
  }

  const total = base + aar * perAar;
  const tekst = aar > 0
    ? `${base} kr + ${aar} × ${perAar} kr = ${total} kr`
    : `${base} kr`;

  return { total, base, perAar, aar, ekstraAar: aar, tekst };
}

/**
 * Bakoverkompatibel oppslag for legacy produkt-/leveringskombo.
 * Brukes kun for å vise gamle ordre korrekt i admin.
 */
function getLegacyPris(produkt, levering) {
  const nokkel = `${produkt}_${levering}`;
  return CONFIG.PRISER_LEGACY[nokkel] || null;
}


// Eksporter for bruk i andre JS-filer (browser + Node)
if (typeof window !== "undefined") {
  window.CONFIG = CONFIG;
  window.VIPPS_ACTIVE = VIPPS_ACTIVE;
  window.getPris = getPris;
  window.getPrisDetaljer = getPrisDetaljer;
  window.antallAar = antallAar;
  window.getLegacyPris = getLegacyPris;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { CONFIG, VIPPS_ACTIVE, getPris, getPrisDetaljer, antallAar, getLegacyPris };
}
