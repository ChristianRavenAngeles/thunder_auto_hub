-- ============================================================
-- Phase 1 core operations improvements
-- ============================================================

alter table if exists bookings
  add column if not exists service_flags text[] not null default '{}';

insert into settings (key, value, description)
values
  ('customer_reschedule_cutoff_hours', '6', 'Minimum lead time in hours for customer self-service rescheduling'),
  ('customer_cancel_cutoff_hours', '3', 'Minimum lead time in hours for customer self-service cancellation'),
  ('admin_session_timeout_minutes', '15', 'Automatic sign-out threshold in minutes for staff and admin inactivity')
on conflict (key) do nothing;
