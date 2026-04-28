-- Remove color, add engine_capacity and engine_designation to vehicles
ALTER TABLE public.vehicles DROP COLUMN IF EXISTS color;
ALTER TABLE public.vehicles ADD COLUMN engine_capacity double precision;
ALTER TABLE public.vehicles ADD COLUMN engine_designation text;
