import { useState } from "react";
import { Shell } from "../site/Static";
import { api } from "../lib/supabase";
import { useCatalogue } from "../lib/catalogue";
import { aed } from "../lib/pricing";
import { SPORTS, VENUES } from "../lib/lists";

const ADDS = [
  { name: "Graphics and stats operator", desc: "Custom graphics, live player stats and sponsor slides on every court.", p2: 2000, pd: 4000, per: "court" },
  { name: "Commentator, club level", desc: "A commentator on your main court or pitch.", p2: 1000, pd: 2000, per: "event" },
  { name: "Commentator, national level", desc: "An experienced broadcast commentator on your main court.", p2: 4250, pd: 8500, per: "event" },
  { name: "Daily highlights reel", desc: "A reel of each day for social, by the next morning.", p2: 600, pd: 600, per: "court" },
  { name: "Photographer", desc: "A specialist sports photographer, gallery within 48 hours.", p2: 2500, pd: 5000, per: "event" },
  { name: "Videographer", desc: "A specialist videographer for interviews and highlights footage.", p2: 2500, pd: 5000, per: "event" },
  { name: "vMix production system", desc: "Our vMix PC for big shows: more cameras, replays and advanced graphics.", p2: 2000, pd: 2000, per: "event" },
];
const PREP: Record<string, [number, number, string]> = { none: [0, 0, ""], half: [2000, 1, "Half-day set-up"], full: [4000, 1, "Full-day set-up"], tech: [6000, 1, "Set-up and technical rehearsal"], live: [10000, 2, "Set-up, technical and live rehearsal"] };
const REC: Record<string, string> = { none: "no set-up day", half: "a half-day set-up", full: "a full-day set-up", tech: "a full-day set-up and a technical rehearsal", live: "set-up and both rehearsals" };

export function Estimate() {
  const { cat } = useCatalogue();
  const talent = new URLSearchParams(location.search).get("talent") === "1";
  const [s, setS] = useState({ days: 2, courts: 2, cams: 2, hours: 8, level: "club", zone: "dubai", prep: "auto", on: (talent ? { 1: true } : {}) as Record<number, boolean> });
  const [f, setF] = useState({ link: "", name: "", sport: "", type: "Tournament", date: "", venue: "", matches: "", first: "", last_match: "", notes: talent ? "We'd like to book talent: " : "", first_name: "", last_name: "", org: "", email: "", phone: "" });
  const [sent, setSent] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const ff = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const zt = Number(cat?.zones.find((z) => z.id === s.zone)?.travel_per_crew ?? 0);
  const match = s.hours <= 2 && s.level === "club";
  const multi = s.cams >= 2, ops = multi ? 2 : 1;
  const pkgDay = multi ? (match ? 5000 : 10000) : (match ? 2500 : 5000);
  const overtime = Math.max(0, s.hours - 8) * 750 * ops;
  const extraCams = Math.max(0, s.cams - 3) * (match ? 2000 : 4000);
  const perCourtDay = pkgDay + overtime + extraCams;
  const addTotal = ADDS.reduce((t, a, i) => t + (s.on[i] ? (match ? a.p2 : a.pd) * (a.per === "court" ? s.courts : 1) : 0), 0);
  const crewN = ops * s.courts + Math.max(0, s.cams - 3) * s.courts + ADDS.reduce((t, a, i) => t + (s.on[i] && a.name !== "Daily highlights reel" && a.name !== "vMix production system" ? (a.per === "court" ? s.courts : 1) : 0), 0);
  const vmixOn = ADDS.some((a, i) => s.on[i] && a.name === "vMix production system");
  const prodCrew = ops * s.courts + Math.max(0, s.cams - 3) * s.courts + (s.on[0] ? s.courts : 0);
  const rec = vmixOn || s.level === "international" || s.courts >= 4 ? "tech" : s.level === "national" || s.cams >= 3 || s.courts >= 3 ? "full" : s.courts >= 2 ? "half" : "none";
  const prep = s.prep !== "auto" ? s.prep : rec;
  const prepAmt = PREP[prep][0] * prodCrew;
  const travel = zt * crewN * s.days + zt * prodCrew * PREP[prep][1];
  const cover = perCourtDay * s.courts * s.days;
  const total = (perCourtDay * s.courts + addTotal) * s.days + prepAmt + travel;
  const levelTxt = s.level === "club" ? "Club or school" : s.level === "national" ? "National" : "International";
  const lines = [{ label: `Livestream, ${s.courts} ${s.courts > 1 ? "courts" : "court"}, ${s.cams} ${s.cams > 1 ? "cameras" : "camera"} each, ${s.hours} hours, ${s.days} ${s.days > 1 ? "days" : "day"}`, v: cover },
    ...ADDS.map((a, i) => (s.on[i] ? { label: a.name, v: (match ? a.p2 : a.pd) * (a.per === "court" ? s.courts : 1) * s.days } : null)).filter(Boolean) as { label: string; v: number }[],
    ...(prepAmt ? [{ label: `${PREP[prep][2]}, ${prodCrew} crew`, v: prepAmt }] : []), ...(travel ? [{ label: "Travel to your venue", v: travel }] : [])];
  const step = (k: "days" | "courts" | "cams" | "hours", name: string, desc: string, min: number, max: number) => (
    <div key={k} className="adr" style={{ cursor: "default" }}>
      <span className="t"><b>{name}</b><span>{desc}</span></span>
      <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button className="btn ghost" type="button" aria-label="Fewer" onClick={() => setS({ ...s, [k]: Math.max(min, s[k] - 1) })} style={{ width: 44, height: 44, padding: 0, fontSize: 22 }}>−</button>
        <span style={{ minWidth: 28, textAlign: "center", fontSize: 20, fontWeight: 800 }}>{s[k]}</span>
        <button className="btn ghost" type="button" aria-label="More" onClick={() => setS({ ...s, [k]: Math.min(max, s[k] + 1) })} style={{ width: 44, height: 44, padding: 0, fontSize: 22 }}>+</button>
      </span>
    </div>);
  const submit = async () => {
    setErr("");
    if (!f.first_name || !f.last_name) return setErr("Add your first and last name");
    if (!/.+@.+\..+/.test(f.email)) return setErr("Add your email");
    setBusy(true);
    try {
      const notes = [f.name && `Event: ${f.name}`, f.type && `Type: ${f.type}`, `Level: ${levelTxt}`, f.link && `FFP event link: ${f.link}`, f.matches && `Matches per day: ${f.matches}`, (f.first || f.last_match) && `Matches from ${f.first} to ${f.last_match}`, f.notes].filter(Boolean).join("\n");
      const r = await api<{ ref: string }>("request_estimate", { details: { first_name: f.first_name, last_name: f.last_name, org: f.org, email: f.email, phone: f.phone, date: f.date, sport: f.sport, venue: f.venue, notes }, brief: { ...s, prep, total }, lines });
      setSent(r.ref);
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };
  if (sent) return <Shell><div className="bf"><div className="okp"><h1>Your estimate is on its way</h1><p className="shs" style={{ marginTop: 10 }}>Reference {sent}. A copy is in your email.</p>
    <ol><li><b>We check your details</b><span>Courts, schedule and crew, usually within 24 hours.</span></li><li><b>You get your quotation</b><span>The final price, ready to book online.</span></li><li><b>Pay to lock it in</b><span>Your booking is confirmed when payment is received.</span></li></ol>
    <div style={{ marginTop: 24 }}><a className="btn gold" href="/">Back to home</a></div></div></div></Shell>;

  return (
    <Shell>
      <div style={{ background: "#ffffff" }}>
        <div className="wrapb" style={{ paddingTop: "clamp(24px, 3.5vw, 40px)", paddingBottom: 64 }}>
          <h1 style={{ margin: 0, fontSize: "clamp(30px, 3.4vw, 44px)", fontWeight: 800, letterSpacing: "-0.04em" }}>Get an estimate</h1>
          <p className="sub" style={{ marginTop: 8 }}>For tournaments, multi-day events and several courts or pitches. Your estimate updates as you fill this in.</p>
          <div className="bcols" style={{ marginTop: 24, display: "flex", gap: 24, alignItems: "flex-start" }}>
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 20 }}>
              <section className="bsec"><h2>Is your event on the FFP app?</h2>
                <div className="f"><label htmlFor="qlink">FFP event link</label><input id="qlink" type="url" placeholder="Paste your event link" value={f.link} onChange={ff("link")} /></div>
                <p className="hint">We fill in your dates, courts, teams and match schedule from the app, so you only check them.</p></section>
              <section className="bsec"><h2>Your event</h2>
                <div className="fg fg3" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
                  <div className="f m1"><label htmlFor="qn">Event name</label><input id="qn" type="text" placeholder="e.g. Dubai Padel Open" value={f.name} onChange={ff("name")} /></div>
                  <div className="f m1"><label htmlFor="qsp">Sport</label><input id="qsp" type="text" placeholder="Search sports" list="qsports" value={f.sport} onChange={ff("sport")} /><datalist id="qsports">{SPORTS.map((x) => <option key={x} value={x} />)}</datalist></div>
                  <div className="f m1"><label htmlFor="qlv">Level</label><select id="qlv" value={s.level} onChange={(e) => setS({ ...s, level: e.target.value })}><option value="club">Club or school</option><option value="national">National</option><option value="international">International</option></select></div>
                  <div className="f m1"><label htmlFor="qt">Event type</label><select id="qt" value={f.type} onChange={ff("type")}><option>Tournament</option><option>League round</option><option>Championship</option><option>Race or festival</option><option>Something else</option></select></div>
                  <div className="f"><label htmlFor="qs">First day</label><input id="qs" type="date" value={f.date} onChange={ff("date")} /></div>
                  <div className="f m1"><label htmlFor="qz">Emirate</label><select id="qz" value={s.zone} onChange={(e) => setS({ ...s, zone: e.target.value })}>{(cat?.zones ?? [{ id: "dubai", name: "Dubai" }]).map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}</select></div>
                  <div className="f"><label htmlFor="qv">Venue</label><input id="qv" type="text" placeholder="Search venues" list="qvenues" value={f.venue} onChange={ff("venue")} /><datalist id="qvenues">{VENUES.map((x) => <option key={x} value={x} />)}</datalist></div>
                </div></section>
              <section className="bsec"><h2>Your schedule</h2>
                {step("days", "Days", "How many days the event runs.", 1, 10)}{step("courts", "Courts or pitches", "Each one gets its own stream.", 1, 12)}
                {step("cams", "Cameras per court", "1 camera, or 2 to 3 with our multi-camera kit. More adds an operator each.", 1, 6)}{step("hours", "Hours on air per day", "2 hours or less is priced per match. More is priced as a full day.", 2, 12)}
                <div className="fg fg3" style={{ marginTop: 14, gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
                  <div className="f"><label htmlFor="qm">Matches per day</label><input id="qm" type="number" min="1" placeholder="e.g. 12" value={f.matches} onChange={ff("matches")} /></div>
                  <div className="f"><label htmlFor="qst">First match</label><input id="qst" type="time" value={f.first} onChange={ff("first")} /></div>
                  <div className="f"><label htmlFor="qen">Last match ends</label><input id="qen" type="time" value={f.last_match} onChange={ff("last_match")} /></div>
                </div></section>
              <section className="bsec"><h2>Coverage</h2>
                {ADDS.map((a, i) => <button key={a.name} className={i === 0 ? "adr first" : "adr"} type="button" role="checkbox" aria-checked={!!s.on[i]} onClick={() => setS({ ...s, on: { ...s.on, [i]: !s.on[i] } })}>
                  <span className="t"><b>{a.name}</b><span>{a.desc}</span></span><span className={s.on[i] ? "sw on" : "sw"}></span></button>)}</section>
              <section className="bsec"><h2>Set-up and rehearsal</h2>
                <p className="hint" style={{ marginTop: 0 }}>Bigger jobs need us in the venue before day one. We recommend <b style={{ fontWeight: 700 }}>{REC[rec]}</b> for what you have chosen.</p>
                <div className="f" style={{ marginTop: 10 }}><label htmlFor="qprep">What you need</label><select id="qprep" value={s.prep} onChange={(e) => setS({ ...s, prep: e.target.value })}>
                  <option value="auto">Use the recommendation</option><option value="none">No set-up day, we set up on the morning</option><option value="half">Half-day set-up the day before</option>
                  <option value="full">Full-day set-up the day before</option><option value="tech">Full-day set-up and a technical rehearsal</option><option value="live">Set-up, technical rehearsal and a live rehearsal (2 days)</option></select></div></section>
              <section className="bsec"><h2>Tell us more</h2>
                <div className="f"><label htmlFor="qx">The more detail, the more accurate your estimate</label><textarea id="qx" rows={6} value={f.notes} onChange={ff("notes")} placeholder="Teams and number of matches. Key moments such as finals and presentations. Sponsors to show on screen. Where the stream should go. Anything special about the venue, such as no power near the pitch." /></div></section>
              <section className="bsec"><h2>Your details</h2>
                <div className="fg fg2" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                  <div className="f"><label htmlFor="qf">First Name</label><input id="qf" type="text" autoComplete="given-name" value={f.first_name} onChange={ff("first_name")} /></div>
                  <div className="f"><label htmlFor="ql">Last Name</label><input id="ql" type="text" autoComplete="family-name" value={f.last_name} onChange={ff("last_name")} /></div>
                  <div className="f m1"><label htmlFor="qo">Club or organisation</label><input id="qo" type="text" placeholder="e.g. Dubai Hurricanes" value={f.org} onChange={ff("org")} /></div>
                  <div className="f m1"><label htmlFor="qe">Email</label><input id="qe" type="email" placeholder="you@club.com" value={f.email} onChange={ff("email")} /></div>
                  <div className="f m1"><label htmlFor="qp">Mobile</label><input id="qp" type="tel" placeholder="+971 50 000 0000" value={f.phone} onChange={ff("phone")} /></div>
                </div></section>
            </div>
            <aside id="summary" className="bsec sum" aria-label="Estimate summary">
              <div style={{ fontSize: 18, fontWeight: 800 }}>Your estimate</div>
              <div style={{ marginTop: 12, paddingTop: 6, borderTop: "2px solid #eef1f5" }}>
                <div className="line"><span>Level</span><b>{levelTxt}</b></div><div className="line"><span>Courts</span><b>{s.courts}</b></div>
                <div className="line"><span>Days</span><b>{s.days}</b></div><div className="line"><span>Cameras per court</span><b>{s.cams}</b></div><div className="line"><span>Hours per day</span><b>{s.hours}</b></div>
                {ADDS.map((a, i) => s.on[i] && <div key={a.name} className="line"><span>{a.name}</span><b>Added</b></div>)}
                {prepAmt > 0 && <div className="line"><span>{PREP[prep][2]}, {prodCrew} crew</span><b>{aed(prepAmt)}</b></div>}
                {travel > 0 && <div className="line"><span>Travel to your venue</span><b>{aed(travel)}</b></div>}
              </div>
              <div style={{ marginTop: 10, paddingTop: 14, borderTop: "2px solid #0f1720", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: 16, fontWeight: 700 }}>Estimate</span><span style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em" }}>{aed(total)}</span></div>
              <button className="btn gold" type="button" onClick={submit} disabled={busy} style={{ marginTop: 18, width: "100%" }}>{busy ? "Sending…" : "Get my estimate"}</button>
              {err && <p className="next" style={{ marginTop: 12 }}>{err}</p>}
              <p style={{ margin: "14px 0 0", fontSize: 13, lineHeight: 1.5, color: "#667085" }}>Your estimate is emailed straight away. We check your details and confirm the final price within 24 hours, then you book it online.</p>
            </aside>
          </div>
        </div>
      </div>
      <div className="mbar"><div><div style={{ fontSize: 13, color: "#475467" }}>Estimate</div><div style={{ fontSize: 22, fontWeight: 800 }}>{aed(total)}</div></div>
        <a className="btn gold" href="#summary" style={{ padding: "14px 22px" }} onClick={(e) => { e.preventDefault(); document.getElementById("summary")?.scrollIntoView({ behavior: "smooth" }); }}>Review estimate</a></div>
    </Shell>
  );
}
