# Changelog

All notable changes to UniSphere will be documented in this file.

## [Unreleased]

### Completed — Foundation Audit & Phase 1 Hardening (2026-09-21)
- **Backend Security & Quality:**
  - Added Zod validation error parsing, CastError handling, and JSON syntax error catches in global error handler.
  - Implemented generic `validate(schemas)` middleware for route-level schema validation.
  - Reordered middleware to exempt `/health` and `/ready` probes from API rate limits.
  - Added production guard against placeholder JWT secrets in configuration.
  - Added centralized structured logger (`src/common/utils/logger.js`).
  - Implemented automated tests for validation and health checks (6 passing tests).
  - Created explicit `jest.config.js` for ES Modules testing.
  - Scaffolded `backend/src/modules/` directory anchor with modular monolith guidelines.
- **Frontend Quality & Architecture:**
  - Scaffolded standard feature directories (`components/`, `features/`, `layouts/`, `routes/`, `hooks/`, `utils/`).
  - Added safe `localStorage` exception handling and RBAC state (`roles`, `permissions`, `hasPermission`) in `useAuthStore.js`.
  - Verified ESLint 9 configuration with zero errors or warnings.
  - Verified clean production Vite bundling (`dist/`).
- **DevOps & CI/CD:**
  - Updated Docker Compose configurations removing deprecated `version` attributes.
  - Upgraded GitHub Actions CI workflow to use deterministic `npm ci` with lockfile caching.

### Added
- Phase 0: Project scaffolding, folder architecture, core documentation (ARCHITECTURE, DATABASE_DESIGN, SECURITY, RBAC, API_DOCUMENTATION, DEPLOYMENT, PROJECT_PROGRESS, README)
