# 07. Dependency & Impact Analysis

## 1. Matrix of Structural Dependencies

```
PROJECT        DIRECTORY                  COMPOSE FILE            CONTAINER               VOLUME                      NETWORK
-------------------------------------------------------------------------------------------------------------------------------------------
TapNow NFC     ...\GitHub\NFC             docker-compose.yml      nfc-app-1, nfc-db-1     nfc_postgres_data           nfc_default
Trading AI     D:\work\trade\trade-mvp    docker-compose.yml      trading-ai-mvp, db, red trade-mvp_trading_ai_*      trade-mvp_default
MegaMeals      ...\megameals\megameals    docker-compose.yml      megameals_app-*         megameals_app_*             megameals_app_default
Deserkhoone    ...\deserkhoone\deserkhoone docker-compose.yml     deserkhoone-*           deserkhoone_*               deserkhoone_default
```

---

## 2. Potential Change Impacts & Risk Analysis

| Proposed Operation | What Could Break | Risk Level | Rollback Method |
| :--- | :--- | :--- | :--- |
| **Stopping `nfc-mvp-db-1` without backup** | Loss of 382 factory seed cards and historical QC redirect links. | **HIGH (Data Loss)** | Do NOT stop without creating `nfc_phase14_cards_backup.sql`. |
| **Moving `D:\work\trade\trade-mvp`** | Breaks Docker bind mount (`.:/app`), broken launch scripts, path errors in IDE. | **HIGH (Downtime)** | Retain directory path in place. |
| **Renaming `deserkhoone` Compose Project** | Volume name changes (`deserkhoone_postgres_data` -> `new_postgres_data`), making 81 tables appear empty. | **CRITICAL (App Outage)** | Preserve Compose project name `deserkhoone`. |
| **Changing Host Port `8000`, `8001`, `8202`, `8300`** | Frontend API proxies (e.g. Vite proxy, mobile apps, local scripts) will fail to connect. | **MEDIUM (Client Failure)**| Preserve all established localhost URLs. |
| **Stopping `deserkhoone_app-backend-run`** | AI photography background tests pause. | **LOW (Ephemeral)** | Can be restarted via `docker compose run` whenever needed. |
