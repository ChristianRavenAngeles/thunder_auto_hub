-- Add motorcycle tiers to vehicle_models
-- MS = Small Motorcycle (50–299cc), ML = Big Motorcycle (300cc+)

-- Expand the tier check constraint to include MS and ML
alter table vehicle_models drop constraint if exists vehicle_models_tier_check;
alter table vehicle_models add constraint vehicle_models_tier_check
  check (tier in ('S','M','L','XL','MS','ML'));

-- Seed common motorcycle models
insert into vehicle_models (model_name, brand, tier, source) values
  -- Small Motorcycles (50–299cc)
  ('click 125',        'honda',    'MS', 'manual'),
  ('click 150',        'honda',    'MS', 'manual'),
  ('beat',             'honda',    'MS', 'manual'),
  ('pcx 160',          'honda',    'MS', 'manual'),
  ('tmx 125',          'honda',    'MS', 'manual'),
  ('xrm 125',          'honda',    'MS', 'manual'),
  ('rs125',            'honda',    'MS', 'manual'),
  ('wave 125',         'honda',    'MS', 'manual'),
  ('mio 125',          'yamaha',   'MS', 'manual'),
  ('mio soul',         'yamaha',   'MS', 'manual'),
  ('mio aerox 155',    'yamaha',   'MS', 'manual'),
  ('nmax 155',         'yamaha',   'MS', 'manual'),
  ('sniper 150',       'yamaha',   'MS', 'manual'),
  ('xtz 125',          'yamaha',   'MS', 'manual'),
  ('fzs 150',          'yamaha',   'MS', 'manual'),
  ('skydrive 125',     'suzuki',   'MS', 'manual'),
  ('raider 150',       'suzuki',   'MS', 'manual'),
  ('address 115',      'suzuki',   'MS', 'manual'),
  ('burgman 125',      'suzuki',   'MS', 'manual'),
  ('krr 150',          'kawasaki', 'MS', 'manual'),
  ('barako 175',       'kawasaki', 'MS', 'manual'),
  ('ct125',            'honda',    'MS', 'manual'),
  ('rusi motors',      'rusi',     'MS', 'manual'),
  -- Big Motorcycles (300cc+)
  ('cbr 300r',         'honda',    'ML', 'manual'),
  ('cbr 500r',         'honda',    'ML', 'manual'),
  ('cbr 600rr',        'honda',    'ML', 'manual'),
  ('cbr 1000rr',       'honda',    'ML', 'manual'),
  ('cb500f',           'honda',    'ML', 'manual'),
  ('cb650r',           'honda',    'ML', 'manual'),
  ('africa twin',      'honda',    'ML', 'manual'),
  ('rebel 500',        'honda',    'ML', 'manual'),
  ('rebel 1100',       'honda',    'ML', 'manual'),
  ('xadv 750',         'honda',    'ML', 'manual'),
  ('mt-03',            'yamaha',   'ML', 'manual'),
  ('mt-07',            'yamaha',   'ML', 'manual'),
  ('mt-09',            'yamaha',   'ML', 'manual'),
  ('mt-10',            'yamaha',   'ML', 'manual'),
  ('r3',               'yamaha',   'ML', 'manual'),
  ('r6',               'yamaha',   'ML', 'manual'),
  ('r1',               'yamaha',   'ML', 'manual'),
  ('tracer 900',       'yamaha',   'ML', 'manual'),
  ('tmax 560',         'yamaha',   'ML', 'manual'),
  ('ninja 400',        'kawasaki', 'ML', 'manual'),
  ('ninja 650',        'kawasaki', 'ML', 'manual'),
  ('ninja zx-6r',      'kawasaki', 'ML', 'manual'),
  ('ninja zx-10r',     'kawasaki', 'ML', 'manual'),
  ('z400',             'kawasaki', 'ML', 'manual'),
  ('z650',             'kawasaki', 'ML', 'manual'),
  ('z900',             'kawasaki', 'ML', 'manual'),
  ('versys 650',       'kawasaki', 'ML', 'manual'),
  ('gsx-r 600',        'suzuki',   'ML', 'manual'),
  ('gsx-r 750',        'suzuki',   'ML', 'manual'),
  ('gsx-r 1000',       'suzuki',   'ML', 'manual'),
  ('gsx-s 750',        'suzuki',   'ML', 'manual'),
  ('v-strom 650',      'suzuki',   'ML', 'manual'),
  ('hayabusa',         'suzuki',   'ML', 'manual'),
  ('duke 390',         'ktm',      'ML', 'manual'),
  ('duke 790',         'ktm',      'ML', 'manual'),
  ('rc 390',           'ktm',      'ML', 'manual'),
  ('panigale v2',      'ducati',   'ML', 'manual'),
  ('panigale v4',      'ducati',   'ML', 'manual'),
  ('monster 821',      'ducati',   'ML', 'manual'),
  ('s1000rr',          'bmw',      'ML', 'manual'),
  ('r1250gs',          'bmw',      'ML', 'manual'),
  ('f900r',            'bmw',      'ML', 'manual')
on conflict (model_name) do update
  set tier = excluded.tier, brand = excluded.brand, source = 'manual', updated_at = now();
