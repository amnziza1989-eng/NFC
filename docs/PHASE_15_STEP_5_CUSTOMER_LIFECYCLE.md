# PHASE 15 — STEP 5: CUSTOMER LIFECYCLE COMPLETION
## Secure Public Order Tracking + Secure Self-Service Card Activation + Limited Customization MVP

---

## 1. Executive Summary

This specification establishes the complete, secure customer lifecycle architecture for the **TapNow / NFC Review Platform** operating in **Localhost Development & Verification Mode**.

The architecture completes three primary objectives approved by the Human Authority:
1. **Secure Public Order Tracking (`/shop/track`):** Allows customers to track their purchase status, fulfillment progress, and shipping updates safely without exposing internal database UUIDs or allowing unauthenticated order enumeration.
2. **Secure Self-Service Card Activation (`/activate` & `/activate/{code}`):** Enables customers who purchased cards with "Configure Later" to securely connect their destination (Google Maps, Instagram, WhatsApp, Website, Custom URL) after receiving physical hardware, while preserving 100% immutable physical NFC/QR redirection codes (`/n/{code}`, `/q/{code}`).
3. **Limited Card Customization MVP:** Integrates a secure logo upload pipeline (PNG/JPG validation, 2MB size limit), HEX color picker, and predefined template selection (`classic`, `modern`, `minimal`) with instant live card preview on the storefront.

---

## 2. Secure Public Order Tracking Architecture

### 2.1 Threat Model & Enumeration Protection
* **Vulnerability Avoided:** Traditional unauthenticated `GET /orders/{order_number}` endpoints allow attackers to guess or iterate sequential/random order numbers and harvest private customer addresses and purchase history.
* **Two-Factor Contact Verification:** Order tracking requires both:
  1. `order_number`: Public formatted order number (e.g. `SHOP-20260828-ASZ8`)
  2. `verification_contact`: Customer's normalized mobile phone or email used during checkout.
* **Uniform Error Handling:** If the order number does not exist OR the contact does not match, the backend returns an identical generic error:
  $$\text{Response (404/422): } \text{"اطلاعات وارد شده با مشخصات سفارش مطابقت ندارد / Order verification failed"}$$
* **Rate Limiting:** Protected with Redis-backed rate limiting to eliminate brute-force attempts.

### 2.2 Public Data Masking
The response exposes only safe public tracking data:
* Masked shipping address: e.g. `تهران، خیابان ولیعصر، پلاک ***`
* High-level fulfillment progress timeline:
  1. `سفارش ثبت و پرداخت شد (Order Placed & Paid)`
  2. `در صف تولید کارخانه (Factory Queue)`
  3. `کنترل کیفیت سخت‌افزاری (Hardware QC Tested)`
  4. `بسته‌بندی و ارسال (Packaged & Dispatched)`
* Zero internal PostgreSQL UUIDs or operator API keys are ever leaked.

---

## 3. Secure Self-Service Card Activation Architecture

### 3.1 Immutable Physical Payload Architecture
Physical cards are manufactured with immutable TapNow endpoints:
* **NFC Tap:** `http://localhost:8300/n/{card_code}` (or `https://tapnow.ir/n/{card_code}`)
* **QR Code:** `http://localhost:8300/q/{card_code}` (or `https://tapnow.ir/q/{card_code}`)

When a card is ordered with **"Destination Later"**:
* `Destination.type` is set to `PENDING_SETUP`.
* `Destination.url` points to `https://tapnow.ir/setup`.
* When tapped, the card takes the user to the TapNow activation landing page.

### 3.2 Authorization & Token Model
To prevent unauthorized parties who observe a physical card code from hijacking its destination:
1. **Verification Phase (`POST /api/v1/public/activation/verify`):**
   * Customer submits: `card_code` + `order_number` + `verification_contact` (Phone/Email).
   * Backend verifies that the card belongs to the specified order and that contact matches customer records.
   * Backend generates a cryptographically secure, 15-minute single-use token:
     $$\text{activation\_token} = \text{act\_tok\_} + \text{secrets.token\_urlsafe(32)}$$
2. **Configuration Phase (`POST /api/v1/public/activation/configure`):**
   * Customer submits: `activation_token` + `destination_type` + `destination_url`.
   * Backend strictly validates destination URL scheme (`http` / `https`, valid hostname, no JavaScript or script injection).
   * Backend updates the card's `Destination` record and marks the token `used = True`.
   * The existing physical NFC tag and QR code immediately begin redirecting to the customer's Google Review link!

---

## 4. Limited Card Customization MVP

### 4.1 Secure Logo Upload Pipeline
* **Endpoint:** `POST /api/v1/public/shop/upload-logo`
* **File Validation:**
  * Supported Formats: `image/png`, `image/jpeg`, `image/jpg` (SVGs rejected in MVP to prevent stored XSS attacks).
  * Max File Size: 2 Megabytes (2,097,152 bytes).
  * Binary Header Inspection: Validated using Python Imaging Library (Pillow).
  * Storage: Stored under `uploads/logos/{uuid}_{safe_filename}` with randomized cryptographic filenames.
* **Serving:** Served statically under `/uploads/logos/{filename}` with safe content-type headers.

### 4.2 Brand Color & Template Customization
* **Primary Color:** Validated 6-character HEX code (`^#([A-Fa-f0-9]{6})$`).
* **Predefined Templates:**
  * `classic`: Sleek dark slate surface with glowing brand accents.
  * `modern`: Dynamic diagonal gradient with high-visibility QR bounding box.
  * `minimal`: Pure matte monochrome with centered brand icon and NFC touch pill.
* **Live Storefront Preview:** Interactive visual feedback in the product configuration modal.

---

## 5. Summary of API Boundaries

| Endpoint | Method | Security / Auth | Purpose |
| :--- | :---: | :---: | :--- |
| `/api/v1/public/shop/orders/track` | `POST` | Phone/Email verification + Rate Limit | Secure order tracking lookup |
| `/api/v1/public/shop/upload-logo` | `POST` | File inspection + Rate Limit | Secure business logo upload |
| `/api/v1/public/activation/verify` | `POST` | Order & Contact proof + Rate Limit | Issues short-lived activation token |
| `/api/v1/public/activation/configure` | `POST` | Activation Token + URL validation | Updates destination and activates card |
