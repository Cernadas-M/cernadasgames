CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text,
  subject_type text NOT NULL CHECK (subject_type IN ('error','new_game','other')),
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit contact" ON public.contact_messages
FOR INSERT TO anon, authenticated WITH CHECK (
  length(email) BETWEEN 3 AND 255
  AND length(message) BETWEEN 1 AND 5000
  AND (name IS NULL OR length(name) <= 120)
);

CREATE POLICY "Admins view contact" ON public.contact_messages
FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete contact" ON public.contact_messages
FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

DELETE FROM public.categories WHERE slug IN ('survival','parkour','puzzle','accion','multijugador');