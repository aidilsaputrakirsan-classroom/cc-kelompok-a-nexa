# ============================================================
# Makefile — DevOps Automation Tool (Microservices)
# ============================================================

.PHONY: up down build logs restart ps clean shell-auth shell-item db-auth db-item

# ==================== TUGAS WAJIB MODUL 12 ====================

# Start semua services
up:
	docker compose up -d

# Stop & remove containers
down:
	docker compose down

# Lihat logs (semua services)
logs:
	docker compose logs -f

# Restart semua
restart:
	docker compose restart

# ==================== PERINTAH TAMBAHAN ====================

# Start dengan rebuild
build:
	docker compose up --build -d

# Lihat status services
ps:
	docker compose ps

# Stop, remove, DAN hapus volumes (⚠️ data hilang!)
clean:
	docker compose down -v
	docker system prune -f

# --- LOGS SPESIFIK ---
logs-auth:
	docker compose logs -f auth-service

logs-item:
	docker compose logs -f item-service

logs-gateway:
	docker compose logs -f gateway

# --- SHELL ACCESS (Masuk ke dalam container) ---
shell-auth:
	docker compose exec auth-service bash

shell-item:
	docker compose exec item-service bash

# --- DATABASE ACCESS ---
db-auth:
	docker compose exec auth-db psql -U postgres -d auth_db

db-item:
	docker compose exec item-db psql -U postgres -d item_db

# --- CI/CD & TESTING ---
pr-check:
	@echo "Menjalankan PR checks (Build)..."
	make build