import { I, addonIcon } from "./Icons";
import { CtaBand, Faq, Page, Trust, link } from "./Layout";
import { Theatre } from "./Home";
import C from "./content.json";

const TRUST: Record<string, [string, string][]> = {
  live: [["Scores on screen", "Live scoreboard, team names and your sponsor logo."], ["Everywhere at once", "YouTube, Facebook and your website, no viewer limit."], ["4G built in", "Our own internet, so no venue wifi needed."], ["Recording included", "Download link within 24 hours."]],
  video: [["Filmed in 4K", "Cinema-quality footage you can crop and reuse."], ["Sports specialists", "Videographers who know where the action is."], ["Edited your way", "Raw footage, highlights or a full event film."], ["Yours to use", "Post it anywhere, forever."]],
  photo: [["Sports photographers", "Fast action, frozen sharp."], ["Every photo edited", "Colour and light, done by hand."], ["Gallery in 48 hours", "Share it with the squad."], ["Full resolution", "For print and social."]],
  pod: [["We bring the studio", "Cameras, mics and lights, to your venue."], ["Up to 4 voices", "Shure MV7+ microphones and clean mixing."], ["Three camera angles", "In 4K, ready for YouTube."], ["Edited and published", "From raw files to a finished episode."]],
};
const BOOK: Record<string, string> = { live: "/book?s=live", video: "/book?s=video", photo: "/book?s=photo", pod: "/book?s=pod" };

export function Service({ id }: { id: string }) {
  const s = C.services.find((x) => x.id === id)!;
  const book = BOOK[id];
  const multi = s.pkgs.length > 1;
  return (
    <Page book={book}>
      <section className="fs-phero"><img src={s.hero} alt={s.heroAlt} />
        <div className="fs-wrap">
          <span className="fs-kick">{s.name}</span>
          <h1>{s.h1}</h1>
          <p className="lead">{s.sub}</p>
          <div className="fs-ctas"><a className="fs-btn y" href={book} onClick={link(book)}>Book {s.noun} {I.arrow({ s: 20 })}</a>
            <a className="fs-btn w" href="/estimate" onClick={link("/estimate")}>Get an estimate</a></div>
        </div>
      </section>
      <Trust items={TRUST[id]} />

      <section className="fs-sec"><div className="fs-wrap">
        <div className="fs-head"><div><h2 className="fs-h2">What you get</h2>
          <p className="fs-sub">{multi ? "Two packages. Pick one when you book, then add anything extra." : "Every booking. Choose 2 hours for one match or session, or a full day for an event."}</p></div></div>
        <div className={"fs-pkgs" + (multi ? "" : " one")}>
          {s.pkgs.map((p) => <div key={p.name} className="fs-pkg">
            <img src={p.img} alt={p.name} loading="lazy" />
            {multi && <><h3>{p.name}</h3><p className="line">{p.line}</p></>}
            <ul className="fs-inc">{p.items.map((it) => <li key={it.t}>{I.check({ s: 20 })}<span><b>{it.t}</b><span>{it.d}</span></span></li>)}</ul>
            {multi && <a className="fs-btn y" href={book} onClick={link(book)}>Book {p.name} {I.arrow({ s: 20 })}</a>}
          </div>)}
        </div>
      </div></section>

      <section className="fs-sec alt"><div className="fs-wrap">
        <div className="fs-head"><div><h2 className="fs-h2">{id === "video" || id === "pod" ? "Editing and extras" : "Add-ons"}</h2><p className="fs-sub">Add any of these when you book.</p></div></div>
        <div className="fs-tiles">{s.addons.map((a) => <div key={a.t} className="fs-tile">{addonIcon(a.icon)({ s: 28 })}<b>{a.t}</b><span>{a.d}</span></div>)}</div>
      </div></section>

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
