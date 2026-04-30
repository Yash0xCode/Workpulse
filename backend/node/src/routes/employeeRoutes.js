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
import { validateRequest } from '../middleware/validateRequest.js'
import { createEmployeeSchema, updateEmployeeSchema } from '../validators/employeeValidators.js'

/**
 * @openapi
 * tags:
 *   name: Employees
 *   description: Employee directory and management
 */

const router = Router()

const mlLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TOO_MANY_REQUESTS', message: 'Too many requests, please try again later.' },
})

/**
 * @openapi
 * /employees:
 *   get:
 *     tags: [Employees]
 *     summary: List employees (paginated)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: department
 *         schema: { type: string }
 *     responses:
 *       200: { description: Paginated employee list }
 */
router.get('/', requirePermission(PERMISSIONS.VIEW_EMPLOYEES), getEmployees)
router.get('/stress/suggestions', requirePermission(PERMISSIONS.VIEW_EMPLOYEES), mlLimiter, getStressSuggestions)

/**
 * @openapi
 * /employees:
 *   post:
 *     tags: [Employees]
 *     summary: Create an employee
 *     responses:
 *       201: { description: Employee created }
 */
router.post('/', requirePermission(PERMISSIONS.ADD_EMPLOYEE), validateRequest(createEmployeeSchema), createEmployee)
router.get('/:id', requirePermission(PERMISSIONS.VIEW_EMPLOYEES), getEmployeeById)
router.get('/:id/stress', requirePermission(PERMISSIONS.VIEW_EMPLOYEES), mlLimiter, getEmployeeStress)
router.post('/:id/face-register', requirePermission(PERMISSIONS.EDIT_EMPLOYEE), mlLimiter, registerFace)

/**
 * @openapi
 * /employees/{id}:
 *   put:
 *     tags: [Employees]
 *     summary: Update an employee
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Updated employee }
 */
router.put('/:id', requirePermission(PERMISSIONS.EDIT_EMPLOYEE), validateRequest(updateEmployeeSchema), updateEmployee)
router.delete('/:id', requirePermission(PERMISSIONS.DELETE_EMPLOYEE), deleteEmployee)

export default router
