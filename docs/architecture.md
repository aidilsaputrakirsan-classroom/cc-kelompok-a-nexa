# Architecture Guide — Studyfy

Dokumentasi arsitektur sistem **Studyfy** — mulai dari diagram komponen, daftar services, API contract, cara menjalankan lokal, hingga cara debug per service.

---

## 📑 Daftar Isi
1. [Arsitektur Overview](#-arsitektur-overview)
2. [Diagram Arsitektur](#-diagram-arsitektur)
3. [Daftar Services & Ports](#-daftar-services--ports)
4. [API Contract (Backend Services)](#-api-contract--backend-services)
5. [Data Model & Relasi Database](#-data-model--relasi-database)
6. [Cara Menjalankan Lokal](#-cara-menjalankan-lokal)
7. [Cara Debug Per Service](#-cara-debug-per-service)
8. [Environment Variables](#-environment-variables)

---

## 🏗️ Arsitektur Overview

Sistem **Studyfy** menggunakan **dual-mode architecture**:

| Mode | File | Tujuan |
|------|------|--------|
| **Monolith** | `docker-compose.yml` | Development — semua domain service dalam satu app backend (FastAPI) + satu database |
| **Microservices** | `docker-compose.microservices.yml` | UAS/Production — service terpisah (auth-service, item-service) dengan database masing-masing, gateway (Nginx), monitoring (Prometheus + Grafana) |

### Monolith Mode (Development)

Arsitektur **modular monolith** dengan domain service separation di dalam satu aplikasi backend. Setiap domain service memiliki batasan tanggung jawab yang jelas dan berkomunikasi melalui REST API.

### Service Boundary

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT / BROWSER                        │
│          React SPA (Vite + Nginx) — Port 3000               │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ REST API (HTTP/JSON)
                           │ JWT Authentication
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY / REVERSE PROXY              │
│                         Nginx                               │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND — FastAPI                       │
│                      Port 8000                              │
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐  │
│  │  Auth    │ │  User    │ │  Class   │ │  Material      │  │
│  │  Service │ │  Service │ │  Service │ │  Service       │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────────────┘  │
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐  │
│  │Assignment│ │Submission│ │  Grade   │ │  Item          │  │
│  │ Service  │ │ Service  │ │  Service │ │  Service       │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            Middleware Layer                          │   │
│  │  ┌───────────┐  ┌───────────┐  ┌──────────────────┐  │   │
│  │  │ JWT Auth  │  │ CORS      │  │ Error Handler    │  │   │
│  │  │ Middleware│  │ Middleware│  │                  │  │   │
│  │  └───────────┘  └───────────┘  └──────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ SQLAlchemy ORM
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                   POSTGRESQL DATABASE                        │
│                      Port 5433                               │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐   │
│  │  Users   │ │ Classes  │ │Materials │ │  Assignments   │   │
│  │  Table   │ │ Table    │ │ Table    │ │  Table         │   │
│  └──────────┘ └──────────┘ └──────────┘ └────────────────┘   │
│                                                              │
│  ┌───────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐  │
│  │Submissions│ │ Grades   │ │  Items   │ │ User_Class     │  │
│  │ Table     │ │ Table    │ │  Table   │ │ Assoc Table    │  │
│  └───────────┘ └──────────┘ └──────────┘ └────────────────┘  │
│                                                              │
│                   Persistent Volume (Docker)                 │
└──────────────────────────────────────────────────────────────┘
```

---

## 📐 Diagram Arsitektur

### High-Level Architecture

```mermaid
flowchart TB
    subgraph CLIENT["🌐 Client Layer"]
        BROWSER["🖥️ Browser<br/>React SPA"]
        NGINX["⚡ Nginx<br/>Reverse Proxy<br/>Port 3000"]
    end

    subgraph BACKEND["🐍 Backend Layer"]
        API["FastAPI App<br/>Port 8000"]
        
        subgraph SERVICES["Domain Services"]
            AUTH["Auth Service<br/>JWT, Register, Login"]
            USER["User Service<br/>Profile, Management"]
            CLASS["Class Service<br/>CRUD, Archive, Students"]
            MAT["Material Service<br/>Upload, CRUD"]
            ASSIGN["Assignment Service<br/>CRUD, Deadlines"]
            SUB["Submission Service<br/>File Upload, Tracking"]
            GRADE["Grade Service<br/>Scoring, Grading"]
            ITEM["Item Service<br/>CRUD, Stats, Category"]
        end
    end

    subgraph DATA["📦 Data Layer"]
        DB[("PostgreSQL 16<br/>Port 5433")]
        VOL[("Docker Volume<br/>studyfy-pgdata")]
    end

    BROWSER -->|"HTTP 3000"| NGINX
    NGINX -->|"REST API 8000"| API
    API --> AUTH
    API --> USER
    API --> CLASS
    API --> MAT
    API --> ASSIGN
    API --> SUB
    API --> GRADE
    API --> ITEM
    AUTH --> DB
    USER --> DB
    CLASS --> DB
    MAT --> DB
    ASSIGN --> DB
    SUB --> DB
    GRADE --> DB
    ITEM --> DB
    DB -.-> VOL
```

### Request Flow

```mermaid
sequenceDiagram
    participant C as 🌐 Client
    participant N as ⚡ Nginx :3000
    participant A as 🐍 API :8000
    participant M as 🔐 Auth Middleware
    participant S as 📦 Service Layer
    participant D as 🗄️ Database :5433

    C->>N: HTTP Request
    N->>A: Proxy ke Backend
    
    alt Public Endpoint (register, login, health)
        A->>S: Langsung ke service
        S->>D: Query/Write
        D-->>S: Result
        S-->>A: Response
        A-->>C: JSON Response
    else Protected Endpoint
        A->>M: Validasi JWT Token
        M-->>A: User Payload
        A->>S: Process request + user context
        S->>D: Query/Write dengan authorization
        D-->>S: Result
        S-->>A: Response
        A-->>C: JSON Response
    end
```

### Microservices Cluster Architecture (UAS / Production)

```mermaid
flowchart TB
    subgraph EXTERNAL["🔓 External"]
        USER["👤 User"]
        BROWSER["🖥️ Browser"]
    end

    subgraph GW["🚪 Gateway Layer"]
        NGINX["⚡ Nginx Gateway<br/>Port 8080"]
    end

    subgraph MS["🔧 Microservices"]
        AUTH["🔐 Auth Service<br/>Port 8001"]
        ITEM["📦 Item Service<br/>Port 8002"]
    end

    subgraph DB["🗄️ Databases"]
        AUTH_DB[("auth-db<br/>PostgreSQL 16")]
        ITEM_DB[("item-db<br/>PostgreSQL 16")]
    end

    subgraph MON["📊 Monitoring"]
        PROM["📈 Prometheus<br/>Port 9090"]
        GRAFANA["📉 Grafana<br/>Port 3002"]
    end

    subgraph FE["🎨 Frontend"]
        REACT["React SPA<br/>Port 3000"]
    end

    USER --> BROWSER
    BROWSER -->|"HTTP 8080"| NGINX
    NGINX -->|"/auth/*"| AUTH
    NGINX -->|"/items"| ITEM
    NGINX -->|"/"| REACT
    NGINX -->|"/health"| NGINX
    
    AUTH --> AUTH_DB
    ITEM --> ITEM_DB
    
    ITEM -.->|"verify token"| AUTH
    
    PROM -->|"scrape /metrics"| AUTH
    PROM -->|"scrape /metrics"| ITEM
    GRAFANA -->|"query"| PROM
```

### Request Flow with Circuit Breaker

```mermaid
sequenceDiagram
    participant C as 🌐 Client
    participant G as 🚪 Gateway :8080
    participant I as 📦 Item Service :8002
    participant A as 🔐 Auth Service :8001
    participant CB as ⚡ Circuit Breaker

    C->>G: GET /items (Authorization: Bearer token)
    G->>I: Proxy request
    
    Note over I,CB: Cek circuit breaker state
    alt CB == OPEN
        I->>CB: can_execute()?
        CB-->>I: false (fail fast)
        I-->>C: 503 Service Unavailable
    else CB == CLOSED or HALF_OPEN
        I->>CB: can_execute()?
        CB-->>I: true
        
        loop Retry 3x (exponential backoff)
            I->>A: GET /verify (Authorization)
            
            alt Auth Service OK
                A-->>I: 200 OK (user payload)
                I->>CB: record_success()
                I-->>C: 200 OK (items data)
            else Auth Service Error (5xx / timeout / connect error)
                A-->>I: Error
                Note over I: Retry dengan delay: 0.5s, 1s, 2s
            end
        end
        
        Note over I,CB: Semua retry gagal
        I->>CB: record_failure()
        Note over CB: failure_count++
        
        alt failure_count >= 5
            CB-->>CB: State: CLOSED → OPEN
            Note over CB: Cooldown 30 detik
        end
        
        I-->>C: 503 Auth Service unavailable
    end
```

---

## 🖥️ Daftar Services & Ports

| Service | Teknologi | Container Name | Port (Host) | Port (Container) | Network |
|---------|-----------|----------------|-------------|------------------|---------|
| **Frontend** | React + Vite + Nginx | `studyfy-frontend` | `3000` | `80` | studyfy-network |
| **Backend API** | FastAPI + Uvicorn | `studyfy-backend` | `8000` | `8000` | studyfy-network |
| **Database** | PostgreSQL 16 Alpine | `studyfy-db` | `5433` | `5432` | studyfy-network |

### Microservices Mode — Services & Ports

| Service | Teknologi | Container Name | Port (Host) | Port (Container) | Network |
|---------|-----------|----------------|-------------|------------------|---------|
| **Gateway** | Nginx Alpine | `studyfy-nginx-gateway` | `8080` | `80` | studyfy-mesh |
| **Auth Service** | FastAPI | `studyfy-auth-service` | `8001` | `8001` | studyfy-mesh |
| **Item Service** | FastAPI | `studyfy-item-service` | `8002` | `8002` | studyfy-mesh |
| **Auth DB** | PostgreSQL 16 Alpine | `studyfy-auth-db` | - | `5432` | studyfy-mesh |
| **Item DB** | PostgreSQL 16 Alpine | `studyfy-item-db` | - | `5432` | studyfy-mesh |
| **Frontend** | React + Vite + Nginx | `studyfy-frontend` | - | `80` | studyfy-mesh |
| **Prometheus** | Prometheus v2.45.0 | `studyfy-prometheus` | `9090` | `9090` | studyfy-mesh |
| **Grafana** | Grafana latest | `studyfy-grafana` | `3002` | `3000` | studyfy-mesh |

### Gateway Routes

| Path | Target | Description |
|------|--------|-------------|
| `/auth/*` | auth-service:8001 | Auth endpoints (register, login, verify) |
| `/items` | item-service:8002/items | Item CRUD |
| `/health` | Static response | Health check aggregator — selalu `200` |
| `/` | frontend:3000 | React SPA |

**File:** `services/gateway/nginx.conf`

### Akses Aplikasi

#### Monolith Mode

| Service | URL (Lokal) | URL (Docker) |
|---------|-------------|--------------|
| Frontend | `http://localhost:3000` | `http://frontend:80` |
| Backend API | `http://localhost:8000` | `http://backend:8000` |
| PostgreSQL | `localhost:5433` | `db:5432` |

#### Microservices Mode

| Service | URL (Lokal) | URL (Docker) |
|---------|-------------|--------------|
| Frontend (via Gateway) | `http://localhost:8080` | `http://gateway:80` |
| Auth Service (langsung) | `http://localhost:8001` | `http://auth-service:8001` |
| Item Service (langsung) | `http://localhost:8002` | `http://item-service:8002` |
| Prometheus | `http://localhost:9090` | `http://prometheus:9090` |
| Grafana | `http://localhost:3002` | `http://grafana:3000` |
| Auth DB | `localhost:5433` (auth-db) | `auth-db:5432` |
| Item DB | `localhost:5434` (item-db) | `item-db:5432` |

---

## 📡 API Contract — Backend Services

### 1. Auth Service

| Method | Endpoint | Auth | Role | Deskripsi |
|--------|----------|------|------|-----------|
| POST | `/auth/register` | ❌ | - | Registrasi user baru |
| POST | `/auth/login` | ❌ | - | Login & dapatkan JWT token |
| GET | `/auth/me` | ✅ | - | Ambil data user yang login |
| POST | `/auth/password-reset-request` | ❌ | - | Request reset password |
| POST | `/auth/password-reset-verify` | ❌ | - | Verify token & reset password |

**File:** `backend/auth.py`, `backend/main.py` (line 81-150)

**Example Response Login (200 OK):**
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
    "semester": 5,
    "created_at": "2026-04-29T10:00:00Z"
  }
}
```

---

### 2. User Service

| Method | Endpoint | Auth | Role | Deskripsi |
|--------|----------|------|------|-----------|
| GET | `/users` | ✅ | dosen/admin | List semua user (filter by role) |
| GET | `/users/profile/{user_id}` | ✅ | - | Ambil profil user |
| PUT | `/users/profile` | ✅ | - | Update profil sendiri |
| GET | `/users/{user_id}/classes` | ✅ | - | Ambil classes user |

**File:** `backend/main.py` (line 152-196, 355-367)

---

### 3. Class Service

| Method | Endpoint | Auth | Role | Deskripsi |
|--------|----------|------|------|-----------|
| POST | `/classes` | ✅ | dosen | Buat class baru |
| GET | `/classes` | ✅ | - | List classes (filterable) |
| GET | `/classes/{class_id}` | ✅ | - | Detail class |
| PUT | `/classes/{class_id}` | ✅ | dosen | Update class |
| DELETE | `/classes/{class_id}` | ✅ | dosen | Hapus class |
| PATCH | `/classes/{class_id}/archive` | ✅ | dosen | Archive class |
| PATCH | `/classes/{class_id}/unarchive` | ✅ | dosen | Unarchive class |
| POST | `/classes/{class_id}/students/{user_id}` | ✅ | dosen | Tambah student ke class |
| DELETE | `/classes/{class_id}/students/{user_id}` | ✅ | dosen | Hapus student dari class |
| GET | `/classes/{class_id}/students` | ✅ | - | List student di class |

**File:** `backend/main.py` (line 198-383)

**Example Response Class (200 OK):**
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
  "updated_at": null
}
```

---

### 4. Material Service

| Method | Endpoint | Auth | Role | Deskripsi |
|--------|----------|------|------|-----------|
| POST | `/classes/{class_id}/materials` | ✅ | dosen | Upload materi baru |
| GET | `/classes/{class_id}/materials` | ✅ | - | List materi class |
| GET | `/classes/{class_id}/materials/{material_id}` | ✅ | - | Detail materi |
| PUT | `/classes/{class_id}/materials/{material_id}` | ✅ | dosen | Update materi |
| DELETE | `/classes/{class_id}/materials/{material_id}` | ✅ | dosen | Hapus materi |

**File:** `backend/main.py` (line 432-537)

**Material Types:** `pdf`, `ppt`, `video`, `link`

---

### 5. Assignment Service

| Method | Endpoint | Auth | Role | Deskripsi |
|--------|----------|------|------|-----------|
| POST | `/classes/{class_id}/assignments` | ✅ | dosen | Buat assignment |
| GET | `/classes/{class_id}/assignments` | ✅ | - | List assignment class |
| GET | `/classes/{class_id}/assignments/{assignment_id}` | ✅ | - | Detail assignment |
| PUT | `/classes/{class_id}/assignments/{assignment_id}` | ✅ | dosen | Update assignment |
| DELETE | `/classes/{class_id}/assignments/{assignment_id}` | ✅ | dosen | Hapus assignment |

**File:** `backend/main.py` (line 540-650)

---

### 6. Submission Service

| Method | Endpoint | Auth | Role | Deskripsi |
|--------|----------|------|------|-----------|
| POST | `/classes/{class_id}/assignments/{assignment_id}/submissions` | ✅ | mahasiswa | Submit assignment (file PDF, max 2MB) |
| GET | `/classes/{class_id}/assignments/{assignment_id}/submissions` | ✅ | dosen | List submissions |
| GET | `/classes/{class_id}/assignments/{assignment_id}/my-submission` | ✅ | mahasiswa | Submission saya |
| GET | `/submissions/{submission_id}` | ✅ | - | Detail submission |
| DELETE | `/submissions/{submission_id}/return` | ✅ | dosen | Return submission |

**File:** `backend/main.py` (line 652-838)

**Submission Rules:**
- File format: **PDF only**
- Max file size: **2MB**
- Deadline validation dengan WITA (UTC+8) timezone
- Late submission hanya jika `allow_late_submission = true`

---

### 7. Grade Service

| Method | Endpoint | Auth | Role | Deskripsi |
|--------|----------|------|------|-----------|
| POST | `/submissions/{submission_id}/grade` | ✅ | dosen | Beri nilai submission |
| GET | `/submissions/{submission_id}/grade` | ✅ | - | Ambil grade submission |

**File:** `backend/main.py` (line 841-901)

**Grading Rules:**
- Score range: `0` hingga `max_score` (default 100)
- Hanya dosen pembuat assignment yang bisa memberi grade
- Student hanya bisa lihat grade submission sendiri

---

### 8. Item Service

| Method | Endpoint | Auth | Role | Deskripsi |
|--------|----------|------|------|-----------|
| POST | `/items` | ✅ | - | Buat item baru |
| GET | `/items` | ✅ | - | List items (search + category filter) |
| GET | `/items/stats` | ✅ | - | Statistik items |
| GET | `/items/{item_id}` | ✅ | - | Detail item |
| PUT | `/items/{item_id}` | ✅ | - | Update item |
| DELETE | `/items/{item_id}` | ✅ | - | Hapus item |

**File:** `backend/main.py` (line 905-968)

**Query Parameters:**
- `skip` (int, default 0) — offset pagination
- `limit` (int, default 20) — items per page
- `search` (string, optional) — search by name
- `category` (string, optional) — filter by category

---

### 9. Auth Service (Microservices) — Port 8001

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| POST | `/register` | ❌ | Registrasi user baru |
| POST | `/login` | ❌ | Login, dapatkan JWT token |
| GET | `/verify` | ✅ (Header) | Verifikasi token — dipanggil service lain |
| GET | `/health` | ❌ | Health check |
| GET | `/metrics` | ❌ | Metrics endpoint (Prometheus) |

**File:** `services/auth-service/main.py`

**Example Verify Response (200 OK):**
```json
{
  "user_id": 1,
  "email": "user@example.com",
  "name": "Nama Lengkap"
}
```

### 10. Item Service (Microservices) — Port 8002

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| POST | `/items` | ✅ | Buat item baru |
| GET | `/items` | ✅ | List items (search filter) |
| GET | `/items/stats` | ✅ | Statistik items |
| GET | `/items/{item_id}` | ✅ | Detail item |
| PUT | `/items/{item_id}` | ✅ | Update item |
| DELETE | `/items/{item_id}` | ✅ | Hapus item |
| GET | `/health` | ❌ | Health check (termasuk CB status) |
| GET | `/metrics` | ❌ | Metrics endpoint (Prometheus) |

**File:** `services/item-service/main.py`

**Query Parameters (GET /items):**
- `search` (string, optional) — search by name
- `skip` (int, default 0) — offset
- `limit` (int, default 20) — max items

**Health Check Response (normal):**
```json
{
  "status": "healthy",
  "service": "item-service",
  "version": "2.1.0",
  "dependencies": {
    "auth-service": {
      "state": "CLOSED",
      "failure_count": 0,
      "total_rejected": 0
    }
  }
}
```

**Health Check Response (auth-service down):**
```json
{
  "status": "degraded",
  "service": "item-service",
  "version": "2.1.0",
  "dependencies": {
    "auth-service": {
      "state": "OPEN",
      "failure_count": 5,
      "total_rejected": 3
    }
  }
}
```

---

### Public Endpoints

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/health` | ❌ | Health check (status semua komponen) |
| GET | `/team` | ❌ | Informasi tim |

**File:** `backend/main.py` (line 60-78, 973-983)

**Health Check Response:**
```json
{
  "status": "healthy",
  "service": "backend",
  "version": "1.0.0",
  "database": "connected"
}
```

---

## 🗄️ Data Model & Relasi Database

```mermaid
erDiagram
    User ||--o{ Class : "mengelola sebagai instructor"
    User }o--o{ Class : "terdaftar sebagai student"
    User ||--o{ Material : "mengupload"
    User ||--o{ Assignment : "membuat"
    User ||--o{ Submission : "mengirim"
    User ||--o{ Grade : "memberi nilai"

    Class ||--o{ Material : "memiliki"
    Class ||--o{ Assignment : "memiliki"

    Assignment ||--o{ Submission : "menerima"
    Submission ||--o| Grade : "dinilai"

    Item ||--o| Item : "-"

    User {
        int id PK
        string email UK
        string name
        string hashed_password
        enum role "admin | dosen | mahasiswa"
        bool is_active
        string phone "nullable"
        string address "nullable"
        string profile_picture "nullable"
        int semester "nullable"
        string sso_provider "nullable"
        string sso_id UK "nullable"
        string reset_token UK "nullable"
        datetime reset_token_expiry "nullable"
        datetime created_at
        datetime updated_at
    }

    Class {
        int id PK
        string name
        string code UK
        string description "nullable"
        int instructor_id FK
        int semester
        string academic_year
        int max_students "nullable"
        bool is_archived
        datetime archived_at "nullable"
        datetime created_at
        datetime updated_at
    }

    Material {
        int id PK
        int class_id FK
        string title
        string description "nullable"
        enum material_type "pdf | ppt | video | link"
        string file_path "nullable"
        int file_size "nullable"
        string external_link "nullable"
        int uploaded_by FK
        bool is_published
        datetime created_at
        datetime updated_at
    }

    Assignment {
        int id PK
        int class_id FK
        string title
        string description "nullable"
        datetime deadline
        bool allow_late_submission
        int max_score
        int created_by FK
        bool is_published
        datetime created_at
        datetime updated_at
    }

    Submission {
        int id PK
        int assignment_id FK
        int student_id FK
        string file_path
        string original_filename
        int file_size
        int submission_number
        datetime submitted_at
        bool is_late
        datetime created_at
        datetime updated_at
    }

    Grade {
        int id PK
        int submission_id FK UK
        float score
        int graded_by FK
        datetime graded_at
        datetime created_at
        datetime updated_at
    }

    Item {
        int id PK
        string name
        string description "nullable"
        float price
        int quantity
        string category "nullable"
        datetime created_at
        datetime updated_at
    }
```

### Entity Relationship Summary

| Entity | Tabel | Relasi Utama |
|--------|-------|--------------|
| **User** | `users` | M:N dengan Class (student), 1:N dengan Class (instructor) |
| **Class** | `classes` | M:N dengan User, 1:N dengan Material & Assignment |
| **Material** | `materials` | N:1 dengan Class & User |
| **Assignment** | `assignments` | N:1 dengan Class & User, 1:N dengan Submission |
| **Submission** | `submissions` | N:1 dengan Assignment & User, 1:1 dengan Grade |
| **Grade** | `grades` | 1:1 dengan Submission, N:1 dengan User |
| **Item** | `items` | Standalone |

---

## 🚀 Cara Menjalankan Lokal

### Prasyarat 
- Docker & Docker Compose (recommended)
- Atau: Python 3.10+, Node.js 18+, PostgreSQL

### Opsi 1: Docker Compose (Recommended)

Menjalankan semua services sekaligus:
```bash
docker compose up -d
```

Verifikasi semua services berjalan:
```bash
docker compose ps
```

Output:
```
NAME              SERVICE           STATUS          PORTS
studyfy-db        db                running          0.0.0.0:5433->5432/tcp
studyfy-backend   backend           running          0.0.0.0:8000->8000/tcp
studyfy-frontend  frontend          running          0.0.0.0:3000->80/tcp
```

Cek health:
```bash
curl http://localhost:8000/health
```

### Opsi 2: Microservices Mode (Docker Compose)

Menjalankan full microservices cluster (UAS/Production):
```bash
docker compose -f docker-compose.microservices.yml up -d --build
```

Verifikasi semua services berjalan:
```bash
docker compose -f docker-compose.microservices.yml ps
```

Output:
```
NAME                    SERVICE             STATUS          PORTS
studyfy-auth-db         auth-db             running          5432/tcp
studyfy-item-db         item-db             running          5432/tcp
studyfy-auth-service    auth-service        running          8001/tcp
studyfy-item-service    item-service        running          8002/tcp
studyfy-nginx-gateway   gateway             running          0.0.0.0:8080->80/tcp
studyfy-frontend        frontend            running          80/tcp
studyfy-prometheus      prometheus          running          0.0.0.0:9090->9090/tcp
studyfy-grafana         grafana             running          0.0.0.0:3002->3000/tcp
```

Cek health via gateway:
```bash
curl http://localhost:8080/health
curl http://localhost:8080/auth/health
curl http://localhost:8080/items
```

### Opsi 3: Production Mode

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Production mode mirip microservices tapi tanpa monitoring (Prometheus/Grafana), port gateway di `80`.

### Opsi 4: Manual (Tanpa Docker)

**1. Database**
```bash
# Pastikan PostgreSQL berjalan di localhost:5432
# Buat database studyfy
psql -U postgres -c "CREATE DATABASE studyfy;"
```

**2. Backend**
```bash
cd backend
cp .env.example .env
# Edit .env: isi DATABASE_URL
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**3. Frontend**
```bash
cd frontend
npm install
npm run dev
```

### Makefile Commands

| Command | Deskripsi |
|---------|-----------|
| `make up` | Start semua services (monolith + microservices + dev) |
| `make build` | Start dengan rebuild |
| `make dev` | Development mode (hot-reload) |
| `make prod` | Production mode (`docker-compose.prod.yml`) |
| `make down` | Stop & remove containers |
| `make clean` | Stop + remove containers + hapus volumes |
| `make restart` | Restart semua services |
| `make logs` | Lihat logs (format warna) |
| `make logs-backend` | Lihat logs auth-service + item-service |
| `make ps` | Status containers |
| `make shell-auth` | Masuk terminal auth-service |
| `make shell-item` | Masuk terminal item-service |
| `make shell-db` | Masuk PostgreSQL auth-db |
| `make test` | Jalankan pytest + vitest |
| `make lint` | Jalankan linter |
| `make pr-check` | Lint + test + build (sebelum PR) |

### Stop Services
```bash
# Monolith
docker compose down

# Microservices
docker compose -f docker-compose.microservices.yml down

# Production
docker compose -f docker-compose.prod.yml down

# Semua mode (Makefile)
make down
```

### Lihat Logs
```bash
# Semua services
docker compose logs -f

# Service spesifik
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db
```

---

## 🔍 Cara Debug Per Service

### Backend Debug

**1. Cek log backend**
```bash
docker compose logs -f backend
```

**2. Cek environment variables**
```bash
docker compose exec backend env | grep -E "DATABASE|CORS|ALLOWED"
```

**3. Cek koneksi database**
```bash
docker compose exec backend python -c "
from database import engine
from sqlalchemy import text
result = engine.connect().execute(text('SELECT 1'))
print('Database OK:', result.fetchone())
"
```

**4. Jalankan pytest di dalam container**
```bash
docker compose exec backend pytest -v
```

**5. Akses database langsung**
```bash
docker compose exec db psql -U postgres -d studyfy -c "\dt"
```

**6. Cek table structure**
```sql
docker compose exec db psql -U postgres -d studyfy -c "\d+ users"
```

### Frontend Debug

**1. Cek log frontend (Nginx)**
```bash
docker compose logs -f frontend
```

**2. Cek environment variable frontend**
```bash
docker compose exec frontend env | grep VITE
```

**3. Cek build frontend**
```bash
cd frontend
npm install
npm run build
# Cek folder dist/
```

**4. Cek error di browser:**
- Buka `http://localhost:3000`
- Klik kanan → **Inspect**
- Tab **Console** — lihat error JavaScript
- Tab **Network** — cek response API

### Database Debug

**1. Query langsung ke PostgreSQL**
```bash
docker compose exec -it db psql -U postgres -d studyfy
```

**2. Cek jumlah data per tabel**
```sql
SELECT schemaname, tablename, n_live_tup
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;
```

**3. Cek koneksi aktif**
```sql
SELECT pid, usename, application_name, client_addr, state
FROM pg_stat_activity;
```

**4. Backup & restore database**
```bash
# Backup
docker compose exec db pg_dump -U postgres studyfy > backup.sql

# Restore
cat backup.sql | docker compose exec -T db psql -U postgres studyfy
```

### Microservices Debug

**1. Cek circuit breaker state**
```bash
curl http://localhost:8002/health | python -m json.tool
# Lihat field: dependencies.auth-service.state
```

**2. Cek metrics item-service**
```bash
curl http://localhost:8002/metrics | python -m json.tool
```

**3. Cek log auth-service dengan filter**
```bash
docker compose -f docker-compose.microservices.yml logs auth-service --tail 50
```

**4. Simulasi failure (trigger circuit breaker)**
```bash
# Stop auth-service
docker compose -f docker-compose.microservices.yml stop auth-service

# Kirim request sampai CB trip
for ($i=1; $i -le 6; $i++) {
    curl -s -H "Authorization: Bearer test" http://localhost:8002/items
    Start-Sleep -Milliseconds 500
}

# Cek state CB
curl -s http://localhost:8002/health | ConvertFrom-Json | Select-Object -ExpandProperty dependencies

# Start kembali
docker compose -f docker-compose.microservices.yml start auth-service
```

**5. Akses Prometheus**
```bash
start http://localhost:9090
# Query: rate(request_count[1m])
```

**6. Akses Grafana**
```bash
start http://localhost:3002
# Login: admin / admin
# Add Prometheus data source: http://prometheus:9090
```

### Docker Network Debug

**1. Cek network**
```bash
docker network inspect studyfy-network
```

**2. Cek DNS resolution antar container**
```bash
docker compose exec backend ping db
docker compose exec backend python -c "import socket; print(socket.gethostbyname('db'))"
```

**3. Cek port yang bind**
```bash
docker compose ps
netstat -ano | findstr :8000
netstat -ano | findstr :3000
netstat -ano | findstr :5433
```

### Debug Checklist

| Masalah | Cek Pertama | Solusi |
|---------|-------------|--------|
| Backend 502/503 | Log backend & health endpoint | Restart backend: `docker compose restart backend` |
| Frontend blank page | Browser console (JS error) | Rebuild frontend: `docker compose up -d --build frontend` |
| Database connection refused | `docker compose ps` (cek status db) | Restart database: `docker compose restart db` |
| Port conflict | `netstat -ano \| findstr :8000` | Matikan aplikasi lain di port yang sama |
| File upload failed | Cek folder `uploads/` permission | `docker compose exec backend mkdir -p uploads/assignments` |
| CI pipeline failed | Baca log di GitHub Actions → tab Checks | Fix test atau build sesuai error message |

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Deskripsi |
|----------|----------|---------|-----------|
| `DATABASE_URL` | ✅ | - | PostgreSQL connection string |
| `SECRET_KEY` | ✅ | - | Secret key untuk JWT signing |
| `ALGORITHM` | ❌ | `HS256` | JWT encryption algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | ❌ | `30` | JWT token expiry (menit) |
| `ALLOWED_ORIGINS` | ❌ | `http://localhost:5173` | CORS allowed origins |

**Example `.env`:**
```
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/studyfy
SECRET_KEY=rahasiasekali123
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Frontend (`frontend/.env`)

| Variable | Required | Default | Deskripsi |
|----------|----------|---------|-----------|
| `VITE_API_URL` | ✅ | `http://localhost:8000` | Backend API base URL |

---

## 📚 Referensi

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy ORM Guide](https://docs.sqlalchemy.org/en/20/orm/)
- [Docker Compose Overview](https://docs.docker.com/compose/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/16/)
- [Nginx Reverse Proxy](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)

---

