-- ============================================================
-- Admin helper functions for fast aggregates
-- ============================================================

-- Returns total revenue from completed bookings in a single DB-side sum.
-- Called from the admin dashboard instead of fetching all rows.
create or replace function get_total_revenue()
returns numeric
language sql
security definer
stable
as $$
  select coalesce(sum(total_amount), 0)
  from bookings
  where status = 'completed';
$$;

-- Dashboard stats in a single round-trip: counts + revenue
create or replace function get_dashboard_stats()
returns json
language sql
security definer
stable
as $$
  select json_build_object(
    'total_bookings',    (select count(*) from bookings),
    'pending_bookings',  (select count(*) from bookings where status in ('pending','confirmed')),
    'today_bookings',    (select count(*) from bookings where scheduled_date = current_date),
    'total_customers',   (select count(*) from profiles where role = 'customer'),
    'total_revenue',     (select coalesce(sum(total_amount), 0) from bookings where status = 'completed')
  );
$$;
