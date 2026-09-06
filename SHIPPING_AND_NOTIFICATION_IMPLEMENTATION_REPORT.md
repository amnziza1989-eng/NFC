# TapNow Smart Shipping & Customer Notification System — Implementation Report

**Status:** `COMPLETE & VERIFIED`  
**Date:** 2026-08-30  
**Repository:** `TapNow Smart NFC & QR Platform`  
**Author:** Antigravity AI Engineering Team  

---

## 1. Executive Summary

We have designed, implemented, and verified two interconnected production features for the TapNow platform:
1. **Smart Shipping Method Selection (Post vs Tehran Courier)**:
   - Customers can choose between **📦 Postal Shipping (پست پیشتاز)** across all Iranian provinces and **🛵 Tehran Courier (پیک فوری موتوری)** for same-day delivery.
   - **Courier availability is strictly restricted to eligible Tehran addresses** and enforced both in the **Frontend UI** and the **Backend Service Layer** (HTTP 422 rejection on ineligible requests).
2. **Automated Customer Shipping Notification System**:
   - Centralized, professional Persian SMS templates triggered automatically upon Admin order fulfillment.
   - Distinct message structures:
     - **Postal Orders**: Includes order number, customer name, date, postal tracking code, and a clickable tracking link configured via `POST_TRACKING_BASE_URL`.
     - **Courier Orders**: Clean dispatch notice without fake tracking numbers.
   - Built-in **Duplicate SMS Prevention** to protect against accidental double-clicks or updates to already fulfilled orders.
   - Flexible architecture with `MockSmsAdapter` for development and `ProductionSmsAdapter` for real SMS gateways.

All **92 automated backend tests** pass (100% success rate) and the frontend builds cleanly with zero TypeScript errors.

---

## 2. Architecture & Design Decisions

### 2.1 Shipping Method Selection & Eligibility Rules
- **Methods**:
  - `POST`: Nationwide coverage (سراسر کشور). Required for all non-Tehran destinations.
  - `COURIER`: Restricted to Tehran city (مناطق ۲۲ گانه شهر تهران).
- **Dual-Layer Validation**:
  - **Backend (`app/services/service.py:is_tehran_eligible`)**: Normalizes Persian characters (`ي` $\rightarrow$ `ی`, `ك` $\rightarrow$ `ک`), matches city/province against Tehran identifiers, and explicitly excludes satellite outer towns (e.g., Varamin, Shahriar, Damavand, Pardis, Eslamshahr, Robat Karim, Malard, Qods, Pakdasht, Andisheh, Boumehen).
  - **Frontend (`CheckoutView.tsx`)**: Re-evaluates destination city dynamically. Ineligible cities disable the Courier radio card, display a descriptive Persian warning badge, and automatically fallback the selection to Postal shipping.

### 2.2 Customer Notification System Architecture
- **Adapter Interface (`app/services/notifications.py`)**:
  - `SmsAdapter` Protocol: Defines standard `send_sms(recipient_phone, message, template_id)` contract.
  - `MockSmsAdapter`: Formats and safely logs the SMS payload to stdout, returning a deterministic provider reference (e.g. `MOCK_SMS_XXXXX`).
  - `ProductionSmsAdapter`: Clean integration with production SMS providers via environment variables (`SMS_PROVIDER`, `SMS_API_KEY`, `SMS_SENDER`, `SMS_TEMPLATE_ID`).
- **Persian SMS Templates**:
  - **Post Template**:
    ```text
    سلام {customer_name} عزیز! 🌸
    سفارش شما با شماره {order_number} در تاریخ {shipping_date} تحویل شرکت پست شد.
    📦 کد رهگیری پستی شما: {tracking_code}
    🔗 مشاهده وضعیت در سامانه پست: {tracking_url}
    با تشکر، تپ‌ناو
    ```
  - **Courier Template**:
    ```text
    سلام {customer_name} عزیز! 🌸
    سفارش شما با شماره {order_number} در تاریخ {shipping_date} تحویل پیک شد و در مسیر تحویل به شماست. 🛵
    با تشکر، تپ‌ناو
    ```
- **Duplicate SMS Protection**:
  - `NotificationService.notify_order_shipped` checks `order.shipping_notification_status`. If already `SENT` and `force_resend=False`, SMS dispatch is safely bypassed, returning the existing notification state without duplicate carrier charges.

---

## 3. Database Schema & Migration

### Migration: `006_add_shipping_and_notification_fields.py`
Reversible Alembic migration chained from `f84133d70bfb`.

**Added Columns to `shop_orders` table:**
| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `shipping_method` | `VARCHAR(20)` | No | `'POST'` | `POST` or `COURIER` |
| `shipping_province` | `VARCHAR(100)` | Yes | `None` | Province name |
| `shipping_notification_status` | `VARCHAR(20)` | No | `'NOT_SENT'` | `NOT_SENT`, `PENDING`, `SENT`, `FAILED` |
| `shipping_notification_sent_at` | `TIMESTAMP(timezone=True)` | Yes | `None` | Notification dispatch timestamp |
| `shipping_notification_error` | `TEXT` | Yes | `None` | Error details if SMS failed |
| `shipping_notification_provider_ref` | `VARCHAR(100)` | Yes | `None` | Gateway message ID / Ref ID |

---

## 4. Backend Configuration & API Endpoints

### 4.1 Settings (`app/config.py`, `.env`, `.env.example`)
```ini
POST_TRACKING_BASE_URL="https://tracking.post.ir/?traking_code="
SMS_PROVIDER="mock"
SMS_API_KEY="test_sms_key"
SMS_SENDER="3000xxxx"
SMS_TEMPLATE_ID="tapnow_shipped"
```

### 4.2 Endpoints Updated

#### `POST /api/v1/public/shop/checkout`
- Accepts `shipping.shipping_method` (`POST` or `COURIER`) and `shipping.province`.
- Validates Tehran eligibility for `COURIER`. Raises HTTP 422 if invalid.
- Persists shipping preferences and initializes `shipping_notification_status` as `NOT_SENT`.

#### `PATCH /api/v1/shop-orders/{shop_order_number}/ship`
- For `POST` orders: requires non-empty `tracking_code` (raises HTTP 422 if missing).
- For `COURIER` orders: does not require tracking code.
- Transitions order status to `SHIPPED`, sets `shipped_at = now()`.
- Dispatches automated SMS notification with duplicate prevention.
- Returns updated order response with all shipping and notification metadata.

#### `POST /api/v1/public/shop/orders/track`
- Returns masked customer details, `shipping_method`, `shipping_tracking_code`, and a dynamic timeline customized for Courier vs Post.

#### `GET /api/v1/public/shop/my-orders`
- Returns authenticated customer orders including shipping method and notification status.

---

## 5. Frontend UI & UX Enhancements

### 5.1 Customer Checkout (`frontend/src/features/shop/CheckoutView.tsx`)
- Added Section 3: **روش ارسال سفارش (Shipping Method)** with interactive radio cards:
  - 📦 **ارسال با پست پیشتاز**: Nationwide delivery with postal tracking.
  - 🛵 **ارسال با پیک (ویژه تهران)**: Fast delivery for Tehran addresses.
- Auto-validation against `isTehranAddress(shippingCity)`:
  - Ineligible cities disable Courier card, display warning banner, and fallback selection to `POST`.

### 5.2 Admin Orders Dashboard (`frontend/src/features/dashboard/AdminShopOrdersView.tsx`)
- **Orders List**:
  - Visual shipping method badges (`📦 پست پیشتاز` vs `🛵 پیک تهران`).
  - SMS notification status badges (`✓ پیامک ارسال شد`, `⚠️ خطای پیامک`).
- **Order Detail Drawer**:
  - Detailed shipping method and notification summary.
  - Context-aware fulfillment action:
    - Postal: Requires postal tracking code input; button: `ثبت کد رهگیری و ارسال پیامک`.
    - Courier: No postal code input required; button: `ثبت ارسال با پیک و ارسال پیامک`.
  - Shipped view with direct link to national postal tracking portal (`https://tracking.post.ir/`).
  - Manual resend SMS button for customer support handling.

### 5.3 Customer Orders & Receipt Views
- `OrderSuccessView.tsx`: Displays selected shipping method badge in receipt.
- `MyOrdersView.tsx`: Displays courier notice or postal tracking link depending on order method.

---

## 6. Automated Testing & Verification

### 6.1 Pytest Suite (`tests/test_shop_shipping.py`)
```bash
.\venv\Scripts\pytest
```
**Results:**
- `test_is_tehran_eligible`: Verified across Tehran variants, outer suburbs, and other provinces.
- `test_postal_shipping_sms_format`: Verified Persian SMS structure with tracking link.
- `test_courier_shipping_sms_format`: Verified courier dispatch SMS without fake tracking code.
- `test_postal_checkout_success`: Verified nationwide postal checkout.
- `test_tehran_courier_checkout_success`: Verified Tehran courier checkout.
- `test_courier_checkout_rejected_for_non_tehran`: Verified HTTP 422 on courier checkout outside Tehran.
- `test_admin_postal_shipment_workflow`: Verified postal tracking requirement and SMS dispatch.
- `test_admin_courier_dispatch_workflow`: Verified courier fulfillment without tracking code.
- `test_duplicate_sms_protection`: Verified duplicate prevention on repeated ship calls.
- `test_public_order_tracking_with_shipping_method`: Verified dynamic tracking responses.

**Full Test Suite Status:** `92 passed in 25.91s` (100% passing).

### 6.2 Frontend Production Build
```bash
npm run build
```
**Results:**
- TypeScript Typecheck (`tsc`): `0 errors`
- Vite production bundle: Built successfully in `10.67s` (`dist/assets/index-*.js`, `dist/assets/index-*.css`).

---

## 7. Modified & Created Files

```text
Backend:
├── .env.example
├── app/
│   ├── config.py
│   ├── models/
│   │   └── models.py
│   ├── schemas/
│   │   └── schemas.py
│   ├── services/
│   │   ├── notifications.py          [NEW]
│   │   └── service.py
│   └── api/
│       ├── internal/
│       │   └── routes.py
│       └── public/
│           └── shop.py
├── migrations/
│   └── versions/
│       └── 006_add_shipping_and_notification_fields.py [NEW]
└── tests/
    └── test_shop_shipping.py        [NEW]

Frontend:
├── src/
│   ├── types/
│   │   └── api.ts
│   ├── services/
│   │   └── apiClient.ts
│   └── features/
│       ├── shop/
│       │   ├── CheckoutView.tsx
│       │   ├── MyOrdersView.tsx
│       │   └── OrderSuccessView.tsx
│       └── dashboard/
│           └── AdminShopOrdersView.tsx
```

---

## 8. Summary & Conclusion

Both requested features—**Smart Shipping Method Selection** and **Automatic Customer Shipping Notification**—are fully implemented, robustly secured, tested against edge cases, and ready for production deployment.
