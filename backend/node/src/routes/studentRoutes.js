import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { createStudent, getStudentById, getStudents, updateStudent } from '../controllers/studentController.js'

/**
 * @openapi
 * tags:
 *   name: Students
 *   description: Student directory (education organizations)
 */

const router = Router()

const stdLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TOO_MANY_REQUESTS', message: 'Too many requests, please try again later.' },
})

router.get('/', stdLimiter, getStudents)
router.post('/', stdLimiter, createStudent)
router.get('/:id', stdLimiter, getStudentById)
router.put('/:id', stdLimiter, updateStudent)

export default router
