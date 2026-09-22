/**
 * UniSphere System Permissions Catalog
 * Format: resource:action
 */

export const PERMISSIONS = {
  // Platform & Multi-tenancy
  TENANTS_READ: 'tenants:read',
  TENANTS_CREATE: 'tenants:create',
  TENANTS_UPDATE: 'tenants:update',
  TENANTS_DELETE: 'tenants:delete',

  // Identity & Access Management
  USERS_READ: 'users:read',
  USERS_CREATE: 'users:create',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
  USERS_ASSIGN_ROLE: 'users:assign_role',

  // Roles & Permissions (RBAC)
  ROLES_READ: 'roles:read',
  ROLES_CREATE: 'roles:create',
  ROLES_UPDATE: 'roles:update',
  ROLES_DELETE: 'roles:delete',
  PERMISSIONS_READ: 'permissions:read',

  // University & Academic Structure
  UNIVERSITY_READ: 'university:read',
  UNIVERSITY_MANAGE: 'university:manage',
  ACADEMIC_READ: 'academic:read',
  ACADEMIC_MANAGE: 'academic:manage',

  // Admissions
  ADMISSIONS_READ: 'admissions:read',
  ADMISSIONS_MANAGE: 'admissions:manage',

  // Students Information System
  STUDENTS_READ: 'students:read',
  STUDENTS_CREATE: 'students:create',
  STUDENTS_UPDATE: 'students:update',
  STUDENTS_DELETE: 'students:delete',
  STUDENTS_EXPORT: 'students:export',

  // Faculty Management
  FACULTY_READ: 'faculty:read',
  FACULTY_MANAGE: 'faculty:manage',

  // Courses & Curriculum
  COURSES_READ: 'courses:read',
  COURSES_MANAGE: 'courses:manage',
  COURSES_ENROLL: 'courses:enroll',

  // Core LMS (Theory)
  LMS_READ: 'lms:read',
  LMS_MANAGE: 'lms:manage',

  // Practical & Lab Subsystem
  PRACTICALS_READ: 'practicals:read',
  PRACTICALS_CREATE: 'practicals:create',
  PRACTICALS_SUBMIT: 'practicals:submit',
  PRACTICALS_EXECUTE: 'practicals:execute',
  PRACTICALS_EVALUATE: 'practicals:evaluate',

  // Assessment & Quizzes
  ASSESSMENTS_READ: 'assessments:read',
  ASSESSMENTS_MANAGE: 'assessments:manage',
  ASSESSMENTS_ATTEMPT: 'assessments:attempt',
  ASSESSMENTS_GRADE: 'assessments:grade',

  // Attendance
  ATTENDANCE_READ: 'attendance:read',
  ATTENDANCE_RECORD: 'attendance:record',
  ATTENDANCE_MODIFY: 'attendance:modify',

  // Examinations & Results
  EXAMS_READ: 'exams:read',
  EXAMS_CREATE: 'exams:create',
  EXAMS_PROCTOR: 'exams:proctor',
  EXAMS_PUBLISH: 'exams:publish',
  GRADES_READ: 'grades:read',
  GRADES_PUBLISH: 'grades:publish',
  TRANSCRIPTS_GENERATE: 'transcripts:generate',

  // Finance & Operations
  FINANCE_READ: 'finance:read',
  FINANCE_MANAGE: 'finance:manage',
  LIBRARY_MANAGE: 'library:manage',

  // Audit & System Telemetry
  AUDIT_READ: 'audit:read',
  SETTINGS_MANAGE: 'settings:manage',
};

export const ALL_PERMISSIONS = Object.values(PERMISSIONS);
