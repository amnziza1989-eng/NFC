# NFC Review Platform

A lightweight redirect service for NFC + QR Review Cards. Customers tap an NFC tag or scan a QR code → the system records the event and redirects to the business's Google Review page (or any configured destination).

## Architecture

```
Physical Card (NFC / QR)
        │
        ▼
  Our URL (/n/ or /q/{code})
        │
        ▼
   FastAPI Backend
        │
        ├── Validate Card
        ├── Record Event
        └── 302 Redirect → Destination URL
```

**Key design decision (Option B):** The physical card stores our URL, not Google's directly. This means destinations can be changed without reprogramming physical cards.

## Tech Stack

- **Backend:** Python 3.13 + FastAPI
- **Database:** PostgreSQL 16
- **ORM:** SQLAlchemy 2.0 (async)
- **Migrations:** Alembic
- **Testing:** Pytest + httpx
- **Deployment:** Docker + Docker Compose

## Quick Start with Docker

```bash
# 1. Clone and enter the project
cd NFC

# 2. Start everything
docker compose up --build

# 3. The API is now running at http://localhost:8000
#    Swagger docs at http://localhost:8000/docs
```

## API Documentation

Interactive Swagger docs are available at `/docs` in development mode.

### Public Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/n/{card_code}` | NFC tap → event + 302 redirect |
| `GET` | `/q/{card_code}` | QR scan → event + 302 redirect |

### Internal Management API (`/api/v1`)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/businesses` | Create business |
| `GET` | `/api/v1/businesses` | List businesses |
| `GET` | `/api/v1/businesses/{id}` | Get business |
| `PATCH` | `/api/v1/businesses/{id}` | Update business |
| `POST` | `/api/v1/destinations` | Create destination |
| `GET` | `/api/v1/destinations/{id}` | Get destination |
| `PATCH` | `/api/v1/destinations/{id}` | Update destination URL |
| `POST` | `/api/v1/cards` | Create card (auto-generates code) |
| `GET` | `/api/v1/cards` | List cards |
| `GET` | `/api/v1/cards/{id}` | Get card |
| `PATCH` | `/api/v1/cards/{id}` | Update card (status, destination) |
| `GET` | `/api/v1/cards/{id}/info` | QC inspection (URLs, events) |
| `GET` | `/api/v1/cards/{id}/events` | Card event history |

## How to Create a Card

### Step 1: Create a Business

```bash
curl -X POST http://localhost:8000/api/v1/businesses \
  -H "Content-Type: application/json" \
  -d '{"name": "Demo Cafe"}'
```

Response includes the `id` (e.g., `"id": "abc-123-..."`)

### Step 2: Create a Destination

```bash
curl -X POST http://localhost:8000/api/v1/destinations \
  -H "Content-Type: application/json" \
  -d '{
    "business_id": "BUSINESS_ID_HERE",
    "type": "GOOGLE_REVIEW",
    "url": "https://g.page/r/your-business/review"
  }'
```

### Step 3: Create a Card

```bash
curl -X POST http://localhost:8000/api/v1/cards \
  -H "Content-Type: application/json" \
  -d '{
    "business_id": "BUSINESS_ID_HERE",
    "destination_id": "DESTINATION_ID_HERE"
  }'
```

Response includes:
- `code` — The unique card code (e.g., `"a3f7k9m2"`)
- `id` — Internal ID for management

### Step 4: Get Card URLs

```bash
curl http://localhost:8000/api/v1/cards/CARD_ID/info
```

Response includes:
- `nfc_url` — Program this into the NFC tag
- `qr_url` — Encode this as a QR code

### Step 5: Update Destination (without changing the card)

```bash
curl -X PATCH http://localhost:8000/api/v1/destinations/DESTINATION_ID \
  -H "Content-Type: application/json" \
  -d '{"url": "https://g.page/r/new-location/review"}'
```

The physical card automatically redirects to the new URL.

## Environment Variables

See [`.env.example`](.env.example) for all variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `APP_ENV` | Environment (development/production) | `development` |
| `APP_HOST` | Server bind host | `0.0.0.0` |
| `APP_PORT` | Server bind port | `8000` |
| `DATABASE_URL` | PostgreSQL connection string | (see .env.example) |
| `PUBLIC_BASE_URL` | Public-facing URL for NFC/QR generation | `https://tap.example.com` |
| `LOG_LEVEL` | Logging level | `INFO` |

## Database Migrations

Migrations run automatically on Docker startup. To run manually:

```bash
# Inside the container
alembic upgrade head

# Create a new migration
alembic revision --autogenerate -m "description"
```

## Testing

Tests use SQLite in-memory — no PostgreSQL needed:

```bash
# Install dev dependencies
pip install -r requirements-dev.txt

# Run tests
pytest -v

# Run with coverage
pytest -v --tb=short
```

## Physical Card Testing (QC)

For each card, verify:

1. **Android NFC Tap** → Opens Google Review page
2. **iPhone NFC Tap** → Opens Google Review page
3. **Camera QR Scan** → Opens Google Review page
4. **Event recorded** → Check via `/api/v1/cards/{id}/events`

Use the card info endpoint to get all URLs:
```bash
curl http://localhost:8000/api/v1/cards/CARD_ID/info
```

## Project Structure

```
NFC/
├── app/
│   ├── main.py              # FastAPI application
│   ├── config.py             # Environment-based settings
│   ├── api/
│   │   ├── public/routes.py  # Health, NFC/QR redirect
│   │   └── internal/routes.py # Business/Card/Destination CRUD
│   ├── models/models.py      # SQLAlchemy ORM models
│   ├── schemas/schemas.py    # Pydantic request/response schemas
│   ├── services/service.py   # Business logic layer
│   ├── db/database.py        # Async DB engine + session
│   └── utils/code_generator.py
├── tests/
│   ├── conftest.py           # Fixtures
│   ├── test_public.py        # Public endpoint tests
│   ├── test_internal.py      # Internal API tests
│   └── test_utils.py         # Utility tests
├── migrations/
│   ├── env.py
│   └── versions/001_initial.py
├── docs/ARCHITECTURE.md
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
├── requirements-dev.txt
├── .env.example
└── .gitignore
```

## Security

- Card codes are cryptographically random (not sequential IDs)
- Destination URLs validated (HTTPS only, no javascript: scheme)
- Public and internal APIs separated for future authentication
- No credentials committed (use `.env`)
- CORS restricted in production
- Swagger docs disabled in production

## V1 Intentional Limitations

The following are planned for future phases:
- Customer authentication & dashboard
- Multiple destinations per card
- Digital business cards
- Subscription & billing
- Advanced analytics
- Instagram, WhatsApp, Menu, Booking destinations
- Users & roles

## License

Proprietary — All rights reserved.
