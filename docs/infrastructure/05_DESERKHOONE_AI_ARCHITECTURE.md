# 05. Deserkhoone Architecture & AI Photography Subsystem

## 1. Context: Why Two Stacks Exist

Our inspection of `D:\work\deser git\deserkhoone\deserkhoone` and the running containers uncovered the operational reason for the coexistence of `deserkhoone` and `deserkhoone_app`:

```
+---------------------------------------------------------------------------------------------------------+
| STACK 1: "deserkhoone" (Active Main E-Commerce Application)                                             |
| - Containers:     deserkhoone-backend-1, deserkhoone-db-1, deserkhoone-redis-1                          |
| - Ports:          Host :8000 (Backend), Host :5432 (Postgres), Host :6379 (Redis)                       |
| - Database:       deserkhoone_postgres_data (Contains 81 Production Tables: products, users, orders)    |
| - Runtime Role:   Active live Django store.                                                             |
+---------------------------------------------------------------------------------------------------------+
                                                     ▲
                                                     │ Parallel Development
                                                     ▼
+---------------------------------------------------------------------------------------------------------+
| STACK 2: "deserkhoone_app" (AI Image Generation & Photography Test Sandbox)                             |
| - Containers:     deserkhoone_app-backend-run-727bb00107bd, deserkhoone_app-db-1, deserkhoone_app-redis-1|
| - Origin:         Triggered by: `docker compose run backend python manage.py test ai_photography`       |
| - Database:       deserkhoone_app_postgres_data (0 public tables; acts as isolated test sandbox)       |
| - Runtime Role:   Supports the AI-driven photography and image-generation workflows.                    |
+---------------------------------------------------------------------------------------------------------+
```

---

## 2. Technical Findings

1. **Production Data Integrity**:
   - `deserkhoone-db-1` holds the entire production database with **81 tables**. It is completely separate from the test runner.
2. **AI Subsystem Origin**:
   - The user develops Deserkhoone in parallel with an AI-assisted photography agent. When `docker compose run` was dispatched with the project name `Deserkhoone_app` (specified in `docker-compose.yml`), Docker Desktop created the sandbox stack `deserkhoone_app`.
3. **Space in Path**:
   - Source is located at `D:\work\deser git\deserkhoone\deserkhoone`. The directory name contains a space (`deser git`), which requires quoting in scripts.

---

## 3. Recommended Future Architecture

- **Unified Project Model**: The AI Photography subsystem and the Main Store belong to the same product ecosystem.
- **Action**: Keep the main application (`deserkhoone-backend-1`) active on port `8000`. The ephemeral sandbox container `deserkhoone_app-backend-run` can remain or be stopped without risking any of the 81 production tables.
