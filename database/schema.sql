-- ================================================================
-- Tidsbrev.no — Database-oppsett for Supabase (PostgreSQL)
-- ================================================================
-- Kjør denne filen i Supabase SQL Editor for å sette opp hele
-- databasestrukturen på en gang.
--
-- Inneholder:
--   1. Tabeller: orders, letters, admin_log, letter_tokens, tidskapsell_files
--   2. Trigger for automatisk generering av order_number (FRB-YYYY-NNN)
--   3. Row Level Security (RLS) policies som beskytter kundedata
--   4. Indexes for rask søking på delivery_date og payment_status
-- ================================================================

-- ================================================================
-- MANUAL SETUP REQUIRED IN SUPABASE DASHBOARD:
--
-- 1. Create Storage bucket named: tidskapsell-uploads
--    Settings: Private bucket (not public)
--    Allowed MIME types: image/jpeg, image/png, image/gif, image/webp,
--                        video/mp4, video/quicktime, video/x-msvideo
--    Max file size: 1073741824 (1 GB)
--
-- 2. Run this SQL after creating the bucket to allow service role access:
--    INSERT INTO storage.buckets (id, name, public)
--    VALUES ('tidskapsell-uploads', 'tidskapsell-uploads', false)
--    ON CONFLICT DO NOTHING;
-- ================================================================


-- ================================================================
-- 1. TABELLER
-- ================================================================

-- ---------- orders ----------
CREATE TABLE IF NOT EXISTS public.orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  order_number      TEXT UNIQUE,                       -- fylles inn av trigger
  customer_name     TEXT NOT NULL,
  customer_email    TEXT NOT NULL,
  recipient_type    TEXT NOT NULL CHECK (recipient_type IN ('meg_selv','andre')),
  delivery_type     TEXT NOT NULL CHECK (delivery_type IN ('digitalt','fysisk','tidskapsell')),
  recipient_name    TEXT,
  recipient_email   TEXT,
  recipient_address TEXT,
  recipient_zip     TEXT,
  recipient_city    TEXT,
  delivery_date     DATE NOT NULL,
  occasion          TEXT,
  product_type      TEXT NOT NULL CHECK (product_type IN ('digitalt','fysisk')),
  amount            INTEGER NOT NULL,                  -- i hele kroner
  payment_status    TEXT NOT NULL DEFAULT 'pending'
                    CHECK (payment_status IN ('pending','paid','failed')),
  payment_method    TEXT CHECK (payment_method IN ('stripe','vipps')),
  stripe_session_id TEXT,
  vipps_order_id    TEXT
);

COMMENT ON TABLE public.orders IS 'Alle bestillinger av tidsbrev';


-- ---------- letters ----------
CREATE TABLE IF NOT EXISTS public.letters (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  letter_content TEXT NOT NULL DEFAULT '',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at        TIMESTAMPTZ,
  status         TEXT NOT NULL DEFAULT 'stored'
                 CHECK (status IN ('stored','sent','failed'))
);

COMMENT ON TABLE public.letters IS 'Selve brevinnholdet, knyttet til en ordre';


-- ---------- admin_log ----------
CREATE TABLE IF NOT EXISTS public.admin_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  action     TEXT NOT NULL,
  order_id   UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  note       TEXT
);

COMMENT ON TABLE public.admin_log IS 'Audit-logg for administratorhandlinger';


-- ================================================================
-- 2. INDEXES — for rask søking
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date
  ON public.orders (delivery_date);

CREATE INDEX IF NOT EXISTS idx_orders_payment_status
  ON public.orders (payment_status);

-- Ekstra nyttige indexes:
CREATE INDEX IF NOT EXISTS idx_orders_customer_email
  ON public.orders (customer_email);

CREATE INDEX IF NOT EXISTS idx_letters_order_id
  ON public.letters (order_id);

CREATE INDEX IF NOT EXISTS idx_letters_status
  ON public.letters (status);

CREATE INDEX IF NOT EXISTS idx_admin_log_order_id
  ON public.admin_log (order_id);


-- ================================================================
-- 3. TRIGGER — automatisk generering av order_number
-- ================================================================
-- Format: FRB-YYYY-NNN (f.eks. FRB-2024-001)
-- Nummerserien begynner på nytt hvert år.
-- ================================================================

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  current_year TEXT;
  next_num INTEGER;
  new_number TEXT;
BEGIN
  -- Ikke overskriv hvis order_number allerede er satt
  IF NEW.order_number IS NOT NULL AND NEW.order_number <> '' THEN
    RETURN NEW;
  END IF;

  current_year := TO_CHAR(NOW(), 'YYYY');

  -- Finn høyeste nummer for inneværende år
  SELECT COALESCE(
    MAX(
      CAST(
        SUBSTRING(order_number FROM 'FRB-\d{4}-(\d+)') AS INTEGER
      )
    ),
    0
  ) + 1
  INTO next_num
  FROM public.orders
  WHERE order_number LIKE 'FRB-' || current_year || '-%';

  -- Bygg lesbart ordrenummer, padset til minst 3 sifre
  new_number := 'FRB-' || current_year || '-' || LPAD(next_num::TEXT, 3, '0');
  NEW.order_number := new_number;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_order_number ON public.orders;

CREATE TRIGGER set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_order_number();


-- ================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ================================================================
-- Skrur på RLS på alle tabeller. Standard-policyen er da at
-- INGEN har tilgang, og vi åpner eksplisitt for det vi trenger.
-- ================================================================

ALTER TABLE public.orders    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.letters   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_log ENABLE ROW LEVEL SECURITY;


-- ---------- orders ----------
-- Nye ordrer kan opprettes av alle (også anonyme), men bare
-- begrenset sett med felter skal settes av klienten. Selve
-- valideringen skjer i applikasjonen/backend.

DROP POLICY IF EXISTS "Alle kan opprette en ordre" ON public.orders;
CREATE POLICY "Alle kan opprette en ordre"
  ON public.orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Kun egen ordre kan leses, og kun av innloggede brukere
-- hvor e-post matcher customer_email.
DROP POLICY IF EXISTS "Kunde kan lese egen ordre" ON public.orders;
CREATE POLICY "Kunde kan lese egen ordre"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (customer_email = auth.jwt() ->> 'email');

-- Anon kan lese ordre via ordrenummer (brukes av takk.html etter betaling).
-- Ordrenummeret er unikt og deles kun med kunden via URL-redirect.
DROP POLICY IF EXISTS "Anon kan lese ordre via ordrenummer" ON public.orders;
CREATE POLICY "Anon kan lese ordre via ordrenummer"
  ON public.orders
  FOR SELECT
  TO anon
  USING (true);

-- Kunde kan IKKE oppdatere eller slette egne ordrer selv.
-- Oppdatering skjer kun via service_role (backend-webhooks).

-- ---------- letters ----------
-- Brev kan opprettes av alle (sammen med ordren), men kun
-- leses av eieren av ordren.

DROP POLICY IF EXISTS "Alle kan opprette brev" ON public.letters;
CREATE POLICY "Alle kan opprette brev"
  ON public.letters
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Kunde kan lese eget brev" ON public.letters;
CREATE POLICY "Kunde kan lese eget brev"
  ON public.letters
  FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM public.orders
      WHERE customer_email = auth.jwt() ->> 'email'
    )
  );


-- ---------- admin_log ----------
-- Ingen fra frontend skal kunne lese eller skrive til admin_log.
-- Kun service_role (backend) får tilgang — service_role omgår
-- RLS automatisk, så vi lager ingen åpne policies her.

-- (med vilje tom — alle tilganger skjer via service_role)


-- ================================================================
-- 5. SCHEMA UPDATES — Tidskapsell & delivery tokens
-- ================================================================

-- Update orders product_type constraint to include 'tidskapsell'
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_product_type_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_product_type_check
  CHECK (product_type IN ('digitalt', 'fysisk', 'tidskapsell'));

-- Update orders delivery_type constraint to include 'tidskapsell'
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_delivery_type_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_delivery_type_check
  CHECK (delivery_type IN ('digitalt', 'fysisk', 'tidskapsell'));

-- Add design_theme column to letters
ALTER TABLE public.letters
  ADD COLUMN IF NOT EXISTS design_theme TEXT DEFAULT 'klassisk'
  CHECK (design_theme IN ('klassisk', 'romantisk', 'moderne', 'eventyr'));


-- ---------- letter_tokens ----------
CREATE TABLE IF NOT EXISTS public.letter_tokens (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  letter_id    UUID NOT NULL REFERENCES public.letters(id) ON DELETE CASCADE,
  token        TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at   TIMESTAMPTZ,
  opened_at    TIMESTAMPTZ,
  allow_reopen BOOLEAN NOT NULL DEFAULT true
);

COMMENT ON TABLE public.letter_tokens IS
  'Secure delivery tokens for digital letter viewer. Single-use or multi-use depending on allow_reopen.';

CREATE INDEX IF NOT EXISTS letter_tokens_token_idx ON public.letter_tokens(token);
CREATE INDEX IF NOT EXISTS letter_tokens_letter_id_idx ON public.letter_tokens(letter_id);


-- ---------- tidskapsell_files ----------
CREATE TABLE IF NOT EXISTS public.tidskapsell_files (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  file_path    TEXT NOT NULL,
  file_name    TEXT NOT NULL,
  file_size    BIGINT NOT NULL,
  mime_type    TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.tidskapsell_files IS
  'File metadata for Tidskapsell uploads stored in Supabase Storage bucket tidskapsell-uploads';

CREATE INDEX IF NOT EXISTS tidskapsell_files_order_id_idx ON public.tidskapsell_files(order_id);


-- ================================================================
-- 6. RLS FOR NEW TABLES
-- ================================================================

-- letter_tokens: only backend (service role) can read/write
ALTER TABLE public.letter_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access letter_tokens"
  ON public.letter_tokens
  USING (auth.role() = 'service_role');

-- Allow anonymous token lookup (needed for brev-viewer.html frontend)
CREATE POLICY "Anon can read token by value"
  ON public.letter_tokens FOR SELECT
  USING (true);

-- tidskapsell_files: only backend can write, anon cannot read
ALTER TABLE public.tidskapsell_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access tidskapsell_files"
  ON public.tidskapsell_files
  USING (auth.role() = 'service_role');


-- ================================================================
-- FERDIG
-- ================================================================
-- Test at alt fungerer ved å kjøre:
--   INSERT INTO orders (customer_name, customer_email, recipient_type,
--     delivery_type, delivery_date, product_type, amount)
--   VALUES ('Test Testesen','test@eksempel.no','meg_selv','digitalt',
--     '2030-01-01','standard',349);
--   SELECT order_number FROM orders ORDER BY created_at DESC LIMIT 1;
-- ================================================================
