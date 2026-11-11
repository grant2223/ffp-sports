import asyncio, sys, json
sys.path.insert(0, '/home/claude/ffp-sports/test'); import mock
from playwright.async_api import async_playwright
B = 'http://localhost:4173'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        for w, h in ((1440, 900), (390, 844)):
            ctx = await b.new_context(viewport={'width': w, 'height': h})
            await ctx.add_init_script("localStorage.setItem('sb-ntqnopvnlnqvhnjkvkxp-auth-token', " + json.dumps(mock.SESSION) + ")")
            pg = await ctx.new_page(); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
            await pg.route('**/*.supabase.co/**', mock.handle)
            await pg.goto(B + '/admin'); await pg.wait_for_timeout(1200)
            await pg.screenshot(path=f'/tmp/a_list_{w}.png')
            await pg.locator('tr.click:has-text("FFPS-R-10001")').click(); await pg.wait_for_timeout(800)
            await pg.screenshot(path=f'/tmp/a_b1_{w}.png', full_page=True)
            print(w, 'full bleed', await pg.evaluate("(()=>{const r=document.querySelector('.full').getBoundingClientRect();return [r.x,r.y,r.width,r.height,innerWidth,innerHeight]})()"))
            await pg.locator('.x').click(); await pg.wait_for_timeout(300)
            await pg.locator('tr.click:has-text("FFPS-R-10002")').click(); await pg.wait_for_timeout(800)
            await pg.screenshot(path=f'/tmp/a_b2_{w}.png', full_page=True)
            await pg.locator('.x').click(); await pg.wait_for_timeout(300)
            for tab in ('Quotes', 'Gear', 'Crew and roles', 'Prices', 'Settings'):
                await pg.locator(f'.tab:has-text("{tab}")').click(); await pg.wait_for_timeout(700)
                await pg.screenshot(path=f'/tmp/a_{tab[:5]}_{w}.png')
            await pg.locator('.tab:has-text("Quotes")').click(); await pg.wait_for_timeout(500)
            await pg.locator('tr.click').first.click(); await pg.wait_for_timeout(900)
            await pg.screenshot(path=f'/tmp/a_quote_{w}.png', full_page=True)
            print(w, 'errs', errs[:5])
            await ctx.close()
        await b.close()
asyncio.run(main())
