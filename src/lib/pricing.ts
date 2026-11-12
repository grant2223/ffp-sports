// One pricing engine for the booking page and the api function. Keep the two copies identical:
// src/lib/pricing.ts is the source; scripts/sync.sh copies it to supabase/functions/api/pricing.ts.

export interface Service { id: string; name: string; strap: string; img: string; gearable: boolean; season: boolean; editing: boolean; sort: number; active: boolean }
export interface Pkg { id: string; service_id: string; name: string; strap: string; img: string; crew: number; price_2h: number; price_day: number; cost_2h: number; cost_day: number; items: { t: string; d: string }[]; sort: number; active: boolean }
export interface Extra { id: string; service_id: string; kind: "addon" | "edit_level" | "edit_extra"; name: string; strap: string; img: string; price_2h: number; price_day: number; cost_2h: number; cost_day: number; per_crew_hour: boolean; adds_crew: number; pick_group: string | null; sort: number; active: boolean; details?: string[] }
export interface Gear { id: string; kind: "kit" | "item"; name: string; strap: string; detail: string; img: string; price_day: number; units: number; deposit: number; sort: number; active: boolean }
export interface Zone { id: string; name: string; travel_per_crew: number; delivery: number; sort: number }
export interface Role { id: string; group_id: string; name: string; client_day: number; cost_day?: number; sort: number; active: boolean }
export interface RoleGroup { id: string; name: string; sort: number }
export interface Talent { staff_id: string; first_name: string; last_name: string; photo_url: string | null; role_id: string; role_name: string; client_day: number; cost_day?: number }
export interface Catalogue { services: Service[]; packages: Pkg[]; extras: Extra[]; gear: Gear[]; zones: Zone[]; settings: Record<string, string>;
  roles: Role[]; roleGroups: RoleGroup[]; serviceRoles: { service_id: string; role_id: string; sort: number }[]; talent: Talent[] }
export const talentKey = (t: { staff_id: string; role_id: string }) => t.staff_id + ":" + t.role_id;

export type Dur = "2h" | "day" | "season";
export interface Choices {
  svc: string; mode: "crew" | "gear";
  pk: string; dur: Dur;
  on: string[];          // add-ons picked (extra ids)
  edit: string;          // editing level (extra id), "" for none
  eon: string[];         // editing extras
  qty: Record<string, number>;
  crewq?: Record<string, number>; // extra crew by role id
  talent?: string[];              // talent booked by person, "staff_id:role_id"
  from: string; to: string; hand: "pickup" | "delivery"; setup: boolean;
  zone: string;
}
export interface Line { label: string; v: number }
export interface Price { lines: Line[]; sub: number; cost: number; disc: number; total: number; deposit: number; crew: number; days: number; holds: { gear_id: string; qty: number }[]; split: boolean }

const num = (s: string | undefined, d: number) => (s === undefined || s === "" || isNaN(Number(s)) ? d : Number(s));

export function rentalDays(from: string, to: string): number {
  if (!from || !to) return 1;
  const a = new Date(from + "T00:00:00Z").getTime(), b = new Date(to + "T00:00:00Z").getTime();
  if (!(b >= a)) return 1;
  return Math.max(1, Math.round((b - a) / 864e5));
}

export function isGear(cat: Catalogue, c: Choices): boolean {
  const s = cat.services.find((x) => x.id === c.svc);
  return c.svc === "gear" || (!!s && s.gearable && c.mode === "gear");
}

export function price(cat: Catalogue, c: Choices, codePct = 0): Price {
  const S = cat.settings;
  const lines: Line[] = [];
  let sub = 0, cost = 0, crew = 0, deposit = 0, days = 0, crewSub = 0, crewCost = 0;
  const holds: { gear_id: string; qty: number }[] = [];
  const zone = cat.zones.find((z) => z.id === c.zone) || cat.zones.find((z) => z.id === "dubai") || cat.zones[0];
  const svc = cat.services.find((s) => s.id === c.svc);
  if (svc && !isGear(cat, c)) {
    const pk = cat.packages.find((p) => p.id === c.pk && p.service_id === svc.id);
    if (pk) {
      const matches = num(S.season_matches, 10), off = num(S.season_off, 0.15);
      const mult = c.dur === "season" ? matches : 1;
      const dayRate = c.dur === "day";
      const pPrice = dayRate ? pk.price_day : c.dur === "season" ? pk.price_2h * matches * (1 - off) : pk.price_2h;
      cost += dayRate ? pk.cost_day : pk.cost_2h * mult;
      const durName = dayRate ? "full day" : c.dur === "season" ? `season of ${matches} matches` : "up to 2 hours";
      lines.push({ label: `${pk.name}, ${durName}`, v: pPrice }); sub += pPrice;
      crew = pk.crew;
      // extra crew by role: a day rate, half of it for up to 2 hours, per match on a season
      const roleFactor = dayRate ? 1 : num(S.crew_2h_share, 0.5);
      const allowed = new Set(cat.serviceRoles.filter((r) => r.service_id === svc.id).map((r) => r.role_id));
      for (const r of cat.roles.filter((x) => x.active && allowed.has(x.id)).sort((a, b) => a.sort - b.sort)) {
        const q = Math.max(0, Math.min(20, Math.floor(c.crewq?.[r.id] || 0)));
        if (!q) continue;
        const v = Math.round(Number(r.client_day) * roleFactor) * q * mult;
        lines.push({ label: `${q > 1 ? q + " × " : ""}${r.name}` + (mult > 1 ? `, ${matches} matches` : ""), v });
        sub += v; crewSub += v; const rc = Number(r.cost_day || 0) * roleFactor * q * mult; cost += rc; crewCost += rc; crew += q;
      }
      // talent set their own day rate (FFP's markup is already in client_day); half of it for up to 2 hours
      const tk = new Set(c.talent ?? []);
      for (const t of cat.talent.filter((x) => tk.has(talentKey(x)))) {
        const v = Math.round(Number(t.client_day) * roleFactor) * mult;
        lines.push({ label: `${t.role_name}: ${t.first_name} ${t.last_name}` + (mult > 1 ? `, ${matches} matches` : ""), v });
        sub += v; crewSub += v; const tc = Number(t.cost_day || 0) * roleFactor * mult; cost += tc; crewCost += tc; crew += 1;
      }
      const groups = new Set<string>();
      for (const e of cat.extras.filter((x) => x.service_id === svc.id && x.kind === "addon" && c.on.includes(x.id)).sort((a, b) => a.sort - b.sort)) {
        if (e.pick_group) { if (groups.has(e.pick_group)) continue; groups.add(e.pick_group); }
        const per = e.per_crew_hour ? num(S.extra_hour_client, 750) * crew : dayRate ? e.price_day : e.price_2h;
        const pc = e.per_crew_hour ? num(S.extra_hour_cost, 400) * crew : dayRate ? e.cost_day : e.cost_2h;
        lines.push({ label: e.name + (mult > 1 ? `, ${matches} matches` : ""), v: per * mult }); sub += per * mult; cost += pc * mult; crew += e.adds_crew;
      }
      if (svc.editing && c.edit) {
        const ev = cat.extras.find((x) => x.id === c.edit && x.kind === "edit_level" && x.service_id === svc.id);
        if (ev) {
          if (ev.price_2h) { lines.push({ label: "Editing: " + ev.name, v: ev.price_2h }); sub += ev.price_2h; cost += ev.cost_2h; }
          if (ev.price_2h) for (const e of cat.extras.filter((x) => x.service_id === svc.id && x.kind === "edit_extra" && c.eon.includes(x.id)).sort((a, b) => a.sort - b.sort)) {
            lines.push({ label: e.name, v: e.price_2h }); sub += e.price_2h; cost += e.cost_2h;
          }
        }
      }
      const tr = zone ? zone.travel_per_crew * crew * mult : 0;
      if (tr > 0) { lines.push({ label: `Crew travel to ${zone.name}, ${crew} crew`, v: tr }); sub += tr; cost += tr; }
    }
  }
  if (isGear(cat, c)) {
    days = rentalDays(c.from, c.to);
    let g = 0;
    for (const k of cat.gear.filter((x) => x.active).sort((a, b) => a.sort - b.sort)) {
      const q = Math.max(0, Math.min(k.units, Math.floor(c.qty[k.id] || 0)));
      if (!q) continue;
      const v = k.price_day * q * days; g += v; deposit += k.deposit * q;
      holds.push({ gear_id: k.id, qty: q });
      lines.push({ label: `${q > 1 ? q + " × " : ""}${k.name}, ${days} ${days > 1 ? "days" : "day"}`, v });
    }
    const off = days >= 7 ? num(S.rent_off_7, 0.2) : days >= 3 ? num(S.rent_off_3, 0.1) : 0;
    if (off && g) lines.push({ label: `Longer hire, ${Math.round(off * 100)}% off`, v: -g * off });
    sub += g * (1 - off);
    if (c.setup && g) { const s = num(S.setup_handover, 1000); lines.push({ label: "Set-up and handover by an FFP operator", v: s }); sub += s; }
    if (c.hand === "delivery" && g && zone) { const h = zone.delivery / 2; lines.push({ label: `Drop-off, ${zone.name}`, v: h }); lines.push({ label: `Pick-up, ${zone.name}`, v: h }); sub += zone.delivery; }
    cost += sub * 0.25;
  }
  const floor = num(S.margin_floor, 0.4);
  // partner discounts never apply to crew or talent: crew rates sit at the margin floor, talent at their own rate plus our markup
  const dsub = sub - crewSub, dcost = cost - crewCost;
  const maxOff = Math.max(0, dsub - dcost / (1 - floor));
  const disc = codePct > 0 ? Math.min(dsub * codePct / 100, maxOff) : 0;
  if (disc) lines.push({ label: "Partner discount", v: -disc });
  const total = Math.round((sub - disc) * 100) / 100;
  const split = !isGear(cat, c) && total > num(S.split_over, 10000);
  return { lines, sub, cost, disc, total, deposit, crew, days, holds, split };
}

export const aed = (n: number) => (n < 0 ? "−AED " : "AED ") + Math.abs(Math.round(n)).toLocaleString("en-US");
