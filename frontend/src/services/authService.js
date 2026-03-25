import { nodeGet, nodePost } from './apiClient'

export const signup = async (payload) => {
  const response = await nodePost('/auth/signup', payload)
  return response?.data || {}
}

export const login = async (payload) => {
  const response = await nodePost('/auth/login', payload)
  return response?.data || {}
}

export const getMe = async (token) => {
  const response = await nodeGet('/auth/me', token)
  return response?.data || {}
}

export const logout = () => {
  localStorage.removeItem('workpulse_token')
}