import asyncio, sys, json
sys.path.insert(0, '/home/claude/ffp-sports/test'); import mock
from playwright.async_api import async_playwright
B = 'http://localhost:4173'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        for w, h in ((390, 844), (1440, 900)):
            for path, name in (('/', 'home'), ('/livestream', 'live'), ('/video', 'video'), ('/gear-rental', 'gear'), ('/talent', 'talent'), ('/estimate', 'est'), ('/terms', 'terms')):
                pg = await b.new_page(viewport={'width': w, 'height': h}); errs = []
                pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
                await pg.route('**/*.supabase.co/**', mock.handle)
                await pg.goto(B + path); await pg.wait_for_timeout(700)
                await pg.screenshot(path=f'/tmp/w_{name}_{w}.png')
                broken = await pg.evaluate("[...document.images].filter(i=>i.complete&&i.naturalWidth===0&&i.loading!=='lazy').map(i=>i.src).slice(0,5)")
                print(w, name, 'errs', errs[:3], 'broken', broken)
                await pg.close()
        await b.close()
asyncio.run(main())
