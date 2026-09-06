# Phase 2 — Controlled Verification & Safe Infrastructure Consolidation Report

> [!IMPORTANT]
> **SAFETY & AUDIT VERIFICATION**:
> - **NO DESTRUCTIVE ACTIONS WERE PERFORMED.**
> - **Zero containers** were stopped, restarted, created, or deleted.
> - **Zero Docker volumes, networks, or images** were modified or pruned.
> - **Zero database records** were migrated, altered, or overwritten.
> - **Zero filesystem paths or Git repositories** were moved or renamed.
> - All technical assertions in this report are explicitly labeled as `[CONFIRMED FACT]`, `[INFERENCE]`, or `[UNKNOWN]`.

---

## 1. Executive Summary

During Phase 2, a comprehensive read-only verification was executed across the four active and supporting application ecosystems (**TapNow NFC**, **Trading AI MVP**, **MegaMeals**, and **Deserkhoone**).

### Key Verified Facts:
1. **TapNow Database Split**:
   - `[CONFIRMED FACT]`: The historical container `nfc-mvp-db-1` contains **382 physical/factory cards** and **133 businesses** across 12 tables.
   - `[CONFIRMED FACT]`: The active container `nfc-db-1` contains **1 card**, **5 businesses**, **32 customer OTP audit sessions**, and **9 customer identity records** across the same 12 tables.
   - `[CONFIRMED FACT]`: Card codes and primary keys between the two databases are completely disjoint (zero collision).
   - `[CONFIRMED FACT]`: Active FastAPI backend `nfc-app-1` connects exclusively to `nfc-db-1` via internal network `nfc_default:5432`. It has zero runtime or network dependency on `nfc-mvp`.
2. **Deserkhoone AI Stack Origin**:
   - `[CONFIRMED FACT]`: Container `deserkhoone_app-backend-run-727bb00107bd` was started via `python manage.py test ai_photography` to run automated test suites for the AI image generation subsystem.
   - `[CONFIRMED FACT]`: Main production store `deserkhoone-backend-1` runs completely independently on port `8000` with **81 tables** in `deserkhoone-db-1` (port `5432`).
3. **Trading AI Topology Lock**:
   - `[CONFIRMED FACT]`: `D:\work\trade` is the **Historical Foundation Git Repository** (branch `main`).
   - `[CONFIRMED FACT]`: `D:\work\trade\trade-mvp` is the **Active Trading AI Microservice** (independent nested Git repository on branch `feature/mvp-foundation`, mapped to port `8202`).
4. **Host Access Requirements**:
   - `[CONFIRMED FACT]`: Host port bindings on `5432`, `5433`, `6379`, `6380` are actively utilized for local Windows inspection tools (**DBeaver**, **pgAdmin**, **Redis Insight**).

---

## 2. TapNow Data Reconciliation & Record Comparison

### Exact Entity Counts & Comparison Matrix

| Domain Entity / Table | Active DB (`nfc-db-1`) | Historical DB (`nfc-mvp-db-1`) | Overlap Count | Status / Disjoint Nature |
| :--- | :--- | :--- | :--- | :--- |
| `cards` | **1** (`8ew6fk8w`) | **382** (e.g. `iq73dpm8`, `5d4bkh6c`) | **0** | `[CONFIRMED FACT]` 100% Disjoint. No code collisions. |
| `businesses` | **5** (Live Persian storefronts) | **133** (Seed/QC test businesses) | **0** | `[CONFIRMED FACT]` 100% Disjoint UUIDs. |
| `destinations` | **7** | **125** | **0** | `[CONFIRMED FACT]` 100% Disjoint UUIDs. |
| `events` (Scans / Redirects) | **3** | **290** | **0** | `[CONFIRMED FACT]` Historical scan telemetry. |
| `orders` (Fulfillment) | **6** | **74** | **0** | `[CONFIRMED FACT]` Historical factory order batches. |
| `shop_orders` (Storefront) | **4** | **8** | **0** | `[CONFIRMED FACT]` Disjoint storefront orders. |
| `shop_order_items` | **6** | **13** | **0** | `[CONFIRMED FACT]` Disjoint order items. |
| `otp_sessions` | **32** | **0** | **0** | `[CONFIRMED FACT]` Active DB exclusive (Phase 16). |
| `customer_identities` | **9** | **0** | **0** | `[CONFIRMED FACT]` Active DB exclusive (Phase 16). |
| `identity_methods` | **9** | **0** | **0** | `[CONFIRMED FACT]` Active DB exclusive (Phase 16). |
| `card_activation_sessions` | **0** | **1** | **0** | `[CONFIRMED FACT]` Historical activation record. |
| `alembic_version` | `f84133d70bfb` | `4e2a052f42c5` | **0** | `[CONFIRMED FACT]` Active DB has latest auth migrations. |

---

## 3. Schema Comparison Analysis

- `[CONFIRMED FACT]`: Both databases define the exact same 12 table schemas (`cards`, `businesses`, `destinations`, `events`, `orders`, `shop_orders`, `shop_order_items`, `otp_sessions`, `customer_identities`, `identity_methods`, `card_activation_sessions`, `alembic_version`).
- `[CONFIRMED FACT]`: `cards` table in both databases has identical columns:
  `id (UUID)`, `business_id (UUID)`, `destination_id (UUID)`, `order_id (UUID)`, `code (VARCHAR)`, `status (VARCHAR)`, `qc_nfc_tested (BOOL)`, `qc_qr_tested (BOOL)`, `qc_destination_verified (BOOL)`, `created_at (TIMESTAMPTZ)`, `updated_at (TIMESTAMPTZ)`.
- `[CONFIRMED FACT]`: The active database has Alembic revision `f84133d70bfb` (includes `debug_code` on `otp_sessions`), while historical has `4e2a052f42c5`. Schema compatibility is 100% forward-compatible.

---

## 4. Runtime Dependency Verification

- **Compose Stack Isolation**:
  - `[CONFIRMED FACT]`: Container `nfc-app-1` has `DATABASE_URL=postgresql+asyncpg://nfc_user:nfc_password@db:5432/nfc_db`.
  - `[CONFIRMED FACT]`: `nfc-app-1` is attached exclusively to network `nfc_default`. The hostname `db` resolves directly to `nfc-db-1` (`1cfb27ef11c0`).
  - `[CONFIRMED FACT]`: `nfc-app-1` has zero network bridges, links, or connection pools to `nfc-mvp-db-1` or `nfc-mvp-redis-1`.
  - `[CONFIRMED FACT]`: `nfc-mvp-redis-1` has **0 keys** (`dbsize = 0`).

---

## 5. Operational Classification of the 382 Cards

- **Classification**: **CASE B — Operationally Valuable Pre-Provisioned Physical / QC Cards** `[CONFIRMED FACT]`.
- **Technical Evidence**:
  - 381 cards are marked `ACTIVE`, 1 is `DISABLED`.
  - 380 cards have `qc_nfc_tested = true` and `qc_qr_tested = true`.
  - These cards represent generated NFC / QR payloads produced during hardware quality control phases.
  - Deleting them would invalidate any physical sample cards or QR stickers printed during Phase 12–14 hardware testing.

---

## 6. TapNow Decision Matrix

```
+---------------------------------------------------------------------------------------------------------------+
| TAPNOW NFC DECISION MATRIX                                                                                    |
+-------------------+-------------------------------------------------------------------------------------------+
| State Selected    | STATE B: Historical Data Must Remain Preserved, Accessible & Backed Up.                    |
+-------------------+-------------------------------------------------------------------------------------------+
| Evidence          | 382 QC/hardware cards exist in nfc-mvp_postgres_data. Zero collisions with nfc_postgres_data.|
| Direct Action     | 1. Do NOT delete nfc-mvp volumes.                                                         |
|                   | 2. Create a verified SQL archive: `nfc_phase14_382cards_backup.sql`.                      |
|                   | 3. Stop idle historical containers (`nfc-mvp-db-1`, `nfc-mvp-redis-1`) to free host RAM.  |
|                   | 4. Maintain volume `nfc-mvp_postgres_data` intact on disk.                                |
| Rollback Plan     | `docker compose -p nfc-mvp up -d` brings historical stack back online instantly.          |
+-------------------+-------------------------------------------------------------------------------------------+
```

---

## 7. Deserkhoone AI Stack Classification

- **Classification**: **C. Ephemeral / Development Test Environment for AI Photography** `[CONFIRMED FACT]`.
- **Technical Evidence**:
  - `[CONFIRMED FACT]`: Container `deserkhoone_app-backend-run-727bb00107bd` process list shows:
    `python manage.py test ai_photography`
  - `[CONFIRMED FACT]`: Database `deserkhoone_app-db-1` contains **0 tables** (ephemeral SQLite / test fixture DB).
  - `[CONFIRMED FACT]`: Main live store is hosted on `deserkhoone-backend-1` (port `8000`), with `deserkhoone-db-1` holding **81 production tables** (port `5432`).
  - `[CONFIRMED FACT]`: Main production stack has zero dependencies on `deserkhoone_app`.

---

## 8. Trading AI Topology Lock

- **Topological Confirmation**:
  - `[CONFIRMED FACT]`: `D:\work\trade` is the **Parent Git Repository** on branch `main` (Head: `212a15f`).
  - `[CONFIRMED FACT]`: `D:\work\trade\trade-mvp` is an **Independent Nested Git Repository** on branch `feature/mvp-foundation` (Head: `1f7ff16`), with its own self-contained `.git` repository.
  - `[CONFIRMED FACT]`: The Docker container `trading-ai-mvp` bind-mounts `D:\work\trade\trade-mvp:/app` and publishes port `8202`.
- **Git Risk Assessment**:
  - `[CONFIRMED FACT]`: `D:\work\trade` lists `trade-mvp/` as an untracked directory. It is NOT tracked as a broken gitlink or dirty index.
  - `[CONFIRMED FACT]`: Committing inside `D:\work\trade\trade-mvp` pushes to `origin/feature/mvp-foundation` without affecting `D:\work\trade`.
- **Architectural Policy**: **PERMANENT TOPOLOGY LOCK**. Keep both folders strictly preserved in their current locations.

---

## 9. Docker Host Access Policy Verification

| Project | Service | Host Port | Docker Host Binding | Access Mode | Justification / Tool Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TapNow NFC** | FastAPI API | `8300` | `0.0.0.0:8300->8000` | **Host Accessible** | Storefront Vite Proxy & Public API |
| **TapNow NFC** | PostgreSQL | — | Internal (`5432/tcp`) | **Internal Docker Only** | Security / Microservice isolation |
| **Trading AI** | FastAPI API | `8202` | `0.0.0.0:8202->8000` | **Host Accessible** | Strategy Dashboard & Public API |
| **Trading AI** | PostgreSQL | — | Internal (`5432/tcp`) | **Internal Docker Only** | Dedicated service isolation |
| **Trading AI** | Redis 7 | — | Internal (`6379/tcp`) | **Internal Docker Only** | Internal stream cache |
| **MegaMeals** | Django API | `8001` | `0.0.0.0:8001->8000` | **Host Accessible** | NutriMenu Web Application |
| **MegaMeals** | PostgreSQL | `5433` | `0.0.0.0:5433->5432` | **Host Accessible** | Local Inspection via **DBeaver / pgAdmin** |
| **MegaMeals** | Redis 7 | `6380` | `0.0.0.0:6380->6379` | **Host Accessible** | Async task inspection via **Redis Insight** |
| **Deserkhoone**| Django API | `8000` | `0.0.0.0:8000->8000` | **Host Accessible** | Confectionery Store Web API |
| **Deserkhoone**| PostgreSQL | `5432` | `0.0.0.0:5432->5432` | **Host Accessible** | Local DB Management (**81 Production Tables**) |
| **Deserkhoone**| Redis 7 | `6379` | `0.0.0.0:6379->6379` | **Host Accessible** | Shopping cart & session monitoring |

---

## 10. Cross-Project Documentation Governance

### Analysis: Storing Workspace Docs in TapNow Repository
The documentation suite is currently located at:
`C:\Users\Alireza\Documents\GitHub\NFC\docs\infrastructure\`

Because it documents **TapNow**, **Trading AI**, **MegaMeals**, and **Deserkhoone**, we evaluated the three governance options:

```
+---------------------------------------------------------------------------------------------------------------+
| DOCUMENTATION GOVERNANCE OPTIONS                                                                              |
+-------------------+-------------------------------------------------------------------------------------------+
| OPTION A          | Keep all documents in `NFC/docs/infrastructure/`.                                         |
| (Current)         | - Advantages: Immediate availability, zero file moving, zero workspace disruption.        |
|                   | - Disadvantages: TapNow Git repo contains notes on other projects.                        |
+-------------------+-------------------------------------------------------------------------------------------+
| OPTION B          | Split: Keep TapNow docs in `NFC/docs/`, replicate project-specific docs to each repo.     |
| (Recommended)     | - `NFC/docs/infrastructure/` -> TapNow-specific architecture & Phase 14 reconciliation.   |
|                   | - `D:\work\trade\trade-mvp\docs/` -> Trading AI Git topology & service map.               |
|                   | - `megameals/docs/` -> MegaMeals port & database map.                                     |
|                   | - `deserkhoone/docs/` -> Deserkhoone production & AI photo subsystem map.                |
+-------------------+-------------------------------------------------------------------------------------------+
| OPTION C          | Create a dedicated workspace repository (e.g. `workspace-devops`).                        |
| (Future Option)   | - Advantages: Clean central DevOps hub.                                                   |
|                   | - Disadvantages: Overhead of maintaining an additional repository.                         |
+-------------------+-------------------------------------------------------------------------------------------+
```
*Recommendation*: Retain Option A for now, with an approval gate to transition to **Option B** whenever convenient.

---

## 11. Comprehensive Backup Strategy

```
========================================================================================================================
UNIFIED BACKUP SPECIFICATIONS
========================================================================================================================

1. TapNow Historical Hardware Cards (382 Cards):
   docker exec nfc-mvp-db-1 pg_dump -U nfc_user -d nfc_db --clean --if-exists > "C:\Users\Alireza\Documents\GitHub\NFC\backups\nfc_phase14_382cards_backup.sql"

2. TapNow Active Production / MVP Database (Phase 16):
   docker exec nfc-db-1 pg_dump -U nfc_user -d nfc_db --clean --if-exists > "C:\Users\Alireza\Documents\GitHub\NFC\backups\nfc_active_phase16_backup.sql"

3. Deserkhoone Production Database (81 Tables):
   docker exec deserkhoone-db-1 pg_dump -U deserkhoone_user -d deserkhoone_db --clean --if-exists > "D:\work\deser git\deserkhoone\backups\deserkhoone_prod_81tables_backup.sql"

4. MegaMeals Database:
   docker exec megameals_app-db-1 pg_dump -U megameals_user -d megameals_db --clean --if-exists > "C:\Users\Alireza\Documents\GitHub\megameals\backups\megameals_db_backup.sql"

5. Trading AI Database:
   docker exec trading-ai-mvp-db pg_dump -U trading_ai -d trading_ai --clean --if-exists > "D:\work\trade\trade-mvp\backups\trading_ai_db_backup.sql"
```

---

## 12. Cleanup Candidate Classification Matrix

| Resource | Type | Category | Evidence & Justification |
| :--- | :--- | :--- | :--- |
| `nfc-mvp_postgres_data` | Volume | **RED (DO NOT TOUCH)** | Holds **382 physical/QC cards**. Volume must be permanently retained. |
| `D:\work\trade` | Directory | **RED (DO NOT TOUCH)** | Historical foundation repository (`main`). Foundational algorithms. |
| `D:\work\trade\trade-mvp` | Directory | **RED (DO NOT TOUCH)** | Active modern Trading AI service. |
| `deserkhoone_postgres_data`| Volume | **RED (DO NOT TOUCH)** | **81 Production Tables** of live store data. |
| `nfc-mvp-db-1` / `redis-1` | Containers | **YELLOW (SAFE AFTER BACKUP)**| Idle historical stack. Safe to stop after `nfc_phase14_382cards_backup.sql` is verified. |
| `deserkhoone_app-backend-run`| Container | **YELLOW (SAFE AFTER APPROVAL)**| Ephemeral AI photography test container. |
| `tat_*` / `new_*` | Images/Vols| **YELLOW (SAFE AFTER APPROVAL)**| Inactive June 2026 projects. Safe to archive. |
| `megameals_postgres_data` | Volume | **GREEN (SAFE NOW)** | Older unattached volume superseded by `megameals_app_postgres_data`. |
| `deserkhoone_media_volume` | Volume | **GREEN (SAFE NOW)** | Inactive volume superseded by `deserkhoone_media_files`. |

---

## 13. Distinct Human Approval Gates

```
============================================================
HUMAN APPROVAL GATE A — TAPNOW HISTORICAL BACKUP & STOP
============================================================
PROPOSAL ID: APPROVAL-A
TITLE: Verified Backup of 382 Cards & Idle Container Stop
EXACT ACTION:
1. Execute read-only pg_dump of nfc-mvp-db-1:
   C:\Users\Alireza\Documents\GitHub\NFC\backups\nfc_phase14_382cards_backup.sql
2. Verify backup file size and integrity.
3. Stop idle containers: docker stop nfc-mvp-db-1 nfc-mvp-redis-1
4. Retain volume nfc-mvp_postgres_data on disk.
AFFECTED RESOURCES: nfc-mvp-db-1, nfc-mvp-redis-1
RISK LEVEL: Low.
ROLLBACK: docker compose -p nfc-mvp up -d
APPROVAL REQUIRED: YES

============================================================
HUMAN APPROVAL GATE B — DESERKHOONE AI TEST CONTAINER STOP
============================================================
PROPOSAL ID: APPROVAL-B
TITLE: Stop Idle Ephemeral AI Photography Test Runner
EXACT ACTION:
docker stop deserkhoone_app-backend-run-727bb00107bd
AFFECTED RESOURCES: deserkhoone_app-backend-run-727bb00107bd
RISK LEVEL: Very Low.
ROLLBACK: docker compose -p deserkhoone_app run backend python manage.py test ai_photography
APPROVAL REQUIRED: YES

============================================================
HUMAN APPROVAL GATE C — DOCUMENTATION GOVERNANCE
============================================================
PROPOSAL ID: APPROVAL-C
TITLE: Adopt Option B (Project-Specific Documentation Alignment)
EXACT ACTION:
Distribute project-specific architecture summaries to each respective project's `docs/` folder while maintaining a central master index in TapNow NFC.
RISK LEVEL: Zero.
APPROVAL REQUIRED: YES
```

---

## 14. Final Canonical Architecture State

```
========================================================================================================================
FINAL CANONICAL ARCHITECTURE STATE
========================================================================================================================

CANONICAL PROJECT 1: TapNow NFC Platform
├── Path:       C:\Users\Alireza\Documents\GitHub\NFC
├── Stack:      Compose "nfc" (nfc-app-1 on :8300, nfc-db-1 on internal DB, Vite UI on :5173)
└── Archive:    nfc-mvp (382 pre-provisioned cards preserved)

CANONICAL PROJECT 2: Trading AI MVP
├── Path:       D:\work\trade\trade-mvp
├── Stack:      Compose "trade-mvp" (trading-ai-mvp on :8202, DB/Redis internal)
└── Foundation: D:\work\trade (Branch: main, Historical Trading Foundation)

CANONICAL PROJECT 3: MegaMeals Platform
├── Path:       C:\Users\Alireza\Documents\GitHub\megameals\megameals
└── Stack:      Compose "megameals_app" (Backend on :8001, DB on :5433, Redis on :6380, qcluster)

CANONICAL PROJECT 4: Deserkhoone Store & AI Photography
├── Path:       D:\work\deser git\deserkhoone\deserkhoone
└── Stacks:     "deserkhoone" (Store Backend on :8000, DB on :5432 with 81 tables, Redis on :6379)
                "deserkhoone_app" (AI Photography Subsystem & Test Runner)
```

---

### Final Safety Confirmation
- **NO DESTRUCTIVE ACTIONS WERE PERFORMED.**
- **All 17 containers** remain running, healthy, and operational.
- **All 4 active project stacks** remain 100% available on their established localhost endpoints.
- **All historical databases and volumes** are intact.
