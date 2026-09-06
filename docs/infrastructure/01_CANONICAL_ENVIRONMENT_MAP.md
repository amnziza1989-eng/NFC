# 01. Canonical Environment Map

## Executive Summary
This document provides the authoritative mapping of all active, historical, and supporting projects across the user's host environment (`C:` and `D:` drives) and Docker infrastructure.

---

## 1. Active Projects

### 1.1 TapNow NFC Review Platform
- **Project Name**: TapNow NFC MVP
- **Canonical Path**: `C:\Users\Alireza\Documents\GitHub\NFC`
- **Git Root**: `C:\Users\Alireza\Documents\GitHub\NFC`
- **Current Branch**: `feature/mvp-foundation`
- **Head Commit**: `bb389961f6c4b336ba89b3a8edbbe60e2901db61`
- **Remote**: Local repository tracking feature branch
- **Compose Project Name**: `nfc`
- **Compose Files**: `docker-compose.yml`, `docker-compose.dev.yml`
- **Active Services**:
  - `app` (`nfc-app-1`): FastAPI Web API, internal port 8000 mapped to host `8300`
  - `db` (`nfc-db-1`): PostgreSQL 16 Alpine, internal port 5432
  - `frontend`: Vite React Dev Server, host port `5173`
- **Inactive / Historical Services**: `nfc-mvp` (historical companion stack containing Phase 1-14 seed data)
- **Host Ports**: `5173` (Frontend), `8300` (Backend API)
- **Database**: PostgreSQL 16 (`nfc_db`, volume `nfc_postgres_data`)
- **Redis**: None in active `nfc` compose (uses fallback / in-memory or historical `nfc-mvp` on internal network)
- **Volumes**: `nfc_postgres_data`
- **Networks**: `nfc_default`
- **Bind Mounts**: `C:\Users\Alireza\Documents\GitHub\NFC:/app`
- **Environment Files**: `.env`, `.env.example`
- **Lifecycle Status**: `ACTIVE_PRODUCTION`
- **Classification**: `ACTIVE_PRODUCTION`

---

### 1.2 Trading AI MVP
- **Project Name**: Trading AI MVP Foundation
- **Canonical Path**: `D:\work\trade\trade-mvp`
- **Git Root**: `D:\work\trade\trade-mvp` (Nested Git repository with independent `.git` directory)
- **Current Branch**: `feature/mvp-foundation`
- **Head Commit**: `1f7ff16ab456f58987899aaccef8def2bf751a8e`
- **Remote**: `origin https://github.com/amnziza1989-eng/trade.git`
- **Compose Project Name**: `trade-mvp`
- **Compose Files**: `docker-compose.yml`
- **Active Services**:
  - `app` (`trading-ai-mvp`): FastAPI backend, internal 8000 mapped to host `8202`
  - `db` (`trading-ai-mvp-db`): PostgreSQL 16, internal port 5432
  - `redis` (`trading-ai-mvp-redis`): Redis 7 Alpine, internal port 6379
- **Host Ports**: `8202` (Backend API)
- **Database**: PostgreSQL 16 (`trading_ai`, volume `trade-mvp_trading_ai_postgres_data`)
- **Redis**: Redis 7 (`trade-mvp_trading_ai_redis_data`)
- **Volumes**: `trade-mvp_trading_ai_postgres_data`, `trade-mvp_trading_ai_redis_data`
- **Networks**: `trade-mvp_default`
- **Bind Mounts**: `D:\work\trade\trade-mvp:/app`
- **Environment Files**: `.env`, `.env.example`
- **Lifecycle Status**: `ACTIVE_DEVELOPMENT`
- **Classification**: `ACTIVE_DEVELOPMENT`

---

### 1.3 MegaMeals NutriMenu Platform
- **Project Name**: MegaMeals / NutriMenu
- **Canonical Path**: `C:\Users\Alireza\Documents\GitHub\megameals\megameals`
- **Git Root**: `C:\Users\Alireza\Documents\GitHub\megameals`
- **Current Branch**: `main`
- **Head Commit**: `54bef918d7565f32eb7f030d380b6ccf10dde959`
- **Remote**: `origin https://github.com/amnziza1989-eng/megameals.git`
- **Compose Project Name**: `megameals_app`
- **Compose Files**: `docker-compose.yml`
- **Active Services**:
  - `backend` (`megameals_app-backend-1`): Django / Daphne, internal 8000 mapped to host `8001`
  - `qcluster` (`megameals_app-qcluster-1`): Django Q worker
  - `db` (`megameals_app-db-1`): PostgreSQL 15, internal 5432 mapped to host `5433`
  - `redis` (`megameals_app-redis-1`): Redis 7 Alpine, internal 6379 mapped to host `6380`
- **Host Ports**: `8001` (Backend), `5433` (PostgreSQL), `6380` (Redis)
- **Database**: PostgreSQL 15 (`megameals_db`, volume `megameals_app_postgres_data`)
- **Redis**: Redis 7 (`megameals_app_redis_data`)
- **Volumes**: `megameals_app_postgres_data`, `megameals_app_redis_data`, `megameals_app_media_files`
- **Networks**: `megameals_app_default`
- **Bind Mounts**: `C:\Users\Alireza\Documents\GitHub\megameals\megameals:/app`
- **Environment Files**: Environment variables configured in docker-compose.yml
- **Lifecycle Status**: `ACTIVE_DEVELOPMENT`
- **Classification**: `ACTIVE_DEVELOPMENT`

---

### 1.4 Deserkhoone Main Store & AI Photography
- **Project Name**: Deserkhoone Confectionery & AI Photography Subsystem
- **Canonical Path**: `D:\work\deser git\deserkhoone\deserkhoone`
- **Git Root**: `D:\work\deser git\deserkhoone`
- **Current Branch**: `main`
- **Head Commit**: `aca647b2ac87ec3c4996473145fa6069a5287a91`
- **Remote**: `origin https://github.com/amnziza1989-eng/deserkhoone.git`
- **Compose Project Names**: `deserkhoone` (Main App) & `deserkhoone_app` (AI Photography runner)
- **Compose Files**: `docker-compose.yml`, `docker-compose.prod.yml`
- **Active Services**:
  - `backend` (`deserkhoone-backend-1`): Django web application, internal 8000 mapped to host `8000`
  - `db` (`deserkhoone-db-1`): PostgreSQL 15, internal 5432 mapped to host `5432` (81 production tables)
  - `redis` (`deserkhoone-redis-1`): Redis 7 Alpine, internal 6379 mapped to host `6379`
  - `backend-run` (`deserkhoone_app-backend-run-727bb00107bd`): AI photography test & runner container
  - `ai_db` (`deserkhoone_app-db-1`): PostgreSQL 15 ephemeral instance
  - `ai_redis` (`deserkhoone_app-redis-1`): Redis 7 Alpine ephemeral instance
- **Host Ports**: `8000` (Backend API), `5432` (PostgreSQL), `6379` (Redis)
- **Database**: PostgreSQL 15 (`deserkhoone_db`, volume `deserkhoone_postgres_data`)
- **Redis**: Redis 7 (`deserkhoone_redis_data`)
- **Volumes**: `deserkhoone_postgres_data`, `deserkhoone_redis_data`, `deserkhoone_media_files`, `deserkhoone_app_postgres_data`, `deserkhoone_app_redis_data`, `deserkhoone_app_media_files`
- **Networks**: `deserkhoone_default`, `deserkhoone_app_default`
- **Bind Mounts**: `D:\work\deser git\deserkhoone\deserkhoone:/app`
- **Environment Files**: `.env`
- **Lifecycle Status**: `ACTIVE_PRODUCTION` / `ACTIVE_DEVELOPMENT`
- **Classification**: `ACTIVE_PRODUCTION`

---

## 2. Historical & Supporting Projects

### 2.1 Historical Trading Foundation
- **Path**: `D:\work\trade`
- **Git Root**: `D:\work\trade`
- **Branch**: `main` (Head: `212a15f5ba0322e020d9142f97f76c314671ae67`)
- **Remote**: `origin https://github.com/amnziza1989-eng/trade.git`
- **Classification**: `HISTORICAL_FOUNDATION`
- **Purpose**: Original algorithmic trading indicators, technical analyzers, market scan scripts, and MT5 notebooks. Intentionally preserved as reference foundation.

### 2.2 Historical TapNow NFC Stack (`nfc-mvp`)
- **Path**: `C:\Users\Alireza\Documents\GitHub\NFC`
- **Containers**: `nfc-mvp-db-1`, `nfc-mvp-redis-1`
- **Database**: PostgreSQL 16 (`nfc_db` on volume `nfc-mvp_postgres_data`, holding **382 physical card records**)
- **Classification**: `HISTORICAL_FOUNDATION`
- **Purpose**: Holds Phase 13/14 factory pre-provisioned cards. Must remain accessible or backed up.

### 2.3 Historical Project `tat`
- **Path**: `C:\Users\Alireza\Documents\GitHub\tat`
- **Git Root**: `C:\Users\Alireza\Documents\GitHub\tat`
- **Branch**: `main` (Head: `05372266a4829b2c92c6c94d3694173bdb8f8c0a`)
- **Remote**: `origin https://github.com/alisamadian/tat.git`
- **Docker Resources**: Images `tat-backend:latest`, `tat-cron:latest`; Volumes `tat_postgres_data`, `tat_redis_data`, `tat_media_files`
- **Classification**: `ARCHIVE`

### 2.4 Historical Project `new`
- **Path**: `C:\Users\Alireza\Documents\GitHub\new`
- **Git Root**: `C:\Users\Alireza\Documents\GitHub\new`
- **Branch**: `main` (Head: `ee884422f85ff4e2d36e4c3444c2d14078af789a`)
- **Remote**: `origin https://github.com/amnziza1989-eng/new.git`
- **Docker Resources**: Images `new-backend:latest`, `new-cron:latest`; Volumes `new_postgres_data`, `new_redis_data`, `new_media_files`
- **Classification**: `ARCHIVE`

### 2.5 Standalone Static Copies
- `D:\work\trade 2`: Loose copy of early trade scripts (`ARCHIVE`)
- `C:\Users\Alireza\Documents\GitHub\trading-ai-mvp-foundation-v0.1`: Standalone export (`ARCHIVE`)
- `C:\Users\Alireza\Documents\GitHub\python api test`: Test scripts (`ARCHIVE`)
