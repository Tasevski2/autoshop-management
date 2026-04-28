-- Index on new FK column used in joins and trigger updates
CREATE INDEX idx_vehicles_last_service_id ON public.vehicles (last_service_id);

-- Compound index for the most common service query pattern:
-- filter by vehicle_id + order by service_date DESC (vehicle detail, customer detail, trigger)
CREATE INDEX idx_services_vehicle_date ON public.services (vehicle_id, service_date DESC);

-- Extend notifications index to cover ordering by created_at (infinite scroll pagination)
DROP INDEX IF EXISTS public.idx_notifications_dismissed;
CREATE INDEX idx_notifications_dismissed ON public.notifications (user_id, is_dismissed, created_at DESC);

-- Trigram indexes for ILIKE '%term%' searches (leading wildcard can't use btree)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX idx_vehicles_plate_trgm ON public.vehicles USING gin (plate_number gin_trgm_ops);
CREATE INDEX idx_vehicles_brand_trgm ON public.vehicles USING gin (brand gin_trgm_ops);
CREATE INDEX idx_customers_fullname_trgm ON public.customers USING gin (full_name gin_trgm_ops);

-- Filter on is_active used in parts autocomplete
CREATE INDEX idx_parts_catalog_active ON public.parts_catalog (is_active) WHERE is_active = true;
