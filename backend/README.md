# PulseOps Backend (MERN Stack)

Express.js and Node.js REST API with MongoDB/Mongoose for PulseOps API Monitoring PaaS.

## Features
- **Stateless JWT Authentication** with bcrypt password hashing
- **Project & Monitor Management** with multi-tenant isolation
- **Automated Health Check Engine** with background scheduler & worker
- **Incident Lifecycle** (open on failure, failure tracking, auto-resolve on recovery)
- **Multi-channel Alerting** (In-App, Mock Email, Webhook)
- **API Key Management** with prefix lookup & rate limiting (60 req/min)
- **Public Status Pages** (`/api/v1/status/:slug`)
- **Prometheus Observability** (`/actuator/prometheus`) and health probe (`/actuator/health`)
- **OpenAPI / Swagger UI** (`/swagger-ui.html`)
- **Automated Demo Seeding** on startup (`demo@pulseops.dev` / `demo123`)

## Requirements
- Node.js >= 20.x
- npm >= 10.x
- MongoDB >= 7.x (running locally or via connection string)
- Redis >= 7.x (optional; automatically falls back to in-memory mode if absent)

## Setup & Running

```bash
# Install dependencies
npm install

# Run integration tests
npm test

# Start in development mode
npm run dev

# Start in production mode
npm start
```
