-- FFP Sports core schema. Catalogue is public to read; everything else is admin only.
-- Bookings and estimate requests are written by the api edge function (service role), which prices them server-side.

create extension if not exists pgcrypto;

-- ---------- people ----------
create table public.staff (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  email text not null unique,
  first_name text not null default '',
  middle_names text not null default '',
  last_name text not null default '',
  phone text not null default '',
  photo_url text not null default '',
  is_admin boolean not null default false,
  is_crew boolean not null default true,
  active boolean not null default true,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from staff s where s.active and s.is_admin
    and (s.user_id = auth.uid() or lower(s.email) = lower(coalesce(auth.jwt()->>'email', ''))));
$$;

-- links a signed-in user to their staff row the first time they sign in
create or replace function public.claim_staff() returns staff
language plpgsql security definer set search_path = public as $$
declare r staff;
begin
  update staff set user_id = auth.uid()
   where user_id is null and lower(email) = lower(coalesce(auth.jwt()->>'email', ''))
   returning * into r;
  if r.id is null then select * into r from staff where user_id = auth.uid(); end if;
  return r;
end $$;

create table public.role_groups (id text primary key, name text not null, sort int not null default 0);
create table public.roles (
  id text primary key,
  group_id text not null references role_groups(id),
  name text not null,
  client_day numeric not null default 0,   -- what the client pays for this role per day
  cost_day numeric not null default 0,     -- what FFP pays per day
  sort int not null default 0,
  active boolean not null default true
);
create table public.staff_roles (
  staff_id uuid references staff(id) on delete cascade,
  role_id text references roles(id) on delete cascade,
  day_rate numeric,                         -- this person's own rate, if different
  primary key (staff_id, role_id)
);

-- ---------- catalogue ----------
create table public.settings (key text primary key, value text not null default '');

create table public.zones (
  id text primary key, name text not null,
  travel_per_crew numeric not null default 0,  -- per crew member per day
  delivery numeric not null default 0,         -- gear drop-off plus pick-up, split into two lines
  sort int not null default 0
);

create table public.services (
  id text primary key, name text not null, strap text not null default '', img text not null default '',
  gearable boolean not null default false,   -- can be booked as gear only
  season boolean not null default false,     -- offers a season price
  editing boolean not null default false,    -- has an editing step
  sort int not null default 0, active boolean not null default true
);

create table public.packages (
  id text primary key, service_id text not null references services(id) on delete cascade,
  name text not null, strap text not null default '', img text not null default '',
  crew int not null default 1,
  price_2h numeric not null, price_day numeric not null,
  cost_2h numeric not null default 0, cost_day numeric not null default 0,
  items jsonb not null default '[]',          -- [{t, d}] what's included
  sort int not null default 0, active boolean not null default true
);

-- kind: addon (on the day), edit_level (pick one), edit_extra (only with an edit)
create table public.extras (
  id text primary key, service_id text not null references services(id) on delete cascade,
  kind text not null check (kind in ('addon', 'edit_level', 'edit_extra')),
  name text not null, strap text not null default '', img text not null default '',
  price_2h numeric not null default 0, price_day numeric not null default 0,
  cost_2h numeric not null default 0, cost_day numeric not null default 0,
  per_crew_hour boolean not null default false,  -- extra hour: priced per crew member
  adds_crew int not null default 0,
  pick_group text,                              -- only one extra per group (commentators)
  sort int not null default 0, active boolean not null default true
);

create table public.gear (
  id text primary key, kind text not null check (kind in ('kit', 'item')),
  name text not null, strap text not null default '', detail text not null default '', img text not null default '',
  price_day numeric not null, units int not null default 1, deposit numeric not null default 0,
  purchase_price numeric, sort int not null default 0, active boolean not null default true
);

create table public.partner_codes (
  code text primary key, pct numeric not null default 5, note text not null default '',
  active boolean not null default true, created_at timestamptz not null default now()
);

-- ---------- bookings ----------
create sequence public.booking_ref_seq start 10001;
create sequence public.quote_no_seq start 144;

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  ref text unique not null default ('FFPS-R-' || nextval('booking_ref_seq')),
  kind text not null default 'booking' check (kind in ('booking', 'estimate')),
  status text not null default 'requested'
    check (status in ('requested', 'confirmed', 'part_paid', 'paid', 'completed', 'cancelled', 'declined')),
  service_id text references services(id),
  mode text not null default 'crew' check (mode in ('crew', 'gear')),
  choices jsonb not null default '{}',        -- exactly what was picked, to rebuild the price
  event_date date, start_time text, sport text, venue text, zone_id text references zones(id),
  gear_from date, gear_to date, handover text, address text,
  first_name text not null default '', last_name text not null default '', org text not null default '',
  email text not null default '', phone text not null default '',
  id_doc_path text,
  code text, subtotal numeric not null default 0, discount numeric not null default 0, total numeric not null default 0,
  cost numeric not null default 0, deposit numeric not null default 0,
  pay_plan text not null default 'full' check (pay_plan in ('full', 'split')),
  paid numeric not null default 0,
  notes text not null default '', admin_notes text not null default '',
  created_at timestamptz not null default now(),
  confirmed_at timestamptz, cancelled_at timestamptz
);
create index on public.bookings (status, created_at desc);
create index on public.bookings (event_date);

create table public.booking_lines (
  id bigint generated always as identity primary key,
  booking_id uuid not null references bookings(id) on delete cascade,
  label text not null, amount numeric not null, sort int not null default 0
);

-- gear held against a booking for its dates; drives stock checks
create table public.gear_holds (
  id bigint generated always as identity primary key,
  booking_id uuid not null references bookings(id) on delete cascade,
  gear_id text not null references gear(id),
  qty int not null, date_from date not null, date_to date not null
);

-- crew allocated to a booking
create table public.assignments (
  id bigint generated always as identity primary key,
  booking_id uuid not null references bookings(id) on delete cascade,
  role_id text not null references roles(id),
  staff_id uuid references staff(id) on delete set null,
  day_rate numeric not null default 0,
  status text not null default 'open' check (status in ('open', 'asked', 'confirmed', 'declined')),
  created_at timestamptz not null default now()
);

create table public.payments (
  id bigint generated always as identity primary key,
  booking_id uuid not null references bookings(id) on delete cascade,
  amount numeric not null, method text not null default 'bank_transfer',
  received_on date not null default current_date, note text not null default '',
  created_at timestamptz not null default now()
);

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  number text unique not null default ('FFPS-Q-' || lpad(nextval('quote_no_seq')::text, 4, '0')),
  status text not null default 'draft' check (status in ('draft', 'sent', 'accepted', 'declined')),
  org text not null default '', attention text not null default '', email text not null default '',
  subject text not null default '', issue_date date not null default current_date, valid_until date,
  lines jsonb not null default '[]',           -- [{desc, qty, unit, cost}]
  terms jsonb not null default '[]',           -- [text]
  total numeric not null default 0, cost numeric not null default 0,
  booking_id uuid references bookings(id) on delete set null,
  created_at timestamptz not null default now(), sent_at timestamptz
);

create table public.email_log (
  id bigint generated always as identity primary key,
  to_email text not null, subject text not null, kind text not null,
  booking_id uuid, quote_id uuid, ok boolean not null default true, error text,
  created_at timestamptz not null default now()
);

-- ---------- row level security ----------
do $$ declare t text; begin
  foreach t in array array['staff','role_groups','roles','staff_roles','settings','zones','services','packages','extras','gear','partner_codes',
                            'bookings','booking_lines','gear_holds','assignments','payments','quotes','email_log'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy admin_all on public.%I for all using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
  foreach t in array array['zones','services','packages','extras','gear','role_groups','roles'] loop
    execute format('create policy public_read on public.%I for select using (true)', t);
  end loop;
end $$;

-- public settings only (bank details and contact), never anything secret
create policy public_read_settings on public.settings for select using (key like 'public_%');
-- staff can read their own row
create policy own_staff on public.staff for select using (user_id = auth.uid());

-- stock left for each item over a date range (public, numbers only)
create or replace function public.gear_free(p_from date, p_to date)
returns table (gear_id text, free int)
language sql stable security definer set search_path = public as $$
  select g.id, g.units - coalesce((
    select max(used) from (
      select d::date as day, sum(h.qty) as used
        from gear_holds h join bookings b on b.id = h.booking_id
        cross join generate_series(greatest(h.date_from, p_from), least(h.date_to, p_to), interval '1 day') d
       where h.gear_id = g.id and b.status not in ('cancelled', 'declined')
         and h.date_from <= p_to and h.date_to >= p_from
       group by d) x), 0)::int
  from gear g where g.active;
$$;
grant execute on function public.gear_free(date, date) to anon, authenticated;
grant execute on function public.claim_staff() to authenticated;

-- ID documents for gear rental: private bucket, written by the api function only
insert into storage.buckets (id, name, public) values ('id-docs', 'id-docs', false) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('site', 'site', true) on conflict do nothing;
create policy admin_read_ids on storage.objects for select using (bucket_id = 'id-docs' and public.is_admin());
create policy admin_site on storage.objects for all using (bucket_id = 'site' and public.is_admin()) with check (bucket_id = 'site' and public.is_admin());
