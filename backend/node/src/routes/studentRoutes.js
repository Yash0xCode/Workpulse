import { Router } from 'express'
import { createStudent, getStudentById, getStudents } from '../controllers/studentController.js'

const router = Router()

router.get('/', getStudents)
router.post('/', createStudent)
router.get('/:id', getStudentById)

export default router
