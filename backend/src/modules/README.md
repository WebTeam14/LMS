# Backend Domain Modules

This directory contains domain feature modules for UniSphere's Modular Monolith architecture.

## Standard Module Structure

Each domain module in `src/modules/<domain>/` must adhere to strict boundary conventions:

```
<domain>/
├── controllers/     # HTTP request handling and response delegation
├── services/        # Core business rules (single source of truth)
├── repositories/    # Direct database queries and persistence (Mongoose)
├── models/          # Mongoose schema definitions and indexes
├── routes/          # Express route definitions
├── validators/      # Zod validation schemas
├── middleware/      # Domain-specific access or processing middleware
├── events/          # Domain events for async event-driven decoupling
├── utils/           # Helper functions local to the domain
└── tests/           # Unit and integration tests for this domain
```

## Modular Monolith Rules

1. **No direct database cross-access**: Modules must access other domains via exported service methods or domain events, never by directly mutating foreign Mongoose models.
2. **Tenant Isolation**: Every database query must incorporate the tenant/institution context.
3. **Extraction Readiness**: Modules must remain self-contained so they can later be extracted into independent microservices behind an API gateway without rewriting business logic.
