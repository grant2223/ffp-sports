import { useCallback, useEffect, useState } from "react";
import { sb } from "../lib/supabase";
import { Combo, Full, useAsk, useToast } from "./kit";

type Row = Record<string, any>;
const DEAD = ["declined", "cancelled"];
const todayUAE = () => new Date(Date.now() + 4 * 3600e3).toISOString().slice(0, 10);
const nice = (d?: string | null) => (d ? new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "");
const aed = (n: number) => "AED " + Math.round(n).toLocaleString("en-US");
const num = (v: string) => v.replace(/[^0-9.]/g, "");

function status(c: Row, used: number) {
  if (!c.active) return ["off", "Off"];
  const t = todayUAE();
  if (c.ends_on && t > c.ends_on) return ["ended", "Ended"];
  if (c.max_uses && used >= c.max_uses) return ["used", "Used up"];
  if (c.starts_on && t < c.starts_on) return ["soon", "Starts " + nice(c.starts_on)];
  return ["works", "Works"];
}
const discount = (c: Row) => (c.kind === "amount" ? `${aed(Number(c.amount))} off` : `${Number(c.pct)}% off`);

export function CodesTab() {
  const [codes, setCodes] = useState<Row[]>([]);
  const [uses, setUses] = useState<Row[]>([]);
  const [svcs, setSvcs] = useState<[string, string][]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const load = useCallback(async () => {
    const [c, b, s] = await Promise.all([sb.from("partner_codes").select("*").order("created_at", { ascending: false }),
      sb.from("bookings").select("id,ref,code,email,first_name,last_name,org,discount,status,event_date,gear_from,gear_to,created_at").not("code", "is", null).order("created_at", { ascending: false }),
      sb.from("services").select("id,name").eq("active", true).order("sort")]);
    setCodes(c.data ?? []); setUses((b.data ?? []).filter((x: Row) => !DEAD.includes(x.status)));
    setSvcs([...(s.data ?? []).map((x: Row) => [x.id, x.name] as [string, string]), ["gear", "Gear rental"]]);
  }, []);
  useEffect(() => { load(); }, [load]);
  const used = (code: string) => uses.filter((u) => u.code === code).length;
  const name = (id: string) => svcs.find(([k]) => k === id)?.[1] ?? id;
  const applies = (c: Row) => [(c.services ?? []).length ? c.services.map(name).join(", ") : "All services", Number(c.min_spend) > 0 ? `over ${aed(Number(c.min_spend))}` : ""].filter(Boolean).join(", ");
  const shown = codes.filter((c) => !q || (c.code + " " + c.note).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="page cx">
      <div className="ghead"><h1>Discount codes</h1>
        <div className="gtools"><input className="srch" placeholder="Search codes" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn gold" type="button" onClick={() => setOpen("new")}>Add code</button></div></div>
      {!codes.length ? <p className="muted">No codes yet. Add one to give a client a discount.</p> :
      <table className="gt ct"><thead><tr><th>Code</th><th style={{ width: 150 }}>Discount</th><th>Applies to</th><th className="n" style={{ width: 90 }}>Used</th><th style={{ width: 140 }}>Ends</th><th style={{ width: 150 }}>Status</th></tr></thead>
        <tbody>{shown.map((c) => { const u = used(c.code); const [k, l] = status(c, u); return (
          <tr key={c.code} className="click" onClick={() => setOpen(c.code)}>
            <td><b className="cc">{c.code}</b>{c.note && <span className="who">{c.note}</span>}</td>
            <td><b className="dsc">{discount(c)}</b></td><td>{applies(c)}</td>
            <td className="n">{c.max_uses ? `${u} of ${c.max_uses}` : u}</td><td>{c.ends_on ? nice(c.ends_on) : "No end date"}</td>
            <td><span className={"st " + k}>{l}</span></td></tr>); })}</tbody></table>}
      {open && <CodeEditor id={open} codes={codes} uses={uses} svcs={svcs} onClose={() => setOpen(null)} onSaved={async (c) => { await load(); setOpen(c); }} onGone={async () => { await load(); setOpen(null); }} />}
    </div>
  );
}

const blank = { code: "", note: "", kind: "pct", pct: "10", amount: "", services: [] as string[], min_spend: "", starts_on: "", ends_on: "", max_uses: "", once_per_client: false, active: true };

function CodeEditor({ id, codes, uses, svcs, onClose, onSaved, onGone }: { id: string; codes: Row[]; uses: Row[]; svcs: [string, string][]; onClose: () => void; onSaved: (c: string) => void; onGone: () => void }) {
  const toast = useToast();
  const [askEl, ask] = useAsk();
  const orig = id === "new" ? null : codes.find((c) => c.code === id);
  const [c, setC] = useState<Row>(() => orig ? { ...orig, pct: String(orig.pct ?? ""), amount: orig.amount ? String(orig.amount) : "", min_spend: Number(orig.min_spend) ? String(orig.min_spend) : "",
    max_uses: orig.max_uses ? String(orig.max_uses) : "", starts_on: orig.starts_on ?? "", ends_on: orig.ends_on ?? "", services: [...(orig.services ?? [])] } : { ...blank, starts_on: todayUAE() });
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (p: Row) => { setC((x) => ({ ...x, ...p })); setDirty(true); };
  const mine = uses.filter((u) => u.code === id);
  const name = (k: string) => svcs.find(([v]) => v === k)?.[1] ?? k;
  const close = async () => { if (dirty && !(await ask({ title: "Leave without saving?", text: "Your changes to this code will be lost.", yes: "Leave without saving", danger: true }))) return; onClose(); };
  const save = async () => {
    const code = String(c.code).toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!code) { toast("Add a code"); return; }
    if (!orig && codes.some((x) => x.code === code)) { toast(`${code} already exists`); return; }
    const pct = Number(c.pct), amount = Number(c.amount);
    if (c.kind === "pct" && !(pct > 0 && pct <= 100)) { toast("Add a percentage between 1 and 100"); return; }
    if (c.kind === "amount" && !(amount > 0)) { toast("Add the amount off"); return; }
    if (c.starts_on && c.ends_on && c.ends_on < c.starts_on) { toast("The end date is before the start date"); return; }
    const row = { code, note: String(c.note || "").trim(), kind: c.kind, pct: c.kind === "pct" ? pct : 0, amount: c.kind === "amount" ? amount : 0, services: c.services,
      min_spend: Number(c.min_spend) || 0, starts_on: c.starts_on || null, ends_on: c.ends_on || null, max_uses: Number(c.max_uses) > 0 ? Math.floor(Number(c.max_uses)) : null,
      once_per_client: !!c.once_per_client, active: !!c.active };
    setBusy(true);
    const { error } = orig ? await sb.from("partner_codes").update(row).eq("code", orig.code) : await sb.from("partner_codes").insert(row);
    setBusy(false);
    if (error) { toast("Not saved: " + error.message); return; }
    setDirty(false); toast("Saved"); onSaved(code);
  };
  const remove = async () => {
    if (!orig) { onClose(); return; }
    if (!(await ask({ title: `Delete ${orig.code}?`, text: mine.length ? "Bookings that used it keep their discount. The code stops working. This can't be undone." : "The code stops working. This can't be undone.", yes: "Delete", danger: true }))) return;
    const { error } = await sb.from("partner_codes").delete().eq("code", orig.code);
    if (error) { toast("Not deleted: " + error.message); return; }
    toast("Deleted"); onGone();
  };
  const when = (u: Row) => u.event_date ? nice(u.event_date) : u.gear_from ? `${nice(u.gear_from)} to ${nice(u.gear_to)}` : nice(u.created_at.slice(0, 10));

  return (
    <Full title={orig ? orig.code : "New code"} onClose={close}
      actions={<>{dirty && <span className="unsaved">Unsaved changes</span>}<button className="btn gold" type="button" disabled={busy || (!dirty && !!orig)} onClick={save}>{busy ? "Saving…" : "Save"}</button></>}>
      <div className="eg cx">
        <div className="col">
          <div className="f2">
            <label className="fld"><span>Code</span><input className="big" value={c.code} readOnly={!!orig} placeholder="e.g. BUZZER10" onChange={(e) => set({ code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") })} /></label>
            <label className="fld"><span>Who it's for</span><input value={c.note} placeholder="Client or campaign" onChange={(e) => set({ note: e.target.value })} /></label>
          </div>
          <h2 className="sh">Discount</h2>
          <div className="f2">
            <label className="fld"><span>Type</span><select value={c.kind} onChange={(e) => set({ kind: e.target.value })}><option value="pct">Percentage off</option><option value="amount">Fixed amount off</option></select></label>
            {c.kind === "pct"
              ? <label className="fld"><span>Amount</span><span className="sfx"><input className="num" inputMode="decimal" value={c.pct} onChange={(e) => set({ pct: num(e.target.value) })} /><em>%</em></span></label>
              : <label className="fld"><span>Amount</span><span className="sfx pre"><em>AED</em><input className="num" inputMode="decimal" value={c.amount} onChange={(e) => set({ amount: num(e.target.value) })} /></span></label>}
          </div>
          <h2 className="sh">Applies to</h2>
          {!c.services.length ? <div className="pr all"><span>All services</span></div> :
            <div className="parts">{c.services.map((s: string) => <div key={s} className="pr"><span>{name(s)}</span><button type="button" className="rm" aria-label={"Remove " + name(s)} onClick={() => set({ services: c.services.filter((x: string) => x !== s) })}>×</button></div>)}</div>}
          <Combo value="" options={svcs.filter(([k]) => !c.services.includes(k))} onPick={(v) => v && set({ services: [...c.services, v] })} placeholder="Limit to a service" />
          <label className="fld" style={{ marginTop: 6 }}><span>Minimum spend</span><span className="sfx pre"><em>AED</em><input className="num" inputMode="decimal" placeholder="No minimum" value={c.min_spend} onChange={(e) => set({ min_spend: num(e.target.value) })} /></span></label>
        </div>
        <div className="col">
          <h2 className="sh first">Dates</h2>
          <div className="f2">
            <label className="fld"><span>Starts</span><input type="date" value={c.starts_on} onChange={(e) => set({ starts_on: e.target.value })} /></label>
            <label className="fld"><span>Ends</span><input type="date" value={c.ends_on} min={c.starts_on || undefined} onChange={(e) => set({ ends_on: e.target.value })} /></label>
          </div>
          <h2 className="sh">Limits</h2>
          <label className="fld"><span>Total uses</span><input className="num" inputMode="numeric" placeholder="No limit" value={c.max_uses} onChange={(e) => set({ max_uses: num(e.target.value) })} /></label>
          <div className="tg"><span>One use per client</span><button type="button" className={"sw" + (c.once_per_client ? " on" : "")} aria-pressed={!!c.once_per_client} onClick={() => set({ once_per_client: !c.once_per_client })}><i /></button></div>
          <div className="tg"><span>Code works</span><button type="button" className={"sw" + (c.active ? " on" : "")} aria-pressed={!!c.active} onClick={() => set({ active: !c.active })}><i /></button></div>
          {orig && <><h2 className="sh">Used</h2>
            {!mine.length ? <p className="muted" style={{ margin: 0 }}>Not used yet.</p> :
            <div className="bk">{mine.map((u) => <div key={u.id}><b>{u.ref}</b><span>{u.org || `${u.first_name} ${u.last_name}`}, {when(u)}, {aed(Number(u.discount))} off</span></div>)}</div>}
            <button className="btn delb" type="button" onClick={remove}>Delete code</button></>}
        </div>
      </div>
      {askEl}
    </Full>
  );
}
