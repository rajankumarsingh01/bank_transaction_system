# 🏦 Backend Ledger — Bank Transaction Management System

A production-grade, double-entry ledger and transaction processing system built as a modular monolith, featuring real-time ML-based fraud detection, JWT auth with refresh token rotation, and full observability. Built to demonstrate backend engineering practices used in real fintech systems.

---

## 🎯 Highlights

- **Double-entry ledger** — every transaction creates immutable debit/credit entries; balance is always derived, never stored directly (prevents drift/corruption)
- **ACID-safe transfers** — MongoDB multi-document transactions with session-scoped balance checks to prevent race conditions
- **ML fraud detection microservice** — FastAPI + scikit-learn service scores every transfer in real time (0.946 ROC-AUC on synthetic data)
- **JWT auth with refresh token rotation** — short-lived access tokens, rotating refresh tokens stored hashed in DB, replay-attack protection
- **25 automated integration tests** — Jest + Supertest + MongoDB Memory Server (replica set), covering auth, accounts, transactions, fraud blocking, and edge cases
- **CI/CD pipeline** — GitHub Actions runs the full test suite and verifies Docker builds on every push
- **Fully containerized** — Docker Compose spins up Node backend + MongoDB replica set + Python ML microservice with a single command
- **Structured logging** — Pino with request-ID correlation and automatic secret redaction
- **Self-documenting API** — OpenAPI 3.0 / Swagger UI at `/api-docs`

---

## 🏗️ Architecture