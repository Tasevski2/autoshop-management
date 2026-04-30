-- ============================================================================
-- Car Workshop Management — Server-Side Functions (RPCs)
-- ============================================================================

-- ─── Invoice Number Management ───────────────────────────────

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

-- ─── Dashboard RPCs ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_total_unpaid()
RETURNS numeric
LANGUAGE sql STABLE SECURITY INVOKER
AS $$
  SELECT COALESCE(SUM(balance_due), 0)
  FROM public.service_totals
  WHERE balance_due > 0;
$$;

CREATE OR REPLACE FUNCTION public.get_today_revenue(p_date date)
RETURNS numeric
LANGUAGE sql STABLE SECURITY INVOKER
AS $$
  SELECT COALESCE(SUM(amount), 0)
  FROM public.payments
  WHERE payment_date = p_date;
$$;

CREATE OR REPLACE FUNCTION public.get_today_expenses(p_date date)
RETURNS numeric
LANGUAGE sql STABLE SECURITY INVOKER
AS $$
  SELECT COALESCE(SUM(amount), 0)
  FROM public.expenses
  WHERE expense_date = p_date;
$$;

-- ─── Reports — Financial Tab RPCs ────────────────────────────

CREATE OR REPLACE FUNCTION public.get_financial_summary(p_from date, p_to date)
RETURNS TABLE (
  total_revenue numeric,
  parts_cost numeric,
  parts_profit numeric,
  operating_expenses numeric,
  net_profit numeric,
  margin numeric,
  total_collected numeric,
  uncollected numeric
)
LANGUAGE sql STABLE SECURITY INVOKER
AS $$
  WITH service_sums AS (
    SELECT
      COALESCE(SUM(st.service_total), 0) AS total_revenue,
      COALESCE(SUM(st.parts_total), 0) AS parts_sell,
      COALESCE(SUM(st.parts_cost), 0) AS parts_cost,
      COALESCE(SUM(st.total_paid), 0) AS total_collected,
      COALESCE(SUM(st.balance_due), 0) AS uncollected
    FROM public.service_totals st
    JOIN public.services s ON s.id = st.service_id
    WHERE s.service_date >= p_from AND s.service_date <= p_to
  ),
  expense_sums AS (
    SELECT COALESCE(SUM(e.amount), 0) AS operating_expenses
    FROM public.expenses e
    WHERE e.expense_date >= p_from AND e.expense_date <= p_to
  )
  SELECT
    ss.total_revenue,
    ss.parts_cost,
    ss.parts_sell - ss.parts_cost AS parts_profit,
    es.operating_expenses,
    ss.total_revenue - ss.parts_cost - es.operating_expenses AS net_profit,
    CASE WHEN ss.total_revenue > 0
      THEN ROUND(((ss.total_revenue - ss.parts_cost - es.operating_expenses) / ss.total_revenue) * 100, 1)
      ELSE 0
    END AS margin,
    ss.total_collected,
    ss.uncollected
  FROM service_sums ss, expense_sums es;
$$;

CREATE OR REPLACE FUNCTION public.get_revenue_by_bucket(p_from date, p_to date)
RETURNS TABLE (bucket_date date, parts_revenue numeric, labor numeric)
LANGUAGE sql STABLE SECURITY INVOKER
AS $$
  WITH service_data AS (
    SELECT
      s.id,
      CASE
        WHEN (p_to - p_from) <= 31 THEN s.service_date
        WHEN (p_to - p_from) <= 84 THEN date_trunc('week', s.service_date)::date
        ELSE date_trunc('month', s.service_date)::date
      END AS bucket_date,
      s.labor_cost
    FROM public.services s
    WHERE s.service_date >= p_from AND s.service_date <= p_to
  ),
  parts_agg AS (
    SELECT
      sp.service_id,
      SUM(sp.sell_price * sp.quantity) AS parts_revenue
    FROM public.service_parts sp
    WHERE sp.service_id IN (SELECT id FROM service_data)
    GROUP BY sp.service_id
  )
  SELECT
    sd.bucket_date,
    COALESCE(SUM(pa.parts_revenue), 0) AS parts_revenue,
    COALESCE(SUM(sd.labor_cost), 0) AS labor
  FROM service_data sd
  LEFT JOIN parts_agg pa ON pa.service_id = sd.id
  GROUP BY sd.bucket_date
  ORDER BY sd.bucket_date;
$$;

CREATE OR REPLACE FUNCTION public.get_expenses_by_category(p_from date, p_to date)
RETURNS TABLE (category text, amount numeric)
LANGUAGE sql STABLE SECURITY INVOKER
AS $$
  SELECT e.category::text, SUM(e.amount) AS amount
  FROM public.expenses e
  WHERE e.expense_date >= p_from AND e.expense_date <= p_to
  GROUP BY e.category
  ORDER BY amount DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_payments_by_method(p_from date, p_to date)
RETURNS TABLE (method text, amount numeric)
LANGUAGE sql STABLE SECURITY INVOKER
AS $$
  SELECT p.method::text, SUM(p.amount) AS amount
  FROM public.payments p
  WHERE p.payment_date >= p_from AND p.payment_date <= p_to
  GROUP BY p.method
  ORDER BY amount DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_daily_breakdown(p_from date, p_to date)
RETURNS TABLE (
  bucket_date date,
  service_count bigint,
  revenue numeric,
  parts_cost numeric,
  collected numeric,
  operating_expenses numeric,
  net numeric
)
LANGUAGE sql STABLE SECURITY INVOKER
AS $$
  WITH service_buckets AS (
    SELECT
      CASE
        WHEN (p_to - p_from) <= 31 THEN s.service_date
        WHEN (p_to - p_from) <= 84 THEN date_trunc('week', s.service_date)::date
        ELSE date_trunc('month', s.service_date)::date
      END AS bucket_date,
      COUNT(*) AS service_count,
      COALESCE(SUM(st.service_total), 0) AS revenue,
      COALESCE(SUM(st.parts_cost), 0) AS parts_cost
    FROM public.services s
    LEFT JOIN public.service_totals st ON st.service_id = s.id
    WHERE s.service_date >= p_from AND s.service_date <= p_to
    GROUP BY 1
  ),
  payment_buckets AS (
    SELECT
      CASE
        WHEN (p_to - p_from) <= 31 THEN p.payment_date
        WHEN (p_to - p_from) <= 84 THEN date_trunc('week', p.payment_date)::date
        ELSE date_trunc('month', p.payment_date)::date
      END AS bucket_date,
      SUM(p.amount) AS collected
    FROM public.payments p
    WHERE p.payment_date >= p_from AND p.payment_date <= p_to
    GROUP BY 1
  ),
  expense_buckets AS (
    SELECT
      CASE
        WHEN (p_to - p_from) <= 31 THEN e.expense_date
        WHEN (p_to - p_from) <= 84 THEN date_trunc('week', e.expense_date)::date
        ELSE date_trunc('month', e.expense_date)::date
      END AS bucket_date,
      SUM(e.amount) AS operating_expenses
    FROM public.expenses e
    WHERE e.expense_date >= p_from AND e.expense_date <= p_to
    GROUP BY 1
  ),
  all_dates AS (
    SELECT bucket_date FROM service_buckets
    UNION SELECT bucket_date FROM payment_buckets
    UNION SELECT bucket_date FROM expense_buckets
  )
  SELECT
    ad.bucket_date,
    COALESCE(sb.service_count, 0) AS service_count,
    COALESCE(sb.revenue, 0) AS revenue,
    COALESCE(sb.parts_cost, 0) AS parts_cost,
    COALESCE(pb.collected, 0) AS collected,
    COALESCE(eb.operating_expenses, 0) AS operating_expenses,
    COALESCE(sb.revenue, 0) - COALESCE(sb.parts_cost, 0) - COALESCE(eb.operating_expenses, 0) AS net
  FROM all_dates ad
  LEFT JOIN service_buckets sb ON sb.bucket_date = ad.bucket_date
  LEFT JOIN payment_buckets pb ON pb.bucket_date = ad.bucket_date
  LEFT JOIN expense_buckets eb ON eb.bucket_date = ad.bucket_date
  ORDER BY ad.bucket_date DESC;
$$;

-- ─── Reports — Revenue Trend ────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_revenue_trend()
RETURNS TABLE (month text, total_revenue numeric, distinct_days bigint)
LANGUAGE sql STABLE SECURITY INVOKER
AS $$
  SELECT
    TO_CHAR(s.service_date, 'YYYY-MM') AS month,
    COALESCE(SUM(st.service_total), 0) AS total_revenue,
    COUNT(DISTINCT s.service_date) AS distinct_days
  FROM public.services s
  LEFT JOIN public.service_totals st ON st.service_id = s.id
  WHERE s.service_date >= (DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months')::date
  GROUP BY 1
  ORDER BY 1;
$$;

-- ─── Reports — Customers Tab ────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_customer_summary(p_from date, p_to date)
RETURNS TABLE (active_count bigint, new_count bigint, avg_invoice numeric)
LANGUAGE sql STABLE SECURITY INVOKER
AS $$
  WITH active AS (
    SELECT COUNT(DISTINCT v.customer_id) AS cnt
    FROM public.services s
    JOIN public.vehicles v ON v.id = s.vehicle_id
    WHERE s.service_date >= p_from AND s.service_date <= p_to
      AND v.customer_id IS NOT NULL
  ),
  new_cust AS (
    SELECT COUNT(*) AS cnt
    FROM public.customers c
    WHERE c.created_at::date >= p_from AND c.created_at::date <= p_to
  ),
  avg_inv AS (
    SELECT CASE WHEN COUNT(*) > 0
      THEN ROUND(COALESCE(SUM(st.service_total), 0) / COUNT(*))
      ELSE 0
    END AS avg
    FROM public.services s
    JOIN public.service_totals st ON st.service_id = s.id
    WHERE s.service_date >= p_from AND s.service_date <= p_to
  )
  SELECT a.cnt, n.cnt, ai.avg
  FROM active a, new_cust n, avg_inv ai;
$$;

CREATE OR REPLACE FUNCTION public.get_customer_rankings(
  p_date_from date,
  p_date_to date,
  p_sort_column text DEFAULT 'total_revenue',
  p_sort_direction text DEFAULT 'desc',
  p_page integer DEFAULT 0,
  p_page_size integer DEFAULT 20
)
RETURNS TABLE (
  customer_id uuid,
  full_name text,
  phone text,
  services_count bigint,
  total_revenue numeric,
  profit numeric,
  collected numeric,
  owes numeric,
  total_count bigint
)
LANGUAGE sql STABLE SECURITY INVOKER
AS $$
  WITH customer_agg AS (
    SELECT
      c.id AS customer_id,
      c.full_name,
      c.phone,
      COUNT(DISTINCT s.id) AS services_count,
      COALESCE(SUM(st.service_total), 0) AS total_revenue,
      COALESCE(SUM(st.service_total - st.parts_cost), 0) AS profit,
      COALESCE(SUM(st.total_paid), 0) AS collected,
      COALESCE(SUM(st.balance_due), 0) AS owes
    FROM public.services s
    JOIN public.vehicles v ON v.id = s.vehicle_id
    JOIN public.customers c ON c.id = v.customer_id
    LEFT JOIN public.service_totals st ON st.service_id = s.id
    WHERE s.service_date >= p_date_from
      AND s.service_date <= p_date_to
    GROUP BY c.id, c.full_name, c.phone
  ),
  counted AS (
    SELECT *, COUNT(*) OVER () AS total_count
    FROM customer_agg
  )
  SELECT
    counted.customer_id,
    counted.full_name,
    counted.phone,
    counted.services_count,
    counted.total_revenue,
    counted.profit,
    counted.collected,
    counted.owes,
    counted.total_count
  FROM counted
  ORDER BY
    CASE WHEN p_sort_direction = 'desc' THEN
      CASE p_sort_column
        WHEN 'services_count' THEN counted.services_count
        WHEN 'total_revenue' THEN counted.total_revenue
        WHEN 'profit' THEN counted.profit
        WHEN 'collected' THEN counted.collected
        WHEN 'owes' THEN counted.owes
      END
    END DESC NULLS LAST,
    CASE WHEN p_sort_direction = 'asc' THEN
      CASE p_sort_column
        WHEN 'services_count' THEN counted.services_count
        WHEN 'total_revenue' THEN counted.total_revenue
        WHEN 'profit' THEN counted.profit
        WHEN 'collected' THEN counted.collected
        WHEN 'owes' THEN counted.owes
      END
    END ASC NULLS LAST,
    CASE WHEN p_sort_column = 'full_name' AND p_sort_direction = 'desc' THEN counted.full_name END DESC NULLS LAST,
    CASE WHEN p_sort_column = 'full_name' AND p_sort_direction = 'asc' THEN counted.full_name END ASC NULLS LAST,
    counted.full_name ASC
  LIMIT p_page_size
  OFFSET p_page * p_page_size;
$$;

-- ─── Reports — Services Tab ─────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_services_summary(p_from date, p_to date)
RETURNS TABLE (total_services bigint, avg_parts_per_service numeric, avg_labor numeric)
LANGUAGE sql STABLE SECURITY INVOKER
AS $$
  WITH svc AS (
    SELECT COUNT(*) AS total, COALESCE(SUM(s.labor_cost), 0) AS total_labor
    FROM public.services s
    WHERE s.service_date >= p_from AND s.service_date <= p_to
  ),
  parts AS (
    SELECT COUNT(*) AS total
    FROM public.service_parts sp
    JOIN public.services s ON s.id = sp.service_id
    WHERE s.service_date >= p_from AND s.service_date <= p_to
  )
  SELECT
    sv.total AS total_services,
    CASE WHEN sv.total > 0 THEN ROUND(p.total::numeric / sv.total, 1) ELSE 0 END AS avg_parts_per_service,
    CASE WHEN sv.total > 0 THEN ROUND(sv.total_labor / sv.total) ELSE 0 END AS avg_labor
  FROM svc sv, parts p;
$$;

CREATE OR REPLACE FUNCTION public.get_part_rankings(
  p_date_from date,
  p_date_to date,
  p_sort_column text DEFAULT 'qty_sold',
  p_sort_direction text DEFAULT 'desc',
  p_page integer DEFAULT 0,
  p_page_size integer DEFAULT 20
)
RETURNS TABLE (
  part_name text,
  qty_sold bigint,
  buy_cost_total numeric,
  sell_total numeric,
  profit numeric,
  total_count bigint
)
LANGUAGE sql STABLE SECURITY INVOKER
AS $$
  WITH part_agg AS (
    SELECT
      MIN(sp.name) AS part_name,
      SUM(sp.quantity)::bigint AS qty_sold,
      COALESCE(SUM(sp.buy_price * sp.quantity), 0) AS buy_cost_total,
      COALESCE(SUM(sp.sell_price * sp.quantity), 0) AS sell_total,
      COALESCE(SUM(sp.sell_price * sp.quantity), 0) - COALESCE(SUM(sp.buy_price * sp.quantity), 0) AS profit
    FROM public.service_parts sp
    JOIN public.services s ON s.id = sp.service_id
    WHERE s.service_date >= p_date_from
      AND s.service_date <= p_date_to
    GROUP BY LOWER(TRIM(sp.name))
  ),
  counted AS (
    SELECT *, COUNT(*) OVER () AS total_count
    FROM part_agg
  )
  SELECT
    counted.part_name,
    counted.qty_sold,
    counted.buy_cost_total,
    counted.sell_total,
    counted.profit,
    counted.total_count
  FROM counted
  ORDER BY
    CASE WHEN p_sort_direction = 'desc' THEN
      CASE p_sort_column
        WHEN 'qty_sold' THEN counted.qty_sold
        WHEN 'buy_cost_total' THEN counted.buy_cost_total
        WHEN 'sell_total' THEN counted.sell_total
        WHEN 'profit' THEN counted.profit
      END
    END DESC NULLS LAST,
    CASE WHEN p_sort_direction = 'asc' THEN
      CASE p_sort_column
        WHEN 'qty_sold' THEN counted.qty_sold
        WHEN 'buy_cost_total' THEN counted.buy_cost_total
        WHEN 'sell_total' THEN counted.sell_total
        WHEN 'profit' THEN counted.profit
      END
    END ASC NULLS LAST,
    CASE WHEN p_sort_column = 'part_name' AND p_sort_direction = 'desc' THEN counted.part_name END DESC NULLS LAST,
    CASE WHEN p_sort_column = 'part_name' AND p_sort_direction = 'asc' THEN counted.part_name END ASC NULLS LAST,
    counted.part_name ASC
  LIMIT p_page_size
  OFFSET p_page * p_page_size;
$$;

CREATE OR REPLACE FUNCTION public.get_brand_distribution(p_from date, p_to date)
RETURNS TABLE (brand text, count bigint)
LANGUAGE sql STABLE SECURITY INVOKER
AS $$
  SELECT v.brand, COUNT(*) AS count
  FROM public.services s
  JOIN public.vehicles v ON v.id = s.vehicle_id
  WHERE s.service_date >= p_from AND s.service_date <= p_to
    AND v.brand IS NOT NULL
  GROUP BY v.brand
  ORDER BY count DESC
  LIMIT 10;
$$;

CREATE OR REPLACE FUNCTION public.get_year_distribution(p_from date, p_to date)
RETURNS TABLE (year_range text, count bigint)
LANGUAGE sql STABLE SECURITY INVOKER
AS $$
  WITH raw AS (
    SELECT
      CASE
        WHEN v.year >= 2020 THEN '2020+'
        WHEN v.year >= 2015 THEN '2015-2019'
        WHEN v.year >= 2010 THEN '2010-2014'
        WHEN v.year >= 2005 THEN '2005-2009'
        ELSE '< 2005'
      END AS year_range,
      v.year
    FROM public.services s
    JOIN public.vehicles v ON v.id = s.vehicle_id
    WHERE s.service_date >= p_from AND s.service_date <= p_to
      AND v.year IS NOT NULL
  )
  SELECT year_range, COUNT(*) AS count
  FROM raw
  GROUP BY year_range
  ORDER BY MIN(year) DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_weekday_utilization(p_from date, p_to date)
RETURNS TABLE (day_index integer, service_count bigint, weekday_occurrences bigint)
LANGUAGE sql STABLE SECURITY INVOKER
AS $$
  WITH services_by_dow AS (
    SELECT
      EXTRACT(DOW FROM s.service_date)::integer AS day_index,
      COUNT(*) AS service_count
    FROM public.services s
    WHERE s.service_date >= p_from AND s.service_date <= p_to
    GROUP BY 1
  ),
  calendar_days AS (
    SELECT
      EXTRACT(DOW FROM d)::integer AS day_index,
      COUNT(*) AS weekday_occurrences
    FROM generate_series(p_from::timestamp, p_to::timestamp, '1 day'::interval) AS d
    GROUP BY 1
  )
  SELECT
    cd.day_index,
    COALESCE(sd.service_count, 0) AS service_count,
    cd.weekday_occurrences
  FROM calendar_days cd
  LEFT JOIN services_by_dow sd ON sd.day_index = cd.day_index
  ORDER BY cd.day_index;
$$;

-- ─── Expenses Page RPC ───────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_expense_totals(
  p_category text DEFAULT NULL,
  p_date_from date DEFAULT NULL,
  p_date_to date DEFAULT NULL
)
RETURNS TABLE (category text, total numeric)
LANGUAGE sql STABLE SECURITY INVOKER
AS $$
  SELECT e.category::text, SUM(e.amount) AS total
  FROM public.expenses e
  WHERE (p_category IS NULL OR e.category = p_category::expense_category)
    AND (p_date_from IS NULL OR e.expense_date >= p_date_from)
    AND (p_date_to IS NULL OR e.expense_date <= p_date_to)
  GROUP BY e.category;
$$;

-- ─── Notification Generator ─────────────────────────────────

CREATE OR REPLACE FUNCTION public.generate_reminder_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.notifications (user_id, reminder_id, type, title, message)
    SELECT
        c.user_id,
        r.id,
        'upcoming_service'::notification_type,
        v.brand || ' ' || COALESCE(v.model, '') || ' (' || v.plate_number || ')',
        COALESCE(r.note, 'Scheduled service is approaching')
    FROM public.reminders r
    JOIN public.vehicles v ON v.id = r.vehicle_id
    JOIN public.customers c ON c.id = v.customer_id
    WHERE r.is_active = TRUE
      AND (r.due_date - r.notify_days_before * INTERVAL '1 day') <= CURRENT_DATE
      AND NOT EXISTS (
          SELECT 1 FROM public.notifications n
          WHERE n.reminder_id = r.id
            AND n.is_dismissed = FALSE
      );
END;
$$;
