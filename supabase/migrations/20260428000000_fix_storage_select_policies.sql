-- Remove overly broad SELECT policies on service-images bucket.
-- The bucket is public, so objects are readable by direct URL.
-- These policies were allowing clients to list ALL files in the bucket.
DROP POLICY IF EXISTS "service_images_read" ON storage.objects;
DROP POLICY IF EXISTS "service_images_public_read" ON storage.objects;
