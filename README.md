# FFP Sports

Website, booking and admin for FFP Sports (ffpsports.com). Same build as Mahi Man and Aussie Rooms.

- Frontend: Vite + React + TypeScript, deployed on Vercel from `main`
- Backend: Supabase project "FFP Sports" (`ntqnopvnlnqvhnjkvkxp`, Mumbai region): Postgres with row-level security, storage, edge function `api`
- Email: Resend, sent by the `api` function from bookings@ffpsports.com
- Admin: `/admin` (later admin.ffpsports.com). Sign in with an email that is an admin under Crew and roles.

## What's in it

- Public site: home, livestream, video, photography, podcasting, gear rental, talent, get an estimate, terms, privacy.
- Booking: 6 steps (service, package or gear, editing or add-ons, when and where, details, send). Prices come from the database and
  are re-calculated by the server, so nobody can change a price in the browser. Gear stock is checked and held per date.
- Admin: bookings (crew allocation, gear stock, confirm and send bank details, record payments, receipts), quotes (price list,
  corporate PDF, email to client), gear (who has what, rental rates, pay-back), crew and roles (44 industry roles, day rates,
  margin), prices (every package, add-on, editing option, emirate, partner codes), settings (bank details, alerts, rules), email log.

## Setup checklist

1. GitHub repo `grant2223/ffp-sports`, push this folder.
2. Vercel: New Project, import the repo. Framework Vite. No environment variables needed.
3. Domains in Vercel: `ffpsports.com`, `www.ffpsports.com`, `admin.ffpsports.com`.
4. GoDaddy DNS for ffpsports.com:
   | Type  | Name  | Value                  |
   |-------|-------|------------------------|
   | A     | @     | 76.76.21.21            |
   | CNAME | www   | cname.vercel-dns.com   |
   | CNAME | admin | cname.vercel-dns.com   |
   Plus the Resend records (step 5). Remove any old A record on @ pointing at the current site.
5. Resend: add domain `ffpsports.com`. Resend shows 3 to 4 records (MX and TXT on `send`, TXT on `resend._domainkey`,
   optional DMARC TXT on `_dmarc`). Add them in GoDaddy exactly as shown, then Verify.
6. Resend API key: Supabase, Edge Functions, Secrets, add `RESEND_API_KEY`.
7. Supabase Auth: URL configuration, Site URL `https://ffpsports.com`, redirect URLs `https://ffpsports.com/admin`,
   `https://admin.ffpsports.com`. SMTP settings: host smtp.resend.com, port 465, user `resend`, password = the Resend API key,
   sender bookings@ffpsports.com (so admin sign-in emails come from FFP Sports).
8. Admin, Settings: set "Site address" to https://ffpsports.com and send a test email.

## Develop

    npm install
    npm run dev
    npm run sync     # copies src/lib/pricing.ts into the api function after any price-logic change

Pricing lives in one file, `src/lib/pricing.ts`, used by both the booking page and the api function.
Database changes are in `supabase/migrations` (already applied).
Tests: `npx tsx test/pricing.test.ts` (known prices), `test/site.py`, `test/book.py`, `test/admin.py` (Playwright against `vite preview`).
