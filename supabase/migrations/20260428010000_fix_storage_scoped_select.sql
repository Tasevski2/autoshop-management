-- Add scoped SELECT policy so authenticated users can access their own files.
-- Required for storage.remove() to work (needs SELECT to locate objects).
-- Replaces the broad policies dropped in 20260428000000.
CREATE POLICY "service_images_select_own"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'service-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
);
