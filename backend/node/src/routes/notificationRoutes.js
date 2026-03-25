import { Router } from 'express'
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '../controllers/notificationController.js'

const router = Router()

router.get('/', getNotifications)
router.get('/unread-count', getUnreadNotificationCount)
router.put('/read-all', markAllNotificationsRead)
router.put('/:id/read', markNotificationRead)

export default router
