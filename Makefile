.PHONY: build dev prod up down logs clean help

help:
	@echo "Sunloc Server Docker Commands"
	@echo "=============================="
	@echo "make build         - Build the Docker image"
	@echo "make dev           - Run development container with hot reload"
	@echo "make prod          - Run production container"
	@echo "make up            - Start container (default compose)"
	@echo "make down          - Stop and remove container"
	@echo "make logs          - View container logs"
	@echo "make logs-dev      - View dev container logs"
	@echo "make clean         - Remove image and volumes"
	@echo "make shell         - Open shell in running container"
	@echo "make db-backup     - Backup SQLite database"
	@echo "make db-restore    - Restore SQLite database"

build:
	docker build -t sunloc:latest .

dev:
	docker compose -f docker-compose.dev.yml up --watch

prod:
	docker compose -f docker-compose.prod.yml up -d

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f

logs-dev:
	docker compose -f docker-compose.dev.yml logs -f

shell:
	docker exec -it sunloc-server sh

shell-dev:
	docker exec -it sunloc-server-dev sh

db-backup:
	docker run --rm -v sunloc-server_sunloc-db-data:/app/data -v $(PWD):/backup alpine tar czf /backup/sunloc-backup-$$(date +%Y%m%d-%H%M%S).tar.gz -C /app/data .

db-restore:
	@echo "Usage: make db-restore BACKUP_FILE=path/to/backup.tar.gz"
	docker run --rm -v sunloc-server_sunloc-db-data:/app/data -v $(PWD):/backup alpine tar xzf /backup/$(BACKUP_FILE) -C /app/data

clean:
	docker compose down -v
	docker rmi sunloc:latest

status:
	docker compose ps

test-health:
	curl http://localhost:3000/api/health | jq
