# Deployment Guide — Studyfy

Panduan deployment sistem **Studyfy** ke platform cloud (Railway / Render).

---

## Prasyarat

- Akun [Railway](https://railway.app) atau [Render](https://render.com)
- Docker Desktop
- GitHub repository sudah terhubung

---

## Opsi 1: Railway

### Backend (Monolith)

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Init project di folder backend
cd backend
railway init

# 4. Set environment variables
railway variables set DATABASE_URL=postgresql://...
railway variables set SECRET_KEY=your-secret-key
railway variables set ALLOWED_ORIGINS=https://frontend-url.railway.app

# 5. Deploy
railway up
```

### Frontend

```bash
cd frontend
railway init
railway variables set VITE_API_URL=https://backend-url.railway.app
railway up
```

### Microservices Mode

Deploy setiap service terpisah:

| Service | Folder | Command |
|---------|--------|---------|
| Auth Service | `services/auth-service` | `railway up` |
| Item Service | `services/item-service` | `railway up` |
| Frontend | `frontend` | `railway up` |

---

## Opsi 2: Render

### Backend (Monolith)

1. Dashboard Render → **New +** → **Web Service**
2. Hubungkan GitHub repository
3. Konfigurasi:
   - **Name:** `studyfy-backend`
   - **Root Directory:** `backend`
   - **Runtime:** `Docker`
   - **Build Command:** (biarkan kosong)
   - **Start Command:** (biarkan kosong)
4. Set environment variables:
   - `DATABASE_URL` → dari Render PostgreSQL
   - `SECRET_KEY`
   - `ALLOWED_ORIGINS`
5. **Create Web Service**

### Database (Render PostgreSQL)

1. Dashboard → **New +** → **PostgreSQL**
2. Copy Internal Connection String
3. Set sebagai `DATABASE_URL` di backend

### Frontend

1. **New +** → **Static Site**
2. Hubungkan repository
3. **Root Directory:** `frontend`
4. **Build Command:** `npm install && npm run build`
5. **Publish Directory:** `dist`
6. Set `VITE_API_URL` ke URL backend

---

## Environment Variables

### Backend (Monolith)

| Variable | Required | Contoh |
|----------|----------|--------|
| `DATABASE_URL` | ✅ | `postgresql://user:pass@host:5432/db` |
| `SECRET_KEY` | ✅ | `random-256-bit-key` |
| `ALLOWED_ORIGINS` | ❌ | `https://frontend.railway.app` |
| `ENVIRONMENT` | ❌ | `production` |

### Auth Service (Microservices)

| Variable | Required | Contoh |
|----------|----------|--------|
| `DATABASE_URL` | ✅ | `postgresql://user:pass@host:5432/auth_db` |
| `SECRET_KEY` | ✅ | `random-256-bit-key` |
| `CORS_ORIGINS` | ❌ | `https://frontend.railway.app` |

### Item Service (Microservices)

| Variable | Required | Contoh |
|----------|----------|--------|
| `DATABASE_URL` | ✅ | `postgresql://user:pass@host:5432/item_db` |
| `AUTH_SERVICE_URL` | ✅ | `https://auth-service.railway.app` |
| `CORS_ORIGINS` | ❌ | `https://frontend.railway.app` |

### Frontend

| Variable | Required | Contoh |
|----------|----------|--------|
| `VITE_API_URL` | ✅ | `https://backend.railway.app` |

---

## Verifikasi Deployment

```bash
# Cek health backend
curl https://backend-url.railway.app/health

# Cek Swagger
open https://backend-url.railway.app/docs

# Cek frontend
open https://frontend-url.railway.app
```

---

## Troubleshooting Deployment

| Masalah | Penyebab | Solusi |
|---------|----------|--------|
| Build gagal | Missing dependency | Cek `requirements.txt` / `package.json` |
| Database connection refused | `DATABASE_URL` salah | Cek connection string di dashboard |
| CORS error | `ALLOWED_ORIGINS` tidak sesuai | Set ke URL frontend yang tepat |
| 502 Bad Gateway | Startup terlalu lambat | Naikkin plan atau optimasi startup time |
| Static files 404 | `VITE_API_URL` salah | Rebuild frontend dengan URL yang benar |
