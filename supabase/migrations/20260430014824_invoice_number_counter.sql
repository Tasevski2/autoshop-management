-- ══════════════════════════════════════════════════════════════
-- Add invoice number counter to users table
-- get_next_invoice_number: read-only (for display on editor page)
-- consume_next_invoice_number: increments and returns (called on save)
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS next_invoice_number int NOT NULL DEFAULT 1;

-- Read-only: returns the current next invoice number without incrementing
CREATE OR REPLACE FUNCTION public.get_next_invoice_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  next_num int;
BEGIN
  SELECT next_invoice_number INTO next_num
  FROM public.users
  WHERE id = current_user_id;

  RETURN LPAD(next_num::text, 4, '0');
END;
$$;

-- Atomic increment: returns the number and advances the counter
CREATE OR REPLACE FUNCTION public.consume_next_invoice_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  next_num int;
BEGIN
  UPDATE public.users
  SET next_invoice_number = next_invoice_number + 1
  WHERE id = current_user_id
  RETURNING next_invoice_number - 1 INTO next_num;

  RETURN LPAD(next_num::text, 4, '0');
END;
$$;
