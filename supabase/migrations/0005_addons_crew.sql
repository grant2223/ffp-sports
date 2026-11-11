-- New equipment and back-up add-ons, crew roles bookable per service, and role costs kept private.

-- Equipment and back-ups: a flat price per booking (per match on a season).
insert into extras(id,service_id,kind,name,strap,img,price_2h,price_day,cost_2h,cost_day,per_crew_hour,adds_crew,pick_group,sort) values
 ('live-a6','live','addon','vMix production system','Replays, full graphics and more camera inputs','',1950,1950,600,600,false,0,null,6),
 ('live-a7','live','addon','Broadcast camera upgrade','Sony Z200 with 20x zoom in place of a wireless camera','',750,750,250,250,false,0,null,7),
 ('live-a8','live','addon','Extra wireless camera','OBSBOT Tail 2 that tracks play on its own','',350,350,120,120,false,0,null,8),
 ('live-a9','live','addon','Backup internet','A second 4G connection on a different network','',300,300,120,120,false,0,null,9),
 ('live-a10','live','addon','Backup power','Battery that keeps the stream running if power drops','',250,250,80,80,false,0,null,10),
 ('live-a11','live','addon','Backup recording','Every camera recorded separately on site','',400,400,120,120,false,0,null,11),
 ('pod-a2','pod','addon','4th camera','OBSBOT Tail 2 that follows whoever is speaking','',350,350,120,120,false,0,null,2),
 ('pod-a3','pod','addon','Wireless mics','DJI Mic 3 set for a guest who moves around','',200,200,70,70,false,0,null,3);

-- Crew is now booked from the roles list, so these fixed crew add-ons are retired.
update extras set active = false where id in ('live-a0','live-a1','live-a2','live-a3');

-- Which crew roles each service offers. Edit in the admin, no code change needed.
create table public.service_roles (
  service_id text not null references services(id) on delete cascade,
  role_id text not null references roles(id) on delete cascade,
  sort int not null default 0,
  primary key (service_id, role_id)
);
alter table public.service_roles enable row level security;
create policy public_read on public.service_roles for select using (true);
create policy admin_all on public.service_roles for all using (is_admin()) with check (is_admin());

insert into service_roles(service_id, role_id, sort)
select 'live', r.id, r.sort from roles r where r.id in ('producer','director','production-manager','floor-manager','runner',
  'camera-operator','handheld-or-rf-camera-operator','jib-or-crane-operator','gimbal-or-steadicam-operator','drone-pilot','camera-assistant',
  'technical-director-vision-mixer','graphics-operator','stats-operator','scoreboard-operator','replay-operator','highlights-editor',
  'streaming-engineer','broadcast-engineer','network-and-it-technician','rf-technician','audio-engineer-a1','audio-assistant-a2',
  'commentator','co-commentator-or-analyst','presenter-or-host','mc','reporter-or-sideline-interviewer','stadium-announcer','hype-host-or-dj',
  'photographer','social-media-producer','lighting-technician','rigger','driver','gear-technician');
insert into service_roles(service_id, role_id, sort)
select 'pod', r.id, r.sort from roles r where r.id in ('producer','director','runner','camera-operator','handheld-or-rf-camera-operator',
  'gimbal-or-steadicam-operator','camera-assistant','technical-director-vision-mixer','graphics-operator','streaming-engineer',
  'audio-engineer-a1','audio-assistant-a2','presenter-or-host','co-commentator-or-analyst','photographer','videographer',
  'social-media-producer','content-creator','lighting-technician','gear-technician');

-- Role costs are private: the public reads client rates through this view; the roles table is admin only.
drop policy if exists public_read on public.roles;
create view public.role_rates as select id, group_id, name, client_day, sort, active from public.roles;
grant select on public.role_rates to anon, authenticated;
