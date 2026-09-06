import urllib.request
import urllib.error
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

base_fe = 'http://127.0.0.1:5173'
base_be = 'http://127.0.0.1:8300'
headers = {'X-API-Key': 'your-secure-api-key-here', 'Content-Type': 'application/json'}

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def http_error_302(self, req, fp, code, msg, headers):
        return fp

opener = urllib.request.build_opener(NoRedirect)

def test_phase_13_3_suite():
    print('=== PHASE 13.3 ORDER-BASED PROVISIONING VERIFICATION SUITE ===')

    # Step 1: Create Business and Destination
    print('\n[1] Creating test Business and Destination...')
    biz_payload = {'name': 'هلدینگ سفارشات فاز ۱۳.۳', 'logo_url': 'https://example.com/order-logo.png'}
    req = urllib.request.Request(f'{base_fe}/api/v1/businesses', data=json.dumps(biz_payload).encode('utf-8'), headers=headers, method='POST')
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 201
        biz = json.loads(resp.read().decode('utf-8'))
        biz_id = biz['id']
        print(f'✓ Business Created: {biz["name"]} ({biz_id})')

    dest_payload = {'business_id': biz_id, 'type': 'GOOGLE_REVIEW', 'url': 'https://g.page/r/phase13-3-order/review'}
    req = urllib.request.Request(f'{base_fe}/api/v1/destinations', data=json.dumps(dest_payload).encode('utf-8'), headers=headers, method='POST')
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 201
        dest = json.loads(resp.read().decode('utf-8'))
        dest_id = dest['id']
        print(f'✓ Destination Created: [GOOGLE_REVIEW] {dest["url"]} ({dest_id})')

    # Step 2: Test NFC_ONLY Product Order Workflow (Quantity = 1)
    print('\n[2] Testing NFC_ONLY Product Order Workflow (Quantity = 1)...')
    order_payload = {
        'business_id': biz_id,
        'destination_id': dest_id,
        'product_type': 'NFC_ONLY',
        'quantity': 1,
    }
    req = urllib.request.Request(f'{base_fe}/api/v1/orders', data=json.dumps(order_payload).encode('utf-8'), headers=headers, method='POST')
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 201
        order_nfc = json.loads(resp.read().decode('utf-8'))
        order_nfc_id = order_nfc['id']
        assert order_nfc['product_type'] == 'NFC_ONLY'
        assert order_nfc['physical_template'] == 'NFC_ONLY_TEMPLATE'
        assert order_nfc['quantity'] == 1
        assert order_nfc['status'] == 'CREATED'
        print(f'✓ Order Created: {order_nfc["order_number"]} | Product={order_nfc["product_type"]} | Template={order_nfc["physical_template"]}')

    # Generate Card for NFC_ONLY order
    print('   Generating digital card for NFC_ONLY order...')
    req = urllib.request.Request(f'{base_fe}/api/v1/orders/{order_nfc_id}/generate-cards', headers=headers, method='POST')
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        gen_res = json.loads(resp.read().decode('utf-8'))
        assert gen_res['generated_count'] == 1
        assert len(gen_res['cards']) == 1
        nfc_card = gen_res['cards'][0]
        assert nfc_card['order_id'] == order_nfc_id
        assert nfc_card['business_id'] == biz_id
        assert nfc_card['destination_id'] == dest_id
        nfc_card_code = nfc_card['code']
        print(f'✓ Card Generated: Code={nfc_card_code} (Linked to Order {order_nfc["order_number"]})')

    # Test NFC tap redirect for NFC_ONLY card
    r_nfc = opener.open(f'{base_be}/n/{nfc_card_code}')
    assert r_nfc.headers.get('Location') == 'https://g.page/r/phase13-3-order/review'
    print(f'✓ NFC Tap 302 Redirect verified: Location={r_nfc.headers.get("Location")}')

    # Step 3: Test NFC_QR Product Order Workflow (Quantity = 5)
    print('\n[3] Testing NFC_QR Product Order Workflow (Quantity = 5)...')
    order_qr_payload = {
        'business_id': biz_id,
        'destination_id': dest_id,
        'product_type': 'NFC_QR',
        'quantity': 5,
    }
    req = urllib.request.Request(f'{base_fe}/api/v1/orders', data=json.dumps(order_qr_payload).encode('utf-8'), headers=headers, method='POST')
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 201
        order_qr = json.loads(resp.read().decode('utf-8'))
        order_qr_id = order_qr['id']
        assert order_qr['product_type'] == 'NFC_QR'
        assert order_qr['physical_template'] == 'NFC_QR_TEMPLATE'
        assert order_qr['quantity'] == 5
        print(f'✓ Order Created: {order_qr["order_number"]} | Product={order_qr["product_type"]} | Template={order_qr["physical_template"]}')

    # Generate 5 Cards for NFC_QR order
    print('   Generating 5 digital cards for NFC_QR order...')
    req = urllib.request.Request(f'{base_fe}/api/v1/orders/{order_qr_id}/generate-cards', headers=headers, method='POST')
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        gen_res_qr = json.loads(resp.read().decode('utf-8'))
        assert gen_res_qr['generated_count'] == 5
        assert len(gen_res_qr['cards']) == 5
        qr_codes = [c['code'] for c in gen_res_qr['cards']]
        assert len(set(qr_codes)) == 5  # All unique
        print(f'✓ 5 Cards Generated with unique codes: {qr_codes}')

    # Verify QR PNG image generation for one of the cards
    test_qr_code = qr_codes[0]
    req_qr_img = urllib.request.Request(f'{base_be}/q/{test_qr_code}/qr.png')
    with urllib.request.urlopen(req_qr_img) as resp:
        assert resp.status == 200
        assert resp.headers.get('Content-Type') == 'image/png'
        print(f'✓ Dynamic QR PNG verified for card {test_qr_code}: 200 image/png')

    # Step 4: Test Idempotency / Duplicate Protection
    print('\n[4] Testing Idempotency (Repeat generation on already-generated order)...')
    req = urllib.request.Request(f'{base_fe}/api/v1/orders/{order_qr_id}/generate-cards', headers=headers, method='POST')
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        idem_res = json.loads(resp.read().decode('utf-8'))
        assert idem_res['generated_count'] == 5
        assert len(idem_res['cards']) == 5
        assert [c['code'] for c in idem_res['cards']] == qr_codes
        print('✓ Idempotency verified: Repeat call returned existing 5 cards without creating duplicates.')

    # Step 5: Test Quantity Accuracy (Quantity = 10)
    print('\n[5] Testing Quantity Accuracy (Bulk Order: Quantity = 10)...')
    bulk_payload = {
        'business_id': biz_id,
        'destination_id': dest_id,
        'product_type': 'NFC_QR',
        'quantity': 10,
    }
    req = urllib.request.Request(f'{base_fe}/api/v1/orders', data=json.dumps(bulk_payload).encode('utf-8'), headers=headers, method='POST')
    with urllib.request.urlopen(req) as resp:
        bulk_order = json.loads(resp.read().decode('utf-8'))
        bulk_order_id = bulk_order['id']

    req = urllib.request.Request(f'{base_fe}/api/v1/orders/{bulk_order_id}/generate-cards', headers=headers, method='POST')
    with urllib.request.urlopen(req) as resp:
        bulk_gen = json.loads(resp.read().decode('utf-8'))
        assert bulk_gen['generated_count'] == 10
        assert len(bulk_gen['cards']) == 10
        print(f'✓ Exact 10 cards generated: Requested=10, Generated={bulk_gen["generated_count"]}')

    # Verify GET /api/v1/orders/{id}/cards returns exactly 10 cards
    req = urllib.request.Request(f'{base_fe}/api/v1/orders/{bulk_order_id}/cards', headers=headers)
    with urllib.request.urlopen(req) as resp:
        cards_list = json.loads(resp.read().decode('utf-8'))
        assert len(cards_list) == 10
        print(f'✓ GET /orders/{{id}}/cards verified: Exactly {len(cards_list)} card provisioning records returned.')

    # Step 6: Test Order Lifecycle Status Transitions
    print('\n[6] Testing Order Lifecycle Status Transitions...')
    # 6.1 Transition to PROVISIONING and QC_PENDING
    for st in ['PROVISIONING', 'QC_PENDING']:
        patch_payload = {'status': st}
        req = urllib.request.Request(f'{base_fe}/api/v1/orders/{bulk_order_id}', data=json.dumps(patch_payload).encode('utf-8'), headers=headers, method='PATCH')
        with urllib.request.urlopen(req) as resp:
            assert resp.status == 200
            up_ord = json.loads(resp.read().decode('utf-8'))
            assert up_ord['status'] == st
            print(f'✓ Status transitioned to: {st}')

    # 6.2 Fulfill QC requirements for cards before COMPLETED transition
    for c in cards_list:
        patch_card = {'qc_nfc_tested': True, 'qc_qr_tested': True, 'qc_destination_verified': True}
        req_c = urllib.request.Request(f'{base_fe}/api/v1/cards/{c["id"]}', data=json.dumps(patch_card).encode('utf-8'), headers=headers, method='PATCH')
        with urllib.request.urlopen(req_c) as resp_c:
            assert resp_c.status == 200

    # 6.3 Transition to COMPLETED
    patch_payload = {'status': 'COMPLETED'}
    req = urllib.request.Request(f'{base_fe}/api/v1/orders/{bulk_order_id}', data=json.dumps(patch_payload).encode('utf-8'), headers=headers, method='PATCH')
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        up_ord = json.loads(resp.read().decode('utf-8'))
        assert up_ord['status'] == 'COMPLETED'
        print('✓ Status transitioned to: COMPLETED (Completion Gate Passed)')

    # Step 7: Test Negative Validation Cases
    print('\n[7] Testing Negative Validation Cases...')
    # Invalid quantity 0
    try:
        bad_qty = {'business_id': biz_id, 'destination_id': dest_id, 'product_type': 'NFC_QR', 'quantity': 0}
        req = urllib.request.Request(f'{base_fe}/api/v1/orders', data=json.dumps(bad_qty).encode('utf-8'), headers=headers, method='POST')
        urllib.request.urlopen(req)
        assert False, 'Should have failed'
    except urllib.error.HTTPError as e:
        assert e.code == 422
        print('✓ Negative Test Passed: quantity=0 rejected with HTTP 422')

    # Invalid product type
    try:
        bad_prod = {'business_id': biz_id, 'destination_id': dest_id, 'product_type': 'SUPER_CARD', 'quantity': 5}
        req = urllib.request.Request(f'{base_fe}/api/v1/orders', data=json.dumps(bad_prod).encode('utf-8'), headers=headers, method='POST')
        urllib.request.urlopen(req)
        assert False, 'Should have failed'
    except urllib.error.HTTPError as e:
        assert e.code == 422
        print('✓ Negative Test Passed: invalid product_type rejected with HTTP 422')

    # Destination not belonging to business
    try:
        # Create separate business
        req2 = urllib.request.Request(f'{base_fe}/api/v1/businesses', data=json.dumps({'name': 'کسب‌وکار دیگر'}).encode('utf-8'), headers=headers, method='POST')
        with urllib.request.urlopen(req2) as resp2:
            other_biz = json.loads(resp2.read().decode('utf-8'))
        bad_pairing = {'business_id': other_biz['id'], 'destination_id': dest_id, 'product_type': 'NFC_QR', 'quantity': 1}
        req3 = urllib.request.Request(f'{base_fe}/api/v1/orders', data=json.dumps(bad_pairing).encode('utf-8'), headers=headers, method='POST')
        urllib.request.urlopen(req3)
        assert False, 'Should have failed'
    except urllib.error.HTTPError as e:
        assert e.code == 422
        print('✓ Negative Test Passed: mismatched destination/business rejected with HTTP 422')

    # Step 8: Verify Cards API filtering by order_id
    print('\n[8] Testing Cards API filtering by order_id...')
    req = urllib.request.Request(f'{base_fe}/api/v1/cards?order_id={bulk_order_id}', headers=headers)
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        filtered_cards = json.loads(resp.read().decode('utf-8'))
        assert len(filtered_cards) == 10
        print(f'✓ GET /cards?order_id={{id}} verified: Returned {len(filtered_cards)} cards.')

    print('\n=============================================================')
    print('ALL PHASE 13.3 ORDER PROVISIONING TESTS PASSED (8/8)!')
    print('=============================================================')

if __name__ == '__main__':
    test_phase_13_3_suite()
