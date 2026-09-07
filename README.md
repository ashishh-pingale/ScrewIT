# ScrewIT



## AI-Driven Standardization and Harmonization of Material Codes Across CPSEs



**ScrewIT** is an AI-powered platform designed to standardize and harmonize material data across Central Public Sector Enterprises (CPSEs).



Different CPSEs may use different material codes, descriptions, units of measurement, and classifications for the same or functionally equivalent materials. This creates duplicate material records and makes it difficult to identify common materials across organizations.



ScrewIT addresses this problem by identifying duplicate, near-duplicate, and functionally equivalent materials and mapping them to a common **National Material Code**, while preserving the original CPSE material codes for traceability.



---



## 🎯 Problem Statement



CPSEs across sectors such as Oil & Gas, Power, Steel, Mining, and Heavy Engineering maintain large material catalogs independently.



The same material may be represented differently across organizations.



For example:



| CPSE | Material Code | Description |

|------|---------------|-------------|

| CPSE A | `PIPE-102` | 2 IN CS PIPE |

| CPSE B | `MAT-5678` | Carbon Steel Pipe 2 Inch |

| CPSE C | `P-209` | CS PIPE 2" |



Although these records may represent the same material, they can be treated as different materials because their codes and descriptions are different.



This can lead to:



- Duplicate material masters

- Inconsistent descriptions and specifications

- Difficulty identifying equivalent materials

- Fragmented procurement information

- Higher inventory

- Limited opportunities for collaborative procurement



---



## 💡 Solution



ScrewIT creates a **common national identity for materials across CPSEs**.



Instead of replacing existing CPSE material codes, ScrewIT maps them to a common National Material Code.



```text

                    NMC-100482

              National Material Code

                        │

          ┌─────────────┼─────────────┐

          ↓             ↓             ↓

       CPSE A         CPSE B        CPSE C

      PIPE-102       MAT-5678       P-209

```

---
# How to Run — ScrewIT (SIH 26099)



A React + TypeScript + Vite frontend backed by a [Convex](https://www.convex.dev/)

backend. The app matches common material descriptions across CPSEs, with pages

for materials, review queue, analytics, audit trail, system integration, and

data ingestion.



## Prerequisites


```text
- **Node.js** `^20.19.0` or `>=22.12.0` (required by Vite 8)

- **npm** (ships with Node)



Check your version with `node --version`.

```

## Quick start



bash

# 1. Install dependencies
```text
npm install
```


# 2. Start the Convex backend and the Vite dev server together
```text
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


