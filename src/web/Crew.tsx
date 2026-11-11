import { useEffect, useState } from "react";
import { sb } from "../lib/supabase";

type Role = { id: string; name: string; client_day: number; group_id: string; sort: number };
type Group = { id: string; name: string; sort: number };

// Crew add-ons for a service: the roles in service_roles, grouped as in Admin > Crew and roles, with live day rates.
export function CrewAddons({ svc }: { svc: string }) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [want, setWant] = useState<Set<string>>(new Set());
  useEffect(() => {
    sb.from("role_rates").select("id,name,client_day,group_id,sort").eq("active", true).order("sort").then(({ data }) => setRoles((data as Role[]) ?? []));
    sb.from("service_roles").select("role_id").eq("service_id", svc).then(({ data }) => setWant(new Set((data ?? []).map((r: { role_id: string }) => r.role_id))));
    sb.from("role_groups").select("id,name,sort").order("sort").then(({ data }) => setGroups((data as Group[]) ?? []));
  }, [svc]);
  const shown = groups.map((g) => ({ g, rs: roles.filter((r) => r.group_id === g.id && want.has(r.id)) })).filter((x) => x.rs.length);
  if (!shown.length) return null;
  return (
    <div className="cr">
      <div className="cr-head"><h3>Crew</h3><p>Day rates. Up to 2 hours is half the day rate.</p></div>
      <div className="cr-grid">{shown.map(({ g, rs }) => (
        <div key={g.id} className="cr-g">
          <h4>{g.name}</h4>
          <ul>{rs.map((r) => <li key={r.id}><span>{r.name}</span><b>AED {Number(r.client_day).toLocaleString("en")}</b></li>)}</ul>
        </div>))}
      </div>
    </div>
  );
}
