import { I } from "./Icons";
import type { Visual } from "./packages";

const Film = ({ img, dur, cls = "" }: { img: string; dur: string; cls?: string }) => (
  <div className={"dv-film " + cls}><img src={img} alt="" loading="lazy" /><span className="dv-play">{I.play({ s: 18 })}</span><span className="dv-dur">{dur}</span><span className="dv-bar"><i /></span></div>
);
const Clip = ({ img }: { img: string }) => <div className="dv-clip"><img src={img} alt="" loading="lazy" /><span className="dv-play sm">{I.play({ s: 12 })}</span></div>;

export function Deliverable({ v }: { v: Visual }) {
  switch (v.kind) {
    case "film": return <div className="dv dv-pad"><Film img={v.img} dur={v.dur} /></div>;
    case "film+clips": return <div className="dv dv-pad dv-fc"><Film img={v.img} dur={v.dur} /><div className="dv-clips">{v.clips.map((c, i) => <Clip key={i} img={c} />)}</div></div>;
    case "two-films": return <div className="dv dv-pad dv-two"><Film img={v.imgs[0]} dur={v.durs[0]} /><Film img={v.imgs[1]} dur={v.durs[1]} /></div>;
    case "gallery": return <div className="dv dv-gal">{v.imgs.map((m, i) => <img key={i} src={m} alt="" loading="lazy" />)}<span className="dv-more">{v.more}<small>photos</small></span></div>;
    case "gallery+team": return <div className="dv dv-galt"><img className="team" src={v.team} alt="" loading="lazy" />{v.imgs.map((m, i) => <img key={i} src={m} alt="" loading="lazy" />)}<span className="dv-more">{v.more}<small>photos</small></span></div>;
    case "stream": return <div className="dv dv-stream"><img src={v.img} alt="" loading="lazy" /><span className="dv-live">LIVE</span>
      {v.bug && <span className="dv-bug"><b>HOME</b><i>12</i><i>7</i><b>AWAY</b><em>2H 34:10</em></span>}
      {v.cams && <div className="dv-cams">{v.cams.map((c, i) => <img key={i} src={c} alt="" loading="lazy" />)}</div>}</div>;
    case "season": return <div className="dv dv-season">{v.imgs.map((m, i) => <div key={i}><img src={m} alt="" loading="lazy" /><span>Match {i + 1}</span></div>)}<div className="dv-more2">+6 more</div></div>;
    case "files": return <div className="dv dv-pad dv-files"><div className="dv-angles">{[0, 1, 2].map((i) => <div key={i}><img src={v.img} alt="" loading="lazy" style={{ objectPosition: ["20% 50%", "50% 50%", "80% 50%"][i] }} /><span>Cam {i + 1}</span></div>)}</div>
      <div className="dv-tracks">{[0, 1, 2, 3].map((i) => <div key={i}><span>Mic {i + 1}</span><i style={{ width: [70, 88, 60, 80][i] + "%" }} /></div>)}</div></div>;
  }
}
