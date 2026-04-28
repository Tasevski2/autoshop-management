-- Drop parts_catalog category column (unused in UI)
DROP INDEX IF EXISTS idx_parts_catalog_category;
ALTER TABLE public.parts_catalog DROP COLUMN IF EXISTS category;

-- Server-side part rankings with sorting and pagination
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
LANGUAGE sql
STABLE
SECURITY INVOKER
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
    -- Numeric columns DESC
    CASE WHEN p_sort_direction = 'desc' THEN
      CASE p_sort_column
        WHEN 'qty_sold' THEN counted.qty_sold
        WHEN 'buy_cost_total' THEN counted.buy_cost_total
        WHEN 'sell_total' THEN counted.sell_total
        WHEN 'profit' THEN counted.profit
      END
    END DESC NULLS LAST,
    -- Numeric columns ASC
    CASE WHEN p_sort_direction = 'asc' THEN
      CASE p_sort_column
        WHEN 'qty_sold' THEN counted.qty_sold
        WHEN 'buy_cost_total' THEN counted.buy_cost_total
        WHEN 'sell_total' THEN counted.sell_total
        WHEN 'profit' THEN counted.profit
      END
    END ASC NULLS LAST,
    -- Text column: part_name
    CASE WHEN p_sort_column = 'part_name' AND p_sort_direction = 'desc' THEN counted.part_name END DESC NULLS LAST,
    CASE WHEN p_sort_column = 'part_name' AND p_sort_direction = 'asc' THEN counted.part_name END ASC NULLS LAST,
    -- Stable tiebreaker
    counted.part_name ASC
  LIMIT p_page_size
  OFFSET p_page * p_page_size;
$$;
