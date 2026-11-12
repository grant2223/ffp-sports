-- Gear admin: categories, and kit contents as one list. A kit's "in the case" is its parts from stock
-- (qty, item, note: counted against stock when the kit is booked) followed by loose lines in gear.specs (not counted).
alter table gear add column if not exists category text not null default '';
alter table gear_parts add column if not exists note text not null default '';
alter table gear_parts add column if not exists sort int not null default 0;

update gear set category = case
  when kind = 'kit' then 'Kits'
  when id in ('z200','tail2') then 'Cameras'
  when id in ('yolou','yoloe') then 'Streaming and switching'
  when id = 'pyros' then 'Wireless video'
  when id in ('djimic','rode','hset') then 'Audio and commentary'
  when id = 'tripod' then 'Support' else category end;

-- the 3-camera kit carries 3 tripods: count them
insert into gear_parts (kit_id, item_id, qty) values ('kit3', 'tripod', 3) on conflict (kit_id, item_id) do update set qty = 3;

update gear_parts set sort = 1, note = '4K camcorder, 1-inch sensor, 20x optical zoom (24–480 mm), 2 XLR audio inputs' where kit_id = 'kit1' and item_id = 'z200';
update gear_parts set sort = 2, note = 'SmallRig AD-01, 85–186 cm working height, holds up to 8 kg' where kit_id = 'kit1' and item_id = 'tripod';
update gear_parts set sort = 3, note = '8-inch touchscreen, streams and records, adds a live scoreboard and your logo' where kit_id = 'kit1' and item_id = 'yolou';
update gear_parts set sort = 4, note = '2 clip-on transmitters and a receiver, up to 400 m range' where kit_id = 'kit1' and item_id = 'djimic';
update gear_parts set sort = 1, note = '4K cameras that follow play on their own with AI tracking, 5x optical zoom' where kit_id = 'kit3' and item_id = 'tail2';
update gear_parts set sort = 2, note = 'each camera sends to the switcher without a cable, up to 400 m line of sight, 4K 30 fps, 50 ms delay' where kit_id = 'kit3' and item_id = 'pyros';
update gear_parts set sort = 3, note = 'SmallRig AD-01' where kit_id = 'kit3' and item_id = 'tripod';
update gear_parts set sort = 4, note = '11.2-inch touchscreen, switches the 3 cameras, streams and records each camera separately' where kit_id = 'kit3' and item_id = 'yoloe';
update gear_parts set sort = 5, note = 'records each commentator on their own track' where kit_id = 'kit3' and item_id = 'rode';
update gear_parts set sort = 6, note = 'Audio-Technica BPHS1, closed-back headphones with a boom mic' where kit_id = 'kit3' and item_id = 'hset';
update gear_parts set sort = 1, note = '4 mic inputs, 4 headphone outputs, records each voice on its own track' where kit_id = 'podk' and item_id = 'rode';

-- kit specs keep only the lines that are not stock items
update gear set specs = array['2 camera batteries (standard Sony and a larger SWIT), charger, HDMI cable, power cables and carry bag'] where id = 'kit1';
update gear set specs = array['NP-F970 batteries for the wireless sets, cables, power and carry cases'] where id = 'kit3';
update gear set specs = array[
  '4 × Shure MV7+ dynamic microphones on desk arms',
  '4 × Neewer MS150B 130 W bi-colour LED lights (2700–6500 K) with stands',
  '4 × Neewer 50 cm octagonal softboxes and 1 × Neewer lantern softbox',
  'Lights run on NP-F970 batteries, 2 per light, so they need no wall power',
  'Cables and carry cases'] where id = 'podk';

-- plain-text contents of each kit, used on the booking page
update gear k set detail = concat_ws('. ',
  (select string_agg(p.qty || ' × ' || i.name || case when p.note <> '' then ': ' || p.note else '' end, '. ' order by p.sort, i.sort)
     from gear_parts p join gear i on i.id = p.item_id where p.kit_id = k.id),
  nullif(array_to_string(k.specs, '. '), ''))
where k.kind = 'kit';
