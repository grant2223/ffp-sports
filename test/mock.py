import json, re, time, urllib.parse
F = json.load(open('/home/claude/ffp-sports/test/fixtures.json'))
NOW = '2026-11-11T09:00:00+00:00'
F['bookings'] = [
 dict(id='b1', ref='FFPS-R-10001', kind='booking', status='requested', service_id='live', mode='crew', choices={'dur': 'day'}, event_date='2026-12-12', start_time='15:00', sport='Rugby', venue='The Sevens Stadium, Dubai', zone_id='dubai',
      first_name='Sara', last_name='Malik', org='Dubai Hurricanes', email='sara@club.com', phone='+971500000000', total=13500, subtotal=13500, discount=0, cost=7580, deposit=0, pay_plan='split', paid=0, notes='Final day, 3 matches.', admin_notes='', created_at=NOW, kind_='', code=None, id_doc_path=None),
 dict(id='b2', ref='FFPS-R-10002', kind='booking', status='confirmed', service_id=None, mode='gear', choices={}, gear_from='2026-11-13', gear_to='2026-11-14', handover='delivery', address='Dubai Media City', zone_id='dubai',
      first_name='Kirby', last_name='Lane', org='Augustus Media', email='kirby@example.com', phone='+971501111111', total=3350, subtotal=3350, discount=0, cost=840, deposit=1500, pay_plan='full', paid=0, notes='', admin_notes='', created_at=NOW, code=None, id_doc_path='b2/id.jpg'),
 dict(id='b3', ref='FFPS-R-10003', kind='estimate', status='requested', service_id=None, mode='crew', choices={}, event_date='2027-01-20', sport='Padel', venue='Dubai Sports City', zone_id='dubai',
      first_name='Omar', last_name='Haddad', org='Padel League UAE', email='omar@example.com', phone='', total=42000, subtotal=42000, discount=0, cost=0, deposit=0, pay_plan='full', paid=0, notes='Event: Dubai Padel Open\nLevel: National', admin_notes='', created_at=NOW, code=None, id_doc_path=None)]
F['booking_lines'] = [dict(id=1, booking_id='b1', label='3 cameras, full day', amount=10000, sort=0), dict(id=2, booking_id='b1', label='Commentator, club level', amount=2000, sort=1), dict(id=3, booking_id='b1', label='Highlights reel', amount=600, sort=2), dict(id=4, booking_id='b1', label='Extra hour', amount=900, sort=3),
 dict(id=5, booking_id='b2', label='3 × Sony Z200 camera, 1 day', amount=2250, sort=0), dict(id=6, booking_id='b2', label='8 × Video tripod with fluid head, 1 day', amount=800, sort=1), dict(id=7, booking_id='b2', label='Drop-off, Dubai', amount=150, sort=2), dict(id=8, booking_id='b2', label='Pick-up, Dubai', amount=150, sort=3),
 dict(id=9, booking_id='b3', label='Livestream, 4 courts, 2 cameras each, 8 hours, 2 days', amount=80000, sort=0)]
F['assignments'] = [dict(id=1, booking_id='b1', role_id='camera-operator', staff_id='s2', day_rate=2000, status='confirmed'), dict(id=2, booking_id='b1', role_id='technical-director-vision-mixer', staff_id=None, day_rate=2000, status='open'), dict(id=3, booking_id='b1', role_id='commentator', staff_id='s1', day_rate=1000, status='asked')]
F['gear_holds'] = [dict(id=1, booking_id='b2', gear_id='z200', qty=3, date_from='2026-11-13', date_to='2026-11-14', bookings=dict(ref='FFPS-R-10002', status='confirmed', first_name='Kirby', last_name='Lane', org='Augustus Media', handover='delivery')),
                   dict(id=2, booking_id='b2', gear_id='tripod', qty=8, date_from='2026-11-13', date_to='2026-11-14', bookings=dict(ref='FFPS-R-10002', status='confirmed', first_name='Kirby', last_name='Lane', org='Augustus Media', handover='delivery'))]
F['payments'] = []
F['staff'] = [dict(id='s1', email='grant@findfitpeople.com', first_name='Grant', middle_names='', last_name='Goes', phone='+971562617359', is_admin=True, is_crew=True, active=True, notes=''),
              dict(id='s2', email='ali@example.com', first_name='Ali', middle_names='', last_name='Hassan', phone='+971502222222', is_admin=False, is_crew=True, active=True, notes='')]
F['staff_roles'] = [dict(staff_id='s1', role_id='commentator', day_rate=None), dict(staff_id='s2', role_id='camera-operator', day_rate=2000), dict(staff_id='s2', role_id='technical-director-vision-mixer', day_rate=None)]
F['quotes'] = [dict(id='q1', number='FFPS-Q-0144', status='draft', org='Augustus Media', attention='Kirby', email='kirby@example.com', subject='Gear rental, Sony Z200 and tripods', issue_date='2026-11-11', valid_until='2026-11-12',
                    lines=[dict(desc='Sony Z200 camera rental', note='Broadcast camcorder, 20x zoom', qty=8, days=1, unit=750, cost=0), dict(desc='Video tripod with fluid head rental', qty=8, days=1, unit=100, cost=0), dict(desc='Drop-off, Dubai', note='Fri 13 Nov 2026, 9:00 am', qty=1, unit=150, cost=75), dict(desc='Pick-up, Dubai', qty=1, unit=150, cost=75)],
                    terms=['Dates: drop-off Fri 13 Nov 2026 at 9:00 am.', 'Location: Dubai.'], total=7100, cost=150, created_at=NOW)]
F['partner_codes'] = []
F['email_log'] = [dict(id=1, to_email='sara@club.com', subject='We have your request FFPS-R-10001', kind='booking_received', ok=False, error='Email not set up yet (RESEND_API_KEY missing)', created_at=NOW)]

# mirror migration 0005: public role rates without cost, service roles, new add-ons
import re as _re
F['role_rates'] = [{k: v for k, v in r.items() if k != 'cost_day'} for r in F['roles']]
_sql = open('/home/claude/ffp-sports/supabase/migrations/0005_addons_crew.sql').read()
_ids = {sv: _re.findall(r"'([a-z0-9-]+)'", _re.search(r"select '%s', r.id.*?\);" % sv, _sql, _re.S).group(0).split('in (', 1)[1]) for sv in ('live', 'pod')}
F['service_roles'] = [dict(service_id=sv, role_id=r['id'], sort=r['sort']) for sv in _ids for r in F['roles'] if r['id'] in _ids[sv]]
for _m in _re.finditer(r"\('((?:live|pod)-a\d+)','(live|pod)','addon','([^']+)','([^']+)','',(\d+),(\d+),(\d+),(\d+),false,0,null,(\d+)\)", _sql):
    i, sv, n, st, p2, pd, c2, cd, so = _m.groups()
    F['extras'].append(dict(id=i, service_id=sv, kind='addon', name=n, strap=st, img='', price_2h=int(p2), price_day=int(pd), cost_2h=int(c2), cost_day=int(cd), per_crew_hour=False, adds_crew=0, pick_group=None, sort=int(so), active=True))
for _e in F['extras']:
    if _e['id'] in ('live-a0', 'live-a1', 'live-a2', 'live-a3'): _e['active'] = False

# mirror migration 0006
_X = {e['id']: e for e in F['extras']}
def _px(i, p, c): _X[i].update(price_2h=p, price_day=p, cost_2h=c, cost_day=c)
_px('pod-e1', 750, 375); _px('pod-e2', 1500, 750); _px('video-e1', 1500, 750); _px('video-e3', 3500, 1750)
_X['pod-a0']['name'] = 'Live podcast'; _X['video-a0']['name'] = 'Interview set-up'
for _i, _n, _p, _so, _img in [('video-e4', 'Interviews', 900, 2, '/img/b-8f0ec58048090ca3eb10fb0297b161d4.jpg'), ('video-e5', 'Social clips', 600, 3, '/img/fans.jpg'), ('video-e6', 'Live stories', 1000, 4, '/img/flag.jpg')]:
    F['extras'].append(dict(id=_i, service_id='video', kind='edit_level', name=_n, strap='', img=_img, price_2h=_p, price_day=_p, cost_2h=_p/2, cost_day=_p/2, per_crew_hour=False, adds_crew=0, pick_group=None, sort=_so, active=True))
_X['video-e2']['sort'] = 10; _X['video-e3']['sort'] = 11
for _pk in F['packages']:
    _pk['name'] = {'live-one': 'Single-camera set-up', 'live-three': '3-camera set-up', 'pod-pod': 'Podcast set-up', 'video-video': 'Videographer', 'photo-photo': 'Photographer'}.get(_pk['id'], _pk['name'])
F['roles'].append(dict(id='national-commentator', group_id='talent', name='Commentator, national level', client_day=8500, cost_day=5000, sort=29, active=True))
F['role_rates'].append(dict(id='national-commentator', group_id='talent', name='Commentator, national level', client_day=8500, sort=29, active=True))
F['service_roles'].append(dict(service_id='live', role_id='national-commentator', sort=29))

# mirror migration 0007
import json as _json
for _k, _v in _json.load(open('/home/claude/ffp-sports/test/details.json')).items():
    if _k in _X: _X[_k]['details'] = _v
_X['pod-e2']['name'] = 'Multi-camera episode edit'

# mirror migration 0008 (test talent so the booking shows a card)
F['service_roles'] = [r for r in F['service_roles'] if r['role_id'] not in ('commentator', 'co-commentator-or-analyst', 'presenter-or-host', 'mc', 'reporter-or-sideline-interviewer', 'stadium-announcer', 'hype-host-or-dj', 'national-commentator')]
F['talent_rates'] = [dict(staff_id='t1', first_name='Test', last_name='Talent', photo_url='/img/grant.jpg', role_id='commentator', role_name='Commentator', client_day=2300)]
F['gear_parts'] = []

F['invoices'] = [dict(id='i1', number='FFPS-INV-0001', status='draft', quote_id=None, booking_id=None, quote_number='FFPS-Q-0143', org='Augustus Media', attention='Kirby', email='kirby@augustusmedia.com',
  subject='Camera rental, 8 Sony PXW-Z200 kits', issue_date='2026-11-12', due_date='2026-11-12', total=7100, paid=0, created_at=NOW, sent_at=None, paid_at=None,
  lines=[dict(desc='Sony PXW-Z200 4K camcorder', note='20x optical zoom, 2 batteries, charger, carry bag', qty=8, days=1, unit=750, cost=0), dict(desc='Video tripod with fluid head', note='Matched to the Z200', qty=8, days=1, unit=100, cost=0),
         dict(desc='Drop-off, Dubai', note='Fri 13 Nov 2026, 9:00 am', qty=1, days=1, unit=150, cost=0), dict(desc='Pick-up, Dubai', note='End of hire', qty=1, days=1, unit=150, cost=0)],
  terms=['Hire: 1 day, from Fri 13 Nov 2026.', 'Location: Dubai, drop-off and pick-up.'])]
sent = []

def handle(route, req):
    u = urllib.parse.urlparse(req.url); path = u.path; q = urllib.parse.parse_qs(u.query)
    J = lambda body, status=200, headers=None: route.fulfill(status=status, content_type='application/json', body=json.dumps(body), headers={'access-control-allow-origin': '*', 'content-range': '0-0/%d' % (len(body) if isinstance(body, list) else 1), **(headers or {})})
    if req.method == 'OPTIONS': return route.fulfill(status=200, headers={'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*'})
    if path.startswith('/functions/v1/api'):
        b = json.loads(req.post_data or '{}'); sent.append(b)
        if b.get('action') == 'create_booking': return J({'ref': 'FFPS-R-10044', 'total': 1})
        if b.get('action') == 'request_estimate': return J({'ref': 'FFPS-R-10045'})
        if b.get('action') == 'check_code': return J({'pct': 5 if b.get('code', '').upper() == 'HURRICANES' else 0})
        return J({'status': 'ok', 'ok': True})
    if path.startswith('/rest/v1/rpc/'):
        fn = path.split('/')[-1]
        if fn == 'gear_free': return J([{'gear_id': g['id'], 'free': g['units'] - (1 if g['id'] == 'z200' else 0)} for g in F['gear']])
        if fn in ('is_admin',): return J(True)
        if fn == 'claim_staff': return J(F['staff'][0])
        return J(None)
    if path.startswith('/rest/v1/'):
        t = path.split('/')[-1]; rows = list(F.get(t, []))
        for k, v in q.items():
            if k in ('select', 'order', 'limit', 'offset'): continue
            v = v[0]
            if v.startswith('eq.'): rows = [r for r in rows if str(r.get(k.split('.')[-1])).lower() == v[3:].lower()]
            elif v.startswith('in.('): vals = v[4:-1].split(','); rows = [r for r in rows if str(r.get(k)) in [x.strip('"') for x in vals]]
        if req.method != 'GET': return J(rows[:1] if 'single' not in (req.headers.get('accept') or '') else (rows[0] if rows else {}), 201)
        if 'vnd.pgrst.object' in (req.headers.get('accept') or ''): return J(rows[0] if rows else {})
        if req.method == 'HEAD' or (req.headers.get('prefer') or '').find('count') >= 0: return route.fulfill(status=200, headers={'content-range': '0-%d/%d' % (len(rows), len([r for r in rows])), 'access-control-allow-origin': '*', 'access-control-expose-headers': 'content-range'}, body='[]')
        return J(rows)
    if path.startswith('/auth/v1/user'): return J({'id': 'u1', 'email': 'grant@findfitpeople.com', 'aud': 'authenticated', 'role': 'authenticated'})
    if path.startswith('/auth/v1/'): return J({})
    return route.continue_()

SESSION = json.dumps({'access_token': 'x.y.z', 'token_type': 'bearer', 'expires_in': 3600, 'expires_at': int(time.time()) + 36000, 'refresh_token': 'r',
                      'user': {'id': 'u1', 'email': 'grant@findfitpeople.com', 'aud': 'authenticated', 'role': 'authenticated', 'app_metadata': {}, 'user_metadata': {}, 'created_at': NOW}})
