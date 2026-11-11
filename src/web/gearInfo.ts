// What is in each kit and what each single item does. Prices, deposits and stock come live from the gear table.
export type KitInfo = { best: string; inCase: [string, string][]; supply: string };
export const KITS: Record<string, KitInfo> = {
  kit1: { best: "One camera on one match, streamed and recorded.",
    inCase: [["1", "Sony Z200 4K camcorder, spare batteries and charger"], ["1", "Video tripod with fluid head"], ["1", "YoloBox Ultra to stream, record and add a scoreboard"],
      ["1", "DJI Mic 3 set: 2 transmitters and a receiver"], ["1", "Carry bag with HDMI and power cables"]],
    supply: "Internet: a data SIM in the YoloBox, venue wifi or a network cable." },
  kit3: { best: "Three angles of one pitch, switched live, with commentary.",
    inCase: [["3", "OBSBOT Tail 2 4K auto-tracking cameras"], ["3", "Tripods"], ["1", "YoloBox Extreme to switch, stream and record"],
      ["1", "RODECaster Pro II commentary mixer"], ["2", "Broadcast headsets with boom mics"], ["1", "Cables and carry cases"]],
    supply: "Internet, and power at the commentary table." },
  vmix: { best: "Bigger events with replays, graphics and several cameras.",
    inCase: [["1", "Production PC with vMix, licensed"], ["1", "Multi-camera capture card"], ["2", "Monitors"],
      ["1", "Control surface for switching and replays"], ["1", "Flight case with cables"]],
    supply: "A vMix operator, or add ours. Wired internet is best." },
  podk: { best: "Sound and light for a podcast with up to 4 voices, in any room.",
    inCase: [["4", "Shure MV7+ microphones with desk arms"], ["1", "Mixer that records every voice on its own track"], ["2", "Lights with stands"],
      ["1", "Batteries, so no wall power is needed"]],
    supply: "Your cameras, or add our Sony Z200 or OBSBOT Tail 2." },
};
export type Cat = { id: string; name: string; icon: "cam" | "live" | "mic" | "tripod"; items: { id: string; spec: string }[] };
export const CATS: Cat[] = [
  { id: "cam", name: "Cameras", icon: "cam", items: [
    { id: "z200", spec: "4K, 20x optical zoom, XLR audio inputs. Follows play from one spot." },
    { id: "tail2", spec: "Wireless 4K camera that pans, tilts and tracks players on its own." }] },
  { id: "stream", name: "Streaming and switching", icon: "live", items: [
    { id: "yolou", spec: "8-inch touchscreen. Switches cameras, adds scores and logos, streams and records. SIM slot for 4G." },
    { id: "yoloe", spec: "For multi-camera shows. Switches several cameras, adds graphics, streams and records." }] },
  { id: "audio", name: "Audio and commentary", icon: "mic", items: [
    { id: "djimic", spec: "2 clip-on transmitters and a receiver. Each transmitter records a backup." },
    { id: "rode", spec: "4 microphone inputs, a track per voice, records to SD card." },
    { id: "hset", spec: "Closed headphones with a boom mic, for commentators." }] },
  { id: "support", name: "Support", icon: "tripod", items: [
    { id: "tripod", spec: "Fluid head for smooth pans. Matched to the Sony Z200." }] },
];
