import { sendError, sendPaginated, sendSuccess } from '../utils/response.js'
import {
  addReviewFeedback,
  createPerformanceGoal,
  createPerformanceReview,
  listPerformanceGoals,
  listPerformanceReviews,
  updatePerformanceGoal,
} from '../services/performanceService.js'

const managerRoles = ['hr_manager', 'department_manager', 'super_admin', 'institute_admin']

export const getGoals = async (req, res) => {
  try {
    const { page = 1, limit = 50, offset = 0 } = req.pagination || {}
    const goals = await listPerformanceGoals({
      organizationId: req.user.organizationId,
      employeeId: req.query.employeeId,
      status: req.query.status,
    })
    return sendPaginated(res, goals, page, limit, goals.length)
  } catch (_error) {
    return sendError(res, 'SERVER_ERROR', 'Failed to fetch performance goals', {}, 500)
  }
}

export const createGoal = async (req, res) => {
  try {
    if (!managerRoles.includes(req.user.role)) {
      return sendError(res, 'FORBIDDEN', 'Insufficient permissions to create goals', {}, 403)
    }
    const goal = await createPerformanceGoal({
      organizationId: req.user.organizationId,
      employeeId: req.body?.employeeId,
      title: req.body?.title,
      description: req.body?.description,
      status: req.body?.status,
      weight: req.body?.weight,
    })
    return sendSuccess(res, goal, {}, 201)
  } catch (error) {
    return sendError(res, 'VALIDATION_ERROR', error.message || 'Failed to create goal', {}, 400)
  }
}

export const updateGoal = async (req, res) => {
  try {
    if (!managerRoles.includes(req.user.role)) {
      return sendError(res, 'FORBIDDEN', 'Insufficient permissions to update goals', {}, 403)
    }
    const updated = await updatePerformanceGoal({
      organizationId: req.user.organizationId,
      goalId: req.params.id,
      status: req.body?.status,
      progress: req.body?.progress,
    })
    if (!updated) return sendError(res, 'NOT_FOUND', 'Goal not found', {}, 404)
    return sendSuccess(res, updated)
  } catch (error) {
    const msg = error.message || 'Failed to update goal'
    const code = msg.includes('No updates') ? 400 : 400
    return sendError(res, 'VALIDATION_ERROR', msg, {}, code)
  }
}

export const getReviews = async (req, res) => {
  try {
    const { page = 1, limit = 50, offset = 0 } = req.pagination || {}
    const reviews = await listPerformanceReviews({
      organizationId: req.user.organizationId,
      employeeId: req.query.employeeId,
    })
    return sendPaginated(res, reviews, page, limit, reviews.length)
  } catch (_error) {
    return sendError(res, 'SERVER_ERROR', 'Failed to fetch performance reviews', {}, 500)
  }
}

export const createReview = async (req, res) => {
  try {
    if (!managerRoles.includes(req.user.role)) {
      return sendError(res, 'FORBIDDEN', 'Insufficient permissions to create reviews', {}, 403)
    }
    const review = await createPerformanceReview({
      organizationId: req.user.organizationId,
      employeeId: req.body?.employeeId,
      reviewerUserId: req.user.id,
      periodStart: req.body?.periodStart,
      periodEnd: req.body?.periodEnd,
      overallRating: req.body?.overallRating,
      summary: req.body?.summary,
      status: req.body?.status,
    })
    return sendSuccess(res, review, {}, 201)
  } catch (error) {
    return sendError(res, 'VALIDATION_ERROR', error.message || 'Failed to create review', {}, 400)
  }
}

export const addFeedback = async (req, res) => {
  try {
    if (!managerRoles.includes(req.user.role)) {
      return sendError(res, 'FORBIDDEN', 'Insufficient permissions to add feedback', {}, 403)
    }
    const feedback = await addReviewFeedback({
      organizationId: req.user.organizationId,
      reviewId: req.params.id,
      userId: req.user.id,
      comment: req.body?.comment,
      sentiment: req.body?.sentiment,
    })
    return sendSuccess(res, feedback, {}, 201)
  } catch (error) {
    return sendError(res, 'VALIDATION_ERROR', error.message || 'Failed to add feedback', {}, 400)
  }
}
