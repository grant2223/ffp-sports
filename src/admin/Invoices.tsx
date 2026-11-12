import { useCallback, useEffect, useState } from "react";
import { api, sb } from "../lib/supabase";
import { loadCatalogue } from "../lib/catalogue";
import { Full, money, day, Status, useToast } from "./kit";
import { f2, lineTotal, words, type QLine } from "./Quotes";
import "./quote.css";

type Row = Record<string, any>;
const today = () => new Date().toISOString().slice(0, 10);
const fdd = (d?: string) => (d ? new Date(d + "T00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "");

export function Invoices() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [open, setOpen] = useState<string | null>(() => new URLSearchParams(location.search).get("open"));
  const load = useCallback(async () => { const { data } = await sb.from("invoices").select("*").order("created_at", { ascending: false }).limit(300); setRows(data ?? []); }, []);
  useEffect(() => { load(); }, [load]);
  const create = async () => { const { data } = await sb.from("invoices").insert({ lines: [], terms: [] }).select().single(); if (data) { await load(); setOpen(data.id); } };
  const owed = (rows ?? []).filter((r) => ["sent", "part_paid"].includes(r.status)).reduce((t, r) => t + Number(r.total) - Number(r.paid), 0);
  return (
    <div className="page">
      <div className="bar" style={{ marginTop: 0 }}><h1 className="grow">Invoices</h1>{owed > 0 && <span className="muted" style={{ marginRight: 16 }}>Waiting to be paid: <b>{money(owed)}</b></span>}
        <button className="btn gold" type="button" onClick={create}>New invoice</button></div>
      <p className="muted sm" style={{ marginTop: -8 }}>To invoice a quotation, open it in Quotes and press Create invoice.</p>
      {rows === null ? null : !rows.length ? <div className="empty">No invoices yet.</div> :
        <div className="tablewrap"><table><thead><tr><th>Number</th><th>Status</th><th>To</th><th>Subject</th><th className="n">Total</th><th className="n">Still to pay</th><th>Due</th></tr></thead>
          <tbody>{rows.map((v) => <tr key={v.id} className="click" onClick={() => setOpen(v.id)}><td><b>{v.number}</b>{v.quote_number && <div className="muted sm">{v.quote_number}</div>}</td><td><Status s={v.status} /></td>
            <td>{v.org}<div className="muted sm">{v.attention}</div></td><td>{v.subject}</td><td className="n">{money(v.total)}</td><td className="n">{v.status === "void" ? "" : money(Number(v.total) - Number(v.paid))}</td><td className="muted">{day(v.due_date)}</td></tr>)}</tbody></table></div>}
      {open && <InvoiceEditor id={open} onClose={() => { setOpen(null); history.replaceState(null, "", "/admin?tab=invoices"); load(); }} />}
    </div>
  );
}

function InvoiceEditor({ id, onClose }: { id: string; onClose: () => void }) {
  const toast = useToast();
  const [v, setV] = useState<Row | null>(null);
  const [S, setS] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pay, setPay] = useState("");
  useEffect(() => { sb.from("invoices").select("*").eq("id", id).single().then(({ data }) => setV(data)); loadCatalogue(true).then((c) => setS(c.settings)); }, [id]);
  if (!v) return <Full title="Loading…" onClose={onClose}><div /></Full>;
  const lines: QLine[] = v.lines ?? [];
  const total = lines.reduce((t, l) => t + lineTotal(l), 0);
  const locked = v.status === "paid" || v.status === "void";
  const set = (p: Row) => { setV((x) => ({ ...x!, ...p })); setDirty(true); };
  const setLine = (i: number, p: Partial<QLine>) => set({ lines: lines.map((l, j) => (j === i ? { ...l, ...p } : l)) });
  const save = async () => {
    const { error } = await sb.from("invoices").update({ org: v.org, attention: v.attention, email: v.email, subject: v.subject, issue_date: v.issue_date, due_date: v.due_date, lines, terms: v.terms, total }).eq("id", id);
    if (error) toast(error.message); else { setDirty(false); toast("Saved"); }
  };
  const record = async () => {
    const amt = Number(pay); if (!(amt > 0)) { toast("Add the amount received"); return; }
    const paid = Number(v.paid) + amt, status = paid >= total - 0.5 ? "paid" : "part_paid";
    const { error } = await sb.from("invoices").update({ paid, status, paid_at: status === "paid" ? new Date().toISOString() : null }).eq("id", id);
    if (error) toast(error.message); else { setV({ ...v, paid, status }); setPay(""); toast(status === "paid" ? "Marked as paid" : "Payment recorded"); }
  };
  const close = () => { if (dirty && !confirm("You have changes that aren't saved. Close anyway?")) return; onClose(); };
  return (
    <Full title={v.number} onClose={close} actions={<span className="noprint" style={{ display: "flex", gap: 8 }}>
      {dirty && <button className="btn gold" type="button" onClick={save}>Save</button>}
      <button className="btn ghost" type="button" onClick={() => window.print()}>Download PDF</button>
      <button className="btn gold" type="button" disabled={busy || dirty || !v.email || !lines.length || v.status === "void"} onClick={async () => {
        setBusy(true); try { await api("send_invoice", { id }); toast("Invoice emailed to " + v.email); if (v.status === "draft") setV({ ...v, status: "sent" }); } catch (e) { toast((e as Error).message); } finally { setBusy(false); } }}>Email to client</button>
    </span>}>
      <div className="cols" style={{ gridTemplateColumns: "minmax(0,1fr) 820px" }}>
        <div className="stack noprint">
          <div className="card"><h2>Payment</h2>
            <div className="line"><span>Status</span><Status s={v.status} /></div>
            <div className="line"><span>Total</span><b>{money(total)}</b></div>
            <div className="line"><span>Paid</span><b>{money(v.paid)}</b></div>
            <div className="tot"><span>Still to pay</span><b>{money(Math.max(0, total - Number(v.paid)))}</b></div>
            {!locked && <div className="grid2" style={{ marginTop: 12, gridTemplateColumns: "minmax(0,1fr) auto" }}>
              <label className="fld"><span>Amount received, AED</span><input type="number" value={pay} onChange={(e) => setPay(e.target.value)} placeholder={String(Math.max(0, total - Number(v.paid)))} /></label>
              <button className="btn gold" type="button" style={{ alignSelf: "end" }} disabled={dirty} onClick={record}>Record payment</button></div>}
            {v.status !== "void" && v.status !== "paid" && <button className="btn danger" type="button" style={{ marginTop: 12 }} onClick={async () => {
              if (!confirm(`Void ${v.number}? It stays on record but can't be paid.`)) return;
              await sb.from("invoices").update({ status: "void" }).eq("id", id); setV({ ...v, status: "void" }); toast("Invoice voided"); }}>Void invoice</button>}
          </div>
          <div className="card"><h2>Client</h2>
            <div className="grid2">
              <label className="fld"><span>Bill to (company)</span><input disabled={locked} value={v.org} onChange={(e) => set({ org: e.target.value })} /></label>
              <label className="fld"><span>Attention</span><input disabled={locked} value={v.attention} onChange={(e) => set({ attention: e.target.value })} /></label>
              <label className="fld"><span>Email</span><input disabled={locked} type="email" value={v.email} onChange={(e) => set({ email: e.target.value })} /></label>
              <label className="fld"><span>Subject</span><input disabled={locked} value={v.subject} onChange={(e) => set({ subject: e.target.value })} /></label>
              <label className="fld"><span>Date</span><input disabled={locked} type="date" value={v.issue_date || ""} onChange={(e) => set({ issue_date: e.target.value })} /></label>
              <label className="fld"><span>Due date</span><input disabled={locked} type="date" value={v.due_date || ""} min={v.issue_date || today()} onChange={(e) => set({ due_date: e.target.value })} /></label>
            </div></div>
          <div className="card"><h2>Lines</h2>
            {lines.map((l, i) => <div key={i} style={{ marginTop: i ? 14 : 0, paddingTop: i ? 14 : 0, borderTop: i ? "2px solid #F2F2EF" : 0 }}>
              <div className="grid2" style={{ gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr)" }}>
                <label className="fld"><span>Description</span><input disabled={locked} value={l.desc} onChange={(e) => setLine(i, { desc: e.target.value })} /></label>
                <label className="fld"><span>Note under it</span><input disabled={locked} value={l.note || ""} onChange={(e) => setLine(i, { note: e.target.value })} /></label>
              </div>
              <div className="grid4" style={{ marginTop: 8, gridTemplateColumns: "repeat(3,minmax(0,1fr)) auto" }}>
                <label className="fld"><span>Qty</span><input disabled={locked} type="number" value={l.qty} onChange={(e) => setLine(i, { qty: Number(e.target.value) })} /></label>
                <label className="fld"><span>Days</span><input disabled={locked} type="number" value={l.days || 1} onChange={(e) => setLine(i, { days: Number(e.target.value) })} /></label>
                <label className="fld"><span>Unit price</span><input disabled={locked} type="number" value={l.unit} onChange={(e) => setLine(i, { unit: Number(e.target.value) })} /></label>
                {!locked && <button className="btn plain" type="button" style={{ alignSelf: "end" }} onClick={() => set({ lines: lines.filter((_, j) => j !== i) })}>Remove</button>}
              </div></div>)}
            {!locked && <button className="btn ghost" type="button" style={{ marginTop: 14 }} onClick={() => set({ lines: [...lines, { desc: "", qty: 1, unit: 0, cost: 0 }] })}>Add a line</button>}
            <div className="tot"><span>Total</span><b>{money(total)}</b></div>
          </div>
          <div className="card"><h2>Terms for this client</h2>
            <p className="muted sm" style={{ marginTop: -6 }}>One per line. Payment due date, bank transfer, reference and AED are always added.</p>
            <textarea disabled={locked} rows={4} value={(v.terms || []).join("\n")} onChange={(e) => set({ terms: e.target.value.split("\n") })} />
          </div>
        </div>
        <div className="qprev"><InvoiceDoc v={v} lines={lines} total={total} S={S} /></div>
      </div>
    </Full>
  );
}

export function InvoiceDoc({ v, lines, total, S }: { v: Row; lines: QLine[]; total: number; S: Record<string, string> }) {
  const showDays = lines.some((l) => (l.days || 1) > 1);
  const paid = Number(v.paid) || 0, due = Math.max(0, total - paid);
  const terms = [...(v.terms || []).filter((t: string) => t.trim()),
    `Payment in full by ${fdd(v.due_date)}, by bank transfer.`, `Please use ${v.number} as the payment reference.`,
    ...(v.quote_number ? [`Issued against quotation ${v.quote_number}.`] : []), "Prices are in UAE Dirhams."];
  return (
    <div className="doc">
      <div className="lh"><img src="/img/logo.png" alt="FFP" /><div className="co"><b>{S.public_company || "FIND FIT PEOPLE L.L.C-FZ"}</b>FFP Sports<br />Dubai, United Arab Emirates<br />ffpsports.com</div></div>
      <div className="ttl"><h1>{v.status === "void" ? "Invoice (void)" : "Invoice"}</h1><div className="refs"><span>Invoice no.</span><b>{v.number}</b><span>Date</span><b>{fdd(v.issue_date)}</b><span>Due date</span><b>{fdd(v.due_date)}</b></div></div>
      <div className="to"><div><div className="k">Bill to</div><div className="nm">{v.org || v.attention || "To be confirmed"}</div><div className="ln">{v.org && v.attention ? <>Attention: {v.attention}<br /></> : null}{v.email}</div></div>
        <div><div className="k">From</div><div className="nm">Grant Goes</div><div className="ln">FFP Sports<br />{S.public_email}</div></div></div>
      {v.subject && <div className="subj"><span>Subject</span><b>{v.subject}</b></div>}
      <table><thead><tr><th className="c">#</th><th>Description</th><th className="n">Qty</th>{showDays && <th className="n">Days</th>}<th className="n">Unit price, AED</th><th className="n">Amount, AED</th></tr></thead>
        <tbody>{lines.map((l, i) => <tr key={i}><td className="c">{i + 1}</td><td><b>{l.desc}</b>{l.note && <span>{l.note}</span>}</td><td className="n">{l.qty}</td>{showDays && <td className="n">{l.days || 1}</td>}<td className="n">{f2(l.unit)}</td><td className="n">{f2(lineTotal(l))}</td></tr>)}</tbody></table>
      <div className="totals"><div className="words"><b>Amount due in words</b>{words(due)}</div>
        <div className="sum"><div><span>Total, AED</span><span>{f2(total)}</span></div>{paid > 0 && <div><span>Paid</span><span>−{f2(paid)}</span></div>}<div className="tot"><span>Amount due, AED</span><span>{f2(due)}</span></div></div></div>
      <div className="two sec"><div><div className="k">Payment terms</div><ol>{terms.map((t, i) => <li key={i}>{t}</li>)}</ol></div>
        <div><div className="k">Pay by bank transfer</div><div className="bank"><span>Account name</span><b>{S.public_account_name}</b><span>Bank</span><b>{S.public_bank}</b><span>Account number</span><b>{S.public_account_no}</b><span>IBAN</span><b>{S.public_iban}</b><span>Reference</span><b>{v.number}</b></div></div></div>
      <div className="foot"><span>{v.number}</span><span>Page 1 of 1</span></div>
    </div>
  );
}
