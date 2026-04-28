-- Add file_size column to track compressed image sizes for storage management
ALTER TABLE public.service_images ADD COLUMN file_size bigint;
