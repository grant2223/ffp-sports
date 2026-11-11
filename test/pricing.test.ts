import { readFileSync } from "node:fs";
import { price, type Catalogue, type Choices } from "../src/lib/pricing";
const F = JSON.parse(readFileSync(new URL("./fixtures.json", import.meta.url), "utf8"));
const settings: Record<string, string> = {}; for (const r of F.settings) settings[r.key] = r.value;
const cat: Catalogue = { services: F.services, packages: F.packages, extras: F.extras, gear: F.gear, zones: F.zones, settings };
const base: Choices = { svc: "", mode: "crew", pk: "", dur: "2h", on: [], edit: "", eon: [], qty: {}, from: "", to: "", hand: "pickup", setup: false, zone: "dubai" };
const cases: [string, Partial<Choices>, number, number?][] = [
  ["Live 3 cams day + national commentator, Abu Dhabi", { svc: "live", pk: "live-three", dur: "day", on: ["live-a3"], zone: "abudhabi" }, 20000],
  ["Gear 2 Z200 + tripod 3 days, setup, Dubai delivery", { svc: "gear", mode: "gear", qty: { z200: 2, tripod: 1 }, from: "2026-11-13", to: "2026-11-16", setup: true, hand: "delivery" }, 5620, 1000],
  ["Video day + highlights and full film + opener + sponsor ads", { svc: "video", pk: "video-video", dur: "day", edit: "video-e3", eon: ["video-x0", "video-x2"] }, 8800],
  ["Podcast 2h + full episode + social clips + publish", { svc: "pod", pk: "pod-pod", dur: "2h", edit: "pod-e2", eon: ["pod-x2", "pod-x6"] }, 3900],
  ["Kirby: 8 Z200 + 8 tripods 1 day, Dubai drop-off/pick-up", { svc: "gear", mode: "gear", qty: { z200: 8, tripod: 8 }, from: "2026-11-13", to: "2026-11-14", hand: "delivery" }, 0],
  ["Two commentators picked, only one counts", { svc: "live", pk: "live-one", dur: "2h", on: ["live-a2", "live-a3"] }, 3500],
  ["Raw footage with stray editing extras charges nothing extra", { svc: "video", pk: "video-video", dur: "2h", edit: "video-e0", eon: ["video-x0"] }, 2500],
];
let fail = 0;
for (const [n, c, want, dep] of cases) {
  const p = price(cat, { ...base, ...c });
  const okk = want === 0 || Math.round(p.total) === want; const okd = dep === undefined || p.deposit === dep;
  if (!okk || !okd) fail++;
  console.log((okk && okd ? "PASS " : "FAIL ") + n + " => " + Math.round(p.total) + (dep !== undefined ? " deposit " + p.deposit : "") + " | " + p.lines.map((l) => `${l.label} ${Math.round(l.v)}`).join("; "));
}
process.exit(fail ? 1 : 0);
