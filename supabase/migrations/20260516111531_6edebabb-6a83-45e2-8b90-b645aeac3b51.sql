ALTER TABLE public.games
  ADD COLUMN badge_type text CHECK (badge_type IN ('trending','new','update','hot','hoy')),
  ADD COLUMN badge_expires_at timestamptz;