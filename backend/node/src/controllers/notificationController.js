import { pool } from '../config/db.js'
import {
  WEBHOOK_EVENT_TYPES,
  createNotificationWebhook,
  listNotificationWebhooks,
  listWebhookDeliveries,
  updateNotificationWebhook,
} from '../services/notificationService.js'
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

const canManageWebhooks = (role) =>
  ['department_manager', 'hr_manager', 'super_admin', 'institute_admin'].includes(role)

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

export const getNotificationWebhooks = async (req, res) => {
  try {
    if (!canManageWebhooks(req.user?.role)) {
      return sendError(res, 'FORBIDDEN', 'Only managers or HR can manage webhooks', {}, 403)
    }

    const rows = await listNotificationWebhooks({ organizationId: req.user.organizationId })
    return sendSuccess(res, rows)
  } catch (_error) {
    return sendError(res, 'SERVER_ERROR', 'Failed to fetch webhook configurations', {}, 500)
  }
}

export const createWebhookConfiguration = async (req, res) => {
  try {
    if (!canManageWebhooks(req.user?.role)) {
      return sendError(res, 'FORBIDDEN', 'Only managers or HR can manage webhooks', {}, 403)
    }

    const eventType = String(req.body?.eventType || '').trim()
    const targetUrl = String(req.body?.targetUrl || '').trim()
    const secret = req.body?.secret !== undefined ? String(req.body.secret) : undefined
    const isActive = req.body?.isActive

    if (!WEBHOOK_EVENT_TYPES.includes(eventType)) {
      return sendError(
        res,
        'VALIDATION_ERROR',
        `eventType must be one of: ${WEBHOOK_EVENT_TYPES.join(', ')}`,
        {},
        400
      )
    }

    if (!/^https?:\/\//i.test(targetUrl)) {
      return sendError(res, 'VALIDATION_ERROR', 'targetUrl must be a valid HTTP(S) URL', {}, 400)
    }

    const webhook = await createNotificationWebhook({
      organizationId: req.user.organizationId,
      eventType,
      targetUrl,
      secret,
      isActive: isActive === undefined ? true : Boolean(isActive),
      actorUserId: req.user.id,
    })

    return sendSuccess(res, webhook, {}, 201)
  } catch (_error) {
    return sendError(res, 'SERVER_ERROR', 'Failed to create webhook configuration', {}, 500)
  }
}

export const updateWebhookConfiguration = async (req, res) => {
  try {
    if (!canManageWebhooks(req.user?.role)) {
      return sendError(res, 'FORBIDDEN', 'Only managers or HR can manage webhooks', {}, 403)
    }

    const eventType =
      req.body?.eventType !== undefined ? String(req.body.eventType || '').trim() : undefined
    const targetUrl = req.body?.targetUrl !== undefined ? String(req.body.targetUrl || '').trim() : undefined
    const secret = req.body?.secret !== undefined ? String(req.body.secret) : undefined
    const isActive = req.body?.isActive

    if (eventType !== undefined && !WEBHOOK_EVENT_TYPES.includes(eventType)) {
      return sendError(
        res,
        'VALIDATION_ERROR',
        `eventType must be one of: ${WEBHOOK_EVENT_TYPES.join(', ')}`,
        {},
        400
      )
    }

    if (targetUrl !== undefined && !/^https?:\/\//i.test(targetUrl)) {
      return sendError(res, 'VALIDATION_ERROR', 'targetUrl must be a valid HTTP(S) URL', {}, 400)
    }

    const webhook = await updateNotificationWebhook({
      organizationId: req.user.organizationId,
      webhookId: Number(req.params.id),
      eventType,
      targetUrl,
      secret,
      isActive,
      actorUserId: req.user.id,
    })

    if (!webhook) {
      return sendError(res, 'NOT_FOUND', 'Webhook configuration not found', {}, 404)
    }

    return sendSuccess(res, webhook)
  } catch (_error) {
    return sendError(res, 'SERVER_ERROR', 'Failed to update webhook configuration', {}, 500)
  }
}

export const getWebhookDeliveryLogs = async (req, res) => {
  try {
    if (!canManageWebhooks(req.user?.role)) {
      return sendError(res, 'FORBIDDEN', 'Only managers or HR can view webhook deliveries', {}, 403)
    }

    const { page, limit, offset } = req.pagination || { page: 1, limit: 20, offset: 0 }

    const result = await listWebhookDeliveries({
      organizationId: req.user.organizationId,
      eventType: req.query?.eventType ? String(req.query.eventType) : undefined,
      webhookId: req.query?.webhookId ? Number(req.query.webhookId) : undefined,
      status: req.query?.status ? String(req.query.status).toLowerCase() : undefined,
      limit,
      offset,
    })

    return sendPaginated(res, result.rows, page, limit, result.total)
  } catch (_error) {
    return sendError(res, 'SERVER_ERROR', 'Failed to fetch webhook deliveries', {}, 500)
  }
}
