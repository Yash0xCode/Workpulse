import { useEffect, useMemo, useState } from 'react'
import { Icon } from '../common/Icons.jsx'
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../services/notificationService.js'

function TopNav({ title = 'Dashboard', subtitle = 'Overview', user, token = '', onLogout }) {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifMenu, setShowNotifMenu] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  const initials = (user?.fullName || 'WP')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const loadUnreadCount = async () => {
    if (!token) return
    try {
      const response = await getUnreadNotificationCount(token)
      setUnreadCount(response?.data?.unreadCount || 0)
    } catch {
      setUnreadCount(0)
    }
  }

  const loadNotifications = async () => {
    if (!token) return
    try {
      const response = await getNotifications(token, { page: 1, limit: 8 })
      setNotifications(Array.isArray(response?.data) ? response.data : [])
    } catch {
      setNotifications([])
    }
  }

  useEffect(() => {
    loadUnreadCount()
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleNotifications = async () => {
    const next = !showNotifMenu
    setShowNotifMenu(next)
    if (next) {
      await loadNotifications()
      await loadUnreadCount()
    }
  }

  const handleMarkRead = async (notificationId) => {
    try {
      await markNotificationRead(notificationId, token)
      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch {
      // no-op
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead(token)
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch {
      // no-op
    }
  }

  const notificationLabel = useMemo(() => {
    if (unreadCount <= 0) return '0'
    if (unreadCount > 99) return '99+'
    return String(unreadCount)
  }, [unreadCount])

  return (
    <header className="top-nav">
      <div className="top-title">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>

      <div className="search-bar">
        <Icon name="search" size={15} className="search-icon-svg" />
        <input placeholder="Search employees, tasks, reports..." aria-label="Global search" />
      </div>

      <div className="top-actions">
        <div className="notif-wrap">
          <button className="icon-btn notif-btn" type="button" aria-label="Notifications" onClick={handleToggleNotifications}>
            <Icon name="bell" size={18} />
            <span className="notif-badge">{notificationLabel}</span>
          </button>
          {showNotifMenu && (
            <div className="notif-dropdown" role="menu">
              <div className="notif-header">
                <strong>Notifications</strong>
                <button type="button" onClick={handleMarkAllRead}>Mark all read</button>
              </div>
              <div className="notif-list">
                {notifications.length === 0 && <div className="notif-empty">No notifications yet.</div>}
                {notifications.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`notif-item ${item.isRead ? 'read' : 'unread'}`}
                    onClick={() => handleMarkRead(item.id)}
                  >
                    <div className="notif-title">{item.title}</div>
                    <div className="notif-message">{item.message}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="user-menu-wrap">
          <button
            className="profile-chip"
            type="button"
            onClick={() => setShowUserMenu((v) => !v)}
          >
            <span className="avatar">{initials}</span>
            <span className="profile-name">{user?.fullName || 'WorkPulse User'}</span>
            <Icon
              name="chevronDown"
              size={14}
              className={`chevron-icon ${showUserMenu ? 'open' : ''}`}
            />
          </button>

          {showUserMenu && (
            <div className="user-dropdown" role="menu">
              <div className="user-dropdown-header">
                <span className="avatar avatar-lg">{initials}</span>
                <div>
                  <div className="dropdown-name">{user?.fullName || 'WorkPulse User'}</div>
                  <div className="dropdown-email">{user?.email || ''}</div>
                </div>
              </div>
              <div className="user-dropdown-divider" />
              <button
                className="user-dropdown-item danger"
                type="button"
                onClick={() => { setShowUserMenu(false); onLogout() }}
              >
                <Icon name="logout" size={15} />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default TopNav
