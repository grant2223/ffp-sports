import { I, addonIcon } from "./Icons";
import { CtaBand, Faq, Page, link } from "./Layout";
import { Theatre } from "./Home";
import C from "./content.json";
import { PACKS, POD_EXTRAS, LIVE_EXTRAS, VIDEO_EXTRAS } from "./packages";
import { Deliverable } from "./Deliverable";
import { CrewAddons } from "./Crew";
import { useCatalogue } from "../lib/catalogue";
import type { Extra as SiteExtra } from "./packages";

const BOOK: Record<string, string> = { live: "/book?s=live", video: "/book?s=video", photo: "/book?s=photo", pod: "/book?s=pod" };

// Add-on text and prices come from the live catalogue, so the site and the booking always match.
function useLiveExtra() {
  const { cat } = useCatalogue();
  return (it: SiteExtra): SiteExtra => {
    const e = it.id ? cat?.extras.find((x) => x.id === it.id) : undefined;
    if (!e) return it;
    const v = e.per_crew_hour ? Number(cat!.settings.extra_hour_client || 750) : e.price_2h;
    return { ...it, name: e.name, d: e.strap, price: "AED " + Number(v).toLocaleString("en") + (e.per_crew_hour ? " an hour each" : ""), details: e.details ?? [] };
  };
}

export function Service({ id }: { id: string }) {
  const live = useLiveExtra();
  const s = C.services.find((x) => x.id === id)!;
  const book = BOOK[id];
  return (
    <Page book={book}>
      <section className="fs-phero"><div className="fs-wrap">
        <h1>{s.h1}</h1>
        <p className="lead">{s.sub}</p>
      </div></section>

      <section className="fs-sec fs-first"><div className="fs-wrap">
        <h2 className="fs-h2">Packages</h2>
        <div className={"fs-packs n" + PACKS[id].length}>{PACKS[id].map((p) => {
          const to = `${book}&p=${p.id}`;
          return <a key={p.id} href={to} onClick={link(to)} className={"fs-pack" + (p.popular ? " pop" : "")}>
            <div className="ph"><Deliverable v={p.visual} />{p.popular && <span className="flag">Most booked</span>}</div>
            <div className="bd">
              <h3>{p.name}</h3>
              <p className="out">{p.best}</p>
              <div className="pr"><b>AED {p.price.toLocaleString("en")}</b><span>{p.per}</span>{p.alt && <em>{p.alt}</em>}</div>
              <p className="gh">You receive</p>
              <dl className="gets">{p.gets.map((g, i) => <div key={i}><dt>{g.v}</dt><dd>{g.t}</dd></div>)}</dl>
              <span className="fs-btn y">Book this package {I.arrow({ s: 18 })}</span>
            </div>
          </a>;
        })}</div>
        {id !== "live" && <p className="fs-packnote">Want something different? Build your own when you book, or <a href="/estimate" onClick={link("/estimate")}>get an estimate</a>.</p>}
      </div></section>

      {id === "pod" || id === "live" || id === "video" ? <section className="fs-sec alt"><div className="fs-wrap">
        <h2 className="fs-h2">Add-ons</h2>
        <p className="fs-sub">Add any of these when you book.</p>
        <div className={"ax-grid n" + (id === "live" ? LIVE_EXTRAS : id === "video" ? VIDEO_EXTRAS : POD_EXTRAS).length}>{(id === "live" ? LIVE_EXTRAS : id === "video" ? VIDEO_EXTRAS : POD_EXTRAS).map((g) => (
          <div key={g.name} className="ax">
            <div className="ax-ph"><img src={g.img} alt="" loading="lazy" style={g.pos ? { objectPosition: g.pos } : undefined} /><h3>{g.name}</h3></div>
            <ul>{g.items.map(live).filter((it) => it.price).map((it) => <li key={it.name}><span><b>{it.name}</b><small>{it.d}</small>
              {(it.details ?? []).length > 0 && <details className="ax-d"><summary>What you get</summary><ul>{it.details!.map((d) => <li key={d}>{d}</li>)}</ul></details>}</span><em>{it.price}</em></li>)}</ul>
          </div>))}
        </div>
        <CrewAddons svc={id} />
        {id === "live" && <a className="fs-bigjob" href="/estimate" onClick={link("/estimate")}>
          <span><b>A bigger or more complex event?</b>Several pitches, big screens, replays or a multi-day tournament. Tell us what you need and we will price it.</span>
          <span className="fs-btn k">Get an estimate {I.arrow({ s: 18 })}</span></a>}
      </div></section> : <section className="fs-sec alt"><div className="fs-wrap">
        <div className="fs-head"><div><h2 className="fs-h2">{id === "video" || id === "pod" ? "Editing and extras" : "Add-ons"}</h2><p className="fs-sub">Add any of these when you book.</p></div></div>
        <div className="fs-tiles">{s.addons.map((a) => <div key={a.t} className="fs-tile">{addonIcon(a.icon)({ s: 28 })}<b>{a.t}</b><span>{a.d}</span></div>)}</div>
      </div></section>}

      {id === "live" && <section className="fs-sec dark"><div className="fs-wrap">
        <div className="fs-head"><div><h2 className="fs-h2">Recent livestreams</h2></div></div><Theatre /></div></section>}

      {id === "live" && <section className="fs-sec"><div className="fs-wrap fs-quote">
        <blockquote>They took our event to the next level with their live-streaming.</blockquote>
        <div><b style={{ fontSize: 18 }}>Marco and Patrick</b><div style={{ color: "var(--muted)" }}>Desert Barbell</div></div></div></section>}

      <Faq items={s.faqs} />
      <CtaBand title={`Book your ${s.noun}.`} book={book} />
    </Page>
  );
}
