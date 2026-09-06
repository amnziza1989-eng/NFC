# PHASE 15 — MULTI-ITEM ONLINE SHOP & CUSTOMER CHECKOUT ARCHITECTURE

## 1. Executive Summary

This document specifies the technical architecture for the **Multi-Item Online Shop**, **Shopping Cart**, and **Customer Checkout Experience** for the TapNow / NFC Review Platform, operating in **Localhost Development & Testing Mode**.

The core objective is to deliver a complete, rich, Persian/English responsive storefront enabling customers to configure multiple physical NFC/QR products, manage a cart, enter shipping details, choose between immediate or deferred destination setup, and execute simulated checkout—**without breaking or mutating the verified physical card factory, provisioning engine, or QC completion gate**.

---

## 2. Baseline Architecture & Reconciliation

### 2.1 Verified Existing Baseline
* **Backend:** FastAPI (async SQLAlchemy 2.0 + PostgreSQL 16 + Redis 7 on Docker port `8300`).
* **Database Models:** `Business`, `Destination`, `Order`, `Card`, `Event`.
* **Fulfillment Pipeline:**
  $$\text{Order (Created)} \longrightarrow \text{Card Batch Generation} \longrightarrow \text{QC Testing (NFC + QR + Dest)} \longrightarrow \text{Completion Gate} \longrightarrow \text{CSV/QR Labels Export}$$
* **Current Test Baseline:** 62/62 Pytest, 13/13 E2E, 38/38 Dedicated/Live Integration Tests **PASSED**.

### 2.2 Parent/Child Domain Separation Strategy
To cleanly support multi-item shopping without destabilizing the factory `Order` lifecycle:
1. **`ShopOrder` (Customer E-Commerce Entity):** Captures customer identity, contact info, physical shipping address, notes, order total, and payment simulation state.
2. **`ShopOrderItem` (E-Commerce Line Item):** Captures product type, unit pricing, quantity, destination mode (Now vs. Later), and links directly to a downstream factory `Order`.
3. **`Order` (Factory Fulfillment Entity):** Continues to represent a single physical product run linked to a specific `Business` and `Destination`.

```
CUSTOMER SHOPPING DOMAIN                     FACTORY FULFILLMENT DOMAIN
┌─────────────────────────────────┐
│           ShopOrder             │
│  (Customer, Shipping, Payment)  │
└───────────────┬─────────────────┘
                │ 1:N
┌───────────────▼─────────────────┐         ┌─────────────────────────┐
│         ShopOrderItem           │────────►│          Order          │
│  (Product, Qty, Dest Config)    │ 1:1 ref │  (Factory Card Batch)   │
└─────────────────────────────────┘         └────────────┬────────────┘
                                                         │ 1:N
                                            ┌────────────▼────────────┐
                                            │          Card           │
                                            │ (NFC/QR Physical Codes) │
                                            └─────────────────────────┘
```

---

## 3. Destination Architecture: Now vs. Later

### 3.1 Stable Physical Card URL Architecture
Physical NFC and QR payloads **must never permanently hardcode a third-party URL (e.g. direct Google Maps)**. Physical cards are encoded with immutable TapNow redirection endpoints:
* **NFC Tap:** `https://tapnow.ir/n/{card_code}` (or `http://localhost:8300/n/{card_code}`)
* **QR Scan:** `https://tapnow.ir/q/{card_code}` (or `http://localhost:8300/q/{card_code}`)
* **QR Dynamic Image:** `https://tapnow.ir/q/{card_code}/qr.png`

### 3.2 Mode 1: Destination Configured Now
* Customer selects destination type (e.g. `GOOGLE_REVIEW`, `INSTAGRAM`, `WEBSITE`, `WHATSAPP`, `CUSTOM_URL`) and inputs the destination URL.
* URL is strictly validated (must be valid HTTP/HTTPS scheme, valid hostname, no JavaScript or local file schemes).
* A `Destination` record is provisioned and linked to the factory `Order` and its generated cards.
* Cards immediately redirect to the target URL upon scanning.

### 3.3 Mode 2: Destination Configured Later
* Customer purchases physical cards before having their Google Maps review link or final destination URL.
* A `Destination` record is created with:
  * `type = "PENDING_SETUP"`
  * `url = "https://tapnow.ir/setup"` (Placeholder setup portal)
  * `status = "ACTIVE"` (or `PENDING`)
* **Fulfillment & Safety Invariant:**
  * Cards are generated with unique codes and physical templates.
  * In the QC Reconciliation engine, `qc_destination_verified` remains `False` for pending destinations.
  * The factory **Completion Gate** naturally blocks marking the order `COMPLETED` until an operator or business sets and verifies the final destination URL.

---

## 4. Product Catalog & Pricing Model

For Localhost demonstration, the product catalog is structured with curated physical NFC templates:

| Product ID | Title (FA / EN) | Product Type | Physical Template | Unit Price (IRR / Toman) | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `card-nfc-qr` | کارت هوشمند نقد و بررسی (NFC + QR)<br>Smart Review Card (NFC + QR) | `NFC_QR` | `NFC_QR_TEMPLATE` | 290,000 تومان | کارت پی‌وی‌سی مات با چیپ NTAG213 و کد QR پویا اختصاصی |
| `card-nfc-only` | کارت هوشمند اختصاصی (فقط NFC)<br>Smart Touch Card (NFC Only) | `NFC_ONLY` | `NFC_ONLY_TEMPLATE` | 240,000 تومان | کارت هوشمند مینیمال بدون چاپ QR با قابلیت هدایت مستقیم |
| `stand-nfc-qr` | استند رومیزی هوشمند (NFC + QR)<br>Smart Desktop Stand (NFC + QR) | `NFC_QR` | `NFC_QR_TEMPLATE` | 450,000 تومان | استند اکریلیک رومیزی مناسب پیشخوان و میز کافه و رستوران |

---

## 5. Mock Payment Architecture

* **Localhost Simulation:** Payment is simulated safely on localhost without real banking credentials or external webhooks.
* **Idempotency Protection:** Checkout requests support an optional `idempotency_key` or client reference to prevent duplicate submissions.
* **Payment State:** `ShopOrder.payment_status` is marked `MOCK_PAID` with a generated simulation reference `MOCK-PAY-{TIMESTAMP}-{HASH}`.
* **Future Replacement:** Designed with a clean adapter interface so a real gateway (e.g. Zarinpal, Shaparak) can be plugged in by swapping the payment service implementation.

---

## 6. Database Schema & Migration Plan

### 6.1 New Tables

#### `shop_orders`
* `id`: UUID (Primary Key)
* `shop_order_number`: VARCHAR(32) (Unique, Index)
* `customer_name`: VARCHAR(255) (Not Null)
* `customer_email`: VARCHAR(255) (Not Null)
* `customer_phone`: VARCHAR(64) (Not Null)
* `company_name`: VARCHAR(255) (Nullable)
* `shipping_address`: TEXT (Not Null)
* `shipping_city`: VARCHAR(100) (Not Null)
* `shipping_postal_code`: VARCHAR(32) (Not Null)
* `shipping_notes`: TEXT (Nullable)
* `total_amount`: BIGINT (Not Null, Default 0)
* `payment_status`: VARCHAR(30) (Not Null, Default 'MOCK_PAID')
* `payment_reference`: VARCHAR(128) (Nullable)
* `status`: VARCHAR(30) (Not Null, Default 'PLACED')
* `created_at`: TIMESTAMPTZ (Not Null, Default UTC NOW)
* `updated_at`: TIMESTAMPTZ (Not Null, Default UTC NOW)

#### `shop_order_items`
* `id`: UUID (Primary Key)
* `shop_order_id`: UUID (Foreign Key `shop_orders.id`, Index, On Delete Cascade)
* `product_type`: VARCHAR(20) (Not Null)
* `product_title`: VARCHAR(255) (Not Null)
* `unit_price`: BIGINT (Not Null)
* `quantity`: INTEGER (Not Null, Check `quantity > 0`)
* `destination_type`: VARCHAR(50) (Not Null)
* `destination_url`: VARCHAR(2048) (Nullable)
* `destination_configured`: BOOLEAN (Not Null, Default True)
* `fulfillment_order_id`: UUID (Foreign Key `orders.id`, Nullable, Index, On Delete Set Null)
* `created_at`: TIMESTAMPTZ (Not Null, Default UTC NOW)

### 6.2 Migration: `004_add_shop_orders.py`
Alembic migration creating `shop_orders` and `shop_order_items` with appropriate foreign keys and indexes.

---

## 7. Public API Architecture

### 7.1 Public Shop Router: `/api/v1/public/shop`

1. **`GET /api/v1/public/shop/products`**
   * Returns list of available products, pricing, features, and supported destination types.
2. **`POST /api/v1/public/shop/checkout`**
   * Accepts multi-item cart payload, customer info, shipping info, and destination configurations.
   * Atomically creates `ShopOrder`, `ShopOrderItem`s, `Business`, `Destination`s, and factory `Order`s.
   * Returns public sanitized order confirmation (no internal secrets or sensitive admin IDs).
3. **`GET /api/v1/public/shop/orders/{shop_order_number}`**
   * Public tracking endpoint for customer order status and item summary.

---

## 8. Frontend Storefront Architecture

### 8.1 Route Hierarchy
* **`/shop`**: Public Storefront Catalog & Hero Showcase.
* **`/shop/cart`**: Shopping Cart (Item inspection, quantity controls, destination configuration modal, item removal).
* **`/shop/checkout`**: Multi-step checkout (Customer contact, Shipping details, Destination review, Mock payment).
* **`/shop/success`**: Order Confirmation with printable receipt and factory tracking ID.
* **`/dashboard`, `/businesses`, `/orders`, `/cards`, `/qc`**: Internal Admin Portal (Preserved with header navigation toggle).

### 8.2 Design & UX Standards
* Modern dark/light glassmorphic UI matching TapNow design language.
* Full bidirectional i18n (Persian RTL primary with Vazirmatn font, English LTR secondary).
* Micro-animations, responsive layout across mobile and desktop.
* "Configure Now vs. Configure Later" interactive switcher with instant URL validation.

---

## 9. Risk Analysis & Safeguards

| Risk | Level | Safeguard |
| :--- | :--- | :--- |
| Destabilizing Factory Orders | HIGH | Strict separation of `ShopOrder` from `Order`; factory orders created via standard service functions. |
| Malicious / Open Redirect URLs | HIGH | Strict scheme validation (HTTP/HTTPS only, blocked JavaScript/data/ftp schemes). |
| Rate Limiting & Bot Spam | MEDIUM | Public checkout endpoint protected with Redis-backed rate limiting. |
| Production Leakage | HIGH | Localhost-only configuration; no public DNS or TLS touched. |

---

## 10. Conclusion & Authorization
This architecture completely satisfies Human Approved Decisions 1–4 while preserving 100% of the working factory provisioning engine and test suite.
