import { Router } from 'express';
import * as roleController from '../controllers/role.controller.js';
import authenticate from '../../../common/middleware/authenticate.js';
import tenantGuard from '../../../common/middleware/tenantGuard.js';
import { requirePermission, requireRole } from '../../../common/middleware/authorize.js';
import { PERMISSIONS } from '../../../common/constants/permissions.js';

const router = Router();

// All role routes require authentication & tenant context
router.use(authenticate, tenantGuard);

// Permissions catalog
router.get('/permissions', requirePermission(PERMISSIONS.PERMISSIONS_READ), roleController.listPermissions);

// Seed system roles (Super Admin only)
router.post('/seed', requireRole('SUPER_ADMIN'), roleController.seedRoles);

// CRUD
router.get('/', requirePermission(PERMISSIONS.ROLES_READ), roleController.listRoles);
router.get('/:id', requirePermission(PERMISSIONS.ROLES_READ), roleController.getRole);
router.post('/', requirePermission(PERMISSIONS.ROLES_CREATE), roleController.createRole);
router.put('/:id', requirePermission(PERMISSIONS.ROLES_UPDATE), roleController.updateRole);
router.delete('/:id', requirePermission(PERMISSIONS.ROLES_DELETE), roleController.deleteRole);

export default router;
