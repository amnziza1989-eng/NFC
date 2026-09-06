# NFC Review Platform MVP

A lightweight, high-performance redirect and management service for physical NFC + QR Review Cards. When customers tap an NFC tag or scan a QR code, the system validates the card, logs an immutable interaction event, and redirects to the business's configured destination (e.g., Google Review page).

---

## Architecture Overview

```
Physical Card (NFC Tag / QR Code)
             │
             ▼
     Public HTTP Request
   (/n/{code} or /q/{code})
             │
             ▼
      FastAPI Gateway (Host Port 8300 -> Container Port 8000)
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

**Key Design Decision (Option B):** Physical cards store our redirect URLs, not the destination URL directly. This allows businesses to update review URLs at any time without reprogramming or reprinting physical cards.

---

## Tech Stack

- **Backend Framework:** Python 3.13 + FastAPI
- **Database:** PostgreSQL 16 (internal Docker container)
- **ORM:** SQLAlchemy 2.0 (async) + asyncpg
- **Cache & Rate Limiting:** Redis 7 (internal Docker container, fail-open)
- **Migrations:** Alembic
- **Testing:** Pytest + HTTPX AsyncClient
- **Containerization:** Docker Compose

---

## Port Allocation & Host Isolation

To ensure complete isolation alongside other projects running on the host system:
- **Port `8000`:** Reserved for **Dessert Project** (Untouched)
- **Port `8001`:** Reserved for **MegaMeals Project** (Untouched)
- **Port `8202`:** Reserved for **Trading AI MVP** (Untouched)
- **Port `8300`:** Reserved for **NFC MVP** (`0.0.0.0:8300->8000/tcp`)
- **PostgreSQL & Redis:** Internal to Docker bridge network only (no published host ports).

---

## Security Model

1. **Management API Authentication:** All `/api/v1/*` endpoints require the `X-API-Key` HTTP header.
2. **Public Endpoint Boundary:** Public routes (`/health`, `/ready`, `/n/{code}`, `/q/{code}`, `/q/{code}/qr.png`) do not expose internal IDs or admin operations.
3. **Fail-Open Rate Limiting:** Customer redirect endpoints enforce 60 requests/minute/IP. If Redis is unavailable, the service logs a warning and fails open to guarantee zero customer redirect downtime.
4. **URL Validation:** Destination and Business logo URLs strictly require valid `http://` or `https://` schemes with valid domain structure, preventing open redirect and script injection attacks.
5. **Observability:** `X-Request-ID` correlation middleware attaches unique request IDs to every response for end-to-end traceability without logging secrets.

---

## Complete API Catalog

### Public Endpoints (No Auth Required)

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Service liveness health check |
| `GET` | `/ready` | Database readiness check |
| `GET` | `/n/{card_code}` | NFC tap customer redirect (`302 Found` / `410 Gone` / `404`) |
| `GET` | `/q/{card_code}` | QR scan customer redirect (`302 Found` / `410 Gone` / `404`) |
| `GET` | `/q/{card_code}/qr.png` | Dynamic high-resolution PNG QR image |

### Internal Management API (`/api/v1/*`, Protected by `X-API-Key`)

#### Businesses
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/businesses` | Create a new business (validates `logo_url`) |
| `GET` | `/api/v1/businesses` | List businesses (`search`, `status`, `skip`, `limit`) |
| `GET` | `/api/v1/businesses/{id}` | Get business details by ID |
| `PATCH` | `/api/v1/businesses/{id}` | Update business name, `logo_url`, or status |
| `GET` | `/api/v1/businesses/{id}/analytics` | Consolidated analytics across all business cards (`start_date`, `end_date`) |

#### Destinations
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/destinations` | Create a destination URL (validates `http`/`https`) |
| `GET` | `/api/v1/destinations` | List destinations (`business_id`, `status`, `type`, `skip`, `limit`) |
| `GET` | `/api/v1/destinations/{id}` | Get destination details by ID |
| `PATCH` | `/api/v1/destinations/{id}` | Update destination URL, type, or status |

#### Cards
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/cards` | Create card (auto-generates unique 8-character code) |
| `GET` | `/api/v1/cards` | List cards (`business_id`, `destination_id`, `order_id`, `status`, `code`, `search`, `skip`, `limit`) |
| `GET` | `/api/v1/cards/{id}` | Get card details by ID |
| `PATCH` | `/api/v1/cards/{id}` | Update card status, destination, or QC flags |
| `GET` | `/api/v1/cards/{id}/info` | QC & card inspector (URLs, metadata, last 10 events) |
| `GET` | `/api/v1/cards/{id}/events` | Card event history with pagination & date range filtering |
| `GET` | `/api/v1/cards/{id}/provisioning` | Fulfillment payload (URLs, nested business/destination, QC flags) |
| `GET` | `/api/v1/cards/{id}/analytics` | Card interaction analytics (`start_date`, `end_date`) |

#### Orders & Post-Sale Provisioning
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/orders` | Create customer order (`product_type`: `NFC_ONLY` or `NFC_QR`, `quantity`) |
| `GET` | `/api/v1/orders` | List orders (`search`, `status`, `business_id`, `skip`, `limit`) |
| `GET` | `/api/v1/orders/{id}` | Get order details and fulfillment metadata |
| `PATCH` | `/api/v1/orders/{id}` | Update order status (protected by Completion Gate for `COMPLETED`) |
| `POST` | `/api/v1/orders/{id}/generate-cards` | Idempotent digital card generation for exact order quantity |
| `GET` | `/api/v1/orders/{id}/cards` | List all provisioning cards linked to order |
| `GET` | `/api/v1/orders/{id}/reconciliation` | Real database packaging reconciliation & delivery readiness calculation |
| `GET` | `/api/v1/orders/{id}/qr-labels` | QR label print payload (1..N sequence, rejected for `NFC_ONLY`) |
| `GET` | `/api/v1/orders/{id}/export/cards.csv` | Full order cards CSV with UTF-8 BOM |
| `GET` | `/api/v1/orders/{id}/export/nfc.csv` | Dedicated NFC chip encoder CSV with UTF-8 BOM |
| `GET` | `/api/v1/orders/{id}/export/qr.csv` | Dedicated QR label print CSV (rejected with 422 for `NFC_ONLY`) |

#### Platform Operations
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/dashboard/overview` | Platform-wide operational totals (businesses, cards, events) |

---

## Domain Model & Quality Control (QC)

- **`Business` (1) ──── (N) `Card` (N) ──── (1) `Destination`**
- **`Card` (1) ──── (N) `Event`**

### Physical Card Quality Control (QC) Workflow
Before shipping hardware cards to clients, operators verify quality using three boolean flags on `Card`:
- `qc_nfc_tested`: Set to `True` after successful physical NFC tap.
- `qc_qr_tested`: Set to `True` after successful physical QR scan.
- `qc_destination_verified`: Set to `True` after confirming redirection target.

---

## Quick Start with Docker

```bash
# 1. Start all services
docker compose -p nfc-mvp up -d --build

# 2. Access the service
# Application: http://localhost:8300
# Swagger Docs (Dev): http://localhost:8300/docs
```

### Management API Example Flow

```bash
# Set your API Key
API_KEY="your-secure-api-key-here"

# 1. Create a Business
curl -X POST http://localhost:8300/api/v1/businesses \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "Demo Cafe", "logo_url": "https://example.com/logo.png"}'

# 2. Create a Destination
curl -X POST http://localhost:8300/api/v1/destinations \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "business_id": "BUSINESS_UUID",
    "type": "GOOGLE_REVIEW",
    "url": "https://g.page/r/your-business/review"
  }'

# 3. Create a Card
curl -X POST http://localhost:8300/api/v1/cards \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "business_id": "BUSINESS_UUID",
    "destination_id": "DESTINATION_UUID"
  }'

# 4. Fetch Provisioning Data
curl http://localhost:8300/api/v1/cards/CARD_UUID/provisioning \
  -H "X-API-Key: $API_KEY"

# 5. Fetch Business Analytics
curl http://localhost:8300/api/v1/businesses/BUSINESS_UUID/analytics \
  -H "X-API-Key: $API_KEY"
```

---

## Testing
 
```bash
# Run the complete automated pytest suite (62 tests across 10 modules)
venv\Scripts\python -m pytest tests/ -v --tb=short

# Run the full end-to-end lifecycle verification script (13 verifications)
venv\Scripts\python e2e_verify.py

# Run live frontend-to-backend integration test suites (38 verifications)
venv\Scripts\python test_live_integration.py
venv\Scripts\python test_phase_13_2_2.py
venv\Scripts\python test_phase_13_3.py
venv\Scripts\python test_phase_13_4.py
```

---

## Authoritative Documentation Reference

- **Authoritative Current State:** [`NFC_MASTER_PROJECT_CONTEXT.md`](NFC_MASTER_PROJECT_CONTEXT.md)
- **Milestone & Snapshot History:** [`NFC_MVP_SNAPSHOTS.md`](NFC_MVP_SNAPSHOTS.md)
- **Architecture Deep Dive:** [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
