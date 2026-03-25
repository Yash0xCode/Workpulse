const students = []

export const getStudents = async (_req, res) => {
  return res.json({ data: students })
}

export const createStudent = async (req, res) => {
  const student = { id: students.length + 1, ...req.body }
  students.push(student)
  return res.status(201).json({ data: student })
}

export const getStudentById = async (req, res) => {
  const student = students.find((item) => item.id === Number(req.params.id))
  if (!student) return res.status(404).json({ message: 'Student not found' })
  return res.json({ data: student })
}
