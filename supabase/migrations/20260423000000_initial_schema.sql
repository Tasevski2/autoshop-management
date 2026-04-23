-- ============================================================================
-- Car Workshop Management Application — Supabase Database Schema
-- ============================================================================
-- Architecture: User → Customer → Vehicle → Service → (ServicePart, ServiceImage, Payment, Invoice)
-- Standalone: PartsCatalog, Expense, Reminder, Notification (all scoped to User)
-- ============================================================================
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS (extends Supabase auth.users)
-- ============================================================================
CREATE TABLE public.users(
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text NOT NULL,
    workshop_name text,
    phone text,
    email text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

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
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_user_id ON public.customers(user_id);

CREATE INDEX idx_customers_full_name ON public.customers(user_id, full_name);

CREATE INDEX idx_customers_phone ON public.customers(user_id, phone);

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
    engine_type text, -- petrol, diesel, hybrid, electric
    color text,
    last_known_mileage integer,
    notes text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vehicles_customer_id ON public.vehicles(customer_id);

CREATE INDEX idx_vehicles_plate_number ON public.vehicles(plate_number);

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
    category text, -- e.g. brakes, oil, filters, electrical
    is_active boolean NOT NULL DEFAULT TRUE,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_parts_catalog_user_id ON public.parts_catalog(user_id);

CREATE INDEX idx_parts_catalog_name ON public.parts_catalog(user_id, name);

CREATE INDEX idx_parts_catalog_category ON public.parts_catalog(user_id, category);

-- ============================================================================
-- SERVICES
-- ============================================================================
CREATE TYPE service_status AS ENUM(
    'in_progress',
    'completed',
    'invoiced',
    'paid',
    'cancelled'
);

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

-- ============================================================================
-- SERVICE PARTS (line items on a service, snapshotted prices)
-- ============================================================================
CREATE TABLE public.service_parts(
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    catalog_part_id uuid REFERENCES public.parts_catalog(id) ON DELETE SET NULL, -- null for ad-hoc parts
    name text NOT NULL,
    quantity integer NOT NULL DEFAULT 1,
    buy_price numeric(10, 2) NOT NULL DEFAULT 0, -- snapshotted from catalog or manually entered
    sell_price numeric(10, 2) NOT NULL DEFAULT 0, -- snapshotted from catalog or manually entered
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
    storage_path text NOT NULL, -- path in Supabase Storage bucket
    file_name text,
    description text,
    created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_service_images_service_id ON public.service_images(service_id);

-- ============================================================================
-- PAYMENTS (supports partial payments per service)
-- ============================================================================
CREATE TYPE payment_method AS ENUM(
    'cash',
    'card',
    'bank_transfer',
    'other'
);

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
-- INVOICES (metadata only, PDF generated from service data)
-- ============================================================================
CREATE TABLE public.invoices(
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    invoice_number text NOT NULL UNIQUE,
    pdf_storage_path text, -- path in Supabase Storage bucket
    issued_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoices_service_id ON public.invoices(service_id);

CREATE INDEX idx_invoices_invoice_number ON public.invoices(invoice_number);

-- ============================================================================
-- EXPENSES (standalone workshop costs, not tied to services)
-- ============================================================================
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
CREATE TYPE notification_type AS ENUM(
    'upcoming_service',
    'unpaid_invoice',
    'general'
);

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

CREATE INDEX idx_notifications_dismissed ON public.notifications(user_id, is_dismissed);

-- ============================================================================
-- HELPER VIEW: Service totals with payment balance
-- ============================================================================
CREATE OR REPLACE VIEW public.service_totals AS
SELECT
    s.id AS service_id,
    s.vehicle_id,
    s.labor_cost,
    COALESCE(SUM(sp.sell_price * sp.quantity), 0) AS parts_total,
    COALESCE(SUM(sp.buy_price * sp.quantity), 0) AS parts_cost,
    COALESCE(SUM(sp.sell_price * sp.quantity), 0) + s.labor_cost AS service_total,
    COALESCE(SUM(sp.sell_price * sp.quantity), 0) - COALESCE(SUM(sp.buy_price * sp.quantity), 0) AS parts_profit,
    COALESCE(p.total_paid, 0) AS total_paid,
(COALESCE(SUM(sp.sell_price * sp.quantity), 0) + s.labor_cost) - COALESCE(p.total_paid, 0) AS balance_due
FROM
    public.services s
    LEFT JOIN public.service_parts sp ON sp.service_id = s.id
    LEFT JOIN (
        SELECT
            service_id,
            SUM(amount) AS total_paid
        FROM
            public.payments
        GROUP BY
            service_id) p ON p.service_id = s.id
GROUP BY
    s.id,
    s.vehicle_id,
    s.labor_cost,
    p.total_paid;

-- ============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
    RETURNS TRIGGER
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$
LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_vehicles_updated_at
    BEFORE UPDATE ON public.vehicles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_parts_catalog_updated_at
    BEFORE UPDATE ON public.parts_catalog
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_services_updated_at
    BEFORE UPDATE ON public.services
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_expenses_updated_at
    BEFORE UPDATE ON public.expenses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_reminders_updated_at
    BEFORE UPDATE ON public.reminders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- AUTO-UPDATE VEHICLE MILEAGE FROM SERVICE
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_vehicle_mileage()
    RETURNS TRIGGER
    AS $$
BEGIN
    IF NEW.mileage_at_service IS NOT NULL THEN
        UPDATE
            public.vehicles
        SET
            last_known_mileage = NEW.mileage_at_service
        WHERE
            id = NEW.vehicle_id
            AND(last_known_mileage IS NULL
                OR last_known_mileage < NEW.mileage_at_service);
    END IF;
    RETURN NEW;
END;
$$
LANGUAGE plpgsql;

CREATE TRIGGER trg_update_vehicle_mileage
    AFTER INSERT OR UPDATE ON public.services
    FOR EACH ROW
    EXECUTE FUNCTION public.update_vehicle_mileage();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
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

-- Users: own row only
CREATE POLICY "users_own" ON public.users
    FOR ALL
        USING (id = auth.uid());

-- Customers: scoped to user
CREATE POLICY "customers_own" ON public.customers
    FOR ALL
        USING (user_id = auth.uid());

-- Vehicles: scoped via customer → user
CREATE POLICY "vehicles_own" ON public.vehicles
    FOR ALL
        USING (customer_id IN (
            SELECT
                id
            FROM
                public.customers
            WHERE
                user_id = auth.uid()));

-- Parts catalog: scoped to user
CREATE POLICY "parts_catalog_own" ON public.parts_catalog
    FOR ALL
        USING (user_id = auth.uid());

-- Services: scoped via vehicle → customer → user
CREATE POLICY "services_own" ON public.services
    FOR ALL
        USING (vehicle_id IN (
            SELECT
                v.id
            FROM
                public.vehicles v
                JOIN public.customers c ON c.id = v.customer_id
            WHERE
                c.user_id = auth.uid()));

-- Service parts: scoped via service chain
CREATE POLICY "service_parts_own" ON public.service_parts
    FOR ALL
        USING (service_id IN (
            SELECT
                s.id
            FROM
                public.services s
                JOIN public.vehicles v ON v.id = s.vehicle_id
                JOIN public.customers c ON c.id = v.customer_id
            WHERE
                c.user_id = auth.uid()));

-- Service images: scoped via service chain
CREATE POLICY "service_images_own" ON public.service_images
    FOR ALL
        USING (service_id IN (
            SELECT
                s.id
            FROM
                public.services s
                JOIN public.vehicles v ON v.id = s.vehicle_id
                JOIN public.customers c ON c.id = v.customer_id
            WHERE
                c.user_id = auth.uid()));

-- Payments: scoped via service chain
CREATE POLICY "payments_own" ON public.payments
    FOR ALL
        USING (service_id IN (
            SELECT
                s.id
            FROM
                public.services s
                JOIN public.vehicles v ON v.id = s.vehicle_id
                JOIN public.customers c ON c.id = v.customer_id
            WHERE
                c.user_id = auth.uid()));

-- Invoices: scoped via service chain
CREATE POLICY "invoices_own" ON public.invoices
    FOR ALL
        USING (service_id IN (
            SELECT
                s.id
            FROM
                public.services s
                JOIN public.vehicles v ON v.id = s.vehicle_id
                JOIN public.customers c ON c.id = v.customer_id
            WHERE
                c.user_id = auth.uid()));

-- Expenses: scoped to user
CREATE POLICY "expenses_own" ON public.expenses
    FOR ALL
        USING (user_id = auth.uid());

-- Reminders: scoped via vehicle → customer → user
CREATE POLICY "reminders_own" ON public.reminders
    FOR ALL
        USING (vehicle_id IN (
            SELECT
                v.id
            FROM
                public.vehicles v
                JOIN public.customers c ON c.id = v.customer_id
            WHERE
                c.user_id = auth.uid()));

-- Notifications: scoped to user
CREATE POLICY "notifications_own" ON public.notifications
    FOR ALL
        USING (user_id = auth.uid());

-- ============================================================================
-- SUPABASE STORAGE BUCKETS (create via dashboard or API)
-- ============================================================================
-- 1. "service-images"  — for service photos
-- 2. "invoices"        — for generated invoice PDFs
--
-- Recommended path convention for storage policies:
--   service-images/{user_id}/{service_id}/{filename}
--   invoices/{user_id}/{invoice_id}/{filename}
-- ============================================================================
-- CRON JOB: Generate notifications from reminders (daily at 7:00 AM)
-- ============================================================================
-- Enable pg_cron in Supabase dashboard first, then run:
--
-- SELECT cron.schedule('generate-notifications', '0 7 * * *', $$
--     INSERT INTO public.notifications (user_id, reminder_id, type, title, message)
--     SELECT
--         c.user_id,
--         r.id,
--         'upcoming_service',
--         'Upcoming service: ' || v.brand || ' ' || COALESCE(v.model, '') || ' (' || v.plate_number || ')',
--         COALESCE(r.note, 'Scheduled service is approaching')
--     FROM public.reminders r
--     JOIN public.vehicles v ON v.id = r.vehicle_id
--     JOIN public.customers c ON c.id = v.customer_id
--     WHERE r.is_active = TRUE
--       AND (r.due_date - r.notify_days_before * INTERVAL '1 day') <= CURRENT_DATE
--       AND r.due_date >= CURRENT_DATE
--       AND NOT EXISTS (
--           SELECT 1 FROM public.notifications n
--           WHERE n.reminder_id = r.id
--       );
-- $$);
