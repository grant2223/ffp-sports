-- Half day (up to 4 hours): its own price and cost on packages and on add-ons that change with the length of the booking.
alter table packages add column if not exists price_half numeric;
alter table packages add column if not exists cost_half numeric;
alter table extras add column if not exists price_half numeric;
alter table extras add column if not exists cost_half numeric;
update packages set price_half = 3500, cost_half = round((cost_2h + cost_day) / 2) where id in ('video-video', 'photo-photo', 'pod-pod');
update packages set price_half = 5000, cost_half = round((cost_2h + cost_day) / 2) where id = 'live-one';
update packages set price_half = 11000, cost_half = round((cost_2h + cost_day) / 2) where id = 'live-three';
-- a second photographer or videographer costs the client the same as the first
update extras set price_half = 3500, cost_half = round((cost_2h + cost_day) / 2) where id in ('video-a1', 'photo-a2');
insert into settings (key, value) values ('crew_half_share', '0.7') on conflict (key) do nothing;
