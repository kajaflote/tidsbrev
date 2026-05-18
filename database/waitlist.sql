-- ================================================================
-- Tidsbrev.no — Venteliste-tabell
-- ================================================================
-- Kjør denne i Supabase SQL Editor for å opprette tabellen.
-- Tabellen lagrer alle påmeldinger fra landing page-skjemaet.
-- ================================================================

CREATE TABLE IF NOT EXISTS public.waitlist (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  occasion   TEXT NOT NULL CHECK (
    occasion IN ('meg_selv','barnet_mitt','kjaeresten','konfirmasjon','annet')
  )
);

COMMENT ON TABLE public.waitlist IS 'Ventelistepåmeldinger fra landing page';

-- Forhindre at samme e-post registreres flere ganger
CREATE UNIQUE INDEX IF NOT EXISTS idx_waitlist_email
  ON public.waitlist (email);

-- Index på created_at for sortering i admin
CREATE INDEX IF NOT EXISTS idx_waitlist_created
  ON public.waitlist (created_at DESC);

-- ================================================================
-- Row Level Security (RLS)
-- ================================================================
-- Alle (også anonyme/uinnloggede) skal kunne sette inn nye rader
-- (nødvendig for at skjemaet på landing page skal fungere uten
-- innlogging). Ingen fra frontend skal kunne lese, oppdatere eller
-- slette. Kun service_role (backend/admin) har full tilgang.
-- ================================================================

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Alle kan melde seg på ventelisten" ON public.waitlist;
CREATE POLICY "Alle kan melde seg på ventelisten"
  ON public.waitlist
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Lesing er IKKE tillatt fra frontend.
-- Service_role (backend) omgår RLS automatisk og kan lese alt.
