// Outcome packages on each service page. Prices come from the current rates (see pricing.ts):
// each package is a set of booking choices, so the booking total matches the card.
export type Get = { v: string; t: string };
export type Visual =
  | { kind: "film"; img: string; dur: string }
  | { kind: "film+clips"; img: string; dur: string; clips: string[] }
  | { kind: "two-films"; imgs: [string, string]; durs: [string, string] }
  | { kind: "gallery"; imgs: string[]; more: string }
  | { kind: "gallery+team"; imgs: string[]; team: string; more: string }
  | { kind: "stream"; img: string; bug?: boolean; cams?: string[] }
  | { kind: "files"; img: string }
  | { kind: "interview"; img: string; name: string; role: string }
  | { kind: "clips"; imgs: string[] }
  | { kind: "stories"; imgs: string[] }
  | { kind: "season"; imgs: string[] };
export type Pack = { id: string; name: string; best: string; price: number; per: string; alt?: string; visual: Visual; gets: Get[]; popular?: boolean };

export const PACKS: Record<string, Pack[]> = {
  live: [
    { id: "live-one", name: "Single-camera set-up", best: "One match or court, streamed live with the score on screen.", price: 2500, per: "up to 2 hours", alt: "Full day AED 5,000",
      visual: { kind: "stream", img: "/img/gfxplayer.jpg" },
      gets: [{ v: "Crew", t: "1 operator who sets up, runs the stream and packs down" }, { v: "Camera", t: "Sony Z200 with 20x zoom, following play from one spot" },
        { v: "Live", t: "On YouTube, Facebook and your website at once, with your logo" }, { v: "Score", t: "Scoreboard with score, clock and team names" },
        { v: "24 hrs", t: "Full recording and viewer report" }] },
    { id: "live-three", name: "3-camera set-up", best: "Finals and big matches, cut live between three angles.", price: 5000, per: "up to 2 hours", alt: "Full day AED 10,000", popular: true,
      visual: { kind: "stream", img: "/img/flag.jpg", bug: true, cams: ["/img/flag.jpg", "/img/fans.jpg", "/img/gfxplayer.jpg"] },
      gets: [{ v: "Crew", t: "2 operators: one directs, one runs cameras and graphics" }, { v: "3", t: "Wireless 4K cameras: a wide, a close-up and a second angle" },
        { v: "Desk", t: "Commentary desk with mixer and 2 headsets, for your commentators" }, { v: "Score", t: "Live results pulled from your competition software" },
        { v: "24 hrs", t: "Full recording and viewer report" }] },
  ],
  video: [
    { id: "video-highlights", name: "Highlights film", best: "The best moments of your match or event, cut to music.", price: 4000, per: "2 hours filming",
      visual: { kind: "film", img: "/img/flag.jpg", dur: "2:30" },
      gets: [{ v: "2–3 min", t: "Highlights film with music and titles" }, { v: "4K", t: "All raw footage, to keep and reuse" },
        { v: "1", t: "Round of changes after you watch it" }, { v: "5 days", t: "Delivered by download link" }] },
    { id: "video-interviews", name: "Interviews", best: "Players, coaches and guests on camera, ready to share.", price: 3900, per: "2 hours filming",
      visual: { kind: "interview", img: "/img/b-8f0ec58048090ca3eb10fb0297b161d4.jpg", name: "Player name", role: "Captain" },
      gets: [{ v: "3", t: "Interviews, lit and miked, in front of your logo" }, { v: "1–2 min", t: "Each one edited, with names on screen" },
        { v: "16:9", t: "Widescreen, plus a vertical version of each" }, { v: "5 days", t: "Delivered by download link" }] },
    { id: "video-social", name: "Social clips", best: "Short vertical clips, made to post.", price: 3100, per: "2 hours filming", popular: true,
      visual: { kind: "clips", imgs: ["/img/flag.jpg", "/img/fans.jpg", "/img/b-c0166948473fd096d294db13c76767bf.jpg", "/img/race.jpg"] },
      gets: [{ v: "5", t: "Vertical clips of 15 to 30 seconds" }, { v: "Captions", t: "Burned in, so they play on mute" },
        { v: "9:16", t: "Sized for Reels, TikTok and Shorts" }, { v: "48 hrs", t: "Delivered by download link" }] },
    { id: "video-stories", name: "Live stories", best: "Your event on Instagram while it happens.", price: 3500, per: "2 hours on site",
      visual: { kind: "stories", imgs: ["/img/fans.jpg", "/img/flag.jpg", "/img/race.jpg"] },
      gets: [{ v: "10+", t: "Stories posted during the event" }, { v: "2", t: "Reels posted the same day" },
        { v: "Live", t: "Posted from your account, or sent to you to post" }, { v: "4K", t: "All raw footage afterwards" }] },
  ],
  photo: [
    { id: "photo-match", name: "Match photos", best: "Every key moment of one match.", price: 2500, per: "2 hours on site",
      visual: { kind: "gallery", imgs: ["/img/flag.jpg", "/img/race.jpg", "/img/fans.jpg", "/img/b-c0166948473fd096d294db13c76767bf.jpg", "/img/flag.jpg"], more: "+150" },
      gets: [{ v: "150+", t: "Edited action photos, in full resolution" }, { v: "Link", t: "Private online gallery to view, download and share" },
        { v: "48 hrs", t: "Gallery sent to you after the match" }] },
    { id: "photo-team", name: "Match and team photos", best: "Action from the match, plus a portrait of every player.", price: 3600, per: "2 hours on site", popular: true,
      visual: { kind: "gallery+team", imgs: ["/img/b-8f0ec58048090ca3eb10fb0297b161d4.jpg", "/img/flag.jpg", "/img/fans.jpg"], team: "/img/race.jpg", more: "+150" },
      gets: [{ v: "150+", t: "Edited action photos, in full resolution" }, { v: "Squad", t: "A team photo and portraits of up to 25 players" },
        { v: "30", t: "Best photos the same evening, for match-night posts" }, { v: "48 hrs", t: "Everything in a private online gallery" }] },
    { id: "photo-tournament", name: "Tournament day", best: "Every game, every podium, all day.", price: 5400, per: "full day on site",
      visual: { kind: "gallery", imgs: ["/img/fans.jpg", "/img/b-c0166948473fd096d294db13c76767bf.jpg", "/img/flag.jpg", "/img/race.jpg", "/img/b-c0166948473fd096d294db13c76767bf.jpg"], more: "+400" },
      gets: [{ v: "400+", t: "Edited photos of the games, podiums and presentations" }, { v: "30", t: "Best photos the same evening, for results posts" },
        { v: "48 hrs", t: "Everything in a private online gallery" }] },
  ],
  pod: [
    { id: "pod-record", name: "Recorded podcast", best: "We bring the full set to your venue and record the episode.", price: 2500, per: "up to 2 hours", alt: "Full day AED 4,500",
      visual: { kind: "files", img: "/img/pod.jpg" },
      gets: [{ v: "Set", t: "3 cameras, 4 Shure MV7+ mics and lights, set up and packed away" }, { v: "Cut", t: "Program cut: the switched multi-camera version" },
        { v: "3", t: "Recordings, one from each camera, in 4K" }, { v: "4", t: "Separate audio files, one per mic (WAV)" },
        { v: "Mix", t: "Mixed audio file, all voices balanced (WAV and MP3)" }, { v: "48 hrs", t: "Every file by download link" }] },
    { id: "pod-live", name: "Live podcast", best: "The same set, streamed live while you record.", price: 3300, per: "up to 2 hours", alt: "Full day AED 5,300", popular: true,
      visual: { kind: "stream", img: "/img/pod.jpg" },
      gets: [{ v: "Live", t: "On YouTube and Facebook as you record, switched live by our producer" }, { v: "Set", t: "3 cameras, 4 Shure MV7+ mics and lights, set up and packed away" },
        { v: "Cut", t: "Program cut: the switched version of the stream" }, { v: "3", t: "Recordings, one from each camera, in 4K" },
        { v: "Audio", t: "Separate audio per mic (WAV), plus a mixed file (WAV and MP3)" }, { v: "48 hrs", t: "Every file by download link" }] },
  ],
};
// Podcast extras, grouped. Prices match the booking engine (gear day rates, crew rates, editing prices).
export type Extra = { name: string; d: string; price: string };
export type ExtraGroup = { name: string; img: string; pos?: string; items: Extra[] };
export const LIVE_EXTRAS: ExtraGroup[] = [
  { name: "Better equipment", img: "/img/stadiumcam.jpg", items: [
    { name: "vMix production system", d: "Replays, full graphics and more camera inputs", price: "AED 1,950" },
    { name: "Broadcast camera upgrade", d: "Sony Z200 with 20x zoom in place of a wireless camera", price: "AED 750" },
    { name: "Extra wireless camera", d: "OBSBOT Tail 2 that tracks play on its own", price: "AED 350" }] },
  { name: "Back-ups", img: "/img/gymcam.jpg", items: [
    { name: "Backup internet", d: "A second 4G connection on a different network", price: "AED 300" },
    { name: "Backup power", d: "Battery that keeps the stream running if power drops", price: "AED 250" },
    { name: "Backup recording", d: "Every camera recorded separately on site", price: "AED 400" }] },
  { name: "Content", img: "/img/fans.jpg", items: [
    { name: "Highlights reel", d: "60 to 90 seconds for Instagram and TikTok, in 48 hours", price: "AED 600" }] },
];
export const VIDEO_EXTRAS: ExtraGroup[] = [
  { name: "Filming", img: "/img/stadiumcam.jpg", items: [
    { name: "Second videographer", d: "Two angles on every moment", price: "AED 2,500" },
    { name: "Extra hour", d: "More filming time, per crew member", price: "AED 750" }] },
  { name: "Editing", img: "/img/desk.jpg", items: [
    { name: "Full event film", d: "8 to 12 minutes on the whole day, added to your highlights film. 7 days", price: "AED 2,000" },
    { name: "Branded opener", d: "Your logo and title animated at the start", price: "AED 400" },
    { name: "Sponsor edits", d: "Sponsor ads or logo stings cut in", price: "AED 400" },
    { name: "Subtitles", d: "Captions burned in, plays on mute", price: "AED 300" },
    { name: "Extra round of changes", d: "One more round after your review", price: "AED 250" },
    { name: "Next-day delivery", d: "First edit the day after filming", price: "AED 500" }] },
];
export const POD_EXTRAS: ExtraGroup[] = [
  { name: "Extra gear", img: "/img/pod.jpg", items: [
    { name: "4th camera", d: "OBSBOT Tail 2 that follows whoever is speaking", price: "AED 350" },
    { name: "Wireless mics", d: "DJI Mic 3 set for a guest who moves around", price: "AED 200" }] },
  { name: "Editing and publishing", img: "/img/desk.jpg", items: [
    { name: "Audio edit", d: "Up to 60 minutes. Mistakes cut, noise removed, loudness set for Spotify and Apple. 3 working days", price: "AED 750" },
    { name: "Full episode edit", d: "Up to 60 minutes. Cut between every camera, colour, the audio edit, names on screen. 5 working days", price: "AED 1,500" },
    { name: "Social clips", d: "5 vertical clips of 30 to 60 seconds, captioned", price: "AED 500" },
    { name: "Intro and outro", d: "Your show opener and sign-off", price: "AED 400" },
    { name: "Subtitles", d: "Captions burned into the video", price: "AED 300" },
    { name: "Thumbnail", d: "Designed for YouTube and Spotify", price: "AED 200" },
    { name: "We publish it", d: "Uploaded to Spotify, Apple Podcasts and YouTube", price: "AED 300" }] },
];

// The booking choices each package opens with. Totals come from the same pricing engine as the booking.
export const PRESETS: Record<string, { svc: string; pk: string; dur: "2h" | "day" | "season"; on?: string[]; edit?: string; eon?: string[] }> = {
  "live-one": { svc: "live", pk: "live-one", dur: "2h" },
  "live-three": { svc: "live", pk: "live-three", dur: "2h" },
  "video-highlights": { svc: "video", pk: "video-video", dur: "2h", edit: "video-e1" },
  "video-interviews": { svc: "video", pk: "video-video", dur: "2h", on: ["video-a0"], edit: "video-e4" },
  "video-social": { svc: "video", pk: "video-video", dur: "2h", edit: "video-e5" },
  "video-stories": { svc: "video", pk: "video-video", dur: "2h", edit: "video-e6" },
  "photo-match": { svc: "photo", pk: "photo-photo", dur: "2h" },
  "photo-team": { svc: "photo", pk: "photo-photo", dur: "2h", on: ["photo-a1", "photo-a0"] },
  "photo-tournament": { svc: "photo", pk: "photo-photo", dur: "day", on: ["photo-a0"] },
  "pod-record": { svc: "pod", pk: "pod-pod", dur: "2h" },
  "pod-live": { svc: "pod", pk: "pod-pod", dur: "2h", on: ["pod-a0"] },
};

