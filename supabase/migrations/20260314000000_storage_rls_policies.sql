-- Storage RLS policies for documents and photos buckets
-- Run this in the Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- ─── ENSURE BUCKETS EXIST AND ARE PUBLIC ──────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('documents', 'documents', true),
  ('photos',    'photos',    true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ─── DOCUMENTS BUCKET POLICIES ────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow anon uploads on documents"  ON storage.objects;
DROP POLICY IF EXISTS "Allow anon reads on documents"    ON storage.objects;
DROP POLICY IF EXISTS "Allow anon deletes on documents"  ON storage.objects;

CREATE POLICY "Allow anon uploads on documents"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Allow anon reads on documents"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'documents');

CREATE POLICY "Allow anon deletes on documents"
  ON storage.objects FOR DELETE
  TO anon
  USING (bucket_id = 'documents');

-- ─── PHOTOS BUCKET POLICIES ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow anon uploads on photos"  ON storage.objects;
DROP POLICY IF EXISTS "Allow anon reads on photos"    ON storage.objects;
DROP POLICY IF EXISTS "Allow anon deletes on photos"  ON storage.objects;

CREATE POLICY "Allow anon uploads on photos"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'photos');

CREATE POLICY "Allow anon reads on photos"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'photos');

CREATE POLICY "Allow anon deletes on photos"
  ON storage.objects FOR DELETE
  TO anon
  USING (bucket_id = 'photos');
