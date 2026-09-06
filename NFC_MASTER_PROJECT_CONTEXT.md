# NFC Review Platform MVP — Master Project Context

> **Authoritative Consolidated Current-State Architecture & Specification**  
> **Current Verified Baseline:** Phase 14 Complete (Backend: 62/62 Tests Passing, 13/13 E2E, 38/38 Integration Tests Passed; Full System Audit & Production Readiness Packaging Verified)

---

## 1. Document Purpose

This document provides the authoritative, consolidated **current state** of the NFC Review Platform MVP backend. It serves as the primary technical specification for developers and AI agents working on this codebase.

### Role Separation
- **`NFC_MASTER_PROJECT_CONTEXT.md`** (This Document): Authoritative consolidated **current state**, architecture, API catalog, data models, and operational invariants.
- **`NFC_MVP_SNAPSHOTS.md`**: Canonical **chronological milestone history**, historical verification evidence, and append-only snapshot log from Phase 1 through Phase 8+.

Do not replace, delete, rewrite, or create alternative snapshot systems.

---

## 2. Project Identity & MVP Scope

### Project Overview
A high-performance, lightweight redirect and management backend for physical NFC + QR Review Cards. When a customer taps an NFC card or scans a QR code, the system validates the card, logs an immutable interaction event, and issues a 302 redirect to the business's configured review destination (e.g., Google Review page).

### Core Boundaries (Explicitly Out of Scope)
The following capabilities are deliberately **excluded** from the MVP:
- **Frontend Dashboard UI**: The MVP is strictly an API-first backend.
- **SaaS Multi-Tenancy**: Single-tenant administrative API key model.
- **Location Entity**: Cards link directly to `Business` and `Destination`; no hierarchical location abstraction.
- **JWT / OAuth Authentication**: All management APIs use a centralized `X-API-Key` header.
- **Bulk Operations / CSV Exports**: Standard JSON paginated REST APIs are used.
- **Unnecessary Schema Complexity**: Strict adherence to the 4 core normalized tables.

---

## 3. Current Architecture

```
Physical Card (NFC Tag / QR Code)
             │
             ▼
     Public HTTP Request
   (/n/{code} or /q/{code})
             │
             ▼
      FastAPI Gateway (Port 8300 -> 8000)
             │
   ┌─────────┴─────────┐
   │ Redis Rate Limit  │ (60 req/min/IP, Fail-Open)
   └─────────┬─────────┘
             │
   ┌─────────┴─────────┐
   │ Record Event      │ (PostgreSQL 16 Async via SQLAlchemy/asyncpg)
   └─────────┬─────────┘
             │
             ▼
    HTTP 302 Redirect ────► Destination URL (e.g., Google Review)
```

### Technology Stack
- **Framework:** FastAPI (Python 3.13)
- **Database:** PostgreSQL 16 (internal Docker container)
- **ORM:** SQLAlchemy 2.0 Async + asyncpg
- **Cache & Rate Limiting:** Redis 7 (internal Docker container, fail-open)
- **Migrations:** Alembic
- **Testing:** Pytest (54 automated tests) + HTTPX AsyncClient
- **Containerization:** Docker Compose

---

## 4. Docker & Infrastructure Invariants

### Host Port Allocations
Strict host port segregation must be maintained across unrelated projects on the Windows host:
- **Port `8000`:** Reserved for **Dessert Project** (`deserkhoone-backend-1` / `deserkhoone_app-backend-run-...`) — **MUST REMAIN UNTOUCHED**
- **Port `8001`:** Reserved for **MegaMeals Project** (`megameals_app-backend-1`) — **MUST REMAIN UNTOUCHED**
- **Port `8202`:** Reserved for **Trading AI MVP** (`trading-ai-mvp`) — **MUST REMAIN UNTOUCHED**
- **Port `8300`:** Reserved for **NFC MVP** (`nfc-mvp-app-1`, mapped `8300:8000`)

### Internal-Only Services
- **PostgreSQL (`nfc-mvp-db-1`):** Port `5432/tcp` internal to `nfc-mvp` bridge network (NO published host port).
- **Redis (`nfc-mvp-redis-1`):** Port `6379/tcp` internal to `nfc-mvp` bridge network (NO published host port).

**Invariant:** Unrelated containers must never be stopped, restarted, rebuilt, or pruned.

---

## 5. Security Model

1. **Management API Authentication:**
   All routes under `/api/v1/*` require a valid `X-API-Key` header. Requests with missing or invalid keys return `HTTP 401 Unauthorized`.
2. **Public Boundary Isolation:**
   Public endpoints (`/health`, `/ready`, `/n/{code}`, `/q/{code}`, `/q/{code}/qr.png`) do not require authentication and expose no internal administrative functions or database UUIDs.
3. **Rate Limiting:**
   Public customer redirect endpoints enforce a 60 requests/minute/IP limit via Redis with 60-second TTL key expiration. If Redis is unavailable, the rate limiter **fails open** with a warning log, ensuring zero customer redirect disruption.
4. **URL Scheme Validation:**
   Destination URLs and Business logo URLs are strictly validated using Pydantic validators (`http`/`https` only with valid domain structure) to prevent Open Redirect vulnerabilities, invalid schemes, and JavaScript injection attacks.
5. **Observability & Request Correlation:**
   `X-Request-ID` correlation middleware attaches unique request IDs to every response. Structured logging guarantees no API keys, connection secrets, or database URLs are written to logs.

---

## 6. Core Domain Model

The domain consists of 4 normalized relational entities:

```
┌──────────────┐         ┌──────────────┐
│   Business   │◄───────┐│ Destination  │
└──────┬───────┘        │└──────┬───────┘
       │ 1              │       │ 1
       │                │       │
       │ N              │       │ N
┌──────┴────────────────┴───────┴───────┐
│                 Card                  │
└──────────────────┬────────────────────┘
                   │ 1
                   │
                   │ N
┌──────────────────┴────────────────────┐
│                Event                  │
└───────────────────────────────────────┘
```

### 1. `Business`
- `id` (UUID, Primary Key)
- `name` (String, Indexed)
- `logo_url` (String, Optional)
- `status` (`ACTIVE` | `DISABLED`)
- `created_at`, `updated_at` (Timestamps with Timezone)

### 2. `Destination`
- `id` (UUID, Primary Key)
- `business_id` (UUID, Foreign Key → `businesses.id`, Indexed)
- `type` (String, default `GOOGLE_REVIEW`)
- `url` (String, Validated HTTP/HTTPS)
- `status` (`ACTIVE` | `DISABLED`)
- `created_at`, `updated_at` (Timestamps with Timezone)

### 3. `Card`
- `id` (UUID, Primary Key)
- `business_id` (UUID, Foreign Key → `businesses.id`, Indexed)
- `destination_id` (UUID, Foreign Key → `destinations.id`, Indexed)
- `code` (String, Unique 8-char random alphanumeric, Indexed)
- `status` (`ACTIVE` | `DISABLED`)
- `qc_nfc_tested` (Boolean, default `False`)
- `qc_qr_tested` (Boolean, default `False`)
- `qc_destination_verified` (Boolean, default `False`)
- `created_at`, `updated_at` (Timestamps with Timezone)

### 4. `Event` (Immutable Interaction Log)
- `id` (UUID, Primary Key)
- `card_id` (UUID, Foreign Key → `cards.id`, Indexed)
- `type` (`NFC` | `QR`)
- `user_agent` (String, Optional)
- `ip_address` (String, Optional)
- `referrer` (String, Optional)
- `created_at` (Timestamp with Timezone, Indexed)

---

## 7. Complete Current API Inventory

### Public Endpoints (No Auth Required)
| Method | Route | Description | Response / Behavior |
|---|---|---|---|
| `GET` | `/health` | Liveness health check | `200 OK` (`HealthResponse`) |
| `GET` | `/ready` | Database readiness check | `200 OK` (`{"status": "ready"}`) or `503 Service Unavailable` |
| `GET` | `/n/{card_code}` | NFC tap customer redirect | Records NFC event; returns `302 Found` (or `410 Gone` if disabled, `404` if not found) |
| `GET` | `/q/{card_code}` | QR scan customer redirect | Records QR event; returns `302 Found` (or `410 Gone` if disabled, `404` if not found) |
| `GET` | `/q/{card_code}/qr.png` | Dynamic QR PNG generator | Returns dynamic `image/png` stream |

### Internal Management Endpoints (`/api/v1/*`, Protected by `X-API-Key`)

#### Businesses
| Method | Route | Description | Parameters & Pagination |
|---|---|---|---|
| `POST` | `/api/v1/businesses` | Create business | JSON body (`name`, `logo_url`) → `201 Created` |
| `GET` | `/api/v1/businesses` | List businesses | `search` (ILIKE), `status` (`ACTIVE`/`DISABLED`), `skip`, `limit` (default 50) |
| `GET` | `/api/v1/businesses/{id}` | Get business by ID | Path parameter `id` (UUID) → `200 OK` or `404` |
| `PATCH` | `/api/v1/businesses/{id}` | Update business | JSON body (`name`, `logo_url`, `status`) → `200 OK` |
| `GET` | `/api/v1/businesses/{business_id}/analytics` | Business aggregated analytics | `start_date`, `end_date` → `BusinessAnalyticsResponse` |

#### Destinations
| Method | Route | Description | Parameters & Pagination |
|---|---|---|---|
| `POST` | `/api/v1/destinations` | Create destination | JSON body (`business_id`, `url`, `type`) → `201 Created` |
| `GET` | `/api/v1/destinations` | List destinations | `business_id`, `status`, `type`, `skip`, `limit` (max 100) |
| `GET` | `/api/v1/destinations/{id}` | Get destination by ID | Path parameter `id` (UUID) → `200 OK` or `404` |
| `PATCH` | `/api/v1/destinations/{id}` | Update destination | JSON body (`url`, `type`, `status`) → `200 OK` |

#### Cards
| Method | Route | Description | Parameters & Pagination |
|---|---|---|---|
| `POST` | `/api/v1/cards` | Create card | JSON body (`business_id`, `destination_id`) → `201 Created` |
| `GET` | `/api/v1/cards` | List cards | `business_id`, `destination_id`, `status`, `code`, `search`, `skip`, `limit` |
| `GET` | `/api/v1/cards/{id}` | Get card by ID | Path parameter `id` (UUID) → `200 OK` or `404` |
| `PATCH` | `/api/v1/cards/{id}` | Update card | JSON body (`status`, `destination_id`, QC flags) → `200 OK` |
| `GET` | `/api/v1/cards/{id}/info` | QC & card inspector | Returns business, destination, NFC/QR URLs, last 10 events |
| `GET` | `/api/v1/cards/{id}/events` | Card interaction events | `start_date`, `end_date`, `skip`, `limit` (default 100) |
| `GET` | `/api/v1/cards/{id}/provisioning` | Physical card fulfillment | Returns URLs, nested business/destination, QC flags |
| `GET` | `/api/v1/cards/{id}/analytics` | Card analytics metrics | `start_date`, `end_date` → `AnalyticsResponse` |

#### Dashboard
| Method | Route | Description | Parameters & Pagination |
|---|---|---|---|
| `GET` | `/api/v1/dashboard/overview` | Global totals overview | Returns total/active businesses, cards, and total/NFC/QR events |

---

## 8. Analytics & Date Filtering Model

### 1. Global Overview Analytics (`/api/v1/dashboard/overview`)
Aggregates platform-wide metrics directly in SQL: `total_businesses`, `active_businesses`, `total_cards`, `active_cards`, `total_events`, `nfc_events`, `qr_events`.

### 2. Card-Level Analytics (`/api/v1/cards/{id}/analytics`)
Returns `total`, `nfc`, `qr` event counts and `recent` (up to 20 recent events) for a specific card, with optional date filtering.

### 3. Business-Level Analytics (`/api/v1/businesses/{business_id}/analytics`)
Consolidates metrics across all cards belonging to a business:
- `total`, `nfc`, `qr` event counts
- `total_cards` and `active_cards` counts
- `recent` (latest 20 events across all business cards ordered by `created_at DESC`)
- Strictly isolates and excludes events from other businesses.

### 4. Date Semantics Specification
All date filters (`start_date`, `end_date`) adhere to the following deterministic SQL logic:
- **`start_date` (Inclusive):** Filtered as `Event.created_at >= start_date 00:00:00 UTC`.
- **`end_date` (Calendar Day Inclusive / Half-Open Query):** Filtered as `Event.created_at < (end_date + 1 day) 00:00:00 UTC`.
- **Behavioral Result:** When an operator provides `start_date=2026-08-01` and `end_date=2026-08-05`, all events occurring between `2026-08-01 00:00:00 UTC` and `2026-08-05 23:59:59.999... UTC` are **included**. Events on `2026-08-06 00:00:00 UTC` and later are **excluded**.
- **Validation:** If `start_date > end_date`, the API returns `HTTP 422 Unprocessable Entity`.

---

## 9. Provisioning & Quality Control (QC)

### Card Provisioning Endpoint (`/api/v1/cards/{id}/provisioning`)
Delivers complete fulfillment payloads for hardware card programming and badge printing:
- `card_id` (UUID) & `card_code` (8-character alphanumeric string)
- `nfc_url`: `http://{host}:{port}/n/{code}`
- `qr_url`: `http://{host}:{port}/q/{code}`
- `qr_image_url`: `http://{host}:{port}/q/{code}/qr.png`
- Nested `BusinessResponse` and `DestinationResponse`
- QC status flags

### Quality Control Workflow
Before shipping cards to customers, operators verify and record hardware test results:
- `qc_nfc_tested`: Set to `True` after successful physical NFC tap.
- `qc_qr_tested`: Set to `True` after successful physical QR scan.
- `qc_destination_verified`: Set to `True` after confirming the destination URL redirects correctly.

---

## 10. Search & Filtering Capabilities

| Entity | Filter / Parameter | Match Type | Implementation |
|---|---|---|---|
| **Business** | `search` | Case-insensitive substring | SQL `Business.name.ilike(f"%{search}%")` |
| **Business** | `status` | Exact regex match | Pattern `^(ACTIVE\|DISABLED)$` |
| **Destination** | `business_id` | Exact equality | `Destination.business_id == business_id` |
| **Destination** | `status` | Exact regex match | Pattern `^(ACTIVE\|DISABLED)$` |
| **Destination** | `type` | Exact equality | `Destination.type == dest_type` |
| **Card** | `business_id` | Exact equality | `Card.business_id == business_id` |
| **Card** | `destination_id` | Exact equality | `Card.destination_id == destination_id` |
| **Card** | `status` | Exact regex match | Pattern `^(ACTIVE\|DISABLED)$` |
| **Card** | `code` | Case-insensitive substring | SQL `Card.code.ilike(f"%{code}%")` |
| **Card** | `search` | Case-insensitive substring | SQL `Card.code.ilike(f"%{search}%")` |

| **Order** | `search` | Case-insensitive substring | SQL `Order.order_number.ilike(f"%{search}%")` |
| **Order** | `status` | Exact string match | `Order.status == status` |
| **Order** | `business_id` | Exact equality | `Order.business_id == business_id` |

---

## 11. Current Verification Baseline

- **Automated Backend Test Suite:** **62 / 62 PASSED** across all 10 test modules.
- **End-to-End Test Suite (`e2e_verify.py`):** **ALL 13 VERIFICATIONS PASSED**.
- **Frontend Build & TypeScript Verification:** **PASS** (`npm run build` executed in 7.48s with 0 errors, production bundle verified).
- **Live Frontend ↔ Backend Integration Suites:** **ALL 38 VERIFICATIONS PASSED**
  - `test_live_integration.py`: 10/10 Core Lifecycle Workflows Passed.
  - `test_phase_13_2_2.py`: 10/10 Interactive Analytics & Drawer Workflows Passed.
  - `test_phase_13_3.py`: 8/8 Order-Based Provisioning & Product Template Workflows Passed.
  - `test_phase_13_4.py`: 10/10 Batch Exports, QR Label Sheet, Reconciliation & Completion Gate Workflows Passed.
- **Live Container Verification:** Verified against `http://localhost:8300` and `http://127.0.0.1:5173`.

*Note: Test counts reflect the verified baseline through Phase 14 and will naturally expand in future authorized implementation phases.*

---

## 12. Database & Migration Status

- **Migration Tool:** Alembic (`alembic.ini`, `migrations/`).
- **Applied Versions:**
  - `001_initial_schema`: Base tables (`businesses`, `destinations`, `cards`, `events`).
  - `002_add_qc_fields`: QC boolean flags on `cards` (`qc_nfc_tested`, `qc_qr_tested`, `qc_destination_verified`).
  - `003_add_orders_and_card_order_id`: Orders table and nullable `order_id` foreign key on `cards`.
- **Schema Policy:** Future schema additions require explicit user authorization, verified Alembic migration scripts, and backward compatibility validation.

---

## 13. Git Governance

- **Active Branch:** `feature/mvp-foundation`.
- **Strict Invariant:** No `git commit`, `git push`, `git merge`, `git rebase`, or branch creation without explicit authorization. The working tree safely preserves baseline artifacts.

---

## 14. Current Completion Status

### Complete (Phases 1–14)
- ✅ Phase 1: Foundation & Core Entities (Business, Destination, Card, Event)
- ✅ Phase 2: Security & Operational Foundation (API Key Auth, QC Flags, Dynamic QR Image, Redis Rate Limiting)
- ✅ Phase 3: Provisioning & Analytics (Card Provisioning, Card Events, Card Analytics)
- ✅ Phase 4: Production Hardening (Readiness Check, Request Correlation ID Middleware, Docker Port Normalization)
- ✅ Phase 5: Dashboard Overview & Date-Range Analytics
- ✅ Phase 6: Operational Search & Status Filtering
- ✅ Phase 7: Destination Listing & Entity Management Parity
- ✅ Phase 8: Business-Level Aggregated Analytics
- ✅ Phase 9: Read-Only Product, Architecture & Next-Milestone Audit
- ✅ Phase 10: Production Hardening & Documentation Reconciliation
- ✅ Phase 11: Read-Only Final MVP Closure Audit & Product Handoff Planning
- ✅ Phase 12: Product Definition, Information Architecture & Admin Dashboard Blueprint
- ✅ Phase 13.1: Frontend Foundation & Design System
- ✅ Phase 13.2.1: Live Frontend ↔ Backend Integration Audit & Schema Alignment (10/10 Workflows Verified Live)
- ✅ Phase 13.2.2: Interactive Analytics Visualization & Detail Drawers (10/10 Tests Passed)
- ✅ Phase 13.3: Order-Based Card Provisioning & Product Template Foundation (8/8 Tests Passed)
- ✅ Phase 13.4: Batch Exports, QR Label Preparation & Order Packaging Reconciliation (10/10 Tests Passed)
- ✅ Phase 14: Comprehensive Audit, Stabilization & Production Readiness Packaging (62/62 Pytest, 13/13 E2E, 38/38 Live Integration, Full Documentation Alignment)

### Deferred / Future Scope
- ⏳ Direct Thermal/Card Printer Integration & Printer Drivers (Deferred)
- ⏳ Hardware-Specific NFC Encoder Desktop Drivers (Deferred)
- ⏳ Mobile Field Sales App (Deferred)
- ⏳ SaaS Multi-Tenancy & Location Entities (Deferred)
- ⏳ JWT / OAuth User Authentication (Deferred)

---

## 15. Rules for Future Phases

1. **Read `NFC_MASTER_PROJECT_CONTEXT.md` first** for current system specifications.
2. **Read `NFC_MVP_SNAPSHOTS.md` for historical milestone context** and invariant verification.
3. **Execute baseline verification** (`pytest`, `e2e_verify.py`, `docker ps`, `git status`) before modifying any code.
4. **Append future snapshots ONLY to `NFC_MVP_SNAPSHOTS.md`** (Pre-Phase and Completion snapshots).
5. **Never overwrite historical snapshot entries.**
6. **Preserve Docker port isolation:** 8000 Dessert, 8001 MegaMeals, 8202 Trading AI MVP, 8300 NFC MVP.
7. **Maintain PostgreSQL and Redis as internal Docker network services only** (no host ports).
8. **Preserve 100% API backward compatibility** unless breaking changes are explicitly requested.
9. **No Git mutations** without explicit authorization.
10. **Avoid unnecessary schema complexity** or premature abstractions.
11. **Verify all implementations** with full automated tests, E2E scripts, and live container requests.
