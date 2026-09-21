# UniSphere — University Digital Campus Platform

Enterprise-grade university platform covering administration, academics, LMS, practical labs, examinations, finance, placements, analytics, AI and more.

**Architecture:** Modular Monolith (MERN) → future Microservices  
**Primary Roadmap:** `University_LMS_Updated_Master_Roadmap.pdf`  
**Development Strategy:** Backend-first + Vertical Slice

---

## Quick Start (after Phase 1)

```bash
# Clone / navigate
cd unisphere

# Start infrastructure
docker compose -f docker/docker-compose.dev.yml up -d

# Backend
cd backend
cp .env.example .env
npm install
npm run dev

# Frontend (new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev
```

---

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Database Design](docs/DATABASE_DESIGN.md)
- [Security](docs/SECURITY.md)
- [RBAC](docs/RBAC.md)
- [API Documentation](docs/API_DOCUMENTATION.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Project Progress](PROJECT_PROGRESS.md)

---

## Development Principles

1. Backend leads every module (vertical slice).
2. Business rules live in the backend.
3. Frontend consumes real APIs.
4. Security, testing, observability are continuous.
5. Clean module boundaries for future microservice extraction.
6. No fake production implementations.
7. JavaScript only (no TypeScript unless later instructed).

---

## Phase Overview

See `PROJECT_PROGRESS.md` for detailed audit reports and live status.

- **Phase 0 (Product & Architecture):** COMPLETE
- **Phase 1 (Foundation & DevOps):** COMPLETE (Audited & Verified)
- **Next Milestone:** **Phase 2 — Authentication, Security & RBAC**
