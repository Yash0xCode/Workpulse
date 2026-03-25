import { pool } from '../config/db.js'
import {
  buildLeaveDecisionEmail,
  buildLeavePendingApprovalEmail,
} from './emailTemplateService.js'

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
