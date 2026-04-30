import { Router } from 'express'
import { createStudent, getStudentById, getStudents, updateStudent } from '../controllers/studentController.js'

const router = Router()

router.get('/', getStudents)
router.post('/', createStudent)
router.get('/:id', getStudentById)
router.put('/:id', updateStudent)

export default router
