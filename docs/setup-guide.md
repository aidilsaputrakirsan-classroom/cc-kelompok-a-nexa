# 🚀 Setup Guide - Kelompok A NEXA

### 1. Prasyarat
* Python 3.10+
* Node.js 18+
* Docker Desktop

### 2. Instalasi Lokal
**Backend:**
1. `cd backend`
2. `pip install -r requirements.txt`
3. `uvicorn main:app --reload`

**Frontend:**
1. `cd frontend`
2. `npm install`
3. `npm run dev`

### 3. Menjalankan via Docker (Rekomendasi)
Cukup jalankan satu perintah di root folder:
`docker compose up --build`