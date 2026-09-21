# UniSphere — Deployment & DevOps

**Version:** 0.1.0  
**Principle:** DevOps from the beginning

---

## 1. Environments

- **development** — local Docker Compose (MongoDB, Redis, MinIO, app)
- **staging** — production-like for integration & UAT
- **production** — hardened, monitored, backed up

## 2. Local Development (Phase 1 target)

```bash
docker compose -f docker/docker-compose.dev.yml up
```

Services:
- backend (Node)
- frontend (Vite)
- mongodb
- redis
- minio (S3-compatible)
- (later) worker processes for BullMQ / practical execution

## 3. Configuration

- `.env` files (never committed)
- `.env.example` for documentation
- Secrets managed outside source control

## 4. CI Foundation (Phase 1)

- Lint
- Unit / integration tests
- Build
- (later) security scans, image builds

## 5. Future Production Path

- Docker images
- Kubernetes (when microservices extraction begins)
- API Gateway
- Observability: structured logs, metrics, traces (OpenTelemetry)
- Prometheus + Grafana
- Backup & restore drills
- Rolling updates & disaster recovery plan

## 6. Health & Observability

- `/health` and `/ready` endpoints
- Structured logging
- Job monitoring for BullMQ
- Alerting on critical failures
