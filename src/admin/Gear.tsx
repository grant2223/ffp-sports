import { useCallback, useEffect, useMemo, useState } from "react";
import { sb } from "../lib/supabase";
import { Full, useAsk, useToast } from "./kit";

type Row = Record<string, any>;
type Part = { kit_id: string; item_id: string; qty: number; note: string; sort: number };
const CAT_ORDER = ["Kits", "Cameras", "Streaming and switching", "Wireless video", "Audio and commentary", "Lighting", "Support"];
const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setUTCDate(x.getUTCDate() + n); return x; };
const today = () => { const n = new Date(); return new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate())); };
const nf = (n: number | string | null | undefined) => (n === null || n === undefined || n === "" ? "" : Number(n).toLocaleString("en-US"));
const short = (a: string, b: string) => {
  const f = (s: string) => new Date(s + "T00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return a === b ? f(a) : a.slice(0, 7) === b.slice(0, 7) ? `${Number(a.slice(8))}–${f(b)}` : `${f(a)} – ${f(b)}`;
};
const catOrder = (cats: string[]) => [...new Set(cats)].sort((a, b) => {
  const ia = CAT_ORDER.indexOf(a), ib = CAT_ORDER.indexOf(b);
  return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
});

// free units per day: own holds, plus kits that use this item, and a kit is limited by its parts
function freeByDay(gear: Row[], parts: Part[], holds: Row[], days: string[]) {
  const byId = Object.fromEntries(gear.map((g) => [g.id, g]));
  const used: Record<string, number[]> = {};
  for (const g of gear) used[g.id] = days.map(() => 0);
  for (const h of holds) days.forEach((d, i) => {
    if (d < h.date_from || d > h.date_to) return;
    if (used[h.gear_id]) used[h.gear_id][i] += h.qty;
    for (const p of parts.filter((x) => x.kit_id === h.gear_id)) if (used[p.item_id]) used[p.item_id][i] += h.qty * p.qty;
  });
  const own = (id: string, i: number) => (byId[id]?.units ?? 0) - used[id][i];
  const out: Record<string, number[]> = {};
  for (const g of gear) out[g.id] = days.map((_, i) => {
    let f = own(g.id, i);
    for (const p of parts.filter((x) => x.kit_id === g.id)) if (byId[p.item_id]) f = Math.min(f, Math.floor(own(p.item_id, i) / p.qty));
    return Math.max(0, f);
  });
  return out;
}

const who = (h: Row) => h.bookings.org || `${h.bookings.first_name} ${h.bookings.last_name}`;
// what takes an item between two dates: its own bookings, kits that contain it, and for a kit, parts that are out elsewhere
function whoHas(id: string, gear: Row[], parts: Part[], holds: Row[], a: string, b: string, freeIn: Record<string, number[]>): string[] {
  const byId = Object.fromEntries(gear.map((g) => [g.id, g]));
  const hit = (h: Row) => h.date_from <= b && h.date_to >= a;
  const out: string[] = [];
  for (const h of holds.filter(hit)) {
    if (h.gear_id === id) out.push(`${h.qty} out, ${who(h)}`);
    const p = parts.find((x) => x.kit_id === h.gear_id && x.item_id === id);
    if (p) out.push(`${h.qty * p.qty} out in the ${byId[h.gear_id]?.name}, ${who(h)}`);
  }
  // a kit short of units: name only the parts that leave it short
  const units = byId[id]?.units ?? 0;
  const short = (pid: string, q: number) => Math.floor(Math.min(...(freeIn[pid] ?? [0])) / q) < units;
  if (!out.length) for (const p of parts.filter((x) => x.kit_id === id && short(x.item_id, x.qty))) for (const h of holds.filter(hit)) {
    if (h.gear_id === p.item_id) out.push(`${byId[p.item_id]?.name} is out, ${who(h)}`);
    else if (h.gear_id !== id && parts.some((x) => x.kit_id === h.gear_id && x.item_id === p.item_id)) out.push(`${byId[p.item_id]?.name} is out in the ${byId[h.gear_id]?.name}, ${who(h)}`);
  }
  return [...new Set(out)];
}

function Calendar({ id, gear, parts, holds, onClose }: { id: string; gear: Row[]; parts: Part[]; holds: Row[]; onClose: () => void }) {
  const g = gear.find((x) => x.id === id)!;
  const t = today();
  const [m, setM] = useState(() => new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), 1)));
  const n = new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() + 1, 0)).getUTCDate();
  const days = Array.from({ length: n }, (_, i) => iso(addDays(m, i)));
  const free = freeByDay(gear, parts, holds, days)[id];
  const lead = (m.getUTCDay() + 6) % 7;
  const first = days[0], last = days[n - 1];
  const kitOf = (h: Row) => parts.find((p) => p.kit_id === h.gear_id && p.item_id === id);
  const booked = holds.filter((h) => h.date_from <= last && h.date_to >= first && (h.gear_id === id || kitOf(h)));
  const month = m.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
  return (
    <Full title={<>{g.name}<span className="own">{g.units} owned</span></>} onClose={onClose}
      actions={<div className="mnav"><button className="btn ghost" type="button" aria-label="Previous month" onClick={() => setM(new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() - 1, 1)))}>‹</button><b>{month}</b>
        <button className="btn ghost" type="button" aria-label="Next month" onClick={() => setM(new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() + 1, 1)))}>›</button></div>}>
      <div className="calv">
        <div className="cg">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="wd">{d}</div>)}
          {Array.from({ length: lead }, (_, i) => <div key={"l" + i} className="cd out" />)}
          {days.map((d, i) => { const past = d < iso(t); const f = free[i];
            return <div key={d} className={"cd" + (past ? " past" : f === 0 ? " none" : f < g.units ? " some" : "") + (d === iso(t) ? " today" : "")}>
              <span className="dn">{i + 1}</span>{!past && (f === 0 ? <b>None left</b> : f < g.units ? <b>{f} left</b> : null)}</div>; })}
        </div>
        <div className="key"><i className="kf" />All free<i className="ks" />Some booked<i className="kn" />None free</div>
        <h2 className="sh">Booked this month</h2>
        {!booked.length ? <p className="muted" style={{ margin: 0 }}>Nothing booked.</p> :
        <div className="bk">{booked.map((h) => { const p = kitOf(h); return <div key={h.id}><b>{short(h.date_from, h.date_to)}</b>
          <span>{p ? `${h.qty * p.qty} out in the ${gear.find((x) => x.id === h.gear_id)?.name}` : `${h.qty} out`}, {who(h)}</span></div>; })}</div>}
      </div>
    </Full>
  );
}

export function GearTab() {
  const [gear, setGear] = useState<Row[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [holds, setHolds] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [calFor, setCalFor] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const load = useCallback(async () => {
    const [g, p, h] = await Promise.all([sb.from("gear").select("*").order("sort"), sb.from("gear_parts").select("*"),
      sb.from("gear_holds").select("*, bookings!inner(ref,status,first_name,last_name,org)").gte("date_to", iso(today())).order("date_from")]);
    setGear(g.data ?? []); setParts((p.data ?? []) as Part[]);
    setHolds((h.data ?? []).filter((x: Row) => !["cancelled", "declined"].includes(x.bookings.status)));
  }, []);
  useEffect(() => { load(); }, [load]);
  const range = useMemo(() => {
    if (!from || !to || to < from) return null;
    const out: string[] = []; for (let d = new Date(from + "T00:00:00Z"); iso(d) <= to && out.length < 366; d = addDays(d, 1)) out.push(iso(d));
    return out;
  }, [from, to]);
  const rangeFree = useMemo(() => (range ? freeByDay(gear, parts, holds, range) : null), [gear, parts, holds, range]);
  const cats = catOrder(gear.map((g) => g.category || "Other"));
  const shown = gear.filter((g) => (!cat || (g.category || "Other") === cat) && (!q || (g.name + " " + g.strap).toLowerCase().includes(q.toLowerCase())));

  return (
    <div className="page">
      <div className="ghead"><h1>Gear</h1>
        <div className="gtools">
          <input className="srch" placeholder="Search gear" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="catf" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category"><option value="">All categories</option>{cats.map((c) => <option key={c} value={c}>{c}</option>)}</select>
          <button className="btn gold" type="button" onClick={() => setOpen("new")}>Add item</button>
        </div>
      </div>
      <div className="dates"><b>Check dates</b>
        <label className="fld"><span>From</span><input type="date" value={from} onChange={(e) => { setFrom(e.target.value); if (!to || to < e.target.value) setTo(e.target.value); }} /></label>
        <label className="fld"><span>To</span><input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} /></label>
        {(from || to) && <button className="btn plain" type="button" onClick={() => { setFrom(""); setTo(""); }}>Clear</button>}
      </div>
      {!gear.length ? <div className="empty">Loading gear…</div> :
      <div className="tablewrap"><table className="gt">
        <thead><tr><th style={{ width: 96 }}></th><th>Item</th><th className="n" style={{ width: 84 }}>Owned</th>
          {range && <th style={{ width: 400 }}>Free {short(from, to)}</th>}
          <th style={{ width: 200 }}></th>
          <th className="n" style={{ width: 110 }}>AED a day</th></tr></thead>
        <tbody>{cats.map((c) => { const items = shown.filter((g) => (g.category || "Other") === c); if (!items.length) return null; return [
          <tr key={"g" + c} className="grp"><td colSpan={range ? 6 : 5}>{c}<span>{items.length}</span></td></tr>,
          ...items.map((g) => (
            <tr key={g.id} className="click" onClick={() => setOpen(g.id)}>
              <td className="ph">{g.img ? <img src={g.img} alt="" /> : <span className="noph" />}</td>
              <td className="nm"><b>{g.name}</b><span>{g.active ? g.strap : "Hidden from the site"}</span></td>
              <td className="n">{g.units}</td>
              {range && rangeFree && (() => { const f = Math.min(...rangeFree[g.id]); const w = f < g.units ? whoHas(g.id, gear, parts, holds, from, to, rangeFree) : [];
                return <td><div className={"fq " + (f === 0 ? "none" : f < g.units ? "some" : "all")}><b>{f}</b><span>{w.length ? w.join("; ") : "All free"}</span></div></td>; })()}
              <td><button className="btn ghost ca" type="button" onClick={(e) => { e.stopPropagation(); setCalFor(g.id); }}>Check availability</button></td>
              <td className="n">{nf(g.price_day)}</td>
            </tr>))]; })}
        </tbody></table></div>}
      {calFor && <Calendar id={calFor} gear={gear} parts={parts} holds={holds} onClose={() => setCalFor(null)} />}
      {open && <Editor id={open} gear={gear} parts={parts} holds={holds} cats={cats} onClose={() => setOpen(null)} onSaved={async (id) => { await load(); setOpen(id); }} onGone={async () => { await load(); setOpen(null); }} />}
    </div>
  );
}

// A searchable dropdown. Its list opens in the page flow, never floating over it.
function Combo({ value, options, onPick, placeholder, allowNew }: { value: string; options: [string, string][]; onPick: (v: string) => void; placeholder: string; allowNew?: boolean }) {
  const [open, setOpen] = useState(false);
  const [t, setT] = useState("");
  const label = options.find(([v]) => v === value)?.[1] ?? value;
  const list = options.filter(([, l]) => !t || l.toLowerCase().includes(t.toLowerCase()));
  const pick = (v: string) => { onPick(v); setOpen(false); setT(""); };
  return (
    <div className={"combo" + (open ? " open" : "")}>
      <label className="dd"><input value={open ? t : label} placeholder={open ? "Search" : placeholder} onFocus={() => setOpen(true)} onChange={(e) => setT(e.target.value)}
        onBlur={() => setTimeout(() => { setOpen(false); setT(""); }, 150)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (list[0]) pick(list[0][0]); else if (allowNew && t.trim()) pick(t.trim()); } if (e.key === "Escape") (e.target as HTMLInputElement).blur(); }} />
        <span className="chev" /></label>
      {open && <div className="opts">{list.map(([v, l]) => <button key={v || "_"} type="button" className={v === value ? "on" : ""} onMouseDown={(e) => { e.preventDefault(); pick(v); }}>{l}</button>)}
        {allowNew && t.trim() && !options.some(([, l]) => l.toLowerCase() === t.trim().toLowerCase()) && <button type="button" onMouseDown={(e) => { e.preventDefault(); pick(t.trim()); }}>Add “{t.trim()}”</button>}
        {!list.length && !allowNew && <span className="none">No match</span>}</div>}
    </div>
  );
}

const blank = { id: "", kind: "item", name: "", category: "", strap: "", img: "", units: 1, price_day: "", purchase_price: "", active: true, specs: [] as string[], best: "", supply: "" };
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "item";

function Editor({ id, gear, parts, holds, cats, onClose, onSaved, onGone }: { id: string; gear: Row[]; parts: Part[]; holds: Row[]; cats: string[]; onClose: () => void; onSaved: (id: string) => void; onGone: () => void }) {
  const toast = useToast();
  const [askEl, ask] = useAsk();
  const orig = id === "new" ? null : gear.find((g) => g.id === id);
  const [g, setG] = useState<Row>(() => (orig ? { ...orig, specs: [...(orig.specs ?? [])] } : { ...blank }));
  const [mine, setMine] = useState<Part[]>(() => parts.filter((p) => p.kit_id === id).sort((a, b) => a.sort - b.sort).map((p) => ({ ...p })));
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const isKit = g.kind === "kit" || g.category === "Kits";
  const set = (p: Row) => { setG((x) => ({ ...x, ...p })); setDirty(true); };
  const setPart = (i: number, p: Partial<Part>) => { setMine((m) => m.map((x, j) => (j === i ? { ...x, ...p } : x))); setDirty(true); };
  const setSpec = (i: number, v: string) => set({ specs: g.specs.map((s: string, j: number) => (j === i ? v : s)) });
  const byId = Object.fromEntries(gear.map((x) => [x.id, x]));
  const inKits = parts.filter((p) => p.item_id === id);
  const myHolds = holds.filter((h) => h.gear_id === id || inKits.some((p) => p.kit_id === h.gear_id));
  const stockOpts = gear.filter((x) => x.kind === "item" && x.id !== id && !mine.some((m) => m.item_id === x.id)).map((x) => [x.id, `${x.name}, ${x.units} owned`] as [string, string]);
  const payback = !isKit && Number(g.purchase_price) > 0 && Number(g.price_day) > 0 ? Math.ceil(Number(g.purchase_price) / Number(g.price_day)) : 0;
  const num = (v: string) => { const n = v.replace(/[^0-9.]/g, ""); return n === "" ? "" : n; };

  const close = async () => { if (dirty && !(await ask({ title: "Leave without saving?", text: "Your changes to this item will be lost.", yes: "Leave without saving", danger: true }))) return; onClose(); };
  const upload = async (file?: File) => {
    if (!file) return;
    const path = `gear/${crypto.randomUUID()}.${(file.name.split(".").pop() || "jpg").toLowerCase()}`;
    const up = await sb.storage.from("site").upload(path, file, { contentType: file.type, upsert: false });
    if (up.error) { toast("Photo not uploaded: " + up.error.message); return; }
    set({ img: sb.storage.from("site").getPublicUrl(path).data.publicUrl });
  };
  const save = async () => {
    const name = String(g.name || "").trim();
    if (!name) { toast("Add a name"); return; }
    if (!(Number(g.price_day) > 0)) { toast("Add the price a day"); return; }
    if (!(Number(g.units) >= 0)) { toast("Add the units owned"); return; }
    setBusy(true);
    const specs = (g.specs as string[]).map((s) => s.trim()).filter(Boolean);
    const kind = isKit ? "kit" : "item";
    const lines = mine.filter((m) => byId[m.item_id]).map((m, i) => ({ kit_id: "", item_id: m.item_id, qty: Math.max(1, Math.floor(Number(m.qty) || 1)), note: (m.note || "").trim(), sort: i + 1 }));
    const detail = kind === "kit" ? [...lines.map((m) => `${m.qty} × ${byId[m.item_id].name}${m.note ? ": " + m.note : ""}`), ...specs].join(". ") : g.detail ?? "";
    const row = { kind, name, category: (g.category || (isKit ? "Kits" : "")).trim(), strap: String(g.strap || "").trim(), img: g.img || "", units: Math.floor(Number(g.units) || 0),
      price_day: Number(g.price_day), purchase_price: g.purchase_price === "" || g.purchase_price === null ? null : Number(g.purchase_price), active: !!g.active, specs,
      best: String(g.best || "").trim(), supply: String(g.supply || "").trim(), detail };
    let gid = orig?.id as string | undefined;
    if (!gid) {
      gid = slug(name); let n = 2; while (byId[gid]) gid = slug(name) + "-" + n++;
      const sort = Math.max(0, ...gear.map((x) => Number(x.sort) || 0)) + 1;
      const { error } = await sb.from("gear").insert({ id: gid, sort, ...row });
      if (error) { setBusy(false); toast("Not saved: " + error.message); return; }
    } else {
      const { error } = await sb.from("gear").update(row).eq("id", gid);
      if (error) { setBusy(false); toast("Not saved: " + error.message); return; }
    }
    if (kind === "kit") {
      // write the new contents first, then drop lines that were removed, so a failed save never empties a kit
      const up = lines.length ? await sb.from("gear_parts").upsert(lines.map((m) => ({ ...m, kit_id: gid })), { onConflict: "kit_id,item_id" }) : { error: null };
      if (up.error) { setBusy(false); toast("Kit contents not saved: " + up.error.message); return; }
      const keep = lines.map((m) => m.item_id);
      const gone = parts.filter((p) => p.kit_id === gid && !keep.includes(p.item_id)).map((p) => p.item_id);
      if (gone.length) { const del = await sb.from("gear_parts").delete().eq("kit_id", gid).in("item_id", gone); if (del.error) { setBusy(false); toast("Kit contents not saved: " + del.error.message); return; } }
    }
    setBusy(false); setDirty(false); toast("Saved"); onSaved(gid);
  };
  const remove = async () => {
    if (!orig) { onClose(); return; }
    if (!(await ask({ title: `Delete ${orig.name}?`, text: "It comes off the site and out of stock. This can't be undone.", yes: "Delete", danger: true }))) return;
    const { error } = await sb.from("gear").delete().eq("id", orig.id);
    if (error) { // it has bookings on record: hide it instead, so past bookings keep their item
      const h = await sb.from("gear").update({ active: false }).eq("id", orig.id);
      toast(h.error ? "Not deleted: " + h.error.message : "It has past bookings, so it's hidden from the site instead");
    } else toast("Deleted");
    onGone();
  };

  return (
    <Full title={orig ? orig.name : "New item"} onClose={close}
      actions={<>{dirty && <span className="unsaved">Unsaved changes</span>}<button className="btn gold" type="button" disabled={busy || (!dirty && !!orig)} onClick={save}>{busy ? "Saving…" : "Save"}</button></>}>
      <div className="eg">
        <div className="col">
          {g.img ? <div className="photo"><img src={g.img} alt="" /><label className="btn ghost">Replace photo<input type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} /></label></div>
            : <div className="photo empty"><span>Add a photo</span><label className="btn gold">Upload photo<input type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} /></label></div>}
          <div className="f2">
            <label className="fld"><span>Name</span><input value={g.name} onChange={(e) => set({ name: e.target.value })} /></label>
            <div className="fld"><span>Category</span><Combo value={g.category} options={catOrder([...cats, ...CAT_ORDER]).map((c) => [c, c] as [string, string])} onPick={(c) => set({ category: c })} placeholder="Pick or type a category" allowNew /></div>
          </div>
          <label className="fld"><span>One line on the site</span><input value={g.strap} onChange={(e) => set({ strap: e.target.value })} /></label>
          {isKit && <>
            <label className="fld"><span>Best for</span><input value={g.best} onChange={(e) => set({ best: e.target.value })} /></label>
            <label className="fld"><span>You supply</span><input value={g.supply} onChange={(e) => set({ supply: e.target.value })} /></label>
            <h2 className="sh">In the case</h2>
            <div className="case">
              {mine.map((m, i) => { const it = byId[m.item_id]; if (!it) return null; return (
                <div key={m.item_id} className="cl"><input className="q" inputMode="numeric" value={m.qty} onChange={(e) => setPart(i, { qty: Number(num(e.target.value)) || ("" as unknown as number) })} />
                  <div className="cb"><div className="ci"><b>{it.name}</b><em>{it.units} owned</em></div>
                    <Grow value={m.note} placeholder="What the client sees, e.g. 4K, 20x zoom" onChange={(v) => setPart(i, { note: v })} /></div>
                  <button type="button" className="rm" aria-label={"Remove " + it.name} onClick={() => { setMine((x) => x.filter((_, j) => j !== i)); setDirty(true); }}>×</button></div>); })}
              {g.specs.map((s: string, i: number) => (
                <div key={"s" + i} className="cl"><span className="q0" /><div className="cb"><div className="ci"><b className="lo">Not counted in stock</b></div>
                  <Grow value={s} placeholder="e.g. Cables and carry case" onChange={(v) => setSpec(i, v)} /></div>
                  <button type="button" className="rm" aria-label="Remove line" onClick={() => set({ specs: g.specs.filter((_: string, j: number) => j !== i) })}>×</button></div>))}
            </div>
            <div className="addrow"><Combo value="" options={stockOpts} onPick={(v) => { if (!v) return; setMine((x) => [...x, { kit_id: id, item_id: v, qty: 1, note: "", sort: x.length + 1 }]); setDirty(true); }} placeholder="Add gear from stock" />
              <button className="btn ghost" type="button" onClick={() => set({ specs: [...g.specs, ""] })}>Add a line</button></div>
          </>}
          {!isKit && <>
            <h2 className="sh">Specs</h2>
            <div className="lines">{g.specs.map((s: string, i: number) => (
              <div key={i} className="ln"><Grow value={s} placeholder="e.g. 4K 60 fps, 20x zoom" onChange={(v) => setSpec(i, v)} />
                <button type="button" className="rm" aria-label="Remove line" onClick={() => set({ specs: g.specs.filter((_: string, j: number) => j !== i) })}>×</button></div>))}</div>
            <div className="addrow"><button className="btn ghost" type="button" onClick={() => set({ specs: [...g.specs, ""] })}>Add a line</button></div>
          </>}
        </div>
        <div className="col">
          <h2 className="sh first">Stock and price</h2>
          <div className={"f3" + (isKit ? " two" : "")}>
            <label className="fld"><span>{isKit ? "Kits you can make" : "Units owned"}</span><input className="num" inputMode="numeric" value={g.units} onChange={(e) => set({ units: num(e.target.value) })} /></label>
            <label className="fld"><span>AED a day</span><input className="num" inputMode="decimal" value={nf(g.price_day)} onChange={(e) => set({ price_day: num(e.target.value) })} /></label>
            {!isKit && <label className="fld"><span>Purchase price</span><input className="num" inputMode="decimal" placeholder="AED" value={nf(g.purchase_price)} onChange={(e) => set({ purchase_price: num(e.target.value) })} /></label>}
          </div>
          {payback > 0 && <p className="pb">Pays for itself in <b>{payback} rental days</b></p>}
          <div className="tg"><span>Listed on the site</span><button type="button" className={"sw" + (g.active ? " on" : "")} aria-pressed={!!g.active} onClick={() => set({ active: !g.active })}><i /></button></div>
          {!isKit && inKits.length > 0 && <><h2 className="sh">In kits</h2>
            <div className="bk">{inKits.map((p) => <div key={p.kit_id}><b>{p.qty} {p.qty > 1 ? "units" : "unit"}</b><span>{byId[p.kit_id]?.name}</span></div>)}</div></>}
          {orig && <><h2 className="sh">Booked</h2>
            {!myHolds.length ? <p className="muted" style={{ margin: 0 }}>Nothing booked from today.</p> :
            <div className="bk">{myHolds.map((h) => <div key={h.id}><b>{short(h.date_from, h.date_to)}</b>
              <span>{h.gear_id === id ? `${h.qty} ${isKit ? (h.qty > 1 ? "kits" : "kit") : h.qty > 1 ? "units" : "unit"}` : `${h.qty * (inKits.find((p) => p.kit_id === h.gear_id)?.qty ?? 1)} in the ${byId[h.gear_id]?.name}`}, {h.bookings.ref}, {h.bookings.org || `${h.bookings.first_name} ${h.bookings.last_name}`}</span></div>)}</div>}</>}
          {orig && <button className="btn plain del" type="button" onClick={remove}>Delete this {isKit ? "kit" : "item"}</button>}
        </div>
      </div>
      {askEl}
    </Full>
  );
}

// a text field that grows with its text, so nothing is cut off
function Grow({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <textarea rows={1} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
    ref={(el) => { if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; } }} />;
}
