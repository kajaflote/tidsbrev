# UNDERSØKELSE: Kan vi legge til taleopptak i Tidskapsell?

Dette er en ren undersøkelsesrapport. Ingen filer er endret, ingen pakker installert, ingen deploy gjort. Alle funn er hentet fra dagens kodebase i `Web page\`.

---

## 1. Frontend — Tidskapsell-flyten (`bestill.html`)

**Opplastings-input:**
- `bestill.html:923` — `<input type="file" id="fileInput" multiple accept=".jpg,.jpeg,.png,.gif,.webp,.mp4,.mov,.avi" style="display:none"/>`. Lyd-filtyper finnes ikke i `accept`.
- `bestill.html:910–924` — drag-drop-sonen `#upload-area` / `#uploadZone`.
- `bestill.html:922` — hint-teksten: «JPG, PNG, GIF, WebP, MP4, MOV, AVI · maks 1 GB totalt · maks 10 filer».
- `bestill.html:926–932` — `#fileList` (filliste) og `#uploadProgress` (progressbar `#uploadFill`, status `#uploadStatusText`).
- `bestill.html:934–941` — personlig melding `<textarea id="message_content">` (maxlength 500).

**Aksepterte MIME/extensions (JS-validering):**
- `bestill.html:1129–1133` — konstantene:
  - `MAX_TOTAL_BYTES = 1024*1024*1024` (1 GB)
  - `MAX_FILES = 10`
  - `ACCEPTED_TYPES = ['image/jpeg','image/png','image/gif','image/webp','video/mp4','video/quicktime','video/x-msvideo']`
  - `ACCEPTED_EXT = ['.jpg','.jpeg','.png','.gif','.webp','.mp4','.mov','.avi']`
  - `let pendingFiles = []`
- Ingen `audio/*` i noen av listene.

**Validering:**
- `addFiles(newFiles)` `bestill.html:1722` — sjekker filtype (1726–1734), maks antall filer (1736–1741), maks total størrelse (1743–1749).

**Preview/progress:**
- `renderFileList()` `bestill.html:1695` — bilde får `<img>`-thumbnail via `URL.createObjectURL` (1754), video får play-ikon-SVG. **Ingen lyd-håndtering** — en lydfil ville i dag falle gjennom til video/ukjent-grenen uten egnet visning.

**Whitespace der et «spill inn tale»-element kan plasseres:**
- Inne i form-kortet `#upload-area` (910–943), naturlig plass: **etter** opplastingssonen (linje 924) og **før** `#fileList` (926), eller alternativt etter meldingsfeltet. Et nytt opptaks-element kan settes inn her uten å flytte eksisterende elementer.

---

## 2. Backend / Supabase

**Hvilken funksjon håndterer opplasting:**
- **Ingen dedikert opplastings-Function finnes.** Klienten laster opp **direkte til Storage** med anon-nøkkel:
  - `uploadAllFiles(orderId)` `bestill.html:1778` → `bestill.html:1802–1804` `window.db.storage.from('tidskapsell-uploads').upload(path, item.file, {upsert:false})`.
  - Sti: `bestill.html:1801` `${orderId}/${Date.now()}-${item.file.name}`.
  - Etter opplasting samles `{path,name,size,type}` og metadata lagres på ordren av betalings-funksjonene (`create-stripe-session.js` / `create-vipps-payment.js`).

**Hvordan fil-referanser lagres (tabell/kolonner/datatyper):**
- `schema.sql:279–287` — tabell `tidskapsell_files`:
  - `id UUID PK`
  - `order_id UUID FK → orders ON DELETE CASCADE`
  - `file_path TEXT`
  - `file_name TEXT`
  - `file_size BIGINT`
  - `mime_type TEXT`
  - `created_at`
- **`mime_type` er generisk TEXT** → lagrer allerede hvilken som helst lyd-MIME. **Ingen skjema-endring nødvendig** for å lagre metadata om en lydfil.

**Støtter skjemaet en ny filtype:**
- Ja, metadatamessig. Tabellen er filtype-agnostisk. Det er ingen ENUM eller CHECK som begrenser `mime_type`.

**Bucket-RLS / `tidskapsell-uploads` (tillater audio-MIME?):**
- `schema.sql:14–27` — manuelle dashboard-notater: bucket `tidskapsell-uploads` er **PRIVAT**, tillatte MIME-typer = `image/jpeg, image/png, image/gif, image/webp, video/mp4, video/quicktime, video/x-msvideo`, maks filstørrelse 1 GB.
- **Audio er IKKE i tillatt-listen** → opplasting av lyd blokkeres på bucket-nivå inntil listen oppdateres i Supabase-dashboardet.
- `schema.sql:324–329` — RLS på tabellen `tidskapsell_files`: service_role har full tilgang, anon kan ikke lese.
- **Viktig:** anon-INSERT-policyen for selve Storage-bucketen er konfigurert i **dashboardet**, ikke i repo-SQL. Det er derfor klient-opplasting virker. For lyd må både (a) bucketens tillatt-MIME-liste og (b) eventuelle MIME-begrensninger i storage-policyen oppdateres i dashboardet.

---

## 3. E-postlevering

**Hvordan Tidskapsell-innhold leveres i dag:**
- `send-email.js:249` — `case 'deliver_tidskapsell'`.
- `send-email.js:283` — `.createSignedUrl(file.file_path, 60 * 60 * 24 * 30)` → **30-dagers signerte nedlastingslenker** per fil.
- Bygger `fileLinks`, kaller `templates.deliverTidskapsell({order, files, personalMessage, lang})`, vedlegger PDF via `generateCapsulePdf` (317–318), returnerer `filesDelivered` (351).
- **Levering skjer via nedlastingslenker, ikke innebygget media.**

**Maler:**
- `email-templates.js:883` — `deliverTidskapsell` (norsk).
- `email-templates.js:804` — `deliverTidskapsellEN` (engelsk, lagt til i forrige fase).
- Ikon-logikk `email-templates.js:812–813` og `893–894`: `const isVideo = f.type && f.type.startsWith('video/'); const icon = isVideo ? '&#9654;' : '&#128247;';` → en lydfil ville i dag få **kamera-ikonet** (feil symbol for lyd).

**Hvordan audio bør leveres:**
- **Inline `<audio>` i e-post er upålitelig** — Gmail, Outlook og de fleste klienter stripper `<audio>`/`<video>`-tags. Bør IKKE satses på.
- **Anbefalt: nedlastingslenke** (samme mønster som i dag, signert URL). Robust og krever minimal endring.
- **Bedre opplevelse: avspilling i viewer** — `brev-viewer.html` kan vise en `<audio controls>`-spiller med signert URL, slik at mottaker hører opptaket i nettleser uten å laste ned. Dette krever frontend-arbeid i viewer, men er teknisk rett frem.

---

## 4. Teknisk vurdering av selve innspillingen

**MediaRecorder-nettleserstøtte:**
- Chrome/Edge/Firefox (desktop + Android): god støtte, typisk `audio/webm;codecs=opus`.
- **Safari (macOS + iOS):** MediaRecorder støttes fra Safari 14.1+, MEN Safari produserer **ikke** webm — den gir `audio/mp4` (AAC). Koden må derfor **feature-detektere** med `MediaRecorder.isTypeSupported(...)` og velge format dynamisk, ellers feiler innspilling på iPhone/iPad.
- iOS Safari krever at opptak startes som respons på en brukergest (tap), og at siden kjører over HTTPS (oppfylt på tidsbrev.no).

**Realistiske filstørrelser (1–10 min):**
- Opus ~48–64 kbps (tale): ~0,4–0,5 MB/min → 1 min ≈ 0,5 MB, 10 min ≈ 4–5 MB.
- AAC (Safari) ~64–128 kbps: ~0,5–1 MB/min → 10 min ≈ 6–10 MB.
- MP3 128 kbps: ~1 MB/min → 10 min ≈ 10 MB.
- **Konklusjon:** typiske taleopptak er små (single-digit MB), godt innenfor 1 GB-kvoten.

**Anbefalt output-format (trade-offs):**
- **webm/opus:** minst filstørrelse, beste tale-komprimering, men IKKE støttet av Safari for opptak og dårlig avspilling i Safari/iOS.
- **m4a/aac:** Safari-native, god kvalitet, bredt avspillbart (inkl. iOS), litt større enn opus.
- **mp3:** mest universelt avspillbart overalt, men MediaRecorder produserer normalt ikke mp3 direkte (krever ekstra encoder-bibliotek).
- **Anbefaling:** la MediaRecorder produsere det nettleseren støtter (opus på Chrome/Firefox, mp4/aac på Safari) og lagre som-er. For maksimal avspillbarhet på tvers kan man eventuelt konvertere til mp3/m4a server-side — men dette er valgfritt, ikke nødvendig.

**Trengs server-side konvertering:**
- **Ikke strengt nødvendig.** `<audio>`-spilleren i en moderne nettleser spiller både opus-webm og aac-mp4. For nedlasting fungerer begge i mediespillere.
- Eksisterende ffmpeg-mønster finnes: `convert-video-background.js` (Netlify Background Function, opptil 15 min) med ffmpeg-tilgjengelighetssjekk `convert-video-background.js:78–98` (`execSync('ffmpeg -version')`; logger `video_conversion_no_ffmpeg` og **hopper over** hvis utilgjengelig). **ffmpeg er sannsynligvis ikke tilgjengelig på standard Netlify-runtime** → audio-konvertering via samme mønster ville trolig være en no-op. Derfor: ikke regn med server-konvertering; design for at filen lagres i nettleserens native format.

---

## 5. Påvirkning på 1 GB / 10-fil-kvoten

- Taleopptak går naturlig inn i **samme** `tidskapsell_files`-tabell og samme bucket → **samme kvote** med mindre man bevisst skiller dem.
- Et opptak på 2–10 min veier ~0,5–10 MB. To opptak à ~5 MB ≈ **10 MB** — neglisjerbart mot 1 GB.
- **Alternativ:** egen kvote for lyd (f.eks. maks N opptak / maks total opptakstid) for å unngå at lange opptak spiser bildekvoten. Men gitt de små størrelsene er dette mest et UX-/produktvalg, ikke et lagringsbehov.
- **Lagringskostnad (estimat):** Supabase Storage ~0,021 USD/GB/måned. 2 opptak × 5 MB = 10 MB ≈ **0,0002 USD/måned per ordre**. Selv ved 30 års lagring: ~0,08 USD per ordre i akkumulert lagringskostnad. **Kostnaden er ubetydelig.** Egress (nedlasting) er den eneste reelle variabelen, men også her er filene små.

---

## 6. Pris/posisjonering (kun observasjoner)

- Dagens Tidskapsell-pris: `js/config.js:106–107` — `PRIS_TIDSKAPSELL_BASE: 149`, `PRIS_TIDSKAPSELL_PER_AAR: 49` (eksempel `config.js:98`: «Tidskapsell 10 år: 149 + 10×49 = 639 kr»).
- **Inkludert i nåværende pris:** lav teknisk merkostnad (lagring ~0). Taleopptak kan inkluderes uten å endre prismodellen — gir økt opplevd verdi («legg ved en stemmehilsen») uten ny prislogikk.
- **Som oppsalg:** et eget tillegg (f.eks. +X kr for «stemmehilsen») er mulig, men krever ny prislinje i `config.js` og i begge betalingsfunksjonene, samt UI for tilvalg.
- **Eget produkt («Stemmebrev»):** lyd kunne markedsføres som egen produktkategori ved siden av digitalt/fysisk/tidskapsell. Dette er teknisk større (ny produkttype i validering, prising, e-postmaler, viewer) men gir tydeligst posisjonering. Ikke nødvendig for en MVP der lyd bare er enda en filtype i Tidskapsell.
- Disse er observasjoner, ikke anbefalte beslutninger.

---

## 7. UX-skisse (kun ord, ingen kode)

Plasseres inne i Tidskapsell-opplastingskortet, etter drag-drop-sonen og før fillisten:

- En egen, lett avgrenset «Spill inn en hilsen»-rad i samme kortstil (kremfarget bakgrunn, burgunder overskrift i Playfair Display, hjelpetekst i Inter).
- En rund opptaksknapp i burgunder med mikrofonikon. Ved trykk: knappen blir skoggrønn/«aktiv», en enkel tidsteller (mm:ss) i Caveat-aksent og en diskret pulserende indikator viser at opptak pågår.
- Etter stopp: en innebygd lyd-avspiller (standard `<audio controls>` stylet diskret), filnavn/varighet, samt «Bruk opptak» og «Spill inn på nytt». «Bruk opptak» legger filen i den eksisterende `pendingFiles`/fillisten på lik linje med bilder/video.
- I fillisten får lydfiler et **eget ikon** (mikrofon/lydbølge) i stedet for dagens kamera/play, og viser varighet i stedet for bilde-thumbnail.
- Hjelpetekst forklarer kort: maks lengde, at opptaket lagres trygt og leveres på leveringsdatoen. Designtokens (krem, burgunder, skoggrønn, gull; Playfair Display / Caveat / Inter) gjenbrukes uendret, slik at elementet ser ut som en naturlig del av siden.
- Mobil: stor trykkflate for opptaksknappen, tydelig mikrofon-tillatelses-flyt.

---

## 8. Risikoer og blokkere

- **Bucket-MIME-liste (blokker):** lyd avvises på Storage-nivå til tillatt-MIME-listen oppdateres i Supabase-dashboardet (`schema.sql:14–27`). Dette er en forutsetning, ikke kode.
- **Storage anon-INSERT-policy:** dersom policyen begrenser MIME, må den utvides i dashboardet (ikke i repo-SQL).
- **Safari/iOS-format:** MediaRecorder gir mp4/aac, ikke webm — krever feature-detect, ellers feiler iPhone-opptak. Reell, men håndterbar.
- **E-postklienter:** inline `<audio>` strippes av de fleste → må bruke nedlastingslenke eller viewer-avspilling. Allerede løst med eksisterende signert-URL-mønster.
- **Mobil mikrofon-tillatelse:** brukeren må gi tillatelse; må håndtere avslag (vis tydelig feilmelding/fallback til filopplasting).
- **GDPR / personvern:** taleopptak er biometri-nært/sensitivt — stemme kan identifisere person. Krever tydelig samtykke ved innspilling, lagringsperiode-info, og sletteflyt. Bør nevnes i personvernerklæring. Høyere personvernfølsomhet enn bilde/video.
- **Juridisk ved arv/levering:** lyd som leveres år frem i tid (potensielt etter avsenders død) bør beskrives i vilkår; ingen ny teknisk blokker, men en innholds-/vilkårsoppgave.
- **Supabase Storage-grenser:** ubetydelig for filstørrelsene; ingen reell blokker.
- **Kostnad:** neglisjerbar (se punkt 5).
- **ffmpeg på Netlify:** sannsynligvis utilgjengelig → ikke design avhengig av server-konvertering.

---

## Anbefaling i én setning

Legg taleopptak inn som **enda en filtype i den eksisterende Tidskapsell-flyten** (MediaRecorder i nettleser → direkte til samme Storage-bucket → levering via signert lenke + valgfri `<audio>`-avspiller i viewer), siden datamodellen allerede støtter det og den eneste reelle forutsetningen er å åpne bucketens tillatt-MIME-liste for lyd i Supabase-dashboardet.

## Estimert implementeringsomfang

**M (medium).** Ingen DB-skjemaendring (`mime_type TEXT` er allerede generisk) og lagringskostnaden er neglisjerbar, men arbeidet spenner over flere lag: (a) frontend opptaks-UI med MediaRecorder og Safari/iOS-formathåndtering, (b) utvide `ACCEPTED_TYPES`/`ACCEPTED_EXT` + preview/ikon for lyd i `bestill.html`, (c) dashboard-konfig av bucketens tillatt-MIME og storage-policy (manuelt), (d) lyd-ikon i e-postmaler og evt. `<audio>`-spiller i `brev-viewer.html`, samt (e) personvern/vilkår-tekst. Hver del er liten, men summen og kravet om pixel-identisk design + Safari-testing løfter det til M snarere enn S.
