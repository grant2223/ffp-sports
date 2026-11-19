# Builds the three menu options against the live site CSS, images and fonts.
F = ''.join(f'<link rel="stylesheet" href="../node_modules/@fontsource/montserrat/latin-{w}.css">' for w in (400,500,600,700,800))
ITEMS = [("Livestream","Live with scores on screen","gfxplayer"),("Video","Your event filmed in 4K","poolcam"),
         ("Photography","Action, teams and awards","flag"),("Podcasting","A full podcast set at your venue","pod"),
         ("Gear rental","Cameras and kits, run it yourself","stadiumcam")]
ARROW = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFD600" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>'
X = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>'
BAR = '<div class="sb"><b>11:08</b><i></i><span>●●● ▮</span></div>'
TOP = f'<div class="mt"><img src="../public/img/logo-white.png" alt=""><span>{X}</span></div>'
CTA = '<div class="mc"><a class="fs-btn w">Get an estimate</a><a class="fs-btn y">Book now</a></div>'
CSS = '''
body{margin:0;background:#2a2a2a}
.ph{width:393px;height:852px;position:relative;overflow:hidden;background:#0A0A0A;color:#fff;display:flex;flex-direction:column}
.sb{height:54px;display:flex;align-items:center;justify-content:space-between;padding:0 30px 0 34px;font-size:16px;flex:none}
.sb i{width:120px;height:34px;background:#000;border-radius:20px}.sb span{font-size:11px;letter-spacing:2px}
.mt{display:flex;align-items:center;justify-content:space-between;height:56px;padding:0 24px;flex:none}.mt img{height:28px}
.mc{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:16px 24px 34px;flex:none}.mc .fs-btn{min-height:52px;padding:0 10px}
/* A: photo rows */
.A .ls{flex:1;display:flex;flex-direction:column;justify-content:space-evenly;padding:8px 24px}
.A .it{display:grid;grid-template-columns:116px 1fr 22px;gap:18px;align-items:center}
.A .it img{width:116px;height:76px;object-fit:cover;border-radius:3px}
.A .it b{display:block;font-size:23px;font-weight:700;letter-spacing:-.02em;line-height:1.1}
.A .it>span>span{display:block;font-size:14px;font-weight:400;color:rgba(255,255,255,.62);margin-top:4px;line-height:1.35}
/* B: photo bands */
.B .ls{flex:1;display:flex;flex-direction:column;gap:3px;margin-top:6px}
.B .it{flex:1;position:relative;display:flex;align-items:flex-end;justify-content:space-between;padding:0 24px 16px;overflow:hidden}
.B .it img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.B .it:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(10,10,10,.88) 0%,rgba(10,10,10,.55) 55%,rgba(10,10,10,.15) 100%)}
.B .it div,.B .it svg{position:relative;z-index:1}
.B .it b{display:block;font-size:26px;font-weight:800;letter-spacing:-.03em;line-height:1.05}
.B .it span{display:block;font-size:14px;font-weight:400;color:rgba(255,255,255,.78);margin-top:4px}
.B .it.on{box-shadow:inset 4px 0 0 #FFD600}
/* C: photo grid */
.B .it img.live{object-position:center 12%}.C .it img.live{object-position:center 0%}
.C .ls{flex:1;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1.3fr 1fr 1fr;gap:3px;margin-top:6px}
.C .it{position:relative;display:flex;flex-direction:column;justify-content:flex-end;padding:0 14px 14px;overflow:hidden}
.C .it:first-child{grid-column:1/3;padding:0 20px 18px}
.C .it img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.C .it:after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,rgba(10,10,10,.9) 0%,rgba(10,10,10,.35) 55%,rgba(10,10,10,0) 100%)}
.C .it b,.C .it span{position:relative;z-index:1}
.C .it b{font-size:20px;font-weight:800;letter-spacing:-.02em;line-height:1.1}.C .it:first-child b{font-size:28px}
.C .it span{font-size:12.5px;font-weight:400;color:rgba(255,255,255,.78);margin-top:3px;line-height:1.3}
.lab{position:absolute;left:0;right:0;bottom:-46px;text-align:center;font:600 18px Montserrat;color:#fff}
'''
def phone(kind, on=None):
    if kind == 'A':
        ls = ''.join(f'<a class="it"><img src="../public/img/{i}.jpg"><span><b>{t}</b><span>{s}</span></span>{ARROW}</a>' for t,s,i in ITEMS)
    elif kind == 'B':
        ls = ''.join(f'<a class="it{" on" if t==on else ""}"><img src="../public/img/{i}.jpg" class="{"live" if i=="gfxplayer" else ""}"><div><b>{t}</b><span>{s}</span></div>{ARROW}</a>' for t,s,i in ITEMS)
    else:
        ls = ''.join(f'<a class="it{" gear" if t=="Gear rental" else ""}"><img src="../public/img/{i}.jpg" class="{"live" if i=="gfxplayer" else ""}"><b>{t}</b><span>{s}</span></a>' for t,s,i in ITEMS)
    return f'<div class="fs {kind}"><div class="ph">{BAR}{TOP}<nav class="ls">{ls}</nav>{CTA}</div></div>'
open('mock/menu.html','w').write(f'<!doctype html><html><head><meta charset="utf-8">{F}<link rel="stylesheet" href="../src/web/web.css"><style>{CSS}</style></head><body><div style="display:flex;gap:40px;padding:30px 30px 80px">'
  + ''.join(f'<div style="position:relative">{phone(k, "Livestream")}<div class="lab">{l}</div></div>' for k,l in (("A","A  Photo rows"),("B","B  Photo bands"),("C","C  Photo grid"))) + '</div></body></html>')
