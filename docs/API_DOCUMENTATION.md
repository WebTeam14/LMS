# UniSphere — API Documentation

**Base URL:** `/api/v1`  
**Format:** JSON  
**Versioning:** URL path (`/api/v1`)

---

## 1. Response Envelope

Success:
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

Error:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable message",
    "details": [ ... ]
  }
}
```

## 2. Conventions

- `GET /resources` — list (pagination, filtering, sorting, search)
- `GET /resources/:id` — retrieve
- `POST /resources` — create
- `PATCH /resources/:id` — partial update
- `DELETE /resources/:id` — soft or hard delete (documented per resource)

Query parameters (standard):
- `page`, `limit`
- `sort` (e.g. `-createdAt`)
- `search`
- `filter[...]` or specific query fields
- `fields` (sparse fieldsets — optional)

## 3. Authentication

- Header: `Authorization: Bearer <accessToken>`
- Public endpoints (login, register, password reset) documented explicitly
- Refresh token endpoint for session renewal

## 4. Error Codes (examples)

- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `VALIDATION_ERROR`
- `CONFLICT`
- `RATE_LIMITED`
- `INTERNAL_ERROR`

## 5. Documentation Tooling

- OpenAPI / Swagger will be maintained and served at `/api/docs` in development.
- Each module will document its endpoints as they are implemented.

Detailed endpoint specifications will be added module-by-module during vertical-slice development.
