import { aed } from "./pricing.ts";

type B = Record<string, any> & { lines: { label: string; v: number }[] };
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
const fd = (d?: string | null) => d ? new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "";

export function wrap(inner: string, site = "https://ffpsports.com") {
  return `<!doctype html><html><body style="margin:0;background:#f4f4f2;font-family:Montserrat,Helvetica,Arial,sans-serif;color:#0f1720">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f2;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden">
<tr><td style="background:#0A0A0A;padding:18px 28px"><img src="${site}/img/logo-white.png" alt="FFP Sports" height="30" style="display:block;height:30px;width:auto;border:0"></td></tr>
<tr><td style="height:4px;background:#FFD600"></td></tr>
<tr><td style="padding:28px;font-size:15px;line-height:1.6">${inner}</td></tr>
<tr><td style="padding:18px 28px;background:#f7f7f5;font-size:12px;color:#5b6270">FFP Sports, a service of FIND FIT PEOPLE L.L.C-FZ, Dubai. Reply to this email with any questions.</td></tr>
</table></td></tr></table></body></html>`;
}

function table(b: B) {
  const rows = b.lines.map((l) => `<tr><td style="padding:8px 0;border-bottom:1px solid #eeeeee">${esc(l.label)}</td><td style="padding:8px 0;border-bottom:1px solid #eeeeee;text-align:right;white-space:nowrap">${aed(l.v)}</td></tr>`).join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;font-size:14px">${rows}
<tr><td style="padding:12px 0 0;font-weight:700">Total</td><td style="padding:12px 0 0;text-align:right;font-weight:800;font-size:18px">${aed(Number(b.total))}</td></tr>
${Number(b.deposit) ? `<tr><td style="padding:6px 0 0;color:#5b6270">Refundable deposit</td><td style="padding:6px 0 0;text-align:right;color:#5b6270">${aed(Number(b.deposit))}</td></tr>` : ""}</table>`;
}

function when(b: B) {
  if (b.mode === "gear") return `${fd(b.gear_from)} to ${fd(b.gear_to)}. ${b.handover === "delivery" ? "Drop-off and pick-up at " + esc(b.address) : "Collect from FFP in Dubai"}`;
  return [fd(b.event_date), esc(b.start_time), esc(b.sport), esc(b.venue)].filter(Boolean).join(", ");
}

function bank(S: Record<string, string>, ref: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0;font-size:14px;background:#fff8d6;border-radius:6px"><tr><td style="padding:14px 16px;line-height:1.7">
<b>Account name</b> ${esc(S.public_account_name)}<br><b>Bank</b> ${esc(S.public_bank)}<br><b>Account number</b> ${esc(S.public_account_no)}<br><b>IBAN</b> ${esc(S.public_iban)}<br><b>Reference</b> ${esc(ref)}</td></tr></table>`;
}

export function bookingReceived(b: B, _S: Record<string, string>) {
  return `<h1 style="margin:0 0 6px;font-size:22px">We have your request</h1>
<p style="margin:0;color:#5b6270">Reference <b style="color:#0f1720">${esc(b.ref)}</b></p>
<p>Hi ${esc(b.first_name)}, thanks for booking ${esc(b.svcName.toLowerCase())} with FFP Sports. Nothing to pay yet.</p>
<p style="margin:0"><b>${esc(b.svcName)}</b><br>${when(b)}</p>${table(b)}
<p style="margin:0 0 4px"><b>What happens next</b></p>
<ol style="margin:0;padding-left:18px"><li>We check the crew and gear for your date, usually within a few hours and always within 24.</li><li>You get your confirmation with our bank details.</li><li>Pay to lock it in. ${b.pay_plan === "split" ? "Over AED 10,000 you can pay 50% to book and the rest before the work starts." : ""}</li></ol>`;
}

export function estimateReceived(b: B, _S: Record<string, string>) {
  return `<h1 style="margin:0 0 6px;font-size:22px">Your estimate</h1>
<p style="margin:0;color:#5b6270">Reference <b style="color:#0f1720">${esc(b.ref)}</b></p>
<p>Hi ${esc(b.first_name)}, here is the estimate you built. We review it and send you a formal quotation, usually within 24 hours.</p>${table(b)}`;
}

export function adminAlert(b: B, _S: Record<string, string>) {
  return `<h1 style="margin:0 0 6px;font-size:20px">New ${b.kind === "estimate" ? "estimate request" : "booking request"} ${esc(b.ref)}</h1>
<p style="margin:0"><b>${esc(b.first_name)} ${esc(b.last_name)}</b>${b.org ? ", " + esc(b.org) : ""}<br>${esc(b.email)}, ${esc(b.phone)}</p>
<p style="margin:12px 0 0"><b>${esc(b.svcName)}</b><br>${when(b)}</p>${table(b)}
${b.notes ? `<p><b>Notes</b><br>${esc(b.notes)}</p>` : ""}
<p style="margin:0;color:#5b6270">Check crew and gear, then confirm it in admin.</p>`;
}

export function confirmation(b: B, S: Record<string, string>, msg: string) {
  const due = Number(b.total) + Number(b.deposit);
  const now = b.pay_plan === "split" ? Number(b.total) / 2 : due;
  return `<h1 style="margin:0 0 6px;font-size:22px">Your booking is confirmed</h1>
<p style="margin:0;color:#5b6270">Reference <b style="color:#0f1720">${esc(b.ref)}</b></p>
<p>Hi ${esc(b.first_name)}, the crew and gear are available for your date.${msg ? " " + esc(msg) : ""}</p>
<p style="margin:0"><b>${esc(b.svcName)}</b><br>${when(b)}</p>${table(b)}
<p style="margin:0"><b>To lock it in, pay ${aed(now)} by bank transfer.</b>${b.pay_plan === "split" ? ` The other ${aed(Number(b.total) / 2)} is due before the work starts.` : ""}</p>
${bank(S, b.ref)}
<p style="margin:0;color:#5b6270">Your booking is secured when payment is received. Prices are in AED.</p>`;
}

export function paymentReceipt(b: B, S: Record<string, string>, amount: number) {
  const due = Number(b.total) + Number(b.deposit) - Number(b.paid);
  return `<h1 style="margin:0 0 6px;font-size:22px">Payment received</h1>
<p style="margin:0;color:#5b6270">Reference <b style="color:#0f1720">${esc(b.ref)}</b></p>
<p>Hi ${esc(b.first_name)}, we received ${aed(amount)}. Thank you.</p>
<p>${due > 0.5 ? `Still to pay before the work starts: <b>${aed(due)}</b>.` : "Your booking is fully paid. See you there."}</p>
${due > 0.5 ? bank(S, b.ref) : ""}`;
}

export function declined(b: B, _S: Record<string, string>, msg: string) {
  return `<h1 style="margin:0 0 6px;font-size:22px">About your request</h1>
<p style="margin:0;color:#5b6270">Reference <b style="color:#0f1720">${esc(b.ref)}</b></p>
<p>Hi ${esc(b.first_name)}, we can't cover this booking as requested.${msg ? " " + esc(msg) : ""}</p>
<p>Reply to this email and we'll find another date or option that works.</p>`;
}

export function quoteEmail(q: Record<string, any>, S: Record<string, string>) {
  const lines = (q.lines ?? []) as { desc: string; qty: number; days?: number; unit: number }[];
  const rows = lines.map((l, i) => `<tr><td style="padding:8px 6px;border-bottom:1px solid #eeeeee;color:#5b6270">${i + 1}</td><td style="padding:8px 6px;border-bottom:1px solid #eeeeee">${esc(l.desc)}</td><td style="padding:8px 6px;border-bottom:1px solid #eeeeee;text-align:right">${l.qty}</td><td style="padding:8px 6px;border-bottom:1px solid #eeeeee;text-align:right;white-space:nowrap">${aed(l.qty * (l.days || 1) * l.unit)}</td></tr>`).join("");
  return `<h1 style="margin:0 0 4px;font-size:22px;letter-spacing:.08em">QUOTATION</h1>
<p style="margin:0;color:#5b6270">${esc(q.number)}, valid until ${fd(q.valid_until)}</p>
<p style="margin:16px 0 0"><b>To</b> ${esc(q.org)}<br><b>Attention</b> ${esc(q.attention)}</p>
${q.subject ? `<p style="margin:12px 0 0"><b>Subject</b> ${esc(q.subject)}</p>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;font-size:14px"><tr style="background:#0A0A0A;color:#fff"><td style="padding:8px 6px">#</td><td style="padding:8px 6px">Description</td><td style="padding:8px 6px;text-align:right">Qty</td><td style="padding:8px 6px;text-align:right">Amount</td></tr>${rows}
<tr><td></td><td style="padding:12px 6px 0;font-weight:700">Total</td><td></td><td style="padding:12px 6px 0;text-align:right;font-weight:800;font-size:18px">${aed(Number(q.total))}</td></tr></table>
<div style="font-size:12px;color:#5b6270;line-height:1.6">${((q.terms ?? []) as string[]).map((t) => esc(t)).join("<br>")}<br>Payment in advance by bank transfer. Prices in AED.</div>
${bank(S, q.number)}`;
}
