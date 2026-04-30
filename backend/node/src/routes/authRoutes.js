import { Router } from 'express'
import { login, me, signup } from '../controllers/authController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { loginSchema, signupSchema } from '../validators/authValidators.js'

/**
 * @openapi
 * tags:
 *   name: Auth
 *   description: Authentication — signup, login, get current user
 */

const router = Router()

/**
 * @openapi
 * /auth/signup:
 *   post:
 *     tags: [Auth]
 *     security: []
 *     summary: Create a new account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 6 }
 *               organizationName: { type: string }
 *               organizationType: { type: string, enum: [corporate, education] }
 *     responses:
 *       201: { description: Account created, JWT returned }
 *       400: { description: Validation error }
 */
router.post('/signup', validateRequest(signupSchema), signup)

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     security: []
 *     summary: Login with email + password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200: { description: JWT token }
 *       401: { description: Invalid credentials }
 */
router.post('/login', validateRequest(loginSchema), login)

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current authenticated user
 *     responses:
 *       200: { description: Current user profile }
 *       401: { description: Not authenticated }
 */
router.get('/me', authMiddleware, me)

export default router
