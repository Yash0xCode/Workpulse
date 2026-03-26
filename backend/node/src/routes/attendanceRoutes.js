import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { PERMISSIONS } from '../config/rbac.js'
import {
	checkIn,
	checkOut,
	getAttendanceByUser,
	getAttendanceStatusList,
	getAttendanceStatusSummary,
	registerFaceForAttendance,
} from '../controllers/attendanceController.js'
import { requirePermission } from '../middleware/permissionMiddleware.js'

const router = Router()

// Rate limiter for face registration (ML-backed, compute-intensive)
const faceRegisterLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TOO_MANY_REQUESTS', message: 'Too many requests, please try again later.' },
})

router.post('/checkin', checkIn)
router.post('/checkout', checkOut)
router.post('/face-register', faceRegisterLimiter, registerFaceForAttendance)
router.get('/user/:id', getAttendanceByUser)
router.get('/team', requirePermission(PERMISSIONS.VIEW_TEAM_ATTENDANCE), getAttendanceByUser)
router.get('/summary', requirePermission(PERMISSIONS.VIEW_TEAM_ATTENDANCE), getAttendanceStatusSummary)
router.get('/status', requirePermission(PERMISSIONS.VIEW_TEAM_ATTENDANCE), getAttendanceStatusList)

export default router
