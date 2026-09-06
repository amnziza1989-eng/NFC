import urllib.request
import urllib.error
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

base_fe = 'http://127.0.0.1:5173'
base_be = 'http://127.0.0.1:8300'
headers = {'X-API-Key': 'your-secure-api-key-here', 'Content-Type': 'application/json'}

def test_phase_13_4_suite():
    print('=== PHASE 13.4 BATCH EXPORTS, QR LABELS & RECONCILIATION SUITE ===')

    # Step 1: Create Test Business and Destination
    print('\n[1] Creating Business and Destination...')
    biz_payload = {'name': 'هلدینگ صادرات فاز ۱۳.۴', 'logo_url': 'https://example.com/export-logo.png'}
    req = urllib.request.Request(f'{base_fe}/api/v1/businesses', data=json.dumps(biz_payload).encode('utf-8'), headers=headers, method='POST')
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 201
        biz = json.loads(resp.read().decode('utf-8'))
        biz_id = biz['id']
        print(f'✓ Business Created: {biz["name"]} ({biz_id})')

    dest_payload = {'business_id': biz_id, 'type': 'GOOGLE_REVIEW', 'url': 'https://g.page/r/phase13-4-test/review'}
    req = urllib.request.Request(f'{base_fe}/api/v1/destinations', data=json.dumps(dest_payload).encode('utf-8'), headers=headers, method='POST')
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 201
        dest = json.loads(resp.read().decode('utf-8'))
        dest_id = dest['id']
        print(f'✓ Destination Created: {dest["url"]} ({dest_id})')

    # TEST 1 & 6: NFC_ONLY Export Workflow & QR Exclusion
    print('\n[TEST 1 & 6] Testing NFC_ONLY Export Workflow & QR Exclusion...')
    order_nfc_payload = {
        'business_id': biz_id,
        'destination_id': dest_id,
        'product_type': 'NFC_ONLY',
        'quantity': 3,
    }
    req = urllib.request.Request(f'{base_fe}/api/v1/orders', data=json.dumps(order_nfc_payload).encode('utf-8'), headers=headers, method='POST')
    with urllib.request.urlopen(req) as resp:
        order_nfc = json.loads(resp.read().decode('utf-8'))
        order_nfc_id = order_nfc['id']

    # Generate 3 cards for NFC_ONLY
    req = urllib.request.Request(f'{base_fe}/api/v1/orders/{order_nfc_id}/generate-cards', headers=headers, method='POST')
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200

    # 1. Full CSV Export for NFC_ONLY
    req = urllib.request.Request(f'{base_fe}/api/v1/orders/{order_nfc_id}/export/cards.csv', headers=headers)
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        csv_content = resp.read().decode('utf-8')
        assert csv_content.startswith('\ufeff')  # UTF-8 BOM
        lines = csv_content.strip().split('\r\n')
        if len(lines) == 1:
            lines = csv_content.strip().split('\n')
        assert len(lines) == 4  # Header + 3 cards
        assert 'NOT_APPLICABLE' in csv_content
        print(f'✓ Full Cards CSV Export verified for NFC_ONLY: {len(lines)-1} rows with UTF-8 BOM')

    # 2. NFC CSV Export
    req = urllib.request.Request(f'{base_fe}/api/v1/orders/{order_nfc_id}/export/nfc.csv', headers=headers)
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        nfc_csv = resp.read().decode('utf-8')
        assert 'NFC Write URL' in nfc_csv
        print('✓ Dedicated NFC CSV Export verified for NFC_ONLY')

    # 3. QR CSV Export should be REJECTED (HTTP 422) for NFC_ONLY
    try:
        req = urllib.request.Request(f'{base_fe}/api/v1/orders/{order_nfc_id}/export/qr.csv', headers=headers)
        urllib.request.urlopen(req)
        assert False, 'Should have failed with 422'
    except urllib.error.HTTPError as e:
        assert e.code == 422
        print('✓ QR CSV Export correctly rejected with HTTP 422 for NFC_ONLY order')

    # 4. QR Labels sheet endpoint returns 0 labels for NFC_ONLY
    req = urllib.request.Request(f'{base_fe}/api/v1/orders/{order_nfc_id}/qr-labels', headers=headers)
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        labels_resp = json.loads(resp.read().decode('utf-8'))
        assert labels_resp['total_labels'] == 0
        assert len(labels_resp['labels']) == 0
        print('✓ QR Labels sheet returns 0 labels for NFC_ONLY (Correctly excluded)')

    # TEST 2 & 5: NFC_QR Export Workflow & QR Label Preparation
    print('\n[TEST 2 & 5] Testing NFC_QR Export Workflow & QR Label Preparation...')
    order_qr_payload = {
        'business_id': biz_id,
        'destination_id': dest_id,
        'product_type': 'NFC_QR',
        'quantity': 4,
    }
    req = urllib.request.Request(f'{base_fe}/api/v1/orders', data=json.dumps(order_qr_payload).encode('utf-8'), headers=headers, method='POST')
    with urllib.request.urlopen(req) as resp:
        order_qr = json.loads(resp.read().decode('utf-8'))
        order_qr_id = order_qr['id']

    # Generate 4 cards for NFC_QR
    req = urllib.request.Request(f'{base_fe}/api/v1/orders/{order_qr_id}/generate-cards', headers=headers, method='POST')
    with urllib.request.urlopen(req) as resp:
        gen_res = json.loads(resp.read().decode('utf-8'))
        assert gen_res['generated_count'] == 4
        qr_card_codes = [c['code'] for c in gen_res['cards']]

    # 1. QR CSV Export should SUCCEED for NFC_QR
    req = urllib.request.Request(f'{base_fe}/api/v1/orders/{order_qr_id}/export/qr.csv', headers=headers)
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        qr_csv = resp.read().decode('utf-8')
        assert 'QR PNG Image URL' in qr_csv
        for ccode in qr_card_codes:
            assert ccode in qr_csv
        print(f'✓ Dedicated QR CSV Export verified for NFC_QR: All 4 codes mapped accurately')

    # 2. QR Labels endpoint returns exactly 4 labels with deterministic sequence
    req = urllib.request.Request(f'{base_fe}/api/v1/orders/{order_qr_id}/qr-labels', headers=headers)
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        qr_sheet = json.loads(resp.read().decode('utf-8'))
        assert qr_sheet['total_labels'] == 4
        assert len(qr_sheet['labels']) == 4
        assert [l['sequence_number'] for l in qr_sheet['labels']] == [1, 2, 3, 4]
        assert [l['card_code'] for l in qr_sheet['labels']] == qr_card_codes
        print('✓ QR Label Sheet endpoint returned exactly 4 labels with deterministic 1:1 mapping')

    # TEST 3: Order Scoping & Export Isolation
    print('\n[TEST 3] Testing Export Isolation between Orders...')
    req_a = urllib.request.Request(f'{base_fe}/api/v1/orders/{order_nfc_id}/export/cards.csv', headers=headers)
    with urllib.request.urlopen(req_a) as resp_a:
        csv_a = resp_a.read().decode('utf-8')
    for ccode in qr_card_codes:
        assert ccode not in csv_a, f'Cross-order contamination: Card {ccode} found in Order A export'
    print('✓ Export Isolation verified: Zero cross-order contamination between Order A and Order B')

    # TEST 4: CSV Format & Integrity
    print('\n[TEST 4] Testing CSV Format & UTF-8 BOM Integrity...')
    req = urllib.request.Request(f'{base_fe}/api/v1/orders/{order_qr_id}/export/cards.csv', headers=headers)
    with urllib.request.urlopen(req) as resp:
        csv_text = resp.read().decode('utf-8')
        assert csv_text.startswith('\ufeff')
        assert 'هلدینگ صادرات فاز ۱۳.۴' in csv_text  # Persian text intact
        print('✓ CSV Integrity verified: UTF-8 BOM present and Persian strings preserved')

    # TEST 7 & 10: Reconciliation Accuracy & Incomplete Rejection
    print('\n[TEST 7 & 10] Testing Packaging Reconciliation Accuracy & Blocker Calculation...')
    req = urllib.request.Request(f'{base_fe}/api/v1/orders/{order_qr_id}/reconciliation', headers=headers)
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        recon = json.loads(resp.read().decode('utf-8'))
        assert recon['ordered_quantity'] == 4
        assert recon['cards_generated_count'] == 4
        assert recon['is_ready_for_delivery'] is False
        assert len(recon['blocking_reasons']) > 0
        print(f'✓ Reconciliation accurate: is_ready_for_delivery=False with {len(recon["blocking_reasons"])} blocking reasons:')
        for r in recon['blocking_reasons']:
            print(f'   - {r}')

    # TEST 9: Completion Gate Enforcement on Incomplete Order
    print('\n[TEST 9] Testing Completion Gate on Incomplete Order...')
    try:
        patch_payload = {'status': 'COMPLETED'}
        req = urllib.request.Request(f'{base_fe}/api/v1/orders/{order_qr_id}', data=json.dumps(patch_payload).encode('utf-8'), headers=headers, method='PATCH')
        urllib.request.urlopen(req)
        assert False, 'Completion should have been blocked'
    except urllib.error.HTTPError as e:
        assert e.code == 422
        err_msg = e.read().decode('utf-8')
        assert 'Order cannot be marked COMPLETED' in err_msg
        print(f'✓ Completion Gate verified: Incomplete order rejected with HTTP 422 ({err_msg})')

    # TEST 8: Full QC Fulfillment & Successful Completion Gate
    print('\n[TEST 8] Fulfilling all QC requirements for Order...')
    # Fetch cards of order_qr
    req = urllib.request.Request(f'{base_fe}/api/v1/orders/{order_qr_id}/cards', headers=headers)
    with urllib.request.urlopen(req) as resp:
        order_cards = json.loads(resp.read().decode('utf-8'))

    # Mark all 4 cards QC tested
    for c in order_cards:
        patch_card = {
            'qc_nfc_tested': True,
            'qc_qr_tested': True,
            'qc_destination_verified': True,
        }
        req_c = urllib.request.Request(f'{base_fe}/api/v1/cards/{c["id"]}', data=json.dumps(patch_card).encode('utf-8'), headers=headers, method='PATCH')
        with urllib.request.urlopen(req_c) as resp_c:
            assert resp_c.status == 200

    # Re-check reconciliation
    req = urllib.request.Request(f'{base_fe}/api/v1/orders/{order_qr_id}/reconciliation', headers=headers)
    with urllib.request.urlopen(req) as resp:
        recon_after = json.loads(resp.read().decode('utf-8'))
        assert recon_after['is_ready_for_delivery'] is True
        assert len(recon_after['blocking_reasons']) == 0
        print('✓ Reconciliation updated: is_ready_for_delivery=True (All QC passed)')

    # Now transition to COMPLETED should succeed
    patch_payload = {'status': 'COMPLETED'}
    req = urllib.request.Request(f'{base_fe}/api/v1/orders/{order_qr_id}', data=json.dumps(patch_payload).encode('utf-8'), headers=headers, method='PATCH')
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        completed_order = json.loads(resp.read().decode('utf-8'))
        assert completed_order['status'] == 'COMPLETED'
        print(f'✓ Completion Gate verified: Fully reconciled order successfully marked COMPLETED')

    print('\n=============================================================')
    print('ALL PHASE 13.4 BATCH EXPORTS & RECONCILIATION TESTS PASSED (10/10)!')
    print('=============================================================')

if __name__ == '__main__':
    test_phase_13_4_suite()
