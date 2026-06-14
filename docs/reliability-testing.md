# Reliability Testing — Studyfy

Dokumentasi hasil reliability testing untuk sistem **Studyfy** dalam dua mode arsitektur: **Monolith** (development) dan **Microservices** (UAS/production).

---

## Daftar Isi

1. [Database Down — Monolith](#r-01-database-down--monolith)
2. [Auth Service Down — Microservices](#r-02-auth-service-down--microservices)
3. [Item Service Down — Microservices](#r-03-item-service-down--microservices)
4. [Circuit Breaker Trip](#r-04-circuit-breaker-trip)
5. [Gateway Down](#r-05-gateway-down)
6. [Slow Query / Timeout](#r-06-slow-query--timeout)
7. [Recovery Setelah Service Down](#r-07-recovery-setelah-service-down)
8. [Network Partition](#r-08-network-partition)
9. [High Error Rate Alert](#r-09-high-error-rate-alert)

---

## R-01: Database Down — Monolith

### Tujuan
Memverifikasi bahwa backend monolith tetap memberikan response yang tepat saat database PostgreSQL tidak tersedia.

### Cara Reproduce
```bash
# 1. Stop database container
docker compose stop db

# 2. Panggil health endpoint
curl http://localhost:8000/health

# 3. Coba endpoint yang membutuhkan DB
curl http://localhost:8000/classes

# 4. Start database kembali
docker compose start db
```

### Expected Behavior
- `/health` → status `503`, `"database": "error: ..."`
- Endpoint lain → `500 Internal Server Error`
- Setelah DB aktif kembali → health kembali `200`

### Source Code Reference
`backend/main.py:61-79` — Health check mengecek DB dengan `SELECT 1`

### Hasil Test
| Status | Keterangan |
|--------|-----------|
| ✅ PASS | Health check akurat mendeteksi DB down |
| ✅ PASS | Response `503` bukan `200` palsu |
| ✅ PASS | Recovery otomatis setelah DB aktif |

---

## R-02: Auth Service Down — Microservices

### Tujuan
Memverifikasi bahwa item-service tetap berfungsi dengan baik saat auth-service tidak tersedia, dan circuit breaker mencegah cascading failure.

### Cara Reproduce
```bash
# 1. Setelah cluster microservices berjalan, stop auth-service
docker compose -f docker-compose.microservices.yml stop auth-service

# 2. Panggil endpoint item yang butuh auth
curl -H "Authorization: Bearer test-token" http://localhost:8080/items

# 3. Lakukan 5+ kali untuk trigger circuit breaker
for ($i=1; $i -le 6; $i++) {
    curl -s -H "Authorization: Bearer test-token" http://localhost:8080/items
    Start-Sleep -Seconds 1
}

# 4. Cek health item-service
curl http://localhost:8080/health
```

### Expected Behavior
- Request pertama → `503` dengan retry (3x attempt)
- Setelah 5 failure → circuit breaker OPEN, response langsung `503` tanpa nunggu timeout
- Health item-service → `"status": "degraded"`, `"dependencies.auth-service.state": "OPEN"`

### Source Code Reference
- `services/item-service/auth_client.py:14-18` — Circuit breaker threshold=5, cooldown=30s
- `services/item-service/auth_client.py:52-114` — Retry 3x dengan backoff
- `services/item-service/main.py:67-79` — Health check dengan CB status

### Hasil Test
| Status | Keterangan |
|--------|-----------|
| ✅ PASS | Fail fast setelah CB OPEN (tanpa nunggu timeout) |
| ✅ PASS | Retry 3x sebelum declare failure |
| ✅ PASS | Health check menampilkan status degraded |

---

## R-03: Item Service Down — Microservices

### Tujuan
Memverifikasi bahwa gateway dan service lain tidak terpengaruh saat item-service mati.

### Cara Reproduce
```bash
# 1. Stop item-service
docker compose -f docker-compose.microservices.yml stop item-service

# 2. Cek auth-service (tidak terpengaruh)
curl http://localhost:8080/auth/health
# atau langsung:
curl http://localhost:8001/health

# 3. Cek health endpoint aggregator gateway
curl http://localhost:8080/health

# 4. Coba akses item endpoint
curl http://localhost:8080/items
```

### Expected Behavior
- Auth service tetap `200`
- Gateway health static `200` (tidak aggregasi)
- Item endpoint → `502 Bad Gateway` atau `connection refused`

### Source Code Reference
- `services/gateway/nginx.conf:23-29` — Gateway proxy ke item-service
- `docker-compose.microservices.yml:98-130` — Item service config

### Hasil Test
| Status | Keterangan |
|--------|-----------|
| ✅ PASS | Auth service tidak terpengaruh |
| ✅ PASS | Gateway tetap merespon |
| ✅ PASS | Item endpoint gagal dengan error yang jelas |

---

## R-04: Circuit Breaker Trip

### Tujuan
Memverifikasi bahwa circuit breaker benar-benar OPEN setelah threshold tercapai, dan HALF_OPEN setelah cooldown.

### Cara Reproduce
```bash
# 1. Pastikan auth-service mati atau return error
docker compose -f docker-compose.microservices.yml stop auth-service

# 2. Kirim request sampai circuit breaker trip (threshold=5)
1..6 | ForEach-Object {
    curl -s -H "Authorization: Bearer test" http://localhost:8080/items
    Start-Sleep -Milliseconds 500
}

# 3. Cek health item-service untuk lihat state CB
curl http://localhost:8002/health | ConvertFrom-Json | Select-Object -ExpandProperty dependencies

# 4. Start auth-service dan tunggu 30 detik (cooldown)
docker compose -f docker-compose.microservices.yml start auth-service
Start-Sleep -Seconds 31

# 5. Kirim request setelah cooldown (harus HALF_OPEN → CLOSED)
curl -H "Authorization: Bearer <valid-token>" http://localhost:8080/items
```

### Expected Behavior
- Setelah failure ke-5 → state `CLOSED → OPEN`
- Selama OPEN → request langsung ditolak (fail fast), `total_rejected` bertambah
- Setelah cooldown 30s → state `OPEN → HALF_OPEN`
- Jika test request berhasil → state `HALF_OPEN → CLOSED`
- Jika test request gagal → state `HALF_OPEN → OPEN` (cooldown restart)

### Source Code Reference
- `services/item-service/circuit_breaker.py:36-62` — State machine logic
- `services/item-service/circuit_breaker.py:64-92` — Success/failure recording

### Hasil Test
| Status | Keterangan |
|--------|-----------|
| ✅ PASS | Threshold 5 tepat trigger OPEN |
| ✅ PASS | Fail fast saat OPEN (0ms delay) |
| ✅ PASS | Cooldown 30s, state berubah HALF_OPEN |
| ✅ PASS | Recovery test mengembalikan ke CLOSED |

---

## R-05: Gateway Down

### Tujuan
Memverifikasi bahwa semua backend service tetap berjalan walau gateway mati.

### Cara Reproduce
```bash
# 1. Stop gateway
docker compose -f docker-compose.microservices.yml stop gateway

# 2. Akses service langsung (bukan lewat gateway)
curl http://localhost:8001/health
curl http://localhost:8002/health

# 3. Coba lewat gateway (harus gagal)
curl http://localhost:8080/health

# 4. Start gateway kembali
docker compose -f docker-compose.microservices.yml start gateway
```

### Expected Behavior
- Service langsung (auth:8001, item:8002) tetap `200`
- Lewat gateway (8080) → `connection refused`
- Tidak ada data loss atau service crash

### Source Code Reference
- `services/gateway/nginx.conf` — Seluruh konfigurasi gateway

### Hasil Test
| Status | Keterangan |
|--------|-----------|
| ✅ PASS | Backend service tetap jalan |
| ✅ PASS | Tidak ada efek samping ke service lain |
| ✅ PASS | Setelah gateway up, semua normal kembali |

---

## R-06: Slow Query / Timeout

### Tujuan
Memverifikasi bahwa timeout handling berfungsi saat auth-service lambat merespon.

### Cara Reproduce
```bash
# 1. Simulasi slow response di auth-service (misal blocking query)
# Inject delay dengan curl ke endpoint slow (jika ada)
# Atau simulasi dengan network delay:

# 2. Dari item-service, coba akses endpoint yang butuh auth
# Tambahkan delay di auth-service untuk test:
# (di auth-service container)
#   import time; time.sleep(10)

# 3. Kirim request
curl -H "Authorization: Bearer test" http://localhost:8002/items

# 4. Cek log item-service untuk timeout
docker compose -f docker-compose.microservices.yml logs item-service
```

### Expected Behavior
- Timeout setelah 5 detik (konfigurasi `TIMEOUT_SECONDS`)
- Retry 3x, masing-masing dengan timeout 5 detik
- Total maksimal ~15 detik sebelum error
- Log: `"Auth Service timeout (attempt 1/3)"`

### Source Code Reference
- `services/item-service/auth_client.py:28-29` — `MAX_RETRIES=3, TIMEOUT_SECONDS=5`
- `services/item-service/auth_client.py:99-104` — Timeout exception handling

### Hasil Test
| Status | Keterangan |
|--------|-----------|
| ✅ PASS | Timeout tepat 5 detik |
| ✅ PASS | Retry backoff berfungsi (0.5s, 1s, 2s) |
| ⚠️ WARNING | Total delay maksimal ~17.5s — perlu dipertimbangkan untuk UX |

---

## R-07: Recovery Setelah Service Down

### Tujuan
Memverifikasi bahwa sistem pulih otomatis setelah service yang mati dihidupkan kembali.

### Cara Reproduce
```bash
# 1. Matikan auth-service
docker compose -f docker-compose.microservices.yml stop auth-service

# 2. Tunggu sampai circuit breaker OPEN
1..6 | ForEach-Object {
    curl -s -H "Authorization: Bearer test" http://localhost:8002/items | Out-Null
    Start-Sleep -Milliseconds 500
}

# 3. Verifikasi CB OPEN
curl -s http://localhost:8002/health | ConvertFrom-Json

# 4. Start auth-service
docker compose -f docker-compose.microservices.yml start auth-service

# 5. Tunggu cooldown 30s + health check
Start-Sleep -Seconds 35

# 6. Coba request valid
curl -H "Authorization: Bearer <valid-token>" http://localhost:8080/items
```

### Expected Behavior
- Setelah cooldown → HALF_OPEN
- Request berhasil → CLOSED
- Semua layanan kembali normal tanpa restart manual

### Source Code Reference
- `services/item-service/circuit_breaker.py:41-50` — Cooldown → HALF_OPEN
- `services/item-service/circuit_breaker.py:64-73` — Success → CLOSED

### Hasil Test
| Status | Keterangan |
|--------|-----------|
| ✅ PASS | Recovery otomatis tanpa restart container |
| ✅ PASS | State machine berfungsi: OPEN → HALF_OPEN → CLOSED |

---

## R-08: Network Partition

### Tujuan
Memverifikasi bahwa service tetap stabil saat koneksi jaringan antar service terputus.

### Cara Reproduce
```bash
# 1. Simulasi network partition dengan memutus koneksi
# Cara 1: Stop salah satu service
docker compose -f docker-compose.microservices.yml stop auth-service

# Cara 2: Gunakan network policy (jika ada)
# docker network disconnect studyfy-microservices-network studyfy-auth-service

# 2. Kirim request ke item-service (yang butuh auth)
curl -H "Authorization: Bearer test" http://localhost:8002/items

# 3. Cek log untuk melihat error koneksi
docker compose -f docker-compose.microservices.yml logs item-service --tail 20

# 4. Pulihkan jaringan
docker compose -f docker-compose.microservices.yml start auth-service
```

### Expected Behavior
- Item service mendeteksi `ConnectError` ke auth-service
- Retry 3x dengan exponential backoff
- Circuit breaker mencatat failure
- Tidak ada crash atau hang

### Source Code Reference
- `services/item-service/auth_client.py:92-97` — `ConnectError` handling
- `services/item-service/auth_client.py:106-108` — Retry delay

### Hasil Test
| Status | Keterangan |
|--------|-----------|
| ✅ PASS | Tidak ada crash saat koneksi terputus |
| ✅ PASS | Error handling memberikan response 503 |
| ✅ PASS | Service tetap running (tidak hang) |

---

## R-09: High Error Rate Alert

### Tujuan
Memverifikasi bahwa sistem mendeteksi dan log alert saat error rate > 10% dalam 1 menit.

### Cara Reproduce
```bash
# 1. Buat banyak request yang gagal (misal tanpa token valid)
1..20 | ForEach-Object {
    curl -s http://localhost:8002/items | Out-Null  # tanpa auth header
}

# 2. Cek log untuk critical alert
docker compose -f docker-compose.microservices.yml logs item-service --tail 30

# 3. Cek metrics endpoint
curl http://localhost:8002/metrics
```

### Expected Behavior
- Error rate dalam 1 menit > 10%
- Log CRITICAL dengan `"alert": true`
- Metrics menampilkan error rate aktual

### Source Code Reference
- `services/shared/logging_middleware.py:70-79` — Error rate check + CRITICAL log
- `services/shared/metrics.py:60-73` — `get_error_rate_last_minute()` sliding window

### Hasil Test
| Status | Keterangan |
|--------|-----------|
| ✅ PASS | Alert CRITICAL muncul saat error rate > 10% |
| ✅ PASS | Sliding window 60s akurat |
| ✅ PASS | Metrics endpoint menampilkan error rate |

---

## Ringkasan

| ID | Skenario | Status |
|----|----------|--------|
| R-01 | Database Down — Monolith | ✅ PASS |
| R-02 | Auth Service Down — Microservices | ✅ PASS |
| R-03 | Item Service Down — Microservices | ✅ PASS |
| R-04 | Circuit Breaker Trip | ✅ PASS |
| R-05 | Gateway Down | ✅ PASS |
| R-06 | Slow Query / Timeout | ⚠️ WARNING |
| R-07 | Recovery Setelah Service Down | ✅ PASS |
| R-08 | Network Partition | ✅ PASS |
| R-09 | High Error Rate Alert | ✅ PASS |

### Total
- **Passed:** 8 / 9
- **Warning:** 1 (R-06: total delay 17.5s perlu optimasi)
- **Failed:** 0
- **Reliability Score:** 89%
