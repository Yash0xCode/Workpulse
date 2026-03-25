import { nodeGet, nodePut } from './apiClient.js'

export const getNotifications = (token, params = {}) => {
  const page = params.page || 1
  const limit = params.limit || 10
  return nodeGet(`/notifications?page=${page}&limit=${limit}`, token)
}

export const getUnreadNotificationCount = (token) => nodeGet('/notifications/unread-count', token)

export const markNotificationRead = (id, token) => nodePut(`/notifications/${id}/read`, {}, token)

export const markAllNotificationsRead = (token) => nodePut('/notifications/read-all', {}, token)
