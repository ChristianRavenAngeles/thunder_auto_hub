-- Vehicle model → size tier lookup table.
-- Primary source for auto-detection in the booking wizard.
-- Unknown models are logged to unknown_vehicle_requests for admin review.
create table if not exists vehicle_models (
  id          uuid primary key default gen_random_uuid(),
  model_name  text not null,          -- lowercased, e.g. "montero sport"
  brand       text,                   -- optional, e.g. "mitsubishi"
  tier        text not null check (tier in ('S','M','L','XL')),
  source      text not null default 'manual', -- 'manual' | 'ai'
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (model_name)
);

create index if not exists idx_vehicle_models_model_name on vehicle_models (model_name);

-- Tracks unknown models so admins can identify and add them
create table if not exists unknown_vehicle_requests (
  id          uuid primary key default gen_random_uuid(),
  model_name  text not null,
  brand       text,
  request_count int not null default 1,
  resolved    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (model_name)
);

-- Seed with PH-market models
insert into vehicle_models (model_name, brand, tier, source) values
  -- ═══════════════════════════════
  -- TIER S — Small
  -- Small hatchbacks, subcompact sedans, compact city cars
  -- ═══════════════════════════════
  ('wigo',             'toyota',     'S', 'manual'),
  ('agya',             'toyota',     'S', 'manual'),
  ('raize',            'toyota',     'S', 'manual'),
  ('vios',             'toyota',     'S', 'manual'),
  ('yaris',            'toyota',     'S', 'manual'),
  ('brio',             'honda',      'S', 'manual'),
  ('city',             'honda',      'S', 'manual'),
  ('jazz',             'honda',      'S', 'manual'),
  ('fit',              'honda',      'S', 'manual'),
  ('mirage',           'mitsubishi', 'S', 'manual'),
  ('mirage g4',        'mitsubishi', 'S', 'manual'),
  ('swift',            'suzuki',     'S', 'manual'),
  ('dzire',            'suzuki',     'S', 'manual'),
  ('s-presso',         'suzuki',     'S', 'manual'),
  ('celerio',          'suzuki',     'S', 'manual'),
  ('picanto',          'kia',        'S', 'manual'),
  ('soluto',           'kia',        'S', 'manual'),
  ('accent',           'hyundai',    'S', 'manual'),
  ('reina',            'hyundai',    'S', 'manual'),
  ('almera',           'nissan',     'S', 'manual'),
  ('march',            'nissan',     'S', 'manual'),
  ('spark',            'chevrolet',  'S', 'manual'),
  ('sail',             'chevrolet',  'S', 'manual'),
  ('mazda 2',          'mazda',      'S', 'manual'),
  ('mazda2',           'mazda',      'S', 'manual'),
  ('mg 3',             'mg',         'S', 'manual'),
  ('mg3',              'mg',         'S', 'manual'),
  ('lancer',           'mitsubishi', 'S', 'manual'),
  ('beat',             'honda',      'S', 'manual'),
  -- ═══════════════════════════════
  -- TIER M — Medium
  -- Subcompact crossovers, compact sedans, compact SUVs, small MPVs
  -- ═══════════════════════════════
  ('trax',             'chevrolet',  'M', 'manual'),
  ('yaris cross',      'toyota',     'M', 'manual'),
  ('corolla',          'toyota',     'M', 'manual'),
  ('altis',            'toyota',     'M', 'manual'),
  ('corolla altis',    'toyota',     'M', 'manual'),
  ('avanza',           'toyota',     'M', 'manual'),
  ('veloz',            'toyota',     'M', 'manual'),
  ('rush',             'toyota',     'M', 'manual'),
  ('c-hr',             'toyota',     'M', 'manual'),
  ('chr',              'toyota',     'M', 'manual'),
  ('hr-v',             'honda',      'M', 'manual'),
  ('hrv',              'honda',      'M', 'manual'),
  ('br-v',             'honda',      'M', 'manual'),
  ('brv',              'honda',      'M', 'manual'),
  ('civic',            'honda',      'M', 'manual'),
  ('xpander',          'mitsubishi', 'M', 'manual'),
  ('xforce',           'mitsubishi', 'M', 'manual'),
  ('ertiga',           'suzuki',     'M', 'manual'),
  ('xl7',              'suzuki',     'M', 'manual'),
  ('creta',            'hyundai',    'M', 'manual'),
  ('stargazer',        'hyundai',    'M', 'manual'),
  ('elantra',          'hyundai',    'M', 'manual'),
  ('seltos',           'kia',        'M', 'manual'),
  ('stonic',           'kia',        'M', 'manual'),
  ('kicks',            'nissan',     'M', 'manual'),
  ('livina',           'nissan',     'M', 'manual'),
  ('sentra',           'nissan',     'M', 'manual'),
  ('sylphy',           'nissan',     'M', 'manual'),
  ('x-trail',          'nissan',     'M', 'manual'),
  ('xtrail',           'nissan',     'M', 'manual'),
  ('cx-3',             'mazda',      'M', 'manual'),
  ('cx3',              'mazda',      'M', 'manual'),
  ('cx-30',            'mazda',      'M', 'manual'),
  ('cx30',             'mazda',      'M', 'manual'),
  ('mazda 3',          'mazda',      'M', 'manual'),
  ('mazda3',           'mazda',      'M', 'manual'),
  ('mg zs',            'mg',         'M', 'manual'),
  ('coolray',          'geely',      'M', 'manual'),
  ('tiggo 2',          'chery',      'M', 'manual'),
  ('tiggo 2 pro',      'chery',      'M', 'manual'),
  ('tiggo 5x',         'chery',      'M', 'manual'),
  ('territory',        'ford',       'M', 'manual'),
  ('cr-v',             'honda',      'M', 'manual'),
  ('crv',              'honda',      'M', 'manual'),
  ('rav4',             'toyota',     'M', 'manual'),
  ('tucson',           'hyundai',    'M', 'manual'),
  ('sportage',         'kia',        'M', 'manual'),
  ('ecosport',         'ford',       'M', 'manual'),
  ('apv',              'suzuki',     'M', 'manual'),
  ('rocky',            'daihatsu',   'M', 'manual'),
  -- ═══════════════════════════════
  -- TIER L — Large
  -- Mid-size body-on-frame SUVs, full-size pickup trucks, large 7-seaters
  -- ═══════════════════════════════
  ('fortuner',         'toyota',     'L', 'manual'),
  ('hilux',            'toyota',     'L', 'manual'),
  ('montero',          'mitsubishi', 'L', 'manual'),
  ('montero sport',    'mitsubishi', 'L', 'manual'),
  ('strada',           'mitsubishi', 'L', 'manual'),
  ('triton',           'mitsubishi', 'L', 'manual'),
  ('everest',          'ford',       'L', 'manual'),
  ('ranger',           'ford',       'L', 'manual'),
  ('terra',            'nissan',     'L', 'manual'),
  ('navara',           'nissan',     'L', 'manual'),
  ('mu-x',             'isuzu',      'L', 'manual'),
  ('mux',              'isuzu',      'L', 'manual'),
  ('d-max',            'isuzu',      'L', 'manual'),
  ('dmax',             'isuzu',      'L', 'manual'),
  ('trailblazer',      'chevrolet',  'L', 'manual'),
  ('colorado',         'chevrolet',  'L', 'manual'),
  ('bt-50',            'mazda',      'L', 'manual'),
  ('bt50',             'mazda',      'L', 'manual'),
  ('cx-5',             'mazda',      'L', 'manual'),
  ('cx5',              'mazda',      'L', 'manual'),
  ('santa fe',         'hyundai',    'L', 'manual'),
  ('sorento',          'kia',        'L', 'manual'),
  ('carnival',         'kia',        'L', 'manual'),
  ('forester',         'subaru',     'L', 'manual'),
  ('outback',          'subaru',     'L', 'manual'),
  ('okavango',         'geely',      'L', 'manual'),
  ('tiggo 7',          'chery',      'L', 'manual'),
  ('tiggo 7 pro',      'chery',      'L', 'manual'),
  ('tiggo 8',          'chery',      'L', 'manual'),
  ('tiggo 8 pro',      'chery',      'L', 'manual'),
  ('gs8',              'gac',        'L', 'manual'),
  ('prado',            'toyota',     'L', 'manual'),
  ('land cruiser prado','toyota',    'L', 'manual'),
  ('4runner',          'toyota',     'L', 'manual'),
  -- ═══════════════════════════════
  -- TIER XL — Extra Large
  -- Full-size SUVs, vans, large MPVs, luxury large vehicles
  -- ═══════════════════════════════
  ('alphard',          'toyota',     'XL', 'manual'),
  ('grandia',          'toyota',     'XL', 'manual'),
  ('super grandia',    'toyota',     'XL', 'manual'),
  ('hiace',            'toyota',     'XL', 'manual'),
  ('hi-ace',           'toyota',     'XL', 'manual'),
  ('land cruiser',     'toyota',     'XL', 'manual'),
  ('urvan',            'nissan',     'XL', 'manual'),
  ('patrol',           'nissan',     'XL', 'manual'),
  ('staria',           'hyundai',    'XL', 'manual'),
  ('grand starex',     'hyundai',    'XL', 'manual'),
  ('starex',           'hyundai',    'XL', 'manual'),
  ('grand carnival',   'kia',        'XL', 'manual'),
  ('expedition',       'ford',       'XL', 'manual'),
  ('suburban',         'chevrolet',  'XL', 'manual'),
  ('tahoe',            'chevrolet',  'XL', 'manual'),
  ('escalade',         'cadillac',   'XL', 'manual'),
  ('sequoia',          'toyota',     'XL', 'manual'),
  ('lexus lx',         'lexus',      'XL', 'manual'),
  ('lexus lm',         'lexus',      'XL', 'manual'),
  ('v-class',          'mercedes-benz', 'XL', 'manual'),
  ('sprinter',         'mercedes-benz', 'XL', 'manual'),
  ('x7',               'bmw',        'XL', 'manual'),
  ('q7',               'audi',       'XL', 'manual'),
  ('q8',               'audi',       'XL', 'manual'),
  ('range rover',      'land rover', 'XL', 'manual'),
  ('defender 110',     'land rover', 'XL', 'manual'),
  ('defender 130',     'land rover', 'XL', 'manual'),
  ('defender',         'land rover', 'XL', 'manual'),
  ('wrangler',         'jeep',       'XL', 'manual'),
  ('wrangler unlimited','jeep',      'XL', 'manual'),
  ('grand cherokee',   'jeep',       'XL', 'manual'),
  ('m8',               'gac',        'XL', 'manual'),
  ('pajero',           'mitsubishi', 'XL', 'manual')
on conflict (model_name) do update
  set tier = excluded.tier, brand = excluded.brand, source = 'manual', updated_at = now();

-- RLS: public read, admin write
alter table vehicle_models enable row level security;

drop policy if exists "Public can read vehicle models" on vehicle_models;
create policy "Public can read vehicle models"
  on vehicle_models for select using (true);

drop policy if exists "Admins can manage vehicle models" on vehicle_models;
create policy "Admins can manage vehicle models"
  on vehicle_models for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'super_admin', 'manager')
    )
  );

-- RLS for unknown requests — public insert, admin read/delete
alter table unknown_vehicle_requests enable row level security;

drop policy if exists "Anyone can log unknown vehicles" on unknown_vehicle_requests;
create policy "Anyone can log unknown vehicles"
  on unknown_vehicle_requests for insert with check (true);

drop policy if exists "Admins can manage unknown vehicle requests" on unknown_vehicle_requests;
create policy "Admins can manage unknown vehicle requests"
  on unknown_vehicle_requests for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'super_admin', 'manager')
    )
  );

-- Helper function: upsert unknown vehicle and increment counter
create or replace function log_unknown_vehicle(p_model_name text, p_brand text default null)
returns void language plpgsql security definer as $$
begin
  insert into unknown_vehicle_requests (model_name, brand, request_count, updated_at)
  values (p_model_name, p_brand, 1, now())
  on conflict (model_name) do update
    set request_count = unknown_vehicle_requests.request_count + 1,
        updated_at    = now();
end;
$$;
