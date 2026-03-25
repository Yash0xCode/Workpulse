import crypto from 'crypto'
import { pool } from '../config/db.js'
import {
  buildLeaveDecisionEmail,
  buildLeavePendingApprovalEmail,
} from './emailTemplateService.js'

export const WEBHOOK_EVENT_TYPES = ['leave_pending_approval', 'leave_decision']

let webhookInfrastructureReady = false

const ensureWebhookInfrastructure = async () => {
  if (webhookInfrastructureReady) return

  await pool.query(
    `
      CREATE TABLE IF NOT EXISTS notification_webhooks (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        event_type VARCHAR(80) NOT NULL,
        target_url TEXT NOT NULL,
        secret TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (organization_id, event_type, target_url)
      )
    `
  )

  await pool.query(
    `
      CREATE TABLE IF NOT EXISTS notification_webhook_deliveries (
        id SERIAL PRIMARY KEY,
        webhook_id INTEGER REFERENCES notification_webhooks(id) ON DELETE SET NULL,
        organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        event_type VARCHAR(80) NOT NULL,
        resource_type VARCHAR(80),
        resource_id INTEGER,
        payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        http_status INTEGER,
        response_body TEXT,
        error_message TEXT,
        attempt_no INTEGER NOT NULL DEFAULT 1,
        delivered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
  )

  await pool.query(
    `
      CREATE INDEX IF NOT EXISTS idx_notification_webhooks_org_event
        ON notification_webhooks(organization_id, event_type, is_active)
    `
  )
  await pool.query(
    `
      CREATE INDEX IF NOT EXISTS idx_notification_webhook_deliveries_org
        ON notification_webhook_deliveries(organization_id, delivered_at DESC)
    `
  )

  webhookInfrastructureReady = true
}

export const listNotificationWebhooks = async ({ organizationId }) => {
  await ensureWebhookInfrastructure()

  const { rows } = await pool.query(
    `
      SELECT
        id,
        organization_id AS "organizationId",
        event_type AS "eventType",
        target_url AS "targetUrl",
        secret IS NOT NULL AND LENGTH(secret) > 0 AS "hasSecret",
        is_active AS "isActive",
        created_by AS "createdBy",
        updated_by AS "updatedBy",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM notification_webhooks
      WHERE organization_id = $1
      ORDER BY created_at DESC
    `,
    [organizationId]
  )

  return rows
}

export const createNotificationWebhook = async ({
  organizationId,
  eventType,
  targetUrl,
  secret,
  isActive = true,
  actorUserId,
}) => {
  await ensureWebhookInfrastructure()

  const { rows } = await pool.query(
    `
      INSERT INTO notification_webhooks (
        organization_id,
        event_type,
        target_url,
        secret,
        is_active,
        created_by,
        updated_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $6)
      RETURNING
        id,
        organization_id AS "organizationId",
        event_type AS "eventType",
        target_url AS "targetUrl",
        secret IS NOT NULL AND LENGTH(secret) > 0 AS "hasSecret",
        is_active AS "isActive",
        created_by AS "createdBy",
        updated_by AS "updatedBy",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `,
    [organizationId, eventType, targetUrl, secret || null, Boolean(isActive), actorUserId || null]
  )

  return rows[0]
}

export const updateNotificationWebhook = async ({
  organizationId,
  webhookId,
  eventType,
  targetUrl,
  secret,
  isActive,
  actorUserId,
}) => {
  await ensureWebhookInfrastructure()

  const current = await pool.query(
    `
      SELECT id, event_type AS "eventType", target_url AS "targetUrl", secret, is_active AS "isActive"
      FROM notification_webhooks
      WHERE id = $1 AND organization_id = $2
      LIMIT 1
    `,
    [Number(webhookId), organizationId]
  )

  if (!current.rows[0]) return null

  const existing = current.rows[0]
  const nextEventType = eventType || existing.eventType
  const nextTargetUrl = targetUrl || existing.targetUrl
  const nextSecret = secret !== undefined ? secret : existing.secret
  const nextIsActive = isActive === undefined ? existing.isActive : Boolean(isActive)

  const { rows } = await pool.query(
    `
      UPDATE notification_webhooks
      SET
        event_type = $3,
        target_url = $4,
        secret = $5,
        is_active = $6,
        updated_by = $7,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND organization_id = $2
      RETURNING
        id,
        organization_id AS "organizationId",
        event_type AS "eventType",
        target_url AS "targetUrl",
        secret IS NOT NULL AND LENGTH(secret) > 0 AS "hasSecret",
        is_active AS "isActive",
        created_by AS "createdBy",
        updated_by AS "updatedBy",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `,
    [Number(webhookId), organizationId, nextEventType, nextTargetUrl, nextSecret, nextIsActive, actorUserId || null]
  )

  return rows[0] || null
}

export const listWebhookDeliveries = async ({
  organizationId,
  eventType,
  webhookId,
  status,
  limit = 20,
  offset = 0,
}) => {
  await ensureWebhookInfrastructure()

  const where = ['d.organization_id = $1']
  const params = [organizationId]

  if (eventType) {
    params.push(eventType)
    where.push(`d.event_type = $${params.length}`)
  }
  if (webhookId) {
    params.push(Number(webhookId))
    where.push(`d.webhook_id = $${params.length}`)
  }
  if (status === 'success') {
    where.push('d.http_status BETWEEN 200 AND 299')
  }
  if (status === 'failed') {
    where.push('(d.http_status IS NULL OR d.http_status NOT BETWEEN 200 AND 299)')
  }

  params.push(limit)
  const limitIndex = params.length
  params.push(offset)
  const offsetIndex = params.length

  const list = await pool.query(
    `
      SELECT
        d.id,
        d.webhook_id AS "webhookId",
        d.organization_id AS "organizationId",
        d.event_type AS "eventType",
        d.resource_type AS "resourceType",
        d.resource_id AS "resourceId",
        d.payload,
        d.http_status AS "httpStatus",
        d.response_body AS "responseBody",
        d.error_message AS "errorMessage",
        d.attempt_no AS "attemptNo",
        d.delivered_at AS "deliveredAt",
        w.target_url AS "targetUrl"
      FROM notification_webhook_deliveries d
      LEFT JOIN notification_webhooks w ON w.id = d.webhook_id
      WHERE ${where.join(' AND ')}
      ORDER BY d.delivered_at DESC
      LIMIT $${limitIndex} OFFSET $${offsetIndex}
    `,
    params
  )

  const count = await pool.query(
    `
      SELECT COUNT(*)::int AS total
      FROM notification_webhook_deliveries d
      WHERE ${where.join(' AND ')}
    `,
    params.slice(0, params.length - 2)
  )

  return {
    rows: list.rows,
    total: count.rows[0]?.total || 0,
  }
}

export const sendWebhookNotification = async ({
  organizationId,
  eventType,
  payload,
  resourceType = null,
  resourceId = null,
}) => {
  await ensureWebhookInfrastructure()

  if (!organizationId || !eventType || !WEBHOOK_EVENT_TYPES.includes(eventType)) return

  const { rows: webhooks } = await pool.query(
    `
      SELECT id, target_url AS "targetUrl", secret
      FROM notification_webhooks
      WHERE organization_id = $1 AND event_type = $2 AND is_active = TRUE
      ORDER BY id ASC
    `,
    [organizationId, eventType]
  )

  if (webhooks.length === 0) return

  const envelope = {
    eventType,
    occurredAt: new Date().toISOString(),
    data: payload || {},
  }

  await Promise.all(
    webhooks.map(async (webhook) => {
      const payloadText = JSON.stringify(envelope)
      const signature = webhook.secret
        ? `sha256=${crypto.createHmac('sha256', webhook.secret).update(payloadText).digest('hex')}`
        : ''

      try {
        const response = await fetch(webhook.targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-WorkPulse-Event': eventType,
            ...(signature ? { 'X-WorkPulse-Signature': signature } : {}),
          },
          body: payloadText,
          signal: AbortSignal.timeout(8000),
        })

        const responseText = (await response.text()).slice(0, 2000)
        await pool.query(
          `
            INSERT INTO notification_webhook_deliveries (
              webhook_id,
              organization_id,
              event_type,
              resource_type,
              resource_id,
              payload,
              http_status,
              response_body,
              error_message,
              attempt_no
            )
            VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, NULL, 1)
          `,
          [
            webhook.id,
            organizationId,
            eventType,
            resourceType,
            resourceId,
            payloadText,
            response.status,
            responseText,
          ]
        )
      } catch (error) {
        await pool.query(
          `
            INSERT INTO notification_webhook_deliveries (
              webhook_id,
              organization_id,
              event_type,
              resource_type,
              resource_id,
              payload,
              http_status,
              response_body,
              error_message,
              attempt_no
            )
            VALUES ($1, $2, $3, $4, $5, $6::jsonb, NULL, NULL, $7, 1)
          `,
          [
            webhook.id,
            organizationId,
            eventType,
            resourceType,
            resourceId,
            payloadText,
            String(error?.message || 'Webhook delivery failed').slice(0, 1000),
          ]
        )
      }
    })
  )
}

export const createInAppNotification = async ({
  organizationId,
  userId,
  title,
  message,
  type = 'info',
  resourceType = null,
  resourceId = null,
}) => {
  if (!organizationId || !userId || !title || !message) return

  await pool.query(
    `
      INSERT INTO notifications (
        organization_id,
        user_id,
        title,
        message,
        type,
        resource_type,
        resource_id,
        is_read
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE)
    `,
    [organizationId, userId, title, message, type, resourceType, resourceId]
  )
}

export const sendEmailNotificationStub = async ({
  recipientEmail,
  userId,
  organizationId,
  template,
  context,
  resourceType = null,
  resourceId = null,
}) => {
  if (!recipientEmail || !template || !organizationId || !userId) return

  let compiled = null
  if (template === 'leave_pending_approval') {
    compiled = buildLeavePendingApprovalEmail(context || {})
  } else if (template === 'leave_decision') {
    compiled = buildLeaveDecisionEmail(context || {})
  }

  if (!compiled) return

  console.log(`[EMAIL_STUB] to=${recipientEmail} subject=${compiled.subject}`)

  await createInAppNotification({
    organizationId,
    userId,
    title: `Email queued: ${compiled.subject}`,
    message: `Email stub generated for ${recipientEmail}.`,
    type: 'email_stub',
    resourceType,
    resourceId,
  })
}
