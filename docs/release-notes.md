# Release Notes — Studyfy

---

## v3.0.0 (UAS Final)

**Tanggal Rilis:** 2026-06-16

### Apa Baru?

#### 🏗️ Arsitektur Dual-Mode
- Monolith mode (`docker-compose.yml`) untuk development cepat
- Microservices mode (`docker-compose.microservices.yml`) untuk UAS/production
- Production mode (`docker-compose.prod.yml`) tanpa monitoring

#### 🔧 Microservices
- **Auth Service** (port 8001) — register, login, verify token (JWT)
- **Item Service** (port 8002) — CRUD items dengan circuit breaker
- **API Gateway** (Nginx, port 8080) — routing `/auth/*`, `/items`, `/`
- **Circuit Breaker** — failure threshold 5, cooldown 30s, fail fast saat OPEN

#### 📊 Monitoring
- **Prometheus** (port 9090) — metrics collection
- **Grafana** (port 3002) — metrics dashboard
- **In-memory metrics** — p50/p95/p99 latency, error rate, per-endpoint stats
- **Sliding window alert** — CRITICAL log jika error rate > 10% dalam 1 menit

#### 📝 Structured Logging
- JSON format — siap di-parse ELK/Loki
- Correlation ID — tracing request antar service via `X-Correlation-ID`
- Auto-generate UUID atau terima dari client header

#### 📚 Dokumentasi
- `docs/architecture.md` — arsitektur dual-mode + diagram Mermaid + API contract
- `docs/reliability-testing.md` — 9 skenario reliability test (score: 89%)
- `docs/operations-guide.md` — panduan operasional: health check, logging, tracing, troubleshooting
- `docs/deployment-guide.md` — panduan deploy ke Railway / Render
- `docs/git-workflow.md` — branching, commit convention, code review
- README.md diupdate — tech stack, project structure, roadmap

### Perbaikan
- Health check endpoint return `503` saat database down (sebelumnya `200`)
- CORS konfigurasi via environment variable
- Error handling database timeout

### Teknis
- Upgrade FastAPI ke versi terbaru
- PostgreSQL 16 Alpine untuk semua database
- Resource limits per container (CPU + memory)
- Docker multi-stage build
- Makefile automation (up, build, prod, down, logs, test, lint, pr-check)

---

## v2.0.0 (Microservices)

**Tanggal Rilis:** 2026-05-10

### Perubahan
- Decompose monolith ke microservices (auth-service, item-service)
- Implementasi API Gateway (Nginx)
- Structured JSON logging
- In-memory metrics collector
- Circuit breaker pattern
- Retry logic dengan exponential backoff

---

## v1.0.0 (UTS)

**Tanggal Rilis:** 2026-04-29

### Fitur
- Modular monolith dengan FastAPI
- REST API: Auth, User, Class, Material, Assignment, Submission, Grade, Item
- JWT authentication
- React SPA frontend
- Docker Compose orchestration
- Database PostgreSQL
- CI/CD dengan GitHub Actions
