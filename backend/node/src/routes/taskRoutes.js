import { Router } from 'express'
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
router.get('/', getTasks)

/**
 * @openapi
 * /tasks:
 *   post:
 *     tags: [Tasks]
 *     summary: Create a task
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string }
 *               priority: { type: string }
 *               assignee: { type: string }
 *               dueDate: { type: string, format: date }
 *     responses:
 *       201: { description: Task created }
 */
router.post('/', requirePermission(PERMISSIONS.ASSIGN_TASK), validateRequest(createTaskSchema), createTask)

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
router.put('/:id', requirePermission(PERMISSIONS.ASSIGN_TASK), validateRequest(updateTaskSchema), updateTask)

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
router.delete('/:id', requirePermission(PERMISSIONS.ASSIGN_TASK), deleteTask)

export default router
