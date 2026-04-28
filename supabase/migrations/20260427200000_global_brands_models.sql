-- ============================================================================
-- Make vehicle_brands support global (shared) + user-specific brands
-- Global brands: user_id IS NULL — visible to all, not editable by users
-- User brands:   user_id IS NOT NULL — visible & editable only by that user
-- ============================================================================

-- 1. Allow NULL user_id for global brands
ALTER TABLE public.vehicle_brands ALTER COLUMN user_id DROP NOT NULL;

-- 2. Replace the unique index to handle both cases
--    Global: unique on LOWER(name) where user_id IS NULL
--    User:   unique on (user_id, LOWER(name)) where user_id IS NOT NULL
DROP INDEX IF EXISTS idx_vehicle_brands_user_name;
CREATE UNIQUE INDEX idx_vehicle_brands_global_name
    ON public.vehicle_brands (LOWER(name)) WHERE user_id IS NULL;
CREATE UNIQUE INDEX idx_vehicle_brands_user_name
    ON public.vehicle_brands (user_id, LOWER(name)) WHERE user_id IS NOT NULL;

-- 3. Update RLS policies — users can see global + own brands
DROP POLICY IF EXISTS "vehicle_brands_own" ON public.vehicle_brands;

-- SELECT: global (user_id IS NULL) + own
CREATE POLICY "vehicle_brands_select" ON public.vehicle_brands
    FOR SELECT
    USING (user_id IS NULL OR user_id = auth.uid());

-- INSERT: only user-specific brands (user_id must be auth.uid())
CREATE POLICY "vehicle_brands_insert" ON public.vehicle_brands
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- UPDATE/DELETE: only own brands (not global)
CREATE POLICY "vehicle_brands_update" ON public.vehicle_brands
    FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "vehicle_brands_delete" ON public.vehicle_brands
    FOR DELETE
    USING (user_id = auth.uid());

-- 4. Update models RLS — visible if brand is global or owned by user
DROP POLICY IF EXISTS "vehicle_models_own" ON public.vehicle_models;

CREATE POLICY "vehicle_models_select" ON public.vehicle_models
    FOR SELECT
    USING (brand_id IN (
        SELECT id FROM public.vehicle_brands
        WHERE user_id IS NULL OR user_id = auth.uid()
    ));

CREATE POLICY "vehicle_models_insert" ON public.vehicle_models
    FOR INSERT
    WITH CHECK (brand_id IN (
        SELECT id FROM public.vehicle_brands WHERE user_id = auth.uid()
    ));

CREATE POLICY "vehicle_models_update" ON public.vehicle_models
    FOR UPDATE
    USING (brand_id IN (
        SELECT id FROM public.vehicle_brands WHERE user_id = auth.uid()
    ));

CREATE POLICY "vehicle_models_delete" ON public.vehicle_models
    FOR DELETE
    USING (brand_id IN (
        SELECT id FROM public.vehicle_brands WHERE user_id = auth.uid()
    ));

-- ============================================================================
-- 5. Seed global brands & models (user_id = NULL)
-- ============================================================================

DO $$
DECLARE
    v_brand_id uuid;
BEGIN
    -- Volkswagen
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Volkswagen') ON CONFLICT DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'volkswagen';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'Golf'), (v_brand_id, 'Passat'), (v_brand_id, 'Polo'), (v_brand_id, 'Tiguan'),
        (v_brand_id, 'Touran'), (v_brand_id, 'Caddy'), (v_brand_id, 'Jetta'), (v_brand_id, 'Sharan'),
        (v_brand_id, 'Touareg'), (v_brand_id, 'Arteon'), (v_brand_id, 'T-Roc'), (v_brand_id, 'ID.3'),
        (v_brand_id, 'ID.4'), (v_brand_id, 'Up'), (v_brand_id, 'Bora')
    ON CONFLICT (brand_id, LOWER(name)) DO NOTHING;

    -- Audi
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Audi') ON CONFLICT DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'audi';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'A3'), (v_brand_id, 'A4'), (v_brand_id, 'A5'), (v_brand_id, 'A6'),
        (v_brand_id, 'A7'), (v_brand_id, 'A8'), (v_brand_id, 'Q3'), (v_brand_id, 'Q5'),
        (v_brand_id, 'Q7'), (v_brand_id, 'Q8'), (v_brand_id, 'TT'), (v_brand_id, 'RS3'),
        (v_brand_id, 'RS4'), (v_brand_id, 'RS5'), (v_brand_id, 'RS6'), (v_brand_id, 'S3'),
        (v_brand_id, 'S4'), (v_brand_id, 'S5'), (v_brand_id, 'e-tron'), (v_brand_id, 'e-tron GT')
    ON CONFLICT (brand_id, LOWER(name)) DO NOTHING;

    -- Mercedes-Benz
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Mercedes-Benz') ON CONFLICT DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'mercedes-benz';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'A-Class'), (v_brand_id, 'B-Class'), (v_brand_id, 'C-Class'), (v_brand_id, 'E-Class'),
        (v_brand_id, 'S-Class'), (v_brand_id, 'CLA'), (v_brand_id, 'CLS'), (v_brand_id, 'GLA'),
        (v_brand_id, 'GLB'), (v_brand_id, 'GLC'), (v_brand_id, 'GLE'), (v_brand_id, 'GLS'),
        (v_brand_id, 'G-Class'), (v_brand_id, 'Vito'), (v_brand_id, 'Sprinter'), (v_brand_id, 'EQA'),
        (v_brand_id, 'EQC')
    ON CONFLICT (brand_id, LOWER(name)) DO NOTHING;

    -- BMW
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'BMW') ON CONFLICT DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'bmw';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, '1 Series'), (v_brand_id, '2 Series'), (v_brand_id, '3 Series'), (v_brand_id, '4 Series'),
        (v_brand_id, '5 Series'), (v_brand_id, '6 Series'), (v_brand_id, '7 Series'), (v_brand_id, 'X1'),
        (v_brand_id, 'X2'), (v_brand_id, 'X3'), (v_brand_id, 'X4'), (v_brand_id, 'X5'),
        (v_brand_id, 'X6'), (v_brand_id, 'X7'), (v_brand_id, 'Z4'), (v_brand_id, 'i3'),
        (v_brand_id, 'iX'), (v_brand_id, 'iX3')
    ON CONFLICT (brand_id, LOWER(name)) DO NOTHING;

    -- Opel
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Opel') ON CONFLICT DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'opel';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'Astra'), (v_brand_id, 'Corsa'), (v_brand_id, 'Insignia'), (v_brand_id, 'Mokka'),
        (v_brand_id, 'Crossland'), (v_brand_id, 'Grandland'), (v_brand_id, 'Zafira'), (v_brand_id, 'Combo'),
        (v_brand_id, 'Vivaro'), (v_brand_id, 'Meriva'), (v_brand_id, 'Vectra'), (v_brand_id, 'Omega')
    ON CONFLICT (brand_id, LOWER(name)) DO NOTHING;

    -- Ford
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Ford') ON CONFLICT DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'ford';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'Focus'), (v_brand_id, 'Fiesta'), (v_brand_id, 'Mondeo'), (v_brand_id, 'Kuga'),
        (v_brand_id, 'Puma'), (v_brand_id, 'EcoSport'), (v_brand_id, 'Galaxy'), (v_brand_id, 'S-Max'),
        (v_brand_id, 'Ranger'), (v_brand_id, 'Transit'), (v_brand_id, 'Transit Connect'), (v_brand_id, 'Mustang')
    ON CONFLICT (brand_id, LOWER(name)) DO NOTHING;

    -- Renault
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Renault') ON CONFLICT DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'renault';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'Clio'), (v_brand_id, 'Megane'), (v_brand_id, 'Scenic'), (v_brand_id, 'Captur'),
        (v_brand_id, 'Kadjar'), (v_brand_id, 'Koleos'), (v_brand_id, 'Talisman'), (v_brand_id, 'Kangoo'),
        (v_brand_id, 'Master'), (v_brand_id, 'Twingo'), (v_brand_id, 'Laguna'), (v_brand_id, 'Zoe')
    ON CONFLICT (brand_id, LOWER(name)) DO NOTHING;

    -- Peugeot
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Peugeot') ON CONFLICT DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'peugeot';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, '206'), (v_brand_id, '207'), (v_brand_id, '208'), (v_brand_id, '301'),
        (v_brand_id, '308'), (v_brand_id, '3008'), (v_brand_id, '5008'), (v_brand_id, '508'),
        (v_brand_id, '2008'), (v_brand_id, 'Partner'), (v_brand_id, 'Rifter'), (v_brand_id, 'Expert'),
        (v_brand_id, '407')
    ON CONFLICT (brand_id, LOWER(name)) DO NOTHING;

    -- Citroën
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Citroën') ON CONFLICT DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'citroën';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'C3'), (v_brand_id, 'C4'), (v_brand_id, 'C5'), (v_brand_id, 'C3 Aircross'),
        (v_brand_id, 'C4 Cactus'), (v_brand_id, 'C5 Aircross'), (v_brand_id, 'Berlingo'), (v_brand_id, 'Jumpy'),
        (v_brand_id, 'Jumper'), (v_brand_id, 'C-Elysée'), (v_brand_id, 'DS3'), (v_brand_id, 'DS4'),
        (v_brand_id, 'DS5')
    ON CONFLICT (brand_id, LOWER(name)) DO NOTHING;

    -- Fiat
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Fiat') ON CONFLICT DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'fiat';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'Punto'), (v_brand_id, 'Panda'), (v_brand_id, '500'), (v_brand_id, '500L'),
        (v_brand_id, '500X'), (v_brand_id, 'Tipo'), (v_brand_id, 'Bravo'), (v_brand_id, 'Doblo'),
        (v_brand_id, 'Ducato'), (v_brand_id, 'Linea'), (v_brand_id, 'Stilo'), (v_brand_id, 'Marea')
    ON CONFLICT (brand_id, LOWER(name)) DO NOTHING;

    -- Alfa Romeo
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Alfa Romeo') ON CONFLICT DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'alfa romeo';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'Giulietta'), (v_brand_id, 'Giulia'), (v_brand_id, 'Stelvio'), (v_brand_id, 'MiTo'),
        (v_brand_id, '159'), (v_brand_id, '147'), (v_brand_id, '156'), (v_brand_id, 'GT')
    ON CONFLICT (brand_id, LOWER(name)) DO NOTHING;

    -- Toyota
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Toyota') ON CONFLICT DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'toyota';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'Corolla'), (v_brand_id, 'Yaris'), (v_brand_id, 'RAV4'), (v_brand_id, 'C-HR'),
        (v_brand_id, 'Camry'), (v_brand_id, 'Land Cruiser'), (v_brand_id, 'Hilux'), (v_brand_id, 'Auris'),
        (v_brand_id, 'Avensis'), (v_brand_id, 'Prius'), (v_brand_id, 'Aygo'), (v_brand_id, 'Supra'),
        (v_brand_id, 'Proace')
    ON CONFLICT (brand_id, LOWER(name)) DO NOTHING;

    -- Hyundai
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Hyundai') ON CONFLICT DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'hyundai';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'i10'), (v_brand_id, 'i20'), (v_brand_id, 'i30'), (v_brand_id, 'i40'),
        (v_brand_id, 'Tucson'), (v_brand_id, 'Santa Fe'), (v_brand_id, 'Kona'), (v_brand_id, 'Bayon'),
        (v_brand_id, 'Elantra'), (v_brand_id, 'Accent'), (v_brand_id, 'ix35'), (v_brand_id, 'Ioniq'),
        (v_brand_id, 'Ioniq 5')
    ON CONFLICT (brand_id, LOWER(name)) DO NOTHING;

    -- Kia
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Kia') ON CONFLICT DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'kia';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'Ceed'), (v_brand_id, 'Rio'), (v_brand_id, 'Sportage'), (v_brand_id, 'Sorento'),
        (v_brand_id, 'Picanto'), (v_brand_id, 'Stonic'), (v_brand_id, 'Niro'), (v_brand_id, 'Optima'),
        (v_brand_id, 'Venga'), (v_brand_id, 'XCeed'), (v_brand_id, 'EV6')
    ON CONFLICT (brand_id, LOWER(name)) DO NOTHING;

    -- Škoda
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Škoda') ON CONFLICT DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'škoda';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'Octavia'), (v_brand_id, 'Fabia'), (v_brand_id, 'Superb'), (v_brand_id, 'Karoq'),
        (v_brand_id, 'Kodiaq'), (v_brand_id, 'Kamiq'), (v_brand_id, 'Scala'), (v_brand_id, 'Rapid'),
        (v_brand_id, 'Yeti'), (v_brand_id, 'Roomster'), (v_brand_id, 'Citigo'), (v_brand_id, 'Enyaq')
    ON CONFLICT (brand_id, LOWER(name)) DO NOTHING;

    -- Seat
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Seat') ON CONFLICT DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'seat';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'Ibiza'), (v_brand_id, 'Leon'), (v_brand_id, 'Ateca'), (v_brand_id, 'Arona'),
        (v_brand_id, 'Tarraco'), (v_brand_id, 'Alhambra'), (v_brand_id, 'Toledo'), (v_brand_id, 'Altea')
    ON CONFLICT (brand_id, LOWER(name)) DO NOTHING;

    -- Dacia
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Dacia') ON CONFLICT DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'dacia';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'Sandero'), (v_brand_id, 'Duster'), (v_brand_id, 'Logan'), (v_brand_id, 'Lodgy'),
        (v_brand_id, 'Dokker'), (v_brand_id, 'Spring'), (v_brand_id, 'Jogger')
    ON CONFLICT (brand_id, LOWER(name)) DO NOTHING;

    -- Nissan
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Nissan') ON CONFLICT DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'nissan';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'Qashqai'), (v_brand_id, 'Juke'), (v_brand_id, 'X-Trail'), (v_brand_id, 'Micra'),
        (v_brand_id, 'Navara'), (v_brand_id, 'Leaf'), (v_brand_id, 'Note'), (v_brand_id, 'Pathfinder'),
        (v_brand_id, 'Patrol'), (v_brand_id, 'Pulsar')
    ON CONFLICT (brand_id, LOWER(name)) DO NOTHING;

    -- Honda
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Honda') ON CONFLICT DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'honda';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'Civic'), (v_brand_id, 'CR-V'), (v_brand_id, 'HR-V'), (v_brand_id, 'Jazz'),
        (v_brand_id, 'Accord'), (v_brand_id, 'CR-Z'), (v_brand_id, 'e')
    ON CONFLICT (brand_id, LOWER(name)) DO NOTHING;

    -- Mazda
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Mazda') ON CONFLICT DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'mazda';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, '3'), (v_brand_id, '6'), (v_brand_id, 'CX-3'), (v_brand_id, 'CX-5'),
        (v_brand_id, 'CX-30'), (v_brand_id, 'CX-60'), (v_brand_id, 'MX-5'), (v_brand_id, '2')
    ON CONFLICT (brand_id, LOWER(name)) DO NOTHING;

    -- Suzuki
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Suzuki') ON CONFLICT DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'suzuki';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'Vitara'), (v_brand_id, 'SX4'), (v_brand_id, 'Swift'), (v_brand_id, 'Jimny'),
        (v_brand_id, 'Ignis'), (v_brand_id, 'S-Cross'), (v_brand_id, 'Baleno'), (v_brand_id, 'Celerio')
    ON CONFLICT (brand_id, LOWER(name)) DO NOTHING;

    -- Mitsubishi
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Mitsubishi') ON CONFLICT DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'mitsubishi';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'Outlander'), (v_brand_id, 'ASX'), (v_brand_id, 'L200'), (v_brand_id, 'Pajero'),
        (v_brand_id, 'Eclipse Cross'), (v_brand_id, 'Lancer'), (v_brand_id, 'Colt'), (v_brand_id, 'Space Star')
    ON CONFLICT (brand_id, LOWER(name)) DO NOTHING;

    -- Volvo
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Volvo') ON CONFLICT DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'volvo';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'XC60'), (v_brand_id, 'XC90'), (v_brand_id, 'XC40'), (v_brand_id, 'S60'),
        (v_brand_id, 'S90'), (v_brand_id, 'V40'), (v_brand_id, 'V60'), (v_brand_id, 'V90'),
        (v_brand_id, 'C40')
    ON CONFLICT (brand_id, LOWER(name)) DO NOTHING;

    -- Land Rover
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Land Rover') ON CONFLICT DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'land rover';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'Range Rover'), (v_brand_id, 'Range Rover Sport'), (v_brand_id, 'Range Rover Evoque'),
        (v_brand_id, 'Range Rover Velar'), (v_brand_id, 'Discovery'), (v_brand_id, 'Discovery Sport'),
        (v_brand_id, 'Defender'), (v_brand_id, 'Freelander')
    ON CONFLICT (brand_id, LOWER(name)) DO NOTHING;

    -- Jeep
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Jeep') ON CONFLICT DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'jeep';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'Renegade'), (v_brand_id, 'Compass'), (v_brand_id, 'Cherokee'),
        (v_brand_id, 'Grand Cherokee'), (v_brand_id, 'Wrangler')
    ON CONFLICT (brand_id, LOWER(name)) DO NOTHING;

    -- Chevrolet
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Chevrolet') ON CONFLICT DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'chevrolet';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'Aveo'), (v_brand_id, 'Cruze'), (v_brand_id, 'Captiva'), (v_brand_id, 'Spark'),
        (v_brand_id, 'Orlando'), (v_brand_id, 'Trax'), (v_brand_id, 'Lacetti')
    ON CONFLICT (brand_id, LOWER(name)) DO NOTHING;

    -- Porsche
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Porsche') ON CONFLICT DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'porsche';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'Cayenne'), (v_brand_id, 'Macan'), (v_brand_id, 'Panamera'), (v_brand_id, '911'),
        (v_brand_id, 'Taycan'), (v_brand_id, 'Boxster'), (v_brand_id, 'Cayman')
    ON CONFLICT (brand_id, LOWER(name)) DO NOTHING;

    -- Mini
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Mini') ON CONFLICT DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'mini';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'Cooper'), (v_brand_id, 'Countryman'), (v_brand_id, 'Clubman'), (v_brand_id, 'Paceman')
    ON CONFLICT (brand_id, LOWER(name)) DO NOTHING;

    -- Subaru
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Subaru') ON CONFLICT DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'subaru';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'Forester'), (v_brand_id, 'Outback'), (v_brand_id, 'XV'), (v_brand_id, 'Impreza'),
        (v_brand_id, 'Legacy'), (v_brand_id, 'WRX')
    ON CONFLICT (brand_id, LOWER(name)) DO NOTHING;

    -- Tesla
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Tesla') ON CONFLICT DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'tesla';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'Model 3'), (v_brand_id, 'Model Y'), (v_brand_id, 'Model S'), (v_brand_id, 'Model X')
    ON CONFLICT (brand_id, LOWER(name)) DO NOTHING;

    -- Lada
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Lada') ON CONFLICT DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'lada';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'Niva'), (v_brand_id, 'Samara'), (v_brand_id, 'Granta'), (v_brand_id, 'Vesta'),
        (v_brand_id, '2107'), (v_brand_id, '2106')
    ON CONFLICT (brand_id, LOWER(name)) DO NOTHING;

    -- Zastava
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Zastava') ON CONFLICT DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'zastava';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'Yugo'), (v_brand_id, '101'), (v_brand_id, '128'), (v_brand_id, '750')
    ON CONFLICT (brand_id, LOWER(name)) DO NOTHING;

    RAISE NOTICE 'Seeded 32 global brands with models';
END $$;
