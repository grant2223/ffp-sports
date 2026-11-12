-- Invoices, raised from a quotation or a booking, numbered FFPS-INV-0001 onwards.
create sequence if not exists public.invoice_no_seq start 1;
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  number text unique not null default ('FFPS-INV-' || lpad(nextval('invoice_no_seq')::text, 4, '0')),
  status text not null default 'draft' check (status in ('draft', 'sent', 'part_paid', 'paid', 'void')),
  quote_id uuid references quotes(id) on delete set null,
  booking_id uuid references bookings(id) on delete set null,
  quote_number text not null default '',
  org text not null default '', attention text not null default '', email text not null default '',
  subject text not null default '', issue_date date not null default current_date, due_date date not null default current_date,
  lines jsonb not null default '[]', terms jsonb not null default '[]',
  total numeric not null default 0, paid numeric not null default 0,
  created_at timestamptz not null default now(), sent_at timestamptz, paid_at timestamptz
);
alter table public.invoices enable row level security;
create policy admin_all on public.invoices for all using (public.is_admin()) with check (public.is_admin());
alter table public.email_log add column if not exists invoice_id uuid;

-- The first invoice, already issued to Augustus Media from quotation FFPS-Q-0143.
insert into invoices(org, attention, email, subject, issue_date, due_date, quote_number, total, lines, terms)
values ('Augustus Media', 'Kirby', 'kirby@augustusmedia.com', 'Camera rental, 8 Sony PXW-Z200 kits', '2026-11-12', '2026-11-12', 'FFPS-Q-0143', 7100,
 '[{"desc":"Sony PXW-Z200 4K camcorder","note":"20x optical zoom, 2 batteries, charger, carry bag","qty":8,"days":1,"unit":750,"cost":0},
   {"desc":"Video tripod with fluid head","note":"Matched to the Z200, with quick-release plate","qty":8,"days":1,"unit":100,"cost":0},
   {"desc":"Drop-off, Dubai","note":"Fri 13 Nov 2026, 9:00 am","qty":1,"days":1,"unit":150,"cost":0},
   {"desc":"Pick-up, Dubai","note":"End of hire, time to confirm","qty":1,"days":1,"unit":150,"cost":0}]'::jsonb,
 '["Hire: 1 day, from Fri 13 Nov 2026.","Location: Dubai, drop-off and pick-up.","Emirates ID or passport of the person receiving the equipment."]'::jsonb);
