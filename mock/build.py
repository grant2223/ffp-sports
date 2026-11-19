import json, datetime, html
R = '/home/claude/ffp-sports'
gear = json.load(open('/tmp/gear.json'))
parts = {'kit1': {'z200': 1, 'yolou': 1, 'djimic': 1, 'tripod': 1}, 'kit3': {'tail2': 3, 'pyros': 3, 'tripod': 3, 'yoloe': 1, 'rode': 1, 'hset': 2}, 'podk': {'rode': 1}, 'vmix': {}}
CAT = {'kit1': 'Kits', 'kit3': 'Kits', 'vmix': 'Kits', 'podk': 'Kits', 'z200': 'Cameras', 'tail2': 'Cameras', 'yolou': 'Streaming and switching', 'yoloe': 'Streaming and switching',
       'pyros': 'Wireless video', 'djimic': 'Audio and commentary', 'rode': 'Audio and commentary', 'hset': 'Audio and commentary', 'tripod': 'Support'}
ORDER = ['Kits', 'Cameras', 'Streaming and switching', 'Wireless video', 'Audio and commentary', 'Support']
start = datetime.date(2026, 11, 12)
days = [start + datetime.timedelta(d) for d in range(14)]
# sample bookings, realistic spread
holds = [('kit1', 1, 14, 15, 'FFPS-R-10012', 'Desert Barbell'), ('z200', 2, 18, 18, 'FFPS-R-10013', 'Abu Dhabi Cricket'), ('tripod', 2, 18, 18, 'FFPS-R-10013', 'Abu Dhabi Cricket'),
         ('kit3', 1, 20, 21, 'FFPS-R-10014', 'Augustus Media'), ('pyros', 2, 22, 24, 'FFPS-R-10015', 'Dubai Rugby 7s')]
by = {g['id']: g for g in gear}
def used(gid, d):
    n = sum(q for (i, q, a, b, *_ ) in holds if i == gid and a <= d.day <= b)
    for (i, q, a, b, *_ ) in holds:
        if a <= d.day <= b and gid in parts.get(i, {}): n += q * parts[i][gid]
    return n
def free(gid, d):
    g = by[gid]; f = g['units'] - used(gid, d)
    for pid, q in parts.get(gid, {}).items():
        f = min(f, (by[pid]['units'] - used(pid, d)) // q)
    return max(0, f)
aed = lambda n: f"{int(float(n)):,}"
FONT = ''.join(f"@font-face{{font-family:Montserrat;font-weight:{w};src:url({R}/node_modules/@fontsource/montserrat/files/montserrat-latin-{w}-normal.woff2) format('woff2')}}" for w in (400, 500, 600, 700, 800))
HEAD = f"""<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="{R}/src/admin/admin.css"><style>{FONT}{open(R + '/mock/gear.css').read()}</style></head><body><div class="adm">
<div class="top"><div class="topin"><img src="{R}/public/img/logo.png" alt="FFP Sports"><nav class="tabs">{''.join(f'<button class="tab{" on" if t == "Gear" else ""}">{t}</button>' for t in ["Bookings", "Quotes", "Invoices", "Gear", "Crew and roles", "Prices", "Settings"])}</nav>
<span class="who">grant@ffpsports.com</span><button class="btn ghost">Sign out</button></div></div>"""
img = lambda g: f'<img src="{R}/public{g["img"]}" alt="">' if g['img'] else '<span class="noph"></span>'

# ---------- list ----------
def nxt(gid):
    out = []
    for (i, q, a, b, ref, who) in holds:
        if i == gid: out.append((a, b, q, who, ''))
        elif gid in parts.get(i, {}): out.append((a, b, q * parts[i][gid], who, by[i]['name']))
    return sorted(out)
rows = []
for cat in ORDER:
    items = [g for g in gear if CAT[g['id']] == cat]
    rows.append(f'<tr class="grp"><td colspan="5">{cat}<span>{len(items)}</span></td></tr>')
    for g in items:
        nb = nxt(g['id'])
        if nb:
            a, b, q, who, kit = nb[0]
            when = f"{a} Nov" if a == b else f"{a}–{b} Nov"
            what = f"{q} out" + (f" in the {kit}" if kit else "") + f", {who}"
            more = f'<em>+{len(nb) - 1} more</em>' if len(nb) > 1 else ''
            cell = ''
        else:
            cell = ''
        cell = '<button class="btn ghost ca">Check availability</button>'
        rows.append(f'''<tr class="click"><td class="ph">{img(g)}</td><td class="nm"><b>{html.escape(g["name"])}</b><span>{html.escape(g["strap"])}</span></td>
<td class="n">{g["units"]}</td><td>{cell}</td><td class="n">{aed(g["price_day"])}</td></tr>''')
LIST = HEAD + f"""<div class="page">
<div class="ghead"><h1>Gear</h1><div class="gtools"><label class="srch"><input placeholder="Search gear"></label><label class="dd"><input value="All categories" readonly><span class="chev"></span></label><button class="btn gold">Add item</button></div></div>
<div class="tablewrap"><table class="gt"><thead><tr><th style="width:96px"></th><th>Item</th><th class="n" style="width:84px">Owned</th><th style="width:220px"></th><th class="n" style="width:110px">AED a day</th></tr></thead>
<tbody>{''.join(rows)}</tbody></table></div>
</div></div></body></html>"""
open(R + '/mock/gear-list.html', 'w').write(LIST)


# ---------- editors ----------
CASE = {'kit3': [('tail2', 3, '4K cameras that follow play on their own with AI tracking, 5x optical zoom'),
  ('pyros', 3, 'Each camera sends to the switcher without a cable, up to 400 m line of sight, 4K 30 fps, 50 ms delay'),
  ('tripod', 3, 'SmallRig AD-01 with fluid head'), ('yoloe', 1, '11.2-inch touchscreen, switches the 3 cameras, streams and records each camera separately'),
  ('rode', 1, 'Records each commentator on their own track'), ('hset', 2, 'Audio-Technica BPHS1: closed-back headphones, boom mic'),
  (None, 0, 'NP-F970 batteries for the wireless sets, cables, power and carry cases')]}
def case_rows(kid):
    out = []
    for pid, q, t in CASE[kid]:
        if pid:
            new = ''
            out.append(f'<div class="cl{new}"><input class="q" value="{q}"><div class="cb"><div class="ci"><b>{html.escape(by[pid]["name"])}</b><em>{by[pid]["units"]} owned</em></div><textarea rows="{2 if len(t) > 78 else 1}">{html.escape(t)}</textarea></div><button class="rm" aria-label="Remove">×</button></div>')
        else:
            out.append(f'<div class="cl"><span class="q0"></span><div class="cb"><div class="ci"><b>Not counted in stock</b></div><input value="{html.escape(t)}"></div><button class="rm" aria-label="Remove">×</button></div>')
    return ''.join(out)
def editor(g, body_left, body_right, unsaved=True):
    return HEAD + f"""<div class="full ed"><div class="fullbar"><div class="in"><button class="x">×</button><div class="ttl">{html.escape(g['name']) if g else 'New item'}</div>{'<span class="unsaved">Unsaved changes</span>' if unsaved else ''}<button class="btn gold">Save</button></div></div>
<div class="page"><div class="eg"><div class="col">{body_left}</div><div class="col side">{body_right}</div></div></div></div></div></body></html>"""
def fields(g, cat):
    return f"""<div class="f2"><label class="fld"><span>Name</span><input value="{html.escape(g['name'])}"></label><label class="fld"><span>Category</span><span class="dd"><input value="{cat}" readonly><span class="chev"></span></span></label></div>
<label class="fld"><span>One line on the site</span><input value="{html.escape(g['strap'])}"></label>"""
k = by['kit3']
left = f"""<div class="photo"><img src="{R}/public{k['img']}" alt=""><button class="btn ghost">Replace photo</button></div>{fields(k, 'Kits')}
<label class="fld"><span>Best for</span><input value="{html.escape('Three angles of one pitch, switched live, with 2 commentators.')}"></label>
<label class="fld"><span>You supply</span><input value="{html.escape('Internet, and a power point at the commentary table.')}"></label>
<h2 class="sh">In the case</h2><div class="case">{case_rows('kit3')}</div>
<div class="addrow"><label class="dd"><input placeholder="Add gear from stock"><span class="chev"></span></label><button class="btn ghost">Add a line</button></div>"""
right = f"""<h2 class="sh first">Stock and price</h2>
<div class="f3 two"><label class="fld"><span>Kits you can make</span><input class="num" value="1"></label><label class="fld"><span>AED a day</span><input class="num" value="2,600"></label></div>
<div class="tg"><span>Listed on the site</span><button class="sw on" aria-pressed="true"><i></i></button></div>
<h2 class="sh">Booked</h2>
<div class="bk"><div><b>20–21 Nov</b><span>FFPS-R-10014, Augustus Media</span></div></div>
<button class="btn plain del">Delete this kit</button>"""
open(R + '/mock/gear-edit.html', 'w').write(editor(k, left, right))
# single item, as it opens from Add item filled in
g = by['pyros']
specs = ['1 transmitter and 1 receiver, with antennas', 'Transmitter takes HDMI or SDI from the camera; receiver gives HDMI and SDI to the switcher', '4K 30 fps over HDMI, 1080p 60 fps over SDI', 'Up to 400 m line of sight, 50 ms delay', 'One transmitter can feed up to 4 receivers (up to 200 m)', '1 NP-F970 battery per unit, plus a mains adapter']
left = f"""<div class="photo empty"><span>Add a photo</span><button class="btn gold">Upload photo</button></div>{fields(g, 'Wireless video')}
<h2 class="sh">Specs</h2><div class="lines">{''.join(f'<div class="ln"><textarea rows="{2 if len(x) > 96 else 1}">{html.escape(x)}</textarea><button class="rm" aria-label="Remove">×</button></div>' for x in specs)}</div>
<div class="addrow"><button class="btn ghost">Add a line</button></div>"""
right = f"""<h2 class="sh first">Stock and price</h2>
<div class="f3"><label class="fld"><span>Units owned</span><input class="num" value="6"></label><label class="fld"><span>AED a day</span><input class="num" value="150"></label><label class="fld"><span>Purchase price</span><input class="num" value="1,600"></label></div>
<p class="pb">Pays for itself in <b>11 rental days</b></p>
<div class="tg"><span>Listed on the site</span><button class="sw on" aria-pressed="true"><i></i></button></div>
<h2 class="sh">In kits</h2>
<div class="bk"><div><b>3 units</b><span>3-camera wireless kit</span></div></div>
<h2 class="sh">Booked</h2>
<div class="bk"><div><b>20–21 Nov</b><span>3 in the 3-camera wireless kit, FFPS-R-10014</span></div><div><b>22–24 Nov</b><span>2 units, FFPS-R-10015, Dubai Rugby 7s</span></div></div>
<button class="btn plain del">Delete this item</button>"""
open(R + '/mock/gear-item.html', 'w').write(editor(g, left, right, unsaved=False))
print('ok')

# ---------- availability calendar ----------
import calendar
def cal(gid, y=2026, m=11):
    g = by[gid]; cells = []
    first = datetime.date(y, m, 1); lead = first.weekday()
    ndays = calendar.monthrange(y, m)[1]
    for _ in range(lead): cells.append('<div class="cd out"></div>')
    for dnum in range(1, ndays + 1):
        d = datetime.date(y, m, dnum)
        if d < start: cells.append(f'<div class="cd past"><span class="dn">{dnum}</span></div>'); continue
        f = free(gid, d); who = []
        for (i, q, a, b, ref, w) in holds:
            if a <= dnum <= b and (i == gid or gid in parts.get(i, {})):
                n = q if i == gid else q * parts[i][gid]
                who.append(f'<li>{n} out{"" if i == gid else " in the " + html.escape(by[i]["name"])}, {html.escape(w)}</li>')
        st = 'none' if f == 0 else 'some' if f < g['units'] else ''
        cells.append(f'<div class="cd {st}{" today" if d == start else ""}"><span class="dn">{dnum}</span>{"<b>None left</b>" if f == 0 else f"<b>{f} left</b>" if f < g["units"] else ""}</div>')
    while len(cells) % 7: cells.append('<div class="cd out"></div>')
    head = ''.join(f'<div class="wd">{w}</div>' for w in ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
    bl = ''.join(f'<div><b>{a}–{b} Nov</b><span>{q if i == gid else q * parts[i][gid]} out{"" if i == gid else " in the " + html.escape(by[i]["name"])}, {html.escape(w)}</span></div>' for (i, q, a, b, ref, w) in holds if i == gid or gid in parts.get(i, {}))
    return HEAD + f"""<div class="full ed cal"><div class="fullbar"><div class="in"><button class="x">×</button><div class="ttl">{html.escape(g['name'])}<span class="own">{g['units']} owned</span></div>
<div class="mnav"><button class="btn ghost">‹</button><b>November 2026</b><button class="btn ghost">›</button></div></div></div>
<div class="page"><div class="cg">{head}{''.join(cells)}</div>
<div class="key"><i class="kf"></i>All free<i class="ks"></i>Some booked<i class="kn"></i>None free</div>
<h2 class="sh">Booked this month</h2><div class="bk">{bl}</div></div></div></div></body></html>"""
open(R + '/mock/gear-cal.html', 'w').write(cal('pyros'))

# ---------- list with dates checked ----------
def range_free(gid, a, b):
    return min(free(gid, datetime.date(2026, 11, d)) for d in range(a, b + 1))
def range_who(gid, a, b):
    out = []
    for (i, q, ha, hb, ref, w) in holds:
        if ha <= b and hb >= a and (i == gid or gid in parts.get(i, {})):
            n = q if i == gid else q * parts[i][gid]
            out.append(f'{n} out{"" if i == gid else " in the " + by[i]["name"]}, {w}')
    # a kit can also be short because one of its parts is out elsewhere
    for pid, q in parts.get(gid, {}).items():
        if range_free(pid, a, b) < q and not any(i == gid for (i, *_r) in holds if True):
            for (i, hq, ha, hb, ref, w) in holds:
                if ha <= b and hb >= a and i != gid and (i == pid or pid in parts.get(i, {})):
                    out.append(f'{by[pid]["name"]} is out in the {by[i]["name"]}, {w}' if i != pid else f'{by[pid]["name"]} is out, {w}')
    return out
A, Bd = 20, 21
rows = []
for cat in ORDER:
    items = [g for g in gear if CAT[g['id']] == cat]
    rows.append(f'<tr class="grp"><td colspan="6">{cat}<span>{len(items)}</span></td></tr>')
    for g in items:
        f = range_free(g['id'], A, Bd); w = range_who(g['id'], A, Bd)
        st = 'none' if f == 0 else 'some' if f < g['units'] else 'all'
        rows.append(f'''<tr class="click"><td class="ph">{img(g)}</td><td class="nm"><b>{html.escape(g["name"])}</b><span>{html.escape(g["strap"])}</span></td>
<td class="n">{g["units"]}</td><td><div class="fq {st}"><b>{f}</b><span>{"; ".join(html.escape(x) for x in w) if w else "All free"}</span></div></td>
<td><button class="btn ghost ca">Check availability</button></td><td class="n">{aed(g["price_day"])}</td></tr>''')
CHK = HEAD + f"""<div class="page">
<div class="ghead"><h1>Gear</h1><div class="gtools"><label class="srch"><input placeholder="Search gear"></label><label class="dd"><input value="All categories" readonly><span class="chev"></span></label><button class="btn gold">Add item</button></div></div>
<div class="dates"><b>Check dates</b><label class="fld"><span>From</span><input value="Fri 20 Nov 2026"></label><label class="fld"><span>To</span><input value="Sat 21 Nov 2026"></label><button class="btn plain">Clear</button></div>
<div class="tablewrap"><table class="gt"><thead><tr><th style="width:96px"></th><th>Item</th><th class="n" style="width:84px">Owned</th><th style="width:400px">Free 20–21 Nov</th><th style="width:190px"></th><th class="n" style="width:110px">AED a day</th></tr></thead>
<tbody>{''.join(rows)}</tbody></table></div>
</div></div></body></html>"""
open(R + '/mock/gear-dates.html', 'w').write(CHK)
