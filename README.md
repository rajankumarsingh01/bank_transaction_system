# 🏦 Ledger — Production-Grade Bank Transaction Management System

A full-stack, double-entry ledger and transaction processing platform with real-time ML-based fraud detection. Built to reflect the architecture and engineering practices used in real fintech systems — not a CRUD demo.

<p>
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white">
  <img alt="Express" src="https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white">
  <img alt="MongoDB" src="https://img.shields.io/badge/MongoDB-Replica%20Set-47A248?logo=mongodb&logoColor=white">
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black">
  <img alt="Python" src="https://img.shields.io/badge/Python-FastAPI-009688?logo=fastapi&logoColor=white">
  <img alt="Docker" src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white">
  <img alt="Tests" src="https://img.shields.io/badge/Tests-25%20passing-brightgreen">
  <img alt="CI" src="https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?logo=githubactions&logoColor=white">
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#️-architecture)
- [Tech Stack](#-tech-stack)
- [Core Features](#-core-features)
- [Fraud Detection](#-fraud-detection-microservice)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [API Documentation](#-api-documentation)
- [Testing](#-testing)
- [CI/CD](#-cicd)
- [Key Design Decisions](#️-key-design-decisions)
- [Roadmap](#️-roadmap)

---

## 🎯 Overview

Ledger is a modular-monolith backend (Node.js/Express + MongoDB) paired with a Python ML microservice for fraud scoring and a React dashboard for end users. It implements the parts of a real banking system that are usually skipped in portfolio projects: **ACID-safe money movement, immutable audit trails, authorization boundaries, fraud screening, structured observability, and automated testing.**

**Highlights:**
- Double-entry ledger with balances computed on-demand — never stored, so they can never drift out of sync
- MongoDB multi-document transactions with session-scoped balance checks to close race-condition windows
- Real-time fraud scoring via a dedicated ML microservice (0.946 ROC-AUC)
- JWT auth with rotating refresh tokens and replay-attack protection
- 25 automated integration tests that caught and fixed a real authorization vulnerability during development
- Fully containerized with Docker Compose; CI/CD via GitHub Actions on every push

---

## 🏗️ Architecture

┌──────────────────┐        HTTPS/JSON        ┌───────────────────────┐
│   React Client    │ ───────────────────────> │    Node.js API         │
│  (Vite + Tailwind) │ <─────────────────────── │  Express 5, JWT auth   │
└──────────────────┘                           └───────────┬───────────┘
│
┌────────────────────┼────────────────────┐
│                    │                    │
▼                    ▼                    ▼
┌──────────────────┐  ┌─────────────────┐  ┌────────────────┐
│ MongoDB Replica   │  │  FastAPI ML      │  │  SMTP (Email)   │
│ Set (transactions) │  │  Fraud Scoring   │  │  Notifications  │
└──────────────────┘  └─────────────────┘  └────────────────┘

**Why a separate ML microservice?** It isolates the Python/scikit-learn stack from the Node runtime, allows the fraud model to be retrained and redeployed independently of the API, and mirrors how fraud detection is architected in real payment systems — a scoring service the transaction pipeline calls out to, rather than business logic baked into the model.

**Why a MongoDB replica set instead of standalone?** Multi-document ACID transactions (required to atomically debit one account and credit another) are only available on a replica set — non-negotiable for correct money movement.

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| **Backend API** | Node.js, Express 5 |
| **Database** | MongoDB (Replica Set), Mongoose |
| **Auth** | JWT (access + rotating refresh tokens), bcrypt |
| **Validation** | Zod |
| **Logging** | Pino, Pino-HTTP (structured JSON, request-ID correlation, secret redaction) |
| **API Docs** | OpenAPI 3.0 / Swagger UI |
| **Testing** | Jest, Supertest, MongoDB Memory Server (in-memory replica set) |
| **ML Service** | Python, FastAPI, scikit-learn, pandas, joblib |
| **Frontend** | React 19, Vite, Tailwind CSS, TanStack Query, Zustand, React Router |
| **Containerization** | Docker, Docker Compose (multi-stage builds) |
| **CI/CD** | GitHub Actions |

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

## 📂 Project Structure

Bank-System/
├── server/                        # Node.js backend
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/               # Register, login, refresh rotation, logout
│   │   │   ├── accounts/           # Account lifecycle, balance
│   │   │   ├── transactions/       # Transfers, reversals, history, fraud integration
│   │   │   ├── users/
│   │   │   └── notifications/      # Email service
│   │   └── shared/
│   │       ├── middleware/         # Auth, rate limiting, validation, error handling
│   │       ├── logger/             # Pino structured logging + request correlation
│   │       ├── config/             # Env validation (Zod), DB connection
│   │       ├── database/           # MongoDB transaction session wrapper
│   │       ├── swagger/            # OpenAPI spec generation
│   │       └── utils/
│   ├── tests/
│   │   ├── integration/            # 25 Jest + Supertest test cases
│   │   └── helpers/
│   ├── Dockerfile                  # Multi-stage production build
│   ├── docker-compose.yml          # App + Mongo replica set + ML service
│   └── docker-compose.dev.yml      # Hot-reload dev environment
│
├── ml-service/                     # Python fraud detection microservice
│   ├── app/
│   │   ├── main.py                 # FastAPI app + /predict, /health
│   │   ├── model.py                # Model loading + inference
│   │   ├── schemas.py              # Pydantic request/response models
│   │   └── artifacts/              # Trained model (generated, gitignored)
│   ├── train/
│   │   ├── generate_data.py        # Synthetic transaction data generator
│   │   └── train_model.py          # Training pipeline + metrics report
│   └── Dockerfile
│
├── client/                         # React (Vite) frontend
│   └── src/
│       ├── api/                    # Axios client + resource API modules
│       ├── components/{layout,ui}  # Sidebar, layout, reusable UI primitives
│       ├── pages/                  # Login, Register, Dashboard, Transfer, History, Account
│       ├── routes/                 # Auth guard
│       └── store/                  # Zustand auth store (persisted)
│
└── .github/workflows/               # CI/CD pipelines
├── backend-ci.yml               # Lint, test, Docker build verification
└── ml-service-ci.yml            # Train model, verify app import, Docker build

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- Python 3.11+
- Docker & Docker Compose (recommended path)

### Option 1 — Docker (recommended)

```bash
# 1. Train the fraud model once (artifact is gitignored and not built into the image otherwise)
cd ml-service
python -m venv venv && venv\Scripts\activate   # Windows; use source venv/bin/activate on Linux/Mac
pip install -r requirements.txt
python train/generate_data.py
python train/train_model.py
cd ..

# 2. Bring up backend + MongoDB replica set + ML service
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
cp .env.example .env   # fill in your values
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

Interactive OpenAPI 3.0 docs are served at **`/api-docs`** once the backend is running — including a working "Authorize" flow to test protected routes directly from the browser.

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
| `POST` | `/api/transactions/system/initial-funds` | System-user-only account funding |

---

## 🧪 Testing

25 integration tests run against an **in-memory MongoDB replica set** (not mocks), so real Mongoose sessions and multi-document transactions are actually exercised.

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

Both must pass before code is considered mergeable.

---

## ⚖️ Key Design Decisions

- **Balances are derived, not stored.** Computed via ledger aggregation on every read. Costs a bit more per read; makes balance corruption structurally impossible.
- **The ledger is immutable.** Reversals append new counter-entries rather than editing or deleting history — standard double-entry accounting practice, and it keeps a complete audit trail intact.
- **Fraud detection fails open, by explicit choice.** A downed ML service degrades to "unscored" rather than halting all transfers. Documented here as a trade-off, not a gap — the alternative (fail-closed) is arguably more correct for a real bank and would be revisited before production use with real funds.
- **MongoDB replica set is required, not optional.** Multi-document transactions don't exist on a standalone MongoDB instance; this constrains local dev and Docker setup but is non-negotiable for correctness.
- **Access/refresh token split with rotation.** Short-lived access tokens limit the blast radius of a leaked token; refresh rotation means a stolen (and later reused) refresh token is detectable and rejected.

---

## 🛣️ Roadmap

- [x] Core ledger, auth, and transaction engine
- [x] ML fraud detection microservice
- [x] Structured logging & observability
- [x] Automated testing (25 integration tests)
- [x] Dockerization
- [x] CI/CD pipeline
- [x] React frontend dashboard
- [ ] Deployment to Render/Railway with MongoDB Atlas
- [ ] Admin endpoints for system-user provisioning
- [ ] Real-world (non-synthetic) dataset for the fraud model

---

## 👤 Author

**Rajan Kumar Singh**
Built as a portfolio project demonstrating production backend engineering practices — Global Group of Institutes, Amritsar.





