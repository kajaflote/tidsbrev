# IMPL-plan: Taleopptak — levering (e-post + viewer) — Steg 1 (kartlegging, INGEN edits gjort)

Kun kartlegging. Ingen filer endret. Vent på godkjenning før Steg 2.

> ⚠️ **Merk om Implementering #1:** Frontend-opptaket (Impl. #1) er IKKE skrevet i koden ennå — `js/audio-recorder.js` finnes ikke, og `ACCEPTED_TYPES`/`accept` i `bestill.html` inneholder fortsatt ikke audio. Vi stoppet ved godkjent plan (`IMPL-plan-taleopptak.md`). Leverings-endringene nedenfor er likevel uavhengige og forover-kompatible: de leser `tidskapsell_files.mime_type` og virker så snart audio-rader finnes. Si fra om du vil at #1 skal skrives først.

---

## a) Kartlegging av leveringspipelinen (filsti + linjenummer)

### Hva trigges av pg_cron?
- `database/pg-cron.sql:84–88` — cron-jobb `0 7 * * *` (07:00 UTC) kjører `trigger_daglig_brevsending()`.
- `database/pg-cron.sql:37–74` — funksjonen gjør HTTP POST til `https://tidsbrev.no/api/send-brev` (`pg-cron.sql:44`).
- **Netlify Function:** `backend/send-brev.js` er primærjobben (pg_cron er backup/trigger).
- Tidskapsell-grenen i jobben: `send-brev.js:148–200`
  - `send-brev.js:149–154` — henter ordrer: `delivery_type='tidskapsell'`, `payment_status='paid'`, `delivery_date=idag`.
  - `send-brev.js:162–193` — per kapsel: hopp over hvis allerede `sent` (170–173), ellers `sendEmail({ type:'deliver_tidskapsell', order_id })` (175–178).
  - `send-brev.js:187–191` — feil logges i `admin_log` (`capsule_delivery_failed`), jobben fortsetter.

### Hvor genereres signerte URL-er, og gyldighetstid?
- `backend/send-email.js:249–352` — `case 'deliver_tidskapsell'`.
  - `send-email.js:272–275` — henter alle rader fra `tidskapsell_files` for ordren.
  - `send-email.js:280–295` — løkke som lager signert URL per fil:
    - `send-email.js:283` — `.createSignedUrl(file.file_path, 60*60*24*30)` → **30 dagers** gyldighet.
    - `send-email.js:285–288` — ved feil: logg + `continue` (hopper over defekt fil, krasjer ikke).
    - `send-email.js:289–294` — bygger `fileLinks` med `{ name, url, size, type }` (`type = mime_type`).
  - `send-email.js:297–299` — hvis ingen gyldige lenker: kast feil.
  - `send-email.js:309–314` — bygger e-post via `templates.deliverTidskapsell({ order, files: fileLinks, personalMessage, lang })`.
  - `send-email.js:317–323` — PDF-vedlegg via `generateCapsulePdf` (ikke-blokkerende).
  - `send-email.js:335` — sender via Resend.
  - `send-email.js:345–349` — `admin_log` `capsule_delivered`.

### Hvor er e-postmalen?
- HTML-streng i JS: `backend/email-templates.js`.
  - `email-templates.js:883–961` — `deliverTidskapsell({order, files, personalMessage, lang})` (norsk; ruter til EN på `:884`).
  - `email-templates.js:804–882` — `deliverTidskapsellEN(...)` (engelsk variant).
  - Begge eksporteres via `module.exports` (`:1348`).

### Hvordan itereres `tidskapsell_files` for media-listen i dag?
- `email-templates.js:892–906` — `filListe = files.map(...)` bygger én `<tr>` per fil i én felles tabell.
  - `email-templates.js:893–894` — ikon-logikk: `isVideo = type.startsWith('video/')` → ▶ (`&#9654;`), **ellers 📷** (`&#128247;`). **Audio får derfor feil kamera-ikon i dag.**
  - `email-templates.js:900–903` — `<a href="signedUrl">filnavn</a>` + størrelse.
- Felles fil-tabell: `email-templates.js:931–939` (header «Dine filer — last ned innen 30 dager», `:935`).
- Note-tekst om 30 dager: `email-templates.js:941–943`.
- (Tilsvarende struktur i EN-varianten innenfor `:804–882`.)

### PDF-vedlegg (del av e-postlevering)
- `backend/generate-letter-pdf.js`
  - `generate-letter-pdf.js:45–50` — `fileIcon(mime)`: image→📷, video→🎬, **ellers 📄** (ingen audio-gren → audio får generisk doc-ikon).
  - `generate-letter-pdf.js:230–236` — `fileRows = files.map(...)` (ikon + navn + størrelse).

---

## b) Eksisterer det en viewer-side for Tidskapsell?

**Nei.** Eneste viewer er `brev-viewer.html`, og den er utelukkende for **digitale brev**:
- `brev-viewer.html:465` — leser `?token=` fra URL.
- `brev-viewer.html:532–537` — slår opp i `letter_tokens` + `letters` (brev-innhold/tema).
- Ingen referanser til `tidskapsell`, `tidskapsell_files`, `<audio>`, `<video>` eller `createSignedUrl` (verifisert med søk).

**Konklusjon:** Tidskapsell leveres **kun via e-post** med signerte nedlastingslenker. → **Steg 2b skippes. Ingen ny viewer opprettes** (egen avgjørelse, utenfor denne oppgaven). «Lytt direkte»-lenke til viewer er derfor ikke aktuelt nå.

---

## c) Foreslått tilnærming

### E-post — ny «Taleopptak»-seksjon
- I `deliverTidskapsell` (NO) og `deliverTidskapsellEN` (EN): del `files` i to:
  - `audioFiles = files.filter(f => f.type && f.type.startsWith('audio/'))`
  - `mediaFiles = files.filter(f => !(f.type && f.type.startsWith('audio/')))`
- Den eksisterende fil-tabellen (`:931–939`) rendrer **kun `mediaFiles`** (så audio ikke lenger får kamera-ikon).
- Ny «Taleopptak»-seksjon rendres **kun hvis `audioFiles.length > 0`**, plassert **rett etter** fil-tabellen og **før** den personlige hilsen-blokken (`meldingsBlokk`, `:945`).
- Visuell stil gjenbrukes 1:1 fra fil-tabellen: bakgrunn `#F5F0E8`, kant `#E8DCC4`, skoggrønn header `#2D4A3E`/`#F5F0E8`, Georgia. Ingen nye farger/fonter.
- Hver rad: 🎙️ (`&#127897;`) + filnavn (med varm fallback «Taleopptak 1/2…» hvis navnet er teknisk, f.eks. starter med `tale-`) + størrelse + «Last ned»-lenke til samme signerte URL.

### Edge case: kun lyd, ingen foto/video
- Guard: den eksisterende fil-tabellen rendres **kun hvis `mediaFiles.length > 0`** (unngår tom «Dine filer»-header). Ingredienskall i intro-teksten (`:924–928`, «alle X filene») beholder total `files.length`.

### Viewer
- Ingen viewer finnes → ingen `<audio controls>` legges til noe sted. Skippet.

### Signerte URL-er
- Gyldighet er allerede **30 dager** (`send-email.js:283`), godt over minstekravet på 7 dager. **Ingen endring nødvendig.** Audio gjenbruker nøyaktig samme signerings-løkke (ingen ny kode).

---

## d) Diff-plan (ingen kode skrevet enda)

### Endrede filer
1. **`backend/email-templates.js`** — i `deliverTidskapsell` (`:883–961`):
   - Splitt `files` i `audioFiles`/`mediaFiles`.
   - `filListe` bygges fra `mediaFiles` (ellers uendret markup).
   - Guard: fil-tabell-blokken (`:930–943`) rendres betinget av `mediaFiles.length > 0`.
   - Ny `taleListe` + «Taleopptak»-seksjonsblokk (samme stil), satt inn før `${meldingsBlokk}` (`:945`).
   - Speil **nøyaktig samme** endringer i `deliverTidskapsellEN` (`:804–882`) med engelsk copy.
2. **`backend/generate-letter-pdf.js`** — `fileIcon` (`:45–50`): legg til `if (mimeType.startsWith('audio/')) return '🎙️';` før doc-fallback. (Liten konsistens-fiks i PDF-vedlegget; `fileRows` ellers uendret.)

### Uendret (bekreftet)
- `backend/send-email.js` — sender alle filer videre; malen håndterer splitting. Defekt-fil-håndtering (`:285–288`) dekker allerede edge casen. Ingen endring.
- `backend/send-brev.js`, `database/pg-cron.sql` — ingen endring.
- Signert-URL-gyldighet (30 dager) — ingen endring.
- `brev-viewer.html` og alt under `Landing page/` — urørt.
- Supabase schema/RLS/bucket — urørt.

---

## Valg jeg vil ha bekreftet før Steg 2
1. **Seksjon-overskrift:** «Taleopptak» (nøytral/tydelig) vs «Stemmer fra fortiden» (varmere/poetisk). Jeg viser begge i diff — du velger. (Engelsk motsvar: «Voice recordings» / «Voices from the past».)
2. **Mikrotekst over listen:** «Klikk for å lytte eller laste ned.» — OK? (EN: «Click to listen or download.»)
3. **Fallback-navn:** vise «Taleopptak N» når filnavnet er teknisk (`tale-…`), ellers vise filnavnet. OK?
4. **PDF-ikon-fiks** (`generate-letter-pdf.js`): ta med, eller la PDF være helt urørt i denne omgangen?

**STOPP — venter på godkjenning før Steg 2 (implementering).**
