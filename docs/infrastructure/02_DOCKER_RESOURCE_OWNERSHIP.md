# 02. Docker Resource Ownership Matrix

## 1. Container Ownership Chain

```
RESOURCE                           TYPE        COMPOSE PROJECT  SERVICE     SOURCE PATH               PURPOSE                       STATUS
-------------------------------------------------------------------------------------------------------------------------------------------------------
nfc-app-1                          Container   nfc              app         ...\GitHub\NFC            TapNow Main FastAPI Server    ACTIVE
nfc-db-1                           Container   nfc              db          ...\GitHub\NFC            TapNow Main Database          ACTIVE
trading-ai-mvp                     Container   trade-mvp        app         D:\work\trade\trade-mvp   Trading AI Bot API            ACTIVE
trading-ai-mvp-db                  Container   trade-mvp        db          D:\work\trade\trade-mvp   Trading AI State Database     ACTIVE
trading-ai-mvp-redis               Container   trade-mvp        redis       D:\work\trade\trade-mvp   Trading AI Cache / Streams    ACTIVE
megameals_app-backend-1            Container   megameals_app    backend     ...\megameals\megameals   MegaMeals Web Application     ACTIVE
megameals_app-qcluster-1           Container   megameals_app    qcluster    ...\megameals\megameals   MegaMeals Async Task Worker   ACTIVE
megameals_app-db-1                 Container   megameals_app    db          ...\megameals\megameals   MegaMeals Database (Port 5433)ACTIVE
megameals_app-redis-1              Container   megameals_app    redis       ...\megameals\megameals   MegaMeals Redis (Port 6380)   ACTIVE
deserkhoone-backend-1              Container   deserkhoone      backend     ...\deserkhoone           Deserkhoone Web Server        ACTIVE
deserkhoone-db-1                   Container   deserkhoone      db          ...\deserkhoone           Deserkhoone DB (81 Tables)    ACTIVE
deserkhoone-redis-1                Container   deserkhoone      redis       ...\deserkhoone           Deserkhoone Redis Cache       ACTIVE
deserkhoone_app-backend-run-...    Container   deserkhoone_app  backend     ...\deserkhoone           AI Photography Test Runner    EPHEMERAL
deserkhoone_app-db-1               Container   deserkhoone_app  db          ...\deserkhoone           AI Photography Test Sandbox   EPHEMERAL
deserkhoone_app-redis-1            Container   deserkhoone_app  redis       ...\deserkhoone           AI Photography Test Cache     EPHEMERAL
nfc-mvp-db-1                       Container   nfc-mvp          db          ...\GitHub\NFC            TapNow Phase 14 DB (382 cards)HISTORICAL
nfc-mvp-redis-1                    Container   nfc-mvp          redis       ...\GitHub\NFC            TapNow Phase 14 Rate Limiter  HISTORICAL
```

---

## 2. Docker Volume Ownership & Data Value

| Volume Name | Driver | Compose Project | Service | Host Mountpoint | Data Value / Content | Lifecycle Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `nfc_postgres_data` | local | `nfc` | `db` | `/var/lib/docker/volumes/...` | TapNow Phase 16 customer identities, orders, OTP sessions | **ACTIVE** |
| `nfc-mvp_postgres_data` | local | `nfc-mvp` | `db` | `/var/lib/docker/volumes/...` | **382 Physical Pre-provisioned Cards**, 133 businesses | **HISTORICAL VALUABLE** |
| `trade-mvp_trading_ai_postgres_data`| local | `trade-mvp` | `db` | `/var/lib/docker/volumes/...` | Trading AI signals, portfolio history, asset parameters | **ACTIVE** |
| `trade-mvp_trading_ai_redis_data` | local | `trade-mvp` | `redis` | `/var/lib/docker/volumes/...` | Real-time market cache | **ACTIVE** |
| `megameals_app_postgres_data` | local | `megameals_app` | `db` | `/var/lib/docker/volumes/...` | MegaMeals nutritional plates, recipes, user body goals | **ACTIVE** |
| `megameals_app_redis_data` | local | `megameals_app` | `redis` | `/var/lib/docker/volumes/...` | Django-Q task queue & session store (1 active key) | **ACTIVE** |
| `megameals_app_media_files` | local | `megameals_app` | `backend` | `/var/lib/docker/volumes/...` | Product & meal images | **ACTIVE** |
| `deserkhoone_postgres_data` | local | `deserkhoone` | `db` | `/var/lib/docker/volumes/...` | **81 Production Tables**: orders, catalog, user accounts | **ACTIVE** |
| `deserkhoone_redis_data` | local | `deserkhoone` | `redis` | `/var/lib/docker/volumes/...` | Session store, cart state | **ACTIVE** |
| `deserkhoone_media_files` | local | `deserkhoone` | `backend` | `/var/lib/docker/volumes/...` | Uploaded product confectionery photos | **ACTIVE** |
| `deserkhoone_app_postgres_data` | local | `deserkhoone_app` | `db` | `/var/lib/docker/volumes/...` | 0 tables (ephemeral test DB) | **EPHEMERAL** |
| `deserkhoone_app_redis_data` | local | `deserkhoone_app` | `redis` | `/var/lib/docker/volumes/...` | 0 keys | **EPHEMERAL** |
| `deserkhoone_app_media_files` | local | `deserkhoone_app` | `backend` | `/var/lib/docker/volumes/...` | AI photography sandbox images | **EPHEMERAL** |
| `tat_postgres_data` | local | `tat` | `db` | `/var/lib/docker/volumes/...` | Historical project database (inactive) | **ARCHIVE** |
| `tat_redis_data` | local | `tat` | `redis` | `/var/lib/docker/volumes/...` | Historical project cache (inactive) | **ARCHIVE** |
| `tat_media_files` | local | `tat` | `backend` | `/var/lib/docker/volumes/...` | Historical project media (inactive) | **ARCHIVE** |
| `new_postgres_data` | local | `new` | `db` | `/var/lib/docker/volumes/...` | Historical project database (inactive) | **ARCHIVE** |
| `new_redis_data` | local | `new` | `redis` | `/var/lib/docker/volumes/...` | Historical project cache (inactive) | **ARCHIVE** |
| `new_media_files` | local | `new` | `backend` | `/var/lib/docker/volumes/...` | Historical project media (inactive) | **ARCHIVE** |
| `megameals_postgres_data` | local | `megameals` | `db` | `/var/lib/docker/volumes/...` | Older unattached database volume | **CONFIRMED ORPHAN** |
| `megameals_redis_data` | local | `megameals` | `redis` | `/var/lib/docker/volumes/...` | Older unattached redis volume | **CONFIRMED ORPHAN** |
| `deserkhoone_media_volume` | local | `deserkhoone` | `backend` | `/var/lib/docker/volumes/...` | Unused volume superseded by media_files | **CONFIRMED ORPHAN** |
| `deserkhoone_static_volume` | local | `deserkhoone` | `backend` | `/var/lib/docker/volumes/...` | Static files volume | **CONFIRMED ORPHAN** |

---

## 3. Docker Networks Map

| Network Name | Driver | Compose Project | Containers Connected | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `nfc_default` | bridge | `nfc` | `nfc-app-1`, `nfc-db-1` | TapNow internal API to DB bridge |
| `nfc-mvp_default` | bridge | `nfc-mvp` | `nfc-mvp-db-1`, `nfc-mvp-redis-1` | Historical Phase 14 stack |
| `trade-mvp_default` | bridge | `trade-mvp` | `trading-ai-mvp`, `trading-ai-mvp-db`, `trading-ai-mvp-redis` | Trading AI isolated network |
| `megameals_app_default`| bridge | `megameals_app` | `megameals_app-backend-1`, `megameals_app-qcluster-1`, `megameals_app-db-1`, `megameals_app-redis-1` | MegaMeals internal micro-network |
| `deserkhoone_default` | bridge | `deserkhoone` | `deserkhoone-backend-1`, `deserkhoone-db-1`, `deserkhoone-redis-1` | Deserkhoone main store network |
| `deserkhoone_app_default`| bridge | `deserkhoone_app`| `deserkhoone_app-backend-run...` | Deserkhoone AI photo sandbox |
