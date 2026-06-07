ALTER TABLE public.site_settings 
  ADD COLUMN IF NOT EXISTS intro_logo_url text,
  ADD COLUMN IF NOT EXISTS intro_duration_ms integer NOT NULL DEFAULT 2500;