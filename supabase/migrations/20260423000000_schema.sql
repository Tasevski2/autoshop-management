-- ============================================================================
-- Car Workshop Management — Complete Database Schema
-- ============================================================================
-- Architecture: User → Customer → Vehicle → Service → (ServicePart, ServiceImage, Payment, Invoice)
-- Standalone: PartsCatalog, Expense, Reminder, Notification (all scoped to User)
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE service_status AS ENUM(
    'in_progress',
    'completed',
    'invoiced',
    'partially_paid',
    'paid',
    'cancelled'
);

CREATE TYPE payment_method AS ENUM(
    'cash',
    'card',
    'bank_transfer',
    'other'
);

CREATE TYPE expense_category AS ENUM(
    'rent',
    'utilities',
    'tools',
    'salary',
    'supplies',
    'maintenance',
    'insurance',
    'taxes',
    'other'
);

CREATE TYPE notification_type AS ENUM(
    'upcoming_service',
    'unpaid_invoice',
    'general'
);

-- ============================================================================
-- USERS (extends Supabase auth.users)
-- ============================================================================

CREATE TABLE public.users(
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text NOT NULL,
    workshop_name text,
    phone text,
    email text,
    address text,
    bank_account text,
    bank_name text,
    tax_id text,
    authorized_signer text,
    next_invoice_number int NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- Auto-create a public.users row when a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- CUSTOMERS
-- ============================================================================

CREATE TABLE public.customers(
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    full_name text NOT NULL,
    phone text,
    email text,
    notes text,
    customer_type text NOT NULL DEFAULT 'person'
      CHECK (customer_type IN ('person', 'company')),
    address text,
    city text,
    tax_number text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_user_id ON public.customers(user_id);
CREATE INDEX idx_customers_full_name ON public.customers(user_id, full_name);
CREATE INDEX idx_customers_phone ON public.customers(user_id, phone);
CREATE INDEX idx_customers_fullname_trgm ON public.customers USING gin (full_name gin_trgm_ops);

-- ============================================================================
-- VEHICLES
-- ============================================================================

CREATE TABLE public.vehicles(
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    plate_number text NOT NULL,
    brand text NOT NULL,
    model text,
    year integer,
    chassis_number text,
    engine_type text,
    engine_capacity double precision,
    engine_designation text,
    last_known_mileage integer,
    notes text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vehicles_customer_id ON public.vehicles(customer_id);
CREATE INDEX idx_vehicles_plate_number ON public.vehicles(plate_number);
CREATE INDEX idx_vehicles_plate_trgm ON public.vehicles USING gin (plate_number gin_trgm_ops);
CREATE INDEX idx_vehicles_brand_trgm ON public.vehicles USING gin (brand gin_trgm_ops);

-- ============================================================================
-- VEHICLE BRANDS (global + user-specific)
-- ============================================================================

CREATE TABLE public.vehicle_brands(
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vehicle_brands_user_id ON public.vehicle_brands(user_id);
CREATE UNIQUE INDEX idx_vehicle_brands_global_name
    ON public.vehicle_brands (LOWER(name)) WHERE user_id IS NULL;
CREATE UNIQUE INDEX idx_vehicle_brands_user_name
    ON public.vehicle_brands (user_id, LOWER(name)) WHERE user_id IS NOT NULL;

-- ============================================================================
-- VEHICLE MODELS (global + user-specific, per brand)
-- ============================================================================

CREATE TABLE public.vehicle_models(
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id uuid NOT NULL REFERENCES public.vehicle_brands(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vehicle_models_brand_id ON public.vehicle_models(brand_id);
CREATE INDEX idx_vehicle_models_user_id ON public.vehicle_models(user_id);
CREATE UNIQUE INDEX idx_vehicle_models_global_name
    ON public.vehicle_models (brand_id, LOWER(name)) WHERE user_id IS NULL;
CREATE UNIQUE INDEX idx_vehicle_models_user_name
    ON public.vehicle_models (user_id, brand_id, LOWER(name)) WHERE user_id IS NOT NULL;

-- ============================================================================
-- PARTS CATALOG (user's price book)
-- ============================================================================

CREATE TABLE public.parts_catalog(
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    buy_price numeric(10, 2) NOT NULL DEFAULT 0,
    sell_price numeric(10, 2) NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT TRUE,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_parts_catalog_user_id ON public.parts_catalog(user_id);
CREATE INDEX idx_parts_catalog_name ON public.parts_catalog(user_id, name);
CREATE INDEX idx_parts_catalog_active ON public.parts_catalog (is_active) WHERE is_active = true;

-- ============================================================================
-- SERVICES
-- ============================================================================

CREATE TABLE public.services(
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    status service_status NOT NULL DEFAULT 'in_progress',
    mileage_at_service integer,
    labor_cost numeric(10, 2) NOT NULL DEFAULT 0,
    notes text,
    service_date date NOT NULL DEFAULT CURRENT_DATE,
    completed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_services_vehicle_id ON public.services(vehicle_id);
CREATE INDEX idx_services_status ON public.services(status);
CREATE INDEX idx_services_service_date ON public.services(service_date);
CREATE INDEX idx_services_vehicle_date ON public.services (vehicle_id, service_date DESC);

-- Add last_service_id FK after services table exists
ALTER TABLE public.vehicles
  ADD COLUMN last_service_id uuid REFERENCES public.services(id) ON DELETE SET NULL;
CREATE INDEX idx_vehicles_last_service_id ON public.vehicles (last_service_id);

-- ============================================================================
-- SERVICE PARTS (line items on a service, snapshotted prices)
-- ============================================================================

CREATE TABLE public.service_parts(
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    catalog_part_id uuid REFERENCES public.parts_catalog(id) ON DELETE SET NULL,
    name text NOT NULL,
    quantity integer NOT NULL DEFAULT 1,
    buy_price numeric(10, 2) NOT NULL DEFAULT 0,
    sell_price numeric(10, 2) NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_service_parts_service_id ON public.service_parts(service_id);
CREATE INDEX idx_service_parts_catalog_part_id ON public.service_parts(catalog_part_id);

-- ============================================================================
-- SERVICE IMAGES (stored in Supabase Storage)
-- ============================================================================

CREATE TABLE public.service_images(
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    storage_path text NOT NULL,
    file_name text,
    description text,
    file_size bigint,
    created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_service_images_service_id ON public.service_images(service_id);

-- ============================================================================
-- PAYMENTS (supports partial payments per service)
-- ============================================================================

CREATE TABLE public.payments(
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    amount numeric(10, 2) NOT NULL,
    method payment_method NOT NULL DEFAULT 'cash',
    notes text,
    payment_date date NOT NULL DEFAULT CURRENT_DATE,
    created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_service_id ON public.payments(service_id);
CREATE INDEX idx_payments_payment_date ON public.payments(payment_date);

-- ============================================================================
-- INVOICES (metadata only, PDF generated client-side)
-- ============================================================================

CREATE TABLE public.invoices(
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    invoice_number text NOT NULL UNIQUE,
    pdf_storage_path text,
    due_date date,
    notes text,
    issued_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoices_service_id ON public.invoices(service_id);
CREATE INDEX idx_invoices_invoice_number ON public.invoices(invoice_number);

-- ============================================================================
-- EXPENSES (standalone workshop costs, not tied to services)
-- ============================================================================

CREATE TABLE public.expenses(
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount numeric(10, 2) NOT NULL,
    category expense_category NOT NULL DEFAULT 'other',
    description text,
    expense_date date NOT NULL DEFAULT CURRENT_DATE,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX idx_expenses_expense_date ON public.expenses(expense_date);
CREATE INDEX idx_expenses_category ON public.expenses(user_id, category);

-- ============================================================================
-- REMINDERS (tied to vehicle, configurable notification lead time)
-- ============================================================================

CREATE TABLE public.reminders(
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    due_date date NOT NULL,
    notify_days_before integer NOT NULL DEFAULT 10,
    note text,
    is_active boolean NOT NULL DEFAULT TRUE,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reminders_vehicle_id ON public.reminders(vehicle_id);
CREATE INDEX idx_reminders_due_date ON public.reminders(due_date);
CREATE INDEX idx_reminders_active ON public.reminders(is_active, due_date);

-- ============================================================================
-- NOTIFICATIONS (generated from reminders by cron job)
-- ============================================================================

CREATE TABLE public.notifications(
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reminder_id uuid REFERENCES public.reminders(id) ON DELETE SET NULL,
    type notification_type NOT NULL DEFAULT 'upcoming_service',
    title text NOT NULL,
    message text,
    is_dismissed boolean NOT NULL DEFAULT FALSE,
    created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_dismissed ON public.notifications (user_id, is_dismissed, created_at DESC);

-- ============================================================================
-- VIEW: Service totals with payment balance
-- ============================================================================

CREATE OR REPLACE VIEW public.service_totals
WITH (security_invoker = true)
AS
SELECT
    s.id AS service_id,
    s.vehicle_id,
    s.labor_cost,
    COALESCE(SUM(sp.sell_price * sp.quantity), 0) AS parts_total,
    COALESCE(SUM(sp.buy_price * sp.quantity), 0) AS parts_cost,
    COALESCE(SUM(sp.sell_price * sp.quantity), 0) + s.labor_cost AS service_total,
    (COALESCE(SUM(sp.sell_price * sp.quantity), 0) + s.labor_cost) - COALESCE(SUM(sp.buy_price * sp.quantity), 0) AS parts_profit,
    COALESCE(p.total_paid, 0) AS total_paid,
    (COALESCE(SUM(sp.sell_price * sp.quantity), 0) + s.labor_cost) - COALESCE(p.total_paid, 0) AS balance_due
FROM
    public.services s
    LEFT JOIN public.service_parts sp ON sp.service_id = s.id
    LEFT JOIN (
        SELECT service_id, SUM(amount) AS total_paid
        FROM public.payments
        GROUP BY service_id
    ) p ON p.service_id = s.id
GROUP BY s.id, s.vehicle_id, s.labor_cost, p.total_paid;

-- ============================================================================
-- TRIGGERS: updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
    RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_parts_catalog_updated_at BEFORE UPDATE ON public.parts_catalog FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_reminders_updated_at BEFORE UPDATE ON public.reminders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- TRIGGER: Auto-update vehicle mileage from service
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_vehicle_mileage()
    RETURNS TRIGGER AS $$
BEGIN
    IF NEW.mileage_at_service IS NOT NULL THEN
        UPDATE public.vehicles
        SET last_known_mileage = NEW.mileage_at_service
        WHERE id = NEW.vehicle_id
          AND (last_known_mileage IS NULL OR last_known_mileage < NEW.mileage_at_service);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_vehicle_mileage
    AFTER INSERT OR UPDATE ON public.services
    FOR EACH ROW EXECUTE FUNCTION public.update_vehicle_mileage();

-- ============================================================================
-- TRIGGER: Auto-update vehicle.last_service_id
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_vehicle_last_service()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.vehicles
    SET last_service_id = (
      SELECT s.id FROM public.services s
      WHERE s.vehicle_id = NEW.vehicle_id
      ORDER BY s.service_date DESC, s.created_at DESC
      LIMIT 1
    )
    WHERE id = NEW.vehicle_id;
  END IF;

  IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.vehicle_id IS DISTINCT FROM NEW.vehicle_id) THEN
    UPDATE public.vehicles
    SET last_service_id = (
      SELECT s.id FROM public.services s
      WHERE s.vehicle_id = OLD.vehicle_id
      ORDER BY s.service_date DESC, s.created_at DESC
      LIMIT 1
    )
    WHERE id = OLD.vehicle_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_vehicle_last_service
  AFTER INSERT OR UPDATE OR DELETE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_vehicle_last_service();

-- ============================================================================
-- TRIGGER: Auto-update service status on payment changes
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_service_status_on_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_service_id uuid;
  v_service_total numeric;
  v_total_paid numeric;
  v_current_status service_status;
BEGIN
  v_service_id := COALESCE(NEW.service_id, OLD.service_id);

  SELECT status INTO v_current_status
  FROM public.services WHERE id = v_service_id;

  IF v_current_status = 'cancelled' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT COALESCE(SUM(sp.sell_price * sp.quantity), 0) + s.labor_cost
  INTO v_service_total
  FROM public.services s
  LEFT JOIN public.service_parts sp ON sp.service_id = s.id
  WHERE s.id = v_service_id
  GROUP BY s.id, s.labor_cost;

  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
  FROM public.payments WHERE service_id = v_service_id;

  IF TG_OP = 'INSERT' THEN
    IF v_total_paid >= v_service_total THEN
      UPDATE public.services SET status = 'paid' WHERE id = v_service_id;
    END IF;
  ELSE
    IF v_total_paid >= v_service_total THEN
      UPDATE public.services SET status = 'paid' WHERE id = v_service_id;
    ELSIF v_total_paid > 0 THEN
      UPDATE public.services SET status = 'partially_paid' WHERE id = v_service_id;
    ELSE
      UPDATE public.services SET status = 'completed' WHERE id = v_service_id;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_update_service_status_on_payment
  AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_service_status_on_payment();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_models ENABLE ROW LEVEL SECURITY;

-- Users: own row only
CREATE POLICY "users_own" ON public.users FOR ALL USING (id = auth.uid());

-- Customers: scoped to user
CREATE POLICY "customers_own" ON public.customers FOR ALL USING (user_id = auth.uid());

-- Vehicles: scoped via customer → user
CREATE POLICY "vehicles_own" ON public.vehicles FOR ALL
    USING (customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid()));

-- Parts catalog: scoped to user
CREATE POLICY "parts_catalog_own" ON public.parts_catalog FOR ALL USING (user_id = auth.uid());

-- Services: scoped via vehicle → customer → user
CREATE POLICY "services_own" ON public.services FOR ALL
    USING (vehicle_id IN (
        SELECT v.id FROM public.vehicles v
        JOIN public.customers c ON c.id = v.customer_id
        WHERE c.user_id = auth.uid()));

-- Service parts: scoped via service chain
CREATE POLICY "service_parts_own" ON public.service_parts FOR ALL
    USING (service_id IN (
        SELECT s.id FROM public.services s
        JOIN public.vehicles v ON v.id = s.vehicle_id
        JOIN public.customers c ON c.id = v.customer_id
        WHERE c.user_id = auth.uid()));

-- Service images: scoped via service chain
CREATE POLICY "service_images_own" ON public.service_images FOR ALL
    USING (service_id IN (
        SELECT s.id FROM public.services s
        JOIN public.vehicles v ON v.id = s.vehicle_id
        JOIN public.customers c ON c.id = v.customer_id
        WHERE c.user_id = auth.uid()));

-- Payments: scoped via service chain
CREATE POLICY "payments_own" ON public.payments FOR ALL
    USING (service_id IN (
        SELECT s.id FROM public.services s
        JOIN public.vehicles v ON v.id = s.vehicle_id
        JOIN public.customers c ON c.id = v.customer_id
        WHERE c.user_id = auth.uid()));

-- Invoices: scoped via service chain
CREATE POLICY "invoices_own" ON public.invoices FOR ALL
    USING (service_id IN (
        SELECT s.id FROM public.services s
        JOIN public.vehicles v ON v.id = s.vehicle_id
        JOIN public.customers c ON c.id = v.customer_id
        WHERE c.user_id = auth.uid()));

-- Expenses: scoped to user
CREATE POLICY "expenses_own" ON public.expenses FOR ALL USING (user_id = auth.uid());

-- Reminders: scoped via vehicle → customer → user
CREATE POLICY "reminders_own" ON public.reminders FOR ALL
    USING (vehicle_id IN (
        SELECT v.id FROM public.vehicles v
        JOIN public.customers c ON c.id = v.customer_id
        WHERE c.user_id = auth.uid()));

-- Notifications: scoped to user
CREATE POLICY "notifications_own" ON public.notifications FOR ALL USING (user_id = auth.uid());

-- Vehicle brands: global (user_id IS NULL) + own
CREATE POLICY "vehicle_brands_select" ON public.vehicle_brands FOR SELECT
    USING (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "vehicle_brands_insert" ON public.vehicle_brands FOR INSERT
    WITH CHECK (user_id = auth.uid());
CREATE POLICY "vehicle_brands_update" ON public.vehicle_brands FOR UPDATE
    USING (user_id = auth.uid());
CREATE POLICY "vehicle_brands_delete" ON public.vehicle_brands FOR DELETE
    USING (user_id = auth.uid());

-- Vehicle models: visible if brand is global or owned by user
CREATE POLICY "vehicle_models_select" ON public.vehicle_models FOR SELECT
    USING (
        (user_id IS NULL OR user_id = auth.uid())
        AND brand_id IN (SELECT id FROM public.vehicle_brands WHERE user_id IS NULL OR user_id = auth.uid())
    );
CREATE POLICY "vehicle_models_insert" ON public.vehicle_models FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND brand_id IN (SELECT id FROM public.vehicle_brands WHERE user_id IS NULL OR user_id = auth.uid())
    );
CREATE POLICY "vehicle_models_update" ON public.vehicle_models FOR UPDATE
    USING (user_id = auth.uid());
CREATE POLICY "vehicle_models_delete" ON public.vehicle_models FOR DELETE
    USING (user_id = auth.uid());

-- ============================================================================
-- SUPABASE STORAGE: service-images bucket
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('service-images', 'service-images', true)
ON CONFLICT (id) DO NOTHING;

-- Upload: authenticated users to their own folder
CREATE POLICY "service_images_upload" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'service-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Select: scoped to own folder (needed for storage.remove())
CREATE POLICY "service_images_select_own" ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'service-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Delete: own images only
CREATE POLICY "service_images_delete" ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'service-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================================
-- SEED: Global vehicle brands & models
-- ============================================================================

DO $$
DECLARE
    v_brand_id uuid;
BEGIN
    -- Volkswagen
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Volkswagen') ON CONFLICT (LOWER(name)) WHERE user_id IS NULL DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'volkswagen';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'Golf'), (v_brand_id, 'Passat'), (v_brand_id, 'Polo'), (v_brand_id, 'Tiguan'),
        (v_brand_id, 'Touran'), (v_brand_id, 'Caddy'), (v_brand_id, 'Jetta'), (v_brand_id, 'Sharan'),
        (v_brand_id, 'Touareg'), (v_brand_id, 'Arteon'), (v_brand_id, 'T-Roc'), (v_brand_id, 'ID.3'),
        (v_brand_id, 'ID.4'), (v_brand_id, 'Up'), (v_brand_id, 'Bora')
    ON CONFLICT (brand_id, LOWER(name)) WHERE user_id IS NULL DO NOTHING;

    -- Audi
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Audi') ON CONFLICT (LOWER(name)) WHERE user_id IS NULL DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'audi';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'A3'), (v_brand_id, 'A4'), (v_brand_id, 'A5'), (v_brand_id, 'A6'),
        (v_brand_id, 'A7'), (v_brand_id, 'A8'), (v_brand_id, 'Q3'), (v_brand_id, 'Q5'),
        (v_brand_id, 'Q7'), (v_brand_id, 'Q8'), (v_brand_id, 'TT'), (v_brand_id, 'RS3'),
        (v_brand_id, 'RS4'), (v_brand_id, 'RS5'), (v_brand_id, 'RS6'), (v_brand_id, 'S3'),
        (v_brand_id, 'S4'), (v_brand_id, 'S5'), (v_brand_id, 'e-tron'), (v_brand_id, 'e-tron GT')
    ON CONFLICT (brand_id, LOWER(name)) WHERE user_id IS NULL DO NOTHING;

    -- Mercedes-Benz
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Mercedes-Benz') ON CONFLICT (LOWER(name)) WHERE user_id IS NULL DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'mercedes-benz';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'A-Class'), (v_brand_id, 'B-Class'), (v_brand_id, 'C-Class'), (v_brand_id, 'E-Class'),
        (v_brand_id, 'S-Class'), (v_brand_id, 'CLA'), (v_brand_id, 'CLS'), (v_brand_id, 'GLA'),
        (v_brand_id, 'GLB'), (v_brand_id, 'GLC'), (v_brand_id, 'GLE'), (v_brand_id, 'GLS'),
        (v_brand_id, 'G-Class'), (v_brand_id, 'Vito'), (v_brand_id, 'Sprinter'), (v_brand_id, 'EQA'),
        (v_brand_id, 'EQC')
    ON CONFLICT (brand_id, LOWER(name)) WHERE user_id IS NULL DO NOTHING;

    -- BMW
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'BMW') ON CONFLICT (LOWER(name)) WHERE user_id IS NULL DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'bmw';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, '1 Series'), (v_brand_id, '2 Series'), (v_brand_id, '3 Series'), (v_brand_id, '4 Series'),
        (v_brand_id, '5 Series'), (v_brand_id, '6 Series'), (v_brand_id, '7 Series'), (v_brand_id, 'X1'),
        (v_brand_id, 'X2'), (v_brand_id, 'X3'), (v_brand_id, 'X4'), (v_brand_id, 'X5'),
        (v_brand_id, 'X6'), (v_brand_id, 'X7'), (v_brand_id, 'Z4'), (v_brand_id, 'i3'),
        (v_brand_id, 'iX'), (v_brand_id, 'iX3')
    ON CONFLICT (brand_id, LOWER(name)) WHERE user_id IS NULL DO NOTHING;

    -- Opel
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Opel') ON CONFLICT (LOWER(name)) WHERE user_id IS NULL DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'opel';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'Astra'), (v_brand_id, 'Corsa'), (v_brand_id, 'Insignia'), (v_brand_id, 'Mokka'),
        (v_brand_id, 'Crossland'), (v_brand_id, 'Grandland'), (v_brand_id, 'Zafira'), (v_brand_id, 'Combo'),
        (v_brand_id, 'Vivaro'), (v_brand_id, 'Meriva'), (v_brand_id, 'Vectra'), (v_brand_id, 'Omega')
    ON CONFLICT (brand_id, LOWER(name)) WHERE user_id IS NULL DO NOTHING;

    -- Ford
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Ford') ON CONFLICT (LOWER(name)) WHERE user_id IS NULL DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'ford';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'Focus'), (v_brand_id, 'Fiesta'), (v_brand_id, 'Mondeo'), (v_brand_id, 'Kuga'),
        (v_brand_id, 'Puma'), (v_brand_id, 'EcoSport'), (v_brand_id, 'Galaxy'), (v_brand_id, 'S-Max'),
        (v_brand_id, 'Ranger'), (v_brand_id, 'Transit'), (v_brand_id, 'Transit Connect'), (v_brand_id, 'Mustang')
    ON CONFLICT (brand_id, LOWER(name)) WHERE user_id IS NULL DO NOTHING;

    -- Renault
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Renault') ON CONFLICT (LOWER(name)) WHERE user_id IS NULL DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'renault';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'Clio'), (v_brand_id, 'Megane'), (v_brand_id, 'Scenic'), (v_brand_id, 'Captur'),
        (v_brand_id, 'Kadjar'), (v_brand_id, 'Koleos'), (v_brand_id, 'Talisman'), (v_brand_id, 'Kangoo'),
        (v_brand_id, 'Master'), (v_brand_id, 'Twingo'), (v_brand_id, 'Laguna'), (v_brand_id, 'Zoe')
    ON CONFLICT (brand_id, LOWER(name)) WHERE user_id IS NULL DO NOTHING;

    -- Peugeot
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Peugeot') ON CONFLICT (LOWER(name)) WHERE user_id IS NULL DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'peugeot';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, '206'), (v_brand_id, '207'), (v_brand_id, '208'), (v_brand_id, '301'),
        (v_brand_id, '308'), (v_brand_id, '3008'), (v_brand_id, '5008'), (v_brand_id, '508'),
        (v_brand_id, '2008'), (v_brand_id, 'Partner'), (v_brand_id, 'Rifter'), (v_brand_id, 'Expert'),
        (v_brand_id, '407')
    ON CONFLICT (brand_id, LOWER(name)) WHERE user_id IS NULL DO NOTHING;

    -- Citroën
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Citroën') ON CONFLICT (LOWER(name)) WHERE user_id IS NULL DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'citroën';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'C3'), (v_brand_id, 'C4'), (v_brand_id, 'C5'), (v_brand_id, 'C3 Aircross'),
        (v_brand_id, 'C4 Cactus'), (v_brand_id, 'C5 Aircross'), (v_brand_id, 'Berlingo'), (v_brand_id, 'Jumpy'),
        (v_brand_id, 'Jumper'), (v_brand_id, 'C-Elysée'), (v_brand_id, 'DS3'), (v_brand_id, 'DS4'),
        (v_brand_id, 'DS5')
    ON CONFLICT (brand_id, LOWER(name)) WHERE user_id IS NULL DO NOTHING;

    -- Fiat
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Fiat') ON CONFLICT (LOWER(name)) WHERE user_id IS NULL DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'fiat';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'Punto'), (v_brand_id, 'Panda'), (v_brand_id, '500'), (v_brand_id, '500L'),
        (v_brand_id, '500X'), (v_brand_id, 'Tipo'), (v_brand_id, 'Bravo'), (v_brand_id, 'Doblo'),
        (v_brand_id, 'Ducato'), (v_brand_id, 'Linea'), (v_brand_id, 'Stilo'), (v_brand_id, 'Marea')
    ON CONFLICT (brand_id, LOWER(name)) WHERE user_id IS NULL DO NOTHING;

    -- Alfa Romeo
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Alfa Romeo') ON CONFLICT (LOWER(name)) WHERE user_id IS NULL DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'alfa romeo';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'Giulietta'), (v_brand_id, 'Giulia'), (v_brand_id, 'Stelvio'), (v_brand_id, 'MiTo'),
        (v_brand_id, '159'), (v_brand_id, '147'), (v_brand_id, '156'), (v_brand_id, 'GT')
    ON CONFLICT (brand_id, LOWER(name)) WHERE user_id IS NULL DO NOTHING;

    -- Toyota
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Toyota') ON CONFLICT (LOWER(name)) WHERE user_id IS NULL DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'toyota';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'Corolla'), (v_brand_id, 'Yaris'), (v_brand_id, 'RAV4'), (v_brand_id, 'C-HR'),
        (v_brand_id, 'Camry'), (v_brand_id, 'Land Cruiser'), (v_brand_id, 'Hilux'), (v_brand_id, 'Auris'),
        (v_brand_id, 'Avensis'), (v_brand_id, 'Prius'), (v_brand_id, 'Aygo'), (v_brand_id, 'Supra'),
        (v_brand_id, 'Proace')
    ON CONFLICT (brand_id, LOWER(name)) WHERE user_id IS NULL DO NOTHING;

    -- Hyundai
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Hyundai') ON CONFLICT (LOWER(name)) WHERE user_id IS NULL DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'hyundai';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'i10'), (v_brand_id, 'i20'), (v_brand_id, 'i30'), (v_brand_id, 'i40'),
        (v_brand_id, 'Tucson'), (v_brand_id, 'Santa Fe'), (v_brand_id, 'Kona'), (v_brand_id, 'Bayon'),
        (v_brand_id, 'Elantra'), (v_brand_id, 'Accent'), (v_brand_id, 'ix35'), (v_brand_id, 'Ioniq'),
        (v_brand_id, 'Ioniq 5')
    ON CONFLICT (brand_id, LOWER(name)) WHERE user_id IS NULL DO NOTHING;

    -- Kia
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Kia') ON CONFLICT (LOWER(name)) WHERE user_id IS NULL DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'kia';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'Ceed'), (v_brand_id, 'Rio'), (v_brand_id, 'Sportage'), (v_brand_id, 'Sorento'),
        (v_brand_id, 'Picanto'), (v_brand_id, 'Stonic'), (v_brand_id, 'Niro'), (v_brand_id, 'Optima'),
        (v_brand_id, 'Venga'), (v_brand_id, 'XCeed'), (v_brand_id, 'EV6')
    ON CONFLICT (brand_id, LOWER(name)) WHERE user_id IS NULL DO NOTHING;

    -- Škoda
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Škoda') ON CONFLICT (LOWER(name)) WHERE user_id IS NULL DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'škoda';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'Octavia'), (v_brand_id, 'Fabia'), (v_brand_id, 'Superb'), (v_brand_id, 'Karoq'),
        (v_brand_id, 'Kodiaq'), (v_brand_id, 'Kamiq'), (v_brand_id, 'Scala'), (v_brand_id, 'Rapid'),
        (v_brand_id, 'Yeti'), (v_brand_id, 'Roomster'), (v_brand_id, 'Citigo'), (v_brand_id, 'Enyaq')
    ON CONFLICT (brand_id, LOWER(name)) WHERE user_id IS NULL DO NOTHING;

    -- Seat
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Seat') ON CONFLICT (LOWER(name)) WHERE user_id IS NULL DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'seat';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'Ibiza'), (v_brand_id, 'Leon'), (v_brand_id, 'Ateca'), (v_brand_id, 'Arona'),
        (v_brand_id, 'Tarraco'), (v_brand_id, 'Alhambra'), (v_brand_id, 'Toledo'), (v_brand_id, 'Altea')
    ON CONFLICT (brand_id, LOWER(name)) WHERE user_id IS NULL DO NOTHING;

    -- Dacia
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Dacia') ON CONFLICT (LOWER(name)) WHERE user_id IS NULL DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'dacia';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'Sandero'), (v_brand_id, 'Duster'), (v_brand_id, 'Logan'), (v_brand_id, 'Lodgy'),
        (v_brand_id, 'Dokker'), (v_brand_id, 'Spring'), (v_brand_id, 'Jogger')
    ON CONFLICT (brand_id, LOWER(name)) WHERE user_id IS NULL DO NOTHING;

    -- Nissan
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Nissan') ON CONFLICT (LOWER(name)) WHERE user_id IS NULL DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'nissan';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'Qashqai'), (v_brand_id, 'Juke'), (v_brand_id, 'X-Trail'), (v_brand_id, 'Micra'),
        (v_brand_id, 'Navara'), (v_brand_id, 'Leaf'), (v_brand_id, 'Note'), (v_brand_id, 'Pathfinder'),
        (v_brand_id, 'Patrol'), (v_brand_id, 'Pulsar')
    ON CONFLICT (brand_id, LOWER(name)) WHERE user_id IS NULL DO NOTHING;

    -- Honda
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Honda') ON CONFLICT (LOWER(name)) WHERE user_id IS NULL DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'honda';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'Civic'), (v_brand_id, 'CR-V'), (v_brand_id, 'HR-V'), (v_brand_id, 'Jazz'),
        (v_brand_id, 'Accord'), (v_brand_id, 'CR-Z'), (v_brand_id, 'e')
    ON CONFLICT (brand_id, LOWER(name)) WHERE user_id IS NULL DO NOTHING;

    -- Mazda
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Mazda') ON CONFLICT (LOWER(name)) WHERE user_id IS NULL DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'mazda';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, '3'), (v_brand_id, '6'), (v_brand_id, 'CX-3'), (v_brand_id, 'CX-5'),
        (v_brand_id, 'CX-30'), (v_brand_id, 'CX-60'), (v_brand_id, 'MX-5'), (v_brand_id, '2')
    ON CONFLICT (brand_id, LOWER(name)) WHERE user_id IS NULL DO NOTHING;

    -- Suzuki
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Suzuki') ON CONFLICT (LOWER(name)) WHERE user_id IS NULL DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'suzuki';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'Vitara'), (v_brand_id, 'SX4'), (v_brand_id, 'Swift'), (v_brand_id, 'Jimny'),
        (v_brand_id, 'Ignis'), (v_brand_id, 'S-Cross'), (v_brand_id, 'Baleno'), (v_brand_id, 'Celerio')
    ON CONFLICT (brand_id, LOWER(name)) WHERE user_id IS NULL DO NOTHING;

    -- Mitsubishi
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Mitsubishi') ON CONFLICT (LOWER(name)) WHERE user_id IS NULL DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'mitsubishi';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'Outlander'), (v_brand_id, 'ASX'), (v_brand_id, 'L200'), (v_brand_id, 'Pajero'),
        (v_brand_id, 'Eclipse Cross'), (v_brand_id, 'Lancer'), (v_brand_id, 'Colt'), (v_brand_id, 'Space Star')
    ON CONFLICT (brand_id, LOWER(name)) WHERE user_id IS NULL DO NOTHING;

    -- Volvo
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Volvo') ON CONFLICT (LOWER(name)) WHERE user_id IS NULL DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'volvo';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'XC60'), (v_brand_id, 'XC90'), (v_brand_id, 'XC40'), (v_brand_id, 'S60'),
        (v_brand_id, 'S90'), (v_brand_id, 'V40'), (v_brand_id, 'V60'), (v_brand_id, 'V90'),
        (v_brand_id, 'C40')
    ON CONFLICT (brand_id, LOWER(name)) WHERE user_id IS NULL DO NOTHING;

    -- Land Rover
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Land Rover') ON CONFLICT (LOWER(name)) WHERE user_id IS NULL DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'land rover';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'Range Rover'), (v_brand_id, 'Range Rover Sport'), (v_brand_id, 'Range Rover Evoque'),
        (v_brand_id, 'Range Rover Velar'), (v_brand_id, 'Discovery'), (v_brand_id, 'Discovery Sport'),
        (v_brand_id, 'Defender'), (v_brand_id, 'Freelander')
    ON CONFLICT (brand_id, LOWER(name)) WHERE user_id IS NULL DO NOTHING;

    -- Jeep
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Jeep') ON CONFLICT (LOWER(name)) WHERE user_id IS NULL DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'jeep';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'Renegade'), (v_brand_id, 'Compass'), (v_brand_id, 'Cherokee'),
        (v_brand_id, 'Grand Cherokee'), (v_brand_id, 'Wrangler')
    ON CONFLICT (brand_id, LOWER(name)) WHERE user_id IS NULL DO NOTHING;

    -- Chevrolet
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Chevrolet') ON CONFLICT (LOWER(name)) WHERE user_id IS NULL DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'chevrolet';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'Aveo'), (v_brand_id, 'Cruze'), (v_brand_id, 'Captiva'), (v_brand_id, 'Spark'),
        (v_brand_id, 'Orlando'), (v_brand_id, 'Trax'), (v_brand_id, 'Lacetti')
    ON CONFLICT (brand_id, LOWER(name)) WHERE user_id IS NULL DO NOTHING;

    -- Porsche
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Porsche') ON CONFLICT (LOWER(name)) WHERE user_id IS NULL DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'porsche';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'Cayenne'), (v_brand_id, 'Macan'), (v_brand_id, 'Panamera'), (v_brand_id, '911'),
        (v_brand_id, 'Taycan'), (v_brand_id, 'Boxster'), (v_brand_id, 'Cayman')
    ON CONFLICT (brand_id, LOWER(name)) WHERE user_id IS NULL DO NOTHING;

    -- Mini
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Mini') ON CONFLICT (LOWER(name)) WHERE user_id IS NULL DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'mini';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'Cooper'), (v_brand_id, 'Countryman'), (v_brand_id, 'Clubman'), (v_brand_id, 'Paceman')
    ON CONFLICT (brand_id, LOWER(name)) WHERE user_id IS NULL DO NOTHING;

    -- Subaru
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Subaru') ON CONFLICT (LOWER(name)) WHERE user_id IS NULL DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'subaru';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'Forester'), (v_brand_id, 'Outback'), (v_brand_id, 'XV'), (v_brand_id, 'Impreza'),
        (v_brand_id, 'Legacy'), (v_brand_id, 'WRX')
    ON CONFLICT (brand_id, LOWER(name)) WHERE user_id IS NULL DO NOTHING;

    -- Tesla
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Tesla') ON CONFLICT (LOWER(name)) WHERE user_id IS NULL DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'tesla';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'Model 3'), (v_brand_id, 'Model Y'), (v_brand_id, 'Model S'), (v_brand_id, 'Model X')
    ON CONFLICT (brand_id, LOWER(name)) WHERE user_id IS NULL DO NOTHING;

    -- Lada
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Lada') ON CONFLICT (LOWER(name)) WHERE user_id IS NULL DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'lada';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'Niva'), (v_brand_id, 'Samara'), (v_brand_id, 'Granta'), (v_brand_id, 'Vesta'),
        (v_brand_id, '2107'), (v_brand_id, '2106')
    ON CONFLICT (brand_id, LOWER(name)) WHERE user_id IS NULL DO NOTHING;

    -- Zastava
    INSERT INTO public.vehicle_brands (user_id, name) VALUES (NULL, 'Zastava') ON CONFLICT (LOWER(name)) WHERE user_id IS NULL DO NOTHING;
    SELECT id INTO v_brand_id FROM public.vehicle_brands WHERE user_id IS NULL AND LOWER(name) = 'zastava';
    INSERT INTO public.vehicle_models (brand_id, name) VALUES
        (v_brand_id, 'Yugo'), (v_brand_id, '101'), (v_brand_id, '128'), (v_brand_id, '750')
    ON CONFLICT (brand_id, LOWER(name)) WHERE user_id IS NULL DO NOTHING;
END $$;
