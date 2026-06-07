# IMPL-plan: Taleopptak i Tidskapsell (Steg 1 — kartlegging + plan, INGEN edits gjort)

Denne planen er kun kartlegging. Ingen filer er endret. Vent på godkjenning før Steg 2.

---

## a) Kartlegging (filsti + linjenummer)

### HTML-blokk for tidskapsell-opplastingsfelt
- `bestill.html:910–943` — hele `#upload-area` (vises kun for tidskapsell), inni et `.form-card`.
  - `bestill.html:912` — feilmelding-felt `#form-error-upload`.
  - `bestill.html:914–924` — drag-drop-sonen `.upload-zone` `#uploadZone` med SVG, tekst, hint og skjult `<input type="file" id="fileInput">`.
  - `bestill.html:922` — hint-tekst (filtyper).
  - `bestill.html:923` — `accept=".jpg,.jpeg,.png,.gif,.webp,.mp4,.mov,.avi"`.
  - `bestill.html:926` — `#fileList .file-list` (filchips).
  - `bestill.html:927–932` — `#uploadProgress` (progressbar).
  - `bestill.html:934–941` — personlig hilsen `<textarea id="message_content">`.

### JS-funksjon som validerer valgte filer (filtype, antall, total størrelse)
- `addFiles(newFiles)` `bestill.html:1722–1759`.
  - Filtype-sjekk: `bestill.html:1726–1734` (mot `ACCEPTED_TYPES` / `ACCEPTED_EXT`).
  - Maks antall: `bestill.html:1736–1741` (`MAX_FILES`).
  - Maks total størrelse: `bestill.html:1743–1749` (`MAX_TOTAL_BYTES`).
  - Legger til i `pendingFiles` + lager preview for bilder: `bestill.html:1751–1757`.
- Konstanter: `bestill.html:1129–1133`
  - `MAX_TOTAL_BYTES = 1 GB`, `MAX_FILES = 10`
  - `ACCEPTED_TYPES` (ingen audio), `ACCEPTED_EXT` (ingen audio)
  - `let pendingFiles = []`

### JS-funksjon som laster opp til Supabase Storage
- `uploadAllFiles(orderId)` `bestill.html:1778–1824`.
  - Laster opp klient-direkte: `bestill.html:1802–1804` `window.db.storage.from('tidskapsell-uploads').upload(path, item.file, {upsert:false})`.
  - Sti: `bestill.html:1801` `${orderId}/${Date.now()}-${item.file.name}`.
  - Samler `{path, name, size, type}` per fil: `bestill.html:1809` (`type: item.file.type`).
  - Lagrer resultatet i `state.uploaded_files`: `bestill.html:1821`.

### JS/Function som skriver rad til `tidskapsell_files`
- **Klienten skriver IKKE selv.** Frontend sender `payload.uploaded_files = state.uploaded_files` ved betaling: `bestill.html:1635`.
- Backend skriver radene:
  - `create-stripe-session.js:214–225` — mapper `uploaded_files` → rader `{order_id, file_path, file_name, file_size, mime_type}` og inserter i `tidskapsell_files`. **`mime_type` settes fra `f.type`** (linje 221).
  - `create-vipps-payment.js` — tilsvarende mønster (lagrer fil-metadata).
- Tabell: `schema.sql:279–287`, `mime_type TEXT` (generisk → audio-MIME lagres uten endring).

### Hvordan eksisterende UI viser "filchips"
- `renderFileList()` `bestill.html:1695–1720`.
  - `bestill.html:1698` — `isVideo = f.file.type.startsWith('video/')`.
  - `bestill.html:1699–1703` — thumbnail: bilde → `<img class="file-thumb">`, video → play-ikon-SVG i `.file-thumb-video`, **ellers tom** (ingen audio-gren i dag).
  - `bestill.html:1704–1711` — chip-markup: filnavn, størrelse, fjern-kryss (waiting), check (done), feil (error).
  - `bestill.html:1714–1719` — fjern-knapp-handler (filtrerer `pendingFiles`).

### Nøkkelinnsikt for integrasjon
- En innspilt lyd må bli et **`File`-objekt** (`new File([blob], navn, {type: mime})`) slik at `item.file.name`, `.size` og `.type` finnes — da flyter alt gjennom eksisterende `uploadAllFiles` og backend-insert helt uendret.
- Ved å la "Behold opptak" kalle eksisterende `addFiles([file])`, gjenbrukes ALL validering (filtype, antall, total størrelse) og kvotelogikk automatisk.

---

## b) Foreslått plassering for opptaks-UI

**Plassering:** rett etter `.upload-zone` (lukkes `bestill.html:924`) og **før** `#fileList` (`bestill.html:926`), inne i samme `.form-card`.

- Dette er naturlig tom kant mellom drag-drop-sonen og fillisten — ingen eksisterende elementer flyttes.
- Opptaks-resultatet havner i samme `#fileList` som bilder/video (via `addFiles`), så det visuelle flyter sammen med eksisterende design.
- Begrunnelse for at det ikke endrer layout: blokken settes inn som et nytt søsken-element i en eksisterende vertikal stabling inne i `.form-card`. Alt over (upload-zone) og under (fileList, progress, melding) beholder rekkefølge og styling.

**Tekst-policy:** jeg rører IKKE den eksisterende hint-teksten (`bestill.html:922`) eller `accept`-attributtet (`bestill.html:923`). Opptak er en egen, separat sti. (Se note i punkt c om at audio likevel må inn i `ACCEPTED_TYPES` for at den innspilte fila skal passere `addFiles`-valideringen — dette påvirker ikke synlig tekst.)

---

## c) Diff-plan (ingen kode skrevet enda)

### Nye filer
1. **`Web page/js/audio-recorder.js`** — selvstendig nettleser-modul (ingen npm):
   - MIME feature-detect: `audio/webm;codecs=opus` → `audio/mp4` → `audio/webm`.
   - `startRecording()` (getUserMedia + MediaRecorder), `stopRecording()` (returnerer Blob).
   - Timer-callback (MM:SS), `MAX_DURATION = 5 min` med auto-stopp.
   - Feilhåndtering (NotAllowedError, NotFoundError, ev. manglende støtte) → varme norske meldinger.
   - Eksponerer et lite API (f.eks. `window.AudioRecorder`) som `bestill.html` bruker.

### Endrede filer
2. **`bestill.html`** — kun additive blokker:
   - **HTML** (mellom linje 924 og 926): nytt opptaks-panel med
     - primærknapp «🎙️ Spill inn tale»
     - skjult opptaks-tilstand (stopp-knapp + live timer MM:SS + pulsende burgunder-prikk)
     - skjult preview-panel (`<audio controls>`, «Spill inn på nytt», «Behold opptak»)
   - **`<script src="js/audio-recorder.js">`** lastes inn (sammen med eksisterende scripts).
   - **JS-konstanter** (`bestill.html:1131–1132`): legg audio-MIME inn i `ACCEPTED_TYPES` (`audio/webm`, `audio/mp4`, `audio/ogg`, `audio/mpeg`) og audio-ext i `ACCEPTED_EXT` (`.webm`, `.m4a`, `.mp3`, `.ogg`) slik at innspilt fil passerer `addFiles`. *(Kun array-utvidelse, ingen endring av eksisterende verdier.)*
   - **`renderFileList()`** (`bestill.html:1698–1703`): legg til en `isAudio`-gren som gir mikrofon-ikon i `.file-thumb` (gjenbruker eksisterende `.file-thumb`-klasse). Eksisterende bilde/video-grener urørt.
   - **Ny liten JS-blokk** (ved siden av eksisterende upload-handlere, ~`bestill.html:1770`): wire opp opptaksknappene → bruker `audio-recorder.js`, og «Behold opptak» bygger `new File([blob], 'tale-<timestamp>.<ext>', {type: mime})` og kaller `addFiles([file])`.
   - **Kvote-deaktivering (2c):** liten `updateRecordButtonState()` kalt fra `renderFileList()` og etter `addFiles` → deaktiverer «Spill inn tale» når `pendingFiles.length >= MAX_FILES`, med tooltip «Du har nådd maks antall vedlegg».
   - **CSS:** kun nye klasser for opptaks-UI i eksisterende `<style>`-blokk, basert på eksisterende variabler (`--forest`, burgunder, `--muted` osv.) og fonter. Ingen eksisterende regel endres.

### IKKE endret
- `create-stripe-session.js`, `create-vipps-payment.js` — fungerer som-er (mapper `f.type` → `mime_type`).
- `schema.sql`, RLS, bucket-config — gjort manuelt utenfor.
- Hint-tekst (`bestill.html:922`) og `accept`-attributt (`bestill.html:923`) — urørt.
- `Landing page/` — urørt.

### Filnavn-mønster (2d)
- `tale-{ISO-timestamp-uten-kolon}.{ext}`, ext = `webm` (Chrome/Firefox) eller `m4a` (Safari/`audio/mp4`).

---

## Avklarte valg (bekreftet av bruker)
1. **Opptak + filopplasting:** kunder skal BÅDE kunne spille inn OG laste opp ferdige lydfiler.
   - Konsekvens: legg audio-extensions inn i `accept`-attributtet (`bestill.html:923`): `.webm,.m4a,.mp3,.ogg` (i tillegg til eksisterende).
   - Konsekvens: oppdater hint-teksten til å nevne lyd, f.eks. «… MP4, MOV, AVI, M4A, MP3 · maks 1 GB totalt · maks 10 filer». Tre steder holdes i synk: inline-fallback `bestill.html:922`, norsk nøkkel `js/i18n.js:219` og engelsk nøkkel `js/i18n.js:603`. Ingen andre tekster/nøkler endres.
2. **Ikon:** emoji 🎙️ brukes både i «Spill inn tale»-knappen og som thumbnail i filchip-en.

**STOPP — venter på din endelige godkjenning før jeg starter Steg 2 (implementering).**
