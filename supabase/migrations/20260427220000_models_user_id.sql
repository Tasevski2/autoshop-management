-- ============================================================================
-- Add user_id to vehicle_models so users can add custom models to any brand
-- Global models: user_id IS NULL (seeded, visible to all, not deletable)
-- User models:   user_id IS NOT NULL (visible + editable only by that user)
-- ============================================================================

-- 1. Add nullable user_id column
ALTER TABLE public.vehicle_models
    ADD COLUMN user_id uuid REFERENCES public.users(id) ON DELETE CASCADE;

CREATE INDEX idx_vehicle_models_user_id ON public.vehicle_models(user_id);

-- 2. Replace unique index to handle both global and user-specific models
DROP INDEX IF EXISTS idx_vehicle_models_brand_name;

CREATE UNIQUE INDEX idx_vehicle_models_global_name
    ON public.vehicle_models (brand_id, LOWER(name)) WHERE user_id IS NULL;
CREATE UNIQUE INDEX idx_vehicle_models_user_name
    ON public.vehicle_models (user_id, brand_id, LOWER(name)) WHERE user_id IS NOT NULL;

-- 3. Replace RLS policies
DROP POLICY IF EXISTS "vehicle_models_select" ON public.vehicle_models;
DROP POLICY IF EXISTS "vehicle_models_insert" ON public.vehicle_models;
DROP POLICY IF EXISTS "vehicle_models_update" ON public.vehicle_models;
DROP POLICY IF EXISTS "vehicle_models_delete" ON public.vehicle_models;

-- SELECT: global + own models (brand must also be visible)
CREATE POLICY "vehicle_models_select" ON public.vehicle_models
    FOR SELECT
    USING (
        (user_id IS NULL OR user_id = auth.uid())
        AND brand_id IN (
            SELECT id FROM public.vehicle_brands
            WHERE user_id IS NULL OR user_id = auth.uid()
        )
    );

-- INSERT: user_id must be auth.uid(), brand must be visible
CREATE POLICY "vehicle_models_insert" ON public.vehicle_models
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND brand_id IN (
            SELECT id FROM public.vehicle_brands
            WHERE user_id IS NULL OR user_id = auth.uid()
        )
    );

-- UPDATE/DELETE: only own models
CREATE POLICY "vehicle_models_update" ON public.vehicle_models
    FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "vehicle_models_delete" ON public.vehicle_models
    FOR DELETE
    USING (user_id = auth.uid());
