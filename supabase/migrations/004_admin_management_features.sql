-- ============================================================
-- Admin management features: services, slots, and inbox support
-- ============================================================

create table if not exists booking_slot_blocks (
  id          uuid primary key default gen_random_uuid(),
  date        date not null,
  start_time  time,
  end_time    time,
  reason      text,
  is_full_day boolean not null default false,
  created_by  uuid references profiles(id),
  created_at  timestamptz not null default now()
);

create index if not exists idx_booking_slot_blocks_date
  on booking_slot_blocks(date, start_time);

alter table booking_slot_blocks enable row level security;
alter table blackout_dates enable row level security;
alter table canned_responses enable row level security;

drop policy if exists "Admin manage services" on services;
create policy "Admin manage services" on services
for all using (is_staff()) with check (is_staff());

drop policy if exists "Public read blackout dates" on blackout_dates;
create policy "Public read blackout dates" on blackout_dates
for select using (true);

drop policy if exists "Admin manage blackout dates" on blackout_dates;
create policy "Admin manage blackout dates" on blackout_dates
for all using (is_staff()) with check (is_staff());

drop policy if exists "Admin manage booking slot blocks" on booking_slot_blocks;
create policy "Admin manage booking slot blocks" on booking_slot_blocks
for all using (is_staff()) with check (is_staff());

drop policy if exists "Conversation access" on conversations;
create policy "Conversation access" on conversations
for select using (
  is_staff()
  or exists (
    select 1 from conversation_participants cp
    where cp.conversation_id = conversations.id
      and cp.user_id = auth.uid()
  )
);

drop policy if exists "Staff manage conversations" on conversations;
create policy "Staff manage conversations" on conversations
for all using (is_staff()) with check (is_staff());

drop policy if exists "Participant access" on conversation_participants;
create policy "Participant access" on conversation_participants
for select using (user_id = auth.uid() or is_staff());

drop policy if exists "Participant update read receipt" on conversation_participants;
create policy "Participant update read receipt" on conversation_participants
for update using (user_id = auth.uid() or is_staff())
with check (user_id = auth.uid() or is_staff());

drop policy if exists "Staff manage participants" on conversation_participants;
create policy "Staff manage participants" on conversation_participants
for insert with check (is_staff());

drop policy if exists "Conversation participant messages" on messages;
create policy "Conversation participant messages" on messages
for all using (
  is_staff()
  or exists (
    select 1 from conversation_participants cp
    where cp.conversation_id = messages.conversation_id
      and cp.user_id = auth.uid()
  )
) with check (
  is_staff()
  or exists (
    select 1 from conversation_participants cp
    where cp.conversation_id = messages.conversation_id
      and cp.user_id = auth.uid()
  )
);

drop policy if exists "Staff manage canned responses" on canned_responses;
create policy "Staff manage canned responses" on canned_responses
for all using (is_staff()) with check (is_staff());

insert into settings (key, value, description) values
  ('max_bookings_per_slot', '1', 'Maximum active bookings allowed in the same slot'),
  ('slot_interval_minutes', '60', 'Minutes between booking slots')
on conflict (key) do nothing;

insert into canned_responses (role, title, body)
select 'admin', 'Confirm Schedule', 'Thanks for reaching out. Your booking is in our queue and we will confirm the schedule shortly.'
where not exists (select 1 from canned_responses where title = 'Confirm Schedule');

insert into canned_responses (role, title, body)
select 'admin', 'Payment Reminder', 'We are ready to confirm your slot once the reservation deposit is verified. Please send the proof of payment here.'
where not exists (select 1 from canned_responses where title = 'Payment Reminder');

insert into canned_responses (role, title, body)
select 'admin', 'Reschedule Acknowledged', 'Your reschedule request has been received. We are checking the slot and will update you here.'
where not exists (select 1 from canned_responses where title = 'Reschedule Acknowledged');
