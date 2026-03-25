import { Router } from 'express'
import { PERMISSIONS } from '../config/rbac.js'
import {
  getWorkflowActions,
  getWorkflowDefinitions,
  getWorkflowInstanceById,
  getWorkflowInstances,
  seedWorkflowDefinitions,
} from '../controllers/workflowController.js'
import { requirePermission } from '../middleware/permissionMiddleware.js'

const router = Router()

router.get('/definitions', requirePermission(PERMISSIONS.VIEW_LEAVES), getWorkflowDefinitions)
router.post('/definitions/seed', requirePermission(PERMISSIONS.APPROVE_LEAVE), seedWorkflowDefinitions)
router.get('/instances', requirePermission(PERMISSIONS.VIEW_LEAVES), getWorkflowInstances)
router.get('/instances/:id', requirePermission(PERMISSIONS.VIEW_LEAVES), getWorkflowInstanceById)
router.get('/instances/:id/actions', requirePermission(PERMISSIONS.VIEW_LEAVES), getWorkflowActions)

export default router
