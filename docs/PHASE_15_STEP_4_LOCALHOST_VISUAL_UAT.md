# PHASE 15 — STEP 4: LOCALHOST VISUAL REVIEW & HUMAN UAT CHECKLIST

This checklist is designed for human product reviewers, QA engineers, and stakeholders to systematically inspect and test the **TapNow Multi-Item Online Shop** and its integration with the **Factory Fulfillment Portal** on Localhost.

* **Base URL:** `http://localhost:5173` (or `http://localhost:8300`)
* **Admin API Key:** `your-secure-api-key-here`
* **Test Environment:** Localhost Only (Isolated Docker)

---

## PART 1: PUBLIC STOREFRONT & CATALOG (`/shop`)

| # | Action / Step | Expected Result | Pass / Fail | Notes |
| :- | :--- | :--- | :-: | :--- |
| **1.1** | Open `http://localhost:5173/shop` in browser | Page loads with glassmorphic dark theme, Persian RTL layout, and Vazirmatn font. Header displays brand logo, "تپ‌ناو استور", Cart button with 0 items, language toggle, and "ورود به پنل کارخانه". | [ ] | |
| **1.2** | Inspect Hero Banner | Displays headline: "با یک تماس گوشی، نظرات ۵ ستاره گوگل و مشتریان وفادار جذب کنید" with animated gradient accents and trust badges. | [ ] | |
| **1.3** | Review Products Grid | Exactly 3 products are rendered: 1) کارت هوشمند نقد و بررسی (NFC + QR) - ۲۹۰,۰۰۰ تومان, 2) کارت هوشمند اختصاصی (فقط NFC) - ۲۴۰,۰۰۰ تومان, 3) استند رومیزی هوشمند (NFC + QR) - ۴۵۰,۰۰۰ تومان. | [ ] | |
| **1.4** | Click "سفارش و تنظیم" on Product 1 (NFC + QR) | Configuration modal opens with product title, Destination Mode toggle (Now vs. Later), Destination Type buttons, URL input, quantity stepper, and subtotal. | [ ] | |
| **1.5** | Toggle Destination Mode to "تنظیم بعداً (کارت خام/آماده)" | URL input hides, and an amber reassurance badge appears: "کارت فیزیکی شما با آدرس پایدار تپ‌ناو تولید می‌شود...". | [ ] | |
| **1.6** | Toggle back to "تنظیم همین حالا (پیشنهادی)" and enter invalid URL (`javascript:alert(1)`) | Click "افزودن به سبد خرید" -> Red validation error: "پروتکل باید http یا https باشد". | [ ] | |
| **1.7** | Enter valid Google Review URL (`https://g.page/r/my-business/review`), set Qty = 2 | Click "افزودن به سبد خرید" -> Button shows "به سبد افزوده شد!" with green checkmark, modal closes, and header cart badge updates to `2`. | [ ] | |

---

## PART 2: MULTI-ITEM SHOPPING CART (`/shop/cart`)

| # | Action / Step | Expected Result | Pass / Fail | Notes |
| :- | :--- | :--- | :-: | :--- |
| **2.1** | Click on Product 2 (NFC Only) -> Choose "تنظیم بعداً" -> Qty = 3 -> Add to Cart | Modal closes; header cart badge updates to `5` (2 + 3). | [ ] | |
| **2.2** | Click on Header Cart button | Navigates to `/shop/cart`. Shows 2 distinct items: Item 1 (NFC + QR, Qty 2, Google Review URL), Item 2 (NFC Only, Qty 3, تنظیم بعداً). | [ ] | |
| **2.3** | Verify Price Calculation | Item 1 subtotal = 580,000 (2 × 290,000). Item 2 subtotal = 720,000 (3 × 240,000). Order summary subtotal = 1,300,000 Toman. Shipping = Free (رایگان). Total payable = 1,300,000 Toman. | [ ] | |
| **2.4** | Test Quantity Controls on Item 1 | Click `+` button -> Qty becomes 3, subtotal updates instantly to 870,000, total payable updates to 1,590,000. Click `-` button -> Qty returns to 2. | [ ] | |
| **2.5** | Test Browser Refresh (Persistence) | Press `F5` / Refresh browser -> Cart items and quantities remain intact from `localStorage`. | [ ] | |
| **2.6** | Click "ادامه فرآیند ثبت و پرداخت" | Navigates smoothly to `/shop/checkout`. | [ ] | |

---

## PART 3: CHECKOUT & MOCK PAYMENT SIMULATOR (`/shop/checkout`)

| # | Action / Step | Expected Result | Pass / Fail | Notes |
| :- | :--- | :--- | :-: | :--- |
| **3.1** | Inspect Customer & Shipping Form | Displays 2 form sections: 1) مشخصات خریدار (نام، کسب‌وکار، موبایل، ایمیل), 2) آدرس پستی (شهر، کد پستی، آدرس دقیق، توضیحات). | [ ] | |
| **3.2** | Inspect Order Items Sidebar | Shows breakdown of all cart items, total payable (1,300,000 Toman), and the "درگاه پرداخت شبیه‌سازی تستی" badge. | [ ] | |
| **3.3** | Test Missing Required Fields Validation | Clear the name or address field -> Click submit -> Validation error prompt appears and submission is blocked. | [ ] | |
| **3.4** | Fill in Valid Data & Click "پرداخت شبیه‌سازی و ثبت نهایی" | Button shows loading spinner ("در حال پردازش و ثبت سفارش..."), API submits atomically, cart is cleared, and user is redirected to `/shop/success`. | [ ] | |

---

## PART 4: ORDER CONFIRMATION & RECEIPT (`/shop/success`)

| # | Action / Step | Expected Result | Pass / Fail | Notes |
| :- | :--- | :--- | :-: | :--- |
| **4.1** | Inspect Success Banner | Green celebration icon with headline: "سفارش شما با موفقیت ثبت و پرداخت شد!". | [ ] | |
| **4.2** | Inspect Tracking Numbers | Displays Shop Order Number (e.g. `SHOP-20260828-XXXX`) and payment status `✓ MOCK_PAID`. | [ ] | |
| **4.3** | Inspect Factory Order Links | Item list displays corresponding factory fulfillment order numbers (e.g. `ORD-20260828-XXXX`). | [ ] | |
| **4.4** | Click "چاپ فاکتور" (Print Receipt) | Opens browser print dialog with styled printable layout. | [ ] | |
| **4.5** | Click "مشاهده سفارش در پنل مدیریت کارخانه" | Navigates directly to the Admin Orders Portal (`/orders`). | [ ] | |

---

## PART 5: FACTORY ADMIN FULFILLMENT PIPELINE (`/orders` & `/qc`)

| # | Action / Step | Expected Result | Pass / Fail | Notes |
| :- | :--- | :--- | :-: | :--- |
| **5.1** | Open `/orders` in Admin Portal | Both generated factory orders appear in the list with status `CREATED`, correct business name, product type, and quantity. | [ ] | |
| **5.2** | Click on Order 1 (NFC_QR, qty=2) -> Generate Cards | Exactly 2 digital cards are generated with unique 8-character codes. Status transitions to `CARDS_GENERATED`. | [ ] | |
| **5.3** | Test Physical Tap Redirect for Order 1 Card | Open `http://localhost:8300/n/{card_code}` -> Browser performs HTTP 302 redirect directly to configured Google Review URL (`https://g.page/r/...`). | [ ] | |
| **5.4** | Click on Order 2 (NFC_ONLY, qty=3) -> Generate Cards | Exactly 3 digital cards are generated. Status transitions to `CARDS_GENERATED`. | [ ] | |
| **5.5** | Test Physical Tap Redirect for Order 2 Card (Destination Later) | Open `http://localhost:8300/n/{later_code}` -> Browser redirects to setup placeholder (`https://tapnow.ir/setup`). | [ ] | |
| **5.6** | Open `/qc` QC Fulfillment Workbench | Order 1 displays packaging reconciliation: `is_ready_for_delivery=False` due to pending NFC, QR, and Destination QC flags. | [ ] | |
| **5.7** | Perform QC Checklist on Order 1 Cards | Mark all 3 QC flags for both cards -> Order reconciliation updates to `is_ready_for_delivery=True`. | [ ] | |
| **5.8** | Attempt to mark Order 2 COMPLETED before QC | Completion gate blocks status change with HTTP 422 error detailing missing QC flags. | [ ] | |
| **5.9** | Test Export Features | CSV Cards export, NFC export, and QR label sheet generate correctly with UTF-8 BOM and exact 1:1 code mapping. | [ ] | |

---

## SIGN-OFF & UAT VERDICT

* **UAT Test Date:** `____________________`
* **Tester Name / Role:** `____________________`
* **Overall Result:** `[ ] PASS` / `[ ] FAIL` / `[ ] CONDITIONAL PASS`
* **Comments / Observations:** `_________________________________________________________________`
