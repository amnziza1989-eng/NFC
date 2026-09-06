# PHASE 15 — STEP 3 DISCOVERY REPORT
## LOCAL PRODUCT COMPLETION & ONLINE SHOP PLANNING

### 1. Executive Summary
This document provides a comprehensive discovery and architectural proposal for expanding the TapNow NFC Review Platform to include a customer-facing Online Shop for Localhost demonstration and testing. The primary goal is to safely extend the current B2B operator-driven architecture into a self-service e-commerce flow without breaking the verified fulfillment, QC, and NFC provisioning pipelines.

### 2. Current System Discovery (Baseline State)
- **Git Branch:** `feature/mvp-foundation`
- **Deployment Target:** Localhost strictly.
- **Docker Infrastructure:** NFC MVP isolated on port `8300` (Backend API + Vite Frontend), with strictly internal PostgreSQL (`5432`) and Redis (`6379`) containers. Unrelated projects (`8000`, `8001`, `8202`) remain untouched.
- **Data Model:** The system currently orbits around the `Business` entity. An `Order` represents a direct factory provisioning request linking exactly one `Business`, one `Destination` (e.g., Google Review URL), one `ProductType` (`NFC_ONLY` or `NFC_QR`), and a `Quantity`.
- **Frontend Architecture:** Purely an internal administrative dashboard (`businesses`, `cards`, `dashboard`, `destinations`, `orders`, `qc`).

### 3. Existing Feature Inventory (Reuse Candidates)
- **Backend Reusability:** 
  - The `Order` entity is perfectly modeled to act as a fulfillment "line item".
  - `ProductType` enum (`NFC_ONLY`, `NFC_QR`) inherently acts as our Top-Level Product Variants.
  - `Quantity` natively supports batch generation of `Card` entities.
  - The Order Status State Machine (`CREATED` -> `CARDS_GENERATED` -> `QC_PENDING` -> `COMPLETED`) is robust and ready to handle post-checkout fulfillment.
- **Frontend Reusability:** 
  - Internal dashboard components (tables, layouts, API hooks) can be leveraged to build a lightweight customer portal if needed.
  - The Admin UI is already built to visualize the downstream flow of any created orders.

### 4. Online Shop Gap Analysis & Missing Capabilities
Currently, the system lacks any public-facing customer portal. The missing elements include:
- **Public Storefront:** No public landing page, product catalog, product detail/configuration pages, or checkout flow.
- **Customer Identity & Shipping:** The `Business` model stores a `name` and `logo_url`, but lacks contact information (Email, Phone) and physical Shipping/Billing addresses required for an e-commerce checkout.
- **Cart/Checkout Logic:** `Order` represents a single product-to-destination mapping. A unified "Shopping Cart" that aggregates multiple destinations/products into a single payment event does not exist.
- **Payment State:** The `OrderStatus` enum assumes orders are immediately actionable (`CREATED`). There is no `PENDING_PAYMENT` or payment tracking mechanism.

### 5. Recommended Architecture
We propose a **Strict Boundary Architecture**:
- **Public Application (Storefront):** Served via new public routes on the frontend (e.g., `/shop`, `/checkout`). These routes interact only with Public APIs (`/api/v1/public/...`).
- **Internal Application (Admin):** The existing dashboard remains behind authentication, interacting with Internal APIs (`/api/v1/internal/...`).

### 6. Product Catalog Options
**Agent Recommendation: OPTION A (Hybrid Reuse)**
Instead of building complex generic `Product` and `Variant` database tables, we map the TapNow offerings directly to the existing `ProductType` enum:
- Product 1: "TapNow Smart Card (NFC Only)" -> maps to `NFC_ONLY`
- Product 2: "TapNow Smart Card (NFC + QR)" -> maps to `NFC_QR`
This allows the "Product Page" to be hardcoded in the frontend (since the offerings are highly specific physical templates), drastically reducing backend complexity while preserving the verified order generation logic.

### 7. Proposed Localhost User Journey
1. **Public Shop:** User visits `http://127.0.0.1:8300/shop`.
2. **Select Product:** User chooses "NFC + QR Card".
3. **Configure:** User inputs their Business Name and Google Review URL.
4. **Checkout:** User enters mock shipping details and confirms.
5. **Mock Payment:** System simulates a successful payment.
6. **Order Creation:** Backend automatically provisions the `Business`, `Destination`, and `Order` entities.
7. **Fulfillment:** The Admin opens the internal dashboard (`/orders`), sees the new order, and proceeds with the exact same Phase 13/14 QR/NFC provisioning workflow.

### 8. Database Impact
To support checkout and fulfillment, the following schema expansions will eventually be required:
- **`Business` Table:** Add `contact_email`, `contact_phone`.
- **`Order` (or new `OrderShipping`) Table:** Add `shipping_address`, `shipping_city`, `shipping_postal_code`, `customer_name`.
- **`OrderStatus` Enum:** Consider adding `PENDING_PAYMENT` for real payment integrations later (requires Alembic migration).

### 9. API Impact
- **New Public Endpoints:**
  - `POST /api/v1/public/checkout`: Accepts business details, destination URL, product configuration, and shipping info. Creates the full relational chain (Business -> Destination -> Order) in a single transaction.
- **Security Boundary:** Public checkout must be rigorously rate-limited and subjected to strict URL validation for the `Destination` to prevent SSRF or malicious payload injections. No internal IDs or analytics should be leaked to the public checkout response.

### 10. Payment Strategy Options (Localhost)
**Agent Recommendation: Option 1 - Mock Payment Adapter**
For Localhost testing, we implement a frontend "Simulate Payment" button that bypasses real gateway integrations but posts to the backend checkout endpoint. The backend will treat the order as fully paid (`CREATED`) and inject it straight into the operational pipeline. This proves the UX without requiring production API keys.

### 11. Recommended Implementation Roadmap
- **Step 3A:** Discovery & Planning *(Current)*
- **Step 3B:** Architecture Approval *(Awaiting Human)*
- **Step 3C:** Database Expansion (Shipping/Contact fields via Alembic)
- **Step 3D:** Public Checkout API (`POST /api/v1/public/checkout`)
- **Step 3E:** Frontend Public Shop Layout & Product Pages
- **Step 3F:** Frontend Cart & Mock Checkout Flow
- **Step 3G:** Local End-to-End E-commerce UAT

---

## 12. HUMAN DECISIONS REQUIRED

### DECISION 1: Online Shop Scope
- **Question:** Should the shop support buying multiple different configurations (e.g., 2 cards for Google Review + 1 card for Instagram) in a single checkout cart, or force a simpler "One Configuration per Checkout" flow for the MVP?
- **Options:** 
  A. Full Shopping Cart (Multiple destinations/products per checkout).
  B. Single Checkout (Configure one destination, checkout immediately).
- **Agent Recommendation:** Option B. Drastically reduces MVP complexity and perfectly aligns with the current `Order` table structure.

### DECISION 2: Database Expansion for Customer Info
- **Question:** How should we store customer shipping and contact information?
- **Options:** 
  A. Add columns directly to the `Business` and `Order` tables (Requires Alembic migration).
  B. Create dedicated `Customer` and `ShippingAddress` tables.
- **Agent Recommendation:** Option A. Keeps the relational model flat and fast for an MVP.

### DECISION 3: Local Payment Simulation Strategy
- **Question:** How should we handle the payment step for Localhost demonstration?
- **Options:**
  A. Mock Payment Adapter (Frontend simulates success, order goes straight to `CREATED`).
  B. Manual Payment State (Order becomes `PENDING_PAYMENT`, admin must manually approve it in the dashboard).
- **Agent Recommendation:** Option A. Provides a smoother self-service demo experience for the human owner to test.

### DECISION 4: Implementation Authorization
- **Question:** Do you approve this architecture and authorize moving to the Database/API implementation steps?
- **Options:**
  A. 🟢 GO (Proceed with Database Expansion and Public Checkout API).
  B. 🟡 CONDITIONAL GO (Proceed with adjustments).
  C. 🔴 NO-GO (Revise architecture).
