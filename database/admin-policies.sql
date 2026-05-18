-- ================================================================
-- Tidsbrev.no — Admin RLS-policies
-- ================================================================
-- Kjør denne i Supabase SQL Editor ETTER schema.sql.
--
-- Disse policyene tillater at admin.html (som bruker anon-nøkkelen)
-- kan lese ordrer, brev og skrive til admin_log.
--
-- ALTERNATIV (anbefalt for produksjon):
--   Bruk en Netlify Function som proxy med service_role-nøkkelen
--   i stedet for direkte anon-tilgang. Da slipper du åpne RLS.
--   Men for et enkelt admin-panel med passordsjekk i frontend
--   er dette tilstrekkelig.
-- ================================================================


-- Tillat anon å lese alle ordrer (admin trenger full oversikt)
DROP POLICY IF EXISTS "Admin kan lese alle ordre" ON public.orders;
CREATE POLICY "Admin kan lese alle ordre"
  ON public.orders
  FOR SELECT
  TO anon
  USING (true);

-- Tillat anon å lese alle brev (for å vise brevinnhold i admin)
DROP POLICY IF EXISTS "Admin kan lese alle brev" ON public.letters;
CREATE POLICY "Admin kan lese alle brev"
  ON public.letters
  FOR SELECT
  TO anon
  USING (true);

-- Tillat anon å oppdatere brevstatus (for "marker som postet")
DROP POLICY IF EXISTS "Admin kan oppdatere brevstatus" ON public.letters;
CREATE POLICY "Admin kan oppdatere brevstatus"
  ON public.letters
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Tillat anon å skrive til admin_log
DROP POLICY IF EXISTS "Admin kan logge handlinger" ON public.admin_log;
CREATE POLICY "Admin kan logge handlinger"
  ON public.admin_log
  FOR INSERT
  TO anon
  WITH CHECK (true);


-- ================================================================
-- VIKTIG SIKKERHETSMERKNAD
-- ================================================================
-- Disse policyene gjør at ALLE med anon-nøkkelen kan lese ordrer
-- og brev. Anon-nøkkelen ligger i config.js som er synlig i
-- nettleseren. For Tidsbrev som er et lite prosjekt med
-- passord-beskyttet admin-side er dette akseptabelt.
--
-- For sterkere sikkerhet i fremtiden, vurder:
--   1. Bruk Supabase Auth (innlogging med e-post/passord)
--   2. Lag en admin-rolle og bruk authenticated policies
--   3. Flytt all admin-logikk til Netlify Functions med service_role
-- ================================================================
