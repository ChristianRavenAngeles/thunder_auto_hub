-- ============================================================
-- Customer retention features: saved packages
-- ============================================================

create table if not exists saved_service_packages (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references profiles(id) on delete cascade,
  name             text not null,
  vehicle_tier     vehicle_tier,
  service_ids      uuid[] not null default '{}',
  service_names    text[] not null default '{}',
  source_booking_id uuid references bookings(id) on delete set null,
  last_used_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_saved_service_packages_user
  on saved_service_packages(user_id, updated_at desc);

alter table saved_service_packages enable row level security;

drop policy if exists "Own saved packages" on saved_service_packages;
create policy "Own saved packages" on saved_service_packages
for select using (user_id = auth.uid());

drop policy if exists "Insert own saved packages" on saved_service_packages;
create policy "Insert own saved packages" on saved_service_packages
for insert with check (user_id = auth.uid());

drop policy if exists "Update own saved packages" on saved_service_packages;
create policy "Update own saved packages" on saved_service_packages
for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Delete own saved packages" on saved_service_packages;
create policy "Delete own saved packages" on saved_service_packages
for delete using (user_id = auth.uid());
