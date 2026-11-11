import { useCallback, useEffect, useMemo, useState } from "react";
import { api, sb } from "../lib/supabase";
import { Full, money, day, Status, useToast } from "./kit";

type Row = Record<string, any>;
const STATUSES: [string, string][] = [["open", "Open bookings"], ["requested", "New requests"], ["confirmed", "Awaiting payment"], ["part_paid", "Part paid"], ["paid", "Paid"], ["completed", "Completed"], ["declined", "Declined"], ["cancelled", "Cancelled"], ["all", "Everything"]];
const SVC: Record<string, string> = { live: "Livestream", video: "Video", photo: "Photography", pod: "Podcasting" };
export const svcName = (b: Row) => (b.kind === "estimate" ? "Estimate request" : b.mode === "gear" ? "Gear rental" : SVC[b.service_id] || b.service_id || "");
export const whenTxt = (b: Row) => (b.mode === "gear" ? `${day(b.gear_from)} to ${day(b.gear_to)}` : day(b.event_date));

export function Bookings({ onChange }: { onChange: () => void }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [status, setStatus] = useState("open");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const load = useCallback(async () => {
    let qy = sb.from("bookings").select("*").order("created_at", { ascending: false }).limit(300);
    if (status === "open") qy = qy.in("status", ["requested", "confirmed", "part_paid"]);
    else if (status !== "all") qy = qy.eq("status", status);
    const { data } = await qy; setRows(data ?? []);
  }, [status]);
  useEffect(() => { load(); }, [load]);
  const shown = useMemo(() => (rows ?? []).filter((b) => !q || [b.ref, b.first_name, b.last_name, b.org, b.email, b.venue].join(" ").toLowerCase().includes(q.toLowerCase())), [rows, q]);
  return (
    <div className="page">
      <h1>Bookings</h1>
      <div className="bar">
        <label className="fld" style={{ width: 300 }}><span>Show</span><select value={status} onChange={(e) => setStatus(e.target.value)}>{STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        <label className="fld grow" style={{ maxWidth: 420 }}><span>Search</span><input value={q} placeholder="Reference, name, club, email or venue" onChange={(e) => setQ(e.target.value)} /></label>
      </div>
      {rows === null ? null : !shown.length ? <div className="empty">No bookings here yet.</div> :
        <div className="tablewrap"><table>
          <thead><tr><th>Reference</th><th>Status</th><th>Service</th><th>Date</th><th>Client</th><th className="n">Total</th><th className="n">Paid</th><th>Received</th></tr></thead>
          <tbody>{shown.map((b) => (
            <tr key={b.id} className="click" onClick={() => setOpen(b.id)}>
              <td><b>{b.ref}</b></td><td><Status s={b.status} /></td><td>{svcName(b)}</td><td>{whenTxt(b)}</td>
              <td>{b.first_name} {b.last_name}<div className="muted sm">{b.org}</div></td>
              <td className="n">{money(b.total)}</td><td className="n">{Number(b.paid) ? money(b.paid) : ""}</td><td className="muted">{day(b.created_at)}</td>
            </tr>))}</tbody>
        </table></div>}
      {open && <BookingDetail id={open} onClose={() => { setOpen(null); load(); onChange(); }} />}
    </div>
  );
}

function BookingDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const toast = useToast();
  const [b, setB] = useState<Row | null>(null);
  const [lines, setLines] = useState<Row[]>([]);
  const [asg, setAsg] = useState<Row[]>([]);
  const [holds, setHolds] = useState<Row[]>([]);
  const [pays, setPays] = useState<Row[]>([]);
  const [staff, setStaff] = useState<Row[]>([]);
  const [roles, setRoles] = useState<Row[]>([]);
  const [skills, setSkills] = useState<Row[]>([]);
  const [gear, setGear] = useState<Row[]>([]);
  const [zones, setZones] = useState<Row[]>([]);
  const [free, setFree] = useState<Record<string, number>>({});
  const [clash, setClash] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  const [pay, setPay] = useState({ amount: "", date: new Date().toISOString().slice(0, 10), note: "" });
  const [notes, setNotes] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [bb, ll, aa, hh, pp, ss, rr, sk, gg] = await Promise.all([
      sb.from("bookings").select("*").eq("id", id).single(), sb.from("booking_lines").select("*").eq("booking_id", id).order("sort"),
      sb.from("assignments").select("*").eq("booking_id", id).order("id"), sb.from("gear_holds").select("*").eq("booking_id", id),
      sb.from("payments").select("*").eq("booking_id", id).order("received_on"), sb.from("staff").select("*").eq("active", true).order("first_name"),
      sb.from("roles").select("*").order("sort"), sb.from("staff_roles").select("*"), sb.from("gear").select("*").order("sort")]);
    sb.from("zones").select("*").then(({ data }) => setZones(data ?? []));
    setB(bb.data); setLines(ll.data ?? []); setAsg(aa.data ?? []); setHolds(hh.data ?? []); setPays(pp.data ?? []); setStaff(ss.data ?? []); setRoles(rr.data ?? []); setSkills(sk.data ?? []); setGear(gg.data ?? []);
    const bk = bb.data;
    if (bk?.mode === "gear" && bk.gear_from) {
      const { data } = await sb.rpc("gear_free", { p_from: bk.gear_from, p_to: bk.gear_to });
      const m: Record<string, number> = {}; for (const r of (data ?? []) as Row[]) m[r.gear_id] = r.free; setFree(m);
    }
    // crew already on another job that day
    if (bk?.event_date) {
      const { data } = await sb.from("assignments").select("staff_id, bookings!inner(ref,event_date,status)").neq("booking_id", id).eq("bookings.event_date", bk.event_date).not("staff_id", "is", null);
      const c: Record<string, string> = {}; for (const r of (data ?? []) as Row[]) if (!["cancelled", "declined"].includes(r.bookings.status)) c[r.staff_id] = r.bookings.ref; setClash(c);
    }
  }, [id]);
  useEffect(() => { load(); }, [load]);
  if (!b) return <Full title="Loading…" onClose={onClose}><div /></Full>;

  const act = async (action: string, extra: Row = {}, done = "Done") => {
    setBusy(true);
    try { await api(action, { id, ...extra }); toast(done); setMsg(""); await load(); } catch (e) { toast((e as Error).message); } finally { setBusy(false); }
  };
  const setStatus = async (s: string) => { const { error } = await sb.from("bookings").update({ status: s }).eq("id", id); toast(error ? error.message : "Saved"); load(); };
  const saveAsg = async (a: Row, patch: Row) => {
    if (patch.staff_id !== undefined) { const sr = skills.find((x) => x.staff_id === patch.staff_id && x.role_id === a.role_id); if (sr?.day_rate) patch.day_rate = sr.day_rate; if (patch.staff_id && a.status === "open") patch.status = "asked"; if (!patch.staff_id) patch.status = "open"; }
    const { error } = await sb.from("assignments").update(patch).eq("id", a.id); if (error) toast(error.message); else load();
  };
  const addRole = async (role_id: string) => { const r = roles.find((x) => x.id === role_id); await sb.from("assignments").insert({ booking_id: id, role_id, day_rate: r?.cost_day ?? 0 }); load(); };
  const days = b.choices?.dur === "season" ? 10 : 1;
  const crewCost = asg.reduce((t, a) => t + (a.staff_id ? Number(a.day_rate || 0) : 0), 0) * days;
  const margin = Number(b.total) ? (Number(b.total) - Number(b.cost || 0)) / Number(b.total) : 0;
  const due = Number(b.total) + Number(b.deposit) - Number(b.paid);
  const crewReady = b.mode === "gear" || (asg.length > 0 && asg.every((a) => a.staff_id && a.status === "confirmed"));
  const gearReady = b.mode !== "gear" || holds.every((h) => (free[h.gear_id] ?? 0) >= 0);
  const firstPay = b.pay_plan === "split" ? Number(b.total) / 2 : Number(b.total) + Number(b.deposit);

  return (
    <Full title={<>{b.ref} <span style={{ marginLeft: 10 }}><Status s={b.status} /></span></>} onClose={onClose}
      actions={<span className="noprint" style={{ display: "flex", gap: 8 }}>
        {b.status === "requested" && <button className="btn danger" type="button" disabled={busy} onClick={() => { if (confirm("Decline this request and email the client?")) act("decline_booking", { message: msg }, "Declined and emailed"); }}>Decline</button>}
        {b.status === "requested" && b.kind === "booking" && <button className="btn gold" type="button" disabled={busy} onClick={() => act("confirm_booking", { message: msg }, "Confirmed and payment details sent")}>Confirm and send payment details</button>}
        {b.status === "paid" && <button className="btn gold" type="button" onClick={() => setStatus("completed")}>Mark completed</button>}
        {["confirmed", "part_paid", "paid"].includes(b.status) && <button className="btn danger" type="button" onClick={() => { if (confirm("Cancel this booking? Gear and crew are released.")) setStatus("cancelled"); }}>Cancel booking</button>}
      </span>}>
      <div className="cols">
        <div className="stack">
          <div className="card">
            <h2>{svcName(b)}</h2>
            <div className="kv">
              <span>When</span><b>{whenTxt(b)}{b.start_time ? ", " + b.start_time : ""}</b>
              {b.mode !== "gear" && <><span>Where</span><b>{[b.venue, zones.find((z) => z.id === b.zone_id)?.name].filter(Boolean).join(", ")}</b></>}
              {b.mode === "gear" && <><span>Handover</span><b>{b.handover === "delivery" ? `Drop-off and pick-up, ${b.address}, ${zones.find((z) => z.id === b.zone_id)?.name ?? ""}` : "Collects from FFP"}</b></>}
              {b.sport && <><span>Sport</span><b>{b.sport}</b></>}
              <span>Client</span><b>{b.first_name} {b.last_name}{b.org ? ", " + b.org : ""}</b>
              <span>Contact</span><b><a href={"mailto:" + b.email}>{b.email}</a>, <a href={"tel:" + b.phone}>{b.phone}</a></b>
              {b.code && <><span>Partner code</span><b>{b.code}</b></>}
              {b.id_doc_path && <><span>ID</span><b><button className="btn plain" type="button" onClick={async () => { try { const r = await api<{ url: string }>("id_doc_url", { id }); window.open(r.url, "_blank"); } catch (e) { toast((e as Error).message); } }}>View ID</button></b></>}
              <span>Received</span><b>{day(b.created_at)}</b>
            </div>
            {b.notes && <p style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}><span className="muted">Notes from the client</span><br />{b.notes}</p>}
          </div>

          {b.kind === "booking" && b.mode !== "gear" && <div className="card">
            <h2>Crew {crewReady ? <span className="ok sm">All confirmed</span> : <span className="warn sm">Not all confirmed yet</span>}</h2>
            <div className="tablewrap"><table>
              <thead><tr><th>Role</th><th>Person</th><th>Status</th><th className="n">Day rate</th></tr></thead>
              <tbody>{asg.map((a) => {
                const able = staff.filter((s) => skills.some((k) => k.staff_id === s.id && k.role_id === a.role_id));
                const others = staff.filter((s) => !able.includes(s));
                return <tr key={a.id}>
                  <td>{roles.find((r) => r.id === a.role_id)?.name}</td>
                  <td><select value={a.staff_id || ""} onChange={(e) => saveAsg(a, { staff_id: e.target.value || null })}>
                    <option value="">Not allocated</option>
                    {able.length > 0 && <optgroup label="Does this role">{able.map((s) => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}{clash[s.id] ? `, on ${clash[s.id]} that day` : ""}</option>)}</optgroup>}
                    {others.length > 0 && <optgroup label="Everyone else">{others.map((s) => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}{clash[s.id] ? `, on ${clash[s.id]} that day` : ""}</option>)}</optgroup>}
                  </select></td>
                  <td><select value={a.status} onChange={(e) => saveAsg(a, { status: e.target.value })}><option value="open">Open</option><option value="asked">Asked</option><option value="confirmed">Confirmed</option><option value="declined">Can't do it</option></select></td>
                  <td className="n"><input type="number" defaultValue={a.day_rate} style={{ width: 110, textAlign: "right" }} onBlur={(e) => Number(e.target.value) !== Number(a.day_rate) && saveAsg(a, { day_rate: Number(e.target.value) })} /></td>
                </tr>;
              })}</tbody>
            </table></div>
            <div className="bar" style={{ marginBottom: 0 }}><label className="fld" style={{ width: 320 }}><span>Add a role</span>
              <select value="" onChange={(e) => e.target.value && addRole(e.target.value)}><option value="">Choose a role</option>{roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></label></div>
          </div>}

          {b.mode === "gear" && <div className="card">
            <h2>Gear {gearReady ? <span className="ok sm">In stock</span> : <span className="warn sm">Over-booked</span>}</h2>
            <div className="tablewrap"><table><thead><tr><th>Item</th><th className="n">This booking</th><th className="n">Left after all bookings</th></tr></thead>
              <tbody>{holds.map((h) => <tr key={h.id}><td>{gear.find((g) => g.id === h.gear_id)?.name}</td><td className="n">{h.qty}</td><td className="n"><span className={(free[h.gear_id] ?? 0) < 0 ? "warn" : ""}>{free[h.gear_id] ?? "?"}</span></td></tr>)}</tbody></table></div>
          </div>}

          <div className="card noprint">
            <h2>Message to the client</h2>
            <p className="muted sm" style={{ marginTop: -6 }}>Added to the confirmation or decline email.</p>
            <textarea rows={3} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="e.g. Ali will be your operator and arrives 90 minutes before kick-off." />
          </div>

          <div className="card noprint">
            <h2>Admin notes</h2>
            <textarea rows={3} value={notes ?? b.admin_notes ?? ""} onChange={(e) => setNotes(e.target.value)} />
            {notes !== null && <button className="btn gold" type="button" style={{ marginTop: 10 }} onClick={async () => { await sb.from("bookings").update({ admin_notes: notes }).eq("id", id); setNotes(null); toast("Saved"); load(); }}>Save</button>}
          </div>
        </div>

        <div className="stack">
          <div className="card">
            <h2>Price</h2>
            {lines.map((l) => <div key={l.id} className="line"><span>{l.label}</span><b>{money(l.amount)}</b></div>)}
            <div className="tot"><span>Total</span><b>{money(b.total)}</b></div>
            {Number(b.deposit) > 0 && <div className="line"><span>Refundable deposit</span><b>{money(b.deposit)}</b></div>}
            {b.pay_plan === "split" && <div className="line"><span>To book, 50%</span><b>{money(Number(b.total) / 2)}</b></div>}
            {b.kind === "booking" && <div className="line"><span>Planned margin</span><b className={margin < 0.4 ? "warn" : "ok"}>{Math.round(margin * 100)}%</b></div>}
            {b.kind === "booking" && b.mode !== "gear" && <div className="line"><span>Crew allocated so far, cost</span><b>{money(crewCost)}</b></div>}
          </div>
          {b.kind === "booking" && <div className="card">
            <h2>Payments</h2>
            {pays.map((p) => <div key={p.id} className="line"><span>{day(p.received_on)}{p.note ? ", " + p.note : ""}</span><b>{money(p.amount)}</b></div>)}
            <div className="line"><span>Still to pay</span><b>{money(Math.max(0, due))}</b></div>
            {["confirmed", "part_paid"].includes(b.status) && <div className="noprint" style={{ marginTop: 12 }}>
              <div className="grid2">
                <label className="fld"><span>Amount received</span><input type="number" value={pay.amount} placeholder={String(Math.round(b.status === "confirmed" ? firstPay : due))} onChange={(e) => setPay({ ...pay, amount: e.target.value })} /></label>
                <label className="fld"><span>Date</span><input type="date" value={pay.date} onChange={(e) => setPay({ ...pay, date: e.target.value })} /></label>
              </div>
              <label className="fld" style={{ marginTop: 10 }}><span>Note</span><input value={pay.note} placeholder="e.g. Mashreq transfer" onChange={(e) => setPay({ ...pay, note: e.target.value })} /></label>
              <button className="btn gold" type="button" style={{ marginTop: 12, width: "100%" }} disabled={busy || !Number(pay.amount)} onClick={() => act("record_payment", { amount: Number(pay.amount), date: pay.date, note: pay.note }, "Payment recorded and receipt sent").then(() => setPay({ ...pay, amount: "", note: "" }))}>Record payment and send receipt</button>
            </div>}
            {b.status === "requested" && <p className="muted sm" style={{ marginBottom: 0 }}>Confirm the booking first. The client then gets the bank details.</p>}
          </div>}
          {b.kind === "estimate" && <div className="card">
            <h2>Next step</h2>
            <p className="muted" style={{ marginTop: 0 }}>Build a quotation from this estimate request, then send it from Quotes.</p>
            <button className="btn gold" type="button" onClick={async () => {
              const { data, error } = await sb.from("quotes").insert({ org: b.org, attention: `${b.first_name} ${b.last_name}`, email: b.email, subject: [b.sport, b.venue].filter(Boolean).join(", "), booking_id: b.id,
                valid_until: new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10), lines: lines.map((l) => ({ desc: l.label, qty: 1, unit: Number(l.amount), cost: 0 })), total: Number(b.total) }).select().single();
              if (error) toast(error.message); else { toast(`Quotation ${data.number} created. Open it in Quotes.`); }
            }}>Create quotation</button>
          </div>}
        </div>
      </div>
    </Full>
  );
}
