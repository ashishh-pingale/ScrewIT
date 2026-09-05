# How to Run — ScrewIT (SIH 26099)

A React + TypeScript + Vite frontend backed by a [Convex](https://www.convex.dev/)
backend. The app matches common material descriptions across CPSEs, with pages
for materials, review queue, analytics, audit trail, system integration, and
data ingestion.

## Prerequisites

- **Node.js** `^20.19.0` or `>=22.12.0` (required by Vite 8)
- **npm** (ships with Node)

Check your version with `node --version`.

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Start the Convex backend and the Vite dev server together
npm run dev:all
```

`npm run dev:all` runs both concurrently:

- `npx convex dev` — starts a **local Convex backend**, generates the typed
  client code, and writes `VITE_CONVEX_URL` into `.env.local` automatically.
- `vite` — serves the frontend with hot reload.

Then open **http://localhost:5173** in your browser.

### Seed the database (optional but recommended)

The app ships with a seed script that wipes and repopulates the database with
realistic CPSE material data, national codes, and near-duplicate clusters for
the matching engine:

```bash
npm run seed
```

> `.env.local` is git-ignored and holds local secrets. On a fresh clone it is
> (re)created automatically the first time `convex dev` runs, so there is
> nothing to copy by hand. If Convex prompts you to log in, run `npx convex login`.

## Running the two processes separately

If you prefer separate terminals:

```bash
# Terminal 1 — Convex backend (http://localhost:3210 dashboard)
npx convex dev

# Terminal 2 — Vite dev server (http://localhost:5173)
npm run dev
```

## Production-style build

```bash
npm run build      # typecheck (tsc -b) + production bundle into dist/
npm run preview    # serve the built bundle locally
```

Note: the frontend still talks to Convex, so a deployed/cloud backend (see
below) or a running `convex dev` is required for the app to have data.

### Deploying the backend to Convex cloud

```bash
npx convex login
npx convex deploy
```

After deploying, set the environment variables on your deployment (project
settings → Environment Variables) instead of `.env.local`, and point the app
at the deployed `VITE_CONVEX_URL` (e.g. via a `.env.production` or your host's
env config).

## Available scripts

| Script              | What it does                                        |
| ------------------- | --------------------------------------------------- |
| `npm run dev`       | Vite dev server only (frontend, hot reload)         |
| `npm run dev:all`   | Convex backend + Vite dev server concurrently       |
| `npm run seed`      | Wipe & reseed the Convex database with demo data    |
| `npm run build`     | Typecheck with `tsc -b`, then build into `dist/`    |
| `npm run preview`   | Serve the production build locally                  |
| `npm run lint`      | Run Oxlint                                          |

## Troubleshooting

- **Blank page / Convex errors in the console** — `.env.local` is missing or
  stale. Run `npx convex dev` once to regenerate `VITE_CONVEX_URL`.
- **Port 5173 already in use** — Vite will prompt to pick another port; or pass
  `-- --port 5174` (e.g. `npm run dev -- --port 5174`).
- **`convex/_generated` out of date after pulling changes** — restart
  `convex dev`; it regenerates these files automatically.
- **Seed fails with auth errors** — ensure the local backend is running
  (`npm run dev:all`) before running `npm run seed`.
