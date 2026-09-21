# UniSphere — RBAC Design

**Version:** 0.1.0

---

## 1. Core Roles (Minimum Set)

| Role                  | Scope Level              | Typical Responsibilities                     |
|-----------------------|--------------------------|----------------------------------------------|
| Super Admin           | Platform                 | All tenants, system configuration            |
| University Admin      | University               | Full university management                   |
| Campus Admin          | Campus                   | Campus-level operations                      |
| Registrar             | University / Campus      | Academic records, enrollment                 |
| Dean                  | School / Faculty         | Oversight of departments                     |
| HOD                   | Department               | Department management, faculty assignment    |
| Program Coordinator   | Program                  | Curriculum, batch oversight                  |
| Faculty               | Course / Section         | Teaching, grading, practicals                |
| Teaching Assistant    | Course / Section         | Limited grading / support                    |
| Student               | Own records              | Learning, submissions, results               |
| Parent                | Linked student(s)        | View progress, fees, attendance              |
| Accountant            | Finance                  | Fees, payments, reconciliation               |
| Librarian             | Library                  | Catalog, circulation                         |
| Examination Officer   | Examination              | Exam setup, invigilation, results            |
| Admission Officer     | Admissions               | Application processing                       |
| Placement Officer     | Placement                | Drives, eligibility, offers                  |
| Support Officer       | Support                  | Tickets, grievances                          |

## 2. Permission Model

Permissions are expressed as `resource:action`.

Examples:
- `users:read`, `users:create`, `users:update`, `users:delete`
- `students:read`, `students:create`, `students:export`
- `courses:enroll`, `courses:manage`
- `practicals:execute`, `practicals:evaluate`
- `exams:create`, `exams:proctor`, `exams:publish`
- `grades:publish`, `grades:correct`
- `fees:reconcile`
- `audit:read`

Roles are assigned sets of permissions.  
Users receive roles with optional scope (universityId, campusId, departmentId, etc.).

## 3. Enforcement Flow

```
Request
  → authenticate (JWT)
  → extract user + roles + permissions + scope
  → authorize(requiredPermission)
  → resource ownership / tenant check
  → controller → service → repository
```

## 4. Frontend Awareness

- After login the frontend receives the effective permission list.
- UI elements (buttons, menus, routes) are shown/hidden accordingly.
- Backend remains the final authority.

## 5. Future Extensions

- Attribute-based rules (e.g. “faculty can grade only own courses”)
- Temporary elevated permissions
- Delegation
