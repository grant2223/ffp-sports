import { useCallback, useEffect, useMemo, useState } from "react";
import { api, sb } from "../lib/supabase";
import { loadCatalogue } from "../lib/catalogue";
import type { Catalogue } from "../lib/pricing";
import { Full, money, day, Status, useToast } from "./kit";
import "./quote.css";

type Row = Record<string, any>;
export interface QLine { desc: string; note?: string; qty: number; days?: number; unit: number; cost: number }
const ONES = "Zero One Two Three Four Five Six Seven Eight Nine Ten Eleven Twelve Thirteen Fourteen Fifteen Sixteen Seventeen Eighteen Nineteen".split(" ");
const TENS = "Zero Ten Twenty Thirty Forty Fifty Sixty Seventy Eighty Ninety".split(" ");
export function words(n: number) {
  const w = (x: number): string => {
    if (x < 20) return ONES[x];
    if (x < 100) return TENS[Math.floor(x / 10)] + (x % 10 ? " " + ONES[x % 10] : "");
    if (x < 1000) return ONES[Math.floor(x / 100)] + " Hundred" + (x % 100 ? " and " + w(x % 100) : "");
    for (const [d, nm] of [[1e6, "Million"], [1000, "Thousand"]] as [number, string][]) if (x >= d) return w(Math.floor(x / d)) + " " + nm + (x % d ? (x % d >= 100 ? " " : " and ") + w(x % d) : "");
    return "";
  };
  return "UAE Dirhams " + w(Math.round(n)) + " Only";
}
export const f2 = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const lineTotal = (l: QLine) => l.qty * (l.days || 1) * l.unit;

export function Quotes() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const load = useCallback(async () => { const { data } = await sb.from("quotes").select("*").order("created_at", { ascending: false }).limit(300); setRows(data ?? []); }, []);
  useEffect(() => { load(); }, [load]);
  const create = async () => {
    const valid = new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10);
    const { data } = await sb.from("quotes").insert({ valid_until: valid, lines: [], terms: [] }).select().single();
    if (data) { await load(); setOpen(data.id); }
  };
  return (
    <div className="page">
      <div className="bar" style={{ marginTop: 0 }}><h1 className="grow">Quotes</h1><button className="btn gold" type="button" onClick={create}>New quotation</button></div>
      {rows === null ? null : !rows.length ? <div className="empty">No quotations yet.</div> :
        <div className="tablewrap"><table><thead><tr><th>Number</th><th>Status</th><th>To</th><th>Subject</th><th className="n">Total</th><th>Date</th></tr></thead>
          <tbody>{rows.map((q) => <tr key={q.id} className="click" onClick={() => setOpen(q.id)}><td><b>{q.number}</b></td><td><Status s={q.status} /></td><td>{q.org}<div className="muted sm">{q.attention}</div></td><td>{q.subject}</td><td className="n">{money(q.total)}</td><td className="muted">{day(q.issue_date)}</td></tr>)}</tbody></table></div>}
      {open && <QuoteEditor id={open} onClose={() => { setOpen(null); load(); }} />}
    </div>
  );
}

function QuoteEditor({ id, onClose }: { id: string; onClose: () => void }) {
  const toast = useToast();
  const [q, setQ] = useState<Row | null>(null);
  const [dirty, setDirty] = useState(false);
  const [cat, setCat] = useState<Catalogue | null>(null);
  const [roles, setRoles] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    sb.from("quotes").select("*").eq("id", id).single().then(({ data }) => setQ(data));
    loadCatalogue(true).then(setCat); sb.from("roles").select("*").order("sort").then(({ data }) => setRoles(data ?? []));
  }, [id]);
  const lines: QLine[] = q?.lines ?? [];
  const total = lines.reduce((t, l) => t + lineTotal(l), 0);
  const cost = lines.reduce((t, l) => t + l.qty * (l.days || 1) * (l.cost || 0), 0);
  const margin = total ? (total - cost) / total : 0;
  const set = (p: Row) => { setQ((x) => ({ ...x!, ...p })); setDirty(true); };
  const setLine = (i: number, p: Partial<QLine>) => set({ lines: lines.map((l, j) => (j === i ? { ...l, ...p } : l)) });
  const priceList = useMemo(() => {
    if (!cat) return [] as [string, QLine][];
    const L: [string, QLine][] = [];
    for (const p of cat.packages) { const s = cat.services.find((x) => x.id === p.service_id)?.name; L.push([`${s}: ${p.name}, 2 hours`, { desc: `${s}, ${p.name}, up to 2 hours`, qty: 1, unit: p.price_2h, cost: p.cost_2h }], [`${s}: ${p.name}, full day`, { desc: `${s}, ${p.name}, full day`, qty: 1, unit: p.price_day, cost: p.cost_day }]); }
    for (const e of cat.extras) { const s = cat.services.find((x) => x.id === e.service_id)?.name; if (e.per_crew_hour) L.push([`${s}: Extra hour, per crew`, { desc: "Extra hour, per crew member", qty: 1, unit: Number(cat.settings.extra_hour_client || 750), cost: Number(cat.settings.extra_hour_cost || 400) }]);
      else if (e.price_day || e.price_2h) L.push([`${s}: ${e.name}`, { desc: e.name, note: e.strap, qty: 1, unit: e.price_day || e.price_2h, cost: e.cost_day || e.cost_2h }]); }
    for (const g of cat.gear) L.push([`Gear: ${g.name}, per day`, { desc: g.name + " rental", note: g.strap, qty: 1, days: 1, unit: g.price_day, cost: 0 }]);
    for (const r of roles) L.push([`Crew: ${r.name}, per day`, { desc: r.name, qty: 1, days: 1, unit: Number(r.client_day), cost: Number(r.cost_day) }]);
    L.push(["Set-up day, half day, per crew", { desc: "Half-day set-up, the day before", qty: 1, unit: 2000, cost: 1000 }], ["Set-up day, full day, per crew", { desc: "Full-day set-up, the day before", qty: 1, unit: 4000, cost: 2000 }],
      ["Technical rehearsal, per crew", { desc: "Technical rehearsal", qty: 1, unit: 2000, cost: 1000 }], ["Live rehearsal, per crew", { desc: "Live rehearsal", qty: 1, unit: 4000, cost: 2000 }]);
    for (const z of cat.zones) { L.push([`Drop-off, ${z.name}`, { desc: `Drop-off, ${z.name}`, qty: 1, unit: z.delivery / 2, cost: z.delivery / 4 }], [`Pick-up, ${z.name}`, { desc: `Pick-up, ${z.name}`, qty: 1, unit: z.delivery / 2, cost: z.delivery / 4 }]);
      if (z.travel_per_crew) L.push([`Crew travel, ${z.name}, per crew per day`, { desc: `Crew travel to ${z.name}`, qty: 1, unit: z.travel_per_crew, cost: z.travel_per_crew }]); }
    return L;
  }, [cat, roles]);
  if (!q) return <Full title="Loading…" onClose={onClose}><div /></Full>;
  const save = async () => {
    const { error } = await sb.from("quotes").update({ org: q.org, attention: q.attention, email: q.email, subject: q.subject, issue_date: q.issue_date, valid_until: q.valid_until, lines, terms: q.terms, total, cost }).eq("id", id);
    if (error) toast(error.message); else { setDirty(false); toast("Saved"); }
  };
  const close = () => { if (dirty && !confirm("You have changes that aren't saved. Close anyway?")) return; onClose(); };
  return (
    <Full title={q.number} onClose={close} actions={<span className="noprint" style={{ display: "flex", gap: 8 }}>
      {dirty && <button className="btn gold" type="button" onClick={save}>Save</button>}
      <button className="btn ghost" type="button" onClick={() => window.print()}>Download PDF</button>
      <button className="btn ghost" type="button" disabled={busy || dirty || !lines.length} onClick={async () => {
        setBusy(true);
        const { data: had } = await sb.from("invoices").select("id").eq("quote_id", id).neq("status", "void").maybeSingle();
        let invId = had?.id;
        if (!invId) {
          const { data, error } = await sb.from("invoices").insert({ quote_id: id, booking_id: q.booking_id, quote_number: q.number, org: q.org, attention: q.attention, email: q.email, subject: q.subject,
            lines, terms: q.terms, total, issue_date: new Date().toISOString().slice(0, 10), due_date: new Date().toISOString().slice(0, 10) }).select("id").single();
          if (error) { toast(error.message); setBusy(false); return; }
          invId = data.id; await sb.from("quotes").update({ status: "accepted" }).eq("id", id);
        }
        location.href = "/admin?tab=invoices&open=" + invId;
      }}>Create invoice</button>
      <button className="btn gold" type="button" disabled={busy || dirty || !q.email || !lines.length} onClick={async () => { setBusy(true); try { await api("send_quote", { id }); toast("Quotation emailed to " + q.email); setQ({ ...q, status: "sent" }); } catch (e) { toast((e as Error).message); } finally { setBusy(false); } }}>Email to client</button>
    </span>}>
      <div className="cols" style={{ gridTemplateColumns: "minmax(0,1fr) 820px" }}>
        <div className="stack noprint">
          <div className="card"><h2>Client</h2>
            <div className="grid2">
              <label className="fld"><span>To (company)</span><input value={q.org} onChange={(e) => set({ org: e.target.value })} /></label>
              <label className="fld"><span>Attention</span><input value={q.attention} onChange={(e) => set({ attention: e.target.value })} /></label>
              <label className="fld"><span>Email</span><input type="email" value={q.email} onChange={(e) => set({ email: e.target.value })} /></label>
              <label className="fld"><span>Subject</span><input value={q.subject} onChange={(e) => set({ subject: e.target.value })} /></label>
              <label className="fld"><span>Date</span><input type="date" value={q.issue_date || ""} onChange={(e) => set({ issue_date: e.target.value })} /></label>
              <label className="fld"><span>Valid until</span><input type="date" value={q.valid_until || ""} onChange={(e) => set({ valid_until: e.target.value })} /></label>
            </div></div>
          <div className="card"><h2>Lines</h2>
            <label className="fld"><span>Add from the price list</span><input list="plist" placeholder="Search packages, add-ons, gear, crew, set-up, delivery" onChange={(e) => {
              const hit = priceList.find(([k]) => k === e.target.value); if (hit) { set({ lines: [...lines, { ...hit[1] }] }); e.target.value = ""; } }} />
              <datalist id="plist">{priceList.map(([k]) => <option key={k} value={k} />)}</datalist></label>
            {lines.map((l, i) => <div key={i} style={{ marginTop: 14, paddingTop: 14, borderTop: "2px solid #F2F2EF" }}>
              <div className="grid2" style={{ gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr)" }}>
                <label className="fld"><span>Description</span><input value={l.desc} onChange={(e) => setLine(i, { desc: e.target.value })} /></label>
                <label className="fld"><span>Note under it</span><input value={l.note || ""} onChange={(e) => setLine(i, { note: e.target.value })} /></label>
              </div>
              <div className="grid4" style={{ marginTop: 8, gridTemplateColumns: "repeat(4,minmax(0,1fr)) auto" }}>
                <label className="fld"><span>Qty</span><input type="number" value={l.qty} onChange={(e) => setLine(i, { qty: Number(e.target.value) })} /></label>
                <label className="fld"><span>Days</span><input type="number" value={l.days || 1} onChange={(e) => setLine(i, { days: Number(e.target.value) })} /></label>
                <label className="fld"><span>Unit price</span><input type="number" value={l.unit} onChange={(e) => setLine(i, { unit: Number(e.target.value) })} /></label>
                <label className="fld"><span>Cost each</span><input type="number" value={l.cost} onChange={(e) => setLine(i, { cost: Number(e.target.value) })} /></label>
                <button className="btn plain" type="button" style={{ alignSelf: "end" }} onClick={() => set({ lines: lines.filter((_, j) => j !== i) })}>Remove</button>
              </div></div>)}
            <button className="btn ghost" type="button" style={{ marginTop: 14 }} onClick={() => set({ lines: [...lines, { desc: "", qty: 1, unit: 0, cost: 0 }] })}>Add a blank line</button>
            <div className="tot"><span>Total</span><b>{money(total)}</b></div>
            <div className="line"><span>Margin</span><b className={margin < 0.4 ? "warn" : "ok"}>{Math.round(margin * 100)}%{margin < 0.4 ? ", below the 40% floor" : ""}</b></div>
          </div>
          <div className="card"><h2>Terms for this client</h2>
            <p className="muted sm" style={{ marginTop: -6 }}>One per line. Payment in advance, bank transfer and AED are always added.</p>
            <textarea rows={4} value={(q.terms || []).join("\n")} onChange={(e) => set({ terms: e.target.value.split("\n") })} placeholder={"Dates: Fri 13 Nov 2026, drop-off at 9:00 am.\nLocation: Dubai."} />
          </div>
        </div>
        <div className="qprev"><QuoteDoc q={q} lines={lines} total={total} S={cat?.settings ?? {}} /></div>
      </div>
    </Full>
  );
}

function QuoteDoc({ q, lines, total, S }: { q: Row; lines: QLine[]; total: number; S: Record<string, string> }) {
  const showDays = lines.some((l) => (l.days || 1) > 1);
  const split = total > 10000;
  const terms = [...(q.terms || []).filter((t: string) => t.trim()),
    split ? `Payment in advance: 50% (AED ${f2(total / 2)}) to confirm the booking, and the balance before the work starts.` : "Payment in advance: the full amount, by bank transfer, to confirm the booking.",
    "Prices are in UAE Dirhams."];
  const fdd = (d?: string) => (d ? new Date(d + "T00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "");
  return (
    <div className="doc">
      <div className="lh"><img src="/img/logo.png" alt="FFP" /><div className="co"><b>{S.public_company || "FIND FIT PEOPLE L.L.C-FZ"}</b>FFP Sports<br />Dubai, United Arab Emirates<br />ffpsports.com</div></div>
      <div className="ttl"><h1>Quotation</h1><div className="refs"><span>Quotation no.</span><b>{q.number}</b><span>Date</span><b>{fdd(q.issue_date)}</b><span>Valid until</span><b>{fdd(q.valid_until)}</b></div></div>
      <div className="to"><div><div className="k">To</div><div className="nm">{q.org || q.attention || "To be confirmed"}</div><div className="ln">{q.org && q.attention ? <>Attention: {q.attention}<br /></> : null}{q.email}</div></div>
        <div><div className="k">From</div><div className="nm">Grant Goes</div><div className="ln">FFP Sports<br />{S.public_email}</div></div></div>
      {q.subject && <div className="subj"><span>Subject</span><b>{q.subject}</b></div>}
      <table><thead><tr><th className="c">#</th><th>Description</th><th className="n">Qty</th>{showDays && <th className="n">Days</th>}<th className="n">Unit price, AED</th><th className="n">Amount, AED</th></tr></thead>
        <tbody>{lines.map((l, i) => <tr key={i}><td className="c">{i + 1}</td><td><b>{l.desc}</b>{l.note && <span>{l.note}</span>}</td><td className="n">{l.qty}</td>{showDays && <td className="n">{l.days || 1}</td>}<td className="n">{f2(l.unit)}</td><td className="n">{f2(lineTotal(l))}</td></tr>)}</tbody></table>
      <div className="totals"><div className="words"><b>Amount in words</b>{words(total)}</div><div className="sum"><div className="tot"><span>Total, AED</span><span>{f2(total)}</span></div></div></div>
      <div className="two sec"><div><div className="k">Terms and conditions</div><ol>{terms.map((t, i) => <li key={i}>{t}</li>)}</ol></div>
        <div><div className="k">Bank details</div><div className="bank"><span>Account name</span><b>{S.public_account_name}</b><span>Bank</span><b>{S.public_bank}</b><span>Account number</span><b>{S.public_account_no}</b><span>IBAN</span><b>{S.public_iban}</b><span>Reference</span><b>{q.number}</b></div></div></div>
      <div className="sign"><div><div className="k">For {S.public_company || "FIND FIT PEOPLE L.L.C-FZ"}</div><div className="line"><span>Signature</span><span>Date</span></div><div className="nm">Grant Goes</div></div>
        <div><div className="k">Accepted by {q.org || "the client"}</div><div className="line"><span>Signature</span><span>Date</span></div><div className="nm">{q.attention}</div></div></div>
      <div className="foot"><span>{q.number}</span><span>Page 1 of 1</span></div>
    </div>
  );
}
