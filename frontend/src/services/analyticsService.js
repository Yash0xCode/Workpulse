import { nodeGet } from './apiClient'

export const getAttendanceAnalytics = (token) => nodeGet('/analytics/attendance', token)
export const getProductivityAnalytics = (token) => nodeGet('/analytics/productivity', token)
export const getPlacementAnalytics = (token) => nodeGet('/analytics/placement', token)
