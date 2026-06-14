# Operations Guide — Studyfy

> **Mata Kuliah:** Komputasi Awan — Sistem Informasi ITK  
> **Fase:** Microservices (Minggu 12-14)

Panduan operasional untuk memonitor, troubleshoot, dan maintain sistem **Studyfy** — mencakup health check, logging, request tracing, metrics, troubleshooting, dan escalation path.

---

## Daftar Isi
1. [Health Check](#-health-check)
2. [Logging](#-logging)
3. [Request Tracing](#-request-tracing)
4. [Metrics & Monitoring](#-metrics--monitoring)
5. [Common Troubleshooting](#-common-troubleshooting)
6. [Escalation Path](#-escalation-path)

---

## Health Check

Setiap service memiliki endpoint `/health` untuk mengecek status.

### Service Health Endpoints

| Service | Mode | Endpoint | Source |
|---------|------|----------|--------|
| **Backend (Monolith)** | `docker-compose.yml` | `GET localhost:8000/health` | `backend/main.py:61-78` |
| **API Gateway** | microservices | `GET localhost:8080/health` | `services/gateway/nginx.conf:31-35` |
| **Auth Service** | microservices | `GET localhost:8001/health` | `services/auth-service/main.py:76-81` |
| **Item Service** | microservices | `GET localhost:8002/health` | `services/item-service/main.py:56-68` |

### Backend Monolith (`backend/main.py:61-78`)

Cek koneksi database dengan `SELECT 1`. Return 200 jika sehat, 503 jika tidak.

```bash
curl http://localhost:8000/health
```

**200 — Healthy:**
```json
{"status": "healthy", "service": "backend", "version": "1.0.0", "database": "connected"}
```

**503 — Database Down:**
```json
{"status": "unhealthy", "service": "backend", "version": "1.0.0", "database": "error: (psycopg2.OperationalError) could not connect to server: Connection refused"}
```

### API Gateway (`services/gateway/nginx.conf:31-35`)

Return statis — gateway selalu report healthy selama Nginx berjalan.

```bash
curl http://localhost:8080/health
```

```json
{"status": "healthy", "service": "gateway"}
```

### Auth Service (`services/auth-service/main.py:76-81`)

```bash
curl http://localhost:8001/health
```

```json
{"status": "healthy", "service": "auth-service", "version": "2.0.0"}
```

### Item Service (`services/item-service/main.py:56-68`)

Cek status circuit breaker ke Auth Service.

```bash
curl http://localhost:8002/health
```

**Normal (Circuit CLOSED):**
```json
{
  "status": "healthy",
  "service": "item-service",
  "version": "2.1.0",
  "dependencies": {
    "auth-service": {
      "name": "auth-service",
      "state": "CLOSED",
      "failure_count": 0,
      "total_rejected": 0
    }
  }
}
```

**Degraded (Circuit OPEN):**
```json
{
  "status": "degraded",
  "service": "item-service",
  "dependencies": {
    "auth-service": {
      "state": "OPEN",
      "failure_count": 5,
      "total_rejected": 10
    }
  }
}
```

### Container Healthchecks (Docker)

Setiap container memiliki healthcheck Docker yang berjalan periodik. Cek status:

```bash
docker compose ps
```

Output:
```
NAME                   SERVICE        STATUS
studyfy-db             db             running (healthy)
studyfy-backend        backend        running (healthy)
studyfy-frontend       frontend       running
```

### Quick Health Check (All Services)

```bash
# Monolith mode
docker compose ps
curl http://localhost:8000/health

# Microservices mode
docker compose -f docker-compose.microservices.yml ps
curl http://localhost:8080/health
```

---

## Logging

Semua service menggunakan **JSON structured logging** via `services/shared/logging_config.py`.

### Log Format

```json
{
  "timestamp": "2026-05-03T10:00:00.123Z",
  "level": "INFO",
  "service": "item-service",
  "logger": "__main__",
  "message": "POST /items -> 201 (45ms)",
  "correlation_id": "a1b2c3d4e5f6",
  "method": "POST",
  "path": "/items",
  "status_code": 201,
  "duration_ms": 45.2
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `timestamp` | ISO 8601 | Waktu kejadian dalam UTC |
| `level` | string | DEBUG, INFO, WARNING, ERROR, CRITICAL |
| `service` | string | Nama service (via env `SERVICE_NAME`) |
| `logger` | string | Nama Python logger |
| `message` | string | Pesan log |
| `correlation_id` | string | UUID untuk request tracing |
| `method` | string | HTTP method (GET, POST, dll) |
| `path` | string | URL path |
| `status_code` | int | HTTP response status code |
| `duration_ms` | float | Response time dalam ms |
| `alert` | bool | `true` jika error rate > 10% dalam 1 menit |
| `exception` | string | Stack trace (jika error) |

### Cara Baca Log

```bash
# Semua service
make logs

# Raw logs (real-time)
make logs-raw

# Service spesifik
docker compose logs -f auth-service
docker compose logs -f item-service
docker compose logs -f backend
docker compose logs -f gateway
docker compose logs -f frontend

# Filter log dengan grep
docker compose logs auth-service | Select-String "ERROR"
docker compose logs item-service | Select-String "CRITICAL"

# Cari correlation ID tertentu
docker compose logs auth-service | Select-String "a1b2c3d4e5f6"
```

### Contoh Membaca Log

**INFO — Request normal:**
```json
{"level":"INFO","message":"POST /items → 201 (45ms)","status_code":201,"duration_ms":45.2}
```
Interpretasi: Request sukses, response cepat (<100ms).

**WARNING — Client error:**
```json
{"level":"WARNING","message":"POST /auth/login → 401 (12ms)","status_code":401}
```
Interpretasi: Login gagal (password salah). Normal terjadi, perlu diwaspadai jika jumlahnya tinggi.

**ERROR — Server error:**
```json
{"level":"ERROR","message":"Request failed: GET /items","status_code":500}
```
Interpretasi: Internal server error. Perlu investigasi segera.

**CRITICAL — High error rate:**
```json
{"level":"CRITICAL","alert":true,"message":"High error rate detected: 15.23% in the last minute"}
```
Interpretasi: **Alert!** Error rate > 10% dalam 1 menit. Segera cek koneksi database dan service dependencies.

### Log Levels

| Level | Arti | Tindakan |
|-------|------|----------|
| **DEBUG** | Informasi detail untuk debugging | Diabaikan di production |
| **INFO** | Request normal (2xx) | Dipantau untuk traffic pattern |
| **WARNING** | Client error (4xx) | Perlu diwaspadai jika meningkat |
| **ERROR** | Server error (5xx) | Segera investigasi |
| **CRITICAL** | High error rate / sistem tidak stabil | **Segera action!** |

---

## Request Tracing

### Correlation ID Flow

Setiap request yang masuk ke service akan mendapatkan **correlation ID** yang di-generate oleh `RequestLoggingMiddleware` (`services/shared/logging_middleware.py:18-23`).

```
Client                        Gateway                    Auth Service               Item Service
  │                             │                            │                         │
  │  (no correlation ID)       │                            │                         │
  │───── POST /items ─────────→│                            │                         │
  │                             │  Generate X-Correlation-ID │                         │
  │                             │  (uuid4()[:12] = "a1b2")  │                         │
  │                             │                            │                         │
  │                             │──── GET /verify ──────────→│                         │
  │                             │  X-Correlation-ID: a1b2   │                         │
  │                             │                            │  Log: "verify a1b2"    │
  │                             │←──────── 200 OK ──────────│                         │
  │                             │                            │                         │
  │                             │                            │──── Item DB ──────────→│
  │                             │                            │←──── result ───────────│
  │                             │                            │                         │
  │                             │←──── 201 Created ─────────│                         │
  │  X-Correlation-ID: a1b2   │                            │                         │
  │←───────────────────────────│                            │                         │
```

### Cara Trace Satu Request Lintas Service

**1. Dapatkan correlation ID dari response header:**
```bash
curl -s -D - http://localhost:8080/items | findstr "X-Correlation-ID"
# Output: X-Correlation-ID: a1b2c3d4e5f6
```

**2. Cari di semua service:**
```bash
docker compose logs auth-service | Select-String "a1b2c3d4e5f6"
docker compose logs item-service | Select-String "a1b2c3d4e5f6"
```

**3. Urutkan berdasarkan timestamp untuk melihat flow lengkap.**

### Kirim Correlation ID Sendiri

Client bisa mengirim correlation ID sendiri via header:

```bash
curl -H "X-Correlation-ID: my-trace-id-001" http://localhost:8080/items
```

ID ini akan di-propagasi ke semua service.

### Correlation ID di Auth Client

File `services/item-service/auth_client.py` mengirim correlation ID saat memanggil Auth Service:

```python
headers = {"Authorization": authorization}
if correlation_id:
    headers["X-Correlation-ID"] = correlation_id
```

---

## Metrics & Monitoring

### Metrics Endpoint

Service yang memiliki endpoint `/metrics`:

| Service | Endpoint | Source |
|---------|----------|--------|
| Auth Service | `GET localhost:8001/metrics` | `services/auth-service/main.py:84-88` |
| Item Service | `GET localhost:8002/metrics` | `services/item-service/main.py:72-76` |

**Response example:**
```bash
curl http://localhost:8001/metrics
```

```json
{
  "service": "auth-service",
  "uptime_seconds": 3600.0,
  "total_requests": 1500,
  "total_errors": 23,
  "error_rate_percent": 1.53,
  "status_codes": {"200": 1400, "201": 50, "400": 20, "401": 15, "500": 15},
  "latency": {
    "p50_ms": 12.5,
    "p95_ms": 45.2,
    "p99_ms": 120.1,
    "avg_ms": 18.3
  },
  "endpoints": {
    "POST /register": {"count": 200, "errors": 5, "avg_latency_ms": 35.2},
    "POST /login": {"count": 800, "errors": 15, "avg_latency_ms": 15.1},
    "GET /verify": {"count": 500, "errors": 3, "avg_latency_ms": 8.9}
  }
}
```

### Metrics yang Tersedia

| Metric | Deskripsi | Cara Baca |
|--------|-----------|-----------|
| `uptime_seconds` | Lama service berjalan | Jika < 60 detik, baru restart |
| `total_requests` | Total request sejak start | Bandingkan dengan expected traffic |
| `total_errors` | Total 4xx + 5xx | Jika tinggi, investigasi |
| `error_rate_percent` | Persentase error | Normal: <5%. Waspada: 5-10%. **Kritis: >10%** |
| `status_codes` | Per-status code counter | 5xx > 0 perlu investigasi |
| `latency.p50_ms` | Median response time | Normal: <50ms. Lambat: >200ms |
| `latency.p95_ms` | 95th percentile latency | Jika >500ms, ada masalah performa |
| `latency.p99_ms` | 99th percentile latency | Request paling lambat |
| `endpoints.*` | Per-endpoint stats | Lihat endpoint mana yang bermasalah |

### Prometheus + Grafana

Di microservices cluster, metrics bisa divisualisasikan:

```bash
# Start microservices cluster dengan monitoring
docker compose -f docker-compose.microservices.yml up -d --build

# Akses
# Grafana: http://localhost:3002 (default: admin/admin)
# Prometheus: http://localhost:9090
```

### Sliding Window Error Alert

`services/shared/logging_middleware.py:70-78` — error rate dihitung dalam sliding window 60 detik. Jika > 10%, log CRITICAL dengan `"alert": true`.

```json
{"level":"CRITICAL","alert":true,"message":"High error rate detected: 23.5% in the last minute"}
```

---

## Common Troubleshooting

### Service Won't Start

**Symptom:** Container exit/crash loop.

**Check:**
```bash
# Lihat log
docker compose logs auth-service

# Cek port conflict
netstat -ano | findstr :8001
netstat -ano | findstr :8002
netstat -ano | findstr :8080

# Cek environment variables
docker compose exec auth-service env
```

**Common causes:**
| Issue | Check | Fix |
|-------|-------|-----|
| Port conflict | `netstat` | Stop aplikasi lain di port yang sama |
| Environment missing | `docker compose exec <service> env` | Cek file `.env` atau `env_file` di compose |
| Dependency down | `docker compose ps` | Start dependency: `docker compose start db` |
| Build error | `docker compose logs --build` | Fix build error, rebuild |

### Database Connection Error

**Symptom:** Health check return 503, error "could not connect to server".

**Check:**
```bash
# Cek status database
docker compose ps db
docker compose exec db pg_isready -U postgres -d studyfy

# Cek koneksi dari backend
docker compose exec backend python -c "
from database import engine
from sqlalchemy import text
conn = engine.connect()
print('OK:', conn.execute(text('SELECT 1')).fetchone())
"

# Cek log database
docker compose logs db
```

**Solutions:**
| Issue | Fix |
|-------|-----|
| DB container tidak running | `docker compose start db` |
| DB corrupt | `docker compose down -v` (⚠️ data hilang) lalu `docker compose up -d` |
| Wrong DATABASE_URL | Cek `backend/.env.docker` |

### Circuit Breaker OPEN

**Symptom:** Item Service return 503, health check `status: "degraded"`.

**Check:**
```bash
# Cek circuit breaker status
curl http://localhost:8002/health | python -m json.tool

# Cek auth service
curl http://localhost:8001/health

# Cek network
docker network inspect studyfy-microservices-network
```

**Solutions:**
| Issue | Action | Recovery Time |
|-------|--------|---------------|
| Auth Service down | `docker compose start auth-service` | 30s (cooldown) |
| Network issue | `docker network connect studyfy-microservices-network studyfy-item-service` | 30s |
| High failure rate | Fix root cause di Auth Service | Variabel |

### High Error Rate Alert

**Symptom:** Log CRITICAL "High error rate detected".

**Check:**
```bash
# Cek metrics untuk lihat error rate
curl http://localhost:8001/metrics | python -m json.tool

# Cek log untuk lihat error terbanyak
docker compose logs auth-service | Select-String "ERROR"
docker compose logs item-service | Select-String "ERROR"
docker compose logs backend | Select-String "ERROR"

# Cek status codes distribution
curl http://localhost:8001/metrics | python -c "import sys,json; d=json.load(sys.stdin); print(d['status_codes'])"
```

**Triage:**
| Status Code Dominan | Kemungkinan | Action |
|-------------------|-------------|--------|
| 5xx | Internal server error | Cek database, dependencies |
| 4xx | Client error | Cek apakah ada perubahan di frontend |
| 401/403 | Auth issue | Cek token validity, JWT secret key |

### Nginx / Gateway Issues

**Symptom:** Gateway return 502/503.

**Check:**
```bash
# Cek gateway log
docker compose logs gateway

# Cek apakah upstream services hidup
curl http://localhost:8001/health
curl http://localhost:8002/health

# Cek nginx config syntax
docker compose exec gateway nginx -t
```

**Solutions:**
| Issue | Fix |
|-------|-----|
| Upstream service down | Start service, restart gateway: `docker compose restart gateway` |
| Nginx config error | Fix `services/gateway/nginx.conf`, rebuild: `docker compose up -d --build gateway` |
| Port 8080 conflict | `netstat -ano \| findstr :8080`, kill proses lain |

### Slow Response

**Symptom:** Response time > 1 detik.

**Check:**
```bash
# Cek latency dari metrics
curl http://localhost:8001/metrics | python -c "import sys,json; d=json.load(sys.stdin); print(d['latency'])"

# Cek log slow requests
docker compose logs item-service | Select-String "duration_ms" | Select-String -Pattern "[2-9][0-9]{2}"  # >200ms

# Cek resource usage
docker stats

# Cek koneksi database
docker compose exec db psql -U postgres -d auth_db -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query FROM pg_stat_activity WHERE state != 'idle' ORDER BY duration DESC LIMIT 5;"
```

**Solutions:**
| Issue | Fix |
|-------|-----|
| Database query lambat | Tambah index, optimasi query |
| Resource limit | Naikkan CPU/memory limit di compose file |
| Network latency | Cek DNS, pastikan service di network yang sama |

### Upload File Gagal

**Symptom:** Error saat submit assignment.

**Check:**
```bash
# Cek folder upload
docker compose exec backend ls -la uploads/assignments/

# Cek disk space
docker compose exec backend df -h

# Cek validasi file
# File type: main.py:683 - hanya PDF
# File size: main.py:690 - max 2MB
```

**Solutions:**
| Issue | Fix |
|-------|-----|
| Folder tidak ada | `docker compose exec backend mkdir -p uploads/assignments` |
| File bukan PDF | Convert ke PDF |
| File terlalu besar | Kompres file (< 2MB) |
| Disk penuh | Bersihkan file lama, tambah storage |

---

## Escalation Path

### Kontak Tim

| Role | Nama | Area Tanggung Jawab |
|------|------|---------------------|
| **Lead Backend** | Dzaky Rasyiq Zuhair | API endpoints, database, auth logic, deployment |
| **Lead Frontend** | Dhiya Afifah | UI/UX, frontend build, Nginx config |
| **Lead DevOps** | Ika Agustin Wulandari | Docker, CI/CD, infrastructure, monitoring |
| **Lead QA & Docs** | Gabriel Karmen Sanggalangi | Testing, documentation, quality assurance |

### Escalation Flow

```
User Report Issue
      │
      v
Lead QA & Docs (First Response)
  │  - Triage: dokumentasi issue, cek log
  │  - Klasifikasi severity
  │
  ├── Frontend Issue ──────→ Lead Frontend (Dhiya)
  │     UI bug, build error, Nginx
  │
  ├── Backend Issue ───────→ Lead Backend (Dzaky)
  │     API error, database, auth
  │
  ├── Infrastructure ─────→ Lead DevOps (Ika)
  │     Docker, CI/CD, deployment, monitoring
  │
  └── Documentation ─────→ Lead QA & Docs (Gabriel)
        Fix docs, update testing
```

### Severity Levels

| Level | Definition | Response Time | Contoh |
|-------|-----------|--------------|--------|
| **P0 — Critical** | Semua user tidak bisa akses | Segera (24/7) | Database down, gateway crash |
| **P1 — High** | Fitur utama tidak berfungsi | <30 menit | Login error, submission gagal |
| **P2 — Medium** | Fitur non-kritis terganggu | <2 jam | Item stats salah, typo di UI |
| **P3 — Low** | Issue kosmetik / enhancement | <1 minggu | Layout minor, dokumentasi kurang |

### Reporting Issues

**Saat melaporkan issue, sertakan:**

1. **Timestamp:** Kapan issue terjadi?
2. **Service:** Service mana yang bermasalah?
3. **Correlation ID:** (dari response header `X-Correlation-ID`)
4. **Request:** Method + URL + Body (jika ada)
5. **Response:** Status code + Response body
6. **Log:** Log potongan dari service terkait
7. **Environment:** Monolith / Microservices / Production

---

*Last updated: 2026-05-03 | Lead QA & Docs*
