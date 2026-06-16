# ☁️ Studyfy — Learning Management System

*Studyfy* adalah platform *Learning Management System (LMS)* berbasis cloud yang dirancang untuk menciptakan pengalaman belajar digital yang simpel, terorganisir, dan menyenangkan dengan mengintegrasikan peran admin, pengajar, dan murid dalam satu sistem terpadu yang efisien. Melalui platform ini, murid dapat mengakses materi pembelajaran berbasis multimedia serta memantau progres belajar secara mandiri, sementara pengajar dibekali dashboard khusus untuk mengelola modul materi, menyusun penugasan, hingga melakukan penilaian secara langsung.

Di sisi lain, admin berperan sebagai pengendali utama yang mengelola hak akses pengguna berbasis peran serta memantau statistik aktivitas dan performa sistem secara menyeluruh. Dengan dukungan arsitektur cloud, *Studyfy* memungkinkan akses lintas perangkat, skalabilitas layanan, serta ketersediaan sistem yang optimal. Urgensi pengembangan *Studyfy* terletak pada penyederhanaan akses pendidikan, peningkatan efektivitas pembelajaran, serta digitalisasi dokumentasi belajar yang fleksibel melalui teknologi yang modern, aman, dan user-friendly.

## 👥 Tim

| Nama | NIM | Peran |
|------|-----|-------|
| Dzaky Rasyiq Zuhair  | 10231035 | Lead Backend |
| Dhiya Afifah  | 10231031 | Lead Frontend |
| Ika Agustin Wulandari  | 10231041 | Lead DevOps |
| Gabriel Karmen Sanggalangi  | 10231039 | Lead QA & Docs |

## 🛠️ Tech Stack

| Teknologi | Fungsi |
|-----------|--------|
| FastAPI   | Backend REST API (monolith & microservices) |
| SQLAlchemy | ORM |
| React     | Frontend SPA |
| Nginx     | Reverse Proxy & API Gateway |
| PostgreSQL | Database (monolith: 1 DB, microservices: 2 DB) |
| Docker    | Containerization |
| Docker Compose | Orchestration (3 mode: monolith, microservices, production) |
| Prometheus | Metrics collection (microservices) |
| Grafana   | Metrics dashboard (microservices) |
| GitHub Actions | CI/CD |
| httpx     | Async HTTP client (inter-service communication) |
| JWT (python-jose) | Token-based authentication |
| passlib   | Password hashing (bcrypt) |

## 🏗️ Architecture

Studyfy menggunakan **dual-mode architecture**:

| Mode | File | Tujuan |
|------|------|--------|
| **Monolith** | `docker-compose.yml` | Development — satu backend FastAPI + satu PostgreSQL |
| **Microservices** | `docker-compose.microservices.yml` | UAS/Production — service terpisah + gateway + monitoring |
| **Production** | `docker-compose.prod.yml` | Production tanpa monitoring |

### Monolith Mode
```
[React Frontend (Nginx)] <--REST API (HTTP/JWT)--> [FastAPI Backend] <--SQLAlchemy ORM--> [PostgreSQL]
                                                                                                |
                                                                                          [Docker Volume]
```

### Microservices Mode
```
[Client] → [Nginx Gateway :8080] → [Auth Service :8001] → [auth-db]
                                   → [Item Service :8002] → [item-db]
                                   → [Frontend :3000]
                                   → [Prometheus :9090] → [Grafana :3002]
```

> Dokumentasi arsitektur detail → [`docs/architecture.md`](docs/architecture.md)


## 🚀 Getting Started

### Opsi 1: Docker (Rekomendasi)

**Prasyarat:** Docker & Docker Compose

```bash
# Monolith mode (development)
docker compose up -d

# Microservices mode (UAS/production)
docker compose -f docker-compose.microservices.yml up -d --build

# Production mode
docker compose -f docker-compose.prod.yml up -d --build
```

Atau gunakan Makefile:
```bash
make up      # Monolith + microservices + dev overrides
make build   # Dengan rebuild
make prod    # Production mode
make dev     # Hot-reload mode
```

### Opsi 2: Manual (Tanpa Docker)

**Prasyarat:** Python 3.10+, Node.js 18+, PostgreSQL, Git

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend (terminal terpisah)
cd frontend
npm install
npm run dev
```

## 🐳 Docker

### Mode Monolith (`docker-compose.yml`)

```bash
# Start
docker compose up -d

# Logs
docker compose logs -f

# Stop
docker compose down

# Status
docker compose ps
```

**Akses:**
| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| PostgreSQL | localhost:5433 |

### Mode Microservices (`docker-compose.microservices.yml`)

```bash
# Start
docker compose -f docker-compose.microservices.yml up -d --build

# Logs
docker compose -f docker-compose.microservices.yml logs -f

# Stop
docker compose -f docker-compose.microservices.yml down
```

**Akses:**
| Service | URL |
|---------|-----|
| Frontend (via Gateway) | http://localhost:8080 |
| Auth Service | http://localhost:8001 |
| Item Service | http://localhost:8002 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3002 |

### Makefile Commands

| Command | Fungsi |
|---------|--------|
| `make up` | Start all services (monolith + microservices + dev) |
| `make build` | Start with rebuild |
| `make prod` | Production mode |
| `make down` | Stop & remove containers |
| `make logs` | View formatted logs |
| `make logs-backend` | Logs auth-service + item-service |
| `make ps` | Container status |
| `make shell-auth` | Enter auth-service terminal |
| `make shell-item` | Enter item-service terminal |
| `make test` | Run pytest + vitest |
| `make lint` | Run linter |
| `make pr-check` | Lint + test + build |

### Swagger UI (API Documentation)

| Mode | Swagger URL |
|------|-------------|
| Monolith | `http://localhost:8000/docs` |
| Auth Service (microservices) | `http://localhost:8001/docs` |
| Item Service (microservices) | `http://localhost:8002/docs` |

### Deployment

Deployment ke **Railway** atau **Render** menggunakan container Docker:

```bash
# Build image
docker build -t studyfy-backend ./backend

# Push ke registry
docker tag studyfy-backend registry.railway.app/studyfy-backend
docker push registry.railway.app/studyfy-backend

# Atau deploy via Railway CLI
railway up
```

> Dokumentasi deployment detail → [`docs/deployment-guide.md`](docs/deployment-guide.md)

---

## 🔐 Keamanan & Autentikasi
> API ini dilindungi menggunakan standar **JWT (JSON Web Token)**. Untuk mengakses *endpoint* yang terproteksi (seperti mengelola data *Items*), pengguna harus melakukan autentikasi terlebih dahulu.

Berikut adalah alur autentikasi pada sistem ini:

**1. Registrasi Akun (`POST /auth/register`)** <br>
Lakukan pendaftaran akun baru. Sistem menerapkan validasi keamanan yang ketat, pastikan password Anda memenuhi kriteria berikut:
* ✅ Minimal **8 karakter**
* ✅ Memiliki minimal **1 huruf besar** (A-Z) dan **1 huruf kecil** (a-z)
* ✅ Memiliki minimal **1 angka** (0-9)
* ✅ Memiliki minimal **1 simbol** (contoh: `!@#$%`)

**2. Login (`POST /auth/login`)** <br>
Gunakan kredensial yang telah didaftarkan untuk melakukan login. Jika berhasil, sistem akan merespons dengan memberikan `access_token`.

**3. Penggunaan Token (Otorisasi)** <br> 
Sertakan `access_token` tersebut di setiap *request* API selanjutnya. Masukkan ke dalam **HTTP Header** Anda dengan format berikut:
```http
Authorization: Bearer <access_token>
```
## 📅 Roadmap

| Minggu | Target | Status |
|--------|--------|--------|
| 1 | Setup & Hello World | ✅ |
| 2 | REST API + Database | ✅ |
| 3 | React Frontend | ✅ |
| 4 | Full-Stack Integration | ✅ |
| 5-7 | Docker & Compose | ✅ |
| 8 | UTS Demo | ✅ |
| 9-11 | CI/CD Pipeline | ✅ |
| 12-14 | Microservices | ✅ |
| 15-16 | Final & UAS | ⬜ |

---

## 📁 Project Structure
```
cc-kelompok-a-nexa/
├── .github/
│   └── workflows/
│       └── ci-testing.yml
├── backend/                          # Monolith backend
│   ├── main.py                       # FastAPI app (all endpoints)
│   ├── auth.py                       # JWT auth logic
│   ├── database.py, models.py, schemas.py, crud.py
│   └── requirements.txt
├── frontend/                         # React SPA
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/               # Header, Login, Items, etc.
│   │   └── services/api.js
│   └── .env
├── services/                         # Microservices
│   ├── auth-service/                 # Auth microservice (port 8001)
│   │   └── main.py                   # Register, login, verify token
│   ├── item-service/                 # Item microservice (port 8002)
│   │   ├── main.py                   # CRUD items + circuit breaker
│   │   ├── auth_client.py            # HTTP client ke auth-service
│   │   └── circuit_breaker.py        # Circuit breaker pattern
│   ├── gateway/                      # Nginx API Gateway
│   │   └── nginx.conf                # Routing rules
│   └── shared/                       # Shared libraries
│       ├── logging_config.py         # Structured JSON logging
│       ├── logging_middleware.py     # Request logging + correlation ID
│       └── metrics.py               # In-memory metrics collector
├── docs/                             # Dokumentasi
│   ├── architecture.md               # Arsitektur dual-mode + diagram
│   ├── reliability-testing.md        # 9 skenario reliability test
│   ├── operations-guide.md           # Panduan operasional
│   ├── git-workflow.md               # Git workflow & PR guidelines
│   ├── setup-guide.md                # Setup guide
│   ├── testing-guide.md              # Testing guide
│   ├── api-test-results.md           # API test results
│   └── ui-test-results.md            # UI test results
├── docker-compose.yml                # Monolith mode
├── docker-compose.microservices.yml  # Microservices mode
├── docker-compose.prod.yml           # Production mode
├── docker-compose.dev.yml            # Dev overrides (hot-reload)
├── Makefile                          # Automation commands
└── README.md
```
## 📡 Dokumentasi API

Base URL: `http://localhost:8000`

### Autentikasi
API menggunakan **JWT (JSON Web Token)**. Semua endpoint yang memerlukan autentikasi wajib menyertakan token di header:
```http
Authorization: Bearer <access_token>
```

---

### 🔧 Public Endpoints

#### Health Check
| Method | URL |
|--------|-----|
| GET | `/health` |

**Response (200 OK):**
```json
{
  "status": "healthy",
  "service": "backend",
  "version": "1.0.0",
  "database": "connected"
}
```

---

#### Register
| Method | URL | Kebutuhan |
|--------|-----|-----------|
| POST | `/auth/register` | - |

**Request Body:**
```json
{
  "email": "user@student.itk.ac.id",
  "name": "Nama Lengkap",
  "password": "P@ssword123",
  "role": "mahasiswa"
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "email": "user@student.itk.ac.id",
  "name": "Nama Lengkap",
  "role": "mahasiswa",
  "is_active": true,
  "semester": null,
  "phone": null,
  "address": null,
  "profile_picture": null,
  "created_at": "2026-04-29T10:00:00Z"
}
```

---

#### Login
| Method | URL |
|--------|-----|
| POST | `/auth/login` |

**Request Body:**
```json
{
  "email": "user@student.itk.ac.id",
  "password": "P@ssword123"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@student.itk.ac.id",
    "name": "Nama Lengkap",
    "role": "mahasiswa",
    "is_active": true,
    "created_at": "2026-04-29T10:00:00Z"
  }
}
```

---

### 🔐 Protected Endpoints (Perlu Token)

#### Get Current User
| Method | URL | Auth |
|--------|-----|------|
| GET | `/auth/me` | ✅ |

**Response (200 OK):**
```json
{
  "id": 1,
  "email": "user@student.itk.ac.id",
  "name": "Nama Lengkap",
  "role": "mahasiswa",
  "is_active": true,
  "phone": null,
  "address": null,
  "profile_picture": null,
  "semester": 5,
  "created_at": "2026-04-29T10:00:00Z"
}
```

---

#### Password Reset Request
| Method | URL |
|--------|-----|
| POST | `/auth/password-reset-request` |

**Request Body:**
```json
{
  "email": "user@student.itk.ac.id"
}
```

**Response (200 OK):**
```json
{
  "message": "Jika email terdaftar, link reset password akan dikirim",
  "email": "user@student.itk.ac.id"
}
```

---

#### Password Reset Verify
| Method | URL |
|--------|-----|
| POST | `/auth/password-reset-verify` |

**Request Body:**
```json
{
  "email": "user@student.itk.ac.id",
  "reset_token": "token_yang_diterima_via_email",
  "new_password": "NewPass@2024"
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "email": "user@student.itk.ac.id",
  "name": "Nama Lengkap",
  "role": "mahasiswa",
  "is_active": true,
  "created_at": "2026-04-29T10:00:00Z"
}
```

---

### 👥 User Management

#### List Users (Admin/Dosen)
| Method | URL | Auth | Role |
|--------|-----|------|------|
| GET | `/users` | ✅ | admin/dosen |

**Query Parameters:**
- `role` (opsional): filter role (admin, dosen, mahasiswa)

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "email": "dosen@itk.ac.id",
    "name": "Dr. Dosen",
    "role": "dosen",
    "is_active": true,
    "created_at": "2026-04-29T10:00:00Z"
  }
]
```

---

#### Get User Profile
| Method | URL | Auth |
|--------|-----|------|
| GET | `/users/profile/{user_id}` | ✅ |

**Response (200 OK):**
```json
{
  "id": 1,
  "email": "student@student.itk.ac.id",
  "name": "Mahasiswa",
  "role": "mahasiswa",
  "is_active": true,
  "phone": "+62812345678",
  "address": "Jl. Merdeka No. 1",
  "semester": 5,
  "classes": [],
  "created_at": "2026-04-29T10:00:00Z"
}
```

---

#### Update User Profile
| Method | URL | Auth |
|--------|-----|------|
| PUT | `/users/profile` | ✅ |

**Request Body:**
```json
{
  "name": "Nama Baru",
  "phone": "+62812345678",
  "address": "Jl. Baru No. 2"
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "email": "student@student.itk.ac.id",
  "name": "Nama Baru",
  "role": "mahasiswa",
  "is_active": true,
  "phone": "+62812345678",
  "address": "Jl. Baru No. 2",
  "created_at": "2026-04-29T10:00:00Z"
}
```

---

### 📚 Class Management

#### Create Class (Dosen Only)
| Method | URL | Auth | Role |
|--------|-----|------|------|
| POST | `/classes` | ✅ | dosen |

**Request Body:**
```json
{
  "name": "Cloud Computing",
  "code": "TK301",
  "description": "Pengenalan infrastruktur cloud",
  "semester": 5,
  "academic_year": "2025/2026",
  "max_students": 40,
  "instructor_id": 1
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "name": "Cloud Computing",
  "code": "TK301",
  "description": "Pengenalan infrastruktur cloud",
  "semester": 5,
  "academic_year": "2025/2026",
  "max_students": 40,
  "instructor_id": 1,
  "is_archived": false,
  "created_at": "2026-04-29T10:00:00Z"
}
```

---

#### List Classes
| Method | URL | Auth |
|--------|-----|------|
| GET | `/classes` | ✅ |

**Query Parameters:**
- `skip` (opsional): offset pagination
- `limit` (opsional): limit per page (default 20)
- `semester` (opsional): filter semester
- `instructor_id` (opsional): filter dosen pengampu

**Response (200 OK):**
```json
{
  "total": 5,
  "classes": [
    {
      "id": 1,
      "name": "Cloud Computing",
      "code": "TK301",
      "semester": 5,
      "academic_year": "2025/2026",
      "instructor_id": 1,
      "is_archived": false,
      "created_at": "2026-04-29T10:00:00Z"
    }
  ]
}
```

---

#### Get Class Detail
| Method | URL | Auth |
|--------|-----|------|
| GET | `/classes/{class_id}` | ✅ |

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "Cloud Computing",
  "code": "TK301",
  "description": "Pengenalan infrastruktur cloud",
  "semester": 5,
  "academic_year": "2025/2026",
  "max_students": 40,
  "instructor_id": 1,
  "is_archived": false,
  "created_at": "2026-04-29T10:00:00Z",
  "updated_at": "2026-04-29T10:00:00Z"
}
```

---

#### Update Class (Dosen Only)
| Method | URL | Auth | Role |
|--------|-----|------|------|
| PUT | `/classes/{class_id}` | ✅ | dosen |

**Request Body:**
```json
{
  "name": "Cloud Computing Lanjutan",
  "description": "Updated description"
}
```

**Response (200 OK):** ClassResponse

---

#### Delete Class (Dosen Only)
| Method | URL | Auth | Role |
|--------|-----|------|------|
| DELETE | `/classes/{class_id}` | ✅ | dosen |

**Response:** 204 No Content

---

#### Archive Class (Dosen Only)
| Method | URL | Auth | Role |
|--------|-----|------|------|
| PATCH | `/classes/{class_id}/archive` | ✅ | dosen |

**Response (200 OK):** ClassResponse

---

#### Unarchive Class (Dosen Only)
| Method | URL | Auth | Role |
|--------|-----|------|------|
| PATCH | `/classes/{class_id}/unarchive` | ✅ | dosen |

**Response (200 OK):** ClassResponse

---

### 👨‍🎓 Student Management (Class)

#### Add Student to Class (Dosen Only)
| Method | URL | Auth | Role |
|--------|-----|------|------|
| POST | `/classes/{class_id}/students/{user_id}` | ✅ | dosen |

**Response (201 Created):**
```json
{
  "message": "Student berhasil ditambahkan ke class"
}
```

---

#### Remove Student from Class (Dosen Only)
| Method | URL | Auth | Role |
|--------|-----|------|------|
| DELETE | `/classes/{class_id}/students/{user_id}` | ✅ | dosen |

**Response:** 204 No Content

---

#### Get Class Students
| Method | URL | Auth |
|--------|-----|------|
| GET | `/classes/{class_id}/students` | ✅ |

**Response (200 OK):**
```json
[
  {
    "id": 2,
    "email": "student@student.itk.ac.id",
    "name": "Mahasiswa",
    "role": "mahasiswa",
    "is_active": true,
    "created_at": "2026-04-29T10:00:00Z"
  }
]
```

---

#### Get User Classes
| Method | URL | Auth |
|--------|-----|------|
| GET | `/users/{user_id}/classes` | ✅ |

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Cloud Computing",
    "code": "TK301",
    "semester": 5,
    "academic_year": "2025/2026",
    "instructor_id": 1,
    "is_archived": false
  }
]
```

---

### 📄 Material Management

#### Upload Material (Dosen Only)
| Method | URL | Auth | Role |
|--------|-----|------|------|
| POST | `/classes/{class_id}/materials` | ✅ | dosen |

**Request Body:**
```json
{
  "title": "Cloud Architecture Basics",
  "description": "Pengenalan arsitektur cloud",
  "material_type": "pdf",
  "is_published": true,
  "external_link": "https://example.com/file.pdf"
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "class_id": 1,
  "title": "Cloud Architecture Basics",
  "description": "Pengenalan arsitektur cloud",
  "material_type": "pdf",
  "is_published": true,
  "file_path": null,
  "file_size": null,
  "external_link": "https://example.com/file.pdf",
  "uploaded_by": 1,
  "created_at": "2026-04-29T10:00:00Z",
  "updated_at": null
}
```
**Note:** `material_type` bisa: `pdf`, `ppt`, `video`, `link`

---

#### List Materials
| Method | URL | Auth |
|--------|-----|------|
| GET | `/classes/{class_id}/materials` | ✅ |

**Query Parameters:**
- `skip` (opsional)
- `limit` (opsional, default 20)

**Response (200 OK):**
```json
{
  "total": 3,
  "materials": [...]
}
```

---

#### Get Material Detail
| Method | URL | Auth |
|--------|-----|------|
| GET | `/classes/{class_id}/materials/{material_id}` | ✅ |

**Response (200 OK):** MaterialResponse

---

#### Update Material (Dosen Only)
| Method | URL | Auth | Role |
|--------|-----|------|------|
| PUT | `/classes/{class_id}/materials/{material_id}` | ✅ | dosen |

**Request Body:**
```json
{
  "title": "Updated Title",
  "is_published": false
}
```

**Response (200 OK):** MaterialResponse

---

#### Delete Material (Dosen Only)
| Method | URL | Auth | Role |
|--------|-----|------|------|
| DELETE | `/classes/{class_id}/materials/{material_id}` | ✅ | dosen |

**Response:** 204 No Content

---

### 📦 Item Management

#### Create Item
| Method | URL | Auth |
|--------|-----|------|
| POST | `/items` | ✅ |

**Request Body:**
```json
{
  "name": "Laptop Server",
  "description": "Laptop untuk cloud computing",
  "price": 15000000,
  "quantity": 10
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "name": "Laptop Server",
  "description": "Laptop untuk cloud computing",
  "price": 15000000,
  "quantity": 10,
  "created_at": "2026-04-29T10:00:00Z",
  "updated_at": "2026-04-29T10:00:00Z"
}
```

---

#### List Items
| Method | URL | Auth |
|--------|-----|------|
| GET | `/items` | ✅ |

**Query Parameters:**
- `skip` (opsional)
- `limit` (opsional, default 20)
- `search` (opsional): search by name

**Response (200 OK):**
```json
{
  "total": 1,
  "items": [...]
}
```

---

#### Get Item Stats
| Method | URL | Auth |
|--------|-----|------|
| GET | `/items/stats` | ✅ |

**Response (200 OK):**
```json
{
  "total_items": 5,
  "total_value": 75000000,
  "termahal": 25000000,
  "termurah": 5000000
}
```

---

#### Get Item
| Method | URL | Auth |
|--------|-----|------|
| GET | `/items/{item_id}` | ✅ |

**Response (200 OK):** ItemResponse

---

#### Update Item
| Method | URL | Auth |
|--------|-----|------|
| PUT | `/items/{item_id}` | ✅ |

**Request Body:**
```json
{
  "quantity": 15
}
```

**Response (200 OK):** ItemResponse

---

#### Delete Item
| Method | URL | Auth |
|--------|-----|------|
| DELETE | `/items/{item_id}` | ✅ |

**Response:** 204 No Content

---

### 👥 Team Info

#### Get Team
| Method | URL |
|--------|-----|
| GET | `/team` |

**Response (200 OK):**
```json
{
  "team": "cloud-kelompok-a-nexa",
  "members": [
    {
      "name": "Dzaky Rasyiq Zuhair",
      "nim": "10231035",
      "role": "Lead Backend"
    },
    {
      "name": "Dhiya Afifah",
      "nim": "10231031",
      "role": "Lead Frontend"
    },
    {
      "name": "Ika Agustin Wulandari",
      "nim": "10231041",
      "role": "Lead DevOps"
    },
    {
      "name": "Gabriel Karmen Sanggalangi",
      "nim": "10231039",
      "role": "Lead QA & Docs"
    }
  ]
}
```
## 📚 Dokumentasi

| Dokumen | Deskripsi |
|---------|-----------|
| [`docs/architecture.md`](docs/architecture.md) | Arsitektur dual-mode (monolith + microservices), diagram, API contract |
| [`docs/reliability-testing.md`](docs/reliability-testing.md) | 9 skenario reliability testing dengan hasil |
| [`docs/operations-guide.md`](docs/operations-guide.md) | Panduan operasional: health check, logging, tracing, metrics, troubleshooting |
| [`docs/deployment-guide.md`](docs/deployment-guide.md) | Panduan deployment ke Railway / Render |
| [`docs/release-notes.md`](docs/release-notes.md) | Release notes v1.0.0 s.d. v3.0.0 |
| [`docs/git-workflow.md`](docs/git-workflow.md) | Git workflow, branch naming, commit convention, code review |
| [`docs/setup-guide.md`](docs/setup-guide.md) | Panduan instalasi lokal |
| [`docs/testing-guide.md`](docs/testing-guide.md) | Panduan testing |
| [`docs/api-test-results.md`](docs/api-test-results.md) | Hasil uji coba API |
| [`docs/ui-test-results.md`](docs/ui-test-results.md) | Hasil uji coba UI |