const NODE_BASE_URL = import.meta.env.VITE_NODE_API_URL || 'http://localhost:5000/api'
const ML_BASE_URL = import.meta.env.VITE_ML_API_URL || 'http://localhost:8001'

const buildHeaders = (token) => {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

const request = async (baseUrl, path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, options)
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = data?.error?.message || data?.message || 'Request failed'
    throw new Error(message)
  }
  return data
}

export const nodeGet = (path, token) =>
  request(NODE_BASE_URL, path, {
    method: 'GET',
    headers: buildHeaders(token),
  })

export const nodePost = (path, body, token) =>
  request(NODE_BASE_URL, path, {
    method: 'POST',
    headers: buildHeaders(token),
    body: JSON.stringify(body),
  })

export const nodePut = (path, body, token) =>
  request(NODE_BASE_URL, path, {
    method: 'PUT',
    headers: buildHeaders(token),
    body: JSON.stringify(body),
  })

export const nodeDelete = (path, token) =>
  request(NODE_BASE_URL, path, {
    method: 'DELETE',
    headers: buildHeaders(token),
  })

export const mlPost = (path, body, token) =>
  request(ML_BASE_URL, path, {
    method: 'POST',
    headers: buildHeaders(token),
    body: JSON.stringify(body),
  })
