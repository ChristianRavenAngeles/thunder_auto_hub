-- ============================================================
-- Customer self-service rescheduling and cancellation history
-- ============================================================

create table if not exists booking_status_history (
  id                   uuid primary key default gen_random_uuid(),
  booking_id           uuid not null references bookings(id) on delete cascade,
  changed_by           uuid references profiles(id),
  actor_role           user_role,
  action               text not null,
  from_status          booking_status,
  to_status            booking_status,
  from_scheduled_date  date,
  from_scheduled_time  time,
  to_scheduled_date    date,
  to_scheduled_time    time,
  reason               text,
  note                 text,
  metadata             jsonb not null default '{}',
  created_at           timestamptz not null default now()
);

create index if not exists idx_booking_status_history_booking
  on booking_status_history(booking_id, created_at desc);

alter table booking_status_history enable row level security;

drop policy if exists "View own booking history" on booking_status_history;
create policy "View own booking history" on booking_status_history
for select using (
  exists (
    select 1 from bookings
    where bookings.id = booking_status_history.booking_id
    and bookings.user_id = auth.uid()
  )
  or is_staff()
);

drop policy if exists "Insert own booking history" on booking_status_history;
create policy "Insert own booking history" on booking_status_history
for insert with check (changed_by = auth.uid() or is_staff());
