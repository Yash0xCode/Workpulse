import { Router } from 'express'
import { PERMISSIONS } from '../config/rbac.js'
import {
	createLeave,
	getLeaveBalances,
	getLeavePolicies,
	getLeaves,
	getLeaveWorkflowDetails,
	getPendingLeaveApprovals,
	initializeYearLeaveBalances,
	updateLeave,
	updateLeaveBalances,
	upsertLeavePolicies,
} from '../controllers/leaveController.js'
import { requirePermission } from '../middleware/permissionMiddleware.js'

const router = Router()

router.post('/', requirePermission(PERMISSIONS.APPLY_LEAVE), createLeave)
router.get('/', requirePermission(PERMISSIONS.VIEW_LEAVES), getLeaves)
router.get('/policies', requirePermission(PERMISSIONS.VIEW_LEAVES), getLeavePolicies)
router.put('/policies', requirePermission(PERMISSIONS.APPROVE_LEAVE), upsertLeavePolicies)
router.get('/balances', requirePermission(PERMISSIONS.VIEW_LEAVES), getLeaveBalances)
router.put('/balances', requirePermission(PERMISSIONS.APPROVE_LEAVE), updateLeaveBalances)
router.post('/balances/initialize-year', requirePermission(PERMISSIONS.APPROVE_LEAVE), initializeYearLeaveBalances)
router.get('/pending-approvals', requirePermission(PERMISSIONS.APPROVE_LEAVE), getPendingLeaveApprovals)
router.get('/:id/workflow', requirePermission(PERMISSIONS.VIEW_LEAVES), getLeaveWorkflowDetails)
router.put('/:id', requirePermission(PERMISSIONS.APPLY_LEAVE), updateLeave)
router.put('/:id/approve', requirePermission(PERMISSIONS.APPROVE_LEAVE), updateLeave)

export default router
