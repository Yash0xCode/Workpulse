import { nodeGet, nodePost } from './apiClient.js'

export const getPayrollRuns = (token, query = {}) => {
  const params = new URLSearchParams()
  if (query.page) params.append('page', query.page)
  if (query.limit) params.append('limit', query.limit)
  const suffix = params.toString() ? `?${params.toString()}` : ''
  return nodeGet(`/payroll/runs${suffix}`, token)
}

export const createPayrollRun = (body, token) => nodePost('/payroll/runs', body, token)
export const getPayrollRun = (id, token) => nodeGet(`/payroll/runs/${id}`, token)
export const getPayrollEntries = (id, token) => nodeGet(`/payroll/runs/${id}/entries`, token)
export const upsertPayrollEntry = (id, body, token) => nodePost(`/payroll/runs/${id}/entries`, body, token)