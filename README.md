# PulseOps — API Monitoring & Incident Alerting PaaS (MERN Stack)

[![CI](https://github.com/vinay23is/pulseops-api-monitoring-paas/actions/workflows/ci.yml/badge.svg)](https://github.com/vinay23is/pulseops-api-monitoring-paas/actions/workflows/ci.yml)

A production-style API uptime monitoring platform — the same concept as a mini Better Stack / UptimeRobot / Datadog synthetic monitor — built on the **MERN stack (MongoDB, Express.js, React, Node.js)**, demonstrating backend engineering, distributed queues, observability, and containerization end to end.

> **Original Spring Boot Project:** The original Java 21 / Spring Boot 3 implementation is preserved in [`./spring-boot-original/backend`](./spring-boot-original/backend).

**Demo credentials** (automatically seeded on startup):
```text
Email:    demo@pulseops.dev
Password: demo123
```

---

## Tech Stack (MERN)

- **Frontend:** React 18, Vite 5, Tailwind CSS 3, Recharts, Lucide Icons, Axios
- **Backend:** Node.js 20+, Express.js 4, Mongoose 8
- **Database:** MongoDB 7 / 8
- **Queue/Cache:** Redis 7 (Redis Streams for check dispatch, with transparent in-memory fallback)
- **Auth & Security:** Stateless JWT (`jsonwebtoken`), BCrypt password hashing (`bcryptjs`), CORS
- **Observability:** Prometheus metrics (`prom-client`), health probe (`/actuator/health`), Grafana
- **API Documentation:** OpenAPI 3.0 / Swagger UI (`swagger-ui-express`)
- **Testing:** Jest, Supertest
- **Containerization:** Docker & Docker Compose (MongoDB, Redis, Backend, Frontend, Prometheus, Grafana)

---

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                        Docker Compose                          │
│                                                                │
│  ┌──────────────┐    ┌──────────────────────────────────────┐ │
│  │   Frontend   │    │             Backend (8080)           │ │
│  │  React/Vite  │───▶│  Node.js · Express.js · Mongoose     │ │
│  │   Nginx:80   │    │                                      │ │
│  └──────────────┘    │  ┌─────────────┐ ┌────────────────┐ │ │
│                      │  │  REST APIs  │ │ Scheduler (30s)│ │ │
│                      │  │  (JWT Auth) │ └───────┬────────┘ │ │
│                      │  └─────────────┘         │          │ │
│                      │                    ┌──────▼──────┐   │ │
│                      │                    │Redis Stream /│  │ │
│                      │                    │In-Memory Q  │   │ │
│                      │                    └──────┬──────┘   │ │
│                      │  ┌─────────────┐   ┌──────▼──────┐  │ │
│                      │  │   MongoDB   │◀──│Worker Engine│  │ │
│                      │  │  (Mongoose) │   │ (Async I/O) │  │ │
│                      │  └─────────────┘   └─────────────┘  │ │
│                      └──────────────────────────────────────┘ │
│                                                                │
│  ┌──────────────┐    ┌──────────────┐                        │
│  │   MongoDB    │    │    Redis 7   │                        │
│  └──────────────┘    └──────────────┘                        │
│  ┌──────────────┐    ┌──────────────┐                        │
│  │  Prometheus  │───▶│   Grafana    │                        │
│  └──────────────┘    └──────────────┘                        │
└────────────────────────────────────────────────────────────────┘
```

A `MonitorScheduler` runs every 30s and identifies due monitors. It dispatches them onto a queue (Redis Streams `monitor-checks` or native in-memory queue). The `MonitorWorker` consumes the tasks, executes outbound HTTP health checks against target URLs, and records latency, response status, and success/failure in MongoDB. Failures open or increment incidents; recoveries automatically resolve open incidents and fire alert notifications (in-app, mock email, webhook).

---

## Key Features

- **JWT Authentication & Multi-Tenancy:** User registration, login, bcrypt password hashing, stateless JWT authorization. Users own projects, projects own monitors.
- **Asynchronous Check Engine:** Decoupled check-dispatch pipeline with scheduling, timeout enforcement, and response tracking.
- **Incident Lifecycle:** Auto-open on failure, failure count tracking, auto-resolution on recovery.
- **Multi-Channel Alerting:** IN_APP, MOCK_EMAIL, and WEBHOOK notification channels with delivery tracking.
- **Project-Scoped API Keys & Rate Limiting:** BCrypt-hashed API keys with clear prefix lookup and sliding-window rate limiting (60 req/min per key).
- **Public Status Pages:** Unauthenticated public status page at `/status/:slug` and `/api/v1/status/:slug`.
- **Prometheus Metrics & Health Probe:** Custom counters and histograms for check volume, success/failures, latencies, and dispatch batch sizes at `/actuator/prometheus`, with health probe at `/actuator/health`.
- **Automated Data Seeder:** Generates demo account, sample SaaS project, 3 monitors, historical check logs, resolved incident, and alerts on startup.

---

## Project Structure

```text
pulseops-api-monitoring-paas/
├── backend/
│   ├── src/
│   │   ├── config/          # MongoDB (db.js), Redis (redis.js), DataSeeder (dataSeeder.js)
│   │   ├── controllers/     # Auth, Projects, Monitors, Incidents, Alerts, Dashboard, StatusPage, ApiKey, Event, Home
│   │   ├── middleware/      # JWT auth, centralized error handler, validators
│   │   ├── models/          # Mongoose schemas: User, Project, Monitor, CheckResult, Incident, Alert, ApiKey, CustomEvent
│   │   ├── routes/          # Express route definitions for all resources
│   │   ├── services/        # Business logic services matching original Spring Boot service layer
│   │   ├── jobs/            # Scheduler and Worker check engine
│   │   ├── utils/           # JWT helper, Swagger / OpenAPI documentation
│   │   ├── validators/      # Request input validation rules
│   │   ├── app.js           # Express app setup and middleware configuration
│   │   └── server.js        # Entry point: DB connection, seeder, server startup
│   ├── tests/               # 27 Jest & Supertest integration tests
│   ├── .env.example         # Environment template
│   ├── Dockerfile           # Node.js production container build
│   ├── package.json         # Node.js dependencies and test/start scripts
│   └── README.md
├── frontend/
│   ├── src/                 # React 18, Vite 5, Tailwind CSS dashboard UI
│   ├── package.json
│   └── Dockerfile
├── spring-boot-original/    # Preserved original Spring Boot project
├── docker-compose.yml       # Multi-container orchestration (Mongo, Redis, Backend, Frontend, Prometheus, Grafana)
└── README.md
```

---

## Prerequisites

- **Node.js:** v20.x or higher
- **npm:** v10.x or higher
- **MongoDB:** v7.x or higher running locally (or MongoDB Atlas / Docker)
- **Redis:** v7.x (optional; fallback to in-memory mode enabled automatically if Redis is unavailable)
- **Docker & Docker Compose:** (optional, for containerized execution)

---

## Environment Configuration

Backend configuration in `backend/.env`:

```env
PORT=8080
MONGODB_URI=mongodb://localhost:27017/pulseops
REDIS_URL=redis://localhost:6379
JWT_SECRET=pulseops-super-secret-key-minimum-256-bits-long-for-hs256-algorithm
JWT_EXPIRATION=86400000
RATE_LIMIT_PER_MINUTE=60
SCHEDULER_INTERVAL_MS=30000
SCHEDULER_ENABLED=true
WORKER_ENABLED=true
```

---

## Running Locally Without Docker

### 1. Start Backend

```bash
cd backend
npm install
npm test      # runs all 27 integration tests
npm start     # starts backend on http://localhost:8080
```

### 2. Start Frontend

```bash
cd frontend
npm install
npm run dev   # starts Vite dev server on http://localhost:5173
```

Open your browser at `http://localhost:5173`.
Login using:
- **Email:** `demo@pulseops.dev`
- **Password:** `demo123`

---

## Running with Docker Compose

```bash
docker compose up --build
```

| Service | URL | Credentials / Notes |
|---|---|---|
| Frontend | http://localhost:5173 | Web UI |
| Backend API | http://localhost:8080 | REST API |
| Swagger UI | http://localhost:8080/swagger-ui.html | Interactive OpenAPI Docs |
| Health Probe | http://localhost:8080/actuator/health | `{"status":"UP"}` |
| Prometheus | http://localhost:9090 | Scrapes `/actuator/prometheus` |
| Grafana | http://localhost:3000 | `admin` / `admin` |

---

## API Documentation & Key Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/` | Service metadata and endpoints | No |
| `GET` | `/actuator/health` | Health check probe | No |
| `GET` | `/actuator/prometheus` | Prometheus metrics scrape | No |
| `GET` | `/swagger-ui.html` | Swagger UI documentation | No |
| `POST` | `/api/v1/auth/register` | Register new user account | No |
| `POST` | `/api/v1/auth/login` | Login and receive JWT | No |
| `GET` | `/api/v1/dashboard` | Dashboard overview statistics | Bearer JWT |
| `GET` | `/api/v1/projects` | List current user's projects | Bearer JWT |
| `POST` | `/api/v1/projects` | Create a new project | Bearer JWT |
| `GET` | `/api/v1/projects/:id` | Get project by ID | Bearer JWT |
| `DELETE` | `/api/v1/projects/:id` | Delete project and cascade resources | Bearer JWT |
| `GET` | `/api/v1/projects/:projectId/monitors` | List monitors for a project | Bearer JWT |
| `POST` | `/api/v1/projects/:projectId/monitors` | Create a monitor | Bearer JWT |
| `PUT` | `/api/v1/projects/:projectId/monitors/:id` | Update a monitor | Bearer JWT |
| `PATCH` | `/api/v1/projects/:projectId/monitors/:id/toggle` | Toggle monitor active state | Bearer JWT |
| `DELETE` | `/api/v1/projects/:projectId/monitors/:id` | Delete a monitor | Bearer JWT |
| `GET` | `/api/v1/incidents` | List user incidents | Bearer JWT |
| `GET` | `/api/v1/alerts` | List user alerts | Bearer JWT |
| `GET` | `/api/v1/status/:slug` | Public status page for project | No |
| `POST` | `/api/v1/projects/:projectId/api-keys?name=...` | Create an API key | Bearer JWT |
| `GET` | `/api/v1/projects/:projectId/api-keys` | List project API keys | Bearer JWT |
| `DELETE` | `/api/v1/projects/:projectId/api-keys/:keyId` | Revoke an API key | Bearer JWT |
| `POST` | `/api/v1/events` | Submit custom event | API Key Header/Body |

---

## Testing

Run the full integration test suite:

```bash
cd backend
npm test
```

Verifies:
- Actuator health and Prometheus metrics endpoints
- OpenAPI / Swagger spec generation
- User registration, duplicate detection, and login authentication
- Project creation, retrieval, listing, and deletion
- Monitor creation, listing, updating, and active toggling
- API key generation with secure hashing and revocation
- Rate-limited custom event ingestion
- Public status page data aggregation
- Centralized error handling and validation error formats
- Cascade deletion across projects, monitors, check results, incidents, and alerts

---

## License

MIT
