-- ============================================================================
-- VEHICLE BRANDS (user's custom brand list for vehicle form)
-- ============================================================================
CREATE TABLE public.vehicle_brands (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vehicle_brands_user_id ON public.vehicle_brands(user_id);
CREATE UNIQUE INDEX idx_vehicle_brands_user_name ON public.vehicle_brands(user_id, LOWER(name));

-- ============================================================================
-- VEHICLE MODELS (models per brand)
-- ============================================================================
CREATE TABLE public.vehicle_models (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id uuid NOT NULL REFERENCES public.vehicle_brands(id) ON DELETE CASCADE,
    name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vehicle_models_brand_id ON public.vehicle_models(brand_id);
CREATE UNIQUE INDEX idx_vehicle_models_brand_name ON public.vehicle_models(brand_id, LOWER(name));

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE public.vehicle_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_models ENABLE ROW LEVEL SECURITY;

-- Brands: scoped to user
CREATE POLICY "vehicle_brands_own" ON public.vehicle_brands
    FOR ALL
    USING (user_id = auth.uid());

-- Models: scoped via brand -> user
CREATE POLICY "vehicle_models_own" ON public.vehicle_models
    FOR ALL
    USING (brand_id IN (
        SELECT id FROM public.vehicle_brands WHERE user_id = auth.uid()
    ));
