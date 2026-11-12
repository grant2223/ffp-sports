-- Gear: full specifics per item, editable in admin. No deposits: the client leaves their Emirates ID at pick-up or delivery
-- and pays for loss or damage.
alter table gear add column if not exists specs text[] not null default '{}';
alter table gear add column if not exists best text not null default '';
alter table gear add column if not exists supply text not null default '';
alter table gear alter column deposit set default 0;
update gear set deposit = 0;

update gear set strap = 'Sony Z200 4K camera, YoloBox Ultra streamer, DJI Mic 3, tripod',
  best = 'One camera on one match: streamed live with a scoreboard, and recorded.',
  supply = 'Internet: a 4G data SIM (nano-SIM) in the YoloBox, venue wifi or a network cable. A YouTube, Facebook or other streaming account.',
  specs = array[
    '1 × Sony PXW-Z200 4K camcorder: 1-inch sensor, 20x optical zoom (24–480 mm), 2 XLR audio inputs',
    '1 × SmallRig AD-01 tripod: fluid head, 85–186 cm working height, holds up to 8 kg',
    '1 × YoloBox Ultra: 8-inch touchscreen, streams and records, adds a live scoreboard and your logo',
    '1 × DJI Mic 3 set: 2 clip-on transmitters and a receiver, up to 400 m range',
    '2 camera batteries (standard Sony and a larger SWIT), charger, HDMI cable, power cables and carry bag'] where id = 'kit1';

update gear set strap = '3 auto-tracking 4K cameras, YoloBox Extreme, commentary for 2',
  best = 'Three angles of one pitch, switched live, with 2 commentators.',
  supply = 'Internet, and a power point at the commentary table.',
  specs = array[
    '3 × OBSBOT Tail 2 4K cameras: follow play on their own with AI tracking, 5x optical zoom',
    '3 × Hollyland Pyro S wireless video sets: each camera sends to the switcher without a cable, up to 400 m line of sight, 4K 30 fps, 50 ms delay',
    '3 × SmallRig AD-01 tripods',
    '1 × YoloBox Extreme: 11.2-inch touchscreen, switches the 3 cameras, streams and records each camera separately',
    '1 × RODECaster Pro II mixer: records each commentator on their own track',
    '2 × Audio-Technica BPHS1 broadcast headsets: closed-back headphones, boom mic',
    'NP-F970 batteries for the wireless sets, cables, power and carry cases'] where id = 'kit3';

update gear set strap = 'i9 vMix PC, 4 SDI camera inputs, 2 monitors, control surface',
  best = 'Larger events: several cameras, instant replays and full graphics.',
  supply = 'Your cameras, or add ours. A vMix operator, or add ours. Wired internet.',
  specs = array[
    '1 × Production PC: Intel Core i9, 64 GB RAM, latest licensed vMix for switching, instant replay, graphics, recording and streaming',
    '1 × Blackmagic DeckLink capture card: 4 SDI connections, each set as a camera input or an output',
    '2 × Monitors: one for the program, one for the multiview',
    '1 × Control surface for switching and replays',
    'Flight case with power and video cables'] where id = 'vmix';

update gear set strap = '4 Shure MV7+ mics, RODECaster Pro II, 4 Neewer lights with softboxes',
  best = 'Sound and light for a podcast with up to 4 voices, in any room.',
  supply = 'One power point for the mixer. Your cameras, or add our Sony Z200 or OBSBOT Tail 2.',
  specs = array[
    '4 × Shure MV7+ dynamic microphones on desk arms',
    '1 × RODECaster Pro II mixer: 4 mic inputs, 4 headphone outputs, records each voice on its own track',
    '4 × Neewer MS150B 130 W bi-colour LED lights (2700–6500 K) with stands',
    '4 × Neewer 50 cm octagonal softboxes and 1 × Neewer lantern softbox',
    'Lights run on NP-F970 batteries, 2 per light, so they need no wall power',
    'Cables and carry cases'] where id = 'podk';

update gear set strap = '4K broadcast camcorder, 1-inch sensor, 20x zoom', specs = array[
    '1-inch stacked sensor: 4K up to 60 fps, slow motion at 4K 120 fps',
    '20x optical zoom, 24–480 mm (30x in 4K with Clear Image Zoom)',
    'AI autofocus that locks on to players',
    '2 XLR audio inputs and a built-in stereo mic',
    '12G-SDI and HDMI outputs, for a switcher or a monitor',
    'Records to 2 card slots (CFexpress Type A or SD)',
    '2 batteries (standard Sony and a larger SWIT), charger and lens hood'] where id = 'z200';

update gear set strap = 'Streams, switches and records up to 4 cameras, 4G built in', specs = array[
    '8-inch touchscreen, no laptop needed',
    '4 HDMI inputs and 3 USB inputs',
    'Streams to YouTube, Facebook or any RTMP or SRT link, up to 4K',
    'Internet by 4G data SIM (nano-SIM), wifi or network cable',
    'Records the program and each camera separately to SD card',
    'Live scoreboard, logos and name captions',
    'Built-in battery, up to 8 hours'] where id = 'yolou';

update gear set strap = 'Streams, switches and records up to 8 cameras, 11.2-inch screen', specs = array[
    '11.2-inch OLED touchscreen, bright enough for outdoor use',
    '8 HDMI inputs (4 at 4K 60 fps), plus USB and network cameras',
    '2 HDMI outputs, for a program screen and a multiview screen',
    'Streams up to 4K 60 fps to YouTube, Facebook or any RTMP or SRT link',
    'Records each camera separately: 4 at 4K or 6 at 1080p',
    'Internet by 4G data SIM, wifi or network cable',
    'Built-in battery: up to 10 hours with 1 camera, about 3 hours with 5 or 6'] where id = 'yoloe';

update gear set strap = '4K camera that follows play on its own', specs = array[
    '1/1.5-inch 50 MP sensor: 4K 60 fps, or 1080p 120 fps',
    '5x optical zoom, 12x hybrid',
    'AI tracking locks on to one player or follows the group',
    'Pans, tilts and rotates 90° for vertical video',
    'HDMI, 3G-SDI, USB-C and network outputs',
    'Controlled from a phone or tablet app'] where id = 'tail2';

update gear set strap = '2 clip-on wireless mics and a receiver, 400 m range', specs = array[
    '2 transmitters, 1 receiver and a charging case',
    'Range up to 400 m',
    'Each transmitter records its own backup (32-bit float, 32 GB)',
    'Battery: 8 hours per transmitter, 10 hours receiver, 28 hours with the case',
    'Connects to a camera by 3.5 mm cable, or to a phone by USB-C'] where id = 'djimic';

update gear set strap = '4-mic audio mixer, records each voice on its own track', specs = array[
    '4 mic inputs (XLR or jack) with low-noise preamps',
    '4 headphone outputs, each with its own volume',
    'Records every input on its own track, plus the mix, to microSD, USB drive or a computer',
    'Bluetooth for a guest on a phone call',
    '8 programmable pads for music, stings and sound effects',
    '5.5-inch touchscreen'] where id = 'rode';

update gear set strap = 'Audio-Technica BPHS1: closed headphones with a boom mic, for commentators', specs = array[
    'Closed-back ear cups block crowd noise',
    'Cardioid dynamic boom mic picks up the voice, not the crowd',
    'Boom fits on the left or right side',
    'XLR mic and 1/4-inch headphone plugs, for the RODECaster Pro II or any mixer',
    '264 g, padded headband for a full match'] where id = 'hset';

update gear set strap = 'SmallRig AD-01: fluid head, up to 186 cm, holds 8 kg', specs = array[
    'Fluid head: 360° pan and smooth tilt for following play',
    'Working height 85–186 cm',
    'Holds up to 8 kg, enough for the Sony Z200 with mic and battery',
    'Quick-release plate, 75 mm bowl and bubble level',
    'Carry bag'] where id = 'tripod';

update gear set detail = array_to_string(specs, '. ') where kind = 'kit';
