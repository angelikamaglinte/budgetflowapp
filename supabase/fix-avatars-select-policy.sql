-- The avatars bucket being "public" only lets anonymous viewers fetch an
-- image via the special /object/public/... URL. Authenticated operations
-- (like the upsert's existence check during upload) still go through normal
-- RLS and need their own SELECT grant, same as the files/receipts buckets.
CREATE POLICY "Users can view their own avatar (authenticated)"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
