-- Recreate service_totals view with security_invoker so it respects
-- the RLS policies on services, service_parts, and payments.
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
