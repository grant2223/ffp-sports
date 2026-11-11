import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { sb } from "../lib/supabase";

type Row = Record<string, any>;
const ToastCtx = createContext<(m: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [m, setM] = useState("");
  const show = useCallback((x: string) => { setM(x); window.clearTimeout((show as any)._t); (show as any)._t = window.setTimeout(() => setM(""), 2600); }, []);
  return <ToastCtx.Provider value={show}>{children}{m && <div className="toast" role="status">{m}</div>}</ToastCtx.Provider>;
}

export const money = (n: number | string | null | undefined) => "AED " + Math.round(Number(n || 0)).toLocaleString("en-US");
export const day = (d?: string | null) => (d ? new Date(d.length === 10 ? d + "T00:00" : d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "");
export const Status = ({ s }: { s: string }) => <span className={"st " + s}>{({ requested: "New request", confirmed: "Awaiting payment", part_paid: "Part paid", paid: "Paid", completed: "Completed", cancelled: "Cancelled", declined: "Declined", draft: "Draft", sent: "Sent", accepted: "Accepted" } as Record<string, string>)[s] || s}</span>;

export function Full({ title, onClose, actions, children }: { title: ReactNode; onClose: () => void; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="full" role="dialog" aria-label={typeof title === "string" ? title : "Details"}>
      <div className="fullbar"><div className="in"><button className="x" type="button" aria-label="Close" onClick={onClose}>×</button><div style={{ fontSize: 18, fontWeight: 800, flex: 1, minWidth: 0 }}>{title}</div>{actions}</div></div>
      <div className="page">{children}</div>
    </div>
  );
}

export interface Col { k: string; label: string; type?: "text" | "num" | "select" | "bool" | "ro"; opts?: [string, string][]; w?: number }

// An editable table. Each row saves on its own Save button, never automatically.
export function EditTable({ table, rows, cols, keyCol = "id", onSaved, extra }: { table: string; rows: Row[]; cols: Col[]; keyCol?: string; onSaved?: () => void; extra?: (r: Row) => ReactNode }) {
  const toast = useToast();
  const [edit, setEdit] = useState<Record<string, Row>>({});
  const val = (r: Row, k: string) => (edit[r[keyCol]]?.[k] ?? r[k]);
  const set = (r: Row, k: string, v: unknown) => setEdit((e) => ({ ...e, [r[keyCol]]: { ...(e[r[keyCol]] || {}), [k]: v } }));
  const save = async (r: Row) => {
    const patch = edit[r[keyCol]]; if (!patch) return;
    const { error } = await sb.from(table).update(patch).eq(keyCol, r[keyCol]);
    if (error) { toast("Not saved: " + error.message); return; }
    setEdit((e) => { const n = { ...e }; delete n[r[keyCol]]; return n; });
    toast("Saved"); onSaved?.();
  };
  return (
    <div className="tablewrap"><table>
      <thead><tr>{cols.map((c) => <th key={c.k} className={c.type === "num" ? "n" : ""} style={c.w ? { width: c.w } : undefined}>{c.label}</th>)}<th style={{ width: 90 }}></th></tr></thead>
      <tbody>{rows.map((r) => (
        <tr key={r[keyCol]}>
          {cols.map((c) => <td key={c.k} className={c.type === "num" ? "n" : ""}>
            {c.type === "ro" ? <span>{String(r[c.k] ?? "")}</span>
              : c.type === "select" ? <select value={String(val(r, c.k) ?? "")} onChange={(e) => set(r, c.k, e.target.value)}>{c.opts!.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
              : c.type === "bool" ? <select value={val(r, c.k) ? "1" : "0"} onChange={(e) => set(r, c.k, e.target.value === "1")}><option value="1">Yes</option><option value="0">No</option></select>
              : <input type={c.type === "num" ? "number" : "text"} value={val(r, c.k) ?? ""} style={c.type === "num" ? { textAlign: "right" } : undefined}
                onChange={(e) => set(r, c.k, c.type === "num" ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value)} />}
          </td>)}
          <td className="n">{extra?.(r)}{edit[r[keyCol]] ? <button className="btn gold" type="button" onClick={() => save(r)}>Save</button> : null}</td>
        </tr>))}
      </tbody>
    </table></div>
  );
}
