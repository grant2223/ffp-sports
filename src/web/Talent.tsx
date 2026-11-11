import { I } from "./Icons";
import { CtaBand, Faq, Page, link } from "./Layout";
import C from "./content.json";

export function Talent() {
  return (
    <Page book="/estimate?talent=1">
      <section className="fs-phero">
        <div className="fs-wrap"><span className="fs-kick">Talent</span>
          <h1>Commentators, MCs and presenters.</h1>
          <p className="lead">Voices who know sport, for your stream or event.</p>
          <div className="fs-ctas"><a className="fs-btn y" href="/estimate?talent=1" onClick={link("/estimate?talent=1")}>Book talent {I.arrow({ s: 20 })}</a></div></div>
      </section>
      <section className="fs-sec"><div className="fs-wrap">
        <h2 className="fs-h2">Our talent</h2>
        {C.talent.map((t) => <div key={t.name} className="fs-person" style={{ marginTop: 36 }}>
          <img src={t.photo} alt={t.name} loading="lazy" />
          <div><h3 style={{ fontSize: 34, fontWeight: 800 }}>{t.name}</h3>
            <div className="fs-facts"><span>Roles</span><b>{t.roles.join(", ")}</b><span>Sports</span><b>{t.sports.join(", ")}</b><span>Languages</span><b>{t.langs.join(", ")}</b><span>Credits</span><b>{t.credits}</b></div>
            <div className="fs-ctas"><a className="fs-btn y" href="/estimate?talent=1" onClick={link("/estimate?talent=1")}>Book {t.name.split(" ")[0]}</a>
              <a className="fs-btn k" href={t.reel} target="_blank" rel="noreferrer">{I.play({ s: 18 })} Watch the reel</a></div></div>
        </div>)}
      </div></section>
      <Faq items={C.talentFaq} />
      <CtaBand title="Add a voice to your event." text="Book talent on its own, or with your livestream." book="/estimate?talent=1" />
    </Page>
  );
}
