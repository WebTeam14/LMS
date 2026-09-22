# UniSphere — RBAC Design & Specification

**Version:** 0.2.0  
**Status:** Implemented in Phase 2

---

## 1. System Core Roles

| Role Code | Name | Scope Level | Description | Bypass Wildcard |
|---|---|---|---|---|
| `SUPER_ADMIN` | Super Administrator | Platform | Global platform administration across all tenants | Yes (`*`) |
| `UNIVERSITY_ADMIN` | University Administrator | University / Tenant | Full operational oversight of tenant, users, courses, and roles | No |
| `FACULTY` | Faculty Member | Course / Section | Teaches courses, manages curriculum, practical labs, and grades | No |
| `STUDENT` | Student | Individual | Attends classes, submits assignments/practicals, views own grades | No |
| `EXAMINATION_OFFICER` | Examination Officer | University / Examination | Exam configuration, hall tickets, proctoring, and grade publishing | No |

---

## 2. Permission Catalog (`resource:action`)

UniSphere utilizes a granular `resource:action` model.

### Identity & Access
- `users:read`, `users:create`, `users:update`, `users:delete`, `users:assign_role`
- `roles:read`, `roles:create`, `roles:update`, `roles:delete`
- `permissions:read`
- `tenants:read`, `tenants:create`, `tenants:update`, `tenants:delete`

### Academic & Courses
- `university:read`, `university:manage`
- `academic:read`, `academic:manage`
- `admissions:read`, `admissions:manage`
- `students:read`, `students:create`, `students:update`, `students:delete`, `students:export`
- `faculty:read`, `faculty:manage`
- `courses:read`, `courses:manage`, `courses:enroll`
- `lms:read`, `lms:manage`

### Practical / Lab Subsystem
- `practicals:read`, `practicals:create`, `practicals:submit`, `practicals:execute`, `practicals:evaluate`

### Assessments & Examinations
- `assessments:read`, `assessments:manage`, `assessments:attempt`, `assessments:grade`
- `attendance:read`, `attendance:record`, `attendance:modify`
- `exams:read`, `exams:create`, `exams:proctor`, `exams:publish`
- `grades:read`, `grades:publish`, `transcripts:generate`

### Operations & Auditing
- `finance:read`, `finance:manage`
- `library:manage`
- `audit:read`
- `settings:manage`

---

## 3. Enforcement Pipeline

```
Incoming HTTP Request
   ↓
[1] authenticate (JWT validation & status verification)
   ↓ Populates req.user & distinct permissions
[2] tenantGuard (Server-side cross-tenant boundary validation)
   ↓ Blocks cross-tenant tampering (403 CROSS_TENANT_ACCESS_DENIED)
[3] requirePermission('resource:action')
   ↓ Checks if req.user.permissions includes permission or '*'
[4] Controller / Domain Service / Repository
   ↓ Executes business logic & records AuditLog
Response
```

---

## 4. Protected System Roles Rule

System roles (`isSystem: true`) are hard-coded baseline definitions and cannot be updated, modified, or deleted by tenant administrators. Any attempt returns `403 SYSTEM_ROLE_PROTECTED`.
