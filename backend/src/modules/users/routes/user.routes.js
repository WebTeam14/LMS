import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import authenticate from '../../../common/middleware/authenticate.js';
import tenantGuard from '../../../common/middleware/tenantGuard.js';
import validate from '../../../common/middleware/validate.js';
import { requirePermission } from '../../../common/middleware/authorize.js';
import { PERMISSIONS } from '../../../common/constants/permissions.js';
import {
  createUserSchema,
  updateUserSchema,
  assignRoleSchema,
} from '../validators/user.validator.js';

const router = Router();

// All user management routes require valid JWT & tenant context
router.use(authenticate, tenantGuard);

router.get('/', requirePermission(PERMISSIONS.USERS_READ), userController.listUsers);
router.get('/:id', requirePermission(PERMISSIONS.USERS_READ), userController.getUser);
router.post('/', requirePermission(PERMISSIONS.USERS_CREATE), validate(createUserSchema), userController.createUser);
router.patch('/:id', validate(updateUserSchema), userController.updateUser);
router.post('/:id/roles', requirePermission(PERMISSIONS.USERS_ASSIGN_ROLE), validate(assignRoleSchema), userController.assignRole);
router.delete('/:id', requirePermission(PERMISSIONS.USERS_DELETE), userController.deleteUser);

export default router;
