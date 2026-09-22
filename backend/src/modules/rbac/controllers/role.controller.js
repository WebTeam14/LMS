import * as roleService from '../services/role.service.js';
import { successResponse } from '../../../common/utils/response.js';

export const listRoles = async (req, res, next) => {
  try {
    const roles = await roleService.listRoles(req.tenantId);
    return successResponse(res, roles);
  } catch (error) {
    next(error);
  }
};

export const getRole = async (req, res, next) => {
  try {
    const role = await roleService.getRoleById(req.params.id);
    return successResponse(res, role);
  } catch (error) {
    next(error);
  }
};

export const createRole = async (req, res, next) => {
  try {
    const role = await roleService.createRole({
      ...req.body,
      tenantId: req.tenantId,
    });
    return successResponse(res, role, null, 201);
  } catch (error) {
    next(error);
  }
};

export const updateRole = async (req, res, next) => {
  try {
    const role = await roleService.updateRole(req.params.id, {
      ...req.body,
      tenantId: req.tenantId,
    });
    return successResponse(res, role);
  } catch (error) {
    next(error);
  }
};

export const deleteRole = async (req, res, next) => {
  try {
    const result = await roleService.deleteRole(req.params.id, req.tenantId);
    return successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export const listPermissions = (_req, res) => {
  const permissions = roleService.listAllPermissions();
  return successResponse(res, { permissions, total: permissions.length });
};

export const seedRoles = async (_req, res, next) => {
  try {
    const seeded = await roleService.seedSystemRoles();
    return successResponse(res, { seeded, message: 'System baseline roles verified/seeded.' });
  } catch (error) {
    next(error);
  }
};
