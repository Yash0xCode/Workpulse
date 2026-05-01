import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { PERMISSIONS } from '../config/rbac.js'
import { createTask, deleteTask, getTasks, updateTask } from '../controllers/taskController.js'
import { requirePermission } from '../middleware/permissionMiddleware.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { createTaskSchema, updateTaskSchema } from '../validators/taskValidators.js'

/**
 * @openapi
 * tags:
 *   name: Tasks
 *   description: Task management (kanban board)
 */

const router = Router()

const taskLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TOO_MANY_REQUESTS', message: 'Too many requests, please try again later.' },
})

/**
 * @openapi
 * /tasks:
 *   get:
 *     tags: [Tasks]
 *     summary: List tasks for the organization
 *     parameters:
 *       - in: query
 *         name: view
 *         schema: { type: string, enum: [team] }
 *     responses:
 *       200: { description: Task list }
 */
router.get('/', taskLimiter, getTasks)

/**
 * @openapi
 * /tasks:
 *   post:
 *     tags: [Tasks]
 *     summary: Create a task
 *     responses:
 *       201: { description: Task created }
 */
router.post('/', taskLimiter, requirePermission(PERMISSIONS.ASSIGN_TASK), validateRequest(createTaskSchema), createTask)

/**
 * @openapi
 * /tasks/{id}:
 *   put:
 *     tags: [Tasks]
 *     summary: Update a task
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Updated task }
 */
router.put('/:id', taskLimiter, requirePermission(PERMISSIONS.ASSIGN_TASK), validateRequest(updateTaskSchema), updateTask)

/**
 * @openapi
 * /tasks/{id}:
 *   delete:
 *     tags: [Tasks]
 *     summary: Delete a task
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Task deleted }
 */
router.delete('/:id', taskLimiter, requirePermission(PERMISSIONS.ASSIGN_TASK), deleteTask)

export default router
