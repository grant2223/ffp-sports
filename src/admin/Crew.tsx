import { useCallback, useEffect, useState } from "react";
import { sb } from "../lib/supabase";
import { EditTable, Full, money, useToast } from "./kit";

type Row = Record<string, any>;

export function Crew() {
  const [staff, setStaff] = useState<Row[]>([]);
  const [skills, setSkills] = useState<Row[]>([]);
  const [roles, setRoles] = useState<Row[]>([]);
  const [groups, setGroups] = useState<Row[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const load = useCallback(async () => {
    const [s, k, r, g] = await Promise.all([sb.from("staff").select("*").order("first_name"), sb.from("staff_roles").select("*"), sb.from("roles").select("*").order("sort"), sb.from("role_groups").select("*").order("sort")]);
    setStaff(s.data ?? []); setSkills(k.data ?? []); setRoles(r.data ?? []); setGroups(g.data ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);
  return (
    <div className="page">
      <div className="bar" style={{ marginTop: 0 }}><h1 className="grow">Crew and roles</h1><button className="btn gold" type="button" onClick={() => setOpen("new")}>Add a person</button></div>
      {!staff.length ? <div className="empty">No crew yet.</div> :
        <div className="tablewrap"><table><thead><tr><th>Name</th><th>Roles</th><th>Contact</th><th>Access</th></tr></thead>
          <tbody>{staff.map((s) => <tr key={s.id} className="click" onClick={() => setOpen(s.id)}>
            <td><b>{s.first_name} {s.last_name}</b>{!s.active && <div className="muted sm">Inactive</div>}</td>
            <td>{skills.filter((k) => k.staff_id === s.id).map((k) => roles.find((r) => r.id === k.role_id)?.name).join(", ")}</td>
            <td>{s.email}<div className="muted sm">{s.phone}</div></td><td>{s.is_admin ? "Admin" : "Crew"}</td></tr>)}</tbody></table></div>}
      <h2 style={{ marginTop: 32 }}>Roles and day rates</h2>
      <p className="muted" style={{ marginTop: -6 }}>Client rate is what goes on quotes. Cost is what FFP pays. Keep at least a 40% margin.</p>
      {groups.map((g) => <div key={g.id}><p className="grp">{g.name}</p>
        <EditTable table="roles" rows={roles.filter((r) => r.group_id === g.id)} onSaved={load} cols={[
          { k: "name", label: "Role" }, { k: "client_day", label: "Client, AED a day", type: "num", w: 170 }, { k: "cost_day", label: "Cost, AED a day", type: "num", w: 170 }, { k: "active", label: "In use", type: "bool", w: 100 }]}
          extra={(r) => <span className="muted sm" style={{ marginRight: 8 }}>{Number(r.client_day) ? Math.round((1 - Number(r.cost_day) / Number(r.client_day)) * 100) + "%" : ""}</span>} /></div>)}
      {open && <Person id={open} roles={roles} skills={skills} onClose={() => { setOpen(null); load(); }} />}
    </div>
  );
}

function Person({ id, roles, skills, onClose }: { id: string; roles: Row[]; skills: Row[]; onClose: () => void }) {
  const toast = useToast();
  const [p, setP] = useState<Row>({ first_name: "", middle_names: "", last_name: "", email: "", phone: "", is_admin: false, is_crew: true, active: true, notes: "" });
  const [mine, setMine] = useState<Row[]>(skills.filter((k) => k.staff_id === id));
  const [pick, setPick] = useState("");
  useEffect(() => { if (id !== "new") sb.from("staff").select("*").eq("id", id).single().then(({ data }) => data && setP(data)); }, [id]);
  const save = async () => {
    if (!p.first_name || !p.last_name || !/.+@.+\..+/.test(p.email)) { toast("Add first name, last name and email"); return; }
    const row = { first_name: p.first_name, middle_names: p.middle_names, last_name: p.last_name, email: p.email.trim().toLowerCase(), phone: p.phone, is_admin: p.is_admin, is_crew: p.is_crew, active: p.active, notes: p.notes };
    const r = id === "new" ? await sb.from("staff").insert(row).select().single() : await sb.from("staff").update(row).eq("id", id).select().single();
    if (r.error) { toast(r.error.message); return; }
    const sid = r.data.id;
    await sb.from("staff_roles").delete().eq("staff_id", sid);
    if (mine.length) await sb.from("staff_roles").insert(mine.map((m) => ({ staff_id: sid, role_id: m.role_id, day_rate: m.day_rate || null })));
    toast("Saved"); onClose();
  };
  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setP({ ...p, [k]: e.target.value });
  return (
    <Full title={id === "new" ? "Add a person" : `${p.first_name} ${p.last_name}`} onClose={onClose} actions={<button className="btn gold" type="button" onClick={save}>Save</button>}>
      <div className="cols">
        <div className="card"><h2>Details</h2>
          <div className="grid3">
            <label className="fld"><span>First Name</span><input value={p.first_name} onChange={f("first_name")} /></label>
            <label className="fld"><span>Middle Names</span><input value={p.middle_names} onChange={f("middle_names")} /></label>
            <label className="fld"><span>Last Name</span><input value={p.last_name} onChange={f("last_name")} /></label>
          </div>
          <div className="grid2" style={{ marginTop: 12 }}>
            <label className="fld"><span>Email, used to sign in</span><input type="email" value={p.email} onChange={f("email")} /></label>
            <label className="fld"><span>Mobile</span><input type="tel" value={p.phone} onChange={f("phone")} /></label>
            <label className="fld"><span>Access</span><select value={p.is_admin ? "admin" : "crew"} onChange={(e) => setP({ ...p, is_admin: e.target.value === "admin" })}><option value="crew">Crew</option><option value="admin">Admin, full access</option></select></label>
            <label className="fld"><span>Status</span><select value={p.active ? "1" : "0"} onChange={(e) => setP({ ...p, active: e.target.value === "1" })}><option value="1">Active</option><option value="0">Inactive</option></select></label>
          </div>
          <label className="fld" style={{ marginTop: 12 }}><span>Notes</span><textarea rows={3} value={p.notes} onChange={f("notes")} /></label>
        </div>
        <div className="card"><h2>Roles they do</h2>
          <label className="fld"><span>Add a role</span><input list="rlist" value={pick} placeholder="Search roles" onChange={(e) => {
            const r = roles.find((x) => x.name === e.target.value);
            if (r) { if (!mine.some((m) => m.role_id === r.id)) setMine([...mine, { role_id: r.id, day_rate: null }]); setPick(""); } else setPick(e.target.value); }} />
            <datalist id="rlist">{roles.map((r) => <option key={r.id} value={r.name} />)}</datalist></label>
          {mine.map((m, i) => { const r = roles.find((x) => x.id === m.role_id); return (
            <div key={m.role_id} className="line" style={{ alignItems: "center" }}><span style={{ flex: 1 }}>{r?.name}<div className="muted sm">Standard cost {money(r?.cost_day)}</div></span>
              <input type="number" placeholder="Their day rate" value={m.day_rate ?? ""} style={{ width: 150 }} onChange={(e) => setMine(mine.map((x, j) => (j === i ? { ...x, day_rate: e.target.value ? Number(e.target.value) : null } : x)))} />
              <button className="btn plain" type="button" onClick={() => setMine(mine.filter((_, j) => j !== i))}>Remove</button></div>); })}
          {!mine.length && <p className="muted">No roles yet.</p>}
        </div>
      </div>
    </Full>
  );
}
