-- Create the service-images storage bucket (public for read access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('service-images', 'service-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: authenticated users can upload to their own folder
-- Path convention: {user_id}/{service_id}/{filename}
CREATE POLICY "service_images_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'service-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage policy: authenticated users can read any public image
-- (bucket is public, but this ensures authenticated access too)
CREATE POLICY "service_images_read"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'service-images'
);

-- Storage policy: users can only delete their own images
CREATE POLICY "service_images_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'service-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage policy: allow public read (since bucket is public)
CREATE POLICY "service_images_public_read"
ON storage.objects FOR SELECT
TO anon
USING (
    bucket_id = 'service-images'
);
