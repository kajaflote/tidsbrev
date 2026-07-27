# Tidsbrev.no — Driftsguide

> Denne guiden er til deg som driver tjenesten. Her finner du svar på de viktigste spørsmålene om daglig drift, månedlige oppgaver og hva du gjør hvis noe går galt.

---

## Innholdsfortegnelse

1. [Oversikt over systemet](#1-oversikt-over-systemet)
2. [Innlogging og tilganger](#2-innlogging-og-tilganger)
3. [Admin-dashboardet — daglig bruk](#3-admin-dashboardet--daglig-bruk)
4. [Fysiske brev — manuell håndtering](#4-fysiske-brev--manuell-h%C3%A5ndtering)
5. [Månedlig sjekkliste](#5-m%C3%A5nedlig-sjekkliste)
6. [Hva gjør jeg hvis noe går galt?](#6-hva-gj%C3%B8r-jeg-hvis-noe-g%C3%A5r-galt)
7. [Miljøvariabler og konfigurasjon](#7-milj%C3%B8variabler-og-konfigurasjon)
8. [Filstruktur](#8-filstruktur)

---

## 1. Oversikt over systemet

Tidsbrev.no bruker følgende tjenester i produksjon:

| Tjeneste | Hva den gjør | Dashboard |
|---|---|---|
| **Netlify** | Hoster nettsiden og kjører backend-funksjoner | [app.netlify.com](https://app.netlify.com) |
| **Supabase** | Database (PostgreSQL) — lagrer ordre og brev | [supabase.com/dashboard](https://supabase.com/dashboard) |
| **Stripe** | Kortbetaling og webhooks | [dashboard.stripe.com](https://dashboard.stripe.com) |
| **Vipps** | Mobilbetaling | [portal.vipps.no](https://portal.vipps.no) |
| **Resend** | Sender alle e-poster | [resend.com](https://resend.com) |

### Prismodell

- **Digitalt brev:** 79 kr flat, uavhengig av leveringsdato
- **Fysisk brev:** 149 kr + 15 kr per ekstra år (1 år = 149 kr, 5 år = 209 kr, 10 år = 284 kr)

### Automatisk daglig jobb

Netlify kjører `backend/send-brev.js` daglig kl. **07:00 UTC (09:00 norsk tid)**. Denne funksjonen:
1. Finner alle digitale brev med `delivery_date = i dag` og `payment_status = paid` → sender e-post via Resend
2. Finner fysiske brev med `delivery_date = 30 dager frem` → sender deg en admin-påminnelse

Du trenger ikke å gjøre noe manuelt for digitale brev — de leveres automatisk.

---

## 2. Innlogging og tilganger

### Admin-dashbordet (admin.html)

Gå til `https://tidsbrev.no/admin.html`

- **Passord:** `tidsbrev2026`
- Passordet er hashet med SHA-256 i nettleseren — det sendes aldri til serveren
- For å bytte passord: generer en ny SHA-256-hash og oppdater `ADMIN_HASH`-konstanten i `admin.html`

  ```
  Generer hash online: https://emn178.github.io/online-tools/sha256.html
  ```

### Supabase

1. Logg inn på [supabase.com/dashboard](https://supabase.com/dashboard)
2. Velg prosjektet **tidsbrev**
3. Under **Table Editor** finner du tabellene `orders`, `letters`, `admin_log`

### Netlify

1. Logg inn på [app.netlify.com](https://app.netlify.com)
2. Velg prosjektet **tidsbrev-no**
3. Under **Functions** kan du se loggene for `send-brev`, `stripe-webhook`, m.fl.

---

## 3. Admin-dashboardet — daglig bruk

### Hva du ser

Øverst er fire statistikkort:
- Totalt antall betalte ordre og inntekt
- Ordre og inntekt denne måneden
- Antall brev som leveres de neste 30 dagene

Under kortene er en tabell med alle ordre. Du kan:
- **Søke** på navn, e-post eller ordrenummer
- **Filtrere** på status (pending / paid / failed), leveringstype (digitalt / fysisk) og måned
- **Klikke på en rad** for å se full ordredetalj, inkludert brevinnholdet

### Arbeidsflyt for en ny ordre

```
Kunde betaler → Webhook bekrefter → Ordre vises som "paid" i admin
```

Du trenger vanligvis ikke å gjøre noe — men det er lurt å sjekke dashbordet en gang om dagen de første ukene.

---

## 4. Fysiske brev — manuell håndtering

Fysiske brev krever manuell handling fra din side. Slik er flyten:

### Steg-for-steg

**30 dager før leveringsdato:**
Du mottar automatisk en e-post (admin-påminnelse) med oversikt over fysiske brev som skal postlegges.

**Hva du gjør:**

1. **Logg inn i admin-dashbordet** og filtrer på `fysisk` + måneden det gjelder
2. **Skriv ut brevet:** Klikk på ordren → kopier brevinnholdet → skriv ut eller skriv det for hånd
3. **Legg brevet i konvolutt:** Bruk en fin konvolutt — gjerne med Tidsbrev-logo om du har det
4. **Adresser konvolutten:**
   - Til: `[Mottakernavn]`, `[Gateadresse]`, `[Postnummer Poststed]`
   - Fra: Tidsbrev.no, [din adresse]
5. **Post brevet** via Posten med A-post (ankomst innen 1–3 virkedager)
6. **Marker som postet** i admin-dashbordet: Klikk "Marker som postet" i ordremodalen

### Tips

- Skriv brevet ut på pent papir (90 g/m² eller tykkere) for best inntrykk
- Ikke skriv leveringsdatoen på konvolutten — brevet skal bare leveres, ikke lagres av mottakeren
- Legg gjerne ved et lite kort som forklarer at dette er et tidsbrev fra [avsendernavn]

---

## 5. Månedlig sjekkliste

Gjør dette en gang i måneden (5–10 minutter):

### Økonomi og ordre

- [ ] Sjekk Stripe-dashbordet for eventuelle refusjoner eller tvister
- [ ] Bekreft at Netlify-fakturaen er betalt (automatisk, men sjekk)
- [ ] Bekreft at Supabase-fakturaen er betalt (automatisk)
- [ ] Se over admin-dashbordet: er det ordre som står som `pending` lenge? Følg opp manuelt

### Kommende brev

- [ ] Filtrer på fysiske brev de neste 3 månedene — planlegg utskriving
- [ ] Sjekk at `send-brev`-funksjonen kjørte uten feil (Netlify → Functions → send-brev → logs)

### Teknisk

- [ ] Sjekk `admin_log`-tabellen i Supabase for feil (`action LIKE 'email_failed%'`)
- [ ] Verifiser at Resend ikke har sendt deg varsler om avviste e-poster
- [ ] Se over Vipps-portal for eventuelle uavklarte transaksjoner

### Selvangivelse og bokføring

- [ ] Eksporter CSV fra admin-dashbordet for måneden (knapp øverst til høyre)
- [ ] Lagre CSV-en i regnskapsmappen din

---

## 6. Hva gjør jeg hvis noe går galt?

### Et digitalt brev ble ikke sendt

1. Sjekk `admin_log` i Supabase: `SELECT * FROM admin_log WHERE action LIKE '%email%' ORDER BY created_at DESC LIMIT 20`
2. Sjekk Resend-dashbordet for bounced/failed e-poster
3. Send brevet manuelt: logg inn i Supabase → `letters`-tabellen → kopier innholdet → send via e-post

### En kunde hevder å ikke ha mottatt ordrebekreftelse

1. Sjekk `admin_log` for `email_failed_order_confirmation` med kundens `order_id`
2. Finn e-postadressen i `orders`-tabellen
3. Send ordrebekreftelse manuelt via tidsbrev@outlook.com

### Stripe-webhook stopper å fungere

1. Gå til Stripe-dashboard → Developers → Webhooks
2. Sjekk at webhook-URL er `https://tidsbrev.no/api/stripe-webhook`
3. Se på feilloggene — ofte er det en ugyldig webhook-hemmelighet
4. Hent ny `STRIPE_WEBHOOK_SECRET` og oppdater i Netlify-miljøvariabler

### Kunden vil ha refusjon

- **Innen 14 dager (angrerett):** Gå til Stripe-dashboard → Payments → finn betalingen → klikk "Refund"
- Slett deretter ordren i Supabase (eller sett `payment_status = 'refunded'`)

### Netlify-bygget feiler

1. Gå til Netlify → Deploys og se på feilmeldingen
2. Vanlige årsaker: manglende npm-pakke, syntaksfeil i en backend-funksjon
3. Sjekk at `package.json` i `backend/` inneholder alle avhengigheter: `stripe`, `@supabase/supabase-js`, `resend`

---

## 7. Miljøvariabler og konfigurasjon

Alle hemmeligheter settes i **Netlify → Site settings → Environment variables**.

| Variabel | Beskrivelse | Hvor finner du den? |
|---|---|---|
| `STRIPE_SECRET_KEY` | Stripe hemmelig nøkkel | Stripe → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Webhook-signaturhemmelighet | Stripe → Developers → Webhooks |
| `SUPABASE_URL` | URL til Supabase-prosjektet | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Service Role-nøkkel (hemmelig!) | Supabase → Settings → API |
| `RESEND_API_KEY` | API-nøkkel for e-postutsending | Resend → API Keys |
| `EPOST_AVSENDER` | Avsendernavn og -adresse | `"Tidsbrev <tidsbrev@outlook.com>"` |
| `ADMIN_EPOST` | Din e-post for admin-varsler | din@epost.no |
| `SIDE_URL` | Full URL til nettsiden | `https://tidsbrev.no` |
| `VIPPS_CLIENT_ID` | Vipps klient-ID | Vipps-portal → Utvikler |
| `VIPPS_CLIENT_SECRET` | Vipps klient-hemmelighet | Vipps-portal → Utvikler |
| `VIPPS_SUBSCRIPTION_KEY` | Vipps abonnementsnøkkel | Vipps-portal → Utvikler |
| `VIPPS_MSN` | Merchant Serial Number | Vipps-portal → Salgsstedet mitt |
| `VIPPS_MILJO` | `test` eller `production` | — |

### Offentlig konfigurasjon (js/config.js)

Filen `js/config.js` inneholder verdier som er trygge å vise i nettleseren:
- `SUPABASE_URL` og `SUPABASE_ANON_KEY` (anon-nøkkelen er offentlig)
- `STRIPE_PUBLISHABLE_KEY` (starter med `pk_`)
- Prismodell og produktkonfigurasjon

For å aktivere Vipps: sett `const VIPPS_ACTIVE = true` i `js/config.js`.

---

## 8. Filstruktur

```
Web page/
├── index.html              ← Markedsføringsside (landing page)
├── bestill.html            ← Bestillingsskjema (5 steg)
├── takk.html               ← Bekreftelses-/takkeside etter betaling
├── feil.html               ← Feilside ved mislykket betaling
├── admin.html              ← Passordbeskyttet admin-dashboard
├── personvern.html         ← GDPR-personvernerklæring
├── vilkaar.html            ← Vilkår og betingelser
├── faq.html                ← Ofte stilte spørsmål
├── README.md               ← Denne filen
│
├── js/
│   ├── config.js           ← Offentlig konfigurasjon og prisberegning
│   ├── nav.js              ← Felles navigasjon og footer (injiseres i sider)
│   ├── supabase.js         ← Supabase-klient for frontend
│   ├── utils.js            ← Hjelpefunksjoner (datoformatering osv.)
│   ├── skjema.js           ← Skjema-validering og bestillingslogikk
│   ├── stripe.js           ← Stripe-integrasjon frontend
│   └── vipps.js            ← Vipps-integrasjon frontend
│
├── backend/
│   ├── create-stripe-session.js   ← Oppretter Stripe Checkout-sesjon
│   ├── stripe-webhook.js          ← Mottar Stripe-betalingsbekreftelse
│   ├── create-vipps-payment.js    ← Starter Vipps-betaling
│   ├── vipps-callback.js          ← Mottar Vipps-betalingsbekreftelse
│   ├── send-email.js              ← Sender e-poster via Resend
│   ├── send-brev.js               ← Daglig jobb: leverer brev og sender påminnelser
│   └── email-templates.js         ← HTML-maler for alle e-posttyper
│
├── database/
│   ├── schema.sql          ← Full database-skjema (kjøres én gang ved oppsett)
│   └── pg-cron.sql         ← Alternativ til Netlify Scheduled Function
│
└── netlify.toml            ← Netlify-konfigurasjon (build, redirects, cron)
```

---

## Hurtigreferanse

| Oppgave | Hvor |
|---|---|
| Se alle ordre | admin.html |
| Eksporter ordre til Excel | admin.html → CSV-knapp |
| Refunder en betaling | Stripe-dashboard → Payments |
| Endre passord til admin | admin.html → `ADMIN_HASH`-konstanten |
| Se e-postlogger | Resend-dashboard → Emails |
| Se function-logger | Netlify → Functions → [funksjonsnavn] → Logs |
| Se databasefeil | Supabase → Table Editor → admin_log |
| Aktivere Vipps | `js/config.js` → sett `VIPPS_ACTIVE = true` |

---

*Spørsmål? Noe som ikke stemmer? Alt er skrevet av et menneske (med litt hjelp av AI), og ingenting er perfekt. Ta kontakt med tidsbrev@outlook.com om du trenger hjelp.*
