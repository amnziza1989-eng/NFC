# 04. Trading AI Git Topology & Architecture Analysis

## 1. Architectural Relationship: Parent vs Child

Our technical investigation of `D:\work\trade` and `D:\work\trade\trade-mvp` established the following exact Git and filesystem topology:

```
D:\work\trade\ (Git Root #1: Branch 'main')
├── .git/                                 <-- Tracks original algorithmic foundation (Head: 212a15f)
├── crypto_tech_analyzer.py               <-- Original technical analysis indicators
├── data_fetcher.py                       <-- Price & orderbook data fetchers
├── fundamental_fetcher.py                <-- News & macro fetchers
├── indicators.py                         <-- Technical calculation formulas
├── price_monitor.py                      <-- Live price stream daemon
├── scheduler.py                          <-- Background scan scheduler
├── mt5-trading.ipynb                     <-- Jupyter MetaTrader 5 trading notebook
├── crypto_market_report.md               <-- Historical scan outputs
└── trade-mvp\                            <-- Git Root #2: Independent Nested Repository
    ├── .git/                             <-- Independent Git directory (Branch: 'feature/mvp-foundation')
    ├── docker-compose.yml                <-- Active Compose Stack (Project: 'trade-mvp')
    ├── app\                              <-- FastAPI Backend application (Port: 8202)
    ├── .env                              <-- Environment configuration
    ├── alembic\                          <-- Database migrations (trading_ai Postgres)
    └── MASTER_PROJECT_CONTEXT.md         <-- Context documentation for Trading AI MVP
```

---

## 2. Technical Evidence

1. **Independent Git Topologies**:
   - `D:\work\trade`: `git rev-parse --show-toplevel` reports `D:/work/trade`. Branch is `main`.
   - `D:\work\trade\trade-mvp`: `git rev-parse --show-toplevel` reports `D:/work/trade/trade-mvp`. Branch is `feature/mvp-foundation`.
   - `D:\work\trade\trade-mvp\.git` is a distinct, self-contained directory, NOT a git submodule or pointer file.
2. **Docker Runtime Mount**:
   - Container `trading-ai-mvp` is configured with bind mount:
     `D:\work\trade\trade-mvp -> /app`
   - It exclusively runs the new FastAPI code in `trade-mvp`.
3. **Historical Preservation Purpose**:
   - The user intentionally maintains `D:\work\trade` to preserve foundational signal algorithms and MT5 notebooks while developing the modern FastAPI-based AI trading engine inside `trade-mvp`.

---

## 3. Structural Rules & Boundaries

- **Rule 1**: **DO NOT MERGE** `D:\work\trade` and `D:\work\trade\trade-mvp`. They serve distinct roles (Historical Foundation vs Active Microservice).
- **Rule 2**: **DO NOT MOVE** either folder. Moving `trade-mvp` will break the running Docker container bind mount and existing IDE workspaces.
- **Rule 3**: `D:\work\trade 2` and `C:\...\GitHub\trading-ai-mvp-foundation-v0.1` are unversioned historical copies and should remain classified as `ARCHIVE`.
