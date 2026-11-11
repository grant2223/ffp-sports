import asyncio, sys, json
sys.path.insert(0, '/home/claude/ffp-sports/test'); import mock
from playwright.async_api import async_playwright
B = 'http://localhost:4173'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        for w, h in ((390, 844), (1440, 900)):
            for svc in ('live', 'video', 'gear'):
                pg = await b.new_page(viewport={'width': w, 'height': h}); errs = []
                pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
                await pg.route('**/*.supabase.co/**', mock.handle)
                await pg.goto(B + '/book?s=' + svc); await pg.wait_for_timeout(600)
                nb = lambda: pg.locator('.nav .btn.gold' if w > 960 else '.fbar .btn.gold')
                t = f'{svc}_{w}'
                await pg.screenshot(path=f'/tmp/b1_{t}.png')
                await nb().click(); await pg.wait_for_timeout(200)
                if svc == 'live':
                    await pg.locator('.qo:has-text("3 cameras")').click(); await pg.locator('.qo:has-text("Full day")').click()
                elif svc == 'video':
                    await pg.locator('.qo:has-text("Full day")').click()
                else:
                    await pg.locator('.gq:has(b:text-is("Sony Z200 camera")) button[aria-label=More]').click()
                    await pg.locator('.gq:has(b:text-is("Video tripod with fluid head")) button[aria-label=More]').click()
                await pg.wait_for_timeout(150); await pg.screenshot(path=f'/tmp/b2_{t}.png'); await nb().click(); await pg.wait_for_timeout(200)
                if svc == 'live': await pg.locator('.xi:has-text("Commentator, national level")').click()
                if svc == 'video': await pg.locator('.qo:has-text("Highlights and full film")').click(); await pg.locator('.xi:has-text("Branded opener")').click()
                if svc == 'gear': await pg.locator('.xi').first.click()
                await pg.wait_for_timeout(150); await pg.screenshot(path=f'/tmp/b3_{t}.png'); await nb().click(); await pg.wait_for_timeout(200)
                if svc == 'gear':
                    await pg.fill('#gf', '2026-11-13'); await pg.fill('#gt', '2026-11-16'); await pg.locator('.ch:has-text("Drop off")').click(); await pg.fill('#ga', 'Dubai Media City')
                else:
                    await pg.fill('#bd', '2026-12-12'); await pg.fill('#bv', 'The Sevens Stadium, Dubai')
                    if svc == 'live': await pg.select_option('#bz', 'abudhabi')
                await pg.wait_for_timeout(300); await pg.screenshot(path=f'/tmp/b4_{t}.png'); await nb().click(); await pg.wait_for_timeout(200)
                await pg.fill('#dn', 'Sara'); await pg.fill('#dl', 'Malik'); await pg.fill('#de', 'sara@club.com'); await pg.fill('#dp', '+971500000000')
                if svc == 'gear': await pg.set_input_files('#did', '/home/claude/ffp-sports/public/img/logo.png')
                await pg.fill('#dc', 'hurricanes'); await pg.locator('button:has-text("Apply")').click(); await pg.wait_for_timeout(300)
                await pg.screenshot(path=f'/tmp/b5_{t}.png'); await nb().click(); await pg.wait_for_timeout(200)
                await pg.locator('button:has-text("I accept the booking agreement")').click(); await pg.wait_for_timeout(150)
                await pg.screenshot(path=f'/tmp/b6_{t}.png', full_page=True)
                price = (await pg.locator('.rv').last.inner_text()).replace('\n', ' | ')
                await nb().click(); await pg.wait_for_timeout(500)
                await pg.screenshot(path=f'/tmp/b7_{t}.png')
                sent = [x for x in mock.sent if x.get('action') == 'create_booking'][-1]
                print(w, svc, price[:300]); print('   sent choices', json.dumps(sent['choices'])[:300], 'code', sent.get('code'), 'id_doc', bool(sent.get('id_doc')), 'errs', errs[:3])
                print('   final:', (await pg.locator('.okp').inner_text())[:60].replace('\n', ' | '))
                await pg.close()
        await b.close()
asyncio.run(main())
