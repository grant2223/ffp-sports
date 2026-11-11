import { useCallback, useEffect, useState } from "react";
import { api, sb } from "../lib/supabase";
import { day, useToast } from "./kit";

type Row = Record<string, any>;
const LABELS: [string, string][] = [
  ["public_company", "Company name"], ["public_account_name", "Bank account name"], ["public_bank", "Bank"], ["public_account_no", "Account number"], ["public_iban", "IBAN"],
  ["public_phone", "Phone on the site"], ["public_email", "Email on the site"], ["public_site_url", "Site address, used in emails"],
  ["admin_emails", "Who gets new booking alerts (comma separated)"], ["email_from", "Emails come from"],
  ["margin_floor", "Margin floor (0.40 = 40%)"], ["split_over", "Pay 50% to book when over (AED)"], ["season_matches", "Season, number of matches"], ["season_off", "Season discount (0.15 = 15%)"],
  ["extra_hour_client", "Extra hour, client price per crew"], ["extra_hour_cost", "Extra hour, cost per crew"], ["rent_off_3", "Gear, 3+ days discount"], ["rent_off_7", "Gear, 7+ days discount"],
  ["setup_handover", "Gear set-up and handover (AED)"], ["quote_valid_days", "Quotes valid for (days)"]];

export function SettingsTab() {
  const toast = useToast();
  const [vals, setVals] = useState<Record<string, string>>({});
  const [edit, setEdit] = useState<Record<string, string>>({});
  const [log, setLog] = useState<Row[]>([]);
  const [to, setTo] = useState("");
  const load = useCallback(async () => {
    const [s, l] = await Promise.all([sb.from("settings").select("*"), sb.from("email_log").select("*").order("id", { ascending: false }).limit(40)]);
    const m: Record<string, string> = {}; for (const r of s.data ?? []) m[r.key] = r.value; setVals(m); setLog(l.data ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);
  const save = async () => {
    const rows = Object.entries(edit).map(([key, value]) => ({ key, value }));
    const { error } = await sb.from("settings").upsert(rows);
    if (error) toast(error.message); else { setEdit({}); toast("Saved"); load(); }
  };
  return (
    <div className="page">
      <div className="bar" style={{ marginTop: 0 }}><h1 className="grow">Settings</h1>{Object.keys(edit).length > 0 && <button className="btn gold" type="button" onClick={save}>Save</button>}</div>
      <div className="card"><div className="grid2">{LABELS.map(([k, l]) => <label key={k} className="fld"><span>{l}</span><input value={edit[k] ?? vals[k] ?? ""} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} /></label>)}</div></div>
      <h2 style={{ marginTop: 32 }}>Emails sent</h2>
      <div className="bar" style={{ marginTop: 0 }}>
        <label className="fld" style={{ width: 320 }}><span>Send a test email to</span><input type="email" value={to} onChange={(e) => setTo(e.target.value)} /></label>
        <button className="btn ghost" type="button" disabled={!to} onClick={async () => { try { const r = await api<{ ok: boolean; error: string }>("test_email", { to }); toast(r.ok ? "Test email sent" : "Not sent: " + r.error); load(); } catch (e) { toast((e as Error).message); } }}>Send test</button>
      </div>
      {!log.length ? <div className="empty">No emails yet.</div> :
        <div className="tablewrap"><table><thead><tr><th>When</th><th>To</th><th>Subject</th><th>Result</th></tr></thead>
          <tbody>{log.map((r) => <tr key={r.id}><td className="muted">{day(r.created_at)}</td><td>{r.to_email}</td><td>{r.subject}</td><td>{r.ok ? <span className="ok">Sent</span> : <span className="warn">{r.error}</span>}</td></tr>)}</tbody></table></div>}
    </div>
  );
}
