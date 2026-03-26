import { Router } from 'express'
import { PERMISSIONS } from '../config/rbac.js'
import { createRun, getRunById, getRunEntries, getRuns, upsertEntry } from '../controllers/payrollController.js'
import { requirePermission } from '../middleware/permissionMiddleware.js'

const router = Router()

router.get('/runs', requirePermission(PERMISSIONS.VIEW_PAYROLL), getRuns)
router.post('/runs', requirePermission(PERMISSIONS.MANAGE_PAYROLL), createRun)
router.get('/runs/:id', requirePermission(PERMISSIONS.VIEW_PAYROLL), getRunById)
router.get('/runs/:id/entries', requirePermission(PERMISSIONS.VIEW_PAYROLL), getRunEntries)
router.post('/runs/:id/entries', requirePermission(PERMISSIONS.MANAGE_PAYROLL), upsertEntry)

export default router