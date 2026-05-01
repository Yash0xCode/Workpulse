import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { getMe } from '../services/authService.js'

const AuthContext = createContext(null)

const TOKEN_KEY = 'workpulse_token'

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => localStorage.getItem(TOKEN_KEY) || '')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const setToken = useCallback((newToken) => {
    if (newToken) {
      localStorage.setItem(TOKEN_KEY, newToken)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
    setTokenState(newToken || '')
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setTokenState('')
    setUser(null)
  }, [])

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }

    let mounted = true
    getMe(token)
      .then((res) => {
        if (!mounted) return
        if (res?.user) setUser(res.user)
      })
      .catch(() => {
        if (!mounted) return
        logout()
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [token, logout])

  const value = { token, setToken, user, setUser, logout, loading, isAuthenticated: Boolean(token && user) }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
