import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.4";
import { aed, type Catalogue, type Choices, isGear, price, rentalDays } from "./pricing.ts";
import { bookingReceived, adminAlert, confirmation, paymentReceipt, declined, quoteEmail, estimateReceived, wrap } from "./emails.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const ok = (body: unknown) => new Response(JSON.stringify(body), { headers: { ...cors, "Content-Type": "application/json" } });
const fail = (msg: string, status = 400) => new Response(JSON.stringify({ error: msg }), { status, headers: { ...cors, "Content-Type": "application/json" } });

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

async function catalogue(): Promise<Catalogue> {
  const [s, p, e, g, z, st, ro, rg, sr] = await Promise.all([
    db.from("services").select("*").eq("active", true),
    db.from("packages").select("*").eq("active", true),
    db.from("extras").select("*").eq("active", true),
    db.from("gear").select("*").eq("active", true),
    db.from("zones").select("*"),
    db.from("settings").select("key,value"),
    db.from("roles").select("id,group_id,name,client_day,cost_day,sort,active").eq("active", true),
    db.from("role_groups").select("*"),
    db.from("service_roles").select("*"),
  ]);
  const settings: Record<string, string> = {};
  for (const r of st.data ?? []) settings[r.key] = r.value;
  return { services: s.data ?? [], packages: p.data ?? [], extras: e.data ?? [], gear: g.data ?? [], zones: z.data ?? [], settings, roles: ro.data ?? [], roleGroups: rg.data ?? [], serviceRoles: sr.data ?? [] } as Catalogue;
}

async function send(to: string[], subject: string, html: string, kind: string, ids: { booking_id?: string; quote_id?: string }, from: string) {
  const key = Deno.env.get("RESEND_API_KEY");
  for (const t of to.filter(Boolean)) {
    let okk = false, error: string | null = null;
    if (!key) error = "Email not set up yet (RESEND_API_KEY missing)";
    else {
      try {
        const r = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({ from, to: [t], subject, html }),
        });
        okk = r.ok; if (!r.ok) error = (await r.text()).slice(0, 500);
      } catch (e) { error = String(e).slice(0, 500); }
    }
    await db.from("email_log").insert({ to_email: t, subject, kind, ok: okk, error, ...ids });
  }
}

const clean = (v: unknown, max = 300) => String(v ?? "").trim().slice(0, max);
const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const body = await req.json();
    const cat = await catalogue();
    const S = cat.settings;
    const from = S.email_from || "FFP Sports <bookings@ffpsports.com>";
    const site = S.public_site_url || "https://ffpsports.com";
    const W = (h: string) => wrap(h, site);
    const admins = (S.admin_emails || "").split(",").map((x) => x.trim()).filter(Boolean);

    // ---------------- public ----------------
    if (body.action === "check_code") {
      const { data } = await db.from("partner_codes").select("pct").eq("code", clean(body.code, 40).toUpperCase()).eq("active", true).maybeSingle();
      return ok({ pct: data?.pct ?? 0 });
    }

    if (body.action === "create_booking") {
      const c = body.choices as Choices;
      const d = body.details ?? {};
      if (!c || !c.svc) return fail("Pick a service");
      const gear = isGear(cat, c);
      const first = clean(d.first_name, 80), last = clean(d.last_name, 80), email = clean(d.email, 160).toLowerCase(), phone = clean(d.phone, 40);
      if (!first || !last) return fail("Add your first and last name");
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail("Add a valid email");
      if (!phone) return fail("Add your mobile");
      if (gear) {
        if (!isDate(c.from) || !isDate(c.to) || c.to < c.from) return fail("Add your pick-up and return dates");
        if (!body.id_doc?.data) return fail("Upload your ID");
        if (c.hand === "delivery" && !clean(d.address)) return fail("Add the delivery address");
      } else {
        if (!isDate(clean(d.date, 10))) return fail("Add your date");
        if (!clean(d.venue)) return fail("Add your venue");
        if (!c.pk) return fail("Choose a package");
      }
      let pct = 0;
      const code = clean(body.code, 40).toUpperCase();
      if (code) { const { data } = await db.from("partner_codes").select("pct").eq("code", code).eq("active", true).maybeSingle(); pct = data?.pct ?? 0; }
      const p = price(cat, c, pct);
      if (p.total <= 0) return fail("Your booking is empty");
      if (gear) {
        const { data: free } = await db.rpc("gear_free", { p_from: c.from, p_to: c.to });
        for (const h of p.holds) {
          const f = (free ?? []).find((x: { gear_id: string; free: number }) => x.gear_id === h.gear_id)?.free ?? 0;
          if (h.qty > f) { const g = cat.gear.find((x) => x.id === h.gear_id); return fail(`Only ${f} ${g?.name ?? "of that item"} left for those dates`); }
        }
      }
      const svcRow = cat.services.find((s) => s.id === c.svc);
      const { data: b, error } = await db.from("bookings").insert({
        kind: "booking", service_id: svcRow ? svcRow.id : null, mode: gear ? "gear" : "crew", choices: c,
        event_date: gear ? null : clean(d.date, 10), start_time: clean(d.time, 10), sport: clean(d.sport, 80), venue: clean(d.venue, 200),
        zone_id: c.zone || "dubai", gear_from: gear ? c.from : null, gear_to: gear ? c.to : null, handover: gear ? c.hand : null, address: clean(d.address, 300),
        first_name: first, last_name: last, org: clean(d.org, 160), email, phone, code: code || null,
        subtotal: p.sub, discount: p.disc, total: p.total, cost: p.cost, deposit: p.deposit, pay_plan: p.split ? "split" : "full",
        notes: clean(d.notes, 2000),
      }).select().single();
      if (error || !b) return fail("Could not save your booking. Please try again.", 500);
      if (gear && p.holds.length) {
        const { data: short, error: he } = await db.rpc("hold_gear", { p_booking: b.id, p_from: c.from, p_to: c.to, p_items: p.holds });
        if (he || short) { await db.from("bookings").delete().eq("id", b.id); return fail(short || "Could not hold the gear. Please try again."); }
      }
      await db.from("booking_lines").insert(p.lines.map((l, i) => ({ booking_id: b.id, label: l.label, amount: l.v, sort: i })));
      if (gear && body.id_doc?.data) {
        const bytes = Uint8Array.from(atob(String(body.id_doc.data)), (ch) => ch.charCodeAt(0));
        const ext = (clean(body.id_doc.name, 80).split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
        const path = `${b.id}/id.${ext}`;
        await db.storage.from("id-docs").upload(path, bytes, { contentType: clean(body.id_doc.type, 80) || "application/octet-stream", upsert: true });
        await db.from("bookings").update({ id_doc_path: path }).eq("id", b.id);
      }
      // crew roles to fill, from the package and add-ons
      if (!gear) {
        const roles: string[] = [];
        const pk = cat.packages.find((x) => x.id === c.pk);
        const base = c.svc === "photo" ? "photographer" : c.svc === "video" ? "videographer" : c.svc === "pod" ? "producer" : "camera-operator";
        for (let i = 0; i < (pk?.crew ?? 1); i++) roles.push(i === 1 && c.svc === "live" ? "technical-director-vision-mixer" : base);
        for (const id of c.on) {
          const e = cat.extras.find((x) => x.id === id); if (!e || !e.adds_crew) continue;
          roles.push(/Commentator/.test(e.name) ? "commentator" : /Graphics/.test(e.name) ? "graphics-operator" : /photographer/i.test(e.name) ? "photographer" : /videographer/i.test(e.name) ? "videographer" : "camera-operator");
        }
        const allowed = new Set(cat.serviceRoles.filter((x) => x.service_id === c.svc).map((x) => x.role_id));
        for (const [rid, q] of Object.entries(c.crewq ?? {})) if (allowed.has(rid)) for (let i = 0; i < Math.min(20, Math.floor(Number(q) || 0)); i++) roles.push(rid);
        const { data: rr } = await db.from("roles").select("id,cost_day").in("id", roles);
        await db.from("assignments").insert(roles.map((r) => ({ booking_id: b.id, role_id: r, day_rate: rr?.find((x) => x.id === r)?.cost_day ?? 0 })));
      }
      const view = { ...b, lines: p.lines, svcName: gear ? "Gear rental" : svcRow?.name ?? "", days: p.days || rentalDays(c.from, c.to) };
      await send([email], `We have your request ${b.ref}`, W(bookingReceived(view, S)), "booking_received", { booking_id: b.id }, from);
      await send(admins, `New booking request ${b.ref}, ${aed(p.total)}`, W(adminAlert(view, S)), "admin_alert", { booking_id: b.id }, from);
      return ok({ ref: b.ref, total: p.total });
    }

    if (body.action === "request_estimate") {
      const d = body.details ?? {};
      const first = clean(d.first_name, 80), last = clean(d.last_name, 80), email = clean(d.email, 160).toLowerCase();
      if (!first || !last) return fail("Add your first and last name");
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail("Add a valid email");
      const brief = body.brief ?? {};
      const lines = (Array.isArray(body.lines) ? body.lines : []).slice(0, 40).map((l: { label: string; v: number }) => ({ label: clean(l.label, 200), v: Number(l.v) || 0 }));
      const total = lines.reduce((t: number, l: { v: number }) => t + l.v, 0);
      const { data: b, error } = await db.from("bookings").insert({
        kind: "estimate", service_id: null, choices: brief, event_date: isDate(clean(d.date, 10)) ? clean(d.date, 10) : null,
        sport: clean(d.sport, 80), venue: clean(d.venue, 200), zone_id: clean(brief.zone, 20) || "dubai",
        first_name: first, last_name: last, org: clean(d.org, 160), email, phone: clean(d.phone, 40),
        subtotal: total, total, notes: clean(d.notes, 4000),
      }).select().single();
      if (error || !b) return fail("Could not send your request. Please try again.", 500);
      await db.from("booking_lines").insert(lines.map((l: { label: string; v: number }, i: number) => ({ booking_id: b.id, label: l.label, amount: l.v, sort: i })));
      const view = { ...b, lines, svcName: "Estimate" };
      await send([email], `Your estimate ${b.ref}`, W(estimateReceived(view, S)), "estimate_received", { booking_id: b.id }, from);
      await send(admins, `New estimate request ${b.ref}, ${aed(total)}`, W(adminAlert(view, S)), "admin_alert", { booking_id: b.id }, from);
      return ok({ ref: b.ref });
    }

    // ---------------- admin ----------------
    const auth = req.headers.get("Authorization") ?? "";
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: isAdmin } = await userClient.rpc("is_admin");
    if (!isAdmin) return fail("Admin only", 403);

    const loadBooking = async (id: string) => {
      const { data: b } = await db.from("bookings").select("*").eq("id", id).single();
      const { data: lines } = await db.from("booking_lines").select("label,amount").eq("booking_id", id).order("sort");
      const svc = cat.services.find((s) => s.id === b?.service_id);
      return b ? { ...b, lines: (lines ?? []).map((l) => ({ label: l.label, v: Number(l.amount) })), svcName: b.mode === "gear" ? "Gear rental" : b.kind === "estimate" ? "Estimate" : svc?.name ?? "" } : null;
    };

    switch (body.action) {
      case "confirm_booking": {
        const b = await loadBooking(body.id); if (!b) return fail("Booking not found");
        if (!["requested"].includes(b.status)) return fail("This booking is already " + b.status);
        await db.from("bookings").update({ status: "confirmed", confirmed_at: new Date().toISOString() }).eq("id", b.id);
        await send([b.email], `Confirmed: ${b.ref}. Payment details inside`, W(confirmation({ ...b, status: "confirmed" }, S, clean(body.message, 2000))), "confirmation", { booking_id: b.id }, from);
        return ok({ status: "confirmed" });
      }
      case "decline_booking": {
        const b = await loadBooking(body.id); if (!b) return fail("Booking not found");
        await db.from("bookings").update({ status: "declined", cancelled_at: new Date().toISOString() }).eq("id", b.id);
        await send([b.email], `About your request ${b.ref}`, W(declined(b, S, clean(body.message, 2000))), "declined", { booking_id: b.id }, from);
        return ok({ status: "declined" });
      }
      case "record_payment": {
        const b = await loadBooking(body.id); if (!b) return fail("Booking not found");
        const amount = Number(body.amount); if (!(amount > 0)) return fail("Add the amount received");
        await db.from("payments").insert({ booking_id: b.id, amount, method: clean(body.method, 30) || "bank_transfer", received_on: isDate(clean(body.date, 10)) ? clean(body.date, 10) : undefined, note: clean(body.note, 300) });
        const paid = Number(b.paid) + amount;
        const due = Number(b.total) + Number(b.deposit);
        const status = paid >= due - 0.5 ? "paid" : "part_paid";
        await db.from("bookings").update({ paid, status }).eq("id", b.id);
        await send([b.email], `Payment received for ${b.ref}`, W(paymentReceipt({ ...b, paid, status }, S, amount)), "receipt", { booking_id: b.id }, from);
        return ok({ status, paid });
      }
      case "send_quote": {
        const { data: q } = await db.from("quotes").select("*").eq("id", body.id).single();
        if (!q) return fail("Quote not found");
        if (!q.email) return fail("Add the client's email");
        await send([q.email], `Quotation ${q.number}${q.subject ? ": " + q.subject : ""}`, W(quoteEmail(q, S)), "quote", { quote_id: q.id }, from);
        await db.from("quotes").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", q.id);
        return ok({ status: "sent" });
      }
      case "id_doc_url": {
        const { data: b } = await db.from("bookings").select("id_doc_path").eq("id", body.id).single();
        if (!b?.id_doc_path) return fail("No ID uploaded");
        const { data } = await db.storage.from("id-docs").createSignedUrl(b.id_doc_path, 300);
        return ok({ url: data?.signedUrl });
      }
      case "test_email": {
        await send([clean(body.to, 160)], "FFP Sports test email", W(`<p style="margin:0">Email is working.</p>`), "test", {}, from);
        const { data } = await db.from("email_log").select("ok,error").order("id", { ascending: false }).limit(1).single();
        return ok(data);
      }
      default: return fail("Unknown action");
    }
  } catch (e) {
    console.error(e);
    return fail("Something went wrong. Please try again.", 500);
  }
});
