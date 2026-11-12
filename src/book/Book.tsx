import { useEffect, useMemo, useState } from "react";
import { Shell } from "../site/Static";
import { useCatalogue } from "../lib/catalogue";
import { api, sb } from "../lib/supabase";
import { talentKey, aed, isGear, price, type Catalogue, type Choices, type Dur } from "../lib/pricing";
import { SPORTS, VENUES } from "../lib/lists";
import { PRESETS } from "../web/packages";

interface Details { first_name: string; last_name: string; org: string; email: string; phone: string; date: string; time: string; sport: string; venue: string; address: string; notes: string }
interface State extends Choices { step: number; pkSet: boolean; durSet: boolean; d: Details; code: string; pct: number; codeMsg: string; agree: boolean }

const KEY = "ffpsBooking";
const blankDetails: Details = { first_name: "", last_name: "", org: "", email: "", phone: "", date: "", time: "", sport: "", venue: "", address: "", notes: "" };
const blank: State = { step: 1, svc: "", mode: "crew", pk: "", dur: "2h", on: [], edit: "", eon: [], qty: {}, crewq: {}, talent: [], from: "", to: "", hand: "pickup", setup: false, zone: "dubai",
  pkSet: false, durSet: false, d: blankDetails, code: "", pct: 0, codeMsg: "", agree: false };
const fresh = (svc: string, keep: State): State => ({ ...blank, d: keep.d, zone: keep.zone, svc, mode: svc === "gear" ? "gear" : keep.mode, step: keep.step });

function initial(): State {
  let s: State = blank;
  try { const j = JSON.parse(localStorage.getItem(KEY) || "null"); if (j && typeof j === "object") s = { ...blank, ...j, d: { ...blankDetails, ...(j.d || {}) } }; } catch { /* first visit */ }
  const want = new URLSearchParams(location.search).get("s") || "";
  if (["live", "video", "photo", "pod", "gear"].includes(want) && want !== s.svc) s = { ...fresh(want, s), step: 1 };
  // a package or gear item picked on the site opens the booking with those choices made
  const q = new URLSearchParams(location.search), pre = PRESETS[q.get("p") || ""], g = q.get("g") || "";
  if (pre) s = { ...fresh(pre.svc, s), pk: pre.pk, dur: pre.dur, on: pre.on ?? [], edit: pre.edit ?? "", eon: pre.eon ?? [], pkSet: true, durSet: true, step: 3 };
  else if (g && want === "gear") s = { ...fresh("gear", s), qty: { [g]: 1 }, step: 2 };
  if (pre || g) history.replaceState(null, "", "/book?s=" + s.svc);
  return s;
}

const fd = (v: string) => (v ? new Date(v + "T00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : "");

export function Book() {
  const { cat, error } = useCatalogue();
  const [st, setSt] = useState<State>(initial);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<{ ref: string } | null>(null);
  const [err, setErr] = useState("");
  const [free, setFree] = useState<Record<string, number> | null>(null);

  const put = (p: Partial<State>) => setSt((s) => { const n = { ...s, ...p }; try { localStorage.setItem(KEY, JSON.stringify(n)); } catch { /* private mode */ } return n; });
  useEffect(() => { window.scrollTo(0, 0); }, [st.step]);

  const gear = !!cat && isGear(cat, st);
  // stock for the chosen dates
  useEffect(() => {
    if (!gear || !st.from || !st.to || st.to < st.from) { setFree(null); return; }
    sb.rpc("gear_free", { p_from: st.from, p_to: st.to }).then(({ data }) => {
      const m: Record<string, number> = {}; for (const r of (data ?? []) as { gear_id: string; free: number }[]) m[r.gear_id] = r.free; setFree(m);
    });
  }, [gear, st.from, st.to]);

  if (sent) return <Sent refNo={sent.ref} onAgain={() => { localStorage.removeItem(KEY); setSt(blank); setSent(null); }} />;
  if (!cat) return <Shell><div className="bf"><h1>Book with FFP Sports</h1><p className="shs" style={{ marginTop: 16 }}>{error || "Loading prices…"}</p></div></Shell>;
  return <Flow cat={cat} st={st} put={put} gear={gear} free={free} sending={sending} err={err}
    onSend={async () => {
      setErr(""); setSending(true);
      try {
        const r = await api<{ ref: string }>("create_booking", { choices: pickChoices(st), details: st.d, code: st.pct ? st.code : "" });
        localStorage.removeItem(KEY); setSent(r);
      } catch (e) { setErr((e as Error).message); } finally { setSending(false); }
    }} />;
}

const pickChoices = (s: State): Choices => ({ svc: s.svc, mode: s.mode, pk: s.pk, dur: s.dur, on: s.on, edit: s.edit, eon: s.eon, qty: s.qty, crewq: s.crewq ?? {}, talent: s.talent ?? [], from: s.from, to: s.to, hand: s.hand, setup: s.setup, zone: s.zone });

function Flow({ cat, st, put, gear, free, sending, err, onSend }: {
  cat: Catalogue; st: State; put: (p: Partial<State>) => void; gear: boolean; free: Record<string, number> | null;
  sending: boolean; err: string; onSend: () => void;
}) {
  const sv = cat.services.find((s) => s.id === st.svc);
  const crew = !!sv && !gear;
  const pkgs = sv ? cat.packages.filter((p) => p.service_id === sv.id) : [];
  const multi = crew && pkgs.length > 1;
  const pk = pkgs.find((p) => p.id === st.pk) || pkgs[0];
  // a single-package service has its package chosen for you
  useEffect(() => { if (crew && pk && st.pk !== pk.id) put({ pk: pk.id }); }, [crew, pk, st.pk]); // eslint-disable-line react-hooks/exhaustive-deps
  const picked = crew && (multi ? st.pkSet : true) && st.durSet;
  const choices = pickChoices(st);
  const p = useMemo(() => price(cat, crew && !picked ? { ...choices, pk: "" } : choices, st.pct), [cat, JSON.stringify(choices), st.pct, picked, crew]); // eslint-disable-line react-hooks/exhaustive-deps
  const zone = cat.zones.find((z) => z.id === st.zone) || cat.zones[0];
  const edits = sv ? cat.extras.filter((e) => e.service_id === sv.id && e.kind === "edit_level") : [];
  const eadds = sv ? cat.extras.filter((e) => e.service_id === sv.id && e.kind === "edit_extra") : [];
  const adds = sv ? cat.extras.filter((e) => e.service_id === sv.id && e.kind === "addon") : [];
  const hasEdits = crew && !!sv?.editing && edits.length > 0;
  const editId = st.edit || edits[0]?.id || "";
  const editObj = edits.find((e) => e.id === editId);
  const kits = cat.gear.filter((g) => g.kind === "kit"), items = cat.gear.filter((g) => g.kind === "item");
  const d = st.d;
  const setD = (k: keyof Details) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => put({ d: { ...d, [k]: e.target.value } });

  // ---------- checks ----------
  const need: string[] = [];
  if (st.step === 1 && !sv && st.svc !== "gear") need.push("Pick a service to continue");
  if (st.step === 2 && gear && !Object.values(st.qty).some((q) => q > 0)) need.push("Add at least one item");
  if (st.step === 2 && crew && !picked) need.push(multi && !st.pkSet ? "Choose a package" : "Choose how long");
  if (st.step === 4 && crew) { if (!d.date) need.push("Add your date"); else if (!d.venue) need.push("Add your venue"); }
  if (st.step === 4 && gear) {
    if (!st.from || !st.to) need.push("Add your pick-up and return dates"); else if (st.to < st.from) need.push("Return date is before pick-up");
    else if (st.hand === "delivery" && !d.address) need.push("Add the delivery address");
    else if (free && p.holds.some((h) => h.qty > (free[h.gear_id] ?? 0))) need.push("Some items are booked out for these dates");
  }
  if (st.step === 5) {
    if (!d.first_name || !d.last_name) need.push("Add your first and last name"); else if (!/.+@.+\..+/.test(d.email)) need.push("Add your email");
    else if (!d.phone) need.push("Add your mobile"); 
  }
  if (st.step === 6 && !st.agree) need.push("Tick the agreement to send");
  const ok = need.length === 0 && !sending;
  const labels = ["Service", gear ? "Gear" : "Package", hasEdits ? "Editing" : "Add-ons", gear ? "Dates" : "When and where", "Details", "Send"];
  const title = sv ? "Book " + (gear ? "gear" : sv.name.toLowerCase()) : st.svc === "gear" ? "Book gear" : "Book with FFP Sports";
  const next = () => { if (!ok) return; if (st.step === 6) onSend(); else put({ step: st.step + 1 }); };
  const nextTxt = st.step === 6 ? (sending ? "Sending…" : "Send booking request") : "Continue";

  const services = [...cat.services.map((s) => ({ id: s.id, name: s.name, strap: s.strap, img: s.img })), { id: "gear", name: "Gear rental", strap: "Cameras and kits, run it yourself", img: "/img/stadiumcam.jpg" }];
  const durList: [Dur, string, string, number][] = pk ? [["2h", "Up to 2 hours", "One match or session. Set-up time is free", pk.price_2h], ["day", "Full day", "Up to 8 hours. Set-up time is free", pk.price_day]] : [];
  if (pk && sv?.season) { const m = Number(cat.settings.season_matches || 10), off = Number(cat.settings.season_off || 0.15); durList.push(["season", "Season", `${m} matches, save ${Math.round(off * 100)}%`, pk.price_2h * m * (1 - off)]); }
  const addPrice = (e: (typeof adds)[number]) => (e.per_crew_hour ? Number(cat.settings.extra_hour_client || 750) * Math.max(1, p.crew) : st.dur === "day" ? e.price_day : e.price_2h);
  const qty = (id: string) => st.qty[id] || 0;
  const setQ = (id: string, units: number, delta: number) => put({ qty: { ...st.qty, [id]: Math.max(0, Math.min(units, qty(id) + delta)) } });
  const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  const toggleAdd = (id: string) => {
    const e = adds.find((x) => x.id === id);
    let on = toggle(st.on, id);
    if (e?.pick_group && on.includes(id)) on = on.filter((x) => x === id || adds.find((a) => a.id === x)?.pick_group !== e.pick_group);
    put({ on });
  };
  const svcRoles = sv ? new Set(cat.serviceRoles.filter((r) => r.service_id === sv.id).map((r) => r.role_id)) : new Set<string>();
  const crewRoles = cat.roles.filter((r) => svcRoles.has(r.id));
  const cq = st.crewq ?? {};
  const roleRate = (r: { client_day: number }) => Math.round(Number(r.client_day) * (st.dur === "day" ? 1 : Number(cat.settings.crew_2h_share || 0.5)));
  const setCrew = (id: string, delta: number) => { const n = Math.max(0, Math.min(20, (cq[id] || 0) + delta)); const next = { ...cq }; if (n) next[id] = n; else delete next[id]; put({ crewq: next }); };
  const pickedCrew = crewRoles.filter((r) => cq[r.id]);
  const talentOn = crew && sv && ["live", "pod"].includes(sv.id);
  const tsel = st.talent ?? [];
  const pickedTalent = cat.talent.filter((t) => tsel.includes(talentKey(t)));
  const durName = st.dur === "day" ? "full day" : st.dur === "season" ? "season" : "up to 2 hours";
  const payLines = gear ? (p.deposit ? [{ label: "Refundable deposit, paid with the rental", amt: aed(p.deposit) }] : [])
    : p.split ? [{ label: "To book, 50%", amt: aed(p.total / 2) }, { label: "Before the work starts, 50%", amt: aed(p.total / 2) }] : [];
  const rvAdds = crew ? [...(hasEdits && editObj ? ["Editing: " + editObj.name] : []), ...(editObj?.price_2h ? eadds.filter((a) => st.eon.includes(a.id)).map((a) => a.name) : []), ...adds.filter((a) => st.on.includes(a.id)).map((a) => a.name), ...pickedCrew.map((r) => (cq[r.id] > 1 ? cq[r.id] + " × " : "") + r.name), ...pickedTalent.map((t) => `${t.role_name}: ${t.first_name} ${t.last_name}`)].join(", ") || "None" : st.setup ? "Set-up and handover" : "None";

  return (
    <Shell footer={false}>
      <div className="bf">
        <h1>{title}</h1>
        <div className="steps" role="list">
          {labels.map((l, i) => (
            <button key={l} className={"stp" + (st.step === i + 1 ? " on" : st.step > i + 1 ? " done" : " locked")} type="button" role="listitem" onClick={() => { if (i + 1 < st.step) put({ step: i + 1 }); }}><i></i><span>{l}</span></button>
          ))}
        </div>
        <div className="bfcols">
          <div>
            {st.step === 1 && <div className="st1">
              <h2 className="sh">What do you need?</h2>
              <p className="shs">Pick a service. You can change anything before you send your request.</p>
              <div className="svcs" role="radiogroup" aria-label="Service">
                {services.map((x) => (
                  <button key={x.id} className={"svc" + (st.svc === x.id ? " on" : "")} type="button" role="radio" aria-checked={st.svc === x.id} onClick={() => { if (st.svc !== x.id) put(fresh(x.id, st)); }}>
                    <img src={x.img} alt="" /><span><b>{x.name}</b><small>{x.strap}</small></span>
                  </button>
                ))}
              </div>
              {sv?.gearable && <div className="q"><p className="ql">Who runs it on the day?</p>
                <div className="two" role="radiogroup" aria-label="Who runs it">
                  <button className={"ch" + (st.mode === "crew" ? " on" : "")} type="button" role="radio" aria-checked={st.mode === "crew"} onClick={() => put({ mode: "crew" })}><b>Our crew runs it</b><span>We set up, run it and pack down. Gear included.</span></button>
                  <button className={"ch" + (st.mode === "gear" ? " on" : "")} type="button" role="radio" aria-checked={st.mode === "gear"} onClick={() => put({ mode: "gear" })}><b>Gear only</b><span>Rent the kit and run it yourself.</span></button>
                </div>
              </div>}
            </div>}

            {st.step === 2 && crew && pk && <div className="st2">
              <h2 className="sh">Choose your package</h2>
              <p className="shs">Pick the package, then how long you need us.</p>
              {multi ? <div className="blk"><p className="ql">Package</p>
                <div className="qos c2" role="radiogroup" aria-label="Package">
                  {pkgs.map((x) => <button key={x.id} className={"qo" + (st.pkSet && st.pk === x.id ? " on" : "")} type="button" role="radio" aria-checked={st.pk === x.id} onClick={() => put({ pk: x.id, pkSet: true })}>
                    <img src={x.img} alt="" /><span className="qt"><b>{x.name}</b><small>{x.strap}</small></span><em><i>from</i>{aed(x.price_2h)}</em></button>)}
                </div></div>
                : <div className="blk"><div className="qo" style={{ cursor: "default" }}><img src={pk.img} alt="" /><span className="qt"><b>{pk.name}</b><small>{pk.strap}</small></span></div></div>}
              <div className="blk"><p className="ql">How long?</p>
                <div className="qos c3" role="radiogroup" aria-label="Length">
                  {durList.map(([k, n, l, pr]) => <button key={k} className={"qo qd" + (st.durSet && st.dur === k ? " on" : "")} type="button" role="radio" aria-checked={st.durSet && st.dur === k} onClick={() => put({ dur: k, durSet: true })}>
                    <span className="qt"><b>{n}</b><small>{l}</small></span><em>{aed(pr)}</em></button>)}
                </div></div>
              <div className="blk"><p className="ql">What's included</p>
                <ul className="incg">{pk.items.map((it) => <li key={it.t}>{it.t}</li>)}</ul>
                <details className="incd"><summary>Full details</summary><ul className="inc">{pk.items.map((it) => <li key={it.t}><b>{it.t}</b>{it.d}</li>)}</ul></details>
              </div>
            </div>}

            {st.step === 2 && gear && <div className="st2">
              <h2 className="sh">Choose your gear</h2>
              <p className="shs">Prices are per day. Kits come with batteries, chargers, cables and cases.</p>
              <div className="blk"><p className="ql">Kits</p>
                <div className="qos c2">{kits.map((g) => (
                  <div key={g.id} className={"gk" + (qty(g.id) ? " on" : "")}><img src={g.img} alt="" />
                    <div className="qt"><b>{g.name}</b><small>{g.strap}</small>
                      <div className="kr"><i>{aed(g.price_day)} a day</i><Stepper q={qty(g.id)} dec={() => setQ(g.id, g.units, -1)} inc={() => setQ(g.id, g.units, 1)} /></div></div></div>))}
                </div>
                <details className="incd"><summary>What's in each kit</summary><ul className="inc">{kits.map((g) => <li key={g.id}><b>{g.name}</b>{g.detail}</li>)}</ul></details>
              </div>
              <div className="blk"><p className="ql">Single items</p>
                <div className="xr">{items.map((g) => (
                  <div key={g.id} className="gq"><span className="qt"><b>{g.name}</b><small>{g.strap}</small><i>{aed(g.price_day)} a day</i></span>
                    <Stepper q={qty(g.id)} dec={() => setQ(g.id, g.units, -1)} inc={() => setQ(g.id, g.units, 1)} /></div>))}
                </div></div>
            </div>}

            {st.step === 3 && <div className="st3">
              <h2 className="sh">{hasEdits ? "Editing and extras" : "Add-ons"}</h2>
              <p className="shs">{hasEdits ? "Choose how you want it edited, then add any extras." : crew ? `Optional extras for your ${sv!.name.toLowerCase()}.` : "Optional."}</p>
              {hasEdits && <>
                <div className="blk"><p className="ql">Editing</p>
                  <div className="qos cv" role="radiogroup" aria-label="Editing">{edits.map((e) => (
                    <button key={e.id} className={"qo qv" + (editId === e.id ? " on" : "")} type="button" role="radio" aria-checked={editId === e.id} onClick={() => put({ edit: e.id })}>
                      <img src={e.img} alt="" /><span className="qt"><b>{e.name}</b><small>{e.strap}</small></span><em>{e.price_2h ? aed(e.price_2h) : "Included"}</em></button>))}
                  </div>
                  {editObj && (editObj.details ?? []).length > 0 && <div className="edd"><p><b>{editObj.name}</b>: what you get</p><ul>{editObj.details!.map((d) => <li key={d}>{d}</li>)}</ul></div>}
                </div>
                {!!editObj?.price_2h && <div className="blk"><p className="ql">Editing extras</p>
                  <div className="xr">{eadds.map((a) => <AddRow key={a.id} name={a.name} strap={a.strap} price={a.price_2h} details={a.details} on={st.eon.includes(a.id)} toggle={() => put({ eon: toggle(st.eon, a.id) })} />)}</div>
                </div>}
              </>}
              <div className="blk">{hasEdits && <p className="ql">On the day</p>}
                <div className="xr">
                  {crew && adds.map((a) => <AddRow key={a.id} name={a.name} strap={a.strap} price={addPrice(a)} details={a.details} suffix={st.dur === "season" ? " a match" : ""} on={st.on.includes(a.id)} toggle={() => toggleAdd(a.id)} />)}
                  {gear && <AddRow name="Set-up and handover" strap="An FFP operator sets everything up at your venue and shows your team how to run it." price={Number(cat.settings.setup_handover || 1000)} on={st.setup} toggle={() => put({ setup: !st.setup })} />}
                </div></div>
              {crew && crewRoles.length > 0 && <div className="blk crw"><p className="ql">Extra crew<span className="cnote">{st.dur === "day" ? "Day rates" : st.dur === "season" ? "Per match" : "Up to 2 hours"}</span></p>
                <input className="crw-add" list="crew-roles" placeholder="Search crew roles, e.g. camera operator" value="" onChange={(e) => { const r = crewRoles.find((x) => x.name === e.target.value); if (r) setCrew(r.id, 1); }} />
                <datalist id="crew-roles">{crewRoles.filter((r) => !cq[r.id]).map((r) => <option key={r.id} value={r.name}>{cat.roleGroups.find((g) => g.id === r.group_id)?.name}</option>)}</datalist>
                {pickedCrew.some((r) => r.group_id === "cameras" && r.id !== "camera-assistant") && <p className="cnote2">Camera operators come without a camera. Add a camera from the add-ons above.</p>}
                {pickedCrew.map((r) => <div key={r.id} className="gq"><span className="qt"><b>{r.name}</b><i>{aed(roleRate(r))} each{st.dur === "season" ? " a match" : ""}</i></span>
                  <Stepper q={cq[r.id]} dec={() => setCrew(r.id, -1)} inc={() => setCrew(r.id, 1)} /></div>)}
              </div>}
              {talentOn && <div className="blk tal"><p className="ql">Talent<span className="cnote">Commentators, MCs and hosts set their own rates</span></p>
                {cat.talent.length ? <div className="tal-g">{cat.talent.map((t) => { const k = talentKey(t), on = tsel.includes(k); return (
                  <button key={k} type="button" role="checkbox" aria-checked={on} className={"tal-c" + (on ? " on" : "")} onClick={() => put({ talent: on ? tsel.filter((x) => x !== k) : [...tsel, k] })}>
                    {t.photo_url ? <img src={t.photo_url} alt="" /> : <span className="tal-ph" />}
                    <span className="qt"><b>{t.first_name} {t.last_name}</b><small>{t.role_name}</small><i>{aed(roleRate(t))}{st.dur === "season" ? " a match" : ""}</i></span>
                    <span className={"sw" + (on ? " on" : "")}></span></button>); })}</div>
                : <p className="cnote2">Need a commentator, MC or host? <a href="/estimate?talent=1">Get an estimate</a> and we will match one to your event.</p>}
              </div>}
            </div>}

            {st.step === 4 && crew && <div>
              <h2 className="sh">When and where</h2>
              <p className="shs">Crew travel is included in Dubai. Other emirates are added at the end.</p>
              <div className="fg fg3" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
                <div className="f"><label htmlFor="bd">Date</label><input id="bd" type="date" value={d.date} min={new Date().toISOString().slice(0, 10)} onChange={setD("date")} /></div>
                <div className="f"><label htmlFor="bt">Start time</label><input id="bt" type="time" value={d.time} onChange={setD("time")} /></div>
                <div className="f"><label htmlFor="bsp">Sport</label><input id="bsp" type="text" value={d.sport} placeholder="Search sports" list="bsports" onChange={setD("sport")} /><datalist id="bsports">{SPORTS.map((x) => <option key={x} value={x} />)}</datalist></div>
                <div className="f"><label htmlFor="bz">Emirate</label><select id="bz" value={st.zone} onChange={(e) => put({ zone: e.target.value })}>{cat.zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}</select></div>
                <div className="f m1" style={{ gridColumn: "2 / -1" }}><label htmlFor="bv">Venue</label><input id="bv" type="text" value={d.venue} placeholder="Search venues" list="bvenues" onChange={setD("venue")} /><datalist id="bvenues">{VENUES.map((x) => <option key={x} value={x} />)}</datalist></div>
              </div>
              {d.date && <p className="avail">We confirm the crew and gear for this date before you pay.</p>}
            </div>}

            {st.step === 4 && gear && <div>
              <h2 className="sh">Dates and handover</h2>
              <p className="shs">Rental days run from pick-up to return.</p>
              <div className="fg fg2" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                <div className="f"><label htmlFor="gf">Pick-up date</label><input id="gf" type="date" value={st.from} min={new Date().toISOString().slice(0, 10)} onChange={(e) => put({ from: e.target.value })} /></div>
                <div className="f"><label htmlFor="gt">Return date</label><input id="gt" type="date" value={st.to} min={st.from || undefined} onChange={(e) => put({ to: e.target.value })} /></div>
              </div>
              {free && (p.holds.some((h) => h.qty > (free[h.gear_id] ?? 0))
                ? <p className="avail short">Not enough for these dates: {p.holds.filter((h) => h.qty > (free[h.gear_id] ?? 0)).map((h) => `${cat.gear.find((g) => g.id === h.gear_id)?.name}, ${free[h.gear_id] ?? 0} left`).join("; ")}. Change your dates, lower the number, or <a href="/estimate" style={{ textDecoration: "underline" }}>ask us to source more</a>.</p>
                : <p className="avail">In stock for your dates. We confirm before you pay.</p>)}
              <div className="q"><p className="ql">How do you get it?</p>
                <div className="two" role="radiogroup" aria-label="Handover">
                  <button className={"ch" + (st.hand === "pickup" ? " on" : "")} type="button" role="radio" aria-checked={st.hand === "pickup"} onClick={() => put({ hand: "pickup" })}><b>I collect it</b><span>From FFP in Dubai. Free.</span></button>
                  <button className={"ch" + (st.hand === "delivery" ? " on" : "")} type="button" role="radio" aria-checked={st.hand === "delivery"} onClick={() => put({ hand: "delivery" })}><b>Drop off and pick up</b><span>We bring it to you and collect it after.</span></button>
                </div></div>
              {st.hand === "delivery" && <div className="fg fg2" style={{ marginTop: 12, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                <div className="f"><label htmlFor="gz">Emirate</label><select id="gz" value={st.zone} onChange={(e) => put({ zone: e.target.value })}>{cat.zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}</select></div>
                <div className="f"><label htmlFor="ga">Address</label><input id="ga" type="text" value={d.address} placeholder="Venue or address" onChange={setD("address")} /></div>
              </div>}
            </div>}

            {st.step === 5 && <div>
              <h2 className="sh">Your details</h2>
              <p className="shs">So we can confirm your booking.</p>
              <div className="fg fg2" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                <div className="f"><label htmlFor="dn">First Name</label><input id="dn" type="text" autoComplete="given-name" value={d.first_name} onChange={setD("first_name")} /></div>
                <div className="f"><label htmlFor="dl">Last Name</label><input id="dl" type="text" autoComplete="family-name" value={d.last_name} onChange={setD("last_name")} /></div>
                <div className="f"><label htmlFor="de">Email</label><input id="de" type="email" autoComplete="email" value={d.email} placeholder="you@club.com" onChange={setD("email")} /></div>
                <div className="f"><label htmlFor="dp">Mobile</label><input id="dp" type="tel" autoComplete="tel" value={d.phone} placeholder="+971 50 000 0000" onChange={setD("phone")} /></div>
                <div className="f" style={{ gridColumn: "1 / -1" }}><label htmlFor="do">Club or company</label><input id="do" type="text" value={d.org} onChange={setD("org")} /></div>
              </div>
              <div className="f" style={{ marginTop: 14 }}><label htmlFor="dx">Anything we should know</label><textarea id="dx" rows={3} value={d.notes} placeholder="Teams, schedule, where the stream should go" onChange={setD("notes")} /></div>
              <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
                <div className="f" style={{ flex: 1 }}><label htmlFor="dc">Partner code, if you have one</label><input id="dc" type="text" value={st.code} placeholder="Enter code" onChange={(e) => put({ code: e.target.value, pct: 0, codeMsg: "" })} /></div>
                <button className="btn ghost" type="button" onClick={async () => { if (!st.code) return; try { const r = await api<{ pct: number }>("check_code", { code: st.code }); put({ pct: r.pct, codeMsg: r.pct ? "Partner discount applied." : "That code isn't valid." }); } catch { put({ codeMsg: "Couldn't check the code. Try again." }); } }}>Apply</button>
              </div>
              {st.codeMsg && <p className="avail">{st.codeMsg}</p>}
            </div>}

            {st.step === 6 && <div>
              <h2 className="sh">Check and send</h2>
              <p className="shs">Nothing to pay yet. We confirm the crew and gear first.</p>
              <div className="rv"><h3>{gear ? "Gear" : "Package"}<button type="button" onClick={() => put({ step: 2 })}>Change</button></h3>
                <p>{crew && pk ? `${pk.name}, ${durName}` : p.lines.filter((l) => / day/.test(l.label)).map((l) => l.label).join(". ")}</p>
                {crew && pk && <ul className="inc">{pk.items.map((it) => <li key={it.t}><b>{it.t}</b></li>)}</ul>}</div>
              <div className="rv"><h3>{hasEdits ? "Editing and extras" : "Add-ons"}<button type="button" onClick={() => put({ step: 3 })}>Change</button></h3><p>{rvAdds}</p></div>
              <div className="rv"><h3>{gear ? "Dates and handover" : "When and where"}<button type="button" onClick={() => put({ step: 4 })}>Change</button></h3>
                <p>{crew ? [fd(d.date), d.time, d.sport, d.venue, zone?.name].filter(Boolean).join(", ") : `${fd(st.from)} to ${fd(st.to)}. ${st.hand === "delivery" ? `Drop off and pick up at ${d.address}, ${zone?.name}` : "Collect from FFP in Dubai"}`}</p></div>
              <div className="rv"><h3>Your details<button type="button" onClick={() => put({ step: 5 })}>Change</button></h3><p>{[`${d.first_name} ${d.last_name}`, d.org, d.email, d.phone].filter((x) => x.trim()).join(", ")}</p></div>
              <div className="rv"><h3>Price</h3>
                {p.lines.map((l, i) => <div key={i} className="line"><span>{l.label}</span><b>{aed(l.v)}</b></div>)}
                <div className="big"><span style={{ fontWeight: 700 }}>Total</span><b>{aed(p.total)}</b></div>
                {payLines.map((l) => <div key={l.label} className="line"><span>{l.label}</span><b>{l.amt}</b></div>)}
                <p className="next">Nothing to pay yet. We confirm the crew and gear for your date, then send your confirmation with {cat.settings.public_bank || "our bank"} details. {p.split ? "Pay 50% to book." : "Payment in full books it."}</p>
              </div>
              <button type="button" onClick={() => put({ agree: !st.agree })} style={{ marginTop: 14, minHeight: 48, width: "100%", display: "flex", gap: 12, alignItems: "center", padding: 0, border: 0, background: "none", fontFamily: "inherit", fontSize: 15, color: "#344054", cursor: "pointer", textAlign: "left" }}>
                <span className={"cb" + (st.agree ? " on" : "")}></span><span>I accept the booking agreement</span></button>
              <details className="agr"><summary>Read the booking agreement</summary><ul>
                <li>Your price is fixed once we confirm your booking. Extra time on the day is charged at the extra hour rate.</li>
                <li>Payment is in advance by bank transfer. Over AED 10,000, pay 50% to book and the rest before the work starts.</li>
                <li>Gear rental is paid in full in advance. There is no deposit: you leave your Emirates ID with us at pick-up or delivery, and we hand it back when the gear is returned.</li>
                <li>You pay the repair cost of anything damaged while the gear is with you, or the replacement cost if it is lost or can't be repaired.</li>
                <li>Change your date free of charge up to 7 days before.</li>
                <li>Cancel more than 7 days before: full refund. 2 to 7 days before: 50% refund. Less than 48 hours: no refund.</li>
                <li>You arrange venue access and a power point near the camera position.</li>
              </ul></details>
              {err && <p className="next">{err}</p>}
            </div>}

            <div className="nav">
              {st.step > 1 ? <button className="btn ghost" type="button" onClick={() => put({ step: st.step - 1 })}>Back</button> : <span></span>}
              {ok ? <button className="btn gold" type="button" onClick={next}>{nextTxt}</button> : <span className="need">{sending ? "Sending…" : need[0]}</span>}
            </div>
          </div>

          <aside className="side" aria-label="Your booking">
            <h3>Your booking</h3>
            {!p.lines.length && <p className="empty">Your choices show here.</p>}
            {p.lines.map((l, i) => <div key={i} className="line"><span>{l.label}</span><b>{aed(l.v)}</b></div>)}
            <div className="tot"><span>Total</span><b>{aed(p.total)}</b></div>
          </aside>
        </div>
        <div className="fbar"><div><div style={{ fontSize: 13, color: "#475467" }}>Total</div><div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>{aed(p.total)}</div></div>
          {ok ? <button className="btn gold" type="button" onClick={next}>{st.step === 6 ? (sending ? "Sending…" : "Send request") : "Continue"}</button>
            : <span className="need" style={{ fontSize: 13, color: "#5b6270", textAlign: "right", maxWidth: "55%" }}>{need[0]}</span>}
        </div>
      </div>
    </Shell>
  );
}

function Stepper({ q, dec, inc }: { q: number; dec: () => void; inc: () => void }) {
  return <div className="stepper"><button type="button" aria-label="Fewer" onClick={dec}>−</button><b>{q}</b><button type="button" aria-label="More" onClick={inc}>+</button></div>;
}

function AddRow({ name, strap, price, suffix = "", on, toggle, details = [] }: { name: string; strap: string; price: number; suffix?: string; on: boolean; toggle: () => void; details?: string[] }) {
  return <div className="xw">
    <button className="xi" type="button" role="checkbox" aria-checked={on} onClick={toggle}>
      <span className="qt"><span className="xh"><b>{name}</b><i className="xp">+ {aed(price)}{suffix}</i></span><small>{strap}</small></span><span className={"sw" + (on ? " on" : "")}></span></button>
    {details.length > 0 && <details className="xd"><summary>What you get</summary><ul>{details.map((d) => <li key={d}>{d}</li>)}</ul></details>}
  </div>;
}

function Sent({ refNo, onAgain }: { refNo: string; onAgain: () => void }) {
  return (
    <Shell>
      <div className="bf"><div className="okp">
        <h1>Request sent</h1>
        <p className="shs" style={{ marginTop: 10 }}>Reference {refNo}. A copy is in your email.</p>
        <ol>
          <li><b>We check the crew and gear</b><span>For your date and venue. Usually within a few hours, always within 24.</span></li>
          <li><b>You get your confirmation</b><span>Your final price, with our bank details to pay.</span></li>
          <li><b>Pay to lock it in</b><span>Your booking is confirmed when payment is received.</span></li>
        </ol>
        <div style={{ marginTop: 24, display: "flex", gap: 12, flexWrap: "wrap" }}><a className="btn gold" href="/">Back to home</a><button className="btn ghost" type="button" onClick={onAgain}>Book something else</button></div>
      </div></div>
    </Shell>
  );
}
