/**
 * Formatting utilities for academic data, roles, and dates
 */

export const formatRoleName = (roleCode = '') => {
  const mapping = {
    SUPER_ADMIN: 'Platform Super Administrator',
    UNIVERSITY_ADMIN: 'University Administrator',
    FACULTY: 'Faculty Member',
    STUDENT: 'Student',
    EXAMINATION_OFFICER: 'Examination Officer',
  };
  return mapping[roleCode.toUpperCase()] || roleCode;
};

export const formatInitials = (firstName = '', lastName = '') => {
  const f = firstName ? firstName[0].toUpperCase() : '';
  const l = lastName ? lastName[0].toUpperCase() : '';
  return `${f}${l}` || 'U';
};

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
};
