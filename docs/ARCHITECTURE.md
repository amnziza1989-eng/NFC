# NFC Review Platform — System Architecture

## 1. Overview

The NFC Review Platform is a lightweight, asynchronous redirect and management backend for physical NFC and QR review cards. The architecture decouples physical cards from final destination URLs, allowing businesses to redirect customers dynamically while recording granular interaction analytics.

---

## 2. System Architecture Diagram

```
Public Customer Traffic                   Management Traffic
  (NFC Tap / QR Scan)                    (Operator / API Client)
          │                                         │
          ▼                                         ▼
   GET /n/{code} or /q/{code}             /api/v1/* (X-API-Key)
          │                                         │
          ▼                                         ▼
┌───────────────────────────────────────────────────────────────┐
│                      FastAPI Gateway                          │
│               (Host Port 8300 -> Container Port 8000)         │
│                                                               │
│  - X-Request-ID Correlation Middleware                        │
│  - API Key Authentication Dependency (Management APIs)        │
└───────────────┬───────────────────────────────┬───────────────┘
                │                               │
     Public Redirect Path              Management Operations
                │                               │
                ▼                               │
┌───────────────────────────────┐               │
│   Redis 7 Rate Limiter        │               │
│  (60 req/min/IP, Fail-Open)   │               │
└───────────────┬───────────────┘               │
                │                               │
                ▼                               ▼
┌───────────────────────────────────────────────────────────────┐
│                     Service Logic Layer                       │
│    - Card lookup & status check                               │
│    - Database-level aggregations (Dashboard / Analytics)      │
│    - Card code generation & fulfillment packaging             │
└───────────────────────────────┬───────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────┐
│                     PostgreSQL 16 Engine                      │
│        (SQLAlchemy 2.0 Async + asyncpg Connection Pool)       │
│                                                               │
│   - businesses   - destinations   - cards   - events          │
└───────────────────────────────────────────────────────────────┘
                                │
                       (On Public Request)
                                ▼
                       HTTP 302 Redirect
                                │
                                ▼
                     Final Destination URL
                   (e.g., Google Review Page)
```

---

## 3. Core Domain Model

The relational model consists of 5 normalized entities:

```
┌──────────────┐         ┌──────────────┐
│   Business   │◄───────┐│ Destination  │
└──────┬───────┘        │└──────┬───────┘
       │ 1              │       │ 1
       │                │       │
       │ N              │       │ N
┌──────┴────────────────┴───────┴───────┐
│                 Order                 │
└──────────────────┬────────────────────┘
                   │ 1
                   │
                   │ N
┌──────────────────┴────────────────────┐
│                Card                   │
└──────────────────┬────────────────────┘
                   │ 1
                   │
                   │ N
┌──────────────────┴────────────────────┐
│                Event                  │
└───────────────────────────────────────┘
```

### 1. `Business`
Represents an onboarded commercial entity.
- `id`: UUID (Primary Key)
- `name`: String (Indexed)
- `logo_url`: String (Validated `http://` / `https://` URL)
- `status`: Enum string (`ACTIVE` | `DISABLED`)
- `created_at`, `updated_at`: Timestamps with timezone

### 2. `Destination`
Configurable URL target for reviews or customer engagement.
- `id`: UUID (Primary Key)
- `business_id`: UUID (Foreign Key → `businesses.id`, Indexed)
- `type`: String (default `GOOGLE_REVIEW`)
- `url`: String (Validated `http://` / `https://` URL)
- `status`: Enum string (`ACTIVE` | `DISABLED`)
- `created_at`, `updated_at`: Timestamps with timezone

### 3. `Order`
Represents a customer purchase order and provisioning container.
- `id`: UUID (Primary Key)
- `order_number`: String (Unique human-readable format `ORD-YYYYMMDD-XXXX`, Indexed)
- `business_id`: UUID (Foreign Key → `businesses.id`, Indexed)
- `destination_id`: UUID (Foreign Key → `destinations.id`, Indexed)
- `product_type`: String (`NFC_ONLY` | `NFC_QR`)
- `physical_template`: String (`NFC_ONLY_TEMPLATE` | `NFC_QR_TEMPLATE`)
- `quantity`: Integer (Exact number of physical cards purchased)
- `status`: String (`CREATED` | `CARDS_GENERATED` | `PROVISIONING` | `QC_PENDING` | `COMPLETED` | `CANCELLED`)
- `created_at`, `updated_at`: Timestamps with timezone

### 4. `Card`
Physical hardware card tracking NFC + QR identifiers and QC testing status.
- `id`: UUID (Primary Key)
- `business_id`: UUID (Foreign Key → `businesses.id`, Indexed)
- `destination_id`: UUID (Foreign Key → `destinations.id`, Indexed)
- `order_id`: UUID (Foreign Key → `orders.id`, Nullable, Indexed)
- `code`: String (Unique 8-character random alphanumeric, Indexed)
- `status`: Enum string (`ACTIVE` | `DISABLED`)
- `qc_nfc_tested`: Boolean (Hardware NFC tap verified)
- `qc_qr_tested`: Boolean (Hardware QR scan verified)
- `qc_destination_verified`: Boolean (Target URL verified)
- `created_at`, `updated_at`: Timestamps with timezone

### 5. `Event` (Immutable Interaction Log)
Log of customer taps and scans.
- `id`: UUID (Primary Key)
- `card_id`: UUID (Foreign Key → `cards.id`, Indexed)
- `type`: Enum string (`NFC` | `QR`)
- `user_agent`: String (Client browser header)
- `ip_address`: String (Client IP)
- `referrer`: String (Referrer header)
- `created_at`: Timestamp with timezone (Indexed)

---

## 4. Traffic Flows

### Public Customer Redirect Flow
1. **Request:** Customer taps NFC tag (`GET /n/{code}`) or scans QR code (`GET /q/{code}`).
2. **Rate Limiting:** Request IP evaluated against Redis rate limiter (60 req/min/IP). If Redis is unreachable, limiter **fails open** with a warning log.
3. **Card Lookup:** Database queried for `code`. If non-existent → `404 Not Found`. If `status == DISABLED` → `410 Gone`.
4. **Destination Lookup:** Active destination retrieved via `card.destination_id`.
5. **Event Recording:** Asynchronous insert into `events` table with interaction type (`NFC` or `QR`).
6. **Redirect:** System returns `HTTP 302 Found` with destination URL.

### Management & Analytics Flow
1. **Authentication:** Request arrives at `/api/v1/*` with `X-API-Key` header.
2. **Validation:** Pydantic models validate input payload (e.g., URL schemes, enum regex patterns).
3. **Execution:** SQLAlchemy async session performs DB-level filtering and aggregation.
4. **Response:** Sanitized JSON payload returned with `X-Request-ID` header.

---

## 5. Security & Reliability Architecture

- **Authentication:** `X-API-Key` header enforced on all management routes via FastAPI dependency injection.
- **Fail-Open Rate Limiting:** Sliding-window rate limiter in Redis with 60s TTL; connection failures fail open to prevent customer redirect outages.
- **URL Sanitization:** Strict Pydantic validators on `Destination.url` and `Business.logo_url` restrict inputs to valid `http` or `https` schemes with valid network domains, preventing open redirect vulnerabilities and XSS.
- **Request Tracing:** `X-Request-ID` middleware injects unique UUIDs on every request/response cycle for correlation.
- **Data Protection:** Zero secrets, API keys, or connection credentials exposed in public endpoints or server logs.

---

## 6. Analytics Architecture

Analytics queries are executed directly in SQL to maintain high efficiency:
1. **Global Dashboard (`/api/v1/dashboard/overview`):** Total & active businesses, cards, and event counts.
2. **Business Aggregation (`/api/v1/businesses/{id}/analytics`):** Multi-card rollup of event metrics and card counts across all cards belonging to the business.
3. **Card Analytics (`/api/v1/cards/{id}/analytics`):** Metrics for an individual card.
4. **Date Filtering Semantics:** `start_date` is inclusive (`Event.created_at >= start_dt 00:00:00 UTC`), and `end_date` is calendar-day inclusive via half-open comparison (`Event.created_at < (end_dt + 1 day) 00:00:00 UTC`).

---

## 7. Host Port & Docker Isolation Invariants

- **Port `8000`:** Reserved for **Dessert Project** (Untouched)
- **Port `8001`:** Reserved for **MegaMeals Project** (Untouched)
- **Port `8202`:** Reserved for **Trading AI MVP** (Untouched)
- **Port `8300`:** Reserved for **NFC MVP** (`0.0.0.0:8300->8000/tcp`)
- **PostgreSQL & Redis:** Internal Docker network only (no published host ports).
