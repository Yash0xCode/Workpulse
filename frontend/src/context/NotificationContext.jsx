import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notificationService.js'
import { useAuth } from './AuthContext.jsx'

const NotificationContext = createContext(null)

const POLL_INTERVAL_MS = 30_000 // 30 seconds

export function NotificationProvider({ children }) {
  const { token } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const intervalRef = useRef(null)

  const fetchUnreadCount = useCallback(async () => {
    if (!token) return
    try {
      const res = await getUnreadNotificationCount(token)
      setUnreadCount(res?.data?.unreadCount ?? 0)
    } catch {
      // silently ignore
    }
  }, [token])

  const fetchNotifications = useCallback(async ({ page = 1, limit = 8 } = {}) => {
    if (!token) return
    try {
      const res = await getNotifications(token, { page, limit })
      setNotifications(Array.isArray(res?.data) ? res.data : [])
    } catch {
      setNotifications([])
    }
  }, [token])

  const markRead = useCallback(async (id) => {
    try {
      await markNotificationRead(id, token)
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch {
      // ignore
    }
  }, [token])

  const markAllRead = useCallback(async () => {
    try {
      await markAllNotificationsRead(token)
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch {
      // ignore
    }
  }, [token])

  // Poll unread count
  useEffect(() => {
    fetchUnreadCount()
    if (token) {
      intervalRef.current = setInterval(fetchUnreadCount, POLL_INTERVAL_MS)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [token, fetchUnreadCount])

  const value = {
    notifications,
    unreadCount,
    fetchNotifications,
    fetchUnreadCount,
    markRead,
    markAllRead,
  }

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used inside <NotificationProvider>')
  return ctx
}
