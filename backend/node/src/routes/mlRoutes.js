import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import {
  predictAttrition,
  predictProductivity,
  predictStress,
  predictStudentPerformance,
  scoreResume,
  verifyFace,
} from '../controllers/mlController.js'
import { PERMISSIONS } from '../config/rbac.js'
import { requirePermission } from '../middleware/permissionMiddleware.js'

/**
 * @openapi
 * tags:
 *   name: ML
 *   description: Machine-learning predictions proxied through the backend
 */

const router = Router()

// ML predictions are compute-intensive — strict rate limit
const mlLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TOO_MANY_REQUESTS', message: 'Too many ML requests, please try again later.' },
})

router.post('/attrition', mlLimiter, requirePermission(PERMISSIONS.VIEW_ANALYTICS), predictAttrition)
router.post('/productivity', mlLimiter, requirePermission(PERMISSIONS.VIEW_ANALYTICS), predictProductivity)
router.post('/stress', mlLimiter, requirePermission(PERMISSIONS.VIEW_ANALYTICS), predictStress)
router.post('/resume-score', mlLimiter, requirePermission(PERMISSIONS.VIEW_ANALYTICS), scoreResume)
router.post('/student-performance', mlLimiter, requirePermission(PERMISSIONS.VIEW_ANALYTICS), predictStudentPerformance)
router.post('/face-verify', mlLimiter, requirePermission(PERMISSIONS.VIEW_ANALYTICS), verifyFace)

export default router
