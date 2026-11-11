import { lazy, Suspense, useEffect } from "react";
import { usePath } from "./lib/router";
import { Book } from "./book/Book";
import { Estimate } from "./book/Estimate";
import { Legal } from "./site/Legal";
import { Home } from "./web/Home";
import { Service } from "./web/Service";
import { Gear } from "./web/Gear";
import { Talent } from "./web/Talent";

const Admin = lazy(() => import("./admin/Admin"));
const SVC: Record<string, [string, string]> = {
  "/livestream": ["live", "Livestream"], "/video": ["video", "Video"], "/photography": ["photo", "Photography"], "/podcasting": ["pod", "Podcasting"],
};

function Title({ t }: { t: string }) { useEffect(() => { document.title = t; }, [t]); return null; }

export default function App() {
  const path = usePath().split("?")[0].replace(/\/+$/, "") || "/";
  useEffect(() => { window.scrollTo(0, 0); }, [path]);
  if (location.hostname.startsWith("admin.") || path.startsWith("/admin")) return <Suspense fallback={null}><Title t="FFP Sports admin" /><Admin /></Suspense>;
  if (path === "/book") return <><Title t="Book | FFP Sports" /><Book /></>;
  if (path === "/estimate") return <><Title t="Get an estimate | FFP Sports" /><Estimate /></>;
  if (path === "/terms") return <><Title t="Booking terms | FFP Sports" /><Legal kind="terms" /></>;
  if (path === "/privacy") return <><Title t="Privacy | FFP Sports" /><Legal kind="privacy" /></>;
  if (SVC[path]) return <><Title t={SVC[path][1] + " | FFP Sports"} /><Service key={path} id={SVC[path][0]} /></>;
  if (path === "/gear-rental") return <><Title t="Gear rental | FFP Sports" /><Gear /></>;
  if (path === "/talent") return <><Title t="Talent | FFP Sports" /><Talent /></>;
  return <><Title t="FFP Sports | Livestream, video, photography and podcasting in the UAE" /><Home /></>;
}
