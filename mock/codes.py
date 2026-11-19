import html
exec(open('/home/claude/ffp-sports/mock/build.py').read().split('img = lambda')[0])
HEADC = HEAD.replace('<button class="tab">Settings</button>', '<button class="tab on">Discount codes</button><button class="tab">Settings</button>').replace('<button class="tab on">Gear</button>', '<button class="tab">Gear</button>')
codes = [("BUZZER10", "Buzzer", "10% off", "Gear rental", "1 of 3", "31 Dec 2026", "works"),
         ("DESERTBARBELL", "Desert Barbell", "AED 500 off", "Livestream, over AED 2,500", "0", "No end date", "works"),
         ("RUGBY7S", "Dubai Rugby 7s", "15% off", "All services", "4 of 4", "No end date", "used"),
         ("EID25", "Eid offer, anyone", "AED 250 off", "Video, Photography", "6", "15 Nov 2026", "ended")]
lab = {"works": "Works", "used": "Used up", "ended": "Ended", "off": "Off"}
rows = ''.join(f'''<tr class="click"><td><b class="cc">{c}</b><span class="who">{html.escape(w)}</span></td><td><b class="dv">{d}</b></td><td>{html.escape(a)}</td>
<td class="n">{u}</td><td>{e}</td><td><span class="st {s}">{lab[s]}</span></td></tr>''' for c, w, d, a, u, e, s in codes)
LIST = HEADC + f"""<div class="page cx"><div class="ghead"><h1>Discount codes</h1><div class="gtools"><input class="srch" placeholder="Search codes"><button class="btn gold">Add code</button></div></div>
<div class="tablewrap"><table class="gt ct"><thead><tr><th>Code</th><th style="width:150px">Discount</th><th>Applies to</th><th class="n" style="width:90px">Used</th><th style="width:140px">Ends</th><th style="width:110px">Status</th></tr></thead><tbody>{rows}</tbody></table></div></div></div></body></html>"""
open(R + '/mock/codes-list.html', 'w').write(LIST)
EDIT = HEADC + """<div class="full ed cx"><div class="fullbar"><div class="in"><button class="x">×</button><div class="ttl">BUZZER10</div><button class="btn gold">Save</button></div></div>
<div class="page"><div class="eg">
<div class="col">
<div class="f2"><label class="fld"><span>Code</span><input class="big" value="BUZZER10"></label><label class="fld"><span>Who it's for</span><input value="Buzzer"></label></div>
<h2 class="sh">Discount</h2>
<div class="f2"><label class="fld"><span>Type</span><span class="dd"><input value="Percentage off" readonly><span class="chev"></span></span></label><label class="fld"><span>Amount</span><span class="sfx"><input class="num" value="10"><em>%</em></span></label></div>
<h2 class="sh">Applies to</h2>
<div class="parts"><div class="pr"><span>Gear rental</span><button class="rm">×</button></div></div>
<label class="dd addp"><input placeholder="Add a service"><span class="chev"></span></label>
<label class="fld" style="margin-top:6px"><span>Minimum spend</span><span class="sfx pre"><em>AED</em><input class="num" placeholder="No minimum"></span></label>
</div>
<div class="col">
<h2 class="sh first">Dates</h2>
<div class="f2"><label class="fld"><span>Starts</span><input value="19 Nov 2026"></label><label class="fld"><span>Ends</span><input value="31 Dec 2026"></label></div>
<h2 class="sh">Limits</h2>
<label class="fld"><span>Total uses</span><input class="num" value="3"></label>
<div class="tg"><span>One use per client</span><button class="sw on"><i></i></button></div>
<div class="tg"><span>Code works</span><button class="sw on"><i></i></button></div>
<h2 class="sh">Used</h2>
<div class="bk"><div><b>FFPS-R-10016</b><span>Buzzer, 20–21 Nov, AED 100 off</span></div></div>
<button class="btn delb">Delete code</button>
</div></div></div></div></div></body></html>"""
open(R + '/mock/codes-edit.html', 'w').write(EDIT)
print('ok')
