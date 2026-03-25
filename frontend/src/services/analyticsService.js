import { nodeGet } from './apiClient'

export const getAttendanceAnalytics = (token, days) =>
	nodeGet(`/analytics/attendance${days ? `?days=${encodeURIComponent(days)}` : ''}`, token)
export const getProductivityAnalytics = (token) => nodeGet('/analytics/productivity', token)
export const getPlacementAnalytics = (token) => nodeGet('/analytics/placement', token)
