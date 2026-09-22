import RoleModel from '../../auth/models/Role.js';
import AppError from '../../../common/errors/AppError.js';
import { SYSTEM_ROLES } from '../../../common/constants/roles.js';
import { ALL_PERMISSIONS } from '../../../common/constants/permissions.js';

/**
 * Ensures system baseline roles exist in database
 */
export const seedSystemRoles = async () => {
  const seeded = [];
  for (const roleDef of Object.values(SYSTEM_ROLES)) {
    const existing = await RoleModel.findOne({ code: roleDef.code, tenantId: null });
    if (!existing) {
      const created = await RoleModel.create({
        name: roleDef.name,
        code: roleDef.code,
        description: roleDef.description,
        isSystem: true,
        tenantId: null,
        permissions: roleDef.permissions,
      });
      seeded.push(created.code);
    }
  }
  return seeded;
};

/**
 * List roles applicable to a tenant (including global system roles)
 */
export const listRoles = async (tenantId) => {
  const query = {
    $or: [{ tenantId: null }, { tenantId }],
  };
  return RoleModel.find(query).sort({ isSystem: -1, name: 1 });
};

export const getRoleById = async (roleId) => {
  const role = await RoleModel.findById(roleId);
  if (!role) {
    throw new AppError('Role not found', 404, 'ROLE_NOT_FOUND');
  }
  return role;
};

export const createRole = async ({ name, code, description, permissions = [], tenantId }) => {
  const normalizedCode = code.toUpperCase().trim();

  // Validate that permission strings are valid system permissions
  const invalidPerms = permissions.filter((p) => p !== '*' && !ALL_PERMISSIONS.includes(p));
  if (invalidPerms.length > 0) {
    throw new AppError(
      `Invalid permissions provided: ${invalidPerms.join(', ')}`,
      400,
      'INVALID_PERMISSIONS'
    );
  }

  // Check unique role within tenant
  const existing = await RoleModel.findOne({ code: normalizedCode, tenantId });
  if (existing) {
    throw new AppError(`A role with code [${normalizedCode}] already exists in this tenant.`, 409, 'ROLE_EXISTS');
  }

  return RoleModel.create({
    name,
    code: normalizedCode,
    description,
    permissions,
    isSystem: false,
    tenantId,
  });
};

export const updateRole = async (roleId, { name, description, permissions, tenantId }) => {
  const role = await RoleModel.findById(roleId);
  if (!role) {
    throw new AppError('Role not found', 404, 'ROLE_NOT_FOUND');
  }

  if (role.isSystem) {
    throw new AppError('System roles cannot be modified or overridden.', 403, 'SYSTEM_ROLE_PROTECTED');
  }

  if (tenantId && role.tenantId?.toString() !== tenantId.toString()) {
    throw new AppError('Unauthorized modification of role in another tenant.', 403, 'CROSS_TENANT_ACCESS_DENIED');
  }

  if (permissions) {
    const invalidPerms = permissions.filter((p) => p !== '*' && !ALL_PERMISSIONS.includes(p));
    if (invalidPerms.length > 0) {
      throw new AppError(
        `Invalid permissions provided: ${invalidPerms.join(', ')}`,
        400,
        'INVALID_PERMISSIONS'
      );
    }
    role.permissions = permissions;
  }

  if (name) role.name = name;
  if (description !== undefined) role.description = description;

  await role.save();
  return role;
};

export const deleteRole = async (roleId, tenantId) => {
  const role = await RoleModel.findById(roleId);
  if (!role) {
    throw new AppError('Role not found', 404, 'ROLE_NOT_FOUND');
  }

  if (role.isSystem) {
    throw new AppError('System roles cannot be deleted.', 403, 'SYSTEM_ROLE_PROTECTED');
  }

  if (tenantId && role.tenantId?.toString() !== tenantId.toString()) {
    throw new AppError('Unauthorized deletion of role in another tenant.', 403, 'CROSS_TENANT_ACCESS_DENIED');
  }

  await role.deleteOne();
  return { success: true, message: `Role [${role.code}] deleted successfully.` };
};

export const listAllPermissions = () => {
  return ALL_PERMISSIONS;
};
