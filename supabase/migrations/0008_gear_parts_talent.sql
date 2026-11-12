-- 1. Kits share physical items (one RODECaster Pro II is in two kits), so availability counts the parts.
create table public.gear_parts (
  kit_id text not null references gear(id) on delete cascade,
  item_id text not null references gear(id) on delete cascade,
  qty int not null default 1 check (qty > 0),
  primary key (kit_id, item_id)
);
alter table public.gear_parts enable row level security;
create policy public_read on public.gear_parts for select using (true);
create policy admin_all on public.gear_parts for all using (is_admin()) with check (is_admin());
insert into gear_parts(kit_id, item_id, qty) values
 ('kit1','z200',1),('kit1','yolou',1),('kit1','djimic',1),('kit1','tripod',1),
 ('kit3','tail2',3),('kit3','yoloe',1),('kit3','rode',1),('kit3','hset',2),
 ('podk','rode',1);

-- Free units per day for every item and kit. An item is used by its own holds and by the kits it is part of.
create or replace function public.gear_free(p_from date, p_to date)
returns table(gear_id text, free integer)
language sql stable security definer set search_path = public as $$
  with days as (select d::date as day from generate_series(p_from, p_to, interval '1 day') d),
  live as (
    select h.gear_id, h.qty, h.date_from, h.date_to from gear_holds h join bookings b on b.id = h.booking_id
     where b.status not in ('cancelled', 'declined') and h.date_from <= p_to and h.date_to >= p_from),
  use_by_day as (   -- direct use, plus kits counted against their parts
    select x.gid, d.day, sum(x.qty) used from days d
      join (select l.gear_id gid, l.qty, l.date_from, l.date_to from live l
            union all
            select p.item_id, l.qty * p.qty, l.date_from, l.date_to from live l join gear_parts p on p.kit_id = l.gear_id) x
        on d.day between x.date_from and x.date_to
     group by x.gid, d.day),
  own as (
    select g.id, g.units - coalesce((select max(u.used) from use_by_day u where u.gid = g.id), 0) as f from gear g where g.active)
  select o.id, (case when exists (select 1 from gear_parts p where p.kit_id = o.id)
     then least(o.f, (select min(floor(oi.f::numeric / p.qty)) from gear_parts p join own oi on oi.id = p.item_id where p.kit_id = o.id))
     else o.f end)::int
  from own o;
$$;

-- Hold gear for a booking: check every kit and every part together, so two kits that share an item can't both go out.
create or replace function public.hold_gear(p_booking uuid, p_from date, p_to date, p_items jsonb)
returns text language plpgsql security definer set search_path = public as $$
declare r record; nm text;
begin
  perform pg_advisory_xact_lock(hashtext('ffps_gear_holds'));
  for r in
    with want as (select x->>'gear_id' gid, (x->>'qty')::int q from jsonb_array_elements(p_items) x),
    need as (select gid, sum(q) q from (
               select gid, q from want
               union all select p.item_id, w.q * p.qty from want w join gear_parts p on p.kit_id = w.gid) z group by gid)
    select n.gid, n.q, coalesce(f.free, 0) free from need n left join gear_free(p_from, p_to) f on f.gear_id = n.gid
  loop
    if r.q > r.free then
      select name into nm from gear where id = r.gid;
      return 'Only ' || greatest(r.free, 0) || ' ' || coalesce(nm, 'of that item') || ' left for those dates';
    end if;
  end loop;
  insert into gear_holds (booking_id, gear_id, qty, date_from, date_to)
    select p_booking, x->>'gear_id', (x->>'qty')::int, p_from, p_to from jsonb_array_elements(p_items) x;
  return null;
end $$;
revoke execute on function public.hold_gear(uuid, date, date, jsonb) from public, anon, authenticated;

-- 2. Talent set their own day rate; FFP adds 10% to 20%.
alter table public.staff add column if not exists talent_markup numeric not null default 0.15 check (talent_markup between 0.10 and 0.20);
create view public.talent_rates as
  select s.id as staff_id, s.first_name, s.last_name, s.photo_url, r.id as role_id, r.name as role_name,
         round(sr.day_rate * (1 + s.talent_markup)) as client_day
    from staff s join staff_roles sr on sr.staff_id = s.id join roles r on r.id = sr.role_id
   where s.active and r.group_id = 'talent' and r.active and sr.day_rate > 0;
grant select on public.talent_rates to anon, authenticated;
-- Talent are booked by person now, not as a fixed-rate role.
delete from service_roles where role_id in (select id from roles where group_id = 'talent');
