import { Router } from 'express'
import { PERMISSIONS } from '../config/rbac.js'
import {
  createEmployee,
  deleteEmployee,
  getEmployeeById,
  getEmployees,
  updateEmployee,
} from '../controllers/employeeController.js'
import { requirePermission } from '../middleware/permissionMiddleware.js'

const router = Router()

router.get('/', requirePermission(PERMISSIONS.VIEW_EMPLOYEES), getEmployees)
router.post('/', requirePermission(PERMISSIONS.ADD_EMPLOYEE), createEmployee)
router.get('/:id', requirePermission(PERMISSIONS.VIEW_EMPLOYEES), getEmployeeById)
router.put('/:id', requirePermission(PERMISSIONS.EDIT_EMPLOYEE), updateEmployee)
router.delete('/:id', requirePermission(PERMISSIONS.DELETE_EMPLOYEE), deleteEmployee)

export default router
