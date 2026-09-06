# NFC MVP — Central Snapshots

> Single canonical snapshot history for the NFC MVP.
> Rule: every future milestone/phase snapshot must be appended to this file; do not create alternative snapshot systems.

## Project Baseline / Invariants

- Project: NFC Review Platform MVP
- Framework: FastAPI
- Database: PostgreSQL 16 via SQLAlchemy Async + asyncpg
- Cache/rate limiter: Redis 7, internal Docker network only
- Public host port: `8300 -> 8000`
- Protected management API: `X-API-Key` on `/api/v1/*`
- Public redirect endpoints: `/n/{code}`, `/q/{code}`, `/q/{code}/qr.png`
- Rate limiting: 60 requests/minute/IP, Redis fail-open
- Observability: `X-Request-ID` correlation middleware
- Core entities: Business, Destination, Card, Event
- Explicitly out of scope unless separately approved: Location entity, SaaS multi-tenancy, JWT/OAuth, frontend UI, unnecessary schema complexity
- Docker isolation invariant: `8000` Dessert; `8001` MegaMeals; `8202` Trading AI MVP; `8300` NFC MVP
- NFC PostgreSQL and Redis must remain internal-only with no host port mappings
- Git sovereignty invariant: no commit, push, merge, rebase, or branch creation unless explicitly requested.

## Phase 1 — Foundation Snapshot

- NFC MVP established as an isolated Docker project.
- App exposed on host port `8300`, container port `8000`.
- PostgreSQL internal-only.
- Core Business / Destination / Card / Event flow implemented.
- Health endpoint verified.
- Initial NFC and QR redirects verified with event tracking.
- Existing projects on ports 8000, 8001, and 8202 preserved.

## Phase 2 — Security & Operational Foundation Snapshot

- API-key authentication enforced for all internal `/api/v1/*` management routes.
- Redis added internally for rate limiting.
- Public NFC/QR redirects protected by 60 requests/minute/IP rate limiting.
- Redis rate limiter fails open during Redis outage.
- Dynamic QR PNG endpoint added at `/q/{code}/qr.png`.
- Authentication failures and rate-limit events logged without secrets.
- `.env` remains excluded from Git.
- Test suite: 31/31 passed.
- Docker isolation preserved.

## Phase 3 — Provisioning & Analytics Snapshot

- Card QC fields added: `qc_nfc_tested`, `qc_qr_tested`, `qc_destination_verified`.
- Alembic migration `002_add_qc_fields.py` applied safely.
- Provisioning endpoint: `GET /api/v1/cards/{id}/provisioning`.
- Card analytics endpoint: `GET /api/v1/cards/{id}/analytics`.
- E2E verification script added.
- Test suite: 39/39 passed.
- E2E: 13/13 passed.
- No data dropped or truncated.
- Docker isolation preserved.

## Phase 4 — Production Hardening / Operational Readiness Snapshot

- `X-Request-ID` correlation middleware added.
- Structured request logging added without exposing API keys/secrets.
- `/ready` database readiness check verified.
- Existing database indexing inspected; redundant migration avoided.
- Analytics recent-event query confirmed bounded and deterministically ordered.
- `restart: unless-stopped` hardened Docker service behavior.
- Test suite: 41/41 passed.
- E2E: 13/13 passed.
- Docker isolation preserved.
- No Git commit/push/merge/rebase performed.

## Phase 5 — Dashboard & Date-Range Analytics Snapshot

- Dashboard overview endpoint: `GET /api/v1/dashboard/overview`.
- Dashboard metrics: total/active businesses, total/active cards, total events, NFC events, QR events.
- Database-native aggregate queries used.
- Card analytics enhanced with optional `start_date` and `end_date`.
- Inclusive start / exclusive end-day semantics implemented.
- Existing 20-event recent limit and descending ordering preserved.
- Test suite: 46/46 passed.
- E2E: 13/13 passed.
- No migration required.
- Docker isolation preserved.
- No Git commit/push/merge/rebase performed.

## Phase 6 — Search & Operational Filtering Snapshot

- Business list enhanced with `search` and `status`.
- Card list enhanced with `code`, `search`, `status`, and `destination_id`.
- Existing `business_id`, pagination, ordering, and response structures preserved.
- Filtering performed at database level.
- Invalid status/UUID inputs return standard HTTP 422.
- Test suite: 48/48 passed.
- E2E: 13/13 passed.
- No migration required.
- Docker isolation preserved: 8000 Dessert, 8001 MegaMeals, 8202 Trading AI, 8300 NFC.
- PostgreSQL/Redis internal-only.
- No Git commit/push/merge/rebase performed.

## Phase 7 — Pre-Audit Snapshot

**Status:** Snapshot initialized so Phase 7 can proceed.

### Known baseline entering Phase 7

- Branch: `feature/mvp-foundation`
- Reference commit reported by prior audit: `bb38996` (`chore: docker port config and cleanup`)
- Latest completed milestone: Phase 6
- Baseline tests: 48/48 passed
- Baseline E2E: 13/13 passed
- NFC host port: 8300
- Other protected host ports: 8000, 8001, 8202
- NFC PostgreSQL: internal-only
- NFC Redis: internal-only
- No Git history mutation authorized
- No unrelated Docker project may be modified, stopped, restarted, pruned, or reconfigured

### Phase 7 Snapshot Rule

Before any Phase 7 modification, append the verified pre-modification state to this file. After successful completion, append a Phase 7 completion snapshot with exact tests, E2E, Docker/port isolation, migration status, Git state/actions, changed files, security impact, limitations, and explicit confirmation that unrelated projects were untouched.

## Phase 7 — Destination Listing & Entity Management Parity Completion Snapshot

- **Completion Date/Time:** 2026-08-27T16:07:00+03:30
- **Scope Completed:** Destination list endpoint `GET /api/v1/destinations` with optional `business_id`, `status` (`ACTIVE`/`DISABLED`), `type`, and pagination (`skip`, `limit` max 100) filters.
- **Files Modified:**
  - `app/services/service.py` (Added `list_destinations` with DB-side filtering and ordering)
  - `app/api/internal/routes.py` (Added `api_list_destinations` endpoint with `X-API-Key` auth)
  - `tests/test_internal.py` (Added `test_list_destinations_and_filtering` and `test_list_destinations_unauth`)
- **Test Results:** **50 / 50 PASSED** in 8.53s
- **E2E Results:** **ALL 13 VERIFICATIONS PASSED**
- **Live API Verification:** Verified `GET /api/v1/destinations` directly on `http://localhost:8300` container.
- **Database / Migration Status:** Zero migrations required. Pure reuse of existing normalized schema and indexes.
- **Docker / Port Isolation Status:**
  - Port `8000`: Dessert (Untouched)
  - Port `8001`: MegaMeals (Untouched)
  - Port `8202`: Trading AI MVP (Untouched)
  - Port `8300`: NFC MVP (`nfc-mvp-app-1` active)
  - PostgreSQL & Redis: strictly internal to `nfc-mvp` bridge network (zero host ports).
- **Git Status / Actions:** Branch `feature/mvp-foundation`; zero commits, pushes, merges, rebases, or branch creations performed.
- **Security Impact:** All `/api/v1/destinations` requests require valid `X-API-Key`; invalid keys return 401. URL validation preserved.
- **Limitations:** Bulk export/batch operations intentionally out of scope for MVP.
- **Explicit Invariant Confirmation:** Unrelated Docker projects on ports 8000, 8001, and 8202 were completely untouched.

## Phase 8 — Pre-Implementation Snapshot

- **Pre-Modification Date/Time:** 2026-08-27T16:34:00+03:30
- **Git Branch:** `feature/mvp-foundation`
- **Git HEAD Commit:** `bb389961f6c4b336ba89b3a8edbbe60e2901db61` (`bb38996 chore: docker port config and cleanup`)
- **Baseline Pytest:** **50 / 50 PASSED** in 11.69s
- **Baseline E2E:** **ALL 13 VERIFICATIONS PASSED**
- **Docker Isolation Status:**
  - Port `8000`: Dessert (`deserkhoone-backend-1` / `deserkhoone_app-backend-run-...`) — Untouched & Active
  - Port `8001`: MegaMeals (`megameals_app-backend-1`) — Untouched & Active
  - Port `8202`: Trading AI MVP (`trading-ai-mvp`) — Untouched & Active
  - Port `8300`: NFC MVP (`nfc-mvp-app-1`) — Active & Operational
  - PostgreSQL & Redis: Strictly internal to `nfc-mvp` Docker bridge network (no host ports mapped).
- **Authorized Phase 8 Scope:** Business-Level Aggregated Analytics (`GET /api/v1/businesses/{business_id}/analytics`).
- **Migration Status:** Zero schema changes, zero migrations.

## Phase 8 — Business-Level Aggregated Analytics Completion Snapshot

- **Completion Date/Time:** 2026-08-27T16:37:00+03:30
- **Scope Completed:** Business-Level Aggregated Analytics endpoint `GET /api/v1/businesses/{business_id}/analytics` with optional `start_date` and `end_date` date filters (UTC half-open semantics), returning `total`, `nfc`, `qr`, `total_cards`, `active_cards`, and `recent` (last 20 events across all business cards ordered by `created_at DESC`).
- **Files Modified:**
  - `app/schemas/schemas.py` (Added `BusinessAnalyticsResponse`)
  - `app/services/service.py` (Added `get_business_analytics` with DB-side aggregation and card joins)
  - `app/api/internal/routes.py` (Added `api_business_analytics` endpoint with `X-API-Key` auth and 422 date validation)
  - `tests/test_analytics.py` (Added 4 new test functions covering aggregation, multi-card rollup, cross-business isolation, date filtering, 401 unauth, 404 missing business, recent 20 limit, and created_at DESC order)
- **Test Results:** **54 / 54 PASSED** in 9.68s
- **E2E Results:** **ALL 13 VERIFICATIONS PASSED**
- **Live API Verification Result:** Verified live creation of business, destinations, cards, redirects, and `GET /api/v1/businesses/{id}/analytics` response on `http://localhost:8300`.
- **Database / Migration Status:** Zero migrations required. Queries execute database-side joins on existing indexes.
- **Docker / Port Isolation Status:**
  - Port `8000`: Dessert (Untouched & Active)
  - Port `8001`: MegaMeals (Untouched & Active)
  - Port `8202`: Trading AI MVP (Untouched & Active)
  - Port `8300`: NFC MVP (`nfc-mvp-app-1` active)
  - PostgreSQL & Redis: Strictly internal to `nfc-mvp` bridge network (zero host ports).
- **Git Branch & HEAD Status:** Branch `feature/mvp-foundation`, HEAD `bb389961f6c4b336ba89b3a8edbbe60e2901db61`.
- **Git Actions Performed:** Zero commits, zero pushes, zero merges, zero rebases, zero branch creations.
- **Security Impact:** Enforces `X-API-Key` authentication (401 on missing/invalid key). SQL injection protected via parameterized queries.
- **Backward Compatibility Confirmation:** 100% backward compatible; all existing endpoints and behaviors remain unchanged.
- **Limitations:** Multi-tenancy, frontend UI, bulk export, and location entities are deferred/out of scope.
- **Explicit Invariant Confirmation:** Unrelated Docker projects on ports 8000, 8001, and 8202 were completely untouched.

## Phase 10 — Pre-Implementation Snapshot

- **Pre-Modification Date/Time:** 2026-08-27T17:07:00+03:30
- **Git Branch:** `feature/mvp-foundation`
- **Git HEAD Commit:** `bb389961f6c4b336ba89b3a8edbbe60e2901db61` (`bb38996 chore: docker port config and cleanup`)
- **Baseline Pytest:** **54 / 54 PASSED** in 12.65s
- **Baseline E2E:** **ALL 13 VERIFICATIONS PASSED**
- **Docker Isolation Status:**
  - Port `8000`: Dessert (`deserkhoone-backend-1` / `deserkhoone_app-backend-run-...`) — Untouched & Active
  - Port `8001`: MegaMeals (`megameals_app-backend-1`) — Untouched & Active
  - Port `8202`: Trading AI MVP (`trading-ai-mvp`) — Untouched & Active
  - Port `8300`: NFC MVP (`nfc-mvp-app-1`) — Active & Operational
  - PostgreSQL & Redis: Strictly internal to `nfc-mvp` Docker bridge network (no host ports mapped).
- **Authorized Phase 10 Scope:** Production Hardening & Documentation Reconciliation:
  1. Add HTTP/HTTPS URL scheme validation to `BusinessCreate.logo_url` and `BusinessUpdate.logo_url`.
  2. Reconcile `README.md` to reflect current verified architecture, host port 8300, `X-API-Key` auth, and full API catalog.
  3. Reconcile `docs/ARCHITECTURE.md` with current system components (Redis rate limiting, QC fields, data flows).
  4. Update `NFC_MASTER_PROJECT_CONTEXT.md` to reflect Phase 10 state.
- **Migration Status:** Zero schema changes, zero migrations required.
- **Git Actions Restrictions:** Zero commits, zero pushes, zero merges, zero rebases, zero branch creations.

## Phase 10 — Production Hardening & Documentation Reconciliation Completion Snapshot

- **Completion Date/Time:** 2026-08-27T17:12:00+03:30
- **Scope Completed:** 
  1. Added HTTP/HTTPS URL scheme and domain validation to `BusinessCreate.logo_url` and `BusinessUpdate.logo_url` in `app/schemas/schemas.py`.
  2. Added 6 automated tests in `tests/test_internal.py` covering valid HTTPS/HTTP logo URLs and rejecting javascript, plain string, and FTP schemes with HTTP 422.
  3. Reconciled `README.md` to reflect current verified architecture, host port 8300, `X-API-Key` auth, full 17-endpoint catalog, and port isolation rules.
  4. Reconciled `docs/ARCHITECTURE.md` with system components (Redis rate limiting, QC fields, public/management traffic flows).
  5. Updated `NFC_MASTER_PROJECT_CONTEXT.md` to reflect Phase 10 verified baseline (60/60 tests passing).
- **Files Modified:**
  - `app/schemas/schemas.py`
  - `tests/test_internal.py`
  - `README.md`
  - `docs/ARCHITECTURE.md`
  - `NFC_MASTER_PROJECT_CONTEXT.md`
  - `NFC_MVP_SNAPSHOTS.md`
- **Test Results:** **60 / 60 PASSED** in 10.30s across all 10 test modules.
- **E2E Results:** **ALL 13 VERIFICATIONS PASSED**.
- **Live API Verification Result:** Verified live creation of business with HTTPS logo_url (201), rejection of `javascript:alert(1)` (422), rejection of `ftp://...` (422), and health check (200) against `http://localhost:8300`.
- **Database / Migration Status:** Zero migrations required. Pure Pydantic schema validation.
- **Docker / Port Isolation Status:**
  - Port `8000`: Dessert (Untouched & Active)
  - Port `8001`: MegaMeals (Untouched & Active)
  - Port `8202`: Trading AI MVP (Untouched & Active)
  - Port `8300`: NFC MVP (`nfc-mvp-app-1` active & responding)
  - PostgreSQL & Redis: Strictly internal to `nfc-mvp` bridge network (zero host ports).
- **Git Branch & HEAD Status:** Branch `feature/mvp-foundation`, HEAD `bb389961f6c4b336ba89b3a8edbbe60e2901db61`.
- **Git Actions Performed:** Zero commits, zero pushes, zero merges, zero rebases, zero branch creations.
- **Security Impact:** Eliminates XSS and dangerous scheme injection in business metadata. `X-API-Key` and fail-open rate limiting remain enforced.
- **Backward Compatibility Confirmation:** 100% backward compatible for all valid HTTP/HTTPS logo URLs.
- **Limitations:** Batch card provisioning, CSV exports, frontend UI, and multi-tenancy remain intentionally deferred.
- **Explicit Invariant Confirmation:** Unrelated Docker projects on ports 8000, 8001, and 8202 were completely untouched.

## Phase 13.1 — Pre-Implementation Snapshot

- **Pre-Modification Date/Time:** 2026-08-27T19:18:00+03:30
- **Git Branch:** `feature/mvp-foundation`
- **Git HEAD Commit:** `bb389961f6c4b336ba89b3a8edbbe60e2901db61` (`bb38996 chore: docker port config and cleanup`)
- **Baseline Pytest:** **60 / 60 PASSED** in 9.80s across all 10 test modules
- **Baseline E2E:** **ALL 13 VERIFICATIONS PASSED**
- **Docker Isolation Status:**
  - Port `8000`: Dessert (`deserkhoone-backend-1` / `deserkhoone_app-backend-run-...`) — Untouched & Active
  - Port `8001`: MegaMeals (`megameals_app-backend-1`) — Untouched & Active
  - Port `8202`: Trading AI MVP (`trading-ai-mvp`) — Untouched & Active
  - Port `8300`: NFC MVP (`nfc-mvp-app-1`) — Active & Operational
  - PostgreSQL & Redis: Strictly internal to `nfc-mvp` Docker bridge network (no host ports mapped).
- **Frontend Starting Condition:** No frontend folder or dependencies currently present.
- **Authorized Phase 13.1 Scope:** Frontend Foundation & Design System (TapNow Admin Dashboard):
  1. Scaffold modular frontend in `frontend/` using React 18, Vite, TypeScript, Tailwind CSS, Lucide React, React Router, TanStack Query.
  2. Implement Executive Dark SaaS + Premium Hybrid design system with Vazirmatn Persian typography, RTL default, and logical styling.
  3. Build Application Shell (Sidebar, Header, Main layout).
  4. Implement routing and high-quality foundational views for 5 primary workspaces (Overview, Businesses, Destinations, Cards, QC & Fulfillment).
  5. Establish typed API client with `X-API-Key` injection matching backend endpoints on port 8300.
- **Backend Safety Invariant:** BACKEND CHANGES = NONE. Zero schema changes, zero migrations.
- **Git Actions Restrictions:** Zero commits, zero pushes, zero merges, zero rebases, zero branch creations.

## Phase 13.1 — Frontend Foundation & Design System Completion Snapshot

- **Completion Date/Time:** 2026-08-27T19:27:00+03:30
- **Scope Completed:**
  1. Scaffolded modular frontend in `frontend/` with React 18, Vite 6, TypeScript 5.6, Tailwind CSS 3.4, Lucide React, React Router 6, TanStack Query 5.
  2. Implemented Executive Dark SaaS + Premium Hybrid design system with Vazirmatn Persian font, deep obsidian/slate surface tokens, emerald brand highlights, and semantic status badges.
  3. Configured `dir="rtl"` default with logical CSS properties and dynamic Persian/English language switching via `LanguageContext`.
  4. Built Application Shell with Sidebar navigation, Top Header with live health check probe, and API Key configuration modal.
  5. Implemented React Router with 5 fully designed foundational workspaces:
     - Dashboard Overview (`/`): Real-time KPI cards, NFC vs QR tap ratio breakdown bar, quick actions, live event stream.
     - Businesses (`/businesses`): Substring search, status filtering, table with logos/avatars, "Create Business" modal.
     - Destinations (`/destinations`): Target link table, business filtering, "Create Destination" modal with type selector.
     - Cards (`/cards`): 8-char code highlighted inventory, active/disabled toggle mutation, "Create Card" modal, Diagnostic Inspector modal with one-click copy and live telemetry.
     - QC & Fulfillment (`/qc`): Card selector workbench, dynamic high-res QR PNG streaming, NFC Tools writer payload, and interactive 3-step QC checklist.
  6. Built centralized typed API client (`apiClient.ts`) communicating with `/api/v1/*` on port 8300 with `X-API-Key` injection.
- **Files Created:**
  - `frontend/package.json`
  - `frontend/vite.config.ts`
  - `frontend/tsconfig.json`
  - `frontend/tsconfig.node.json`
  - `frontend/tailwind.config.js`
  - `frontend/postcss.config.js`
  - `frontend/index.html`
  - `frontend/public/favicon.svg`
  - `frontend/src/vite-env.d.ts`
  - `frontend/src/index.css`
  - `frontend/src/styles/designTokens.ts`
  - `frontend/src/types/api.ts`
  - `frontend/src/i18n/translations.ts`
  - `frontend/src/i18n/LanguageContext.tsx`
  - `frontend/src/services/apiClient.ts`
  - `frontend/src/components/ui/Button.tsx`
  - `frontend/src/components/ui/Badge.tsx`
  - `frontend/src/components/ui/Card.tsx`
  - `frontend/src/components/ui/MetricCard.tsx`
  - `frontend/src/components/ui/Input.tsx`
  - `frontend/src/components/ui/Modal.tsx`
  - `frontend/src/components/layout/Sidebar.tsx`
  - `frontend/src/components/layout/Header.tsx`
  - `frontend/src/components/layout/AppShell.tsx`
  - `frontend/src/features/dashboard/DashboardOverview.tsx`
  - `frontend/src/features/businesses/BusinessesView.tsx`
  - `frontend/src/features/destinations/DestinationsView.tsx`
  - `frontend/src/features/cards/CardsView.tsx`
  - `frontend/src/features/qc/QCFulfillmentView.tsx`
  - `frontend/src/App.tsx`
  - `frontend/src/main.tsx`
- **Files Modified:**
  - `NFC_MASTER_PROJECT_CONTEXT.md`
  - `NFC_MVP_SNAPSHOTS.md`
- **Frontend Build Verification:** **PASS** (`npm run build` executed in 18.99s, producing optimized production bundle `dist/assets/index-BvhfupuR.js 301.97 kB`).
- **Backend Test Results:** **60 / 60 PASSED** in 9.16s across all 10 test modules.
- **E2E Results:** **ALL 13 VERIFICATIONS PASSED**.
- **Backend Changes:** **BACKEND CHANGES: NONE** (Zero modifications to backend APIs, models, migrations, or database).
- **Docker / Port Isolation Status:**
  - Port `8000`: Dessert (Untouched & Active)
  - Port `8001`: MegaMeals (Untouched & Active)
  - Port `8202`: Trading AI MVP (Untouched & Active)
  - Port `8300`: NFC MVP (`nfc-mvp-app-1` active & responding)
  - PostgreSQL & Redis: Strictly internal to `nfc-mvp` bridge network (zero host ports).
- **Git Branch & HEAD Status:** Branch `feature/mvp-foundation`, HEAD `bb389961f6c4b336ba89b3a8edbbe60e2901db61`. Zero commits, pushes, merges, or branch creations.

## Phase 13.2.1 — Live Frontend ↔ Backend Integration Audit Completion Snapshot

- **Completion Date/Time:** 2026-08-28T02:30:00+03:30
- **Scope Completed:**
  1. Executed live Frontend dev server (`http://127.0.0.1:5173/`) and verified reverse proxy routing (`/api`, `/health`, `/ready`) to the live backend on port `8300`.
  2. Conducted complete live workflow integration audit:
     - Health & Readiness check: `/health` returns `200 OK` `{"status":"ok"}`.
     - Dashboard Overview: `/api/v1/dashboard/overview` returns live metrics.
     - Business creation flow: `POST /api/v1/businesses` successfully creates business and returns `201 Created`.
     - Destination creation flow: `POST /api/v1/destinations` successfully associates target URL and returns `201 Created`.
     - Card Issuance flow: `POST /api/v1/cards` generates unique 8-char card code and returns `201 Created`.
     - Fulfillment / Provisioning fetch: `GET /api/v1/cards/{id}/provisioning` returns complete payload with NFC write URL and dynamic QR PNG URL.
     - QC testing checklist updates: `PATCH /api/v1/cards/{id}` toggles `qc_nfc_tested`, `qc_qr_tested`, `qc_destination_verified`.
     - Physical NFC tap simulation: `GET /n/{card_code}` returns `302 Found` with `Location: <destination_url>`.
     - Card diagnostic inspector: `GET /api/v1/cards/{id}/info` logs and returns recent event telemetry.
  3. Identified and resolved API Contract schema alignments:
     - `ProvisioningResponse`: Aligned TypeScript types and UI props to `card_id` and `card_code`.
     - `CardInfoResponse`: Aligned TypeScript types to flat `business_name`, `destination_type`, `destination_url`.
     - `BusinessAnalytics` & `CardAnalytics`: Aligned to backend keys `total`, `nfc`, `qr`, `recent`.
  4. Verified zero regression on backend and verified frontend production build.
- **Files Created:**
  - `test_live_integration.py`
- **Files Modified:**
  - `frontend/vite.config.ts`
  - `frontend/src/types/api.ts`
  - `frontend/src/features/qc/QCFulfillmentView.tsx`
  - `frontend/src/features/cards/CardsView.tsx`
  - `NFC_MASTER_PROJECT_CONTEXT.md`
  - `NFC_MVP_SNAPSHOTS.md`
- **Frontend Build Verification:** **PASS** (`npm run build` executed in 3.09s, producing optimized production bundle `dist/assets/index-HUcUdvO9.js 302.03 kB`).
- **Live Integration Verification (`test_live_integration.py`):** **ALL 10 VERIFICATIONS PASSED**.
- **Backend Test Results:** **60 / 60 PASSED** in 9.27s across all 10 test modules.
- **E2E Results:** **ALL 13 VERIFICATIONS PASSED**.
- **Backend Changes:** **BACKEND CHANGES: NONE** (Zero modifications to backend APIs, models, migrations, or database).
- **Docker / Port Isolation Status:**
  - Port `8000`: Dessert (Untouched & Active)
  - Port `8001`: MegaMeals (Untouched & Active)
  - Port `8202`: Trading AI MVP (Untouched & Active)
  - Port `8300`: NFC MVP (`nfc-mvp-app-1` active & responding)
  - PostgreSQL & Redis: Strictly internal to `nfc-mvp` bridge network (zero host ports).
- **Git Branch & HEAD Status:** Branch `feature/mvp-foundation`, HEAD `bb389961f6c4b336ba89b3a8edbbe60e2901db61`. Zero commits, pushes, merges, or branch creations.

## Phase 13.2.2 — Pre-Implementation Snapshot

- **Pre-Modification Date/Time:** 2026-08-28T03:48:00+03:30
- **Git Branch:** `feature/mvp-foundation`
- **Git HEAD Commit:** `bb389961f6c4b336ba89b3a8edbbe60e2901db61`
- **Baseline Pytest:** **60 / 60 PASSED** in 9.87s across all 10 test modules
- **Baseline E2E:** **ALL 13 VERIFICATIONS PASSED**
- **Baseline Live Integration:** **10 / 10 VERIFICATIONS PASSED** (`test_live_integration.py`)
- **Docker Isolation Status:**
  - Port `8000`: Dessert (`deserkhoone-backend-1` / `deserkhoone_app-backend-run-...`) — Untouched & Active
  - Port `8001`: MegaMeals (`megameals_app-backend-1`) — Untouched & Active
  - Port `8202`: Trading AI MVP (`trading-ai-mvp`) — Untouched & Active
  - Port `8300`: NFC MVP (`nfc-mvp-app-1`) — Active & Operational
  - PostgreSQL & Redis: Strictly internal to `nfc-mvp` Docker bridge network (no host ports mapped).
- **Authorized Phase 13.2.2 Scope:** Interactive Analytics Visualization & Detail Drawers:
  1. Install minimal charting library (`recharts`) in `frontend/`.
  2. Implement slide-over `Drawer` primitive supporting RTL/LTR, Escape key, overlay backdrop click, and close controls.
  3. Implement `DateRangeFilter` component with presets (`Today`, `Last 7 Days`, `Last 30 Days`, `All Time`, `Custom Range`) and native start/end date inputs.
  4. Implement `BusinessDetailDrawer`:
     - Summary & status badges.
     - Live Business Analytics (`GET /api/v1/businesses/{id}/analytics`) with date range filtering.
     - Interactive Recharts Donut & Activity visualizations.
     - Live recent events stream.
     - Inline edit form (`PATCH /api/v1/businesses/{id}`) with URL validation and TanStack Query invalidation.
  5. Implement `DestinationDetailDrawer`:
     - Summary & target URL preview.
     - Inline edit form (`PATCH /api/v1/destinations/{id}`) with scheme validation (`http`/`https`), type selector, and status toggle.
  6. Implement `CardDetailDrawer`:
     - Card code badge, business & destination links.
     - Live Card Analytics (`GET /api/v1/cards/{id}/analytics`) with date filtering.
     - Real-time NFC vs QR ratio chart and recent event telemetry feed.
     - Destination reassignment and status toggle mutations.
  7. Integrate drawers across `BusinessesView`, `DestinationsView`, and `CardsView`.
  8. Update Persian & English translations in `translations.ts`.
  9. Add automated test coverage in `test_phase_13_2_2.py`.
- **Backend Safety Invariant:** BACKEND CHANGES = NONE. Zero schema changes, zero migrations.
- **Git Actions Restrictions:** Zero commits, zero pushes, zero merges, zero rebases, zero branch creations.

## Phase 13.2.2 — Completion Snapshot

- **Completion Date/Time:** 2026-08-28T03:55:00+03:30
- **Scope Completed:**
  1. Installed `recharts` minimal charting dependency in `frontend/`.
  2. Implemented slide-over `Drawer` primitive (`frontend/src/components/ui/Drawer.tsx`) supporting RTL/LTR transitions, Escape key listener, backdrop blur with dismiss, and max-width scaling.
  3. Implemented `DateRangeFilter` component (`frontend/src/components/analytics/DateRangeFilter.tsx`) with fast presets (`Today`, `Last 7 Days`, `Last 30 Days`, `All Time`, `Custom Range`), native start/end date inputs, and chronological range validation.
  4. Implemented `AnalyticsCharts` component (`frontend/src/components/analytics/AnalyticsCharts.tsx`) with Recharts Donut distribution chart, custom dark SaaS tooltips, percentage indicators, metric KPI cards, and live recent events stream.
  5. Implemented `BusinessDetailDrawer` (`frontend/src/features/businesses/BusinessDetailDrawer.tsx`):
     - Live Business Analytics (`GET /api/v1/businesses/{id}/analytics`) with reactive date filtering.
     - Interactive NFC vs QR Donut chart and total/active card counters.
     - Inline edit form (`PATCH /api/v1/businesses/{id}`) with URL validation and TanStack Query cache invalidation.
  6. Implemented `DestinationDetailDrawer` (`frontend/src/features/destinations/DestinationDetailDrawer.tsx`):
     - Destination summary & clickout link tester.
     - Inline edit form (`PATCH /api/v1/destinations/{id}`) with strict scheme validation (`http`/`https`), type selector, and status toggle.
  7. Implemented `CardDetailDrawer` (`frontend/src/features/cards/CardDetailDrawer.tsx`):
     - Card code badge, NFC/QR URLs, and dynamic QR image preview.
     - Card-level analytics (`GET /api/v1/cards/{id}/analytics`) with date filtering and Recharts chart.
     - Target destination reassignment selector and status toggle mutation.
  8. Integrated drawers seamlessly across `BusinessesView`, `DestinationsView`, and `CardsView` (row click and dedicated action button triggers).
  9. Expanded bilingual translations in `frontend/src/i18n/translations.ts` for all new analytics, date presets, and drawer features.
  10. Created dedicated integration test suite `test_phase_13_2_2.py` verifying date range filtering, business editing, destination editing, dynamic NFC redirection, and negative validation rejections (10/10 tests passed).
- **Files Created:**
  - `frontend/src/components/ui/Drawer.tsx`
  - `frontend/src/components/analytics/DateRangeFilter.tsx`
  - `frontend/src/components/analytics/AnalyticsCharts.tsx`
  - `frontend/src/features/businesses/BusinessDetailDrawer.tsx`
  - `frontend/src/features/destinations/DestinationDetailDrawer.tsx`
  - `frontend/src/features/cards/CardDetailDrawer.tsx`
  - `test_phase_13_2_2.py`
- **Files Modified:**
  - `frontend/package.json`
  - `frontend/src/i18n/translations.ts`
  - `frontend/src/features/businesses/BusinessesView.tsx`
  - `frontend/src/features/destinations/DestinationsView.tsx`
  - `frontend/src/features/cards/CardsView.tsx`
  - `NFC_MASTER_PROJECT_CONTEXT.md`
  - `NFC_MVP_SNAPSHOTS.md`
- **Frontend Build Verification:** **PASS** (`npm run build` executed in 6.14s with 0 errors).
- **Backend Test Results:** **60 / 60 PASSED** in 10.33s across all 10 test modules.
- **E2E Results:** **ALL 13 VERIFICATIONS PASSED**.
- **Live Integration Results:** **ALL 20 VERIFICATIONS PASSED** (`test_live_integration.py` 10/10, `test_phase_13_2_2.py` 10/10).
- **Backend Changes:** **BACKEND CHANGES: NONE** (Zero modifications to backend APIs, models, migrations, or database).
- **Docker / Port Isolation Status:**
  - Port `8000`: Dessert (Untouched & Active)
  - Port `8001`: MegaMeals (Untouched & Active)
  - Port `8202`: Trading AI MVP (Untouched & Active)
  - Port `8300`: NFC MVP (`nfc-mvp-app-1` active & responding)
  - PostgreSQL & Redis: Strictly internal to `nfc-mvp` bridge network (zero host ports).
- **Git Branch & HEAD Status:** Branch `feature/mvp-foundation`, HEAD `bb389961f6c4b336ba89b3a8edbbe60e2901db61`. Zero commits, pushes, merges, or branch creations.

## Phase 13.3 — Pre-Implementation Snapshot

- **Pre-Modification Date/Time:** 2026-08-28T04:47:00+03:30
- **Git Branch:** `feature/mvp-foundation`
- **Git HEAD Commit:** `bb389961f6c4b336ba89b3a8edbbe60e2901db61`
- **Baseline Pytest:** **60 / 60 PASSED** in 11.36s across all 10 test modules
- **Baseline E2E:** **ALL 13 VERIFICATIONS PASSED**
- **Baseline Live Integration:** **10 / 10 VERIFICATIONS PASSED** (`test_live_integration.py`)
- **Baseline Phase 13.2.2:** **10 / 10 VERIFICATIONS PASSED** (`test_phase_13_2_2.py`)
- **Docker Isolation Status:**
  - Port `8000`: Dessert (`deserkhoone-backend-1` / `deserkhoone_app-backend-run-...`) — Untouched & Active
  - Port `8001`: MegaMeals (`megameals_app-backend-1`) — Untouched & Active
  - Port `8202`: Trading AI MVP (`trading-ai-mvp`) — Untouched & Active
  - Port `8300`: NFC MVP (`nfc-mvp-app-1`) — Active & Operational
  - PostgreSQL & Redis: Strictly internal to `nfc-mvp` Docker bridge network (no host ports mapped).
- **Authorized Phase 13.3 Scope:** Order-Based Card Provisioning & Product Template Foundation:
  1. Product Types: Officially establish `NFC_ONLY` and `NFC_QR`.
  2. Physical Template Foundation: `NFC_ONLY_TEMPLATE` and `NFC_QR_TEMPLATE`.
  3. Post-Sale Order Domain Model: `Order` entity with `order_number`, `business_id`, `destination_id`, `product_type`, `quantity`, `status` (`CREATED`, `CARDS_GENERATED`, `PROVISIONING`, `QC_PENDING`, `COMPLETED`, `CANCELLED`).
  4. Card Relationship: Add nullable `order_id` foreign key on `cards` table.
  5. Post-Sale Card Generation: Idempotent bulk creation of exact requested card quantity linked to originating Order.
  6. Conditional Workflows: NFC provisioning for all; QR generation & QR QC only when `product_type == NFC_QR`.
  7. Alembic Migration: Safe additive migration `003_add_orders_and_card_order_id.py`.
  8. API Endpoints: `GET /api/v1/orders`, `POST /api/v1/orders`, `GET /api/v1/orders/{id}`, `PATCH /api/v1/orders/{id}`, `POST /api/v1/orders/{id}/generate-cards`, `GET /api/v1/orders/{id}/cards`.
  9. Frontend Operator Interface: `OrdersView.tsx`, `CreateOrderModal`, `OrderDetailDrawer.tsx`, sidebar navigation, and bilingual Persian/English translations.
  10. Verification: Create `test_phase_13_3.py` and run full regression suite.
- **Git Actions Restrictions:** Zero commits, zero pushes, zero merges, zero rebases, zero branch creations.

## Phase 13.3 — Completion Snapshot

- **Completion Date/Time:** 2026-08-28T05:00:00+03:30
- **Scope Completed:**
  1. Officially established two physical product types: `NFC_ONLY` (NFC chip only, no QR on card) and `NFC_QR` (hybrid NFC + dedicated dynamic QR code space).
  2. Established physical template constants: `NFC_ONLY_TEMPLATE` and `NFC_QR_TEMPLATE`.
  3. Implemented `Order` model with human-readable `order_number` (`ORD-YYYYMMDD-XXXX`), `business_id`, `destination_id`, `product_type`, `quantity`, `status` (`CREATED`, `CARDS_GENERATED`, `PROVISIONING`, `QC_PENDING`, `COMPLETED`, `CANCELLED`).
  4. Added nullable `order_id` foreign key and index on `cards` table, maintaining 100% backward compatibility for pre-existing cards.
  5. Created and applied Alembic migration `003_add_orders_and_card_order_id.py`.
  6. Implemented post-sale idempotent card generation: generates exact requested card count (`order.quantity`), links cards to order, business, and destination, and guarantees zero duplicate cards on repeat requests.
  7. Implemented backend Order API endpoints:
     - `POST /api/v1/orders` (Status 201)
     - `GET /api/v1/orders` (with search, status, and business filtering)
     - `GET /api/v1/orders/{id}` (detailed metadata)
     - `PATCH /api/v1/orders/{id}` (status lifecycle transitions)
     - `POST /api/v1/orders/{id}/generate-cards` (idempotent generation)
     - `GET /api/v1/orders/{id}/cards` (provisioning list)
  8. Implemented Frontend Operator Interface:
     - `OrdersView.tsx`: Orders table with product badges, template labels, search/filter, and Create Order modal.
     - `OrderDetailDrawer.tsx`: Slide-over workbench with order overview, "Generate Cards" action button with count verification, and card-by-card NFC/QR provisioning controls.
     - Updated `Sidebar.tsx` and `App.tsx` with `/orders` route.
     - Expanded bilingual translations in `translations.ts` for Persian RTL and English LTR.
  9. Created dedicated verification test suite `test_phase_13_3.py` (8/8 workflow tests passed).
- **Files Created:**
  - `migrations/versions/003_add_orders_and_card_order_id.py`
  - `frontend/src/features/orders/OrdersView.tsx`
  - `frontend/src/features/orders/OrderDetailDrawer.tsx`
  - `test_phase_13_3.py`
- **Files Modified:**
  - `app/models/models.py`
  - `app/schemas/schemas.py`
  - `app/services/service.py`
  - `app/api/internal/routes.py`
  - `app/utils/code_generator.py`
  - `frontend/src/types/api.ts`
  - `frontend/src/services/apiClient.ts`
  - `frontend/src/i18n/translations.ts`
  - `frontend/src/components/layout/Sidebar.tsx`
  - `frontend/src/App.tsx`
  - `NFC_MASTER_PROJECT_CONTEXT.md`
  - `NFC_MVP_SNAPSHOTS.md`
- **Frontend Build Verification:** **PASS** (`npm run build` executed in 8.21s with 0 errors).
- **Backend Test Results:** **60 / 60 PASSED** in 12.35s across all 10 test modules.
- **E2E Results:** **ALL 13 VERIFICATIONS PASSED**.
- **Live Integration Results:** **ALL 28 VERIFICATIONS PASSED** (`test_live_integration.py` 10/10, `test_phase_13_2_2.py` 10/10, `test_phase_13_3.py` 8/8).
- **Docker / Port Isolation Status:**
  - Port `8000`: Dessert (Untouched & Active)
  - Port `8001`: MegaMeals (Untouched & Active)
  - Port `8202`: Trading AI MVP (Untouched & Active)
  - Port `8300`: NFC MVP (`nfc-mvp-app-1` active & responding)
  - PostgreSQL & Redis: Strictly internal to `nfc-mvp` bridge network (zero host ports).
- **Git Branch & HEAD Status:** Branch `feature/mvp-foundation`, HEAD `bb389961f6c4b336ba89b3a8edbbe60e2901db61`. Zero commits, pushes, merges, or branch creations.

## Phase 13.4 — Pre-Implementation Snapshot

- **Timestamp:** 2026-08-28T05:12:00+03:30
- **Current Branch:** `feature/mvp-foundation`
- **Current HEAD:** `bb389961f6c4b336ba89b3a8edbbe60e2901db61`
- **Baseline Pytest:** **60 / 60 PASSED** across all 10 test modules
- **Baseline E2E:** **ALL 13 VERIFICATIONS PASSED**
- **Baseline Live Integration:** **10 / 10 VERIFICATIONS PASSED** (`test_live_integration.py`)
- **Baseline Phase 13.2.2:** **10 / 10 VERIFICATIONS PASSED** (`test_phase_13_2_2.py`)
- **Baseline Phase 13.3:** **8 / 8 VERIFICATIONS PASSED** (`test_phase_13_3.py`)
- **Docker Isolation Status:**
  - Port `8000`: Dessert (`deserkhoone-backend-1` / `deserkhoone_app-backend-run-...`) — Untouched & Active
  - Port `8001`: MegaMeals (`megameals_app-backend-1`) — Untouched & Active
  - Port `8202`: Trading AI MVP (`trading-ai-mvp`) — Untouched & Active
  - Port `8300`: NFC MVP (`nfc-mvp-app-1`) — Active & Operational
  - PostgreSQL & Redis: Strictly internal to `nfc-mvp` Docker bridge network (no host ports mapped).
- **Authorized Phase 13.4 Scope:** Batch Exports, QR Label Preparation & Order Packaging Reconciliation:
  1. Batch CSV Exports:
     - Full order cards export (`/api/v1/orders/{id}/export/cards.csv`)
     - Dedicated NFC provisioning export (`/api/v1/orders/{id}/export/nfc.csv`)
     - Dedicated QR provisioning export (`/api/v1/orders/{id}/export/qr.csv`) for `NFC_QR` orders only (rejected/N/A for `NFC_ONLY`)
     - Persian/UTF-8 BOM support and strict order isolation.
  2. QR Label Preparation:
     - QR label payload endpoint (`/api/v1/orders/{id}/qr-labels`) with deterministic ordering.
     - Browser-printable, hardware-neutral QR label sheet modal with print CSS.
     - Traceable card-to-QR association (no printer hardware drivers).
  3. Packaging Reconciliation & Delivery Readiness Engine:
     - Reconciliation calculation endpoint (`/api/v1/orders/{id}/reconciliation`) using real database state.
     - Delivery readiness logic (READY vs NOT READY) with explicit blocking reasons.
     - Product-specific rules (`NFC_ONLY` does not block on QR; `NFC_QR` requires QR QC).
  4. Final Completion Gate:
     - Protect order status transition to `COMPLETED`: reject incomplete orders with HTTP 422 and allow fully reconciled orders.
  5. Operator Frontend Interface:
     - Expand `OrderDetailDrawer.tsx` with dedicated tabs/sections for Overview, Reconciliation & Delivery Readiness, Batch CSV Exports, and QR Label Sheet.
     - Maintain Persian RTL layout with English LTR parity.
  6. Verification:
     - Create `test_phase_13_4.py` (10 workflow tests) and run full regression suite.
- **Git Actions Restrictions:** Zero commits, zero pushes, zero merges, zero rebases, zero branch creations.

## Phase 13.4 — Completion Snapshot

- **Completion Date/Time:** 2026-08-28T05:20:00+03:30
- **Scope Completed:**
  1. Implemented Batch CSV Exports:
     - Full order cards export (`GET /api/v1/orders/{id}/export/cards.csv`) with all card metadata and QC indicators.
     - Dedicated NFC provisioning export (`GET /api/v1/orders/{id}/export/nfc.csv`) for hardware chip writers.
     - Dedicated QR provisioning export (`GET /api/v1/orders/{id}/export/qr.csv`) for `NFC_QR` orders (correctly rejected with HTTP 422 for `NFC_ONLY`).
     - UTF-8 BOM encoding (`\ufeff`) for Microsoft Excel & Persian typography compatibility, proper escaping, and strict order scoping.
  2. Implemented Hardware-Neutral QR Label Preparation:
     - Structured label payload endpoint (`GET /api/v1/orders/{id}/qr-labels`) with deterministic sequence ordering.
     - Browser-printable, hardware-neutral `QRLabelSheetModal.tsx` supporting native browser print (`window.print()`) with print-optimized CSS rules (`@media print`, page breaks, uncluttered label grid).
     - Traceable card-to-QR mapping with zero proprietary printer drivers.
  3. Implemented Packaging Reconciliation & Delivery Readiness Engine:
     - Real database state calculation endpoint (`GET /api/v1/orders/{id}/reconciliation`).
     - Delivery readiness logic (`is_ready_for_delivery`: True / False) with detailed blocking reasons.
     - Product-specific rules: `NFC_ONLY` requires only NFC QC and destination verification (QR is N/A and does not block delivery); `NFC_QR` requires NFC QC, QR QC, and destination verification.
  4. Implemented Completion Gate:
     - Validated in `update_order_status`: attempts to mark an incomplete order as `COMPLETED` are rejected with HTTP 422 and a detailed list of missing requirements. Fully reconciled orders are permitted to complete.
  5. Operator Frontend Interface:
     - Updated `OrderDetailDrawer.tsx` with dedicated sections for Packaging Reconciliation & Delivery Readiness, Batch CSV Exports, and QR Label Sheet trigger.
     - Created `QRLabelSheetModal.tsx` for printable label sheets.
     - Expanded `translations.ts` with complete Persian and English parity.
  6. Dedicated Verification Suite:
     - Created and executed `test_phase_13_4.py` (10/10 workflow tests passed).
- **Files Created:**
  - `frontend/src/features/orders/QRLabelSheetModal.tsx`
  - `test_phase_13_4.py`
- **Files Modified:**
  - `app/schemas/schemas.py`
  - `app/services/service.py`
  - `app/api/internal/routes.py`
  - `frontend/src/types/api.ts`
  - `frontend/src/services/apiClient.ts`
  - `frontend/src/i18n/translations.ts`
  - `frontend/src/features/orders/OrderDetailDrawer.tsx`
  - `test_phase_13_3.py`
  - `NFC_MASTER_PROJECT_CONTEXT.md`
  - `NFC_MVP_SNAPSHOTS.md`
- **Frontend Build Verification:** **PASS** (`npm run build` executed in 7.47s with 0 errors).
- **Backend Test Results:** **60 / 60 PASSED** in 12.35s across all 10 test modules.
- **E2E Results:** **ALL 13 VERIFICATIONS PASSED**.
- **Live Integration Results:** **ALL 38 VERIFICATIONS PASSED** (`test_live_integration.py` 10/10, `test_phase_13_2_2.py` 10/10, `test_phase_13_3.py` 8/8, `test_phase_13_4.py` 10/10).
- **Docker / Port Isolation Status:**
  - Port `8000`: Dessert (Untouched & Active)
  - Port `8001`: MegaMeals (Untouched & Active)
  - Port `8202`: Trading AI MVP (Untouched & Active)
  - Port `8300`: NFC MVP (`nfc-mvp-app-1` active & responding)
  - PostgreSQL & Redis: Strictly internal to `nfc-mvp` bridge network (zero host ports).
- **Git Branch & HEAD Status:** Branch `feature/mvp-foundation`, HEAD `bb389961f6c4b336ba89b3a8edbbe60e2901db61`. Zero commits, pushes, merges, or branch creations.

## Phase 14 — Pre-Implementation Snapshot

- **Timestamp:** 2026-08-28T05:32:00+03:30
- **Current Branch:** `feature/mvp-foundation`
- **Current HEAD:** `bb389961f6c4b336ba89b3a8edbbe60e2901db61`
- **Baseline Pytest:** **60 / 60 PASSED** in 12.35s across all 10 test modules
- **Baseline E2E:** **ALL 13 VERIFICATIONS PASSED**
- **Baseline Live Integration:** **10 / 10 VERIFICATIONS PASSED** (`test_live_integration.py`)
- **Baseline Phase 13.2.2:** **10 / 10 VERIFICATIONS PASSED** (`test_phase_13_2_2.py`)
- **Baseline Phase 13.3:** **8 / 8 VERIFICATIONS PASSED** (`test_phase_13_3.py`)
- **Baseline Phase 13.4:** **10 / 10 VERIFICATIONS PASSED** (`test_phase_13_4.py`)
- **Total Integration Baseline:** **38 / 38 VERIFICATIONS PASSED**
- **Docker Isolation Status:**
  - Port `8000`: Dessert (`deserkhoone-backend-1` / `deserkhoone_app-backend-run-...`) — Untouched & Active
  - Port `8001`: MegaMeals (`megameals_app-backend-1`) — Untouched & Active
  - Port `8202`: Trading AI MVP (`trading-ai-mvp`) — Untouched & Active
  - Port `8300`: NFC MVP (`nfc-mvp-app-1`) — Active & Operational
  - PostgreSQL & Redis: Strictly internal to `nfc-mvp` Docker bridge network (no host ports mapped).
- **Authorized Phase 14 Scope:** Comprehensive Audit, Stabilization & Production Readiness Packaging:
  1. Deep Technical & Architectural Audit across all backend services, FastAPI routes, and domain models.
  2. Security & Hardening Audit (API key validation, CORS policies, SQL injection protection via SQLAlchemy ORM parameterized queries, open redirect validation, XSS prevention, Redis rate limiter fail-open reliability).
  3. Database & Schema Migration Verification (Alembic versions 001, 002, 003, indexes, referential integrity).
  4. Frontend UI/UX, Typography, and RTL Audit (Vazirmatn font loading, Vite production bundle optimization, TypeScript strict adherence, translation parity).
  5. Infrastructure & Environment Packaging (Production `.env.example`, Docker Compose isolation, port bindings, resource allocations).
  6. Documentation Reconciliation (`README.md`, `docs/ARCHITECTURE.md`, `NFC_MASTER_PROJECT_CONTEXT.md`).
  7. Verification: Run complete regression suite and produce comprehensive Phase 14 audit & readiness report.
- **Git Actions Restrictions:** Zero commits, zero pushes, zero merges, zero rebases, zero branch creations.

## Phase 14 — Completion Snapshot

- **Completion Date/Time:** 2026-08-28T05:40:00+03:30
- **Scope Completed:**
  1. Comprehensive Architectural & Code Quality Audit across FastAPI routers, async service layer, and SQLAlchemy domain models.
  2. Security & Hardening Audit:
     - Management API protection via `X-API-Key` dependency injection.
     - Public redirect endpoints rate-limited (60 req/min/IP) with fail-open Redis reliability.
     - Strict URL scheme & domain validation for open-redirect and script injection prevention.
     - `X-Request-ID` correlation middleware verified.
  3. Database & Migration Verification:
     - Alembic migrations verified at `003_add_orders_and_card_order_id (head)`.
     - 5 normalized entities (`Business`, `Destination`, `Order`, `Card`, `Event`) with cascade constraints and composite indexes.
  4. Frontend UI/UX, Typography, and Production Packaging:
     - Persian typography via Vazirmatn font.
     - Complete Persian RTL layout with English LTR translation parity.
     - Vite production bundle verified (`dist/assets/index-CJlAzZqH.js 719.38 kB`, build time 7.48s).
     - Created `frontend/.env.example`.
  5. Operational Runbooks & Documentation Reconciliation:
     - Updated `README.md` with complete API catalog (including Orders, Reconciliation, Batch Exports, QR Labels) and test instructions.
     - Updated `docs/ARCHITECTURE.md` with full 5-entity domain model and traffic flows.
     - Synchronized `NFC_MASTER_PROJECT_CONTEXT.md`.
  6. Automated Test Suite Expansion:
     - Added comprehensive pytest unit tests for Order lifecycle, reconciliation, batch CSV exports, and QR label sheets in `tests/test_internal.py`.
     - Full Pytest suite expanded to **62 / 62 PASSED** (100%).
     - E2E Verification Suite: **13 / 13 PASSED** (100%).
     - Live Integration Suites: **38 / 38 PASSED** (100%).
- **Files Created:**
  - `frontend/.env.example`
- **Files Modified:**
  - `tests/test_internal.py`
  - `README.md`
  - `docs/ARCHITECTURE.md`
  - `NFC_MASTER_PROJECT_CONTEXT.md`
  - `NFC_MVP_SNAPSHOTS.md`
- **Backend Test Results:** **62 / 62 PASSED** in 13.39s across all 10 test modules.
- **E2E Results:** **ALL 13 VERIFICATIONS PASSED**.
- **Live Integration Results:** **ALL 38 VERIFICATIONS PASSED** (`test_live_integration.py` 10/10, `test_phase_13_2_2.py` 10/10, `test_phase_13_3.py` 8/8, `test_phase_13_4.py` 10/10).
- **Frontend Production Build:** **PASS** in 7.48s (`dist/assets/index-CJlAzZqH.js 719.38 kB`).
- **Docker / Port Isolation Status:**
  - Port `8000`: Dessert (Untouched & Active)
  - Port `8001`: MegaMeals (Untouched & Active)
  - Port `8202`: Trading AI MVP (Untouched & Active)
  - Port `8300`: NFC MVP (`nfc-mvp-app-1` active & responding)
  - PostgreSQL & Redis: Strictly internal to `nfc-mvp` bridge network (zero host ports).
- **Git Branch & HEAD Status:** Branch `feature/mvp-foundation`, HEAD `bb389961f6c4b336ba89b3a8edbbe60e2901db61`. Zero commits, pushes, merges, or branch creations.

## Future Snapshot Protocol

1. Before modification: append a `Pre-Phase-X Snapshot` section here.
2. Run and record baseline tests and E2E before changing code.
3. Record Docker/port isolation and Git state.
4. Implement only the approved scope.
5. After completion: append a `Phase-X Completion Snapshot`.
6. Never create another central snapshot file unless explicitly authorized.
7. Never overwrite historical snapshots; append new sections only.
8. If the file is missing from the repository, STOP rather than inventing a replacement snapshot mechanism.

## Phase 15 — Pre-Implementation Snapshot

- **Timestamp:** 2026-08-28T06:51:00+03:30
- **Phase:** Phase 15
- **Step:** Pre-Implementation Baseline
- **Git Branch:** feature/mvp-foundation
- **Git HEAD Commit:** bb389961f6c4b336ba89b3a8edbbe60e2901db61
- **Git Working Tree Status:** Modified (.env.example, README.md, app routes, config, main, models, schemas, service, utils, compose, ARCHITECTURE, reqs, tests), Untracked (NFC folder, contexts, e2e scripts, frontend, migrations).
- **Baseline Pytest:** **62 / 62 PASSED**
- **Baseline E2E:** **13 / 13 PASSED**
- **Baseline Live Integration:** **10 / 10 PASSED**
- **Baseline Phase 13.2.2:** **10 / 10 PASSED**
- **Baseline Phase 13.3:** **8 / 8 PASSED**
- **Baseline Phase 13.4:** **10 / 10 PASSED**
- **Total Dedicated/Live Integration:** **38 / 38 PASSED**
- **Frontend Build Status:** **PASS** (completed without errors)
- **Health Status:** HTTP 200 OK ({"status":"ok","service":"nfc-review-platform","version":"0.1.0"})
- **Ready Status:** HTTP 200 OK ({"status":"ready"})
- **Alembic Migration State:** 003_add_orders_and_card_order_id (head)
- **Docker Isolation Status:**
  - Port 8000: Dessert (Untouched & Active)
  - Port 8001: MegaMeals (Untouched & Active)
  - Port 8202: Trading AI MVP (Untouched & Active)
  - Port 8300: NFC MVP (nfc-mvp-app-1, Active)
  - PostgreSQL & Redis: Internal to NFC MVP bridge network only.

## Phase 15 — Step 2 UAT & Release Control Design Snapshot

- **Timestamp:** 2026-08-28T07:00:00+03:30
- **Phase:** Phase 15
- **Step:** Step 2 (User Acceptance Workflow & Release Control Design)
- **Scope Completed:**
  1. Derived and documented real UAT workflows for `NFC_ONLY` and `NFC_QR` orders based on the actual verified backend implementation.
  2. Designed Negative UAT Scenarios (e.g., attempting to complete incomplete orders, unauthorized access, invalid destinations).
  3. Formally defined the Release Control Model (GO, CONDITIONAL GO, NO-GO).
  4. Created Production Release Checklist (Pre-Deployment, Deployment Sequence, Smoke Tests, and Rollback Criteria).
  5. Extracted clear human decisions required before production launch (DNS, TLS, Backups, Final Approval).
  6. Consolidated all designs into `docs/PHASE_15_UAT_AND_RELEASE_CONTROL.md`.
- **Files Created:**
  - `docs/PHASE_15_UAT_AND_RELEASE_CONTROL.md`
- **Files Modified:**
  - `NFC_MVP_SNAPSHOTS.md`
- **Actions Explicitly Avoided:**
  - Did NOT deploy to production.
  - Did NOT modify production infrastructure.
  - Did NOT alter backend or frontend business logic.
  - Did NOT expose secrets or modify Git history.
- **Verification:** Verified that the UAT workflows accurately mirror the Completion Gate logic implemented in Phase 13.4, specifically regarding QR QC applicability.

## Phase 15 — Step 3 Local Product & Online Shop Discovery Snapshot

- **Timestamp:** 2026-08-28T07:35:00+03:30
- **Phase:** Phase 15
- **Step:** Step 3 (Discovery & Architecture Planning)
- **Scope Completed:**
  1. Audited existing Backend Models, API boundaries, and Frontend Architecture for e-commerce feasibility.
  2. Drafted Online Shop architecture, integrating public storefront with the existing backend Order generation logic.
  3. Performed Gap Analysis (Customer Info, Checkout Flow, Cart, Payment Logic).
  4. Proposed Mock Payment adapter for Localhost presentation.
  5. Consolidated all findings into `docs/PHASE_15_STEP_3_LOCAL_PRODUCT_AND_SHOP_DISCOVERY.md`.
- **Files Created:**
  - `docs/PHASE_15_STEP_3_LOCAL_PRODUCT_AND_SHOP_DISCOVERY.md`
- **Files Modified:**
  - `NFC_MVP_SNAPSHOTS.md`
- **Git State:** 
  - Branch: `feature/mvp-foundation`
  - HEAD: `bb389961f6c4b336ba89b3a8edbbe60e2901db61`
- **Actions Explicitly Avoided:**
  - Did NOT begin full Online Shop implementation.
  - Did NOT deploy to production.
  - Did NOT create or modify Database Tables.
  - Did NOT modify the frontend application structure.
  - Did NOT expose real secrets or payment configurations.

## Phase 15 — Steps 3B–3G Multi-Item Online Shop Implementation Snapshot

- **Timestamp:** 2026-08-28T08:10:00+03:30
- **Phase:** Phase 15
- **Step:** Steps 3B–3G (Multi-Item Online Shop, Cart, Checkout, Mock Payment & Verification)
- **Scope Completed:**
  1. Reconciled Master Multi-Item Architecture and drafted `docs/PHASE_15_MULTI_ITEM_SHOP_ARCHITECTURE.md`.
  2. Implemented database schema extension (`ShopOrder`, `ShopOrderItem`, `PaymentStatus`, `ShopOrderStatus`, `DestinationType.PENDING_SETUP`) via Alembic migration `004_add_shop_orders`.
  3. Created Public Shop API routes (`/api/v1/public/shop/products`, `/api/v1/public/shop/checkout`, `/api/v1/public/shop/orders/{num}`) with rate limiting and URL validation.
  4. Implemented React Public Storefront:
     - `ShopShell`: Public header, footer, cart badge, language switcher.
     - `CartContext`: LocalStorage-persisted multi-item cart state.
     - `ShopCatalog`: Product cards, features, interactive configuration modal with Destination-Now vs. Destination-Later modes.
     - `CartView`: Item review, quantity steppers, destination pills, subtotal calculation.
     - `CheckoutView`: Customer contact info, shipping address, order review, mock payment simulator.
     - `OrderSuccessView`: Printable receipt with payment reference and factory fulfillment order linkage.
  5. Updated Admin Sidebar with Public Storefront navigation link.
  6. Verified complete test matrix:
     - Pytest: 67 / 67 PASSED (including 5 new public shop unit/API tests)
     - E2E Verification: 13 / 13 PASSED
     - Live Integration Suites (Proxy, 13.2.2, 13.3, 13.4, 15 Shop): 48 / 48 PASSED
     - Frontend Production Build: PASSED
- **Database Revision:** `004_add_shop_orders (head)`
- **Port & Docker Isolation:** Port 8300 active; ports 8000, 8001, 8202 untouched.
- **Git State:** Branch: `feature/mvp-foundation`, HEAD: `bb389961f6c4b336ba89b3a8edbbe60e2901db61`. No commits or pushes performed.
- **Actions Explicitly Avoided:**
  - Did NOT deploy to production (`tapnow.ir`).
  - Did NOT configure public DNS or TLS certificates.
  - Did NOT push or commit to Git.
  - Did NOT break or modify existing factory order lifecycle or provisioning engine.

## Phase 15 — Step 4 Localhost Visual Review & Human UAT Snapshot

- **Timestamp:** 2026-08-28T08:25:00+03:30
- **Phase:** Phase 15
- **Step:** Step 4 (Localhost Visual Review, Product Experience & Human UAT)
- **Scope Completed:**
  1. Performed Baseline Verification: Verified branch `feature/mvp-foundation`, HEAD `bb389961f6c4b336ba89b3a8edbbe60e2901db61`, Docker port isolation on 8300, `/health` and `/ready` 200 OK, and Alembic `004_add_shop_orders (head)`.
  2. Conducted Visual Route Inventory & mapped complete customer-to-factory journey.
  3. Executed comprehensive Customer Experience Audit (Storefront, Product Hierarchy, Pricing in Toman, Destination Mode Now vs. Later, Cart Steppers, Checkout, and Success Receipt).
  4. Audited Destination-Later physical card architecture (`https://tapnow.ir/setup` placeholder, stable redirection payload, QC completion gate enforcement).
  5. Formulated recommendations for Customer Self-Service Destination Setup vs. Admin-Assisted Workflow.
  6. Generated the Human UAT Checklist document: `docs/PHASE_15_STEP_4_LOCALHOST_VISUAL_UAT.md`.
  7. Categorized future product enhancements (MUST HAVE, SHOULD HAVE, NICE TO HAVE, DEFER) and defined Human Decisions A–E.
- **Files Created:**
  - `docs/PHASE_15_STEP_4_LOCALHOST_VISUAL_UAT.md`
- **Files Modified:**
  - `NFC_MVP_SNAPSHOTS.md`
- **Tests Verified:**
  - Pytest: 67 / 67 PASSED
  - E2E Verification: 13 / 13 PASSED
  - Dedicated Integration Suites: 48 / 48 PASSED
  - Frontend Production Build: PASSED
- **Actions Explicitly Avoided:**
  - Did NOT deploy to production (`tapnow.ir`).
  - Did NOT modify public DNS or TLS configurations.
  - Did NOT integrate live banking credentials.
  - Did NOT commit, push, merge, or rebase Git branches.
- **Human Decisions Pending:** Decisions A (Product Catalog & Pricing), B (Card Customization / Logo Upload), C (Google Review Setup Workflow), D (Customer Accounts vs Guest Checkout), E (Next Phase Direction).

## Phase 15 — Step 5 Customer Lifecycle Completion Snapshot

- **Timestamp:** 2026-08-28T08:45:00+03:30
- **Phase:** Phase 15
- **Step:** Step 5 (Customer Lifecycle Completion: Secure Public Tracking, Secure Self-Service Activation & Limited Customization MVP)
- **Scope Completed:**
  1. Implemented Secure Public Order Tracking (`POST /api/v1/public/shop/orders/track` & `/shop/track`):
     - Requires 2-factor contact verification (Order Number + Normalized Phone or Email).
     - Uniform error handling to prevent order enumeration attacks.
     - Public data masking for recipient name and delivery street address.
     - Visual milestone timeline (Order Placed -> Factory Production -> Hardware QC -> Dispatched).
  2. Implemented Secure Self-Service Card Activation (`POST /api/v1/public/activation/verify`, `POST /api/v1/public/activation/configure` & `/activate` / `/activate/:code`):
     - Ownership proof (Card Code + Order Number + Contact proof) generates a cryptographically secure, 15-minute single-use activation token (`act_tok_...`).
     - Safe destination configuration supporting Google Review, Instagram, WhatsApp, Website, and Custom URLs.
     - Preserved 100% immutable physical NFC and QR redirection codes (`/n/{code}`, `/q/{code}`) without requiring tag rewriting or reprinting.
  3. Implemented Limited Card Customization MVP:
     - Logo Upload Pipeline with file size limit (2MB), MIME validation (`image/png`, `image/jpeg`), and Pillow binary header validation.
     - Brand primary color picker with HEX format validation and preset swatches.
     - Predefined card templates (`classic`, `modern`, `minimal`).
     - Live interactive SVG card mockup preview rendered directly in the Storefront modal.
  4. Executed Alembic migration `005_customization_activations (head)` creating `card_activation_sessions` table and adding customization columns to `shop_order_items`.
  5. Built and verified Frontend Production Bundle (`npm run build` passed in 8.02s).
  6. Verified comprehensive automated test matrix:
     - Pytest suite: 71 / 71 PASSED
     - E2E core suite: 13 / 13 PASSED
     - Dedicated live integration suites: 58 / 58 PASSED
- **Database Revision:** `005_customization_activations (head)`
- **Port & Docker Isolation:** Port 8300 active; ports 8000 (Dessert), 8001 (MegaMeals), 8202 (Trading AI MVP) completely untouched.
- **Git State:** Branch: `feature/mvp-foundation`, HEAD: `bb389961f6c4b336ba89b3a8edbbe60e2901db61`. No commits or pushes performed.
- **Actions Explicitly Avoided:**
  - Did NOT deploy to production (`tapnow.ir`).
  - Did NOT configure public DNS or TLS certificates.
  - Did NOT push or commit to Git.
  - Did NOT break or modify existing factory order lifecycle or provisioning engine.
