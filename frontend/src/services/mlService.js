import { mlPost } from './apiClient.js'

export const predictAttrition = (body, token) => mlPost('/ml/attrition', body, token)
export const predictProductivity = (body, token) => mlPost('/ml/productivity', body, token)
export const predictStudentPerformance = (body, token) => mlPost('/ml/student-performance', body, token)
export const scoreResume = (body, token) => mlPost('/ml/resume-score', body, token)
