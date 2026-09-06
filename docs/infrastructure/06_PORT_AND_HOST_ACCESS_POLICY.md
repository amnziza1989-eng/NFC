# 06. Port & Host Access Policy

## 1. Principles of Host Exposure

The user intentionally requires several database and Redis instances to be accessible from Windows tools (e.g. **DBeaver**, **pgAdmin**, **Redis Insight**, local inspection scripts).

Therefore, the policy is:
1. **Preserve existing ports** to avoid breaking user workflows.
2. **Document intentional host exposure** vs internal-only networking.
3. For future stack configurations, bind to loopback (`127.0.0.1:PORT:PORT`) instead of `0.0.0.0` where possible for local security.

---

## 2. Canonical Host Port Map

```
PORT      SERVICE                    PROJECT         CONTAINER               PURPOSE
-------------------------------------------------------------------------------------------------------------------------
:5173     Vite React Dev Server      TapNow NFC      Host Node Process       TapNow Storefront & Admin UI
:8000     Django Web Application     Deserkhoone     deserkhoone-backend-1   Confectionery Storefront API
:8001     Django / Daphne Server     MegaMeals       megameals_app-backend-1 NutriMenu / Plate Planning API
:8202     FastAPI Server             Trading AI      trading-ai-mvp          Trading AI Microservice API
:8300     FastAPI Server             TapNow NFC      nfc-app-1               TapNow Management & Public API
:5432     PostgreSQL 15              Deserkhoone     deserkhoone-db-1        Host DB Access for pgAdmin / DBeaver
:5433     PostgreSQL 15              MegaMeals       megameals_app-db-1      Host DB Access for pgAdmin / DBeaver
:6379     Redis 7                    Deserkhoone     deserkhoone-redis-1     Host Redis Access for Redis Insight
:6380     Redis 7                    MegaMeals       megameals_app-redis-1   Host Redis Access for Redis Insight
```

---

## 3. Internal-Only Microservice Ports (Zero Host Collision)

- `nfc-db-1`: PostgreSQL on internal Docker network `nfc_default:5432` (App connects via `DATABASE_URL=postgresql+asyncpg://nfc_user:nfc_password@db:5432/nfc_db`)
- `trading-ai-mvp-db`: PostgreSQL on internal Docker network `trade-mvp_default:5432`
- `trading-ai-mvp-redis`: Redis on internal Docker network `trade-mvp_default:6379`
- `megameals_app-qcluster-1`: Communicates with `megameals_app-redis-1` on internal `redis:6379`
