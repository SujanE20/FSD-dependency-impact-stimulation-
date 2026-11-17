# Dependency Impact Analysis Platform

A full-stack MERN application for mapping service dependencies, calculating risk, and tracing the downstream blast radius of a failure.

## Features

- JWT sign-in and account registration with Admin, Architect, Engineer, and Viewer roles
- Systems inventory for services, APIs, databases, and servers
- Interactive dependency graph built with React Flow
- BFS/DFS cascade simulation, path details, severity, and persistent history
- Impact scoring using system criticality, dependency count, and business impact
- Analytics, notifications, audit history, and PDF/CSV report exports
- Responsive dashboard with dark/light theme
- Docker Compose deployment with MongoDB

## Project structure

```text
.
├── client/                 # Vite + React application
│   └── src/
│       ├── components/     # Shared UI
│       ├── pages/          # Dashboard, inventory, map, analytics, reports
│       ├── api.js           # Axios client and JWT header
│       └── store.js         # Redux Toolkit auth and theme state
├── server/
│   └── src/
│       ├── config/          # MongoDB connection
│       ├── middleware/      # JWT auth, RBAC, errors
│       ├── models/          # Mongoose collection schemas
│       ├── routes/          # REST API endpoints
│       ├── utils/           # Risk scoring, graph traversal, audit
│       ├── index.js         # Express entry point
│       └── seed.js          # Sample account and dependency topology
├── Dockerfile
└── docker-compose.yml
```

## Run locally

Prerequisites: Node.js 20+, npm, and MongoDB 7+.

1. Copy `.env.example` to `server/.env` and set `MONGO_URI`, a long random `JWT_SECRET`, and `CLIENT_URL=http://localhost:5173`.
2. Install packages:

   ```powershell
   npm install
   npm install --prefix server
   npm install --prefix client
   ```

3. Add sample data:

   ```powershell
   npm run seed
   ```

4. Start the API and Vite frontend:

   ```powershell
   npm run dev
   ```

   The frontend is at `http://localhost:5173`; the API listens on `http://localhost:5000`.

Seed account: `admin@impact.local` / `ChangeMe123!`. Change the password and remove or disable this account before deploying.

For a deployed frontend, set `VITE_API_URL` to the API base URL (including `/api`). Vite proxies `/api` to the backend only when running the local development server; production deployments should configure a reverse proxy or set that variable.

## Docker deployment

Set `JWT_SECRET` in the shell or an uncommitted `.env` file next to `docker-compose.yml`, then run:

```powershell
docker compose up --build -d
docker compose exec app node server/src/seed.js
```

Open `http://localhost:5000`. The app container serves the compiled Vite assets and the API; MongoDB data is stored in the `mongo-data` volume. Use a managed MongoDB service and TLS-terminating reverse proxy for production. Configure secret rotation, backups, monitoring, allowed CORS origins, and a production-grade account provisioning flow before exposing it publicly.

## REST API

All routes except `/api/auth/login`, `/api/auth/register`, and `/api/health` require `Authorization: Bearer <JWT>`.

| Route | Methods | Purpose |
|---|---|---|
| `/api/auth` | `POST /login`, `POST /register`, `GET /me` | Authentication |
| `/api/users` | `GET`, `PATCH /:id/role` | Admin user and role management |
| `/api/systems` | `GET`, `POST`, `GET /:id`, `PATCH /:id`, `DELETE /:id` | Inventory |
| `/api/dependencies` | `GET`, `POST`, `PATCH /:id`, `DELETE /:id` | Dependency edges |
| `/api/simulations` | `GET`, `POST` | Cascade simulation and history |
| `/api/analytics` | `GET`, `GET /notifications`, `PATCH /notifications/:id/read`, `GET /audit-logs` | Dashboard metrics and activity |
| `/api/reports` | `GET`, `POST /export` | Report history and PDF/CSV export |

Dependency direction is `source → target`: if the source fails, traversal reports reachable targets as potentially impacted. Traversal marks a node visited once so cycles terminate and each downstream system appears only once. BFS returns nearest downstream nodes first; DFS follows a branch before returning to other branches.

## Impact score

The score is clamped to 0–100 and combines criticality weight, number of incoming/outgoing dependency links, and business impact:

```text
min(100, criticalityWeight × 12 + min(dependencyCount, 10) × 4 + businessImpact × 3)
```

Risk bands: Low (0–25), Medium (26–50), High (51–75), Critical (76–100). Tune weights to match your organization's incident and business-impact model.

## Security and operational notes

- Public self-registration creates Viewer accounts. Grant elevated roles only through an Admin account.
- Use a unique random JWT secret and HTTPS in deployed environments.
- The UI is an operational starting point, not a substitute for production review, formal threat modeling, rate limiting, backup policy, and monitoring.
