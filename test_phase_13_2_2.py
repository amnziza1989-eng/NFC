import urllib.request
import urllib.error
import json
import sys
import datetime

sys.stdout.reconfigure(encoding='utf-8')

base_fe = 'http://127.0.0.1:5173'
base_be = 'http://127.0.0.1:8300'
headers = {'X-API-Key': 'your-secure-api-key-here', 'Content-Type': 'application/json'}

def test_phase_13_2_2_workflows():
    print('=== PHASE 13.2.2 AUTOMATED VERIFICATION SUITE ===')

    # Step 1: Create a Business
    print('\n[1] Creating test business...')
    biz_payload = {'name': 'کافه رستوران فاز ۱۳.۲', 'logo_url': 'https://example.com/phase13-logo.png'}
    req = urllib.request.Request(f'{base_fe}/api/v1/businesses', data=json.dumps(biz_payload).encode('utf-8'), headers=headers, method='POST')
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 201
        biz = json.loads(resp.read().decode('utf-8'))
        biz_id = biz['id']
        print(f'✓ Business Created: {biz["name"]} ({biz_id})')

    # Step 2: Create a Destination
    print('\n[2] Creating destination...')
    dest_payload = {'business_id': biz_id, 'type': 'GOOGLE_REVIEW', 'url': 'https://g.page/r/test-phase13/review'}
    req = urllib.request.Request(f'{base_fe}/api/v1/destinations', data=json.dumps(dest_payload).encode('utf-8'), headers=headers, method='POST')
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 201
        dest = json.loads(resp.read().decode('utf-8'))
        dest_id = dest['id']
        print(f'✓ Destination Created: [{dest["type"]}] {dest["url"]} ({dest_id})')

    # Step 3: Issue a Card
    print('\n[3] Issuing card...')
    card_payload = {'business_id': biz_id, 'destination_id': dest_id}
    req = urllib.request.Request(f'{base_fe}/api/v1/cards', data=json.dumps(card_payload).encode('utf-8'), headers=headers, method='POST')
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 201
        card = json.loads(resp.read().decode('utf-8'))
        card_id = card['id']
        card_code = card['code']
        print(f'✓ Card Issued: Code={card_code} ({card_id})')

    # Step 4: Simulate NFC and QR interactions
    print('\n[4] Simulating physical customer interactions (NFC & QR)...')
    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def http_error_302(self, req, fp, code, msg, headers):
            return fp

    opener = urllib.request.build_opener(NoRedirect)
    # 2 NFC taps
    r1 = opener.open(f'{base_be}/n/{card_code}')
    assert r1.headers.get('Location') == 'https://g.page/r/test-phase13/review'
    r2 = opener.open(f'{base_be}/n/{card_code}')
    # 1 QR scan
    r3 = opener.open(f'{base_be}/q/{card_code}')
    assert r3.headers.get('Location') == 'https://g.page/r/test-phase13/review'
    print('✓ Interactions recorded: 2 NFC taps, 1 QR scan (Total = 3)')

    # Step 5: Test Business Analytics with Date Filtering
    print('\n[5] Testing Business Analytics endpoint with Date Range...')
    today_str = datetime.date.today().isoformat()
    req = urllib.request.Request(f'{base_fe}/api/v1/businesses/{biz_id}/analytics?start_date={today_str}&end_date={today_str}', headers=headers)
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        b_analytics = json.loads(resp.read().decode('utf-8'))
        assert b_analytics['total'] >= 3
        assert b_analytics['nfc'] >= 2
        assert b_analytics['qr'] >= 1
        assert b_analytics['total_cards'] >= 1
        assert len(b_analytics['recent']) >= 3
        print(f'✓ Business Analytics verified: Total={b_analytics["total"]}, NFC={b_analytics["nfc"]}, QR={b_analytics["qr"]}, RecentEvents={len(b_analytics["recent"])}')

    # Step 6: Test Card Analytics with Date Filtering
    print('\n[6] Testing Card Analytics endpoint with Date Range...')
    req = urllib.request.Request(f'{base_fe}/api/v1/cards/{card_id}/analytics?start_date={today_str}&end_date={today_str}', headers=headers)
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        c_analytics = json.loads(resp.read().decode('utf-8'))
        assert c_analytics['total'] >= 3
        assert c_analytics['nfc'] >= 2
        assert c_analytics['qr'] >= 1
        assert len(c_analytics['recent']) >= 3
        print(f'✓ Card Analytics verified: Total={c_analytics["total"]}, NFC={c_analytics["nfc"]}, QR={c_analytics["qr"]}')

    # Step 7: Test Business Detail Drawer Edit Mutation
    print('\n[7] Testing Business Edit Mutation (PATCH /api/v1/businesses/{id})...')
    edit_biz_payload = {
        'name': 'کافه رستوران فاز ۱۳.۲ (ویرایش شده)',
        'logo_url': 'https://example.com/updated-logo.png',
        'status': 'ACTIVE'
    }
    req = urllib.request.Request(f'{base_fe}/api/v1/businesses/{biz_id}', data=json.dumps(edit_biz_payload).encode('utf-8'), headers=headers, method='PATCH')
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        updated_biz = json.loads(resp.read().decode('utf-8'))
        assert updated_biz['name'] == 'کافه رستوران فاز ۱۳.۲ (ویرایش شده)'
        assert updated_biz['logo_url'] == 'https://example.com/updated-logo.png'
        print(f'✓ Business Edit succeeded: New Name="{updated_biz["name"]}"')

    # Step 8: Test Destination Detail Drawer Edit Mutation
    print('\n[8] Testing Destination Edit Mutation (PATCH /api/v1/destinations/{id})...')
    edit_dest_payload = {
        'url': 'https://g.page/r/updated-destination/review',
        'type': 'GOOGLE_REVIEW',
        'status': 'ACTIVE'
    }
    req = urllib.request.Request(f'{base_fe}/api/v1/destinations/{dest_id}', data=json.dumps(edit_dest_payload).encode('utf-8'), headers=headers, method='PATCH')
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        updated_dest = json.loads(resp.read().decode('utf-8'))
        assert updated_dest['url'] == 'https://g.page/r/updated-destination/review'
        print(f'✓ Destination Edit succeeded: New Target="{updated_dest["url"]}"')

    # Step 9: Verify Destination update dynamically redirects physical card
    print('\n[9] Verifying updated destination dynamically redirects NFC card...')
    r4 = opener.open(f'{base_be}/n/{card_code}')
    assert r4.headers.get('Location') == 'https://g.page/r/updated-destination/review'
    print(f'✓ Dynamic redirection verified: New Location={r4.headers.get("Location")}')

    # Step 10: Negative Validation Tests
    print('\n[10] Testing Negative Validation Cases...')
    # Invalid logo_url (e.g., javascript:)
    try:
        bad_biz = {'logo_url': 'javascript:alert(1)'}
        req = urllib.request.Request(f'{base_fe}/api/v1/businesses/{biz_id}', data=json.dumps(bad_biz).encode('utf-8'), headers=headers, method='PATCH')
        urllib.request.urlopen(req)
        assert False, 'Should have failed'
    except urllib.error.HTTPError as e:
        assert e.code == 422
        print('✓ Negative Test Passed: Invalid logo_url rejected with HTTP 422')

    # Invalid destination URL (e.g., no scheme)
    try:
        bad_dest = {'url': 'invalid-url-no-scheme'}
        req = urllib.request.Request(f'{base_fe}/api/v1/destinations/{dest_id}', data=json.dumps(bad_dest).encode('utf-8'), headers=headers, method='PATCH')
        urllib.request.urlopen(req)
        assert False, 'Should have failed'
    except urllib.error.HTTPError as e:
        assert e.code == 422
        print('✓ Negative Test Passed: Invalid destination URL rejected with HTTP 422')

    # Invalid Date Range (start_date > end_date)
    try:
        req = urllib.request.Request(f'{base_fe}/api/v1/businesses/{biz_id}/analytics?start_date=2026-12-31&end_date=2026-01-01', headers=headers)
        urllib.request.urlopen(req)
        assert False, 'Should have failed'
    except urllib.error.HTTPError as e:
        assert e.code == 422
        print('✓ Negative Test Passed: Invalid date range rejected with HTTP 422')

    print('\n=============================================================')
    print('ALL PHASE 13.2.2 AUTOMATED INTEGRATION TESTS PASSED (10/10)!')
    print('=============================================================')

if __name__ == '__main__':
    test_phase_13_2_2_workflows()
