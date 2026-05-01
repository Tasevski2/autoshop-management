-- ============================================================================
-- Table & view grants for authenticated role
-- ============================================================================
-- Locally Supabase auto-grants these, but production requires explicit grants.
-- Only authenticated users get access — RLS policies further restrict by auth.uid().

-- Tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicle_brands TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicle_models TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parts_catalog TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_parts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_images TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reminders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;

-- View
GRANT SELECT ON public.service_totals TO authenticated;

-- RPC functions
GRANT EXECUTE ON FUNCTION public.get_next_invoice_number() TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_next_invoice_number() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_total_unpaid() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_today_revenue(date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_today_expenses(date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_financial_summary(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_revenue_by_bucket(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_expenses_by_category(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_payments_by_method(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_daily_breakdown(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_revenue_trend() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_customer_summary(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_customer_rankings(date, date, text, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_services_summary(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_part_rankings(date, date, text, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_brand_distribution(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_year_distribution(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_weekday_utilization(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_expense_totals(text, date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_reminder_notifications() TO authenticated;
