# Phase 15 — UAT and Release Control Design

## 1. Purpose and Scope
This document formally defines the User Acceptance Testing (UAT) workflows and the Release Control Model for the TapNow / NFC Review Platform MVP. It outlines the exact steps for operational validation, negative scenario handling, and the mandatory checks required prior to and during production deployment. 

## 2. Current Verified Baseline
The system is currently in a verified pre-release state (Phase 15 Step 1 Baseline):
- **Backend Test Suite:** 62 / 62 PASSED
- **Integration Test Suite:** 38 / 38 PASSED (includes E2E and Live workflows)
- **Frontend Production Build:** PASSED
- **Database Migrations:** `003_add_orders_and_card_order_id` (head)
- **Infrastructure:** Docker isolated, NFC MVP operating on port 8300. PostgreSQL and Redis operate on an internal Docker network with no exposed host ports.

---

## 3. NFC_ONLY UAT Workflow

| Step | User Action | Expected System/API Behavior | Expected UI Result | Acceptance/Blocking Criteria |
|---|---|---|---|---|
| **1. Business Creation** | Operator submits new Business form | `POST /api/v1/businesses` creates business | Business appears in list view | Must enforce HTTP/HTTPS `logo_url` validation |
| **2. Destination Creation** | Operator submits new Destination | `POST /api/v1/destinations` creates destination | Destination appears in list view | URL must have HTTP/HTTPS scheme |
| **3. Order Creation** | Operator creates order with product `NFC_ONLY` | `POST /api/v1/orders` records order | Order appears in Orders view with `NFC_ONLY` badge | Quantity must be > 0 |
| **4. Card Generation** | Operator clicks "Generate Cards" | `POST /api/v1/orders/{id}/generate-cards` generates cards | Drawer populates with exact card quantity | Generation must be idempotent (no duplicates) |
| **5. NFC Provisioning** | Operator encodes physical tag | API provides NFC URL (`/n/{code}`) | Operator UI shows NFC payload | Card NFC URL must physically redirect to target |
| **6. NFC QC** | Operator verifies NFC tap | `PATCH /api/v1/cards/{code}` toggles `qc_nfc_tested` | NFC QC badge turns green | Required for reconciliation |
| **7. Dest. Verification** | Operator verifies link destination | `PATCH /api/v1/cards/{code}` toggles `qc_destination_verified` | Dest QC badge turns green | Required for reconciliation |
| **8. Reconciliation** | Operator views Readiness | `GET /api/v1/orders/{id}/reconciliation` evaluates state | QR requirement is hidden / N/A | Must NOT block on QR QC for NFC_ONLY |
| **9. Batch Export** | Operator downloads NFC CSV | `GET /api/v1/orders/{id}/export/nfc.csv` returns file | CSV downloads with UTF-8 BOM | QR export must fail with HTTP 422 |
| **10. Delivery Readiness**| Operator reviews order status | API flags `is_ready_for_delivery=True` | UI shows "Ready for Delivery" | All generated cards must pass NFC & Dest QC |
| **11. Completion** | Operator marks order `COMPLETED` | `PATCH /api/v1/orders/{id}` updates status | Status changes to COMPLETED | Transition rejected (HTTP 422) if not ready |

---

## 4. NFC_QR UAT Workflow

| Step | User Action | Expected System/API Behavior | Expected UI Result | Acceptance/Blocking Criteria |
|---|---|---|---|---|
| **1. Business Creation** | Operator submits new Business form | `POST /api/v1/businesses` creates business | Business appears in list view | Must enforce HTTP/HTTPS `logo_url` validation |
| **2. Destination Creation** | Operator submits new Destination | `POST /api/v1/destinations` creates destination | Destination appears in list view | URL must have HTTP/HTTPS scheme |
| **3. Order Creation** | Operator creates order with product `NFC_QR` | `POST /api/v1/orders` records order | Order appears in Orders view with `NFC_QR` badge | Quantity must be > 0 |
| **4. Card Generation** | Operator clicks "Generate Cards" | `POST /api/v1/orders/{id}/generate-cards` generates cards | Drawer populates with exact card quantity | Generation must be idempotent (no duplicates) |
| **5. NFC Provisioning** | Operator encodes physical tag | API provides NFC URL (`/n/{code}`) | Operator UI shows NFC payload | Card NFC URL must redirect to target |
| **6. QR Provisioning** | Operator exports QR labels | `GET /api/v1/orders/{id}/qr-labels` supplies data | Browser print dialog opens for labels | Output must map deterministically 1:1 to cards |
| **7. NFC QC** | Operator verifies NFC tap | `PATCH /api/v1/cards/{code}` toggles `qc_nfc_tested` | NFC QC badge turns green | Required for reconciliation |
| **8. QR QC** | Operator verifies printed QR scan | `PATCH /api/v1/cards/{code}` toggles `qc_qr_tested` | QR QC badge turns green | Required for reconciliation |
| **9. Dest. Verification** | Operator verifies link destination | `PATCH /api/v1/cards/{code}` toggles `qc_destination_verified` | Dest QC badge turns green | Required for reconciliation |
| **10. Reconciliation** | Operator views Readiness | `GET /api/v1/orders/{id}/reconciliation` evaluates state | All QC pillars required | Must block if QR QC is missing |
| **11. Batch Export** | Operator downloads QR CSV | `GET /api/v1/orders/{id}/export/qr.csv` returns file | CSV downloads with UTF-8 BOM | Must map dynamic QR URLs |
| **12. Delivery Readiness**| Operator reviews order status | API flags `is_ready_for_delivery=True` | UI shows "Ready for Delivery" | All cards must pass NFC, QR, and Dest QC |
| **13. Completion** | Operator marks order `COMPLETED` | `PATCH /api/v1/orders/{id}` updates status | Status changes to COMPLETED | Transition rejected (HTTP 422) if not ready |

---

## 5. Negative UAT Scenarios

1. **Attempting to complete an incomplete order:** UI transitions status to `COMPLETED`. **Result:** Backend rejects with HTTP 422 detailing missing QC criteria.
2. **Missing NFC QC:** A card lacks `qc_nfc_tested`. **Result:** Reconciliation engine flags `is_ready_for_delivery=False` and lists the specific blocking reason.
3. **Missing QR QC for NFC_QR:** A card in an `NFC_QR` order lacks `qc_qr_tested`. **Result:** Reconciliation engine flags as False and blocks order completion.
4. **QR operations attempted for NFC_ONLY:** Operator attempts to download QR CSV or view QR Label Sheet for an `NFC_ONLY` order. **Result:** Backend rejects CSV download with HTTP 422. QR Label Sheet yields 0 items.
5. **Missing destination verification:** A card lacks `qc_destination_verified`. **Result:** Reconciliation engine flags as False and blocks order completion.
6. **Fewer generated cards than ordered quantity:** Implementation dynamically generates the exact quantity. It is impossible to generate fewer. If state is corrupted, reconciliation blocks completion.
7. **Unauthorized management API access:** Request sent to `/api/v1/*` without a valid `X-API-Key`. **Result:** Backend returns HTTP 401 Unauthorized.
8. **Invalid destination URL:** `javascript:alert(1)` submitted as destination. **Result:** Backend returns HTTP 422 Unprocessable Entity.
9. **Invalid or unavailable card code behavior:** Public access to `/n/{invalid_code}`. **Result:** Backend returns HTTP 404 Not Found (or 403 if disabled).
10. **Cross-order export isolation:** Exporting CSV for Order A. **Result:** Output strictly contains cards linked to Order A; zero contamination from Order B.

---

## 6. Release Control Model

### 🟢 GO
- **Definition:** All mandatory technical and operational criteria are satisfied. The system is fully cleared for production deployment.
- **Entry Criteria:** 100% test pass rate, verified Docker isolation, successful UAT sign-off, production infrastructure ready.
- **Evidence:** Automated test logs, UAT sign-off document, environment configuration review.
- **Validation:** Human Lead Architect / Project Owner.
- **Human Approval Required:** YES.

### 🟡 CONDITIONAL GO
- **Definition:** No critical blockers exist, but non-critical conditions (e.g., minor UI glitches, deferred non-blocking features) remain.
- **Entry Criteria:** 100% core workflow pass rate; no security or data integrity risks; documented known issues.
- **Evidence:** Risk assessment, explicit waiver for known issues.
- **Validation:** Human Project Owner.
- **Human Approval Required:** YES (requires explicit sign-off on limitations).

### 🔴 NO-GO / BLOCKED
- **Definition:** A critical technical, security, data integrity, deployment, or operational requirement has failed.
- **Entry Criteria:** Test failures, failed security audit, environment misconfiguration, or blocked UAT workflow.
- **Evidence:** Error logs, failing test reports, blocking issue descriptions.
- **Validation:** QA/DevOps Agent or Human Reviewer.
- **Human Approval Required:** N/A (Release is automatically halted).

---

## 7. Production Release Checklist

### A. Pre-Deployment
- [ ] **Environment Configuration:** Validate `.env` against `.env.example`. (REQUIRES HUMAN DECISION)
- [ ] **Secret/API Key Validation:** Ensure strong, unique `API_KEY` is injected without exposing it in logs.
- [ ] **Database Migration Verification:** Confirm `003_add_orders_and_card_order_id` is the `head` migration. (VERIFIED)
- [ ] **Backup Strategy/Status:** Ensure PostgreSQL volumes are backed up. (NOT YET VERIFIED - REQUIRES HUMAN DECISION)
- [ ] **DNS/Domain Readiness:** Confirm `tapnow.ir` routes correctly to the host machine. (NOT YET VERIFIED - REQUIRES HUMAN DECISION)
- [ ] **TLS/HTTPS Readiness:** Confirm reverse proxy (e.g., NGINX/Traefik) terminates TLS correctly. (NOT YET VERIFIED - REQUIRES HUMAN DECISION)
- [ ] **PUBLIC_BASE_URL Validation:** Confirm URL matches `https://tapnow.ir`. (REQUIRES HUMAN DECISION)
- [ ] **Docker Configuration Review:** Verify restart policies and limits. (VERIFIED)
- [ ] **Port Isolation:** Ensure port 8300 is the only exposed port, and 8000/8001/8202 are untouched. (VERIFIED)

### B. Deployment
1. Pull latest verified repository state.
2. Build frontend production bundle (`npm run build`).
3. Deploy docker compose stack (`docker compose up -d --build`).
4. Execute database migrations (`docker exec <app-container> alembic upgrade head`).
5. Validate Health probe (`curl http://127.0.0.1:8300/health`).
6. Validate Readiness probe (`curl http://127.0.0.1:8300/ready`).
7. Validate Management API via authenticated request (`curl -H "X-API-Key: ..." http://127.0.0.1:8300/api/v1/dashboard/overview`).
8. Validate Frontend UI availability via browser.
9. Validate public redirect endpoints via direct fetch.

### C. Post-Deployment Smoke Test
- **Test 1:** Access frontend UI login/dashboard (Verify layout and authentication).
- **Test 2:** Create a test Business and test Destination (Verify database write functionality).
- **Test 3:** Create a 1-quantity NFC_ONLY order and generate the card (Verify order engine).
- **Test 4:** Scan the generated physical URL (`/n/{code}`) and verify 302 redirect to the target destination (Verify public routing).
- **Test 5:** Mark the order as Cancelled or delete test data if cleanup tooling is implemented.

### D. Rollback Decision Criteria
A release **MUST BE ROLLED BACK** immediately if any of the following occur:
- **Health/Ready Failure:** Container fails to start, crashes repeatedly, or readiness probe fails.
- **Migration Incompatibility:** Alembic upgrade fails or corrupts existing data logic.
- **Critical API Failure:** Core endpoints (Business/Card creation) return unexpected 5xx errors.
- **Public Redirect Failure:** NFC/QR endpoints fail to route to destinations (breaking physical hardware in the field).
- **Authentication/Security Regression:** API keys fail to protect management routes, or endpoints expose sensitive information.
- **Data Integrity Risk:** Database queries exhibit cross-tenant contamination or invalid state transitions.

---

## 8. Human Decisions Required

During deployment and final sign-off, the following decisions must be made by the Human Operator:

1. **Production Domain/DNS Readiness**
2. **TLS/HTTPS Configuration**
3. **Backup Policy Acceptance**
4. **Environment Variable Injection**
5. **Final GO/NO-GO Decision**

---
*Document automatically generated during Phase 15 Step 2.*
