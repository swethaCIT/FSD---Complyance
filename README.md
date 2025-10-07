# Invoicing ROI Simulator

Lightweight ROI calculator with a tiny Express backend, SQLite persistence, and a vanilla JS SPA.

## Stack
- Node.js + Express
- SQLite (better-sqlite3)
- Vanilla JS, no framework

## Run Locally
1. Install Node 18+.
2. Install deps:
```
npm i
```
3. Start dev server:
```
npm run dev
```
4. Open `http://localhost:3000`.

## API
- POST `/simulate` → returns `{ inputs, results }`.
- POST `/scenarios` → saves scenario, returns `{ id }`.
- GET `/scenarios` → lists scenarios.
- GET `/scenarios/:id` → fetches a scenario.
- DELETE `/scenarios/:id` → deletes a scenario.
- POST `/report/generate` → returns `{ html }` (email required).

## Env/Config
- No env needed by default.
- DB stored at `data.db` (gitignored).

## Notes
- Internal constants (automation pricing, error rate, ROI boost) live only on the server and are not exposed to the UI.
- The app biases toward positive ROI as required in PRD.

## Deploy
- Any Node host will work (Render, Railway, etc.). Start command: `node backend/server.js`.
