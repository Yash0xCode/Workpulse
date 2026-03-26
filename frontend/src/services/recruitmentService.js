import { nodeGet, nodePost, nodePut } from './apiClient.js'

export const listJobs = (token) => nodeGet('/recruitment/jobs', token)
export const createJob = (body, token) => nodePost('/recruitment/jobs', body, token)
export const listApplications = (query = {}, token) => {
  const params = new URLSearchParams()
  if (query.jobId) params.append('jobId', query.jobId)
  if (query.status) params.append('status', query.status)
  const suffix = params.toString() ? `?${params.toString()}` : ''
  return nodeGet(`/recruitment/applications${suffix}`, token)
}
export const createApplication = (body, token) => nodePost('/recruitment/applications', body, token)
export const updateApplicationStatus = (id, body, token) => nodePut(`/recruitment/applications/${id}/status`, body, token)
