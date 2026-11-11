import { useEffect, useState } from "react";
import { go } from "../lib/router";
import { I } from "./Icons";
import C from "./content.json";

export const link = (to: string) => (e: React.MouseEvent) => { if (e.metaKey || e.ctrlKey) return; e.preventDefault(); go(to); };
export const SVC_PATH: Record<string, string> = { live: "/livestream", video: "/video", photo: "/photography", pod: "/podcasting" };
const NAV: [string, string][] = [["/livestream", "Livestream"], ["/video", "Video"], ["/photography", "Photography"], ["/podcasting", "Podcasting"], ["/gear-rental", "Gear rental"], ["/talent", "Talent"]];

export function Nav({ book = "/book" }: { book?: string }) {
  const [open, setOpen] = useState(false);
  const here = location.pathname;
  useEffect(() => { document.documentElement.style.overflow = open ? "hidden" : ""; return () => { document.documentElement.style.overflow = ""; }; }, [open]);
  return (
    <>
      <header className="fs-nav"><div className="fs-wrap fs-nav-in">
        <a className="fs-logo" href="/" onClick={link("/")} aria-label="FFP Sports home"><img src="/img/logo-white.png" alt="FFP Sports" /></a>
        <nav className="fs-links" aria-label="Services">{NAV.map(([p, l]) => <a key={p} href={p} className={here === p ? "on" : ""} onClick={link(p)}>{l}</a>)}</nav>
        <div className="fs-navcta">
          <a className="fs-btn w sm" href="/estimate" onClick={link("/estimate")}>Get an estimate</a>
          <a className="fs-btn y sm" href={book} onClick={link(book)}>Book now</a>
        </div>
        <button className="fs-burger" type="button" aria-label="Open menu" onClick={() => setOpen(true)}>{I.menu({ s: 26 })}</button>
      </div></header>
      {open && <div className="fs-menu" role="dialog" aria-label="Menu">
        <div className="fs-menu-top"><img src="/img/logo-white.png" alt="FFP Sports" style={{ height: 28 }} />
          <button className="fs-burger" style={{ display: "flex", margin: 0 }} type="button" aria-label="Close menu" onClick={() => setOpen(false)}>{I.close({ s: 26 })}</button></div>
        <div className="fs-menu-list">
          {C.services.map((s) => <a key={s.id} className="fs-menu-item" href={SVC_PATH[s.id]} onClick={(e) => { setOpen(false); link(SVC_PATH[s.id])(e); }}>
            <img src={s.hero} alt="" /><span><b>{s.name}</b><span>{s.card}</span></span></a>)}
        </div>
        <div className="fs-menu-more">
          {[["/gear-rental", "Gear rental"], ["/talent", "Talent"], ["/terms", "Booking terms"]].map(([p, l]) => <a key={p} href={p} onClick={(e) => { setOpen(false); link(p)(e); }}>{l}</a>)}
        </div>
        <div className="fs-menu-cta">
          <a className="fs-btn w" href="/estimate" onClick={(e) => { setOpen(false); link("/estimate")(e); }}>Get an estimate</a>
          <a className="fs-btn y" href={book} onClick={(e) => { setOpen(false); link(book)(e); }}>Book now</a>
        </div>
      </div>}
    </>
  );
}

export function Trust({ items }: { items: [string, string][] }) {
  return <section className="fs-trust"><div className="fs-wrap fs-trust-in">
    {items.map(([b, t]) => <div key={b} className="fs-trust-item">{I.shield({ s: 24 })}<span><b>{b}</b><span>{t}</span></span></div>)}
  </div></section>;
}

export function Faq({ title = "Questions", items }: { title?: string; items: { q: string; a: string }[] }) {
  return <section className="fs-sec"><div className="fs-wrap fs-faq">
    <div><h2 className="fs-h2">{title}</h2><p className="fs-sub">Anything else, email info@findfitpeople.com.</p></div>
    <div>{items.map((f) => <details key={f.q}><summary>{f.q}{I.down({ s: 20 })}</summary><p>{f.a}</p></details>)}</div>
  </div></section>;
}

export function CtaBand({ title = "Ready when you are.", text = "Pick a service, choose your date and see your price straight away.", book = "/book" }: { title?: string; text?: string; book?: string }) {
  return <section className="fs-cta"><div className="fs-wrap fs-cta-in">
    <div><h2>{title}</h2><p>{text}</p></div>
    <div className="fs-ctas" style={{ marginTop: 0 }}>
      <a className="fs-btn k" href={book} onClick={link(book)}>Book now {I.arrow({ s: 20 })}</a>
      <a className="fs-btn w" href="/estimate" onClick={link("/estimate")}>Get an estimate</a>
    </div>
  </div></section>;
}

export function Footer() {
  return <footer className="fs-foot">
    <div className="fs-wrap fs-foot-in">
      <div><img src="/img/logo-white.png" alt="FFP Sports" /><p style={{ marginTop: 14, maxWidth: 300 }}>Livestreams, video, photography and podcasts for clubs, leagues and events across the UAE.</p></div>
      <div><h4>Services</h4>{NAV.slice(0, 4).map(([p, l]) => <a key={p} href={p} onClick={link(p)}>{l}</a>)}</div>
      <div><h4>Hire</h4><a href="/gear-rental" onClick={link("/gear-rental")}>Gear rental</a><a href="/talent" onClick={link("/talent")}>Talent</a><a href="/estimate" onClick={link("/estimate")}>Get an estimate</a></div>
      <div><h4>FFP Sports</h4><a href="mailto:info@findfitpeople.com">info@findfitpeople.com</a><a href="/terms" onClick={link("/terms")}>Booking terms</a><a href="/privacy" onClick={link("/privacy")}>Privacy</a></div>
    </div>
    <div className="fs-wrap fs-foot-base">FFP Sports is a service of FIND FIT PEOPLE L.L.C-FZ, Dubai.</div>
  </footer>;
}

export function Page({ children, book }: { children: React.ReactNode; book?: string }) {
  return <div className="fs"><Nav book={book} /><main>{children}</main><Footer /></div>;
}
