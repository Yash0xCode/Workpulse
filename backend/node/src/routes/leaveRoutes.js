import { Router } from 'express'
import { PERMISSIONS } from '../config/rbac.js'
import {
	createLeave,
	getLeaveBalances,
	getLeaves,
	getPendingLeaveApprovals,
	updateLeave,
	updateLeaveBalances,
} from '../controllers/leaveController.js'
import { requirePermission } from '../middleware/permissionMiddleware.js'

const router = Router()

router.post('/', requirePermission(PERMISSIONS.APPLY_LEAVE), createLeave)
router.get('/', requirePermission(PERMISSIONS.VIEW_LEAVES), getLeaves)
router.get('/balances', requirePermission(PERMISSIONS.VIEW_LEAVES), getLeaveBalances)
router.put('/balances', requirePermission(PERMISSIONS.APPROVE_LEAVE), updateLeaveBalances)
router.get('/pending-approvals', requirePermission(PERMISSIONS.APPROVE_LEAVE), getPendingLeaveApprovals)
router.put('/:id', requirePermission(PERMISSIONS.APPLY_LEAVE), updateLeave)
router.put('/:id/approve', requirePermission(PERMISSIONS.APPROVE_LEAVE), updateLeave)

export default router
