-- ============================================================
-- Thunder Auto Hub — Complete Database Schema
-- ============================================================

-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- ============================================================
-- ENUMS
-- ============================================================

create type user_role as enum ('customer', 'admin', 'manager', 'staff', 'rider', 'partner', 'super_admin');
create type vehicle_tier as enum ('S', 'M', 'L', 'XL');
create type service_category as enum ('wash', 'detailing', 'coating', 'maintenance');
create type booking_status as enum (
  'pending', 'confirmed', 'assigned', 'on_the_way', 'in_progress',
  'completed', 'cancelled', 'rescheduled', 'no_show'
);
create type payment_status as enum ('pending', 'deposit_paid', 'partial', 'paid', 'refunded', 'failed');
create type payment_method as enum ('gcash', 'bank_transfer', 'cash', 'paymongo', 'free');
create type lead_status as enum ('new', 'contacted', 'booked', 'lost', 'nurture');
create type membership_status as enum ('active', 'expired', 'cancelled', 'pending');
create type notification_channel as enum ('in_app', 'sms', 'messenger', 'email');
create type notification_type as enum (
  'booking_confirmed', 'booking_reminder', 'rider_assigned', 'rider_on_the_way',
  'service_started', 'service_completed', 'payment_received', 'review_request',
  'follow_up', 'broadcast', 'birthday', 'win_back', 'referral', 'system'
);
create type partner_status as enum ('pending', 'active', 'suspended', 'terminated');
create type quote_status as enum ('draft', 'sent', 'approved', 'rejected', 'converted');
create type expense_category as enum ('supplies', 'fuel', 'equipment', 'salary', 'marketing', 'utilities', 'other');
create type supply_unit as enum ('pcs', 'liters', 'kg', 'pack', 'bottle', 'set');
create type equipment_condition as enum ('excellent', 'good', 'fair', 'poor', 'needs_repair');
create type message_type as enum ('customer_admin', 'customer_rider', 'admin_rider', 'internal_team');

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================

create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  phone         text unique,
  full_name     text,
  email         text,
  role          user_role not null default 'customer',
  avatar_url    text,
  birthdate     date,
  address       text,
  barangay      text,
  city          text,
  is_active     boolean not null default true,
  is_blocked    boolean not null default false,
  block_reason  text,
  loyalty_points integer not null default 0,
  referral_code text unique default upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  referred_by   uuid references profiles(id),
  total_spent   numeric(12,2) not null default 0,
  booking_count integer not null default 0,
  notes         text,
  tags          text[] default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- VEHICLES
-- ============================================================

create table vehicles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  make        text not null,
  model       text not null,
  year        integer,
  color       text,
  plate       text,
  tier        vehicle_tier not null,
  is_primary  boolean not null default false,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- VEHICLE HEALTH NOTES
-- ============================================================

create table vehicle_health_notes (
  id          uuid primary key default gen_random_uuid(),
  vehicle_id  uuid not null references vehicles(id) on delete cascade,
  booking_id  uuid,
  noted_by    uuid references profiles(id),
  note        text not null,
  severity    text default 'info' check (severity in ('info', 'warning', 'critical')),
  created_at  timestamptz not null default now()
);

-- ============================================================
-- SERVICES
-- ============================================================

create table services (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  slug            text unique not null,
  category        service_category not null,
  description     text,
  inclusions      text[],
  duration_hours  numeric(4,1),
  price_s         numeric(10,2),
  price_m         numeric(10,2),
  price_l         numeric(10,2),
  price_xl        numeric(10,2),
  has_travel_fee  boolean not null default true,
  is_active       boolean not null default true,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- SERVICE AREAS (barangay lookup)
-- ============================================================

create table service_areas (
  id            uuid primary key default gen_random_uuid(),
  barangay      text not null,
  city          text not null,
  province      text not null default 'Pampanga',
  distance_km   numeric(5,1),
  travel_fee    numeric(8,2) not null default 0,
  is_serviceable boolean not null default true
);

-- ============================================================
-- BOOKINGS
-- ============================================================

create table bookings (
  id              uuid primary key default gen_random_uuid(),
  reference_no    text unique not null default 'TAH-' || upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  user_id         uuid not null references profiles(id),
  vehicle_id      uuid references vehicles(id),
  rider_id        uuid references profiles(id),
  status          booking_status not null default 'pending',
  scheduled_date  date not null,
  scheduled_time  time,
  address         text not null,
  barangay        text not null,
  city            text not null,
  landmarks       text,
  travel_fee      numeric(8,2) not null default 0,
  subtotal        numeric(10,2) not null default 0,
  discount_amount numeric(10,2) not null default 0,
  total_price     numeric(10,2) not null default 0,
  deposit_amount  numeric(8,2) not null default 100,
  deposit_paid    boolean not null default false,
  payment_status  payment_status not null default 'pending',
  source          text default 'website',
  promo_code      text,
  notes           text,
  admin_notes     text,
  cancellation_reason text,
  rescheduled_from uuid references bookings(id),
  eta_minutes     integer,
  is_recurring    boolean not null default false,
  recurrence_rule text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- BOOKING SERVICES (line items)
-- ============================================================

create table booking_services (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null references bookings(id) on delete cascade,
  service_id  uuid not null references services(id),
  service_name text not null,
  unit_price  numeric(10,2) not null,
  quantity    integer not null default 1,
  subtotal    numeric(10,2) not null,
  added_by    uuid references profiles(id),
  added_at    timestamptz not null default now()
);

-- ============================================================
-- JOB CHECKLISTS
-- ============================================================

create table job_checklist_templates (
  id          uuid primary key default gen_random_uuid(),
  service_id  uuid not null references services(id) on delete cascade,
  item        text not null,
  sort_order  integer not null default 0
);

create table job_checklist_items (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null references bookings(id) on delete cascade,
  template_id uuid references job_checklist_templates(id),
  item        text not null,
  is_done     boolean not null default false,
  done_at     timestamptz,
  done_by     uuid references profiles(id)
);

-- ============================================================
-- PAYMENTS
-- ============================================================

create table payments (
  id              uuid primary key default gen_random_uuid(),
  booking_id      uuid not null references bookings(id) on delete cascade,
  amount          numeric(10,2) not null,
  method          payment_method not null default 'gcash',
  status          payment_status not null default 'pending',
  is_deposit      boolean not null default false,
  screenshot_url  text,
  paymongo_id     text,
  paymongo_data   jsonb,
  notes           text,
  confirmed_by    uuid references profiles(id),
  confirmed_at    timestamptz,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- PHOTOS (before/after)
-- ============================================================

create table photos (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null references bookings(id) on delete cascade,
  type        text not null check (type in ('before', 'after', 'deposit', 'other')),
  url         text not null,
  caption     text,
  uploaded_by uuid references profiles(id),
  is_public   boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- REVIEWS & RATINGS
-- ============================================================

create table reviews (
  id           uuid primary key default gen_random_uuid(),
  booking_id   uuid not null references bookings(id) on delete cascade,
  user_id      uuid not null references profiles(id),
  rating       integer not null check (rating between 1 and 5),
  comment      text,
  is_public    boolean not null default false,
  admin_reply  text,
  replied_by   uuid references profiles(id),
  replied_at   timestamptz,
  tags         text[] default '{}',
  created_at   timestamptz not null default now()
);

-- ============================================================
-- MEMBERSHIPS
-- ============================================================

create table membership_plans (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  price_s           numeric(10,2),
  price_m           numeric(10,2),
  price_l           numeric(10,2),
  price_xl          numeric(10,2),
  wash_credits      integer not null default 0,
  glow_credits      integer not null default 0,
  detail_discount   numeric(5,2) not null default 0,
  duration_months   integer not null default 1,
  perks             text[],
  is_active         boolean not null default true,
  created_at        timestamptz not null default now()
);

create table memberships (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references profiles(id) on delete cascade,
  plan_id           uuid not null references membership_plans(id),
  vehicle_tier      vehicle_tier not null,
  status            membership_status not null default 'pending',
  wash_credits      integer not null default 0,
  glow_credits      integer not null default 0,
  starts_at         date,
  expires_at        date,
  payment_id        uuid references payments(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ============================================================
-- LOYALTY POINTS LEDGER
-- ============================================================

create table loyalty_ledger (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  points      integer not null,
  type        text not null check (type in ('earn', 'redeem', 'bonus', 'expire', 'adjust')),
  description text,
  booking_id  uuid references bookings(id),
  created_by  uuid references profiles(id),
  created_at  timestamptz not null default now()
);

-- ============================================================
-- REFERRALS
-- ============================================================

create table referrals (
  id            uuid primary key default gen_random_uuid(),
  referrer_id   uuid not null references profiles(id),
  referee_id    uuid not null references profiles(id),
  booking_id    uuid references bookings(id),
  points_given  integer not null default 0,
  discount_given numeric(8,2) not null default 0,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- PROMOS / VOUCHERS
-- ============================================================

create table promos (
  id              uuid primary key default gen_random_uuid(),
  code            text unique not null,
  name            text not null,
  description     text,
  discount_type   text not null check (discount_type in ('percentage', 'fixed')),
  discount_value  numeric(10,2) not null,
  min_amount      numeric(10,2),
  max_uses        integer,
  uses_per_user   integer not null default 1,
  usage_count     integer not null default 0,
  service_ids     uuid[],
  expires_at      timestamptz,
  is_active       boolean not null default true,
  created_by      uuid references profiles(id),
  created_at      timestamptz not null default now()
);

create table promo_usages (
  id          uuid primary key default gen_random_uuid(),
  promo_id    uuid not null references promos(id),
  user_id     uuid not null references profiles(id),
  booking_id  uuid references bookings(id),
  discount    numeric(10,2) not null,
  used_at     timestamptz not null default now()
);

-- ============================================================
-- SERVICE QUOTATIONS
-- ============================================================

create table quotations (
  id          uuid primary key default gen_random_uuid(),
  ref_no      text unique not null default 'QT-' || upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 6)),
  user_id     uuid references profiles(id),
  vehicle_id  uuid references vehicles(id),
  status      quote_status not null default 'draft',
  items       jsonb not null default '[]',
  subtotal    numeric(10,2) not null default 0,
  discount    numeric(10,2) not null default 0,
  travel_fee  numeric(8,2) not null default 0,
  total       numeric(10,2) not null default 0,
  notes       text,
  valid_until date,
  created_by  uuid references profiles(id),
  booking_id  uuid references bookings(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- MESSAGES (in-app chat)
-- ============================================================

create table conversations (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid references bookings(id) on delete cascade,
  type        message_type not null default 'customer_admin',
  created_at  timestamptz not null default now()
);

create table conversation_participants (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  user_id         uuid not null references profiles(id) on delete cascade,
  last_read_at    timestamptz,
  unique(conversation_id, user_id)
);

create table messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id       uuid not null references profiles(id),
  body            text,
  attachment_url  text,
  is_canned       boolean not null default false,
  is_deleted      boolean not null default false,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- CANNED RESPONSES
-- ============================================================

create table canned_responses (
  id          uuid primary key default gen_random_uuid(),
  role        user_role,
  title       text not null,
  body        text not null,
  created_by  uuid references profiles(id),
  created_at  timestamptz not null default now()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

create table notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  type        notification_type not null default 'system',
  channel     notification_channel not null default 'in_app',
  title       text not null,
  body        text not null,
  data        jsonb,
  is_read     boolean not null default false,
  sent_at     timestamptz,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- STAFF / RIDER PROFILES
-- ============================================================

create table staff (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null unique references profiles(id) on delete cascade,
  service_area      text,
  certifications    text[] default '{}',
  is_available      boolean not null default true,
  current_job_count integer not null default 0,
  rating_avg        numeric(3,2) default 0,
  jobs_completed    integer not null default 0,
  on_time_count     integer not null default 0,
  late_count        integer not null default 0,
  no_show_count     integer not null default 0,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table staff_availability (
  id          uuid primary key default gen_random_uuid(),
  staff_id    uuid not null references staff(id) on delete cascade,
  day_of_week integer check (day_of_week between 0 and 6),
  start_time  time,
  end_time    time,
  is_off      boolean not null default false,
  date        date
);

create table staff_certifications (
  id          uuid primary key default gen_random_uuid(),
  staff_id    uuid not null references staff(id) on delete cascade,
  service_id  uuid not null references services(id),
  certified_at date,
  expires_at  date,
  notes       text
);

-- ============================================================
-- COMMISSION / PAYOUTS
-- ============================================================

create table commissions (
  id          uuid primary key default gen_random_uuid(),
  rider_id    uuid not null references profiles(id),
  booking_id  uuid not null references bookings(id),
  amount      numeric(10,2) not null,
  is_paid     boolean not null default false,
  paid_at     timestamptz,
  paid_by     uuid references profiles(id),
  notes       text,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- LEADS
-- ============================================================

create table leads (
  id          uuid primary key default gen_random_uuid(),
  name        text,
  phone       text,
  email       text,
  source      text,
  status      lead_status not null default 'new',
  vehicle_model text,
  service_interest text,
  location    text,
  notes       text,
  tags        text[] default '{}',
  assigned_to uuid references profiles(id),
  followed_up_at timestamptz,
  booking_id  uuid references bookings(id),
  ghl_contact_id text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- EXPENSES
-- ============================================================

create table expenses (
  id          uuid primary key default gen_random_uuid(),
  category    expense_category not null,
  description text not null,
  amount      numeric(10,2) not null,
  receipt_url text,
  logged_by   uuid references profiles(id),
  date        date not null default current_date,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- INVENTORY (supplies)
-- ============================================================

create table supplies (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  description     text,
  unit            supply_unit not null default 'pcs',
  quantity        numeric(10,2) not null default 0,
  low_stock_alert numeric(10,2) not null default 5,
  unit_cost       numeric(10,2),
  supplier        text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table supply_usage (
  id          uuid primary key default gen_random_uuid(),
  supply_id   uuid not null references supplies(id) on delete cascade,
  booking_id  uuid references bookings(id),
  quantity    numeric(10,2) not null,
  type        text not null check (type in ('use', 'restock', 'adjust', 'waste')),
  notes       text,
  logged_by   uuid references profiles(id),
  created_at  timestamptz not null default now()
);

-- ============================================================
-- EQUIPMENT
-- ============================================================

create table equipment (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  serial_no         text,
  condition         equipment_condition not null default 'good',
  assigned_to       uuid references profiles(id),
  purchase_date     date,
  last_serviced_at  date,
  next_service_at   date,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ============================================================
-- WAITLISTS
-- ============================================================

create table waitlists (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id),
  name        text,
  phone       text,
  email       text,
  barangay    text,
  city        text,
  type        text not null default 'out_of_area' check (type in ('out_of_area', 'fully_booked')),
  date        date,
  notified    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- BLACKOUT DATES
-- ============================================================

create table blackout_dates (
  id          uuid primary key default gen_random_uuid(),
  date        date not null unique,
  reason      text,
  created_by  uuid references profiles(id),
  created_at  timestamptz not null default now()
);

-- ============================================================
-- BLOG / TIPS
-- ============================================================

create table blog_posts (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  slug        text unique not null,
  excerpt     text,
  content     text not null,
  cover_url   text,
  tags        text[] default '{}',
  is_published boolean not null default false,
  author_id   uuid references profiles(id),
  published_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- FAQs
-- ============================================================

create table faqs (
  id          uuid primary key default gen_random_uuid(),
  question    text not null,
  answer      text not null,
  category    text,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_by  uuid references profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- PROMO BANNERS
-- ============================================================

create table promo_banners (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  body        text,
  image_url   text,
  link        text,
  is_active   boolean not null default true,
  starts_at   timestamptz,
  ends_at     timestamptz,
  sort_order  integer not null default 0,
  created_by  uuid references profiles(id),
  created_at  timestamptz not null default now()
);

-- ============================================================
-- BROADCAST MESSAGES
-- ============================================================

create table broadcasts (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  body        text not null,
  channel     notification_channel not null default 'in_app',
  audience    text not null default 'all',
  filter_data jsonb,
  sent_count  integer not null default 0,
  status      text not null default 'draft' check (status in ('draft', 'sending', 'sent', 'failed')),
  sent_at     timestamptz,
  created_by  uuid references profiles(id),
  created_at  timestamptz not null default now()
);

-- ============================================================
-- FOLLOW-UP SCHEDULERS
-- ============================================================

create table follow_ups (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id),
  booking_id  uuid references bookings(id),
  type        text not null,
  scheduled_at timestamptz not null,
  sent_at     timestamptz,
  is_sent     boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- B2B PARTNERS
-- ============================================================

create table partners (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references profiles(id),
  business_name   text not null,
  contact_name    text,
  phone           text,
  email           text,
  address         text,
  city            text,
  status          partner_status not null default 'pending',
  revenue_share   numeric(5,2) not null default 0,
  services_offered text[] default '{}',
  notes           text,
  approved_by     uuid references profiles(id),
  approved_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table partner_referrals (
  id            uuid primary key default gen_random_uuid(),
  partner_id    uuid not null references partners(id) on delete cascade,
  booking_id    uuid not null references bookings(id),
  booking_total numeric(10,2) not null,
  share_pct     numeric(5,2) not null,
  share_amount  numeric(10,2) not null,
  is_paid       boolean not null default false,
  paid_at       timestamptz,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- AUDIT LOG
-- ============================================================

create table audit_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id),
  action      text not null,
  table_name  text,
  record_id   uuid,
  old_data    jsonb,
  new_data    jsonb,
  ip_address  text,
  user_agent  text,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- SYSTEM SETTINGS
-- ============================================================

create table settings (
  key         text primary key,
  value       jsonb not null,
  description text,
  updated_by  uuid references profiles(id),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- OTP TOKENS (custom Semaphore OTP)
-- ============================================================

create table otp_tokens (
  id          uuid primary key default gen_random_uuid(),
  phone       text not null,
  token       text not null,
  expires_at  timestamptz not null default now() + interval '10 minutes',
  used        boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- SESSION MANAGEMENT
-- ============================================================

create table user_sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  device      text,
  ip_address  text,
  user_agent  text,
  is_active   boolean not null default true,
  last_active_at timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index idx_bookings_user_id     on bookings(user_id);
create index idx_bookings_rider_id    on bookings(rider_id);
create index idx_bookings_status      on bookings(status);
create index idx_bookings_date        on bookings(scheduled_date);
create index idx_bookings_reference   on bookings(reference_no);
create index idx_vehicles_user_id     on vehicles(user_id);
create index idx_payments_booking_id  on payments(booking_id);
create index idx_messages_convo_id    on messages(conversation_id);
create index idx_notifications_user   on notifications(user_id, is_read);
create index idx_leads_status         on leads(status);
create index idx_audit_logs_user      on audit_logs(user_id);
create index idx_audit_logs_table     on audit_logs(table_name, record_id);
create index idx_otp_phone            on otp_tokens(phone, used);
create index idx_profiles_phone       on profiles(phone);
create index idx_profiles_referral    on profiles(referral_code);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at     before update on profiles     for each row execute function update_updated_at();
create trigger trg_vehicles_updated_at     before update on vehicles     for each row execute function update_updated_at();
create trigger trg_bookings_updated_at     before update on bookings     for each row execute function update_updated_at();
create trigger trg_services_updated_at     before update on services     for each row execute function update_updated_at();
create trigger trg_memberships_updated_at  before update on memberships  for each row execute function update_updated_at();
create trigger trg_quotations_updated_at   before update on quotations   for each row execute function update_updated_at();
create trigger trg_leads_updated_at        before update on leads        for each row execute function update_updated_at();
create trigger trg_supplies_updated_at     before update on supplies     for each row execute function update_updated_at();
create trigger trg_equipment_updated_at    before update on equipment    for each row execute function update_updated_at();
create trigger trg_partners_updated_at     before update on partners     for each row execute function update_updated_at();
create trigger trg_staff_updated_at        before update on staff        for each row execute function update_updated_at();
create trigger trg_blog_updated_at         before update on blog_posts   for each row execute function update_updated_at();
create trigger trg_faqs_updated_at         before update on faqs         for each row execute function update_updated_at();

-- ============================================================
-- RLS POLICIES
-- ============================================================

alter table profiles                  enable row level security;
alter table vehicles                  enable row level security;
alter table vehicle_health_notes      enable row level security;
alter table bookings                  enable row level security;
alter table booking_services          enable row level security;
alter table payments                  enable row level security;
alter table photos                    enable row level security;
alter table reviews                   enable row level security;
alter table memberships               enable row level security;
alter table loyalty_ledger            enable row level security;
alter table referrals                 enable row level security;
alter table notifications             enable row level security;
alter table messages                  enable row level security;
alter table conversations             enable row level security;
alter table conversation_participants enable row level security;
alter table commissions               enable row level security;
alter table leads                     enable row level security;
alter table expenses                  enable row level security;
alter table supplies                  enable row level security;
alter table supply_usage              enable row level security;
alter table equipment                 enable row level security;
alter table waitlists                 enable row level security;
alter table blog_posts                enable row level security;
alter table faqs                      enable row level security;
alter table promo_banners             enable row level security;
alter table broadcasts                enable row level security;
alter table follow_ups                enable row level security;
alter table partners                  enable row level security;
alter table partner_referrals         enable row level security;
alter table audit_logs                enable row level security;
alter table settings                  enable row level security;
alter table otp_tokens                enable row level security;
alter table user_sessions             enable row level security;
alter table job_checklist_items       enable row level security;
alter table quotations                enable row level security;

-- Helper: check if current user is admin or above
create or replace function is_admin()
returns boolean language sql security definer as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
    and role in ('admin', 'manager', 'super_admin')
  );
$$;

-- Helper: check if current user is staff/rider/admin
create or replace function is_staff()
returns boolean language sql security definer as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
    and role in ('admin', 'manager', 'staff', 'rider', 'super_admin')
  );
$$;

-- Profiles: own row or admin
create policy "Users view own profile" on profiles for select using (id = auth.uid() or is_admin());
create policy "Users update own profile" on profiles for update using (id = auth.uid());
create policy "Admin full access profiles" on profiles for all using (is_admin());
create policy "Public insert profile on signup" on profiles for insert with check (id = auth.uid());

-- Vehicles: own or admin
create policy "Own vehicles" on vehicles for all using (user_id = auth.uid() or is_admin());

-- Bookings: own or staff
create policy "Customer own bookings" on bookings for select using (user_id = auth.uid() or is_staff());
create policy "Customer insert booking" on bookings for insert with check (user_id = auth.uid());
create policy "Customer update own booking" on bookings for update using (user_id = auth.uid() or is_staff());
create policy "Admin full bookings" on bookings for all using (is_admin());
create policy "Rider view assigned" on bookings for select using (rider_id = auth.uid());

-- Payments: own or admin
create policy "Own payments" on payments for select using (
  exists (select 1 from bookings where id = booking_id and user_id = auth.uid()) or is_admin()
);
create policy "Admin full payments" on payments for all using (is_admin());

-- Photos: own booking or public gallery or admin
create policy "Own booking photos" on photos for select using (
  exists (select 1 from bookings where id = booking_id and user_id = auth.uid())
  or is_public = true or is_staff()
);
create policy "Staff upload photos" on photos for insert with check (is_staff() or uploaded_by = auth.uid());

-- Notifications: own
create policy "Own notifications" on notifications for all using (user_id = auth.uid());

-- Messages: participant
create policy "Conversation participant messages" on messages for all using (
  exists (
    select 1 from conversation_participants cp
    where cp.conversation_id = conversation_id and cp.user_id = auth.uid()
  ) or is_admin()
);

-- Admin-only tables
create policy "Admin only leads"     on leads     for all using (is_admin());
create policy "Admin only expenses"  on expenses  for all using (is_admin());
create policy "Admin only supplies"  on supplies  for all using (is_admin());
create policy "Admin only equipment" on equipment for all using (is_admin());
create policy "Admin only audit"     on audit_logs for select using (is_admin());
create policy "Admin only settings"  on settings  for all using (is_admin());
create policy "Admin only broadcasts" on broadcasts for all using (is_admin());

-- Public read: services, FAQs, blog, banners, service_areas, reviews (published)
create policy "Public read services"       on services       for select using (is_active = true);
create policy "Public read faqs"           on faqs           for select using (is_active = true);
create policy "Public read blog"           on blog_posts     for select using (is_published = true);
create policy "Public read banners"        on promo_banners  for select using (is_active = true);
create policy "Public read reviews"        on reviews        for select using (is_public = true);
create policy "Public read service_areas"  on service_areas  for select using (true);
create policy "Public insert waitlist"     on waitlists      for insert with check (true);

-- OTP: insert only (verification done server-side with service role)
create policy "OTP insert" on otp_tokens for insert with check (true);

-- ============================================================
-- DEFAULT SEED DATA
-- ============================================================

-- System settings
insert into settings (key, value, description) values
  ('deposit_amount',          '100',                                               'Reservation deposit in PHP'),
  ('business_hours_start',    '"08:00"',                                           'Business opening time'),
  ('business_hours_end',      '"18:00"',                                           'Business closing time'),
  ('business_days',           '[1,2,3,4,5]',                                       'Operating days (0=Sun, 6=Sat)'),
  ('base_location',           '"Arayat, Pampanga"',                                'Base location for distance calculation'),
  ('max_service_range_km',    '25',                                                'Max service range in km'),
  ('maintenance_mode',        'false',                                              'Maintenance mode toggle'),
  ('sms_templates',           '{"booking_confirmed":"Kumusta! Naconfirm na ang inyong booking sa Thunder Auto Hub. Reference: {{ref_no}}. Salamat po!", "rider_assigned":"Assigned na ang inyong rider na si {{rider_name}}. Abangan po niya!", "service_completed":"Tapos na po ang inyong sasakyan! Salamat sa pagpili ng Thunder Auto Hub. I-rate ang inyong experience: {{link}}", "reminder":"Reminder: Bukas po ang inyong appointment sa Thunder Auto Hub ({{date}}, {{time}}). {{ref_no}}"}', 'SMS message templates'),
  ('loyalty_rate',            '1',                                                  'Points earned per PHP spent'),
  ('loyalty_redemption_rate', '100',                                                'Points needed per PHP discount'),
  ('commission_rate',         '10',                                                 'Default rider commission percentage'),
  ('app_name',                '"Thunder Auto Hub"',                                 'Application display name'),
  ('contact_phone',           '"+63XXXXXXXXXX"',                                    'Business contact number'),
  ('contact_email',           '"thunder.auto.hub@gmail.com"',                       'Business contact email');

-- Service areas (barangays within 25km of Arayat)
insert into service_areas (barangay, city, distance_km, travel_fee, is_serviceable) values
  ('Arayat',          'Arayat',         0,    0,   true),
  ('Poblacion',       'Arayat',         0,    0,   true),
  ('San Juan',        'Arayat',         3,    0,   true),
  ('San Vicente',     'Arayat',         4,    0,   true),
  ('Mabiga',          'Arayat',         5,    0,   true),
  ('Candating',       'Arayat',         6,    0,   true),
  ('Gatiawin',        'Arayat',         7,    0,   true),
  ('Magumbali',       'San Luis',       9,    150, true),
  ('Sta. Catalina',   'San Luis',       10,   150, true),
  ('Poblacion',       'San Luis',       12,   150, true),
  ('Sampaloc',        'San Luis',       14,   150, true),
  ('Poblacion',       'Mexico',         15,   150, true),
  ('Sta. Cruz',       'Mexico',         16,   170, true),
  ('Lagundi',         'Mexico',         17,   170, true),
  ('Pandacaqui',      'Mexico',         18,   170, true),
  ('Poblacion',       'Magalang',       16,   170, true),
  ('San Agustin',     'Magalang',       18,   170, true),
  ('Sto. Rosario',    'Magalang',       20,   170, true),
  ('Poblacion',       'Candaba',        18,   170, true),
  ('Sta. Monica',     'Candaba',        20,   170, true),
  ('Sta. Rita',       'Candaba',        22,   200, true),
  ('Poblacion',       'Sta. Ana',       21,   200, true),
  ('Poblacion',       'Capas',          23,   200, true),
  ('Poblacion',       'Concepcion',     24,   200, true),
  ('Cuyapo',          'Nueva Ecija',    26,   0,   false),
  ('Cabanatuan',      'Nueva Ecija',    35,   0,   false);

-- Default services
insert into services (name, slug, category, description, inclusions, duration_hours, price_s, price_m, price_l, price_xl, has_travel_fee, sort_order) values
  ('Basic Wash', 'basic-wash', 'wash',
   'Exterior wash, tire black, mat cleaning, full interior vacuum, glass cleaning, interior wipe down.',
   ARRAY['Exterior wash', 'Tire black', 'Mat cleaning', 'Full interior vacuum', 'Glass cleaning', 'Interior wipe down'],
   2, 300, 350, 450, 550, true, 1),

  ('Basic Glow', 'basic-glow', 'wash',
   'Everything in Basic Wash plus added shine and paint protection for that glossy finish.',
   ARRAY['Everything in Basic Wash', 'Paint shine treatment', 'Exterior wipe down with shine formula', 'Dashboard UV protectant'],
   2.5, 450, 500, 650, 750, true, 2),

  ('Interior Detailing', 'interior-detailing', 'detailing',
   'Deep interior cleaning — seats, panels, carpet, headliner, vents, and odor treatment.',
   ARRAY['Deep seat cleaning', 'Door panel cleaning', 'Carpet shampooing', 'Headliner cleaning', 'Vent detailing', 'Odor treatment'],
   4, 1200, 1400, 1800, 2200, false, 3),

  ('Exterior Detailing', 'exterior-detailing', 'detailing',
   'Full exterior paint correction, clay bar treatment, decontamination, and polish.',
   ARRAY['Clay bar decontamination', 'Paint correction', 'Bug/tar removal', 'Wheel deep clean', 'Exterior polish'],
   4, 1500, 1800, 2200, 2800, false, 4),

  ('Glass Detailing', 'glass-detailing', 'detailing',
   'Full glass restoration — water spot removal, polishing, and hydrophobic coat.',
   ARRAY['Water spot removal', 'Glass polish', 'Hydrophobic coating', 'Interior glass cleaning'],
   2, 800, 1000, 1200, 1500, false, 5),

  ('Dry Engine Detailing', 'engine-detailing', 'detailing',
   'Engine bay cleaning and dressing without water for a clean, protected engine.',
   ARRAY['Dry engine degreasing', 'Engine dressing', 'Plastic restoration', 'Wire loom inspection note'],
   2, 800, 1000, 1200, 1500, false, 6),

  ('Tire Detailing', 'tire-detailing', 'detailing',
   'Full tire and wheel arch deep clean, shine, and protection.',
   ARRAY['Tire deep clean', 'Tire shine', 'Wheel arch cleaning', 'Rim polish'],
   1.5, 500, 600, 800, 1000, false, 7),

  ('Car Care Deluxe', 'car-care-deluxe', 'maintenance',
   'Comprehensive maintenance package combining wash, interior, and paint care for coated vehicles.',
   ARRAY['Full exterior wash', 'Interior vacuum and wipe', 'Paint inspection', 'Coating maintenance spray', 'Tire shine', 'Glass clean'],
   3, 1800, 2200, 2800, 3500, false, 8),

  ('Ceramic Coating', 'ceramic-coating', 'coating',
   '9H ceramic coating for maximum paint protection, gloss, and hydrophobic properties. Lasts 3–5 years.',
   ARRAY['Paint decontamination', 'Paint correction', '9H ceramic coat application', '1-year warranty', 'Maintenance guide'],
   16, 8000, 10000, 13000, 16000, false, 9),

  ('Graphene Coating', 'graphene-coating', 'coating',
   'Advanced graphene-infused coating for superior heat resistance, gloss, and durability. Lasts 3–5 years.',
   ARRAY['Paint decontamination', 'Paint correction', 'Graphene coat application', '1-year warranty', 'Maintenance guide'],
   16, 10000, 12500, 16000, 20000, false, 10);

-- Default membership plan
insert into membership_plans (name, price_s, price_m, price_l, price_xl, wash_credits, glow_credits, detail_discount, duration_months, perks) values
  ('Thunder Essential', 1000, 1200, 1500, 1750, 3, 1, 10,  1,
   ARRAY['Priority booking', 'Free interior protectant', '10% detailing discount', '3x Basic Wash', '1x Basic Glow']);

-- Default FAQ
insert into faqs (question, answer, category, sort_order) values
  ('Hanggang saan kayo nagse-service?', 'Nagse-service kami sa loob ng 25km mula Arayat, Pampanga. Kasama na ang Magalang, Mexico, San Luis, at ilang parte ng Candaba at Concepcion.', 'general', 1),
  ('May travel fee ba?', 'May travel fee para sa Wash services depende sa layo: 0–7km libre, 8–15km ₱150, 16–20km ₱170, 21–25km ₱200. Ang Detailing at Coating ay walang travel fee.', 'pricing', 2),
  ('Gaano katagal ang isang booking?', 'Basic Wash: 2–2.5 oras. Detailing: 3–5 oras depende sa service. Coating: 1–2 araw.', 'booking', 3),
  ('Kailangan ba may tubig at kuryente sa location?', 'Hindi na kailangan. May dalang sariling equipment ang aming team. Kailangan lang ng maayos na lugar para magtrabaho.', 'general', 4),
  ('Pano mag-book?', 'Pindutin ang Book Now, piliin ang sasakyan at serbisyo, ilagay ang inyong address, at bayaran ang ₱100 reservation deposit. Makikita ninyo ang status ng booking sa inyong dashboard.', 'booking', 5),
  ('Ano ang ceramic vs graphene coating?', 'Pareho silang nagbibigay ng long-term paint protection (3–5 years). Ang graphene coating ay may mas mataas na heat resistance at mas glossy — ideal para sa cars na nakapark sa araw. Ang ceramic ay mahusay na din naman.', 'services', 6),
  ('Mayroon bang membership?', 'Oo! Ang aming Thunder Essential membership ay may 3x Basic Wash + 1x Basic Glow + priority booking at discounts sa detailing. Available para sa lahat ng vehicle tiers.', 'membership', 7);

-- Canned responses
insert into canned_responses (role, title, body) values
  ('rider', 'On the way', 'Papunta na po kami! Abangan po ninyo kami. 🚚'),
  ('rider', 'Arrived', 'Nandito na po kami sa inyong location. Sisimulan na namin.'),
  ('rider', 'Service started', 'Nagsimula na po kami. Aabutin ng mga {{duration}} minuto. ✨'),
  ('rider', 'Service done', 'Tapos na po! Salamat sa tiwala. 🙏 Maaari po kayong mag-rate ng aming serbisyo sa inyong dashboard.'),
  ('admin', 'Booking confirmed', 'Kumusta! Naconfirm na po ang inyong booking. Reference No: {{ref_no}}. Abangan ang aming rider!'),
  ('admin', 'Need more details', 'Magandang araw! Kailangan pa namin ng ilang detalye para ma-confirm ang inyong booking. Maaari po ba ninyong ibigay ang exact address?'),
  ('admin', 'Payment received', 'Natanggap na po namin ang inyong payment. Salamat! Makikita na ninyo ang updated status ng booking ninyo.'),
  ('admin', 'Rescheduling', 'Pasensya na po at kailangan naming i-reschedule ang inyong appointment. Maaari po ba tayong mag-usap ng bagong schedule?');

-- ============================================================
-- AUTH TRIGGER — auto-create profile on new user signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'customer')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
