
-- Storage bucket for game files (HTML5 bundles, .exe, etc.)
INSERT INTO storage.buckets (id, name, public)
VALUES ('games', 'games', true)
ON CONFLICT (id) DO NOTHING;

-- Public can read
CREATE POLICY "Game files public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'games');

-- Admins can upload/update/delete
CREATE POLICY "Admins upload game files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'games' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update game files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'games' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete game files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'games' AND public.has_role(auth.uid(), 'admin'));

-- Allow new game_type values: 'download' (.exe etc.)
-- (no existing CHECK constraint to drop based on schema; nothing to alter)
