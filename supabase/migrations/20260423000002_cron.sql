-- ============================================================================
-- Cron Job: Generate notifications from reminders (daily at 7:00 AM UTC)
-- ============================================================================
-- Requires pg_cron extension (enabled in schema migration).
-- Note: after `supabase db reset`, pg_cron may need to be re-enabled
-- manually via the Supabase dashboard before running `supabase migration up`.

SELECT cron.schedule(
    'generate-reminder-notifications',
    '0 7 * * *',
    'SELECT public.generate_reminder_notifications()'
);
