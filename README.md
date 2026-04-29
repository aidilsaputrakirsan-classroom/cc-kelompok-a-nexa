# ☁️ Cloud App - [STUDYFY]

[![CI Testing](https://github.com/anomalyco/opencode/actions/workflows/ci-testing.yml/badge.svg)](https://github.com/anomalyco/opencode/actions/workflows/ci-testing.yml)

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
| FastAPI   | Backend REST API |
| SQLAlchemy | ORM |
| React     | Frontend SPA |
| Nginx     | Reverse Proxy |
| PostgreSQL | Database |
| Docker    | Containerization |
| Docker Compose | Orchestration |
| GitHub Actions | CI/CD |
| Railway/Render | Cloud Deployment |

## 🏗️ Architecture

```
[React Frontend (Nginx)] <--REST API (HTTP/JWT)--> [FastAPI Backend] <--SQLAlchemy ORM--> [PostgreSQL]
                                                                                               |
                                                                                         [Docker Volume]
```


## 🚀 Getting Started

### Prasyarat
- Python 3.10+
- Node.js 18+
- Git

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🐳 Docker

### Prasyarat
- Docker
- Docker Compose

### Menjalankan Semua Services
```bash
docker compose up -d
```

### Melihat Logs
```bash
docker compose logs -f
```

### Stop Services
```bash
docker compose down
```

### Status Services
```bash
docker compose ps
```

### Akses Aplikasi
| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| PostgreSQL | localhost:5433 |
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
| 9-11 | CI/CD Pipeline | 🔄 |
| 12-14 | Microservices | ⬜ |
| 15-16 | Final & UAS | ⬜ |

---

## 📁 Project Structure
```
cc-kelompok-a-nexa/
├── .github/
│   └── workflows/
│       └── ci-testing.yml
├── backend/
│   ├── main.py              
│   ├── auth.py              
│   ├── database.py
│   ├── models.py            
│   ├── schemas.py           
│   ├── crud.py              
│   ├── requirements.txt     
│   ├── .env                 
│   └── .env.example         
├── frontend/
│   ├── src/
│   │   ├── App.jsx              
│   │   ├── components/
│   │   │   ├── Header.jsx       
│   │   │   ├── LoginPage.jsx    
│   │   │   ├── SearchBar.jsx
│   │   │   ├── ItemForm.jsx
│   │   │   ├── ItemList.jsx
│   │   │   └── ItemCard.jsx
│   │   └── services/
│   │       └── api.js           
│   ├── .env
│   └── .env.example
├── scripts/
├── docs/
├── docker-compose.yml
├── Makefile
├── .gitignore
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
  "version": "0.4.0"
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
  "total_quantity": 50,
  "total_value": 75000000,
  "average_price": 15000000
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
## Hasil Uji Coba Endpoint

<img src="hasil_pengecekan/Screenshot 2026-02-28 192032.png">
<img src="hasil_pengecekan/Screenshot 2026-02-28 192041.png">
<img src="hasil_pengecekan/Screenshot 2026-02-28 192024.png">