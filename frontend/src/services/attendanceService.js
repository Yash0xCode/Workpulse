import { mlPost, nodeGet, nodePost } from './apiClient.js'

export const checkIn = (body, token) => nodePost('/attendance/checkin', body, token)
export const checkOut = (body, token) => nodePost('/attendance/checkout', body, token)
export const getAttendanceByUser = (userId, token) => nodeGet(`/attendance/user/${userId}`, token)
export const getTeamAttendance = (token) => nodeGet('/attendance/team', token)
export const getAttendanceSummary = (token) => nodeGet('/attendance/summary', token)
export const getAttendanceStatusList = (token, date) =>
	nodeGet(`/attendance/status${date ? `?date=${encodeURIComponent(date)}` : ''}`, token)
export const verifyFaceAttendance = (body, token) => mlPost('/ml/face-attendance', body, token)
