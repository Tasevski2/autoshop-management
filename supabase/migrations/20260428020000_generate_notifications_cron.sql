-- Requires pg_cron extension to be enabled via the Supabase dashboard.

-- Function: generate notifications from active reminders that are within
-- their notify window (due_date - notify_days_before <= today) and haven't
-- had an undismissed notification generated yet.
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

-- Schedule: run daily at 7:00 AM UTC
SELECT cron.schedule(
    'generate-reminder-notifications',
    '0 7 * * *',
    'SELECT public.generate_reminder_notifications()'
);
