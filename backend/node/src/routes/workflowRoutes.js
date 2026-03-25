import { Router } from 'express'
import { PERMISSIONS } from '../config/rbac.js'
import {
  createDefinition,
  createInstance,
  editDefinition,
  getWorkflowActions,
  getWorkflowDefinitions,
  getWorkflowInstanceById,
  getWorkflowInstances,
  seedWorkflowDefinitions,
  transitionInstance,
} from '../controllers/workflowController.js'
import { requirePermission } from '../middleware/permissionMiddleware.js'

const router = Router()

router.get('/definitions', requirePermission(PERMISSIONS.VIEW_LEAVES), getWorkflowDefinitions)
router.post('/definitions', requirePermission(PERMISSIONS.APPROVE_LEAVE), createDefinition)
router.put('/definitions/:id', requirePermission(PERMISSIONS.APPROVE_LEAVE), editDefinition)
router.post('/definitions/seed', requirePermission(PERMISSIONS.APPROVE_LEAVE), seedWorkflowDefinitions)
router.get('/instances', requirePermission(PERMISSIONS.VIEW_LEAVES), getWorkflowInstances)
router.post('/instances', requirePermission(PERMISSIONS.APPROVE_LEAVE), createInstance)
router.get('/instances/:id', requirePermission(PERMISSIONS.VIEW_LEAVES), getWorkflowInstanceById)
router.get('/instances/:id/actions', requirePermission(PERMISSIONS.VIEW_LEAVES), getWorkflowActions)
router.post('/instances/:id/transition', requirePermission(PERMISSIONS.APPROVE_LEAVE), transitionInstance)

export default router
