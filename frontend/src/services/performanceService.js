import { nodeGet, nodePost, nodePut } from './apiClient.js'

export const listGoals = (query = {}, token) => {
  const params = new URLSearchParams()
  if (query.employeeId) params.append('employeeId', query.employeeId)
  if (query.status) params.append('status', query.status)
  const suffix = params.toString() ? `?${params.toString()}` : ''
  return nodeGet(`/performance/goals${suffix}`, token)
}

export const createGoal = (body, token) => nodePost('/performance/goals', body, token)
export const updateGoal = (id, body, token) => nodePut(`/performance/goals/${id}`, body, token)

export const listReviews = (query = {}, token) => {
  const params = new URLSearchParams()
  if (query.employeeId) params.append('employeeId', query.employeeId)
  const suffix = params.toString() ? `?${params.toString()}` : ''
  return nodeGet(`/performance/reviews${suffix}`, token)
}

export const createReview = (body, token) => nodePost('/performance/reviews', body, token)
export const addFeedback = (reviewId, body, token) => nodePost(`/performance/reviews/${reviewId}/feedback`, body, token)
