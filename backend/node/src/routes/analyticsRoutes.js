import { Router } from 'express'
import { PERMISSIONS } from '../config/rbac.js'
import {
  getAttendanceAnalytics,
  getPlacementAnalytics,
  getProductivityAnalytics,
} from '../controllers/analyticsController.js'
import { requirePermission } from '../middleware/permissionMiddleware.js'

const router = Router()

router.get('/attendance', requirePermission(PERMISSIONS.VIEW_ANALYTICS), getAttendanceAnalytics)
router.get('/productivity', requirePermission(PERMISSIONS.VIEW_ANALYTICS), getProductivityAnalytics)
router.get('/placement', requirePermission(PERMISSIONS.VIEW_ANALYTICS), getPlacementAnalytics)

export default router
