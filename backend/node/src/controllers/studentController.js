import { pool } from '../config/db.js'
import { sendError, sendPaginated, sendSuccess } from '../utils/response.js'

const studentSelect = `
  SELECT
    s.id,
    s.organization_id AS "organizationId",
    s.user_id         AS "userId",
    s.roll_no         AS "rollNo",
    s.name,
    s.email,
    s.course,
    s.semester,
    s.cgpa,
    s.attendance_percent AS "attendancePercent",
    s.created_at         AS "createdAt"
  FROM students s
`

export const getStudents = async (req, res) => {
  try {
    const { page = 1, limit = 20, offset = 0 } = req.pagination || {}

    const filters = ['s.organization_id = $1']
    const params = [req.user.organizationId]

    if (req.query.course) {
      params.push(String(req.query.course))
      filters.push(`s.course = $${params.length}`)
    }
    if (req.query.semester) {
      params.push(Number(req.query.semester))
      filters.push(`s.semester = $${params.length}`)
    }

    params.push(limit, offset)

    const { rows } = await pool.query(
      `${studentSelect}
       WHERE ${filters.join(' AND ')}
       ORDER BY s.name ASC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    )

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM students s WHERE ${filters.slice(0, -0).join(' AND ')}`,
      params.slice(0, -2)
    )

    return sendPaginated(res, rows, page, limit, countResult.rows[0]?.total || 0)
  } catch (_error) {
    return sendError(res, 'SERVER_ERROR', 'Failed to fetch students', {}, 500)
  }
}

export const getStudentById = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `${studentSelect} WHERE s.id = $1 AND s.organization_id = $2 LIMIT 1`,
      [Number(req.params.id), req.user.organizationId]
    )
    if (!rows[0]) return sendError(res, 'NOT_FOUND', 'Student not found', {}, 404)
    return sendSuccess(res, rows[0])
  } catch (_error) {
    return sendError(res, 'SERVER_ERROR', 'Failed to fetch student', {}, 500)
  }
}

export const createStudent = async (req, res) => {
  try {
    const { name, email, rollNo, course, semester, cgpa, attendancePercent, userId } = req.body

    if (!name) return sendError(res, 'VALIDATION_ERROR', 'name is required', {}, 400)

    const { rows } = await pool.query(
      `INSERT INTO students
         (organization_id, user_id, name, email, roll_no, course, semester, cgpa, attendance_percent)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id`,
      [
        req.user.organizationId,
        userId || null,
        name,
        email || null,
        rollNo || null,
        course || null,
        semester ? Number(semester) : null,
        cgpa ? Number(cgpa) : null,
        attendancePercent ? Number(attendancePercent) : null,
      ]
    )

    const created = await pool.query(
      `${studentSelect} WHERE s.id = $1`,
      [rows[0].id]
    )

    return sendSuccess(res, created.rows[0], {}, 201)
  } catch (_error) {
    return sendError(res, 'SERVER_ERROR', 'Failed to create student', {}, 500)
  }
}

export const updateStudent = async (req, res) => {
  try {
    const updates = []
    const values = []
    const fieldMap = {
      name: 'name',
      email: 'email',
      rollNo: 'roll_no',
      course: 'course',
      semester: 'semester',
      cgpa: 'cgpa',
      attendancePercent: 'attendance_percent',
    }

    Object.entries(fieldMap).forEach(([key, col]) => {
      if (req.body[key] !== undefined) {
        values.push(req.body[key])
        updates.push(`${col} = $${values.length}`)
      }
    })

    if (updates.length === 0) {
      return sendError(res, 'VALIDATION_ERROR', 'No valid fields provided', {}, 400)
    }

    values.push(Number(req.params.id), req.user.organizationId)

    const result = await pool.query(
      `UPDATE students
       SET ${updates.join(', ')}
       WHERE id = $${values.length - 1} AND organization_id = $${values.length}
       RETURNING id`,
      values
    )

    if (!result.rows[0]) return sendError(res, 'NOT_FOUND', 'Student not found', {}, 404)

    const updated = await pool.query(`${studentSelect} WHERE s.id = $1`, [result.rows[0].id])
    return sendSuccess(res, updated.rows[0])
  } catch (_error) {
    return sendError(res, 'SERVER_ERROR', 'Failed to update student', {}, 500)
  }
}
