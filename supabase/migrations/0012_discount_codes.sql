-- Discount codes: percentage or fixed AED, limited to services, minimum spend, dates, total uses and one use per client.
alter table partner_codes add column if not exists kind text not null default 'pct';
alter table partner_codes drop constraint if exists partner_codes_kind_check;
alter table partner_codes add constraint partner_codes_kind_check check (kind in ('pct', 'amount'));
alter table partner_codes add column if not exists amount numeric not null default 0;
alter table partner_codes add column if not exists services text[] not null default '{}';
alter table partner_codes add column if not exists min_spend numeric not null default 0;
alter table partner_codes add column if not exists starts_on date;
alter table partner_codes add column if not exists ends_on date;
alter table partner_codes add column if not exists max_uses int;
alter table partner_codes add column if not exists once_per_client boolean not null default false;
create index if not exists bookings_code_idx on bookings (code);
