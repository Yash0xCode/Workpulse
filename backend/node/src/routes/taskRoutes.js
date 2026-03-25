import { Router } from 'express'
import { PERMISSIONS } from '../config/rbac.js'
import { createTask, getTasks, updateTask } from '../controllers/taskController.js'
import { requirePermission } from '../middleware/permissionMiddleware.js'

const router = Router()

router.post('/', requirePermission(PERMISSIONS.ASSIGN_TASK), createTask)
router.get('/', getTasks)
router.put('/:id', requirePermission(PERMISSIONS.ASSIGN_TASK), updateTask)

export default router
