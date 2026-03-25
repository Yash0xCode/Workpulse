import { Router } from 'express'
import { PERMISSIONS } from '../config/rbac.js'
import {
	checkIn,
	checkOut,
	getAttendanceByUser,
	getAttendanceStatusSummary,
} from '../controllers/attendanceController.js'
import { requirePermission } from '../middleware/permissionMiddleware.js'

const router = Router()

router.post('/checkin', checkIn)
router.post('/checkout', checkOut)
router.get('/user/:id', getAttendanceByUser)
router.get('/team', requirePermission(PERMISSIONS.VIEW_TEAM_ATTENDANCE), getAttendanceByUser)
router.get('/summary', requirePermission(PERMISSIONS.VIEW_TEAM_ATTENDANCE), getAttendanceStatusSummary)

export default router
