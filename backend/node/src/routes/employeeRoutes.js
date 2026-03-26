import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { PERMISSIONS } from '../config/rbac.js'
import {
  createEmployee,
  deleteEmployee,
  getEmployeeById,
  getEmployees,
  getEmployeeStress,
  getStressSuggestions,
  registerFace,
  updateEmployee,
} from '../controllers/employeeController.js'
import { requirePermission } from '../middleware/permissionMiddleware.js'

const router = Router()

// Rate limiter for ML-backed compute-intensive endpoints
const mlLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TOO_MANY_REQUESTS', message: 'Too many requests, please try again later.' },
})

router.get('/', requirePermission(PERMISSIONS.VIEW_EMPLOYEES), getEmployees)
router.get('/stress/suggestions', requirePermission(PERMISSIONS.VIEW_EMPLOYEES), mlLimiter, getStressSuggestions)
router.post('/', requirePermission(PERMISSIONS.ADD_EMPLOYEE), createEmployee)
router.get('/:id', requirePermission(PERMISSIONS.VIEW_EMPLOYEES), getEmployeeById)
router.get('/:id/stress', requirePermission(PERMISSIONS.VIEW_EMPLOYEES), mlLimiter, getEmployeeStress)
router.post('/:id/face-register', requirePermission(PERMISSIONS.EDIT_EMPLOYEE), mlLimiter, registerFace)
router.put('/:id', requirePermission(PERMISSIONS.EDIT_EMPLOYEE), updateEmployee)
router.delete('/:id', requirePermission(PERMISSIONS.DELETE_EMPLOYEE), deleteEmployee)

export default router
