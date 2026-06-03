CREATE TABLE public.site_settings (
  id INT PRIMARY KEY DEFAULT 1,
  logo_url TEXT NOT NULL,
  logo_size INT NOT NULL DEFAULT 36,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT site_settings_singleton CHECK (id = 1)
);

GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;
GRANT UPDATE, INSERT ON public.site_settings TO authenticated;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site settings"
ON public.site_settings FOR SELECT
USING (true);

CREATE POLICY "Admins can update site settings"
ON public.site_settings FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert site settings"
ON public.site_settings FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.site_settings (id, logo_url, logo_size)
VALUES (1, '/__l5e/assets-v1/9d7df647-0109-4add-871d-149a8c4bbec5/logo.png', 36)
ON CONFLICT (id) DO NOTHING;