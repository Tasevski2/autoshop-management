-- Replace monthly revenue trend with weekday revenue breakdown

DROP FUNCTION IF EXISTS public.get_revenue_trend();

CREATE OR REPLACE FUNCTION public.get_weekday_revenue(p_from date, p_to date)
RETURNS TABLE (day_index integer, total_revenue numeric, weekday_occurrences bigint)
LANGUAGE sql STABLE SECURITY INVOKER
AS $$
  WITH revenue_by_dow AS (
    SELECT
      EXTRACT(DOW FROM s.service_date)::integer AS day_index,
      COALESCE(SUM(st.service_total), 0) AS total_revenue
    FROM public.services s
    LEFT JOIN public.service_totals st ON st.service_id = s.id
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
    COALESCE(rd.total_revenue, 0) AS total_revenue,
    cd.weekday_occurrences
  FROM calendar_days cd
  LEFT JOIN revenue_by_dow rd ON rd.day_index = cd.day_index
  ORDER BY cd.day_index;
$$;
