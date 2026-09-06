# PHASE 15 — LOCALHOST MULTI-ITEM SHOP UAT & VERIFICATION REPORT

## 1. Overview & Execution Scope

This report documents the User Acceptance Testing (UAT) and end-to-end verification of the **Multi-Item Online Shop & Shopping Cart** implementation for the **TapNow / NFC Review Platform** in **Localhost Development Mode**.

* **Target URL:** `http://localhost:8300` (and `http://localhost:5173`)
* **Database Revision:** `004_add_shop_orders (head)`
* **Test Date:** 2026-08-28

---

## 2. Verified Customer User Journey (UAT Walkthrough)

```
PUBLIC STOREFRONT (/shop)
      │  Select Product A (NFC + QR Review Card)
      │  Configure Destination Now: Google Review URL (https://g.page/r/mehr-clinic/review)
      │  Quantity: 2 → Add to Cart
      │
      ▼
SELECT PRODUCT B (Smart Touch Card NFC Only)
      │  Configure Destination Later (Receive raw card with stable redirect)
      │  Quantity: 3 → Add to Cart
      │
      ▼
SHOPPING CART (/shop/cart)
      │  Review 2 line items (Total items: 5)
      │  Subtotal: 1,300,000 Toman (580,000 + 720,000)
      │  Shipping: Free (Localhost Test)
      │  Click "Proceed to Checkout"
      │
      ▼
CHECKOUT & MOCK PAYMENT (/shop/checkout)
      │  Customer Info: مریم احمدی (maryam@example.com, 09129876543, کلینیک دندانپزشکی مهر)
      │  Shipping Address: تهران، خیابان پاسداران، بوستان دوم، پلاک ۴۰ (1665412345)
      │  Simulate Mock Payment Adapter → Success
      │
      ▼
ORDER CONFIRMATION (/shop/success)
      │  Shop Order Number: SHOP-YYYYMMDD-XXXX
      │  Payment Reference: MOCK-PAY-YYYYMMDDHHMMSS-XXXXXX (MOCK_PAID)
      │  Downstream Factory Orders: [ORD-YYYYMMDD-XXXX, ORD-YYYYMMDD-YYYY]
      │
      ▼
FACTORY OPERATOR PIPELINE (/orders)
      │  Factory Order 1 (NFC_QR, qty=2): Batch generates 2 cards → Redirects to Google Review
      │  Factory Order 2 (NFC_ONLY, qty=3): Batch generates 3 cards → Redirects to https://tapnow.ir/setup
      │  QC Reconciliation: Destination verified for Order 1, marked COMPLETED via Completion Gate
```

---

## 3. Verification Test Results Matrix

| Test Suite | Executed Scope | Result | Status |
| :--- | :--- | :--- | :--- |
| **Pytest Unit Suite** | Full backend models, auth, internal APIs, public redirects, rate limiting, shop catalog, checkout | 67 / 67 PASSED | ✅ PASS |
| **E2E Core Suite** | 13 core steps (Health, Business, Destination, Card, Provisioning, NFC/QR redirect, QC, Re-enable) | 13 / 13 PASSED | ✅ PASS |
| **Live Frontend Proxy Suite** | Frontend Vite Proxy to backend API integration | 10 / 10 PASSED | ✅ PASS |
| **Phase 13.2.2 Suite** | Interactive analytics, range filtering, business/destination mutations | 10 / 10 PASSED | ✅ PASS |
| **Phase 13.3 Suite** | Order-based batch card generation, physical templates, status state machine | 8 / 8 PASSED | ✅ PASS |
| **Phase 13.4 Suite** | Batch CSV exports, QR label generation, packaging reconciliation, completion gate | 10 / 10 PASSED | ✅ PASS |
| **Phase 15 Shop Suite** | Multi-item catalog, checkout, destination now vs later, factory linkage, QC | 10 / 10 PASSED | ✅ PASS |
| **Frontend Production Build** | TypeScript strict compilation (`tsc`) and Vite production bundle generation | Built in 7.40s | ✅ PASS |
| **Alembic Migration** | `004_add_shop_orders` upgrade and head consistency | Head verified | ✅ PASS |

---

## 4. Key Architectural Safeguards Verified

1. **Zero Factory Order Breakage:** Existing `Order`, `Card`, and `Event` tables and fulfillment logic were not modified destructively. Shop orders cleanly spawn standard fulfillment orders.
2. **Destination-Later Redirection Stability:** Cards purchased without an initial destination are programmed with `https://tapnow.ir/setup`. Their physical QR/NFC URLs (`/n/{code}`, `/q/{code}`) never need reprinting when the destination URL is updated.
3. **Completion Gate Integrity:** Unconfigured destination cards correctly hold `qc_destination_verified=False`, preventing orders from accidentally leaving the factory before final setup.
4. **Isolated Infrastructure:** Port 8300 remains the exclusive endpoint. Ports 8000, 8001, and 8202 remained completely isolated and untouched.
