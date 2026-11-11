-- Review fixes: clearer, realistic editing prices, video by type, national commentator, plain package names and exact deliverables.

-- Podcast editing
update extras set price_2h = 750, price_day = 750, cost_2h = 375, cost_day = 375,
  strap = 'Up to 60 minutes. Mistakes cut, noise removed, levels and loudness set for Spotify and Apple. MP3 and WAV in 3 working days.' where id = 'pod-e1';
update extras set price_2h = 1500, price_day = 1500, cost_2h = 750, cost_day = 750,
  strap = 'Up to 60 minutes. Cut between every camera, colour corrected, the audio edit, names on screen, 1 round of changes. 5 working days.' where id = 'pod-e2';
update extras set strap = 'Every camera, every mic track, the program cut and a mixed audio file, within 48 hours' where id = 'pod-e0';
update extras set strap = '5 vertical clips of 30 to 60 seconds, captioned' where id = 'pod-x2';
update extras set name = 'Live podcast', strap = 'Streamed to YouTube and Facebook as you record, switched live by our producer' where id = 'pod-a0';

-- Video: priced by type of video
update extras set price_2h = 1500, price_day = 1500, cost_2h = 750, cost_day = 750,
  strap = '2 to 3 minutes of the best moments, with music and titles. 1 round of changes. 5 working days.' where id = 'video-e1';
update extras set price_2h = 3500, price_day = 3500, cost_2h = 1750, cost_day = 1750 where id = 'video-e3';
update extras set sort = 10 where id = 'video-e2';
update extras set sort = 11 where id = 'video-e3';
insert into extras(id,service_id,kind,name,strap,img,price_2h,price_day,cost_2h,cost_day,per_crew_hour,adds_crew,pick_group,sort) values
 ('video-e4','video','edit_level','Interviews','3 interviews, each edited to 1 to 2 minutes with names on screen, widescreen and vertical. 5 working days.','/img/b-8f0ec58048090ca3eb10fb0297b161d4.jpg',900,900,450,450,false,0,null,2),
 ('video-e5','video','edit_level','Social clips','5 vertical clips of 15 to 30 seconds, captioned, sized for Reels, TikTok and Shorts. 48 hours.','/img/fans.jpg',600,600,300,300,false,0,null,3),
 ('video-e6','video','edit_level','Live stories','10+ stories posted during the event and 2 reels the same day, from your account or sent to you to post.','/img/flag.jpg',1000,1000,500,500,false,0,null,4);
update extras set strap = 'Up to 3 people, lit and miked, in front of your logo' where id = 'video-a0';

-- Plain package names and exact deliverables
update packages set name = 'Single-camera set-up' where id = 'live-one';
update packages set name = '3-camera set-up', items = jsonb_set(items, '{3}', '{"t":"Commentary desk","d":"Mixer and 2 headsets for your commentators. Commentators are booked separately."}') where id = 'live-three';
update packages set name = 'Podcast set-up' where id = 'pod-pod';
update packages set name = 'Videographer' where id = 'video-video';
update packages set name = 'Photographer', items = '[{"t":"Pro sports photographer","d":"On site the whole booking."},{"t":"Action and atmosphere","d":"The plays, the crowd and the celebrations."},{"t":"150+ edited photos","d":"For up to 2 hours. 400+ for a full day. Colour and light done by hand."},{"t":"Online gallery","d":"Private link within 48 hours to view, download and share."},{"t":"Full resolution","d":"For print and social, yours to use anywhere."}]'::jsonb where id = 'photo-photo';
update extras set strap = 'A team photo and lit portraits of up to 25 players' where id = 'photo-a1';

-- National commentator rate
insert into roles(id, group_id, name, client_day, cost_day, sort, active) values ('national-commentator', 'talent', 'Commentator, national level', 8500, 5000, 29, true);
insert into service_roles(service_id, role_id, sort) values ('live', 'national-commentator', 29);
update extras set name = 'Interview set-up' where id = 'video-a0';
