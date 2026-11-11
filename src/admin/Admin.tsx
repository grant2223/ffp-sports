import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { sb } from "../lib/supabase";
import { ToastProvider } from "./kit";
import { Bookings } from "./Bookings";
import { Quotes } from "./Quotes";
import { GearTab } from "./Gear";
import { Crew } from "./Crew";
import { Prices } from "./Prices";
import { SettingsTab } from "./Settings";
import "./admin.css";

const TABS = [["bookings", "Bookings"], ["quotes", "Quotes"], ["gear", "Gear"], ["crew", "Crew and roles"], ["prices", "Prices"], ["settings", "Settings"]] as const;
type Tab = (typeof TABS)[number][0];

export default function Admin() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>(() => (new URLSearchParams(location.search).get("tab") as Tab) || "bookings");
  const [newCount, setNewCount] = useState(0);

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!session) { setAdmin(null); return; }
    (async () => { await sb.rpc("claim_staff"); const { data } = await sb.rpc("is_admin"); setAdmin(!!data); })();
  }, [session]);
  const recount = useCallback(() => { sb.from("bookings").select("id", { count: "exact", head: true }).eq("status", "requested").then(({ count }) => setNewCount(count ?? 0)); }, []);
  useEffect(() => { if (admin) recount(); }, [admin, recount, tab]);
  const pick = (t: Tab) => { setTab(t); history.replaceState(null, "", location.pathname + "?tab=" + t); window.scrollTo(0, 0); };

  if (!ready) return <div className="adm" />;
  if (!session) return <div className="adm"><SignIn /></div>;
  if (admin === null) return <div className="adm" />;
  if (!admin) return <div className="adm"><div className="login"><img src="/img/logo.png" alt="FFP Sports" /><h2>No admin access</h2>
    <p className="muted">{session.user.email} isn't set up as an FFP Sports admin. Ask an admin to add you under Crew and roles.</p>
    <button className="btn ghost" type="button" onClick={() => sb.auth.signOut()}>Sign out</button></div></div>;

  return (
    <ToastProvider>
      <div className="adm">
        <div className="top"><div className="topin">
          <a href="/" aria-label="FFP Sports site"><img src="/img/logo.png" alt="FFP Sports" /></a>
          <nav className="tabs" aria-label="Admin">{TABS.map(([k, l]) => <button key={k} className={"tab" + (tab === k ? " on" : "")} type="button" onClick={() => pick(k)}>{l}{k === "bookings" && newCount > 0 && <span className="ct">{newCount}</span>}</button>)}</nav>
          <span className="who">{session.user.email}</span>
          <button className="btn ghost" type="button" onClick={() => sb.auth.signOut()}>Sign out</button>
        </div></div>
        {tab === "bookings" && <Bookings onChange={recount} />}
        {tab === "quotes" && <Quotes />}
        {tab === "gear" && <GearTab />}
        {tab === "crew" && <Crew />}
        {tab === "prices" && <Prices />}
        {tab === "settings" && <SettingsTab />}
      </div>
    </ToastProvider>
  );
}

function SignIn() {
  const [email, setEmail] = useState(""); const [code, setCode] = useState(""); const [sent, setSent] = useState(false);
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  const send = async () => {
    setBusy(true); setMsg("");
    const { error } = await sb.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: location.origin + "/admin", shouldCreateUser: true } });
    setBusy(false); if (error) setMsg(error.message); else setSent(true);
  };
  const verify = async () => {
    setBusy(true); setMsg("");
    const { error } = await sb.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "email" });
    setBusy(false); if (error) setMsg(error.message);
  };
  return (
    <div className="login">
      <img src="/img/logo.png" alt="FFP Sports" />
      <h1 style={{ fontSize: 24 }}>Admin sign in</h1>
      {!sent ? <>
        <p className="muted">We email you a sign-in link and code.</p>
        <label className="fld"><span>Email</span><input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && email && send()} /></label>
        <button className="btn gold" type="button" style={{ marginTop: 16, width: "100%" }} disabled={!email || busy} onClick={send}>{busy ? "Sending…" : "Email me a sign-in link"}</button>
      </> : <>
        <p className="muted">Check {email}. Tap the link in the email, or type the code here.</p>
        <label className="fld"><span>Code</span><input inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && code && verify()} /></label>
        <button className="btn gold" type="button" style={{ marginTop: 16, width: "100%" }} disabled={!code || busy} onClick={verify}>Sign in</button>
        <button className="btn plain" type="button" onClick={() => { setSent(false); setCode(""); }}>Use a different email</button>
      </>}
      {msg && <p className="warn">{msg}</p>}
    </div>
  );
}
