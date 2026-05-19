// ================================================================
// Tidsbrev.no — Internasjonalisering (i18n)
// ================================================================
// Norsk (no) er standardspråk. Engelsk (en) er oversettelse.
// Språkvalg lagres i localStorage som 'tidsbrev_lang'.
//
// Bruk data-i18n="key" på HTML-elementer for tekstinnhold.
// Bruk data-i18n-html="key" for innhold med HTML-markup.
// Bruk data-i18n-placeholder="key" for input-placeholder.
// ================================================================

const TRANSLATIONS = {

// ────────────────────────────────────────────────────────────────
// NORSK — matcher eksisterende tekst nøyaktig
// ────────────────────────────────────────────────────────────────
no: {

  // ── Nav (nav.js) ──
  nav_home: 'Hjem',
  nav_order: 'Bestill',
  nav_faq: 'FAQ',
  nav_order_cta: 'Bestill brev',
  nav_back: 'Tilbake til forsiden',

  // ── Footer (nav.js) ──
  footer_tagline_html: 'Brev til fremtiden,<br>skrevet i dag.',
  footer_pages: 'Sider',
  footer_info: 'Info',
  footer_home: 'Hjem',
  footer_order: 'Bestill brev',
  footer_faq: 'Ofte stilte spørsmål',
  footer_privacy: 'Personvernerklæring',
  footer_terms: 'Vilkår og betingelser',
  footer_copy: 'Norsk drift',
  footer_eu: 'Lagret sikkert i EU  ·  GDPR-trygt',

  // ── Index — hero ──
  idx_hero_eyebrow: '~ et brev til fremtiden ~',
  idx_hero_title_html: 'Skriv ordene i dag.<br><em>La tiden levere dem.</em>',
  idx_hero_lead: 'Tidsbrev lar deg skrive et brev som leveres på nøyaktig riktig dato — om ett, ti eller tretti år. Til deg selv, til barnet ditt, eller til noen du er glad i.',
  idx_hero_cta: 'Skriv ditt første brev',

  // ── Index — nav (custom) ──
  idx_nav_how: 'Hvordan det fungerer',
  idx_nav_letters: 'Våre brev',
  idx_nav_cta: 'Skriv brev',

  // ── Index — how it works ──
  idx_how_eyebrow: 'så enkelt er det',
  idx_how_title: 'Tre steg til et tidsbrev',
  idx_how_lead: 'Vi tar vare på ordene dine helt til det rette øyeblikket.',
  idx_step1_title: '1. Skriv brevet',
  idx_step1_text: 'Ta deg tid. Skriv fra hjertet. Velg hvem det skal til og når det skal leveres — om 1 til 30 år.',
  idx_step2_title: '2. Vi tar vare på det',
  idx_step2_text: 'Brevet krypteres og lagres sikkert i vårt norske arkiv frem til leveringsdatoen du har valgt.',
  idx_step3_title: '3. Det ankommer',
  idx_step3_text: 'På valgt dato leveres brevet — digitalt på e-post eller som et ekte brev i en vakker konvolutt i posten.',

  // ── Index — products ──
  idx_prod_eyebrow: 'våre brev',
  idx_prod_title: 'Velg ditt tidsbrev',
  idx_prod_lead: 'Fra et enkelt minnesbrev til en hel livshistorie — vi har en form for hvert øyeblikk.',
  idx_prod_digital_title: 'Digitalt Brev',
  idx_prod_digital_subtitle: 'Skrives og mottas digitalt',
  idx_prod_digital_note: '99 kr start + 19 kr/år lagringsavgift',
  idx_prod_digital_li1: 'Skrives direkte i nettleseren',
  idx_prod_digital_li2: 'Leveres på e-post på valgt dato',
  idx_prod_digital_li3: 'Sikker kryptering og lagring',
  idx_prod_digital_li4: 'Til deg selv eller noen du er glad i',
  idx_prod_digital_btn: 'Velg Digitalt',
  idx_prod_physical_badge: 'Mest personlig',
  idx_prod_physical_title: 'Fysisk Brev',
  idx_prod_physical_subtitle: 'Personlig og håndfast brev',
  idx_prod_physical_note: '249 kr start + 29 kr/år lagringsavgift',
  idx_prod_physical_li1: 'Du sender brevet fysisk til oss',
  idx_prod_physical_li2: 'Vi lagrer og sender det på valgt dato',
  idx_prod_physical_li3: 'Til deg selv eller noen du er glad i',
  idx_prod_physical_li4: 'Innpakkes i vakker konvolutt (+79 kr)',
  idx_prod_physical_btn: 'Velg Fysisk',
  idx_prod_capsule_badge: 'Nytt',
  idx_prod_capsule_title: 'Tidskapsell',
  idx_prod_capsule_subtitle: 'Bilder og video til fremtiden',
  idx_prod_capsule_note: '149 kr start + 49 kr/år lagringsavgift',
  idx_prod_capsule_li1: 'Last opp bilder, video og dokumenter',
  idx_prod_capsule_li2: 'Leveres digitalt på valgt dato',
  idx_prod_capsule_li3: 'Opptil 1 GB lagringsplass',
  idx_prod_capsule_li4: 'Legg ved en personlig melding',
  idx_prod_capsule_btn: 'Velg Tidskapsell',
  idx_price_explainer_html: '<strong style="color:var(--ink);">Hvordan prisen fungerer:</strong> Du betaler en startpris når du bestiller, pluss en liten årlig lagringsavgift for hvert år brevet oppbevares. Eksempel: et digitalt brev levert om 5 år koster 99 kr + (4 &times; 19 kr) = <strong style="color:var(--burgundy)">175 kr</strong> totalt.',

  // ── Index — occasions ──
  idx_occ_eyebrow: 'for alle øyeblikk',
  idx_occ_title: 'Hva feirer du?',
  idx_occ_lead: 'Et tidsbrev passer like godt til livets store milepæler som til hverdagens stille øyeblikk.',
  idx_occ_self: 'Til deg selv',
  idx_occ_child: 'Til barnet ditt',
  idx_occ_partner: 'Til kjæresten',
  idx_occ_confirmation: 'Konfirmasjon',
  idx_occ_wedding: 'Bryllup',
  idx_occ_anniversary: 'Jubileum',

  // ── Index — quotes ──
  idx_quotes_eyebrow: 'ekte historier',
  idx_quotes_title: 'Et brev kan forandre et øyeblikk',
  idx_quotes_lead: 'Noen ganger er det mest verdifulle vi kan gi hverandre tiden det tar å skrive ned det vi føler.',
  idx_quote1: 'Da datteren min ble født satte jeg meg ned og skrev. Femten år senere kom brevet i posten til konfirmasjonsdagen hennes. Det var den mest ektefølte gaven jeg kunne gitt.',
  idx_quote1_author: '— Ingrid, 39',
  idx_quote2: 'Da jeg ble 18 skrev jeg et brev til meg selv om mine mål og ambisjoner. Jeg gleder meg til å se om jeg har klart det jeg drømte om, eller om livet tok meg i en helt annen retning.',
  idx_quote2_author: '— Marte, 28',
  idx_quote3: 'På bryllupsdagen skrev jeg et brev til Camilla. Ti år senere fikk hun det i posten på jubileet vårt. Hun sa det var den fineste gaven hun noen gang hadde fått.',
  idx_quote3_author: '— Andreas, 41',
  idx_quote4: 'Jeg var på reisefot i tre måneder og sendte et brev til den fremtidige meg. Jeg gleder meg til å la minnene strømme tilbake. Det blir som en tidskapsel i postkassen.',
  idx_quote4_author: '— Sofie, 26',

  // ── Index — CTA banner ──
  idx_cta_title: 'Klar til å skrive?',
  idx_cta_text: 'Det tar under ti minutter. Ordene du skriver i dag kan bety alt om ti år.',
  idx_cta_btn: 'Skriv ditt første brev',
  idx_cta_note_html: 'Fra 99 kr &middot; Norsk drift &middot; Årsavgift kun for lagring',

  // ── Index — footer (custom) ──
  idx_footer_privacy: 'Personvern',
  idx_footer_terms: 'Vilkår',
  idx_footer_faq: 'FAQ',
  idx_footer_copy: '© 2026 Tidsbrev.no — Brev til fremtiden, skrevet i dag.',

  // ── Bestill — progress ──
  ord_progress_1: 'Mottaker',
  ord_progress_2: 'Levering',
  ord_progress_3: 'Informasjon',
  ord_progress_4: 'Skriv brev',
  ord_progress_5: 'Betaling',

  // ── Bestill — step 1 ──
  ord_s1_eyebrow: '~ la oss begynne ~',
  ord_s1_title: 'Hvem er brevet til?',
  ord_s1_text: 'Et tidsbrev kan være en gave til deg selv eller til noen du er glad i.',
  ord_s1_self_title: 'Til meg selv',
  ord_s1_self_text: 'Et brev fra deg i dag til deg i fremtiden.',
  ord_s1_other_title: 'Til noen andre',
  ord_s1_other_text: 'Overrask noen du er glad i på en fremtidig dato.',
  ord_next: 'Neste →',
  ord_back: '← Tilbake',

  // ── Bestill — step 2 ──
  ord_s2_eyebrow: '~ hvordan skal det komme frem ~',
  ord_s2_title: 'Hvordan skal brevet leveres?',
  ord_s2_text: 'Velg hvordan du vil at brevet skal ankomme på leveringsdagen.',
  ord_s2_digital_title: 'Digitalt brev',
  ord_s2_digital_text: 'Vi sender en e-post på nøyaktig riktig dato.',
  ord_s2_physical_title: 'Fysisk brev i konvolutt',
  ord_s2_physical_text: 'Et ekte brev leveres i vakker konvolutt.',
  ord_s2_capsule_title: 'Tidskapsell',
  ord_s2_capsule_text: 'Last opp bilder eller videoer som leveres digitalt på valgt dato.',
  ord_s2_popular: 'Mest populær',
  ord_s2_new: 'Nytt',

  // ── Bestill — step 3 ──
  ord_s3_eyebrow: '~ det praktiske ~',
  ord_s3_title: 'Informasjon',
  ord_s3_intro: 'Fortell oss hvem som skal motta brevet og når.',
  ord_s3_intro_self: 'Fortell oss hvor vi skal sende brevet når tiden er inne.',
  ord_s3_intro_other: 'Fortell oss hvem som skal motta brevet og hvilken anledning det er for.',
  ord_s3_intro_capsule: 'Fortell oss hvem som skal motta tidskapselen og når.',
  ord_s3_your_name: 'Ditt navn',
  ord_s3_your_name_sender: 'Ditt navn (avsender)',
  ord_s3_your_email: 'Din e-post',
  ord_s3_your_email_sender: 'Din e-post (avsender)',
  ord_s3_recipient_name: 'Mottakers fulle navn',
  ord_s3_recipient_email: 'Mottakers e-post',
  ord_s3_occasion: 'Anledning',
  ord_s3_occasion_select: 'Velg anledning…',
  ord_s3_occasion_self: 'Til meg selv',
  ord_s3_occasion_confirmation: 'Konfirmasjon',
  ord_s3_occasion_birthday: 'Bursdag',
  ord_s3_occasion_wedding: 'Bryllup',
  ord_s3_occasion_newborn: 'Nyfødt barn',
  ord_s3_occasion_anniversary: 'Jubileum',
  ord_s3_occasion_justbecause: 'Bare fordi',
  ord_s3_address: 'Gateadresse',
  ord_s3_zip: 'Postnummer',
  ord_s3_city: 'Poststed',
  ord_s3_date: 'Leveringsdato',
  ord_s3_err_name: 'Vennligst fyll inn navnet ditt.',
  ord_s3_err_email: 'Vennligst fyll inn en gyldig e-postadresse.',
  ord_s3_err_recipient_name: 'Vennligst fyll inn mottakerens navn.',
  ord_s3_err_recipient_email: 'Vennligst fyll inn en gyldig e-postadresse.',
  ord_s3_err_occasion: 'Vennligst velg en anledning.',
  ord_s3_err_address: 'Vennligst fyll inn gateadresse.',
  ord_s3_err_zip: 'Ugyldig postnummer.',
  ord_s3_err_city: 'Vennligst fyll inn poststed.',
  ord_s3_err_date: 'Leveringsdatoen må være minst i morgen.',
  ord_s3_err_form: 'Vennligst rett opp feltene som er markert med rødt.',
  ord_placeholder_name: 'Fornavn Etternavn',
  ord_placeholder_email: 'din@epost.no',
  ord_placeholder_recipient_email: 'mottaker@epost.no',
  ord_placeholder_address: 'Eksempelveien 12',
  ord_placeholder_zip: '0123',
  ord_placeholder_city: 'Oslo',

  // ── Bestill — step 4 ──
  ord_s4_eyebrow: '~ ordene dine ~',
  ord_s4_title: 'Skriv brevet',
  ord_s4_text: 'Ta deg tid. Skriv fra hjertet. Dette er øyeblikket som skal fryses i tid.',
  ord_s4_title_upload: 'Last opp filene dine',
  ord_s4_text_upload: 'Last opp bilder og videoer som vi leverer digitalt til mottakeren på valgt dato.',
  ord_s4_design_label: 'Velg utseende på brevet',
  ord_s4_design_klassisk: 'Klassisk',
  ord_s4_design_klassisk_desc: 'Rent og tidløst',
  ord_s4_design_romantisk: 'Romantisk',
  ord_s4_design_romantisk_desc: 'Varm og personlig',
  ord_s4_design_moderne: 'Moderne',
  ord_s4_design_moderne_desc: 'Enkel og stilren',
  ord_s4_design_eventyr: 'Eventyr',
  ord_s4_design_eventyr_desc: 'Håndskrevet følelse',
  ord_s4_upload_drop: 'Dra og slipp filer her, eller',
  ord_s4_upload_browse: 'velg filer',
  ord_s4_upload_hint: 'JPG, PNG, GIF, WebP, MP4, MOV, AVI · maks 1 GB totalt · maks 10 filer',
  ord_s4_upload_message_label: 'Legg til en personlig hilsen',
  ord_s4_upload_message_optional: '(valgfritt)',
  ord_s4_err_letter: 'Brevet må inneholde minst 20 tegn.',
  ord_s4_err_upload: 'Du må laste opp minst én fil.',
  ord_s4_err_filetype: 'Noen filer ble avvist. Tillatte formater: JPG, PNG, GIF, WebP, MP4, MOV, AVI.',
  ord_s4_err_maxfiles: 'Maks 10 filer tillatt.',
  ord_s4_err_maxsize: 'Total filstørrelse overskrider 1 GB.',
  ord_s4_upload_progress: 'Laster opp {n} av {total}…',
  ord_s4_upload_done: '{n} filer lastet opp',
  ord_s4_upload_failed: 'feilet',
  ord_s4_insp1: 'Hva er du stolt av akkurat nå?',
  ord_s4_insp2: 'Hva håper du har forandret seg?',
  ord_s4_insp3: 'Hva vil du at fremtiden skal huske?',
  ord_s4_insp1_hint: 'Tenk på noe du har oppnådd i det siste — en liten eller stor seier — og beskriv hvordan det føltes. Hva lærte du om deg selv?',
  ord_s4_insp2_hint: 'Om verden, om deg selv, om menneskene rundt deg. Hva drømmer du om skal være annerledes når brevet ankommer?',
  ord_s4_insp3_hint: 'Hva er de små og store tingene fra tiden din som du ønsker at fremtiden ikke skal glemme? Tenk lyder, lukter, øyeblikk.',

  // ── Bestill — step 4 fysisk ──
  ord_s4_fysisk_eyebrow: '~ ditt fysiske brev ~',
  ord_s4_fysisk_heading: 'Send oss brevet ditt',
  ord_s4_fysisk_text: 'Du skriver brevet selv — vi tar vare på det og leverer det på riktig dato.',
  ord_s4_fysisk_title: 'Du skriver brevet selv',
  ord_s4_fysisk_lead: '~ for hånd eller på maskin ~',
  ord_s4_fysisk_step1_title: 'Skriv brevet ditt',
  ord_s4_fysisk_step1_text: 'Skriv for hånd eller print det ut — helt opp til deg. Det viktigste er ordene.',
  ord_s4_fysisk_step2_title: 'Send det til oss i posten',
  ord_s4_fysisk_step2_text: 'Etter bestilling får du en bekreftelse med adresse og instruksjoner. Legg brevet i en konvolutt og send det til:',
  ord_s4_fysisk_step3_title: 'Vi oppbevarer det trygt',
  ord_s4_fysisk_step3_text: 'Brevet lagres forsvarlig hos oss helt til leveringsdatoen du har valgt. Da sender vi det videre til mottakeren i en vakker konvolutt.',
  ord_s4_fysisk_safe: 'Brevet ditt er i trygge hender. Vi behandler det med omtanke.',

  // ── Bestill — step 5 ──
  ord_s5_eyebrow: '~ siste steg ~',
  ord_s5_title: 'Oppsummering og betaling',
  ord_s5_text: 'Sjekk at alt stemmer, og velg hvordan du vil betale.',
  ord_s5_vipps: 'Betal med Vipps',
  ord_s5_vipps_soon: 'Kommer snart',
  ord_s5_card: 'Betal med kort',
  ord_s5_trust_secure: 'Sikker betaling',
  ord_s5_trust_gdpr: 'GDPR-trygt',
  ord_s5_trust_norway: 'Norsk drift',

  // ── Bestill — summary labels ──
  ord_sum_recipient: 'Mottaker',
  ord_sum_delivery: 'Leveringsform',
  ord_sum_sender: 'Avsender',
  ord_sum_email: 'E-post',
  ord_sum_recipient_name: 'Mottaker',
  ord_sum_recipient_email: 'Mottakers e-post',
  ord_sum_occasion: 'Anledning',
  ord_sum_address: 'Adresse',
  ord_sum_design: 'Brevdesign',
  ord_sum_date: 'Leveringsdato',
  ord_sum_files: 'Antall filer',
  ord_sum_chars: 'Antall tegn i brev',
  ord_sum_letter_format: 'Brevformat',
  ord_sum_letter_physical: 'Fysisk brev — sendes i posten',
  ord_sum_total: 'Totalt',
  ord_sum_to_self: 'Til meg selv',
  ord_sum_to_other: 'Til noen andre',
  ord_sum_digital: 'Digitalt brev',
  ord_sum_physical: 'Fysisk brev',
  ord_sum_capsule: 'Tidskapsell — digital levering',

  // ── Bestill — validation alerts ──
  ord_alert_choose_recipient: 'Vennligst velg hvem brevet er til.',
  ord_alert_choose_delivery: 'Vennligst velg hvordan brevet skal leveres.',
  ord_alert_payment_fail: 'Kunne ikke starte betalingen: ',
  ord_alert_payment_retry: '\nPrøv igjen om et øyeblikk.',

  // ── Takk ──
  thx_loading: 'Bekrefter betalingen din...',
  thx_loading_wait: 'Nesten klar — venter på bekreftelse fra banken...',
  thx_title: 'Brevet ditt er trygt lagret',
  thx_subtitle: '~ ordene dine er forseglet i tid ~',
  thx_order_label: 'DIN ORDRE',
  thx_order_number: 'Ordrenummer',
  thx_order_product: 'Produkt',
  thx_order_delivery: 'Leveringsform',
  thx_order_recipient: 'Mottaker',
  thx_order_date: 'Leveringsdato',
  thx_order_amount: 'Betalt',
  thx_countdown_title: 'Tid til brevet leveres',
  thx_cd_years: 'år',
  thx_cd_months: 'mnd',
  thx_cd_days: 'dager',
  thx_cd_hours: 'timer',
  thx_cd_delivered: 'Brevet har blitt levert! ✉️',
  thx_confirm_html: '<strong>Vi har sendt en bekreftelse til e-posten din.</strong><br/>Brevet ditt er kryptert og trygt lagret i arkivet vårt. Du trenger ikke gjøre noe mer — vi tar oss av resten og leverer det på nøyaktig riktig dato.',
  thx_confirm_pending_html: '<strong style="color:var(--gold)">Betalingen din behandles.</strong><br/>Ordren er registrert og brevet er lagret. Du vil motta en bekreftelse på e-post så snart betalingen er fullført.',
  thx_share_title: 'Del med venner',
  thx_share_fb: 'Del på Facebook',
  thx_share_ig: 'Del på Instagram',
  thx_share_copy: 'Kopier lenke',
  thx_share_copied: 'Kopiert!',
  thx_share_ig_copied: 'Kopiert! Lim inn på Instagram',
  thx_share_text: 'Jeg har nettopp skrevet et brev til fremtiden min 💌',
  thx_btn_home: 'Tilbake til forsiden',
  thx_btn_new: 'Skriv et nytt brev',
  thx_err_title: 'Vi fant ikke ordren din',
  thx_err_text: 'Sjekk e-posten din for ordrebekreftelsen, eller kontakt oss hvis du trenger hjelp.',
  thx_to_self: 'Til deg selv',

  // ── Feil ──
  err_title: 'Det gikk ikke helt som planlagt',
  err_subtitle: '~ men brevet ditt er ikke tapt ~',
  err_message: 'Betalingen ble dessverre ikke fullført denne gangen. Ikke bekymre deg — ingenting har blitt trukket fra kontoen din, og du kan enkelt prøve igjen når du er klar.',
  err_help_title: 'Hva kan du gjøre?',
  err_help_retry_title: 'Prøv igjen',
  err_help_retry_text: 'Gå tilbake til bestillingen og forsøk betalingen på nytt. Det tar bare et minutt.',
  err_help_card_title: 'Sjekk betalingskortet',
  err_help_card_text: 'Kontroller at kortet har dekning og at utløpsdatoen er riktig.',
  err_help_contact_title: 'Ta kontakt med oss',
  err_help_contact_text_html: 'Send oss en e-post på <a href="mailto:hei@tidsbrev.no">hei@tidsbrev.no</a> — vi hjelper deg gjerne.',
  err_btn_retry: 'Prøv igjen',
  err_btn_home: 'Til forsiden',
  err_reassurance: 'Ordene dine fortjener å bli levert. Vi er her for å hjelpe deg dit.',
  err_cancelled_title: 'Du avbrøt betalingen',
  err_cancelled_subtitle: '~ ingen ting er trukket fra kontoen din ~',
  err_cancelled_message: 'Det er helt greit — noen ganger trenger man litt mer tid. Ordene dine venter på deg. Kom tilbake når du er klar, og brevet ditt vil være der akkurat der du slapp.',
  err_expired_title: 'Betalingssiden gikk ut på tid',
  err_expired_subtitle: '~ ingen ting er trukket fra kontoen din ~',
  err_expired_message: 'Betalingslenken din ble dessverre for gammel. Det skjer av og til — det tar bare et minutt å starte på nytt. Brevet du har skrevet er lagret i nettleseren din så lenge du ikke lukker fanen.',
  err_card_title: 'Kortet ble ikke godkjent',
  err_card_subtitle: '~ prøv et annet kort eller betalingsmåte ~',
  err_card_message: 'Det ser ut til at det ble et lite hinder med kortet denne gangen. Ingen ting er trukket, og du kan prøve med et annet kort, eller betale med Vipps hvis det er enklere.',
  err_vipps_title: 'Vipps-betalingen ble ikke fullført',
  err_vipps_subtitle: '~ ingen ting er trukket fra Vipps-kontoen din ~',
  err_vipps_message: 'Det oppstod et lite hinder med Vipps-betalingen. Ingen ting har blitt belastet. Du kan prøve igjen med Vipps, eller betale med kort hvis det er enklere.',

  // ── FAQ ──
  faq_eyebrow: '~ vi har svarene ~',
  faq_title: 'Ofte stilte spørsmål',
  faq_lead_html: 'Lurer du på noe? Sjansen er stor for at svaret er her. Finner du ikke det du trenger, er vi alltid tilgjengelig på <a href="mailto:hei@tidsbrev.no">hei@tidsbrev.no</a>.',
  faq_group_service: 'Om tjenesten',
  faq_group_delivery: 'Levering',
  faq_group_privacy: 'Personvern og sikkerhet',
  faq_group_payment: 'Betaling og refusjon',
  faq_cta_title: 'Klar til å skrive?',
  faq_cta_text: 'Det tar bare noen minutter å sette ord på det du vil si — men ordene varer for alltid.',
  faq_cta_btn: 'Skriv ditt tidsbrev',
  faq_cta_unsure_html: 'Har du et spørsmål som ikke er besvart her? <a href="mailto:hei@tidsbrev.no">Send oss en e-post</a>.',
  faq_en_notice: '',

  // ── Personvern ──
  pv_eyebrow: '~ trygghet og åpenhet ~',
  pv_title: 'Personvernerklæring',
  pv_lead: 'Vi lagrer bare det vi trenger, vi forteller deg hva og hvorfor, og vi sletter det når brevet er levert. Ingen mer, ingen mindre.',
  pv_s1_title: 'Hvem er vi?',
  pv_s2_title: 'Hva lagrer vi om deg?',
  pv_s3_title: 'Er brevet mitt kryptert?',
  pv_s4_title: 'Hvor lagres dataene?',
  pv_s5_title: 'Hvor lenge beholder vi dataene?',
  pv_s6_title: 'Hva er det rettslige grunnlaget?',
  pv_s7_title: 'Dine rettigheter',
  pv_s8_title: 'Informasjonskapsler (cookies)',
  pv_contact_title: 'Spørsmål om personvern?',
  pv_contact_text: 'Vi svarer alltid innen 30 dager — som regel mye raskere. Skriv til oss på e-post, og vi hjelper deg.',
  pv_en_notice: '',

  // ── Vilkår ──
  vk_eyebrow: '~ klart og tydelig ~',
  vk_title: 'Vilkår og betingelser',
  vk_lead: 'Vi har prøvd å skrive dette slik at det faktisk er mulig å lese. Ingen juridisk sjargong — bare klare regler for hva du kan forvente av oss, og hva vi forventer av deg.',
  vk_s1_title: '1. Hva er Tidsbrev?',
  vk_s2_title: '2. Bestilling og betaling',
  vk_s3_title: '3. Refusjon og angrerett',
  vk_s4_title: '4. Levering',
  vk_s5_title: '5. Spesielle situasjoner',
  vk_s6_title: '6. Brevinnhold og bruk av tjenesten',
  vk_s7_title: '7. Ansvarsbegrensning',
  vk_s8_title: '8. Lovvalg og tvisteløsning',
  vk_s9_title: '9. Endringer i vilkårene',
  vk_contact_title: 'Spørsmål om vilkårene?',
  vk_contact_text: 'Vi svarer alltid innen et par virkedager. Litt usikker på noe? Spør oss — vi er hyggelige.',
  vk_en_notice: ''
},

// ────────────────────────────────────────────────────────────────
// ENGLISH
// ────────────────────────────────────────────────────────────────
en: {

  // ── Nav ──
  nav_home: 'Home',
  nav_order: 'Order',
  nav_faq: 'FAQ',
  nav_order_cta: 'Order letter',
  nav_back: 'Back to front page',

  // ── Footer ──
  footer_tagline_html: 'Letters to the future,<br>written today.',
  footer_pages: 'Pages',
  footer_info: 'Info',
  footer_home: 'Home',
  footer_order: 'Order letter',
  footer_faq: 'Frequently asked questions',
  footer_privacy: 'Privacy policy',
  footer_terms: 'Terms and conditions',
  footer_copy: 'Norwegian operations',
  footer_eu: 'Stored securely in the EU  ·  GDPR compliant',

  // ── Index — hero ──
  idx_hero_eyebrow: '~ a letter to the future ~',
  idx_hero_title_html: 'Write the words today.<br><em>Let time deliver them.</em>',
  idx_hero_lead: 'Tidsbrev lets you write a letter that is delivered on exactly the right date — in one, ten, or thirty years. To yourself, to your child, or to someone you love.',
  idx_hero_cta: 'Write your first letter',

  // ── Index — nav ──
  idx_nav_how: 'How it works',
  idx_nav_letters: 'Our letters',
  idx_nav_cta: 'Write letter',

  // ── Index — how it works ──
  idx_how_eyebrow: "it's that simple",
  idx_how_title: 'Three steps to a time letter',
  idx_how_lead: 'We keep your words safe until exactly the right moment.',
  idx_step1_title: '1. Write the letter',
  idx_step1_text: 'Take your time. Write from the heart. Choose who it goes to and when it should be delivered — from 1 to 30 years.',
  idx_step2_title: '2. We keep it safe',
  idx_step2_text: 'The letter is encrypted and stored securely in our Norwegian archive until your chosen delivery date.',
  idx_step3_title: '3. It arrives',
  idx_step3_text: 'On the chosen date, the letter is delivered — digitally by email or as a real letter in a beautiful envelope by post.',

  // ── Index — products ──
  idx_prod_eyebrow: 'our letters',
  idx_prod_title: 'Choose your time letter',
  idx_prod_lead: 'From a simple letter of memories to a whole life story — we have a format for every moment.',
  idx_prod_digital_title: 'Digital Letter',
  idx_prod_digital_subtitle: 'Written and received digitally',
  idx_prod_digital_note: '99 NOK start + 19 NOK/year storage fee',
  idx_prod_digital_li1: 'Written directly in the browser',
  idx_prod_digital_li2: 'Delivered by email on chosen date',
  idx_prod_digital_li3: 'Secure encryption and storage',
  idx_prod_digital_li4: 'To yourself or someone you love',
  idx_prod_digital_btn: 'Choose Digital',
  idx_prod_physical_badge: 'Most personal',
  idx_prod_physical_title: 'Physical Letter',
  idx_prod_physical_subtitle: 'Personal and tangible letter',
  idx_prod_physical_note: '249 NOK start + 29 NOK/year storage fee',
  idx_prod_physical_li1: 'You send the physical letter to us',
  idx_prod_physical_li2: 'We store and send it on chosen date',
  idx_prod_physical_li3: 'To yourself or someone you love',
  idx_prod_physical_li4: 'Wrapped in a beautiful envelope (+79 NOK)',
  idx_prod_physical_btn: 'Choose Physical',
  idx_prod_capsule_badge: 'New',
  idx_prod_capsule_title: 'Time Capsule',
  idx_prod_capsule_subtitle: 'Photos and video to the future',
  idx_prod_capsule_note: '149 NOK start + 49 NOK/year storage fee',
  idx_prod_capsule_li1: 'Upload photos, video, and documents',
  idx_prod_capsule_li2: 'Delivered digitally on chosen date',
  idx_prod_capsule_li3: 'Up to 1 GB storage space',
  idx_prod_capsule_li4: 'Include a personal message',
  idx_prod_capsule_btn: 'Choose Time Capsule',
  idx_price_explainer_html: '<strong style="color:var(--ink);">How pricing works:</strong> You pay a starting price when you order, plus a small annual storage fee for each year the letter is stored. Example: a digital letter delivered in 5 years costs 99 NOK + (4 &times; 19 NOK) = <strong style="color:var(--burgundy)">175 NOK</strong> total.',

  // ── Index — occasions ──
  idx_occ_eyebrow: 'for every moment',
  idx_occ_title: 'What are you celebrating?',
  idx_occ_lead: 'A time letter is just as fitting for the big milestones as for the quiet everyday moments.',
  idx_occ_self: 'To yourself',
  idx_occ_child: 'To your child',
  idx_occ_partner: 'To your partner',
  idx_occ_confirmation: 'Confirmation',
  idx_occ_wedding: 'Wedding',
  idx_occ_anniversary: 'Anniversary',

  // ── Index — quotes ──
  idx_quotes_eyebrow: 'real stories',
  idx_quotes_title: 'A letter can change a moment',
  idx_quotes_lead: 'Sometimes the most valuable thing we can give each other is the time it takes to write down what we feel.',
  idx_quote1: 'When my daughter was born, I sat down and wrote. Fifteen years later the letter arrived in the mail on her confirmation day. It was the most heartfelt gift I could have given.',
  idx_quote1_author: '— Ingrid, 39',
  idx_quote2: 'When I turned 18, I wrote a letter to myself about my goals and ambitions. I look forward to seeing if I achieved what I dreamed of, or if life took me in a completely different direction.',
  idx_quote2_author: '— Marte, 28',
  idx_quote3: 'On our wedding day, I wrote a letter to Camilla. Ten years later she received it in the mail on our anniversary. She said it was the most beautiful gift she had ever received.',
  idx_quote3_author: '— Andreas, 41',
  idx_quote4: "I was travelling for three months and sent a letter to my future self. I look forward to letting the memories flow back. It's like a time capsule in the mailbox.",
  idx_quote4_author: '— Sofie, 26',

  // ── Index — CTA ──
  idx_cta_title: 'Ready to write?',
  idx_cta_text: 'It takes less than ten minutes. The words you write today can mean everything in ten years.',
  idx_cta_btn: 'Write your first letter',
  idx_cta_note_html: 'From 99 NOK &middot; Norwegian operations &middot; Annual fee only for storage',

  // ── Index — footer ──
  idx_footer_privacy: 'Privacy',
  idx_footer_terms: 'Terms',
  idx_footer_faq: 'FAQ',
  idx_footer_copy: '© 2026 Tidsbrev.no — Letters to the future, written today.',

  // ── Bestill — progress ──
  ord_progress_1: 'Recipient',
  ord_progress_2: 'Delivery',
  ord_progress_3: 'Information',
  ord_progress_4: 'Write letter',
  ord_progress_5: 'Payment',

  // ── Bestill — step 1 ──
  ord_s1_eyebrow: "~ let's begin ~",
  ord_s1_title: 'Who is the letter for?',
  ord_s1_text: 'A time letter can be a gift to yourself or to someone you love.',
  ord_s1_self_title: 'To myself',
  ord_s1_self_text: 'A letter from you today to you in the future.',
  ord_s1_other_title: 'To someone else',
  ord_s1_other_text: 'Surprise someone you love on a future date.',
  ord_next: 'Next →',
  ord_back: '← Back',

  // ── Bestill — step 2 ──
  ord_s2_eyebrow: '~ how should it arrive ~',
  ord_s2_title: 'How should the letter be delivered?',
  ord_s2_text: 'Choose how you want the letter to arrive on the delivery day.',
  ord_s2_digital_title: 'Digital letter',
  ord_s2_digital_text: 'We send an email on exactly the right date.',
  ord_s2_physical_title: 'Physical letter in envelope',
  ord_s2_physical_text: 'A real letter delivered in a beautiful envelope.',
  ord_s2_capsule_title: 'Time Capsule',
  ord_s2_capsule_text: 'Upload photos or videos delivered digitally on chosen date.',
  ord_s2_popular: 'Most popular',
  ord_s2_new: 'New',

  // ── Bestill — step 3 ──
  ord_s3_eyebrow: '~ the practical details ~',
  ord_s3_title: 'Information',
  ord_s3_intro: 'Tell us who should receive the letter and when.',
  ord_s3_intro_self: 'Tell us where to send the letter when the time comes.',
  ord_s3_intro_other: 'Tell us who should receive the letter and what the occasion is.',
  ord_s3_intro_capsule: 'Tell us who should receive the time capsule and when.',
  ord_s3_your_name: 'Your name',
  ord_s3_your_name_sender: 'Your name (sender)',
  ord_s3_your_email: 'Your email',
  ord_s3_your_email_sender: 'Your email (sender)',
  ord_s3_recipient_name: "Recipient's full name",
  ord_s3_recipient_email: "Recipient's email",
  ord_s3_occasion: 'Occasion',
  ord_s3_occasion_select: 'Select occasion…',
  ord_s3_occasion_self: 'To myself',
  ord_s3_occasion_confirmation: 'Confirmation',
  ord_s3_occasion_birthday: 'Birthday',
  ord_s3_occasion_wedding: 'Wedding',
  ord_s3_occasion_newborn: 'Newborn child',
  ord_s3_occasion_anniversary: 'Anniversary',
  ord_s3_occasion_justbecause: 'Just because',
  ord_s3_address: 'Street address',
  ord_s3_zip: 'Postal code',
  ord_s3_city: 'City',
  ord_s3_date: 'Delivery date',
  ord_s3_err_name: 'Please enter your name.',
  ord_s3_err_email: 'Please enter a valid email address.',
  ord_s3_err_recipient_name: "Please enter the recipient's name.",
  ord_s3_err_recipient_email: 'Please enter a valid email address.',
  ord_s3_err_occasion: 'Please select an occasion.',
  ord_s3_err_address: 'Please enter a street address.',
  ord_s3_err_zip: 'Invalid postal code.',
  ord_s3_err_city: 'Please enter a city.',
  ord_s3_err_date: 'Delivery date must be at least tomorrow.',
  ord_s3_err_form: 'Please correct the fields marked in red.',
  ord_placeholder_name: 'Full Name',
  ord_placeholder_email: 'your@email.com',
  ord_placeholder_recipient_email: 'recipient@email.com',
  ord_placeholder_address: '123 Example Street',
  ord_placeholder_zip: '0123',
  ord_placeholder_city: 'Oslo',

  // ── Bestill — step 4 ──
  ord_s4_eyebrow: '~ your words ~',
  ord_s4_title: 'Write the letter',
  ord_s4_text: 'Take your time. Write from the heart. This is the moment to be frozen in time.',
  ord_s4_title_upload: 'Upload your files',
  ord_s4_text_upload: 'Upload photos and videos that we deliver digitally to the recipient on your chosen date.',
  ord_s4_design_label: 'Choose letter design',
  ord_s4_design_klassisk: 'Classic',
  ord_s4_design_klassisk_desc: 'Clean and timeless',
  ord_s4_design_romantisk: 'Romantic',
  ord_s4_design_romantisk_desc: 'Warm and personal',
  ord_s4_design_moderne: 'Modern',
  ord_s4_design_moderne_desc: 'Simple and elegant',
  ord_s4_design_eventyr: 'Fairytale',
  ord_s4_design_eventyr_desc: 'Handwritten feel',
  ord_s4_upload_drop: 'Drag and drop files here, or',
  ord_s4_upload_browse: 'choose files',
  ord_s4_upload_hint: 'JPG, PNG, GIF, WebP, MP4, MOV, AVI · max 1 GB total · max 10 files',
  ord_s4_upload_message_label: 'Add a personal greeting',
  ord_s4_upload_message_optional: '(optional)',
  ord_s4_err_letter: 'The letter must contain at least 20 characters.',
  ord_s4_err_upload: 'You must upload at least one file.',
  ord_s4_err_filetype: 'Some files were rejected. Accepted formats: JPG, PNG, GIF, WebP, MP4, MOV, AVI.',
  ord_s4_err_maxfiles: 'Maximum 10 files allowed.',
  ord_s4_err_maxsize: 'Total file size exceeds 1 GB.',
  ord_s4_upload_progress: 'Uploading {n} of {total}…',
  ord_s4_upload_done: '{n} files uploaded',
  ord_s4_upload_failed: 'failed',
  ord_s4_insp1: 'What are you proud of right now?',
  ord_s4_insp2: 'What do you hope has changed?',
  ord_s4_insp3: 'What do you want the future to remember?',
  ord_s4_insp1_hint: "Think of something you've achieved recently — a small or big victory — and describe how it felt. What did you learn about yourself?",
  ord_s4_insp2_hint: 'About the world, about yourself, about the people around you. What do you dream will be different when the letter arrives?',
  ord_s4_insp3_hint: "What are the small and big things from your time that you want the future to remember? Think sounds, smells, moments.",

  // ── Bestill — step 4 fysisk ──
  ord_s4_fysisk_eyebrow: '~ your physical letter ~',
  ord_s4_fysisk_heading: 'Send us your letter',
  ord_s4_fysisk_text: 'You write the letter yourself — we store it safely and deliver it on the chosen date.',
  ord_s4_fysisk_title: 'You write the letter yourself',
  ord_s4_fysisk_lead: '~ by hand or machine ~',
  ord_s4_fysisk_step1_title: 'Write your letter',
  ord_s4_fysisk_step1_text: 'Write by hand or print it — entirely up to you. What matters most are the words.',
  ord_s4_fysisk_step2_title: 'Mail it to us',
  ord_s4_fysisk_step2_text: 'After ordering, you will receive a confirmation with our address and instructions. Place the letter in an envelope and mail it to:',
  ord_s4_fysisk_step3_title: 'We store it safely',
  ord_s4_fysisk_step3_text: 'Your letter is stored securely with us until your chosen delivery date. Then we forward it to the recipient in a beautiful envelope.',
  ord_s4_fysisk_safe: 'Your letter is in safe hands. We handle it with care.',

  // ── Bestill — step 5 ──
  ord_s5_eyebrow: '~ final step ~',
  ord_s5_title: 'Summary and payment',
  ord_s5_text: 'Check that everything looks right, and choose how to pay.',
  ord_s5_vipps: 'Pay with Vipps',
  ord_s5_vipps_soon: 'Coming soon',
  ord_s5_card: 'Pay with card',
  ord_s5_trust_secure: 'Secure payment',
  ord_s5_trust_gdpr: 'GDPR safe',
  ord_s5_trust_norway: 'Norwegian operations',

  // ── Bestill — summary labels ──
  ord_sum_recipient: 'Recipient',
  ord_sum_delivery: 'Delivery method',
  ord_sum_sender: 'Sender',
  ord_sum_email: 'Email',
  ord_sum_recipient_name: 'Recipient',
  ord_sum_recipient_email: "Recipient's email",
  ord_sum_occasion: 'Occasion',
  ord_sum_address: 'Address',
  ord_sum_design: 'Letter design',
  ord_sum_date: 'Delivery date',
  ord_sum_files: 'Number of files',
  ord_sum_chars: 'Characters in letter',
  ord_sum_letter_format: 'Letter format',
  ord_sum_letter_physical: 'Physical letter — sent by mail',
  ord_sum_total: 'Total',
  ord_sum_to_self: 'To myself',
  ord_sum_to_other: 'To someone else',
  ord_sum_digital: 'Digital letter',
  ord_sum_physical: 'Physical letter',
  ord_sum_capsule: 'Time Capsule — digital delivery',

  // ── Bestill — alerts ──
  ord_alert_choose_recipient: 'Please choose who the letter is for.',
  ord_alert_choose_delivery: 'Please choose how the letter should be delivered.',
  ord_alert_payment_fail: 'Could not start payment: ',
  ord_alert_payment_retry: '\nPlease try again in a moment.',

  // ── Takk ──
  thx_loading: 'Confirming your payment...',
  thx_loading_wait: 'Almost ready — waiting for confirmation from the bank...',
  thx_title: 'Your letter is safely stored',
  thx_subtitle: '~ your words are sealed in time ~',
  thx_order_label: 'YOUR ORDER',
  thx_order_number: 'Order number',
  thx_order_product: 'Product',
  thx_order_delivery: 'Delivery method',
  thx_order_recipient: 'Recipient',
  thx_order_date: 'Delivery date',
  thx_order_amount: 'Paid',
  thx_countdown_title: 'Time until letter is delivered',
  thx_cd_years: 'years',
  thx_cd_months: 'months',
  thx_cd_days: 'days',
  thx_cd_hours: 'hours',
  thx_cd_delivered: 'The letter has been delivered! ✉️',
  thx_confirm_html: "<strong>We've sent a confirmation to your email.</strong><br/>Your letter is encrypted and safely stored in our archive. You don't need to do anything else — we'll take care of the rest and deliver it on exactly the right date.",
  thx_confirm_pending_html: '<strong style="color:var(--gold)">Your payment is being processed.</strong><br/>The order is registered and the letter is stored. You will receive a confirmation email once the payment is complete.',
  thx_share_title: 'Share with friends',
  thx_share_fb: 'Share on Facebook',
  thx_share_ig: 'Share on Instagram',
  thx_share_copy: 'Copy link',
  thx_share_copied: 'Copied!',
  thx_share_ig_copied: 'Copied! Paste on Instagram',
  thx_share_text: 'I just wrote a letter to my future self 💌',
  thx_btn_home: 'Back to front page',
  thx_btn_new: 'Write a new letter',
  thx_err_title: "We couldn't find your order",
  thx_err_text: 'Check your email for the order confirmation, or contact us if you need help.',
  thx_to_self: 'To yourself',

  // ── Feil ──
  err_title: "Things didn't go quite as planned",
  err_subtitle: '~ but your letter is not lost ~',
  err_message: "The payment was unfortunately not completed this time. Don't worry — nothing has been charged to your account, and you can easily try again when you're ready.",
  err_help_title: 'What can you do?',
  err_help_retry_title: 'Try again',
  err_help_retry_text: 'Go back to the order and try the payment again. It only takes a minute.',
  err_help_card_title: 'Check your payment card',
  err_help_card_text: 'Make sure the card has sufficient funds and the expiry date is correct.',
  err_help_contact_title: 'Contact us',
  err_help_contact_text_html: 'Send us an email at <a href="mailto:hei@tidsbrev.no">hei@tidsbrev.no</a> — we\'re happy to help.',
  err_btn_retry: 'Try again',
  err_btn_home: 'To front page',
  err_reassurance: 'Your words deserve to be delivered. We are here to help you get there.',
  err_cancelled_title: 'You cancelled the payment',
  err_cancelled_subtitle: '~ nothing has been charged to your account ~',
  err_cancelled_message: "That's perfectly fine — sometimes you just need a bit more time. Your words are waiting for you. Come back when you're ready, and your letter will be right where you left it.",
  err_expired_title: 'The payment page timed out',
  err_expired_subtitle: '~ nothing has been charged to your account ~',
  err_expired_message: "Your payment link unfortunately expired. It happens sometimes — it only takes a minute to start over. Your letter is saved in the browser as long as you don't close the tab.",
  err_card_title: 'The card was not approved',
  err_card_subtitle: '~ try another card or payment method ~',
  err_card_message: "It seems there was a small issue with the card this time. Nothing has been charged, and you can try with a different card, or pay with Vipps if that's easier.",
  err_vipps_title: 'The Vipps payment was not completed',
  err_vipps_subtitle: '~ nothing has been charged from your Vipps account ~',
  err_vipps_message: "There was a small issue with the Vipps payment. Nothing has been charged. You can try again with Vipps, or pay by card if that's easier.",

  // ── FAQ ──
  faq_eyebrow: '~ we have the answers ~',
  faq_title: 'Frequently asked questions',
  faq_lead_html: "Wondering about something? Chances are the answer is here. If you can't find what you're looking for, we're always available at <a href=\"mailto:hei@tidsbrev.no\">hei@tidsbrev.no</a>.",
  faq_group_service: 'About the service',
  faq_group_delivery: 'Delivery',
  faq_group_privacy: 'Privacy and security',
  faq_group_payment: 'Payment and refunds',
  faq_cta_title: 'Ready to write?',
  faq_cta_text: 'It only takes a few minutes to put into words what you want to say — but the words last forever.',
  faq_cta_btn: 'Write your time letter',
  faq_cta_unsure_html: "Have a question that isn't answered here? <a href=\"mailto:hei@tidsbrev.no\">Send us an email</a>.",
  faq_en_notice: 'Full English translation of FAQ answers coming soon. Headings are translated; answers remain in Norwegian for now.',

  // ── Personvern ──
  pv_eyebrow: '~ safety and transparency ~',
  pv_title: 'Privacy Policy',
  pv_lead: "We only store what we need, we tell you what and why, and we delete it when the letter is delivered. Nothing more, nothing less.",
  pv_s1_title: 'Who are we?',
  pv_s2_title: 'What do we store about you?',
  pv_s3_title: 'Is my letter encrypted?',
  pv_s4_title: 'Where is the data stored?',
  pv_s5_title: 'How long do we keep the data?',
  pv_s6_title: 'What is the legal basis?',
  pv_s7_title: 'Your rights',
  pv_s8_title: 'Cookies',
  pv_contact_title: 'Questions about privacy?',
  pv_contact_text: 'We always respond within 30 days — usually much faster. Send us an email and we\'ll help you.',
  pv_en_notice: 'Full English translation of the privacy policy is coming soon. Section headings are translated; body text remains in Norwegian for now.',

  // ── Vilkår ──
  vk_eyebrow: '~ clear and straightforward ~',
  vk_title: 'Terms and Conditions',
  vk_lead: "We've tried to write this so it's actually possible to read. No legal jargon — just clear rules for what you can expect from us, and what we expect from you.",
  vk_s1_title: '1. What is Tidsbrev?',
  vk_s2_title: '2. Ordering and payment',
  vk_s3_title: '3. Refunds and right of withdrawal',
  vk_s4_title: '4. Delivery',
  vk_s5_title: '5. Special situations',
  vk_s6_title: '6. Letter content and use of the service',
  vk_s7_title: '7. Limitation of liability',
  vk_s8_title: '8. Governing law and disputes',
  vk_s9_title: '9. Changes to the terms',
  vk_contact_title: 'Questions about the terms?',
  vk_contact_text: "We always respond within a couple of business days. A bit unsure about something? Ask us — we're friendly.",
  vk_en_notice: 'Full English translation of terms and conditions is coming soon. Section headings are translated; body text remains in Norwegian for now.'
}

};


// ================================================================
// i18n Engine
// ================================================================

function getCurrentLang() {
  return localStorage.getItem('tidsbrev_lang') || 'no';
}

function t(key, fallback) {
  var lang = getCurrentLang();
  var val = TRANSLATIONS[lang] && TRANSLATIONS[lang][key];
  return val || (fallback != null ? fallback : key);
}

function setLang(lang) {
  localStorage.setItem('tidsbrev_lang', lang);
  applyTranslations(lang);
  updateLangSwitcher(lang);
  document.documentElement.lang = lang === 'no' ? 'nb' : 'en';
}

function applyTranslations(lang) {
  var tr = TRANSLATIONS[lang];
  if (!tr) return;

  document.querySelectorAll('[data-i18n]').forEach(function(el) {
    var key = el.dataset.i18n;
    if (tr[key] != null) el.textContent = tr[key];
  });

  document.querySelectorAll('[data-i18n-html]').forEach(function(el) {
    var key = el.dataset.i18nHtml;
    if (tr[key] != null) el.innerHTML = tr[key];
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el) {
    var key = el.dataset.i18nPlaceholder;
    if (tr[key] != null) el.placeholder = tr[key];
  });

  // Show/hide English notice banners
  document.querySelectorAll('.en-notice').forEach(function(el) {
    el.style.display = lang === 'en' ? 'block' : 'none';
  });
}

function updateLangSwitcher(lang) {
  document.querySelectorAll('.lang-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
}

function buildLangSwitcher() {
  return '<div class="lang-switcher">' +
    '<button class="lang-btn" data-lang="no" onclick="setLang(\'no\')">NO</button>' +
    '<span class="lang-sep">|</span>' +
    '<button class="lang-btn" data-lang="en" onclick="setLang(\'en\')">EN</button>' +
    '</div>';
}

function initI18n() {
  var lang = getCurrentLang();
  applyTranslations(lang);
  updateLangSwitcher(lang);
  document.documentElement.lang = lang === 'no' ? 'nb' : 'en';
}

// Export
if (typeof window !== 'undefined') {
  window.TRANSLATIONS = TRANSLATIONS;
  window.getCurrentLang = getCurrentLang;
  window.setLang = setLang;
  window.applyTranslations = applyTranslations;
  window.initI18n = initI18n;
  window.buildLangSwitcher = buildLangSwitcher;
  window.t = t;
}
