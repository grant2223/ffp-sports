import asyncio, sys
sys.path.insert(0, '/home/claude/ffp-sports/test'); import mock
from playwright.async_api import async_playwright
B = 'http://localhost:4173'
PAGES = (('/', 'home'), ('/livestream', 'live'), ('/video', 'video'), ('/photography', 'photo'), ('/podcasting', 'pod'), ('/gear-rental', 'gear'), ('/talent', 'talent'), ('/book', 'book'), ('/estimate', 'est'))
async def main():
    only = sys.argv[1:]
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        for w, h in ((390, 844), (1440, 900)):
            for path, name in PAGES:
                if only and name not in only: continue
                pg = await b.new_page(viewport={'width': w, 'height': h}); errs = []
                pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
                await pg.route('**/*.supabase.co/**', mock.handle)
                await pg.goto(B + path); await pg.wait_for_timeout(600)
                await pg.evaluate("document.querySelectorAll('img[loading=lazy]').forEach(i=>i.loading='eager')"); await pg.wait_for_timeout(500)
                await pg.screenshot(path=f'/tmp/w_{name}_{w}.png', full_page=True)
                broken = await pg.evaluate("[...document.images].filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.src).slice(0,5)")
                over = await pg.evaluate("document.documentElement.scrollWidth > innerWidth")
                dots = await pg.evaluate("document.body.innerText.includes('·')")
                print(w, name, 'errs', errs[:3], 'broken', broken, 'hscroll', over, 'dot', dots)
                await pg.close()
        await b.close()
asyncio.run(main())
