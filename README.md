# 🏦 Ledger — Production-Grade Bank Transaction Management System

A full-stack, double-entry ledger and transaction processing platform with real-time ML-based fraud detection, live notifications, and background job processing. Built to reflect the architecture and engineering practices used in real fintech systems — not a CRUD demo.

<p>
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white">
  <img alt="Express" src="https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white">
  <img alt="MongoDB" src="https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white">
  <img alt="Redis" src="https://img.shields.io/badge/Redis-Upstash-DC382D?logo=redis&logoColor=white">
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black">
  <img alt="Python" src="https://img.shields.io/badge/Python-FastAPI-009688?logo=fastapi&logoColor=white">
  <img alt="Docker" src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white">
  <img alt="Tests" src="https://img.shields.io/badge/Tests-25%20passing-brightgreen">
  <img alt="CI" src="https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?logo=githubactions&logoColor=white">
  <img alt="Deployed" src="https://img.shields.io/badge/Status-Live-brightgreen">
</p>

**🔗 Live App:** [bank-transaction-system-eight.vercel.app](https://bank-transaction-system-eight.vercel.app)
**📖 API Docs (Swagger):** [ledger-backend-x4rd.onrender.com/api-docs](https://ledger-backend-x4rd.onrender.com/api-docs)
**🤖 ML Service Docs:** [ledger-ml-service.onrender.com/docs](https://ledger-ml-service.onrender.com/docs)
**💻 Source:** [github.com/rajankumarsingh01/bank_transaction_system](https://github.com/rajankumarsingh01/bank_transaction_system)

> ⚠️ Backend and ML service run on Render's free tier and sleep after 15 minutes of inactivity — the first request after a while may take 30–50 seconds to wake up. Subsequent requests are fast.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#️-architecture)
- [Tech Stack](#-tech-stack)
- [Core Features](#-core-features)
- [Fraud Detection Microservice](#-fraud-detection-microservice)
- [Real-Time & Background Processing](#-real-time--background-processing)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [API Documentation](#-api-documentation)
- [Testing](#-testing)
- [CI/CD](#️-cicd)
- [Deployment](#-deployment)
- [Key Design Decisions](#️-key-design-decisions)
- [Roadmap](#️-roadmap)
- [Author](#-author)

---

## 🎯 Overview

Ledger is a modular-monolith backend (Node.js/Express + MongoDB) paired with a Python ML microservice for fraud scoring, a Redis-backed job queue for async work, and a React dashboard for end users. It implements the parts of a real banking system that are usually skipped in portfolio projects: **ACID-safe money movement, immutable audit trails, authorization boundaries, real-time fraud screening, structured observability, automated testing, and CI/CD** — deployed and running live, not just running on `localhost`.

**Highlights:**
- Double-entry ledger with balances computed on-demand — never stored, so they can never drift out of sync
- MongoDB multi-document transactions with session-scoped balance checks to close race-condition windows
- Real-time fraud scoring via a dedicated ML microservice (0.946 ROC-AUC)
- JWT auth with rotating refresh tokens and replay-attack protection
- Live transaction notifications over WebSockets (Socket.IO)
- Background job processing (BullMQ + Redis) for async emails and scheduled recurring payments
- An admin fraud-review panel with system-wide risk analytics
- 25 automated integration tests that caught and fixed a real authorization vulnerability during development
- Fully containerized with Docker Compose; CI/CD via GitHub Actions on every push
- Deployed end-to-end on free-tier infrastructure (Render, Vercel, MongoDB Atlas, Upstash)

---

## 🏗️ Architecture

```
                         HTTPS / WebSocket
   ┌────────────────┐   ───────────────────>   ┌──────────────────────────┐
   │  React Client   │                          │       Node.js API         │
   │ (Vercel, Vite)  │   <───────────────────   │  Express 5, JWT, Socket.IO│
   └────────────────┘                          └─────────────┬────────────┘
                                                               │
                     ┌───────────────┬───────────────────┬────┴────────────┬────────────────┐
                     │               │                   │                 │                │
                     ▼               ▼                   ▼                 ▼                ▼
            ┌─────────────────┐ ┌──────────┐  ┌──────────────────┐ ┌────────────────┐ ┌──────────────┐
            │  MongoDB Atlas   │ │  Redis   │  │    FastAPI ML     │ │ BullMQ Workers │ │ SMTP (Email) │
            │  (Replica Set)   │ │(Upstash) │  │  Fraud Scoring     │ │ (async jobs)   │ │ Notifications│
            └─────────────────┘ └──────────┘  └──────────────────┘ └────────────────┘ └──────────────┘
```

**Why a separate ML microservice?** It isolates the Python/scikit-learn stack from the Node runtime, allows the fraud model to be retrained and redeployed independently of the API, and mirrors how fraud detection is architected in real payment systems — a scoring service the transaction pipeline calls out to, rather than business logic baked into the model.

**Why a MongoDB replica set instead of standalone?** Multi-document ACID transactions (required to atomically debit one account and credit another) are only available on a replica set — non-negotiable for correct money movement. MongoDB Atlas provisions this by default even on the free tier.

**Why Redis + BullMQ?** Two concrete use cases, not just "because it's common": (1) email delivery is decoupled from the request/response cycle so a slow SMTP call never blocks a transfer response, and (2) scheduled recurring payments are implemented as BullMQ repeatable jobs rather than a custom polling loop.

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| **Backend API** | Node.js, Express 5 |
| **Database** | MongoDB Atlas (Replica Set), Mongoose |
| **Cache / Queue** | Redis (Upstash), BullMQ |
| **Real-time** | Socket.IO (JWT-authenticated WebSocket connections) |
| **Auth** | JWT (access + rotating refresh tokens), bcrypt |
| **Validation** | Zod |
| **Logging** | Pino, Pino-HTTP (structured JSON, request-ID correlation, secret redaction) |
| **API Docs** | OpenAPI 3.0 / Swagger UI |
| **Testing** | Jest, Supertest, MongoDB Memory Server (in-memory replica set) |
| **ML Service** | Python, FastAPI, scikit-learn, pandas, joblib |
| **Frontend** | React 19, Vite, Tailwind CSS, TanStack Query, Zustand, React Router, Recharts |
| **Containerization** | Docker, Docker Compose (multi-stage builds) |
| **CI/CD** | GitHub Actions |
| **Deployment** | Render (API + ML service), Vercel (frontend), MongoDB Atlas, Upstash Redis |

---

## 🔐 Core Features

### Authentication
- Register/login with bcrypt-hashed passwords and Zod-validated input
- Short-lived JWT access tokens (15 min) + long-lived refresh tokens (7 days)
- **Refresh token rotation** — every refresh call issues a new token pair and immediately invalidates the old refresh token (hashed at rest), closing the replay-attack window
- Token blacklisting on logout
- Rate limiting on auth endpoints (10 req / 15 min)

### Accounts
- One account per authenticated user, INR currency
- Status lifecycle: `ACTIVE` → `FROZEN` ⇄ `ACTIVE` → `CLOSED` (terminal)
- Accounts can only be closed with a zero balance
- Balance is computed on-demand from the ledger via aggregation — not a stored field — eliminating an entire class of balance-drift bugs

### Transactions
- **Idempotency keys** prevent duplicate processing of the same transfer, even under retries
- **Session-scoped balance verification** — the balance is re-checked *inside* the MongoDB transaction (not just before it), closing the check-then-commit race condition
- **Ownership verification** — a transfer can only be initiated from an account the caller owns
- **Reversal via counter-entries** — completed transactions can be reversed without ever mutating or deleting the original ledger rows, preserving a complete, tamper-evident audit trail
- **Fraud screening on every transfer** — high-risk transfers (score ≥ 0.7) are blocked with a `403` before any funds move
- Paginated transaction history per account
- **Spending analytics** — sent/received breakdown and daily trend over a rolling 30-day window, computed via aggregation

### Admin / Fraud Review
- Role-gated (`isAdmin`) endpoints separate from the system-funding role
- System-wide stats: total volume, transaction counts, average risk score, flagged-transaction count
- A dedicated review queue of elevated- and high-risk transactions, sorted by risk score

### Observability
- Structured JSON logs (Pino) with per-request correlation IDs (`x-request-id`), propagated in both logs and error responses
- Automatic redaction of tokens, passwords, and cookies from all logs
- Centralized error handling distinguishing client errors (`warn`) from server errors (`error`)

---

## 🤖 Fraud Detection Microservice

A FastAPI service that scores every transfer for fraud risk before it's committed.

**Model:** Logistic Regression (scikit-learn), chosen for interpretability over black-box alternatives — appropriate for a domain where explainability matters.

**Features engineered per transaction:**

| Feature | Signal |
|---|---|
| `amount` | Raw transaction size |
| `hour` | Time-of-day pattern (fraud skews toward late-night hours) |
| `sender_txn_count_last_hour` | Velocity check — rapid-fire transactions from one sender |
| `amount_vs_avg_ratio` | How unusual this amount is relative to the sender's own history |
| `is_new_receiver` | First-time transfer to this recipient |
| `account_age_days` | New accounts making large transfers are higher risk |

**Training data:** 8,000 synthetic transactions (~12% fraud rate) with deliberately injected noise and ambiguous edge cases — early iterations without noise produced an unrealistic 1.00 ROC-AUC by learning overly clean decision boundaries; the noisy dataset was a deliberate fix to make the model's confidence reflect real-world uncertainty.

**Result:** 0.946 ROC-AUC, 83% recall on held-out test data.

**Design trade-off — fail-open:** if the ML service is unreachable, transfers proceed with a logged warning rather than blocking all banking operations. This was a conscious choice for this project to preserve availability; a regulated production system moving real funds would more likely choose fail-closed, and that trade-off is called out explicitly here rather than left implicit.

---

## ⚡ Real-Time & Background Processing

**Socket.IO** — each authenticated client opens a JWT-verified WebSocket connection. When a transfer completes, both the sender and receiver get an instant `transaction:received` / `transaction:sent` event — the receiver sees a live toast notification and their balance updates without a page refresh.

**BullMQ + Redis** — two production job queues:
- **Email queue:** registration and transaction emails are enqueued instead of awaited inline, so a slow SMTP provider never adds latency to an API response. Jobs retry up to 3 times with exponential backoff on failure.
- **Scheduled payments queue:** users can set up recurring transfers (daily/weekly/monthly) as BullMQ repeatable jobs with cron patterns, executed by a dedicated worker that reuses the same transfer/fraud-check pipeline as manual transfers.

---

## 📂 Project Structure

```
Bank-System/
├── server/                          # Node.js backend
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/                # Register, login, refresh rotation, logout
│   │   │   ├── accounts/            # Account lifecycle, balance
│   │   │   ├── transactions/        # Transfers, reversals, history, analytics, scheduled payments
│   │   │   ├── admin/               # Fraud review, system stats
│   │   │   ├── users/
│   │   │   └── notifications/       # Email service
│   │   └── shared/
│   │       ├── middleware/          # Auth (user/system/admin), rate limiting, validation, errors
│   │       ├── logger/              # Pino structured logging + request correlation
│   │       ├── socket/              # Socket.IO connection manager (JWT-authenticated)
│   │       ├── queues/              # BullMQ queues + workers (email, scheduled payments)
│   │       ├── config/              # Env validation (Zod), DB connection
│   │       ├── database/            # MongoDB transaction session wrapper
│   │       ├── swagger/             # OpenAPI spec generation
│   │       └── utils/
│   ├── tests/
│   │   ├── integration/             # 25 Jest + Supertest test cases
│   │   └── helpers/
│   ├── Dockerfile                   # Multi-stage production build
│   ├── docker-compose.yml           # App + Redis + ML service (Atlas used for MongoDB)
│   └── docker-compose.dev.yml       # Hot-reload dev environment
│
├── ml-service/                      # Python fraud detection microservice
│   ├── app/
│   │   ├── main.py                  # FastAPI app + /predict, /health
│   │   ├── model.py                 # Model loading + inference
│   │   ├── schemas.py               # Pydantic request/response models
│   │   └── artifacts/               # Trained model (generated, gitignored)
│   ├── train/
│   │   ├── generate_data.py         # Synthetic transaction data generator
│   │   └── train_model.py           # Training pipeline + metrics report
│   ├── render-build.sh              # Render build step (train model at deploy time)
│   └── Dockerfile
│
├── client/                          # React (Vite) frontend
│   └── src/
│       ├── api/                     # Axios client (auto-refresh) + resource API modules
│       ├── components/
│       │   ├── layout/              # Sidebar, layout
│       │   └── ui/                  # Charts, reusable UI primitives
│       ├── hooks/                   # useSocket (real-time notifications)
│       ├── pages/                   # Login, Register, Dashboard, Transfer, History, Account, Admin
│       ├── routes/                  # Auth guard
│       └── store/                   # Zustand auth store (persisted)
│
└── .github/
    └── workflows/                   # CI/CD pipelines
        ├── backend-ci.yml           # Lint, test, Docker build verification
        └── ml-service-ci.yml        # Train model, verify app import, Docker build
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- Python 3.11+
- Docker & Docker Compose (recommended path)
- A MongoDB Atlas connection string (free M0 cluster) and an Upstash Redis URL for local dev, or run Redis locally via Docker

### Option 1 — Docker (recommended)

```bash
# 1. Train the fraud model once (artifact is gitignored and not built into the image otherwise)
cd ml-service
python -m venv venv && venv\Scripts\activate   # Windows; use source venv/bin/activate on Linux/Mac
pip install -r requirements.txt
python train/generate_data.py
python train/train_model.py
cd ..

# 2. Set MONGO_URI (Atlas) and other secrets in server/.env (see .env.example)

# 3. Bring up backend + Redis + ML service
cd server
docker compose up --build
```

- API → `http://localhost:3000`
- Swagger docs → `http://localhost:3000/api-docs`
- ML service docs → `http://localhost:8001/docs`

### Option 2 — Manual (three terminals)

**Backend:**
```bash
cd server
npm install
cp .env.example .env   # fill in your values (Atlas URI, Redis URL, secrets)
npm run dev
```

**ML Service:**
```bash
cd ml-service
python -m venv venv && venv\Scripts\activate
pip install -r requirements.txt
python train/generate_data.py
python train/train_model.py
uvicorn app.main:app --reload --port 8001
```

**Frontend:**
```bash
cd client
npm install
npm run dev
```

Frontend runs at `http://localhost:5173` and proxies `/api` to the backend (see `client/vite.config.js`).

---

## 📖 API Documentation

Interactive OpenAPI 3.0 docs are served at **`/api-docs`** — [live here](https://ledger-backend-x4rd.onrender.com/api-docs) — including a working "Authorize" flow to test protected routes directly from the browser.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login |
| `POST` | `/api/auth/refresh` | Rotate refresh token |
| `POST` | `/api/auth/logout` | Logout + blacklist token |
| `POST` | `/api/accounts` | Create account |
| `GET` | `/api/accounts/me` | Get account + live balance |
| `PATCH` | `/api/accounts/me/status` | Freeze / reactivate / close account |
| `POST` | `/api/transactions` | Transfer funds (fraud-screened) |
| `POST` | `/api/transactions/:id/reverse` | Reverse a completed transaction |
| `GET` | `/api/transactions/me` | Paginated transaction history |
| `GET` | `/api/transactions/me/analytics` | Sent/received summary + daily trend |
| `POST` | `/api/transactions/system/initial-funds` | System-user-only account funding |
| `POST` | `/api/scheduled-payments` | Create a recurring payment schedule |
| `GET` | `/api/scheduled-payments` | List recurring payments |
| `POST` | `/api/scheduled-payments/:id/cancel` | Cancel a recurring payment |
| `GET` | `/api/admin/transactions/flagged` | Elevated/high-risk transactions (admin only) |
| `GET` | `/api/admin/stats` | System-wide transaction stats (admin only) |

---

## 🧪 Testing

25 integration tests run against an **in-memory MongoDB replica set** (not mocks), so real Mongoose sessions and multi-document transactions are actually exercised. Redis-dependent code (BullMQ queues, Socket.IO) is mocked at the module boundary so the suite has no external service dependencies and runs identically in CI.

```bash
cd server
npm test              # run once
npm run test:watch    # watch mode
npm run test:coverage # with coverage report
```

**Coverage includes:** registration/login edge cases, refresh token rotation and reuse rejection, session/token blacklisting, insufficient-balance rejection, same-account transfer rejection, idempotency-key collision handling, transaction reversal (including double-reversal rejection), account freeze/close rules, and unauthorized cross-account transfer attempts.

> **A real bug this suite caught:** an early version of the transfer endpoint validated that both accounts existed and were active, but never verified that the caller actually *owned* the `fromAccount`. Any authenticated user who knew another account's ID could have initiated a transfer from it. A test explicitly asserting on this ("should reject transfer from someone else's account") failed against the real implementation, exposing the gap before it shipped. Fixed with an explicit ownership check and covered by a permanent regression test.

---

## ⚙️ CI/CD

Two GitHub Actions workflows run automatically on every push (and can be triggered manually):

- **`backend-ci.yml`** — installs dependencies, runs the full Jest suite, then verifies the production Docker image builds
- **`ml-service-ci.yml`** — installs dependencies, regenerates training data, retrains the model, verifies the FastAPI app imports cleanly, then verifies the Docker image builds

Both must pass before code is considered mergeable. Note: CI (verification) and CD (Render/Vercel auto-deploy) currently run independently — CI failing does not yet block a deploy — a gap called out here deliberately rather than glossed over; wiring deploy hooks behind a passing CI run is on the roadmap.

---

## 🌐 Deployment

Deployed entirely on free-tier infrastructure across four providers:

| Service | Provider | Notes |
|---|---|---|
| Frontend | Vercel | Auto-deploys from `main`, SPA rewrites configured via `vercel.json` |
| Backend API | Render | Free web service; build step installs deps only |
| ML Microservice | Render | Free web service; build step retrains the model at deploy time (`render-build.sh`), since the model artifact isn't committed to git |
| Database | MongoDB Atlas | Free M0 cluster — replica set by default, so transactions work out of the box |
| Redis | Upstash | Free tier, TLS connection (`rediss://`) |

**Notable deployment issue resolved:** Render's default Python version initially resolved to a version too new for prebuilt `scikit-learn` wheels, forcing a slow source compile that timed out on the free tier. Pinned via a `PYTHON_VERSION` environment variable to a version with prebuilt wheel support, cutting ML service build time from a stalled 5+ minutes to under a minute.

---

## ⚖️ Key Design Decisions

- **Balances are derived, not stored.** Computed via ledger aggregation on every read. Costs a bit more per read; makes balance corruption structurally impossible.
- **The ledger is immutable.** Reversals append new counter-entries rather than editing or deleting history — standard double-entry accounting practice, and it keeps a complete audit trail intact.
- **Fraud detection fails open, by explicit choice.** A downed ML service degrades to "unscored" rather than halting all transfers. Documented here as a trade-off, not a gap — the alternative (fail-closed) is arguably more correct for a real bank and would be revisited before production use with real funds.
- **MongoDB replica set is required, not optional.** Multi-document transactions don't exist on a standalone MongoDB instance; this constrains local dev and Docker setup but is non-negotiable for correctness. Using Atlas sidesteps this entirely in both dev and production.
- **Access/refresh token split with rotation.** Short-lived access tokens limit the blast radius of a leaked token; refresh rotation means a stolen (and later reused) refresh token is detectable and rejected.
- **Redis is used for two specific jobs, not generically.** Email delivery and scheduled payment execution — both genuinely benefit from being decoupled from the request/response cycle, rather than Redis being added for its own sake.

---

## 🛣️ Roadmap

- [x] Core ledger, auth, and transaction engine
- [x] ML fraud detection microservice
- [x] Structured logging & observability
- [x] Automated testing (25 integration tests)
- [x] Dockerization
- [x] CI/CD pipeline
- [x] React frontend dashboard
- [x] Real-time notifications (Socket.IO)
- [x] Background job processing (Redis + BullMQ)
- [x] Spending analytics dashboard
- [x] Admin / fraud review panel
- [x] Scheduled recurring payments
- [x] Full deployment (Render + Vercel + Atlas + Upstash)
- [ ] Gate deployment on CI passing (deploy hooks triggered from GitHub Actions)
- [ ] Real-world (non-synthetic) dataset for the fraud model

---

## 👤 Author

**Rajan Kumar Singh**
Built as a portfolio project demonstrating production backend engineering practices — Global Group of Institutes, Amritsar.