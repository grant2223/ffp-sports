import { lazy, Suspense, useEffect } from "react";
import { usePath } from "./lib/router";
import { StaticPage } from "./site/Static";
import { Book } from "./book/Book";
import { Estimate } from "./book/Estimate";
import { Legal } from "./site/Legal";
import home from "./site/pages/home.html?raw";
import livestream from "./site/pages/livestream.html?raw";
import video from "./site/pages/video.html?raw";
import photography from "./site/pages/photography.html?raw";
import podcasting from "./site/pages/podcasting.html?raw";
import gear from "./site/pages/gear.html?raw";
import talent from "./site/pages/talent.html?raw";

const Admin = lazy(() => import("./admin/Admin"));

const PAGES: Record<string, [string, string, string]> = {
  "/": [home, "pg-home", "FFP Sports | Livestream, video, photography and podcasting in the UAE"],
  "/livestream": [livestream, "", "Livestream | FFP Sports"],
  "/video": [video, "", "Video | FFP Sports"],
  "/photography": [photography, "", "Photography | FFP Sports"],
  "/podcasting": [podcasting, "", "Podcasting | FFP Sports"],
  "/gear-rental": [gear, "", "Gear rental | FFP Sports"],
  "/talent": [talent, "", "Talent | FFP Sports"],
};

function Title({ t }: { t: string }) { useEffect(() => { document.title = t; }, [t]); return null; }

export default function App() {
  const path = usePath().split("?")[0].replace(/\/+$/, "") || "/";
  if (location.hostname.startsWith("admin.") || path.startsWith("/admin")) return <Suspense fallback={null}><Title t="FFP Sports admin" /><Admin /></Suspense>;
  if (path === "/book") return <><Title t="Book | FFP Sports" /><Book /></>;
  if (path === "/estimate") return <><Title t="Get an estimate | FFP Sports" /><Estimate /></>;
  if (path === "/terms") return <><Title t="Booking terms | FFP Sports" /><Legal kind="terms" /></>;
  if (path === "/privacy") return <><Title t="Privacy | FFP Sports" /><Legal kind="privacy" /></>;
  const p = PAGES[path] || PAGES["/"];
  return <><Title t={p[2]} /><StaticPage key={path} html={p[0]} cls={p[1]} /></>;
}
