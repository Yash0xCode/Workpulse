/**
 * ML predictions are always proxied through the Node backend (/api/ml/*)
 * so the browser never contacts the Python ML service directly.
 * This avoids CORS issues and keeps auth enforcement centralised.
 */
import { nodePost } from './apiClient.js'

export const predictAttrition = (body, token) => nodePost('/ml/attrition', body, token)
export const predictProductivity = (body, token) => nodePost('/ml/productivity', body, token)
export const predictStudentPerformance = (body, token) => nodePost('/ml/student-performance', body, token)
export const scoreResume = (body, token) => nodePost('/ml/resume-score', body, token)
export const predictStress = (body, token) => nodePost('/ml/stress', body, token)
export const verifyFace = (body, token) => nodePost('/ml/face-verify', body, token)
