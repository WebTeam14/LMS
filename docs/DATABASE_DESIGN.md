# UniSphere — Database Design

**Version:** 0.1.0  
**Database:** MongoDB  
**ODM:** Mongoose  
**Last Updated:** 2026-09-21

---

## 1. Design Principles

- Tenant isolation via `tenantId` (and hierarchical IDs) on nearly every document.
- Soft delete (`isDeleted`, `deletedAt`) where business requires recovery.
- Audit fields: `createdBy`, `updatedBy`, `createdAt`, `updatedAt`.
- Explicit indexes for common query patterns (tenant + status, tenant + role, etc.).
- Avoid unnecessary data duplication; prefer references.
- Support future historical / reporting needs without breaking operational queries.
- Versioning where academic rules or grades can change over time.

---

## 2. Core Hierarchy Collections

### universities
- `_id`, `tenantId` (or self), `name`, `code`, `logo`, `settings`, `status`, audit fields

### campuses
- `universityId`, `name`, `code`, `address`, `status`

### schools (or faculties)
- `universityId`, `campusId`, `name`, `code`

### departments
- `universityId`, `campusId`, `schoolId`, `name`, `code`, `hodId`

### programs
- `universityId`, `departmentId`, `name`, `code`, `degreeType`, `duration`, `creditsRequired`, `status`

### academicYears / terms / semesters
- Configurable academic calendar per university/program

### batches
- `programId`, `academicYearId`, `name`, `startDate`, `endDate`, `status`

### sections
- `batchId`, `name`, `capacity`, `advisorId`

---

## 3. Identity & Access

### users
- `email` (unique per tenant), `passwordHash`, `firstName`, `lastName`, `phone`
- `status` (active, invited, suspended, deleted)
- `lastLoginAt`, `mfaEnabled`, `emailVerified`
- `tenantId`, audit fields

### roles
- `name`, `code`, `description`, `isSystem`, `tenantId` (null for platform roles)

### permissions
- `resource`, `action`, `description` (e.g. `students:create`)

### rolePermissions
- Many-to-many

### userRoles
- `userId`, `roleId`, `scope` (universityId / campusId / departmentId etc.)

### sessions / refreshTokens / loginHistory
- Device tracking, revocation support

---

## 4. Academic Core (high-level)

- `students` (profile + academic status + guardian info)
- `faculty` (profile + designations + workload)
- `courses` + `curriculum` mappings
- `enrollments` (student ↔ course/section)
- `modules` / `chapters` / `lessons` (LMS structure)
- `content` (files, videos metadata)
- `progress` / `bookmarks` / `notes`

---

## 5. Practical & Assessment

- `practicals` → `labs` → `experiments`
- `testCases` (public / hidden)
- `submissions` + `executionJobs` (status, result, logs)
- `assignments`, `quizzes`, `questions`, `attempts`
- `exams`, `examSessions`, `centers`, `invigilators`
- `attendance` records
- `gradebooks`, `results`, `transcripts`, `certificates`

---

## 6. Operational Modules (later phases)

- Finance: fee structures, invoices, payments, scholarships
- Library: catalog, loans, reservations
- Hostel, Transport, Placement, Internship, Research, Support tickets
- Notifications, AuditLogs, Analytics aggregates

---

## 7. Common Patterns

```js
{
  tenantId: ObjectId,
  universityId: ObjectId,   // often present
  campusId: ObjectId,       // when scoped
  createdBy: ObjectId,
  updatedBy: ObjectId,
  createdAt: Date,
  updatedAt: Date,
  isDeleted: Boolean,
  deletedAt: Date,
  version: Number
}
```

Indexes (examples):
- `{ tenantId: 1, email: 1 }` unique
- `{ tenantId: 1, status: 1 }`
- `{ universityId: 1, departmentId: 1 }`
- Compound indexes for list + filter + sort patterns

---

## 8. Data Governance Notes

- Soft delete + retention policies
- Immutable audit events for critical actions
- Backup / restore strategy (to be detailed in DEPLOYMENT.md)
- No direct execution of student code data inside main DB process

Detailed schemas will be added module-by-module during implementation (vertical slice).
