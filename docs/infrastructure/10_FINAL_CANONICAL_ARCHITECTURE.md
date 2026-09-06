# 10. Final Canonical Architecture Standard

## 1. Official Environment Standard

```
PROJECT 1: TAPNOW NFC PLATFORM
├── Canonical Path:            C:\Users\Alireza\Documents\GitHub\NFC
├── Git Repository:            Branch: feature/mvp-foundation
├── Compose Project:           nfc
├── Compose Files:             docker-compose.yml, docker-compose.dev.yml
├── Backend Service:           FastAPI -> http://localhost:8300
├── Frontend Service:          Vite React -> http://localhost:5173
├── Database:                  PostgreSQL 16 (nfc_db on internal network, nfc_postgres_data)
└── Historical Companion:      nfc-mvp (Holds 382 factory cards in nfc-mvp_postgres_data)

PROJECT 2: TRADING AI MVP
├── Canonical Path:            D:\work\trade\trade-mvp
├── Git Repository:            Independent .git on branch feature/mvp-foundation
├── Compose Project:           trade-mvp
├── Backend Service:           FastAPI -> http://localhost:8202
├── Database:                  PostgreSQL 16 (trading_ai, internal network)
├── Cache / Streams:           Redis 7 (trading_ai_redis_data, internal network)
└── Historical Foundation:     D:\work\trade (Branch: main, holding original algorithms & MT5 notebooks)

PROJECT 3: MEGAMEALS NUTRIMENU
├── Canonical Path:            C:\Users\Alireza\Documents\GitHub\megameals\megameals
├── Git Repository:            C:\Users\Alireza\Documents\GitHub\megameals (Branch: main)
├── Compose Project:           megameals_app
├── Backend Service:           Django / Daphne -> http://localhost:8001
├── Worker Service:            Django Q (qcluster)
├── Database:                  PostgreSQL 15 -> localhost:5433 (megameals_app_postgres_data)
└── Cache / Queues:            Redis 7 -> localhost:6380 (megameals_app_redis_data)

PROJECT 4: DESERKHOONE CONFECTIONERY & AI PHOTOGRAPHY
├── Canonical Path:            D:\work\deser git\deserkhoone\deserkhoone
├── Git Repository:            D:\work\deser git\deserkhoone (Branch: main)
├── Main Store Compose Proj:   deserkhoone (Backend: http://localhost:8000, DB: 5432 with 81 tables, Redis: 6379)
└── AI Photography Subsystem:  deserkhoone_app (Ephemeral runner for automated test & image generation workflows)
```

---

## 2. Standard Rules for Development Operations

1. **Starting TapNow NFC**:
   - Production/Standard: `docker compose up -d`
   - Development (with local reload): `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d`
2. **Starting Trading AI**:
   - From `D:\work\trade\trade-mvp`: `docker compose up -d`
3. **Starting MegaMeals**:
   - From `C:\Users\Alireza\Documents\GitHub\megameals\megameals`: `docker compose up -d`
4. **Starting Deserkhoone**:
   - From `D:\work\deser git\deserkhoone\deserkhoone`: `docker compose -f docker-compose.yml up -d`
5. **No Blind Volume Pruning**:
   - Always verify `docker volume ls` against the Resource Ownership Matrix before running prune operations.
