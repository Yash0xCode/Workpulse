import { nodeGet, nodePost } from './apiClient.js'

export const getWorkflowDefinitions = (token) => nodeGet('/workflows/definitions', token)
export const seedWorkflowDefinitions = (token) => nodePost('/workflows/definitions/seed', {}, token)
export const getWorkflowInstances = (token, query = {}) => {
  const params = new URLSearchParams()
  if (query.page) params.set('page', String(query.page))
  if (query.limit) params.set('limit', String(query.limit))
  const suffix = params.toString() ? `?${params.toString()}` : ''
  return nodeGet(`/workflows/instances${suffix}`, token)
}
export const getWorkflowActions = (instanceId, token) => nodeGet(`/workflows/instances/${instanceId}/actions`, token)
