import { useCallback, useEffect, useState } from "react";
import { sb } from "../lib/supabase";
import { loadCatalogue } from "../lib/catalogue";
import { EditTable } from "./kit";

type Row = Record<string, any>;

export function Prices() {
  const [pk, setPk] = useState<Row[]>([]); const [ex, setEx] = useState<Row[]>([]); const [zones, setZones] = useState<Row[]>([]); const [svcs, setSvcs] = useState<Row[]>([]);
  const load = useCallback(async () => {
    const [a, b, c, e] = await Promise.all([sb.from("packages").select("*").order("service_id").order("sort"), sb.from("extras").select("*").order("service_id").order("kind").order("sort"),
      sb.from("zones").select("*").order("sort"), sb.from("services").select("*").order("sort")]);
    setPk(a.data ?? []); setEx(b.data ?? []); setZones(c.data ?? []); setSvcs(e.data ?? []); loadCatalogue(true);
  }, []);
  useEffect(() => { load(); }, [load]);
  const KIND: Record<string, string> = { addon: "Add-ons on the day", edit_level: "Editing levels", edit_extra: "Editing extras" };
  return (
    <div className="page">
      <h1>Prices</h1>
      <p className="muted">Changes show on the booking page as soon as you save. Cost is what FFP pays, used for the margin check.</p>
      {svcs.map((s) => <div key={s.id}>
        <h2 style={{ marginTop: 32 }}>{s.name}</h2>
        <p className="grp">Packages</p>
        <EditTable table="packages" rows={pk.filter((p) => p.service_id === s.id)} onSaved={load} cols={[
          { k: "name", label: "Name" }, { k: "strap", label: "Short line" }, { k: "crew", label: "Crew", type: "num", w: 80 },
          { k: "price_2h", label: "2 hours", type: "num", w: 110 }, { k: "price_day", label: "Full day", type: "num", w: 110 }, { k: "cost_2h", label: "Cost 2 h", type: "num", w: 110 }, { k: "cost_day", label: "Cost day", type: "num", w: 110 }]} />
        {Object.entries(KIND).map(([k, l]) => { const rows = ex.filter((e) => e.service_id === s.id && e.kind === k); return rows.length ? <div key={k}><p className="grp">{l}</p>
          <EditTable table="extras" rows={rows} onSaved={load} cols={[
            { k: "name", label: "Name" }, { k: "strap", label: "Short line" },
            ...(k === "addon" ? [{ k: "price_2h", label: "With 2 hours", type: "num" as const, w: 120 }, { k: "price_day", label: "With full day", type: "num" as const, w: 120 }, { k: "cost_2h", label: "Cost 2 h", type: "num" as const, w: 110 }, { k: "cost_day", label: "Cost day", type: "num" as const, w: 110 }]
              : [{ k: "price_2h", label: "Price", type: "num" as const, w: 120 }, { k: "cost_2h", label: "Cost", type: "num" as const, w: 120 }]),
            { k: "active", label: "Offered", type: "bool", w: 100 }]} /></div> : null; })}
      </div>)}
      <h2 style={{ marginTop: 32 }}>Emirates, travel and delivery</h2>
      <EditTable table="zones" rows={zones} onSaved={load} cols={[{ k: "name", label: "Emirate" }, { k: "travel_per_crew", label: "Crew travel, per crew per day", type: "num", w: 220 }, { k: "delivery", label: "Gear drop-off plus pick-up", type: "num", w: 220 }]} />
    </div>
  );
}
