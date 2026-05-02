-- Add estimated duration to bookings so availability blocking respects service hours
alter table bookings
  add column if not exists estimated_duration_hours numeric(4,1) not null default 1;
