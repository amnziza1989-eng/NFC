# NFC Review Platform — Architecture

## Overview

A lightweight redirect service that routes NFC taps and QR scans through our backend before redirecting to a configurable destination (initially Google Reviews).

## Architecture Diagram

```
Physical Card (NFC/QR)
        │
        ▼
  Our URL (/n/ or /q/)
        │
        ▼
   FastAPI Backend
        │
        ├── Validate Card
        ├── Record Event
        └── 302 Redirect
              │
              ▼
        Destination URL
       (Google Review)
```

## Domain Model

```
Business (1) ──── (N) Card (N) ──── (1) Destination
                         │
                         │
                    (N) Event
```

### Business
Represents a registered business. Future: will have users, locations, subscriptions.

### Card
Physical NFC+QR card with a unique random `code`. Points to a `Destination`.

### Destination
A typed URL target. V1 supports `GOOGLE_REVIEW`. Future: `INSTAGRAM`, `WHATSAPP`, `WEBSITE`, `MENU`, `BOOKING`, `CUSTOM_URL`.

### Event
Immutable log of card interactions. Types: `NFC`, `QR`. Records timestamp, user_agent, and optional metadata.

## API Structure

### Public Endpoints (no auth)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/n/{card_code}` | NFC tap redirect |
| GET | `/q/{card_code}` | QR scan redirect |

### Internal Management Endpoints (future: auth-protected)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/businesses` | Create business |
| GET | `/api/v1/businesses` | List businesses |
| GET | `/api/v1/businesses/{id}` | Get business |
| PATCH | `/api/v1/businesses/{id}` | Update business |
| POST | `/api/v1/destinations` | Create destination |
| GET | `/api/v1/destinations/{id}` | Get destination |
| PATCH | `/api/v1/destinations/{id}` | Update destination |
| POST | `/api/v1/cards` | Create card |
| GET | `/api/v1/cards` | List cards |
| GET | `/api/v1/cards/{id}` | Get card detail |
| PATCH | `/api/v1/cards/{id}` | Update card |
| GET | `/api/v1/cards/{id}/info` | Card info (QC) |
| GET | `/api/v1/cards/{id}/events` | Card events |

## Database Schema

PostgreSQL with Alembic migrations.

### Tables

```sql
businesses (
    id              UUID PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    logo_url        VARCHAR(2048),
    status          VARCHAR(20) DEFAULT 'ACTIVE',
    created_at      TIMESTAMP WITH TIME ZONE,
    updated_at      TIMESTAMP WITH TIME ZONE
)

destinations (
    id              UUID PRIMARY KEY,
    business_id     UUID REFERENCES businesses(id),
    type            VARCHAR(50) NOT NULL DEFAULT 'GOOGLE_REVIEW',
    url             VARCHAR(2048) NOT NULL,
    status          VARCHAR(20) DEFAULT 'ACTIVE',
    created_at      TIMESTAMP WITH TIME ZONE,
    updated_at      TIMESTAMP WITH TIME ZONE
)

cards (
    id              UUID PRIMARY KEY,
    business_id     UUID REFERENCES businesses(id),
    destination_id  UUID REFERENCES destinations(id),
    code            VARCHAR(20) UNIQUE NOT NULL,
    status          VARCHAR(20) DEFAULT 'ACTIVE',
    created_at      TIMESTAMP WITH TIME ZONE,
    updated_at      TIMESTAMP WITH TIME ZONE
)

events (
    id              UUID PRIMARY KEY,
    card_id         UUID REFERENCES cards(id),
    type            VARCHAR(10) NOT NULL,
    user_agent      TEXT,
    ip_address      VARCHAR(45),
    referrer        VARCHAR(2048),
    created_at      TIMESTAMP WITH TIME ZONE
)
```

## Routing Flow

```
1. Request: GET /n/abc123 (or /q/abc123)
2. Lookup card by code "abc123"
3. If not found → 404
4. If card.status != ACTIVE → 410
5. Lookup destination by card.destination_id
6. If destination missing or inactive → 404
7. Create Event (type=NFC or QR, card_id, user_agent, timestamp)
8. Return HTTP 302 → destination.url
```

## Security Decisions

- Card codes are random 8-char alphanumeric strings (not sequential IDs)
- Destination URLs validated: must be valid HTTPS URLs, no `javascript:` or dangerous schemes
- Public and internal API routes are separated for future auth
- Environment variables for all secrets
- No sensitive data in logs
- CORS restricted
- Basic rate limiting on public endpoints

## V1 Non-Goals

- No customer authentication/dashboard
- No subscription/billing
- No mobile app
- No complex analytics
- No microservices
- No Kubernetes
- No AI/ML features
- No review gating or incentives

## Future Extension Strategy

The domain model supports future additions without schema rewrites:
- **Multi-location**: Add `Location` model between `Business` and `Card`
- **Multi-destination**: Add `DestinationType` enum values
- **Users/Roles**: Add `User` model with `Organization` relationship
- **Analytics**: Query `events` table with aggregations
- **Subscriptions**: Add `Subscription` model to `Business`
