import { pool } from '../config/db.js'
import { sendError, sendPaginated, sendSuccess } from '../utils/response.js'

const notificationSelect = `
  SELECT
    id,
    organization_id AS "organizationId",
    user_id AS "userId",
    title,
    message,
    type,
    resource_type AS "resourceType",
    resource_id AS "resourceId",
    is_read AS "isRead",
    created_at AS "createdAt"
  FROM notifications
`

export const getNotifications = async (req, res) => {
  try {
    const { page, limit, offset } = req.pagination || { page: 1, limit: 20, offset: 0 }

    const list = await pool.query(
      `${notificationSelect}
       WHERE organization_id = $1 AND user_id = $2
       ORDER BY created_at DESC
       LIMIT $3 OFFSET $4`,
      [req.user.organizationId, req.user.id, limit, offset]
    )

    const count = await pool.query(
      `SELECT COUNT(*)::int AS total FROM notifications WHERE organization_id = $1 AND user_id = $2`,
      [req.user.organizationId, req.user.id]
    )

    return sendPaginated(res, list.rows, page, limit, count.rows[0]?.total || 0)
  } catch (_error) {
    return sendError(res, 'SERVER_ERROR', 'Failed to fetch notifications', {}, 500)
  }
}

export const getUnreadNotificationCount = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*)::int AS total FROM notifications WHERE organization_id = $1 AND user_id = $2 AND is_read = FALSE`,
      [req.user.organizationId, req.user.id]
    )

    return sendSuccess(res, { unreadCount: result.rows[0]?.total || 0 })
  } catch (_error) {
    return sendError(res, 'SERVER_ERROR', 'Failed to fetch notification count', {}, 500)
  }
}

export const markNotificationRead = async (req, res) => {
  try {
    const result = await pool.query(
      `
        UPDATE notifications
        SET is_read = TRUE
        WHERE id = $1 AND organization_id = $2 AND user_id = $3
        RETURNING id
      `,
      [Number(req.params.id), req.user.organizationId, req.user.id]
    )

    if (!result.rows[0]) {
      return sendError(res, 'NOT_FOUND', 'Notification not found', {}, 404)
    }

    return sendSuccess(res, { id: result.rows[0].id, isRead: true })
  } catch (_error) {
    return sendError(res, 'SERVER_ERROR', 'Failed to update notification', {}, 500)
  }
}

export const markAllNotificationsRead = async (req, res) => {
  try {
    await pool.query(
      `
        UPDATE notifications
        SET is_read = TRUE
        WHERE organization_id = $1 AND user_id = $2 AND is_read = FALSE
      `,
      [req.user.organizationId, req.user.id]
    )

    return sendSuccess(res, { updated: true })
  } catch (_error) {
    return sendError(res, 'SERVER_ERROR', 'Failed to update notifications', {}, 500)
  }
}
