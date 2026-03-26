import { Router } from 'express'
import { PERMISSIONS } from '../config/rbac.js'
import { createJob, createJobApplication, getApplications, getJobs, updateApplication } from '../controllers/recruitmentController.js'
import { requirePermission } from '../middleware/permissionMiddleware.js'

const router = Router()

router.get('/jobs', requirePermission(PERMISSIONS.VIEW_RECRUITMENT), getJobs)
router.post('/jobs', requirePermission(PERMISSIONS.MANAGE_RECRUITMENT), createJob)
router.get('/applications', requirePermission(PERMISSIONS.VIEW_RECRUITMENT), getApplications)
router.get('/jobs/:jobId/applications', requirePermission(PERMISSIONS.VIEW_RECRUITMENT), getApplications)
router.post('/applications', requirePermission(PERMISSIONS.MANAGE_RECRUITMENT), createJobApplication)
router.put('/applications/:id/status', requirePermission(PERMISSIONS.MANAGE_RECRUITMENT), updateApplication)

export default router
