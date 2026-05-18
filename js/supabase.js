// ================================================================
// Tidsbrev.no — Supabase-tilkobling (frontend)
// ================================================================
// Denne filen setter opp en Supabase-klient som kan brukes fra
// nettleseren til å lese/skrive data, logge inn brukere osv.
//
// Nøklene hentes fra config.js — husk at kun "anon public"-nøkkelen
// skal brukes her. Service-role-nøkkelen skal KUN brukes i backend.
// ================================================================

// Last inn Supabase-biblioteket fra CDN (ingen npm nødvendig):
// Legg dette i <head> på HTML-sidene som trenger Supabase:
//
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
// <script src="js/config.js"></script>
// <script src="js/supabase.js"></script>

(function () {
  if (typeof window === "undefined") return;

  if (typeof CONFIG === "undefined") {
    console.error("[Supabase] config.js er ikke lastet inn.");
    return;
  }

  if (typeof window.supabase === "undefined" || !window.supabase.createClient) {
    console.error("[Supabase] Supabase-biblioteket er ikke lastet inn. Legg til CDN-scriptet.");
    return;
  }

  // Opprett klienten
  const client = window.supabase.createClient(
    CONFIG.SUPABASE_URL,
    CONFIG.SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );

  // Gjør klienten globalt tilgjengelig som window.db
  window.db = client;

  console.log("[Supabase] Klient initialisert mot", CONFIG.SUPABASE_URL);
})();


// ================================================================
// Eksempler på bruk (kopier inn i skjema.js eller der du trenger)
// ================================================================
//
// 1) Lagre et nytt tidsbrev:
// ---------------------------------------------------------------
// const { data, error } = await window.db
//   .from('brev')
//   .insert({
//     avsender_navn: 'Kari',
//     avsender_epost: 'kari@epost.no',
//     mottaker_navn: 'Ola',
//     mottaker_epost: 'ola@epost.no',
//     innhold: 'Kjære Ola...',
//     leveringsdato: '2030-06-15',
//     produkt: 'standard',
//     betalt: false
//   })
//   .select()
//   .single();
//
// if (error) console.error(error);
// else console.log('Brev lagret:', data);
//
// ---------------------------------------------------------------
// 2) Hente alle brev for en bruker:
// ---------------------------------------------------------------
// const { data: brev, error } = await window.db
//   .from('brev')
//   .select('*')
//   .eq('avsender_epost', 'kari@epost.no')
//   .order('opprettet', { ascending: false });
//
// ---------------------------------------------------------------
// 3) Legge til på venteliste:
// ---------------------------------------------------------------
// await window.db.from('venteliste').insert({
//   fornavn: 'Kari',
//   epost: 'kari@epost.no',
//   anledning: 'barnet_mitt'
// });
// ================================================================
