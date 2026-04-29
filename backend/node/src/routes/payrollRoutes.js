import { Router } from 'express'
import { PERMISSIONS } from '../config/rbac.js'
import { createRun, getRunById, getRunEntries, getRuns, upsertEntry } from '../controllers/payrollController.js'
import { requirePermission } from '../middleware/permissionMiddleware.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { createRunSchema, upsertEntrySchema } from '../validators/payrollValidators.js'

/**
 * @openapi
 * tags:
 *   name: Payroll
 *   description: Payroll runs and salary entries
 */

const router = Router()

/**
 * @openapi
 * /payroll/runs:
 *   get:
 *     tags: [Payroll]
 *     summary: List payroll runs
 *     responses:
 *       200: { description: Payroll run list }
 */
router.get('/runs', requirePermission(PERMISSIONS.VIEW_PAYROLL), getRuns)

/**
 * @openapi
 * /payroll/runs:
 *   post:
 *     tags: [Payroll]
 *     summary: Create a payroll run
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [periodYear, periodMonth]
 *             properties:
 *               periodYear: { type: integer }
 *               periodMonth: { type: integer, minimum: 1, maximum: 12 }
 *               payDate: { type: string, format: date }
 *     responses:
 *       201: { description: Payroll run created }
 */
router.post('/runs', requirePermission(PERMISSIONS.MANAGE_PAYROLL), validateRequest(createRunSchema), createRun)
router.get('/runs/:id', requirePermission(PERMISSIONS.VIEW_PAYROLL), getRunById)
router.get('/runs/:id/entries', requirePermission(PERMISSIONS.VIEW_PAYROLL), getRunEntries)
router.post('/runs/:id/entries', requirePermission(PERMISSIONS.MANAGE_PAYROLL), validateRequest(upsertEntrySchema), upsertEntry)

export default router
