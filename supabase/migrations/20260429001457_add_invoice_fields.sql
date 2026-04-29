-- ══════════════════════════════════════════════════════════════
-- Add invoice-related fields to users, customers, and invoices
-- ══════════════════════════════════════════════════════════════

-- ── Users: workshop/seller info for invoice header ──

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS bank_account text,
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS tax_id text,
  ADD COLUMN IF NOT EXISTS authorized_signer text;

-- ── Customers: buyer info for invoices ──

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS customer_type text NOT NULL DEFAULT 'person'
    CHECK (customer_type IN ('person', 'company')),
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS tax_number text;

-- ── Invoices: additional metadata ──

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS due_date date,
  ADD COLUMN IF NOT EXISTS notes text;

-- ── RPC: atomically generate next invoice number per user ──

CREATE OR REPLACE FUNCTION public.get_next_invoice_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  next_num int;
BEGIN
  -- Find the highest existing invoice number for this user's services
  SELECT COALESCE(MAX(CAST(i.invoice_number AS int)), 0) + 1
  INTO next_num
  FROM public.invoices i
  JOIN public.services s ON s.id = i.service_id
  JOIN public.vehicles v ON v.id = s.vehicle_id
  JOIN public.customers c ON c.id = v.customer_id
  WHERE c.user_id = current_user_id;

  RETURN LPAD(next_num::text, 4, '0');
END;
$$;
