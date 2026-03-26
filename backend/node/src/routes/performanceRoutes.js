import { Router } from 'express'
import { PERMISSIONS } from '../config/rbac.js'
import { addFeedback, createGoal, createReview, getGoals, getReviews, updateGoal } from '../controllers/performanceController.js'
import { requirePermission } from '../middleware/permissionMiddleware.js'

const router = Router()

router.get('/goals', requirePermission(PERMISSIONS.VIEW_PERFORMANCE), getGoals)
router.post('/goals', requirePermission(PERMISSIONS.MANAGE_PERFORMANCE), createGoal)
router.put('/goals/:id', requirePermission(PERMISSIONS.MANAGE_PERFORMANCE), updateGoal)

router.get('/reviews', requirePermission(PERMISSIONS.VIEW_PERFORMANCE), getReviews)
router.post('/reviews', requirePermission(PERMISSIONS.MANAGE_PERFORMANCE), createReview)
router.post('/reviews/:id/feedback', requirePermission(PERMISSIONS.MANAGE_PERFORMANCE), addFeedback)

export default router
