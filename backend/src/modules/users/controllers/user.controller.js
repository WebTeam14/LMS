import * as userService from '../services/user.service.js';
import { successResponse } from '../../../common/utils/response.js';

export const listUsers = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.roles.includes('SUPER_ADMIN');
    const result = await userService.listUsers({
      tenantId: req.tenantId,
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      status: req.query.status,
      isSuperAdmin,
    });
    return successResponse(res, result.users, result.pagination);
  } catch (error) {
    next(error);
  }
};

export const getUser = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.roles.includes('SUPER_ADMIN');
    const user = await userService.getUserById(req.params.id, req.tenantId, isSuperAdmin);
    return successResponse(res, user);
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const user = await userService.createUser({
      ...req.body,
      tenantId: req.tenantId,
      createdBy: req.user.id,
    });
    return successResponse(res, user, null, 201);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.roles.includes('SUPER_ADMIN');
    // Allow updating self or someone with USERS_UPDATE permission
    const isSelf = req.user.id === req.params.id;
    if (!isSelf && !req.user.permissions.includes('users:update') && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have permission to update other user accounts.' },
      });
    }

    const updated = await userService.updateUser(req.params.id, req.body, req.tenantId, isSuperAdmin);
    return successResponse(res, updated);
  } catch (error) {
    next(error);
  }
};

export const assignRole = async (req, res, next) => {
  try {
    const updated = await userService.assignRole({
      userId: req.params.id,
      roleCode: req.body.roleCode,
      scope: req.body.scope,
      tenantId: req.tenantId,
      assignedBy: req.user.id,
    });
    return successResponse(res, updated);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.roles.includes('SUPER_ADMIN');
    const result = await userService.softDeleteUser(req.params.id, req.tenantId, req.user.id, isSuperAdmin);
    return successResponse(res, result);
  } catch (error) {
    next(error);
  }
};
