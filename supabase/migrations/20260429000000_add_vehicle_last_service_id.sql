-- Add FK column pointing to the latest service for this vehicle
ALTER TABLE public.vehicles
  ADD COLUMN last_service_id uuid REFERENCES public.services(id) ON DELETE SET NULL;

-- Trigger function: find latest service for affected vehicle(s) and set FK
CREATE OR REPLACE FUNCTION public.update_vehicle_last_service()
RETURNS TRIGGER AS $$
BEGIN
  -- On INSERT or UPDATE, update the new vehicle
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

  -- On DELETE or UPDATE with changed vehicle_id, update the old vehicle
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

-- Trigger on services table
CREATE TRIGGER trg_update_vehicle_last_service
  AFTER INSERT OR UPDATE OR DELETE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_vehicle_last_service();
