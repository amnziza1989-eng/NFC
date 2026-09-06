# 08. Backup & Recovery Plan

## 1. Verified Backup Specifications

Before any future database reconciliation or container retirement, the following non-destructive backup procedures must be utilized.

### A. TapNow Historical Cards Backup (382 Cards)
```powershell
# Command:
docker exec nfc-mvp-db-1 pg_dump -U nfc_user -d nfc_db --clean --if-exists > "C:\Users\Alireza\Documents\GitHub\NFC\backups\nfc_phase14_382cards_backup.sql"

# Restore Procedure:
docker exec -i <target-db-container> psql -U nfc_user -d nfc_db < "C:\Users\Alireza\Documents\GitHub\NFC\backups\nfc_phase14_382cards_backup.sql"
```

### B. TapNow Active Production / MVP Database (Phase 16)
```powershell
# Command:
docker exec nfc-db-1 pg_dump -U nfc_user -d nfc_db --clean --if-exists > "C:\Users\Alireza\Documents\GitHub\NFC\backups\nfc_active_phase16_backup.sql"

# Restore Procedure:
docker exec -i nfc-db-1 psql -U nfc_user -d nfc_db < "C:\Users\Alireza\Documents\GitHub\NFC\backups\nfc_active_phase16_backup.sql"
```

### C. Deserkhoone Production Database (81 Tables)
```powershell
# Command:
docker exec deserkhoone-db-1 pg_dump -U deserkhoone_user -d deserkhoone_db --clean --if-exists > "D:\work\deser git\deserkhoone\backups\deserkhoone_prod_81tables_backup.sql"

# Restore Procedure:
docker exec -i deserkhoone-db-1 psql -U deserkhoone_user -d deserkhoone_db < "D:\work\deser git\deserkhoone\backups\deserkhoone_prod_81tables_backup.sql"
```

### D. MegaMeals Database
```powershell
# Command:
docker exec megameals_app-db-1 pg_dump -U megameals_user -d megameals_db --clean --if-exists > "C:\Users\Alireza\Documents\GitHub\megameals\backups\megameals_db_backup.sql"
```

### E. Trading AI Database
```powershell
# Command:
docker exec trading-ai-mvp-db pg_dump -U trading_ai -d trading_ai --clean --if-exists > "D:\work\trade\trade-mvp\backups\trading_ai_db_backup.sql"
```

---

## 2. Backup Verification Procedure
1. Verify output file size is non-zero (`Test-Path` + `Length > 10KB`).
2. Inspect the file header (`Get-Content -Head 15`) to confirm valid PostgreSQL dump format (`PostgreSQL database dump`).
3. Retain backups in permanent, Git-ignored `backups/` directories.
