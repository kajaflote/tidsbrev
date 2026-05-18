-- ================================================================
-- Tidsbrev.no — Supabase pg_cron: alternativ til Netlify Scheduled Function
-- ================================================================
-- Bruk dette DERSOM du bytter vekk fra Netlify Scheduled Functions,
-- eller som backup. Netlify-funksjonen i backend/send-brev.js er
-- primærløsningen og dekker akkurat de samme to oppgavene:
--
--   1. Send digitale brev med leveringsdato = i dag
--   2. Send admin-påminnelse for fysiske brev som treffer 30-dagersmerket
--
-- Forutsetninger:
--   • pg_cron-utvidelsen er aktivert i Supabase-prosjektet ditt.
--     Gjøres under Database → Extensions → cron (slå på).
--   • pg_net-utvidelsen er aktivert (for HTTP-kall ut fra databasen).
--     Gjøres under Database → Extensions → pg_net (slå på).
--   • Netlify Functions er deployet og tilgjengelig på tidsbrev.no.
--
-- Merk: Dette er et HTTP-kall fra databasen til Netlify-endepunktet.
-- Netlify Functions håndterer all logikk (Resend, Supabase-oppdatering
-- m.m.) — pg_cron gjør bare "trigger"-jobben.
-- ================================================================


-- ================================================================
-- 1. AKTIVER UTVIDELSER (kjøres én gang)
-- ================================================================
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;


-- ================================================================
-- 2. HJELPEFUNKSJON — kaller Netlify send-brev-endepunktet
-- ================================================================
-- Denne funksjonen sender et POST-kall til Netlify-jobben og logger
-- resultatet. Kalles av cron-jobbene nedenfor.
-- ================================================================
CREATE OR REPLACE FUNCTION public.trigger_daglig_brevsending()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_response_id BIGINT;
  v_netlify_url TEXT := 'https://tidsbrev.no/api/send-brev';
BEGIN
  -- Kall Netlify-funksjonen via HTTP POST
  SELECT net.http_post(
    url     := v_netlify_url,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      -- Legg til en enkel hemmelighet for å beskytte endepunktet mot
      -- tilfeldige triggere. Sett CRON_SECRET i Netlify env og sjekk den
      -- øverst i send-brev.js.
      'X-Cron-Secret', current_setting('app.cron_secret', true)
    ),
    body    := '{}'::jsonb
  ) INTO v_response_id;

  -- Logg at vi har trigget jobben
  INSERT INTO public.admin_log (action, note)
  VALUES (
    'pg_cron_triggered',
    'Daglig brevsending trigget fra pg_cron. HTTP request id: ' || v_response_id::TEXT
  );

EXCEPTION WHEN OTHERS THEN
  -- Fang feil og logg dem — ikke la cron-jobben krasje stille
  INSERT INTO public.admin_log (action, note)
  VALUES (
    'pg_cron_error',
    'Feil ved pg_cron-trigger: ' || SQLERRM
  );
END;
$$;


-- ================================================================
-- 3. SETT OPP CRON-JOBB — daglig kl 07:00 UTC (09:00 norsk tid)
-- ================================================================
-- Fjern eksisterende jobb først (idempotent kjøring):
SELECT cron.unschedule('tidsbrev-daglig-brevsending');

-- Sett opp ny jobb:
SELECT cron.schedule(
  'tidsbrev-daglig-brevsending',   -- navn på jobben
  '0 7 * * *',                     -- cron-uttrykk: daglig 07:00 UTC
  $$SELECT public.trigger_daglig_brevsending();$$
);


-- ================================================================
-- 4. VERIFISER AT JOBBEN ER REGISTRERT
-- ================================================================
-- Kjør dette for å se at jobben dukker opp:
--
--   SELECT jobid, schedule, command, nodename
--   FROM cron.job
--   WHERE jobname = 'tidsbrev-daglig-brevsending';
--
-- Forventet output:
--   jobid | schedule   | command                                          | nodename
--   ------+------------+--------------------------------------------------+---------
--     42  | 0 7 * * *  | SELECT public.trigger_daglig_brevsending();      | ...


-- ================================================================
-- 5. TEST — kjør manuelt (for å verifisere at alt henger sammen)
-- ================================================================
-- Kjør dette i Supabase SQL Editor for å teste triggeren manuelt:
--
--   SELECT public.trigger_daglig_brevsending();
--
-- Sjekk deretter admin_log for å se at den ble logget:
--
--   SELECT action, note, created_at
--   FROM public.admin_log
--   WHERE action LIKE 'pg_cron%'
--   ORDER BY created_at DESC
--   LIMIT 5;


-- ================================================================
-- 6. (VALGFRITT) BESKYTT ENDEPUNKTET MED EN HEMMELIGHET
-- ================================================================
-- For å hindre at noen utenfor trigger send-brev tilfeldig, legg til
-- denne sjekken øverst i backend/send-brev.js sin dailyLetterJob():
--
--   const cronSecret = event.headers['x-cron-secret'];
--   if (cronSecret && cronSecret !== process.env.CRON_SECRET) {
--     return { statusCode: 401, body: 'Unauthorized' };
--   }
--
-- Sett CRON_SECRET i Netlify env og i Supabase app.cron_secret:
--
--   ALTER DATABASE postgres
--   SET app.cron_secret = 'din-hemmelige-token-her';
--
-- ================================================================
-- FERDIG
-- ================================================================
