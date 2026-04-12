## 🏗️ Arsitektur Multi-Container (Docker Compose)

Berikut adalah topologi jaringan dan konfigurasi *container* yang diorkestrasi menggunakan Docker Compose:

```mermaid
graph TD
    User((🌐 Client / Browser))

    subgraph "🐳 Docker Host"
        
        subgraph "🌉 Custom Bridge Network: cloudnet"
            direction TB
            
            FE["🎨 Frontend (React + Nginx)<br/>Ports: 3000:80<br/>Env: VITE_API_URL"]
            BE["⚙️ Backend (FastAPI)<br/>Ports: 8000:8000<br/>Env: DATABASE_URL, SECRET_KEY, CORS"]
            DB[("🗄️ Database (PostgreSQL)<br/>Ports: 5433:5432<br/>Env: POSTGRES_USER, POSTGRES_DB, etc.")]
            
            FE -- "REST API Request" --> BE
            BE -- "SQLAlchemy ORM" --> DB
        end

        Volume[/"💾 Named Volume: pgdata"/]
        DB -.-|"Mounts to /var/lib/postgresql/data"| Volume

    end

    User -- "Akses Web UI (localhost:3000)" --> FE
    User -- "Akses API/Swagger (localhost:8000)" --> BE