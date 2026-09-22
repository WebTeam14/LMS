import bcrypt from 'bcryptjs';
import User from '../../auth/models/User.js';
import Role from '../../auth/models/Role.js';
import UserRole from '../../auth/models/UserRole.js';
import RefreshToken from '../../auth/models/RefreshToken.js';
import AuditLog from '../../auth/models/AuditLog.js';
import AppError from '../../../common/errors/AppError.js';

export const listUsers = async ({
  tenantId,
  page = 1,
  limit = 20,
  search,
  status,
  isSuperAdmin = false,
}) => {
  const query = { isDeleted: false };
  if (!isSuperAdmin || tenantId) {
    query.tenantId = tenantId;
  }

  if (status) {
    query.status = status;
  }

  if (search) {
    const searchRegex = new RegExp(search.trim(), 'i');
    query.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [users, total] = await Promise.all([
    User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    User.countDocuments(query),
  ]);

  // Populate roles for each user
  const userIds = users.map((u) => u._id);
  const userRoles = await UserRole.find({ userId: { $in: userIds } }).populate('roleId');

  const roleMap = {};
  for (const ur of userRoles) {
    const uid = ur.userId.toString();
    if (!roleMap[uid]) roleMap[uid] = [];
    if (ur.roleId) {
      roleMap[uid].push({
        code: ur.roleId.code,
        name: ur.roleId.name,
        scope: ur.scope,
      });
    }
  }

  const enrichedUsers = users.map((u) => ({
    ...u,
    id: u._id.toString(),
    roles: (roleMap[u._id.toString()] || []).map((r) => r.code),
    rolesDetail: roleMap[u._id.toString()] || [],
  }));

  return {
    users: enrichedUsers,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

export const getUserById = async (userId, tenantId, isSuperAdmin = false) => {
  const query = { _id: userId, isDeleted: false };
  if (!isSuperAdmin) {
    query.tenantId = tenantId;
  }

  const user = await User.findOne(query);
  if (!user) {
    throw new AppError('User not found or access denied.', 404, 'USER_NOT_FOUND');
  }

  const userRoles = await UserRole.find({ userId: user._id }).populate('roleId');
  const roles = userRoles
    .filter((ur) => ur.roleId)
    .map((ur) => ({
      code: ur.roleId.code,
      name: ur.roleId.name,
      scope: ur.scope,
    }));

  return {
    ...user.toJSON(),
    roles: roles.map((r) => r.code),
    rolesDetail: roles,
  };
};

export const createUser = async ({
  tenantId,
  firstName,
  lastName,
  email,
  password,
  roleCode = 'STUDENT',
  phone,
  createdBy,
}) => {
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await User.findOne({ tenantId, email: normalizedEmail, isDeleted: false });
  if (existing) {
    throw new AppError('An account with this email already exists in this institution.', 409, 'USER_ALREADY_EXISTS');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    tenantId,
    firstName,
    lastName,
    email: normalizedEmail,
    passwordHash,
    phone,
    createdBy,
    status: 'active',
  });

  const role = await Role.findOne({
    code: roleCode.toUpperCase().trim(),
    $or: [{ tenantId }, { tenantId: null }],
  });

  if (role) {
    await UserRole.create({
      userId: user._id,
      roleId: role._id,
      tenantId,
      assignedBy: createdBy,
    });
  }

  await AuditLog.create({
    tenantId,
    userId: createdBy,
    action: 'USER_CREATED',
    resource: 'User',
    resourceId: user._id.toString(),
  });

  return getUserById(user._id, tenantId, false);
};

export const updateUser = async (userId, data, tenantId, isSuperAdmin = false) => {
  const query = { _id: userId, isDeleted: false };
  if (!isSuperAdmin) {
    query.tenantId = tenantId;
  }

  const user = await User.findOne(query);
  if (!user) {
    throw new AppError('User not found or access denied.', 404, 'USER_NOT_FOUND');
  }

  const allowedUpdates = ['firstName', 'lastName', 'phone', 'avatarUrl', 'status'];
  for (const field of allowedUpdates) {
    if (data[field] !== undefined) {
      user[field] = data[field];
    }
  }

  await user.save();
  return getUserById(user._id, tenantId, isSuperAdmin);
};

export const assignRole = async ({ userId, roleCode, tenantId, scope = {}, assignedBy }) => {
  const user = await User.findOne({ _id: userId, tenantId, isDeleted: false });
  if (!user) {
    throw new AppError('Target user not found.', 404, 'USER_NOT_FOUND');
  }

  const role = await Role.findOne({
    code: roleCode.toUpperCase().trim(),
    $or: [{ tenantId }, { tenantId: null }],
  });

  if (!role) {
    throw new AppError(`Role [${roleCode}] not found.`, 404, 'ROLE_NOT_FOUND');
  }

  // Update or insert role assignment
  await UserRole.findOneAndUpdate(
    { userId: user._id, roleId: role._id, tenantId },
    { $set: { scope, assignedBy } },
    { upsert: true, new: true }
  );

  await AuditLog.create({
    tenantId,
    userId: assignedBy,
    action: 'ROLE_ASSIGNED',
    resource: 'User',
    resourceId: user._id.toString(),
    metadata: { roleCode: role.code, scope },
  });

  return getUserById(user._id, tenantId, false);
};

export const softDeleteUser = async (userId, tenantId, deletedBy, isSuperAdmin = false) => {
  const query = { _id: userId, isDeleted: false };
  if (!isSuperAdmin) {
    query.tenantId = tenantId;
  }

  const user = await User.findOne(query);
  if (!user) {
    throw new AppError('User not found or access denied.', 404, 'USER_NOT_FOUND');
  }

  user.isDeleted = true;
  user.deletedAt = new Date();
  user.updatedBy = deletedBy;
  await user.save();

  // Revoke all tokens immediately
  await RefreshToken.updateMany(
    { userId: user._id },
    { $set: { isRevoked: true, revokedAt: new Date() } }
  );

  await AuditLog.create({
    tenantId: user.tenantId,
    userId: deletedBy,
    action: 'USER_DELETED',
    resource: 'User',
    resourceId: user._id.toString(),
  });

  return { success: true, message: `User [${user.email}] soft deleted and sessions invalidated.` };
};
