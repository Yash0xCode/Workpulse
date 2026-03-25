import { nodeDelete, nodeGet, nodePost, nodePut } from './apiClient'

export const getEmployees = (token) => nodeGet('/employees', token)
export const getTeamEmployees = (token) => nodeGet('/employees?view=team', token)
export const createEmployee = (body, token) => nodePost('/employees', body, token)
export const updateEmployee = (id, body, token) => nodePut(`/employees/${id}`, body, token)
export const deleteEmployee = (id, token) => nodeDelete(`/employees/${id}`, token)
