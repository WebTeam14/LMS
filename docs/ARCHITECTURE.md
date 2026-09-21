# UniSphere — Architecture

**Version:** 0.1.0  
**Last Updated:** 2026-09-21  
**Status:** Phase 0 — Foundation

---

## 1. Product Vision

UniSphere is an enterprise-grade University Digital Campus Platform covering the full university lifecycle:

- Administration & multi-tenancy
- Admissions & Student Information System
- Faculty & Curriculum management
- Theory LMS + Practical/Lab execution platform
- Assessment, Examination, Gradebook, Transcripts
- Operations (Library, Finance, Hostel, Transport, Placement, etc.)
- Analytics, AI Learning, Notifications, Audit & Compliance

It is designed as a **Modular Monolith** that can evolve into microservices without a rewrite.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                  │
│  Role-based dashboards • Permission-aware UI • Real-time    │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTPS / WebSocket
┌────────────────────────────▼────────────────────────────────┐
│                     API Layer (Express)                      │
│  /api/v1/*  • Auth middleware • RBAC • Validation • Rate limit│
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│              Modular Monolith (Domain Modules)               │
│  auth • users • university • academic • admissions •         │
│  students • faculty • courses • lms • practical • ...        │
└──────┬──────────────────────┬───────────────────────┬───────┘
       │                      │                       │
┌──────▼──────┐      ┌────────▼────────┐     ┌────────▼────────┐
│  MongoDB    │      │     Redis       │     │ Object Storage  │
│  (primary)  │      │ (cache/queues)  │     │ (S3/MinIO)      │
└─────────────┘      └────────┬────────┘     └─────────────────┘
                              │
                     ┌────────▼────────┐
                     │  BullMQ Workers │
                     │ (jobs, practical│
                     │  execution)     │
                     └─────────────────┘
```

---

## 3. Backend Module Structure

Every business domain lives in its own module under `backend/src/modules/<domain>/`:

```
<domain>/
├── controllers/     # HTTP request/response handling
├── services/        # Business logic (source of truth)
├── repositories/    # Data access (MongoDB)
├── models/          # Mongoose schemas
├── routes/          # Express routers
├── validators/      # Zod/Joi schemas
├── middleware/      # Module-specific middleware
├── events/          # Domain events (for future async)
├── utils/           # Module helpers
└── tests/           # Unit + integration tests for the module
```

**Rules:**
- No uncontrolled cross-module imports.
- Prefer service interfaces or domain events for cross-module needs.
- Each module owns its data models and indexes.
- Tenant isolation is enforced inside repositories/services.

---

## 4. Frontend Structure

```
frontend/src/
├── app/                 # App bootstrap, providers
├── components/          # Shared UI + design system
├── features/            # Feature modules (mirrors backend domains)
├── layouts/             # Role-based layouts
├── routes/              # Route definitions + guards
├── stores/              # Zustand stores
├── services/            # Axios API clients
├── hooks/               # Shared hooks
├── utils/
└── styles/
```

Frontend consumes real backend APIs only. No production mock data.

---

## 5. Multi-Tenancy Model

```
Platform (Super Admin)
  └── University (tenant)
        └── Campus
              └── School / Faculty
                    └── Department
                          └── Program
                                └── Batch
                                      └── Semester / Term
                                            └── Section
                                                  └── Course
```

- Almost every document carries `tenantId` (and often `universityId`, `campusId`).
- Access control checks both role/permission **and** hierarchical scope.
- Isolation is enforced server-side in every query.

---

## 6. Security Architecture (from Day 1)

- Password hashing (bcrypt/argon2)
- JWT access tokens + refresh strategy
- RBAC with resource + action permissions
- Resource-level ownership checks
- Tenant isolation on every data access
- Rate limiting, Helmet, CORS, input validation
- Secure file upload handling
- Audit logging of critical actions
- Login/device history
- Protection against privilege escalation, IDOR, injection

---

## 7. Practical / Lab Execution (Critical Isolation)

```
Student Code
    ↓
Practical API (authenticated + authorized)
    ↓
Job Queue (BullMQ)
    ↓
Isolated Worker / Container
    ↓
Sandbox (CPU / Memory / Time / Network / FS limits)
    ↓
Test Cases → Evaluation → Score → Gradebook
```

**Rule:** Never execute untrusted student code inside the main Express process.

---

## 8. Future Microservices Path

Modules are designed so they can be extracted behind an API Gateway:

Priority extraction order (roadmap):
1. Notification
2. File / Media
3. Practical Execution
4. Analytics
5. Authentication
6. Communication

Domain events will be introduced in-process first, then moved to Kafka/RabbitMQ when needed.

---

## 9. Technology Decisions

| Layer          | Choice                                      |
|----------------|---------------------------------------------|
| Frontend       | React + Vite + JavaScript + Tailwind + Ant Design / shadcn/ui |
| State          | Zustand + TanStack Query                    |
| Backend        | Node.js LTS + Express (modular monolith)    |
| Database       | MongoDB + Mongoose                          |
| Cache / Queue  | Redis + BullMQ                              |
| Auth           | JWT + RBAC                                  |
| Validation     | Zod                                         |
| File Storage   | S3-compatible (MinIO in dev)                |
| Real-time      | Socket.io                                   |
| Testing        | Jest / Vitest + Supertest + Playwright (later) |
| Containers     | Docker + Docker Compose                     |

**Language rule:** JavaScript only. No TypeScript unless explicitly changed later.

---

## 10. Development Principles

1. Backend-first vertical slices.
2. Business rules live in backend services.
3. Frontend is a consumer, not the source of truth.
4. Security, testing, observability continuous.
5. Clean module boundaries for future extraction.
6. No fake production implementations.
7. Definition of Done is strict (see PROJECT_PROGRESS.md).

---

## 11. Next Steps (Phase 0 → Phase 1)

- Complete remaining Phase 0 documentation.
- Scaffold backend Express foundation + MongoDB + Redis connection.
- Scaffold frontend Vite + design system.
- Docker development environment.
- CI foundation.
- Then begin Phase 2 (Auth + Security + RBAC) as the first real vertical slice.
