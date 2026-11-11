import { useState } from "react";
import { I } from "./Icons";
import { CtaBand, Faq, Page, SVC_PATH, Trust, link } from "./Layout";
import C from "./content.json";

const MOSAIC = ["/img/stadiumcam.jpg", "/img/gfxplayer.jpg", "/img/desk.jpg", "/img/flag.jpg", "/img/fans.jpg", "/img/poolcam.jpg", "/img/pod.jpg", "/img/gymcam.jpg"];

export function Theatre() {
  const [i, setI] = useState(0);
  const v = C.videos[i];
  return (
    <div className="fs-theatre">
      <div>
        <a className="fs-player" href={"https://www.youtube.com/watch?v=" + v.id} target="_blank" rel="noreferrer" aria-label={"Play " + v.title}>
          <img src={v.img} alt={v.title} /><span className="fs-play">{I.play({ s: 30 })}</span></a>
        <div className="fs-cap"><b>{v.title}</b><span>{v.client}</span></div>
      </div>
      <div className="fs-rail">{C.videos.map((x, j) => (
        <button key={x.id} type="button" className={"fs-rit" + (j === i ? " on" : "")} onClick={() => setI(j)}>
          <img src={x.img} alt="" loading="lazy" /><span><b>{x.title}</b><span>{x.client}</span></span></button>))}
      </div>
    </div>
  );
}

export function Home() {
  return (
    <Page>
      <section className="fs-hero"><div className="fs-wrap fs-hero-in">
        <div>
          <span className="fs-kick">{I.pin({ s: 18 })} Sports media across the UAE</span>
          <h1>Your sport, seen and remembered.</h1>
          <span className="fs-tag">Livestream. Video. Photos. Podcasts.</span>
          <p className="lead">For clubs, leagues and events. Pick what you need, see your price straight away, book in two minutes.</p>
          <div className="fs-ctas">
            <a className="fs-btn y" href="/book" onClick={link("/book")}>Book now {I.arrow({ s: 20 })}</a>
            <a className="fs-btn w" href="/estimate" onClick={link("/estimate")}>Get an estimate</a>
          </div>
        </div>
        <div className="fs-mosaic" aria-hidden="true">{MOSAIC.map((m) => <img key={m} src={m} alt="" />)}</div>
      </div></section>

      <Trust items={[["Your price, up front", "See exactly what it costs before you book."], ["Confirmed before you pay", "We check the crew and gear for your date first."],
        ["All seven emirates", "Dubai, Abu Dhabi, Sharjah and the north."], ["Yours to keep", "Every recording, film and photo, to use anywhere."]]} />

      <section className="fs-sec"><div className="fs-wrap">
        <div className="fs-head"><div><h2 className="fs-h2">What do you need?</h2><p className="fs-sub">Four services, each with a crew that knows sport.</p></div></div>
        <div className="fs-svcs">{C.services.map((s) => (
          <a key={s.id} className="fs-svc" href={SVC_PATH[s.id]} onClick={link(SVC_PATH[s.id])}>
            <div className="ph"><img src={s.pkgs[0].img || s.hero} alt={s.heroAlt} loading="lazy" /></div>
            <b>{s.name}</b><span>{s.card}</span><span className="go">See what you get {I.arrow({ s: 16 })}</span>
          </a>))}
        </div>
        <a className="fs-gearband" href="/gear-rental" onClick={link("/gear-rental")}>
          <img src={C.kits[0].img} alt={C.kits[0].name} loading="lazy" />
          <div><b>Running it yourself?</b><span>Rent our streaming kits, cameras and the vMix system by the day. Collect in Dubai, or we drop it off.</span>
            <span className="fs-btn y sm" style={{ alignSelf: "flex-start", marginTop: 8 }}>Rent gear {I.arrow({ s: 18 })}</span></div>
        </a>
      </div></section>

      <section className="fs-sec dark"><div className="fs-wrap">
        <div className="fs-head"><div><h2 className="fs-h2">Watch our broadcasts</h2><p className="fs-sub">Rugby, athletics, cricket, gymnastics, cycling and more, streamed by FFP Sports.</p></div></div>
        <Theatre />
      </div></section>

      <section className="fs-sec alt"><div className="fs-wrap">
        <h2 className="fs-h2">How booking works</h2>
        <div className="fs-steps" style={{ marginTop: 40 }}>
          {[["Pick and price it", "Choose your service, package and extras. Your price shows as you go."], ["We confirm", "We check the crew and gear for your date, usually within a few hours."],
            ["Pay and it's locked in", "Pay by bank transfer. Over AED 10,000, pay 50% to book."]].map(([b, t], n) => <div key={b} className="fs-step"><span className="n">{n + 1}</span><b>{b}</b><span>{t}</span></div>)}
        </div>
      </div></section>

      <section className="fs-sec"><div className="fs-wrap">
        <div className="fs-quote">
          <blockquote>They took our event to the next level with their live-streaming.</blockquote>
          <div><b style={{ fontSize: 18 }}>Marco and Patrick</b><div style={{ color: "var(--muted)" }}>Desert Barbell</div></div>
        </div>
        <p style={{ marginTop: 64, fontSize: 14, fontWeight: 600, color: "var(--muted)" }}>Trusted by</p>
        <div className="fs-logos" style={{ marginTop: 18 }}>{C.logos.map((l) => <img key={l.name} src={l.img} alt={l.name} loading="lazy" />)}</div>
      </div></section>

      <Faq items={C.commonFaq} />
      <CtaBand />
    </Page>
  );
}
