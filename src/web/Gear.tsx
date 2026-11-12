import { useEffect, useState } from "react";
import { I } from "./Icons";
import { CtaBand, Faq, Page, Trust, link } from "./Layout";
import { sb } from "../lib/supabase";
import { KITS } from "./gearInfo";
import C from "./content.json";

type Row = { id: string; kind: string; name: string; strap: string; img: string; price_day: number; units: number; specs: string[]; best: string; supply: string; category: string };
type Part = { kit_id: string; item_id: string; qty: number; note: string; sort: number };
const split = (t: string): [string, string] => { const m = t.match(/^(\d+) × (.*)$/); return m ? [m[1], m[2]] : ["", t]; };
const aed = (n: number) => "AED " + Number(n).toLocaleString("en");
const ORDER = ["Cameras", "Streaming and switching", "Wireless video", "Audio and commentary", "Lighting", "Support"];
const ICON_BY_NAME: Record<string, typeof I.cam> = { Cameras: I.cam, "Streaming and switching": I.live, "Wireless video": I.live, "Audio and commentary": I.mic, Support: I.cam };

export function Gear() {
  const [gear, setGear] = useState<Row[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  useEffect(() => {
    sb.from("gear").select("id,kind,name,strap,img,price_day,units,specs,best,supply,category").eq("active", true).order("sort").then(({ data }) => setGear((data as Row[]) ?? []));
    sb.from("gear_parts").select("kit_id,item_id,qty,note,sort").order("sort").then(({ data }) => setParts((data as Part[]) ?? []));
  }, []);
  const book = "/book?s=gear";
  const kits = gear.filter((g) => g.kind === "kit");
  const byId = Object.fromEntries(gear.map((g) => [g.id, g]));
  const items = gear.filter((g) => g.kind === "item").map((g) => ({ ...g, category: g.category || "Other" }));
  const itemCats = [...new Set(items.map((g) => g.category))].sort((a, b) => ((ORDER.indexOf(a) + 1 || 99) - (ORDER.indexOf(b) + 1 || 99)) || a.localeCompare(b));
  return (
    <Page book={book}>
      <section className="fs-phero"><div className="fs-wrap">
        <h1>Livestream gear rental.</h1>
        <p className="lead">Cameras and streaming kits by the day. Collect in Dubai, or we deliver.</p>
      </div></section>
      <Trust items={[["Tested before it leaves", "Charged, cleaned and checked, with every cable."], ["Longer hire costs less", "10% off 3 days or more, 20% off 7 days or more."],
        ["No deposit", "Leave your Emirates ID at pick-up or delivery. It comes back with the gear."], ["Set-up on request", "An operator sets it up and shows your team."]]} />

      <section className="fs-sec fs-first"><div className="fs-wrap">
        <h2 className="fs-h2">Kits</h2>
        <p className="fs-sub">Everything in one case, ready to plug in.</p>
        <div className="gk-list">{kits.map((k) => { const info = KITS[k.id]; const inCase: [string, string][] = [...parts.filter((p) => p.kit_id === k.id && byId[p.item_id]).map((p) => [String(p.qty), byId[p.item_id].name + (p.note ? ": " + p.note : "")] as [string, string]), ...(k.specs ?? []).map(split)]; const to = `${book}&g=${k.id}`; return (
          <article key={k.id} className="gk">
            <img className="gk-ph" src={k.img} alt={k.name} loading="lazy" />
            <div className="gk-main">
              <h3>{k.name}</h3>
              <p className="gk-best">{k.best || info?.best}</p>
              <div className="gk-pr"><b>{aed(k.price_day)}</b><span>per day</span><em>No deposit</em></div>
              <a className="fs-btn y" href={to} onClick={link(to)}>Book this kit {I.arrow({ s: 18 })}</a>
            </div>
            <div className="gk-case">
              <p className="gh">In the case</p>
              <dl>{inCase.map(([q, t]) => <div key={t}><dt>{q}</dt><dd>{t}</dd></div>)}</dl>
              <p className="gk-sup"><b>You supply</b>{k.supply || info?.supply}</p>
            </div>
          </article>); })}
        </div>
      </div></section>

      <section className="fs-sec alt"><div className="fs-wrap">
        <h2 className="fs-h2">Single items</h2>
        <p className="fs-sub">Add to your own set-up, or to a kit.</p>
        <div className="gc-grid">{itemCats.map((c) => (
          <div key={c} className="gc">
            <h3>{(ICON_BY_NAME[c] ?? I.live)({ s: 26 })}{c}</h3>
            {items.filter((g) => g.category === c).map((g) => { const to = `${book}&g=${g.id}`; return (
              <a key={g.id} className="gi" href={to} onClick={link(to)}>
                <div className="gi-t"><b>{g.name}</b><span>{g.strap}</span>{g.specs?.length ? <ul className="gi-s">{g.specs.map((x) => <li key={x}>{x}</li>)}</ul> : null}</div>
                <div className="gi-p"><b>{aed(g.price_day)}</b><span>per day, {g.units} available</span></div>
              </a>); })}
          </div>))}
        </div>
      </div></section>

      <Faq items={C.rentFaq} />
      <CtaBand title="Book your gear." text="Pick your kit and dates, and see your price straight away." book={book} />
    </Page>
  );
}
