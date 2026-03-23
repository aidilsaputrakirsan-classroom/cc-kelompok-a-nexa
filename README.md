# ☁️ Cloud App - [STUDYFY]

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
| React     | Frontend SPA |
| PostgreSQL | Database |
| Docker    | Containerization |
| GitHub Actions | CI/CD |
| Railway/Render | Cloud Deployment |

## 🏗️ Architecture

```
[React Frontend] <--HTTP--> [FastAPI Backend] <--SQL--> [PostgreSQL]
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
| 5-7 | Docker & Compose | ⬜ |
| 8 | UTS Demo | ⬜ |
| 9-11 | CI/CD Pipeline | ⬜ |
| 12-14 | Microservices | ⬜ |
| 15-16 | Final & UAS | ⬜ |

---

## 📁 Project Structure
```
cc-kelompok-a-nexa/
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
├── .gitignore
└── README.md

```
## Dokumentasi Endpoint

### Health Check

Method  : GET  <br>
URL : /health <br>
Request Body: None <br>
Response Example (200 OK):

```JSON
{
  "status": "healthy",
  "version": "0.2.0"
}
```

### Register

Method  : POST  <br>
URL : /auth/register <br>
Request Body:  
```JSON
{
  "email": "user@student.itk.ac.id",
  "name": "User testing",
  "password": "P@ssword123"
}
```
Response Example (201 OK):

```JSON
{
  "id": 0,
  "email": "string",
  "name": "string",
  "is_active": true,
  "created_at": "2026-03-23T12:36:30.754Z"
}
```

### Login

Method  : POST  <br>
URL : /auth/login <br>
Request Body:  
```JSON
{
  "email": "user@student.itk.ac.id",
  "password": "password123"
}
```
Response Example (200 OK):

```JSON
{
  "access_token": "string",
  "token_type": "bearer",
  "user": {
    "id": 0,
    "email": "string",
    "name": "string",
    "is_active": true,
    "created_at": "2026-03-23T12:38:03.624Z"
  }
}
```

### Get Me

Method  : GET  <br>
URL : /auth/me <br>
Request Body: None <br>
Response Example (200 OK):

```JSON
{
  "id": 0,
  "email": "string",
  "name": "string",
  "is_active": true,
  "created_at": "2026-03-23T12:38:38.627Z"
}
```

### Create Item

Method  : POST  <br>
URL : /item <br>
Request Body:
* name (string, wajib, max 100 karakter) 
* price (float, wajib, > 0)
* description (string, opsional)
* quantity (integer, opsional, default: 0)

```JSON
{
  "name": "Laptop Server",
  "description": "Laptop khusus untuk komputasi awan",
  "price": 15000000.0,
  "quantity": 10
}
```
Response Example (201 OK):

```JSON
{
  "name": "Laptop",
  "description": "Laptop untuk cloud computing",
  "price": 15000000,
  "quantity": 10,
  "id": 0,
  "created_at": "2026-03-08T03:55:23.101Z",
  "updated_at": "2026-03-08T03:55:23.101Z"
}
```

### List Items

Method  : GET  <br>
URL : /item <br>
Request Body: none <br>
Response Example (200 OK):

```JSON
{
  "total": 0,
  "items": [
    {
      "name": "Laptop",
      "description": "Laptop untuk cloud computing",
      "price": 15000000,
      "quantity": 10,
      "id": 0,
      "created_at": "2026-03-08T03:55:23.106Z",
      "updated_at": "2026-03-08T03:55:23.106Z"
    }
  ]
}
```

### Get Item Stats

Method  : GET  <br>
URL : /items/stats <br>
Request Body: none <br>
Response Example (200 OK):

```JSON
{
  "total_items": 0,
  "total_quantity": 0,
  "total_value": 0,
  "average_price": 0
}
```

### Get Item

Method  : GET  <br>
URL : /items/{item_id} <br>
Request Body: none <br>
Response Example (200 OK):

```JSON
{
  "name": "Laptop",
  "description": "Laptop untuk cloud computing",
  "price": 15000000,
  "quantity": 10,
  "id": 0,
  "created_at": "2026-03-08T03:55:23.109Z",
  "updated_at": "2026-03-08T03:55:23.109Z"
}
```

### Update Item

Method  : PUT  <br>
URL : /items/{item_id} <br>
Request Body: 
```JSON
{
  "name": "string",
  "description": "string",
  "price": 1,
  "quantity": 0
}
```
Response Example (200 OK):
```JSON
{
  "name": "Laptop",
  "description": "Laptop untuk cloud computing",
  "price": 15000000,
  "quantity": 10,
  "id": 0,
  "created_at": "2026-03-08T04:12:25.455Z",
  "updated_at": "2026-03-08T04:12:25.455Z"
}
```

### Delete Item

Method  : DELETE  <br>
URL : /items/{item_id} <br>
Request Body: none <br>
Response Example (422 eror): Validation Eror
```JSON
{
  "detail": [
    {
      "loc": [
        "string",
        0
      ],
      "msg": "string",
      "type": "string"
    }
  ]
}
```
### Team Information

Method  : GET  <br>
URL : /team <br>
Request Body: none <br>
Response Example (200 OK):
```JSON
{
  "team": "cloud-team-XX",
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