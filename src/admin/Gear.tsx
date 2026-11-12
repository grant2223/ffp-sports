import { useCallback, useEffect, useState } from "react";
import { sb } from "../lib/supabase";
import { EditTable, day } from "./kit";

type Row = Record<string, any>;

export function GearTab() {
  const [gear, setGear] = useState<Row[]>([]);
  const [holds, setHolds] = useState<Row[]>([]);
  const load = useCallback(async () => {
    const today = new Date().toISOString().slice(0, 10);
    const [g, h] = await Promise.all([sb.from("gear").select("*").order("sort"),
      sb.from("gear_holds").select("*, bookings!inner(ref,status,first_name,last_name,org,handover)").gte("date_to", today).order("date_from")]);
    setGear(g.data ?? []); setHolds((h.data ?? []).filter((x: Row) => !["cancelled", "declined"].includes(x.bookings.status)));
  }, []);
  useEffect(() => { load(); }, [load]);
  const pb = (g: Row) => (g.purchase_price ? `${Math.ceil(Number(g.purchase_price) / Number(g.price_day))} days` : "");
  return (
    <div className="page">
      <h1>Gear</h1>
      <h2 style={{ marginTop: 24 }}>Out and booked</h2>
      {!holds.length ? <div className="empty">No gear is out or booked from today.</div> :
        <div className="tablewrap"><table><thead><tr><th>Item</th><th className="n">Qty</th><th>From</th><th>To</th><th>Who</th><th>Booking</th></tr></thead>
          <tbody>{holds.map((h) => <tr key={h.id}><td>{gear.find((g) => g.id === h.gear_id)?.name}</td><td className="n">{h.qty}</td><td>{day(h.date_from)}</td><td>{day(h.date_to)}</td>
            <td>{h.bookings.first_name} {h.bookings.last_name}<div className="muted sm">{h.bookings.org}{h.bookings.handover === "delivery" ? ", we deliver" : ", collects"}</div></td><td>{h.bookings.ref}</td></tr>)}</tbody></table></div>}
      <h2 style={{ marginTop: 32 }}>Stock and rental prices</h2>
      <p className="muted" style={{ marginTop: -6 }}>Rental day rate: about 5% of the purchase price for long-life gear, up to 10% for short-life items. Pays back shows how many rental days cover the purchase.</p>
      <EditTable table="gear" rows={gear} onSaved={load} cols={[
        { k: "name", label: "Name" }, { k: "strap", label: "Short line" }, { k: "units", label: "Units owned", type: "num", w: 110 },
        { k: "price_day", label: "AED a day", type: "num", w: 120 }, { k: "purchase_price", label: "Purchase price", type: "num", w: 140 },
        { k: "active", label: "Listed", type: "bool", w: 90 }]} extra={(g) => <span className="muted sm" style={{ marginRight: 8 }}>{pb(g)}</span>} />
    </div>
  );
}
