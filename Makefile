.PHONY: up down build logs ps clean restart shell-auth shell-item shell-db shell-frontend lint test pr-check dev

# ---------------------------------------------------------
# VARIABEL: Kunci utama agar Docker membaca semua file
# ---------------------------------------------------------
COMPOSE_CMD=docker compose -f docker-compose.microservices.yml

help:
	@echo "SafeSpace Microservices Commands:"
	@echo "  up           : Jalankan semua service (detached)"
	@echo "  build        : Build ulang dan jalankan"
	@echo "  down         : Stop semua container"
	@echo "  ps           : Cek status container"
	@echo "  logs         : Lihat logs semua service"
	@echo "  shell-auth   : Masuk terminal Auth Service"
	@echo "  shell-item   : Masuk terminal Item Service"

# Start semua services di background
up:
	$(COMPOSE_CMD) up -d

# Start dengan rebuild (Gunakan ini kalau ada kodingan baru)
build:
	$(COMPOSE_CMD) up --build -d

# Shortcut untuk development (Hot-Reload)
dev:
	$(COMPOSE_CMD) up --build

# Menjalankan versi production (Tanpa hot-reload, port tertutup dan lebih stabil)
prod:
	docker compose -f docker-compose.prod.yml up -d --build

# Stop & remove containers (Data aman)
down:
	$(COMPOSE_CMD) down

# Stop, remove, DAN hapus volumes (⚠️ AWAS: Seluruh data database hilang!)
clean:
	$(COMPOSE_CMD) down -v
	docker system prune -f

# Restart semua services (Gunakan ini kalau ada perubahan konfigurasi atau ingin refresh cepat)
restart:
	$(COMPOSE_CMD) restart

# Lihat logs menggunakan Helper Script untuk format yang lebih baik (Semua services, dengan filter warna-warni)
logs:
	bash ./scripts/logs.sh all

# Lihat logs bawaan secara real-time (semua services, tanpa filter)
logs-raw:
	$(COMPOSE_CMD) logs -f

# Lihat logs khusus backend saja (Auth & Item)
logs-backend:
	$(COMPOSE_CMD) logs -f auth-service item-service

# Lihat status container yang sedang berjalan
ps:
	$(COMPOSE_CMD) ps

# Masuk ke terminal Auth Service
shell-auth:
	$(COMPOSE_CMD) exec auth-service bash

# Masuk ke terminal Item Service
shell-item:
	$(COMPOSE_CMD) exec item-service bash

# Masuk ke dalam PostgreSQL database (Auth DB)
shell-db:
	$(COMPOSE_CMD) exec auth-db psql -U postgres -d safespace

# Masuk ke terminal frontend
shell-frontend:
	$(COMPOSE_CMD) exec frontend sh

# Jalankan linter untuk mengecek kerapian kode
lint:
	@echo "Menjalankan linter..."
	cd frontend && npm run lint

# Jalankan unit test
test:
	@echo "Menjalankan unit tests Backend (Pytest)..."
	cd services/auth-service && pytest
	cd services/item-service && pytest
	@echo "Menjalankan unit tests Frontend (Vitest)..."
	cd frontend && npm test

# Cek kesiapan kodingan sebelum di-merge (PR Check)
pr-check:
	@echo "Menjalankan PR checks lokal (Lint, Build & Test)..."
	make lint
	make test
	make build
	@echo "✅ Semua check lokal berhasil! Kodingan aman untuk di-push dan di-PR."