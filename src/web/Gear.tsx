import { useEffect, useState } from "react";
import { I } from "./Icons";
import { CtaBand, Faq, Page, Trust, link } from "./Layout";
import { sb } from "../lib/supabase";
import C from "./content.json";

const ITEM_ICON: Record<string, (p?: { s?: number }) => React.ReactNode> = { z200: I.cam, tail2: I.cam, yolou: I.live, yoloe: I.live, djimic: I.mic, rode: I.mic, hset: I.mic, tripod: I.cam };

export function Gear() {
  const [items, setItems] = useState<{ id: string; name: string; strap: string }[]>([]);
  useEffect(() => { sb.from("gear").select("id,name,strap").eq("kind", "item").eq("active", true).order("sort").then(({ data }) => setItems(data ?? [])); }, []);
  const book = "/book?s=gear";
  return (
    <Page book={book}>
      <section className="fs-phero"><img src="/img/stadiumcam.jpg" alt="Broadcast camera at a stadium" />
        <div className="fs-wrap"><span className="fs-kick">Gear rental</span>
          <h1>The kit we stream with, yours by the day.</h1>
          <p className="lead">Streaming kits, broadcast cameras and our vMix system. Collect free in Dubai, or we drop it off and pick it up.</p>
          <div className="fs-ctas"><a className="fs-btn y" href={book} onClick={link(book)}>Book gear {I.arrow({ s: 20 })}</a>
            <a className="fs-btn w" href="/estimate" onClick={link("/estimate")}>Get an estimate</a></div></div>
      </section>
      <Trust items={[["Ready to go", "Batteries charged, cables and cases included."], ["Collect or delivered", "Free from us in Dubai, or dropped to your venue."], ["Longer hire, less a day", "10% off 3 days or more, 20% off a week."], ["Set-up on request", "An operator sets it up and shows your team."]]} />
      <section className="fs-sec"><div className="fs-wrap">
        <div className="fs-head"><div><h2 className="fs-h2">Kits</h2><p className="fs-sub">Everything to stream a match, in one case.</p></div></div>
        <div className="fs-kits">{C.kits.map((k) => <a key={k.id} className="fs-kit" href={book} onClick={link(book)}><img src={k.img} alt={k.name} loading="lazy" />
          <div><b>{k.name}</b><span>{k.detail}</span><span className="go" style={{ display: "inline-flex", gap: 6, alignItems: "center", fontWeight: 700, color: "var(--ink)", marginTop: 6 }}>Book this kit {I.arrow({ s: 16 })}</span></div></a>)}</div>
      </div></section>
      <section className="fs-sec alt"><div className="fs-wrap">
        <div className="fs-head"><div><h2 className="fs-h2">Single items</h2><p className="fs-sub">Add to your own set-up.</p></div></div>
        <div className="fs-tiles">{items.map((it) => <div key={it.id} className="fs-tile">{(ITEM_ICON[it.id] ?? I.cam)({ s: 28 })}<b>{it.name}</b><span>{it.strap}</span></div>)}</div>
      </div></section>
      <Faq items={C.rentFaq} />
      <CtaBand title="Book your gear." text="Pick your kit and dates, and see your price straight away." book={book} />
    </Page>
  );
}
