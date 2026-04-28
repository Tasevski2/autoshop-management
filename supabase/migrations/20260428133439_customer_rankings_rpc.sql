-- Server-side customer rankings with sorting and pagination
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
LANGUAGE sql
STABLE
SECURITY INVOKER
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
    -- Numeric columns DESC
    CASE WHEN p_sort_direction = 'desc' THEN
      CASE p_sort_column
        WHEN 'services_count' THEN counted.services_count
        WHEN 'total_revenue' THEN counted.total_revenue
        WHEN 'profit' THEN counted.profit
        WHEN 'collected' THEN counted.collected
        WHEN 'owes' THEN counted.owes
      END
    END DESC NULLS LAST,
    -- Numeric columns ASC
    CASE WHEN p_sort_direction = 'asc' THEN
      CASE p_sort_column
        WHEN 'services_count' THEN counted.services_count
        WHEN 'total_revenue' THEN counted.total_revenue
        WHEN 'profit' THEN counted.profit
        WHEN 'collected' THEN counted.collected
        WHEN 'owes' THEN counted.owes
      END
    END ASC NULLS LAST,
    -- Text column: full_name
    CASE WHEN p_sort_column = 'full_name' AND p_sort_direction = 'desc' THEN counted.full_name END DESC NULLS LAST,
    CASE WHEN p_sort_column = 'full_name' AND p_sort_direction = 'asc' THEN counted.full_name END ASC NULLS LAST,
    -- Stable tiebreaker
    counted.full_name ASC
  LIMIT p_page_size
  OFFSET p_page * p_page_size;
$$;
