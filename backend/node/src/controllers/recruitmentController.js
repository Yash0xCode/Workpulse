import { sendError, sendPaginated, sendSuccess } from '../utils/response.js'
import {
  createApplication,
  createJobOpening,
  listApplications,
  listJobOpenings,
  updateApplicationStatus,
} from '../services/recruitmentService.js'

const managerRoles = ['hr_manager', 'department_manager', 'super_admin', 'institute_admin']

export const getJobs = async (req, res) => {
  try {
    const { page = 1, limit = 50, offset = 0 } = req.pagination || {}
    const rows = await listJobOpenings({ organizationId: req.user.organizationId, limit, offset })
    return sendPaginated(res, rows, page, limit, rows.length)
  } catch (_error) {
    return sendError(res, 'SERVER_ERROR', 'Failed to fetch job openings', {}, 500)
  }
}

export const createJob = async (req, res) => {
  try {
    if (!managerRoles.includes(req.user.role)) {
      return sendError(res, 'FORBIDDEN', 'Insufficient permissions to create jobs', {}, 403)
    }
    const job = await createJobOpening({
      organizationId: req.user.organizationId,
      title: req.body?.title,
      department: req.body?.department,
      location: req.body?.location,
      description: req.body?.description,
      status: req.body?.status || 'open',
    })
    return sendSuccess(res, job, {}, 201)
  } catch (error) {
    return sendError(res, 'VALIDATION_ERROR', error.message || 'Failed to create job opening', {}, 400)
  }
}

export const getApplications = async (req, res) => {
  try {
    const rows = await listApplications({
      organizationId: req.user.organizationId,
      jobId: req.query.jobId || req.params.jobId,
      status: req.query.status,
    })
    return sendSuccess(res, rows)
  } catch (_error) {
    return sendError(res, 'SERVER_ERROR', 'Failed to fetch applications', {}, 500)
  }
}

export const createJobApplication = async (req, res) => {
  try {
    if (!managerRoles.includes(req.user.role) && req.user.role !== 'recruiter') {
      return sendError(res, 'FORBIDDEN', 'Insufficient permissions to create applications', {}, 403)
    }
    const application = await createApplication({
      organizationId: req.user.organizationId,
      jobId: req.body?.jobId,
      candidateId: req.body?.candidateId,
      candidate: req.body?.candidate,
      source: req.body?.source,
      notes: req.body?.notes,
    })
    return sendSuccess(res, application, {}, 201)
  } catch (error) {
    const msg = error.message || 'Failed to create application'
    const code = msg.includes('not found') ? 404 : 400
    return sendError(res, 'VALIDATION_ERROR', msg, {}, code)
  }
}

export const updateApplication = async (req, res) => {
  try {
    if (!managerRoles.includes(req.user.role) && req.user.role !== 'recruiter') {
      return sendError(res, 'FORBIDDEN', 'Insufficient permissions to update applications', {}, 403)
    }
    const updated = await updateApplicationStatus({
      organizationId: req.user.organizationId,
      applicationId: req.params.id,
      status: req.body?.status,
      notes: req.body?.notes,
    })
    if (!updated) return sendError(res, 'NOT_FOUND', 'Application not found', {}, 404)
    return sendSuccess(res, updated)
  } catch (error) {
    return sendError(res, 'VALIDATION_ERROR', error.message || 'Failed to update application', {}, 400)
  }
}
