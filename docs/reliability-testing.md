# Reliability Testing Guide — Studyfy

> **Mata Kuliah:** Komputasi Awan — Sistem Informasi ITK  
> **Fase:** Microservices (Minggu 12-14)

Dokumentasi pengujian keandalan sistem **Studyfy** — skenario failure, timeout, recovery, circuit breaker, dan monitoring.

---

## Daftar Isi
1. [Tujuan](#tujuan)
2. [Skenario Test](#skenario-test)
3. [R-01: Database Down (Monolith)](#r-01-database-down-monolith)
4. [R-02: Auth Service Down (Microservices)](#r-02-auth-service-down-microservices)
5. [R-03: Item Service Down](#r-03-item-service-down)
6. [R-04: Circuit Breaker Trip](#r-04-circuit-breaker-trip)
7. [R-05: Gateway Down](#r-05-gateway-down)
8. [R-06: Slow Query / Timeout](#r-06-slow-query--timeout)
9. [R-07: Recovery Setelah Service Down](#r-07-recovery-setelah-service-down)
10. [R-08: Network Partition](#r-08-network-partition)
11. [R-09: High Error Rate Alert](#r-09-high-error-rate-alert)
12. [Ringkasan](#ringkasan)

---

## Tujuan

1. **Failure detection** — sistem mendeteksi ketika service turun
2. **Graceful degradation** — response error (503/502) bukan crash
3. **Circuit breaker** — mencegah cascading failure
4. **Auto recovery** — sistem pulih tanpa restart manual
5. **Monitoring** — metrics dan alerting berfungsi

---

## Skenario Test

| ID | Skenario | Mode | Prioritas |
|----|----------|------|-----------|
| R-01 | Database down (monolith) | Monolith | **Critical** |
| R-02 | Auth Service down | Microservices | **Critical** |
| R-03 | Item Service down | Microservices | **High** |
| R-04 | Circuit breaker trip | Microservices | **Critical** |
| R-05 | Gateway down | Semua | **Critical** |
| R-06 | Slow query / timeout | Semua | **High** |
| R-07 | Recovery setelah service down | Semua | **Critical** |
| R-08 | Network partition | Semua | **High** |
| R-09 | High error rate → alert | Microservices | **Medium** |

---

## R-01: Database Down (Monolith)

Koneksi PostgreSQL terputus saat monolith backend berjalan.

### Cara Reproduce

```bash
# Start monolith mode
docker compose up -d

# Matikan database
docker compose stop db

# Cek health
curl http://localhost:8000/health
```

### Expected Behavior

**Source:** `backend/main.py:61-78` — health check dengan try/except `SELECT 1`

Response **503**:
```json
{
  "status": "unhealthy",
  "service": "backend",
  "version": "1.0.0",
  "database": "error: (psycopg2.OperationalError) could not connect to server"
}
```

Server tetap jalan, tidak crash.

---

## R-02: Auth Service Down (Microservices)

Auth Service (port 8001) berhenti. Item Service yang bergantung padanya harus tetap bisa memberikan response error yang informatif (bukan hang).

### Cara Reproduce

```bash
# Start microservices cluster
docker compose -f docker-compose.microservices.yml up -d --build

# Hentikan auth-service
docker compose -f docker-compose.microservices.yml stop auth-service

# Akses item endpoint via gateway
curl http://localhost:8080/items -H "Authorization: Bearer test"
```

### Expected Behavior

**Source:** `services/item-service/auth_client.py` — retry 3x, lalu circuit breaker record_failure()

**Response pertama (setelah retry habis):**
```json
{"detail": "Auth Service unavailable. Please try again later."}
```
Status: **503**

Setelah 5 request gagal → circuit breaker OPEN → fail fast tanpa retry.

**Health check item-service:**
```json
{
  "status": "degraded",
  "service": "item-service",
  "dependencies": {
    "auth-service": {
      "state": "OPEN",
      "failure_count": 5,
      "total_rejected": 0
    }
  }
}
```

---

## R-03: Item Service Down

Item Service (port 8002) berhenti.

### Cara Reproduce

```bash
# Hentikan item-service
docker compose -f docker-compose.microservices.yml stop item-service

# Akses item endpoint
curl http://localhost:8080/items

# Akses auth endpoint (seharusnya tetap jalan)
curl -X POST http://localhost:8080/auth/login -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"test"}'
```

### Expected Behavior

| Service | Response |
|---------|----------|
| Item Service | 502 Bad Gateway (dari Nginx) |
| Auth Service | Tetap jalan normal |
| Gateway | Error hanya untuk route `/items` |

---

## R-04: Circuit Breaker Trip

Simulasi kegagalan berturut-turut Auth Service sehingga circuit breaker item-service OPEN.

### Cara Reproduce

```bash
# Kirim request dengan token invalid ke item-service (via gateway)
for i in 1 2 3 4 5 6; do
  curl -s http://localhost:8080/items \
    -H "Authorization: Bearer invalid_token_$i"
  echo "--- Request $i ---"
done
```

### Expected Behavior

**Source:** `services/item-service/circuit_breaker.py`

| Request ke- | Hasil | Circuit State |
|-------------|-------|---------------|
| 1-3 | 401 (invalid token) → record_success (bukan failure) | CLOSED |
| (Jika Auth Service return 5xx) | 503 → record_failure | CLOSED → OPEN |
| Setelah OPEN | 503 fail fast, tanpa retry | OPEN |
| Setelah 30s cooldown | 1 request diizinkan test | HALF_OPEN |
| Test sukses | Normal kembali | CLOSED |

**Catatan:** Circuit breaker hanya trip untuk **5xx errors**, bukan 401 (invalid token dianggap success karena request berhasil diproses).

---

## R-05: Gateway Down

Nginx gateway berhenti.

### Cara Reproduce

```bash
# Stop gateway
docker compose -f docker-compose.microservices.yml stop gateway
```

### Expected Behavior

| Akses ke | Hasil |
|----------|-------|
| Gateway (8080) | Connection refused |
| Auth Service langsung (8001) | Tetap bisa diakses |
| Item Service langsung (8002) | Tetap bisa diakses |
| Frontend langsung (3000) | Tetap bisa diakses |

---

## R-06: Slow Query / Timeout

Item Service memanggil Auth Service dengan timeout.

### Cara Reproduce

```bash
# Simulasi slow response di Auth Service
docker compose -f docker-compose.microservices.yml exec auth-service sh -c "
apk add --no-cache iptables
iptables -A INPUT -p tcp --dport 8001 -m statistic --mode random --probability 0.5 -j DROP
"

# Kirim request ke item-service
time curl -s http://localhost:8080/items -H "Authorization: Bearer test"
```

### Expected Behavior

**Source:** `services/item-service/auth_client.py:20` — `TIMEOUT_SECONDS = 5.0`

| Kondisi | Response Time | Response |
|---------|--------------|----------|
| Normal | <200ms | Items |
| Slow (timeout 5s) | ~5s per attempt × 3 = ~15s | 503 |

**Rekomendasi:** Kurangi `TIMEOUT_SECONDS` dan `MAX_RETRIES` untuk production.

---

## R-07: Recovery Setelah Service Down

Service mati kemudian hidup kembali.

### Cara Reproduce

```bash
# 1. Matikan auth-service
docker compose -f docker-compose.microservices.yml stop auth-service

# 2. Verifikasi circuit breaker OPEN
curl http://localhost:8080/items -H "Authorization: Bearer test"

# 3. Hidupkan auth-service
docker compose -f docker-compose.microservices.yml start auth-service

# 4. Tunggu health check OK
sleep 15

# 5. Verifikasi recovery
curl http://localhost:8080/items -H "Authorization: Bearer test"
```

### Expected Behavior

| Step | Response | Status |
|------|----------|--------|
| Auth down, CB OPEN | 503 fail fast | Pass |
| Auth up | Health check lulus | Pass |
| CB → HALF_OPEN (30s cooldown) | 1 request test | Pass |
| Test sukses → CLOSED | 200 normal | Pass |

---

## R-08: Network Partition

Koneksi antar service terputus.

### Cara Reproduce

```bash
# Pisahkan item-service dari network microservices
docker network disconnect studyfy-microservices-network studyfy-item-service

# Akses item endpoint
curl http://localhost:8080/items

# Sambungkan kembali
docker network connect studyfy-microservices-network studyfy-item-service
```

### Expected Behavior

| Kondisi | Response |
|---------|----------|
| Network terputus | Item Service tidak reachable → Gateway 502 |
| Sambung kembali | Service pulih otomatis |

---

## R-09: High Error Rate Alert

Error rate > 10% dalam 1 menit → trigger CRITICAL alert.

### Cara Reproduce

```bash
# Generate banyak error request
for i in $(seq 1 20); do
  curl -s http://localhost:8080/auth/nonexistent
done

# Cek logs untuk alert
docker compose -f docker-compose.microservices.yml logs auth-service
```

### Expected Behavior

**Source:** `services/shared/logging_middleware.py:58-62`

```json
{
  "timestamp": "2026-05-03T10:00:00Z",
  "level": "CRITICAL",
  "service": "auth-service",
  "message": "High error rate detected: 15.23% in the last minute",
  "alert": true
}
```

---

## Ringkasan

| ID | Skenario | Status | Catatan |
|----|----------|--------|---------|
| R-01 | Database down (monolith) | **Passed** | Health return 503, server tetap jalan |
| R-02 | Auth Service down | **Passed** | Circuit breaker mencegah cascading |
| R-03 | Item Service down | **Passed** | Gateway return 502, service lain jalan |
| R-04 | Circuit breaker trip | **Passed** | OPEN → fail fast, HALF_OPEN → test recovery |
| R-05 | Gateway down | **Passed** | Service langsung masih aksesibel |
| R-06 | Slow query / timeout | **Warning** | Retry 3x × 5s = 15s total; perlu di-tuning |
| R-07 | Recovery | **Passed** | Auto recovery, CB pulih ke CLOSED |
| R-08 | Network partition | **Passed** | Gateway 502, pulih setelah re-connect |
| R-09 | High error rate alert | **Passed** | Log CRITICAL dengan `alert: true` |

### Metrics

| Metric | Value |
|--------|-------|
| Total scenarios | 9 |
| Passed | 8 |
| Warning | 1 (R-06) |
| Failed | 0 |
| **Reliability Score** | **89%** |

### Recommendations

| Priority | Action | File |
|----------|--------|------|
| Medium | Tuning timeout: kurangi `TIMEOUT_SECONDS`, `MAX_RETRIES` | `services/item-service/auth_client.py:20-21` |
| Low | Tambah metric untuk circuit breaker state di Prometheus | `services/item-service/circuit_breaker.py` |
| Low | Auto-recovery test setelah network partition (R-08) | E2E test |

---

*Last updated: 2026-05-03 | Lead QA & Docs*
