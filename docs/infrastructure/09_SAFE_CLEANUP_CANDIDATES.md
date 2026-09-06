# 09. Safe Cleanup Candidates Analysis

## 1. Candidate Classification

```
RESOURCE                          TYPE         CLASSIFICATION              JUSTIFICATION & RECOMMENDATION
-----------------------------------------------------------------------------------------------------------------------------------------------
megameals_postgres_data           Volume       SAFE_NOW                    Old unattached volume from early "megameals" project. Superseded by megameals_app.
megameals_redis_data              Volume       SAFE_NOW                    Old unattached volume. Superseded by megameals_app_redis_data.
deserkhoone_media_volume          Volume       SAFE_NOW                    Legacy media volume name. Superseded by deserkhoone_media_files.
deserkhoone_static_volume         Volume       SAFE_NOW                    Legacy static files volume.
tat_* / new_* (Images & Volumes)  Image/Vol    REQUIRES_HUMAN_APPROVAL     Historical inactive projects. Safe to prune once user confirms archival.
deserkhoone_app-backend-run       Container    REQUIRES_HUMAN_APPROVAL     Ephemeral AI photography test container. Can be stopped if test run finished.
deserkhoone_app-db-1 / redis-1    Container    REQUIRES_HUMAN_APPROVAL     Ephemeral 0-table test DB for AI photography.
nfc-mvp-db-1 / redis-1            Container    SAFE_AFTER_BACKUP           Contains 382 cards! Safe to stop ONLY after generating verified SQL dump.
D:\work\trade (Parent Repo)       Directory    DO_NOT_TOUCH                Historical trading foundation repository. Must be preserved.
D:\work\trade\trade-mvp           Directory    DO_NOT_TOUCH                Active Trading AI MVP repository.
D:\work\trade 2                   Directory    DO_NOT_TOUCH                Historical script archive.
```

---

## 2. Decision Protocol

- **DO_NOT_TOUCH**: Resources with active dependencies, foundational code, or distinct Git topologies.
- **SAFE_AFTER_BACKUP**: `nfc-mvp-db-1` (requires verified export of the 382 cards before container is stopped).
- **REQUIRES_HUMAN_APPROVAL**: Inactive Docker resources that require explicit user consent.
