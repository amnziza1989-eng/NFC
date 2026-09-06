# Master Infrastructure & Project Architecture Completion Report

## 1. Confirmed Facts

1. **TapNow NFC**:
   - Canonical path: `C:\Users\Alireza\Documents\GitHub\NFC`. Active compose stack `nfc` running `nfc-app-1` (port `8300`) and `nfc-db-1` (12 tables, Phase 16 customer/OTP data).
   - Historical stack `nfc-mvp` is also running, holding `nfc-mvp-db-1` with **382 physical pre-provisioned cards** from Phase 1-14.
2. **Trading AI Platform**:
   - The active Trading AI implementation is in `D:\work\trade\trade-mvp`, running on port `8202` via Compose project `trade-mvp`.
   - `D:\work\trade\trade-mvp` is an independent nested Git repository with its own `.git` tracking branch `feature/mvp-foundation`.
   - `D:\work\trade` is the historical foundation repository on branch `main` (holding foundational indicators, market scan scripts, and MT5 notebooks).
   - Neither repository is a duplicate; both serve distinct roles.
3. **MegaMeals Platform**:
   - Canonical path: `C:\Users\Alireza\Documents\GitHub\megameals\megameals`, running on port `8001`, with PostgreSQL on `5433` and Redis on `6380`.
4. **Deserkhoone Confectionery & AI Photography**:
   - Main e-commerce application is running on port `8000`, with PostgreSQL `deserkhoone-db-1` (81 production tables) on port `5432` and Redis on `6379`.
   - The parallel `deserkhoone_app` stack was spawned by a `docker compose run` command executing tests for the AI photography subsystem.
5. **Host Ports**:
   - All 9 published host ports (`5173`, `8000`, `8001`, `8202`, `8300`, `5432`, `5433`, `6379`, `6380`) are verified to belong to active development and debugging workflows.

---

## 2. Corrected Assumptions

- **Correction 1**: `D:\work\trade` and `D:\work\trade\trade-mvp` are **NOT** competing duplicates. `D:\work\trade` is the intentional historical foundation, and `D:\work\trade\trade-mvp` is the active modern microservice with its own Git lifecycle.
- **Correction 2**: `nfc-mvp-db-1` is **NOT** an empty leftover. It contains **382 pre-provisioned cards and 133 businesses**.
- **Correction 3**: `deserkhoone_app` is **NOT** an accidental duplicate project. It is the test sandbox runner for the AI photography image generation subsystem.
- **Correction 4**: Host port exposure on `5432`, `5433`, `6379`, and `6380` is intentional for local inspection tools (DBeaver, pgAdmin, Redis Insight) and must be preserved.

---

## 3. Safe Actions Completed

1. **Created 10 Authoritative Architecture & Inventory Documents** in `docs/infrastructure/`:
   - `01_CANONICAL_ENVIRONMENT_MAP.md`
   - `02_DOCKER_RESOURCE_OWNERSHIP.md`
   - `03_TAPNOW_DATA_RECONCILIATION.md`
   - `04_TRADING_AI_GIT_TOPOLOGY.md`
   - `05_DESERKHOONE_AI_ARCHITECTURE.md`
   - `06_PORT_AND_HOST_ACCESS_POLICY.md`
   - `07_DEPENDENCY_AND_IMPACT_ANALYSIS.md`
   - `08_BACKUP_AND_RECOVERY_PLAN.md`
   - `09_SAFE_CLEANUP_CANDIDATES.md`
   - `10_FINAL_CANONICAL_ARCHITECTURE.md`
2. **Conducted Read-Only SQL Inspections**: Verified table counts, foreign keys, and card records across all running databases.
3. **Preserved Complete Stability**: Zero containers stopped, zero files moved, zero ports changed, zero data altered.

---

## 4. Consolidated Human Approval Gate

```
============================================================
HUMAN APPROVAL REQUIRED (PROPOSALS FOR FUTURE EXECUTION)
============================================================

PROPOSAL ID: PROP-INFRA-01
TITLE: Backup Historical TapNow Cards & Retire Idle nfc-mvp Containers
EXACT ACTION:
1. Export the 382 cards and 133 businesses from nfc-mvp-db-1 to a permanent SQL dump:
   C:\Users\Alireza\Documents\GitHub\NFC\backups\nfc_phase14_382cards_backup.sql
2. Once the dump is verified, stop the idle historical containers:
   docker stop nfc-mvp-db-1 nfc-mvp-redis-1
AFFECTED PROJECTS: TapNow NFC
AFFECTED CONTAINERS: nfc-mvp-db-1, nfc-mvp-redis-1
AFFECTED VOLUMES: nfc-mvp_postgres_data (Preserved on disk)
WHY THIS IS REQUIRED: Frees host RAM while permanently preserving all 382 card records.
DEPENDENCIES CHECKED: Active TapNow API (nfc-app-1) connects exclusively to nfc-db-1.
BACKUP STATUS: Dump executed and verified before stopping.
RISK LEVEL: Low.
ROLLBACK PLAN: docker compose -p nfc-mvp up -d restores containers in seconds.
APPROVAL REQUIRED: YES

------------------------------------------------------------

PROPOSAL ID: PROP-INFRA-02
TITLE: Stop Ephemeral Deserkhoone AI Photography Test Container
EXACT ACTION:
Stop the standalone one-off test container:
docker stop deserkhoone_app-backend-run-727bb00107bd
AFFECTED PROJECTS: Deserkhoone
AFFECTED CONTAINERS: deserkhoone_app-backend-run-727bb00107bd
WHY THIS IS REQUIRED: It was created for a single test run (`python manage.py test ai_photography`) and is no longer actively executing tests.
DEPENDENCIES CHECKED: Main Deserkhoone store runs on deserkhoone-backend-1 (port 8000).
RISK LEVEL: Very Low.
ROLLBACK PLAN: docker compose -p deserkhoone_app run backend python manage.py test ai_photography
APPROVAL REQUIRED: YES
```

---

## 5. Actions Not Recommended

- **Do NOT delete `D:\work\trade`**: It contains foundational signal logic, technical indicators, and MT5 notebooks.
- **Do NOT move `D:\work\trade\trade-mvp`**: Moving it would break Docker bind mounts and IDE path mappings.
- **Do NOT hide host ports `5432`, `5433`, `6379`, `6380`**: The user relies on these for DBeaver / pgAdmin / Redis Insight.
- **Do NOT prune Docker volumes blindly**: 6 inactive volumes hold historical project states (`tat`, `new`) that should remain preserved until explicitly confirmed for deletion.
