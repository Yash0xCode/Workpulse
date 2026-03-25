import { nodeGet, nodePost, nodePut } from './apiClient.js'

export const createLeave = (body, token) => nodePost('/leaves', body, token)
export const getLeaves = (token) => nodeGet('/leaves', token)
export const getPendingLeaveApprovals = (token) => nodeGet('/leaves/pending-approvals', token)
export const getLeaveWorkflow = (leaveId, token) => nodeGet(`/leaves/${leaveId}/workflow`, token)
export const updateLeave = (id, body, token) => nodePut(`/leaves/${id}`, body, token)
export const approveLeave = (id, body, token) => nodePut(`/leaves/${id}/approve`, body, token)
export const getLeavePolicies = (token) => nodeGet('/leaves/policies', token)
export const updateLeavePolicies = (body, token) => nodePut('/leaves/policies', body, token)
export const getLeaveBalances = (token, params = {}) => {
	const query = new URLSearchParams()
	if (params.employeeId) query.set('employeeId', String(params.employeeId))
	if (params.year) query.set('year', String(params.year))
	const suffix = query.toString() ? `?${query.toString()}` : ''
	return nodeGet(`/leaves/balances${suffix}`, token)
}
export const updateLeaveBalances = (body, token) => nodePut('/leaves/balances', body, token)
export const initializeYearLeaveBalances = (body, token) =>
	nodePost('/leaves/balances/initialize-year', body, token)
