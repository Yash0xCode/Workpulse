import { Router } from 'express'
import { PERMISSIONS } from '../config/rbac.js'
import { addFeedback, createGoal, createReview, getGoals, getReviews, updateGoal } from '../controllers/performanceController.js'
import { requirePermission } from '../middleware/permissionMiddleware.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { addFeedbackSchema, createGoalSchema, createReviewSchema, updateGoalSchema } from '../validators/performanceValidators.js'

/**
 * @openapi
 * tags:
 *   name: Performance
 *   description: Goals, reviews, and feedback management
 */

const router = Router()

router.get('/goals', requirePermission(PERMISSIONS.VIEW_PERFORMANCE), getGoals)
router.post('/goals', requirePermission(PERMISSIONS.MANAGE_PERFORMANCE), validateRequest(createGoalSchema), createGoal)
router.put('/goals/:id', requirePermission(PERMISSIONS.MANAGE_PERFORMANCE), validateRequest(updateGoalSchema), updateGoal)

router.get('/reviews', requirePermission(PERMISSIONS.VIEW_PERFORMANCE), getReviews)
router.post('/reviews', requirePermission(PERMISSIONS.MANAGE_PERFORMANCE), validateRequest(createReviewSchema), createReview)
router.post('/reviews/:id/feedback', requirePermission(PERMISSIONS.MANAGE_PERFORMANCE), validateRequest(addFeedbackSchema), addFeedback)

export default router
