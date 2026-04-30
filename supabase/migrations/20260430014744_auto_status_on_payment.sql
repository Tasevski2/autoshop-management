-- ══════════════════════════════════════════════════════════════
-- Auto-update service status when payments are added/removed
-- ══════════════════════════════════════════════════════════════

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

  -- Don't override cancelled services
  SELECT status INTO v_current_status
  FROM public.services
  WHERE id = v_service_id;

  IF v_current_status = 'cancelled' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Calculate service total (labor + parts)
  SELECT COALESCE(SUM(sp.sell_price * sp.quantity), 0) + s.labor_cost
  INTO v_service_total
  FROM public.services s
  LEFT JOIN public.service_parts sp ON sp.service_id = s.id
  WHERE s.id = v_service_id
  GROUP BY s.id, s.labor_cost;

  -- Calculate total paid
  SELECT COALESCE(SUM(amount), 0)
  INTO v_total_paid
  FROM public.payments
  WHERE service_id = v_service_id;

  -- On INSERT: only auto-set to 'paid' when fully paid.
  -- Don't change to 'partially_paid' — the car may still be in the shop
  -- (prepayments are common before work is finished).
  -- On DELETE/UPDATE: revert status when payments are removed.
  IF TG_OP = 'INSERT' THEN
    IF v_total_paid >= v_service_total THEN
      UPDATE public.services SET status = 'paid' WHERE id = v_service_id;
    END IF;
  ELSE
    -- DELETE or UPDATE: recalculate status
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
  FOR EACH ROW
  EXECUTE FUNCTION public.update_service_status_on_payment();
