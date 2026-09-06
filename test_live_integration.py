import urllib.request
import urllib.error
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

base_fe = 'http://127.0.0.1:5173'
base_be = 'http://127.0.0.1:8300'
headers = {'X-API-Key': 'your-secure-api-key-here', 'Content-Type': 'application/json'}

print('=== 1. Testing Frontend HTML on Port 5173 ===')
req = urllib.request.Request(base_fe)
with urllib.request.urlopen(req) as resp:
    html = resp.read().decode('utf-8')
    assert resp.status == 200
    assert 'lang="fa"' in html
    assert 'dir="rtl"' in html
    assert 'Vazirmatn' in html
    print('Frontend HTML OK: 200 OK, RTL & Vazirmatn font verified.')

print('\n=== 2. Testing Frontend Proxy: /health ===')
req = urllib.request.Request(f'{base_fe}/health')
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode())
    assert resp.status == 200
    assert data['status'] == 'ok'
    print('Proxy /health OK:', data)

print('\n=== 3. Testing Frontend Proxy: /api/v1/dashboard/overview ===')
req = urllib.request.Request(f'{base_fe}/api/v1/dashboard/overview', headers=headers)
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode())
    assert resp.status == 200
    assert 'total_businesses' in data
    print('Proxy Overview OK:', data)

print('\n=== 4. Testing Core Workflow: Create Business via Frontend Proxy ===')
payload = {'name': 'کافه تست ادغام زنده', 'logo_url': 'https://example.com/logo.png'}
req = urllib.request.Request(f'{base_fe}/api/v1/businesses', data=json.dumps(payload).encode('utf-8'), headers=headers, method='POST')
with urllib.request.urlopen(req) as resp:
    biz = json.loads(resp.read().decode('utf-8'))
    assert resp.status == 201
    biz_id = biz['id']
    print(f'Business Created OK: {biz["name"]} (ID: {biz_id})')

print('\n=== 5. Testing Core Workflow: Create Destination via Frontend Proxy ===')
dest_payload = {'business_id': biz_id, 'type': 'GOOGLE_REVIEW', 'url': 'https://g.page/r/tapnow-live-test/review'}
req = urllib.request.Request(f'{base_fe}/api/v1/destinations', data=json.dumps(dest_payload).encode('utf-8'), headers=headers, method='POST')
with urllib.request.urlopen(req) as resp:
    dest = json.loads(resp.read().decode('utf-8'))
    assert resp.status == 201
    dest_id = dest['id']
    print(f'Destination Created OK: [{dest["type"]}] {dest["url"]} (ID: {dest_id})')

print('\n=== 6. Testing Core Workflow: Issue Card via Frontend Proxy ===')
card_payload = {'business_id': biz_id, 'destination_id': dest_id}
req = urllib.request.Request(f'{base_fe}/api/v1/cards', data=json.dumps(card_payload).encode('utf-8'), headers=headers, method='POST')
with urllib.request.urlopen(req) as resp:
    card = json.loads(resp.read().decode('utf-8'))
    assert resp.status == 201
    card_id = card['id']
    card_code = card['code']
    print(f'Card Issued OK: Code={card_code} (ID: {card_id})')

print('\n=== 7. Testing Core Workflow: Fetch Provisioning Workbench Data ===')
req = urllib.request.Request(f'{base_fe}/api/v1/cards/{card_id}/provisioning', headers=headers)
with urllib.request.urlopen(req) as resp:
    prov = json.loads(resp.read().decode('utf-8'))
    assert resp.status == 200
    assert prov['card_code'] == card_code
    assert f'/n/{card_code}' in prov['nfc_url']
    assert f'/q/{card_code}' in prov['qr_url']
    assert f'/q/{card_code}/qr.png' in prov['qr_image_url']
    print(f'Provisioning Data OK: NFC={prov["nfc_url"]}, QR_PNG={prov["qr_image_url"]}')

print('\n=== 8. Testing Core Workflow: Perform QC Checklist Updates ===')
qc_payload = {'qc_nfc_tested': True, 'qc_qr_tested': True, 'qc_destination_verified': True}
req = urllib.request.Request(f'{base_fe}/api/v1/cards/{card_id}', data=json.dumps(qc_payload).encode('utf-8'), headers=headers, method='PATCH')
with urllib.request.urlopen(req) as resp:
    updated_card = json.loads(resp.read().decode('utf-8'))
    assert resp.status == 200
    assert updated_card['qc_nfc_tested'] is True
    assert updated_card['qc_qr_tested'] is True
    assert updated_card['qc_destination_verified'] is True
    print('QC Checklist Update OK: All 3 QC flags verified True (QC PASSED).')

print('\n=== 9. Testing Physical NFC Tap & Redirect Execution ===')
class NoRedirectHandler(urllib.request.HTTPRedirectHandler):
    def http_error_302(self, req, fp, code, msg, headers):
        return fp

opener = urllib.request.build_opener(NoRedirectHandler)
resp = opener.open(f'{base_be}/n/{card_code}')
location = resp.headers.get('Location')
assert location == 'https://g.page/r/tapnow-live-test/review'
print(f'NFC Tap 302 Redirect OK: Location={location}')

print('\n=== 10. Testing Telemetry & Inspector: Recent Event Verification ===')
req = urllib.request.Request(f'{base_fe}/api/v1/cards/{card_id}/info', headers=headers)
with urllib.request.urlopen(req) as resp:
    info = json.loads(resp.read().decode('utf-8'))
    assert resp.status == 200
    assert len(info['recent_events']) >= 1
    latest_evt = info['recent_events'][0]
    assert latest_evt['type'] == 'NFC'
    print(f'Card Inspector OK: Latest event recorded with type={latest_evt["type"]}, created_at={latest_evt["created_at"]}')

print('\n======================================================')
print('ALL LIVE FRONTEND PROXY <-> BACKEND INTEGRATION TESTS PASSED!')
print('======================================================')
