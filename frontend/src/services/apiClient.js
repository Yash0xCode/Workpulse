const NODE_BASE_URL = import.meta.env.VITE_NODE_API_URL || 'http://localhost:5000/api'

// Module-level token store – set by AuthContext on login/load so that
// services can be called without threading token through every prop.
let _moduleToken = ''

export const setModuleToken = (t) => { _moduleToken = t || '' }
export const getModuleToken = () => _moduleToken

const buildHeaders = (token) => {
  const effective = token || _moduleToken
  const headers = { 'Content-Type': 'application/json' }
  if (effective) headers.Authorization = `Bearer ${effective}`
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

// mlPost is kept for any legacy usage but callers should prefer the
// backend proxy at /api/ml/* via nodePost to avoid CORS and expose secrets.
export const mlPost = (path, body, token) =>
  request(NODE_BASE_URL, `/ml${path}`, {
    method: 'POST',
    headers: buildHeaders(token),
    body: JSON.stringify(body),
  })

