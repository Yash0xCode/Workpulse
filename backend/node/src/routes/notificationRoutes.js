import { Router } from 'express'
import {
  createWebhookConfiguration,
  getNotificationWebhooks,
  getNotifications,
  getUnreadNotificationCount,
  getWebhookDeliveryLogs,
  markAllNotificationsRead,
  markNotificationRead,
  updateWebhookConfiguration,
} from '../controllers/notificationController.js'

const router = Router()

router.get('/', getNotifications)
router.get('/unread-count', getUnreadNotificationCount)
router.get('/webhooks', getNotificationWebhooks)
router.post('/webhooks', createWebhookConfiguration)
router.put('/webhooks/:id', updateWebhookConfiguration)
router.get('/webhook-deliveries', getWebhookDeliveryLogs)
router.put('/read-all', markAllNotificationsRead)
router.put('/:id/read', markNotificationRead)

export default router
