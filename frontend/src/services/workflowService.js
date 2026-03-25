import { nodeGet, nodePost, nodePut } from './apiClient.js'

export const getWorkflowDefinitions = (token) => nodeGet('/workflows/definitions', token)
export const createWorkflowDefinition = (body, token) => nodePost('/workflows/definitions', body, token)
export const updateWorkflowDefinition = (id, body, token) =>
  nodePut(`/workflows/definitions/${id}`, body, token)
export const seedWorkflowDefinitions = (token) => nodePost('/workflows/definitions/seed', {}, token)
export const getWorkflowInstances = (token, query = {}) => {
  const params = new URLSearchParams()
  if (query.page) params.set('page', String(query.page))
  if (query.limit) params.set('limit', String(query.limit))
  const suffix = params.toString() ? `?${params.toString()}` : ''
  return nodeGet(`/workflows/instances${suffix}`, token)
}
export const getWorkflowActions = (instanceId, token) => nodeGet(`/workflows/instances/${instanceId}/actions`, token)
export const createWorkflowInstance = (body, token) => nodePost('/workflows/instances', body, token)
export const transitionWorkflowInstance = (instanceId, body, token) =>
  nodePost(`/workflows/instances/${instanceId}/transition`, body, token)
