import { nodeGet, nodePost, nodePut } from './apiClient.js'

export const createTask = (body, token) => nodePost('/tasks', body, token)
export const getTasks = (token) => nodeGet('/tasks', token)
export const getTeamTasks = (token) => nodeGet('/tasks?view=team', token)
export const updateTask = (id, body, token) => nodePut(`/tasks/${id}`, body, token)
