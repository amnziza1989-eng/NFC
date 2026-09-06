# 03. TapNow NFC Data Reconciliation

## Critical Safety Assessment: Current vs Historical Database

A deep schema and data comparison was conducted between the active container (`nfc-db-1`) and the historical container (`nfc-mvp-db-1`).

---

## 1. Quantitative Table Comparison

| Table Name | Active DB (`nfc-db-1`) | Historical DB (`nfc-mvp-db-1`) | Delta / Finding |
| :--- | :--- | :--- | :--- |
| `cards` | **1** | **382** | **+381 cards in historical DB!** |
| `businesses` | **5** | **133** | +128 businesses in historical DB |
| `destinations` | **7** | **125** | +118 destinations in historical DB |
| `events` (scans/redirects) | **3** | **290** | +287 scan events in historical DB |
| `orders` (fulfillment) | **6** | **74** | +68 factory orders in historical DB |
| `shop_orders` (storefront) | **4** | **8** | +4 earlier shop orders in historical DB |
| `shop_order_items` | **6** | **13** | +7 items in historical DB |
| `otp_sessions` | **32** | **0** | Active DB contains Phase 16 auth/OTP sessions |
| `customer_identities` | **9** | **0** | Active DB contains Phase 16 customer identities |
| `identity_methods` | **9** | **0** | Active DB contains Phase 16 phone/email links |
| `card_activation_sessions` | **0** | **1** | 1 activation session in historical DB |
| `alembic_version` | `f84133d70bfb` | `4e2a052f42c5` | Active DB has latest debug_code migration |

---

## 2. Qualitative Analysis of the 382 Cards

- **Historical Significance**: The 382 cards in `nfc-mvp-db-1` represent:
  1. Factory seed batches generated during Phase 12-14 testing.
  2. Potential physical test cards and QR codes printed or used during hardware QC validation.
  3. Pre-configured destination redirects (Google Review, Instagram, custom URLs).
- **Active State (`nfc-db-1`)**: Contains newly placed e-commerce test orders (`SHOP-20260829-CSL2`, `SHOP-20260829-WNEG`, etc.) and the customer OTP audit history.

---

## 3. Decision Matrix

| Category | Count | Status / Risk | Recommended Treatment |
| :--- | :--- | :--- | :--- |
| **Historical Pre-provisioned Cards** | 382 | High Value (Physical hardware linkage) | **Preserve & Backup**: Create a full verified SQL dump (`nfc_phase14_cards_backup.sql`). Keep volume intact. |
| **Historical Businesses & Destinations**| 133 / 125 | Medium Value | Preserved in SQL dump. |
| **Active Customer Identities & OTPs** | 9 identities, 32 OTPs | Active Production (Phase 16) | Remains primary active database in `nfc-db-1`. |
| **Conflicting Identifiers** | 0 conflicts | None (UUIDs are disjoint) | No overwrite risk. |

---

## 4. Operational State Determination

**STATE B: Historical data must remain accessible & safely archived.**
- **Immediate Action**: The historical container `nfc-mvp-db-1` must **NOT** be deleted.
- **Maintenance Policy**: A dedicated backup script has been provided to export `nfc-mvp-db-1` to a permanent SQL file prior to any future container cleanup.
