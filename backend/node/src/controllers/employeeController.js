import { pool } from '../config/db.js'
import { sendError, sendPaginated, sendSuccess } from '../utils/response.js'

const ML_API_BASE_URL = process.env.ML_API_URL || 'http://localhost:8001'

const employeeSelect = `
  SELECT
    e.id,
    e.organization_id AS "organizationId",
    e.user_id AS "userId",
    e.employee_code AS "employeeId",
    COALESCE(e.name, u.name) AS name,
    e.department,
    e.designation,
    COALESCE(e.role, e.designation, 'employee') AS role,
    COALESCE(e.skills, '[]'::jsonb) AS skills,
    e.joining_date AS "joiningDate",
    e.manager_id AS "managerId",
    COALESCE(manager.name, '—') AS manager,
    e.location,
    e.status,
    COALESCE(e.email, u.email) AS email,
    e.phone,
    e.attendance,
    e.productivity,
    COALESCE(fp.enrollment_status, 'not_enrolled') AS "faceEnrollmentStatus",
    COALESCE(fp.verification_confidence, 0) AS "faceEnrollmentConfidence"
  FROM employees e
  LEFT JOIN users u ON u.id = e.user_id
  LEFT JOIN employees manager ON manager.id = e.manager_id
  LEFT JOIN employee_face_profiles fp
    ON fp.organization_id = e.organization_id
   AND fp.employee_id = e.id
`

const normalizeEmployee = (row) => ({
  ...row,
  skills: Array.isArray(row.skills) ? row.skills : [],
  joiningDate: row.joiningDate ? new Date(row.joiningDate).toISOString().slice(0, 10) : null,
  location: row.location || 'CHARUSAT University, Changa, Gujarat',
  status: row.status || 'Active',
  phone: row.phone || '—',
  attendance: row.attendance || '—',
  productivity: Number(row.productivity || 0),
  faceEnrollmentStatus: row.faceEnrollmentStatus || 'not_enrolled',
  faceEnrollmentConfidence: Number(row.faceEnrollmentConfidence || 0),
})

const enrollFaceProfile = async ({ organizationId, employeeId, faceEnrollment, client }) => {
  if (!faceEnrollment?.enabled) {
    return
  }

  const embeddingDistance = Number(faceEnrollment.embeddingDistance)
  const livenessScore = Number(faceEnrollment.livenessScore)

  if (Number.isNaN(embeddingDistance) || Number.isNaN(livenessScore)) {
    throw new Error('Face enrollment requires numeric embeddingDistance and livenessScore')
  }

  let enrollment
  try {
    const response = await fetch(`${ML_API_BASE_URL}/ml/face-enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employee_id: employeeId,
        embedding_distance: embeddingDistance,
        liveness_score: livenessScore,
      }),
    })

    const payload = await response.json().catch(() => ({}))
    if (!response.ok || !payload?.data) {
      throw new Error(payload?.message || payload?.error?.message || 'Face enrollment verification failed')
    }

    enrollment = payload.data
  } catch (_error) {
    const isLive = livenessScore >= 0.7
    const enrolled = isLive && embeddingDistance <= 0.5
    enrollment = {
      employee_id: employeeId,
      status: enrolled ? 'enrolled' : 'pending',
      confidence: Math.max(0, Math.min(1, 1 - embeddingDistance)),
      is_live: isLive,
      enrolled,
    }
  }

  await client.query(
    `
      INSERT INTO employee_face_profiles (
        organization_id,
        employee_id,
        enrollment_status,
        embedding_distance,
        liveness_score,
        verification_confidence,
        enrolled_at,
        last_verified_at,
        metadata,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $7::jsonb, CURRENT_TIMESTAMP)
      ON CONFLICT (organization_id, employee_id)
      DO UPDATE SET
        enrollment_status = EXCLUDED.enrollment_status,
        embedding_distance = EXCLUDED.embedding_distance,
        liveness_score = EXCLUDED.liveness_score,
        verification_confidence = EXCLUDED.verification_confidence,
        last_verified_at = CURRENT_TIMESTAMP,
        metadata = EXCLUDED.metadata,
        updated_at = CURRENT_TIMESTAMP
    `,
    [
      organizationId,
      employeeId,
      enrollment.status,
      embeddingDistance,
      livenessScore,
      Number(enrollment.confidence || 0),
      JSON.stringify({
        enrollmentSource: 'employee_create',
        enrolled: Boolean(enrollment.enrolled),
        isLive: Boolean(enrollment.is_live),
      }),
    ]
  )
}

const resolveManagerId = async (organizationId, managerId, managerName) => {
  if (managerId) {
    return Number(managerId)
  }

  if (!managerName || managerName === '—') {
    return null
  }

  const { rows } = await pool.query(
    `
      SELECT id
      FROM employees
      WHERE organization_id = $1
        AND LOWER(name) = LOWER($2)
      LIMIT 1
    `,
    [organizationId, managerName]
  )

  return rows[0]?.id || null
}

export const getEmployees = async (req, res) => {
  try {
    const role = req.user?.role
    const params = [req.user.organizationId]
    const countParams = [req.user.organizationId]
    const { page, limit, offset } = req.pagination || { page: 1, limit: 20, offset: 0 }
    let query = `${employeeSelect} WHERE e.organization_id = $1 ORDER BY e.id ASC LIMIT $2 OFFSET $3`
    let countQuery = 'SELECT COUNT(*)::int AS total FROM employees e WHERE e.organization_id = $1'

    if (role === 'employee') {
      params.push(req.user.id)
      params.push(limit)
      params.push(offset)
      countParams.push(req.user.id)
      query = `
        ${employeeSelect}
        WHERE e.organization_id = $1
          AND e.user_id = $2
        ORDER BY e.id ASC
        LIMIT $3 OFFSET $4
      `
      countQuery = `
        SELECT COUNT(*)::int AS total
        FROM employees e
        WHERE e.organization_id = $1
          AND e.user_id = $2
      `
    } else if (role === 'department_manager' || req.query.view === 'team') {
      params.push(req.user.id)
      params.push(limit)
      params.push(offset)
      countParams.push(req.user.id)
      query = `
        ${employeeSelect}
        WHERE e.organization_id = $1
          AND e.manager_id = (
            SELECT id
            FROM employees
            WHERE organization_id = $1 AND user_id = $2
            LIMIT 1
          )
        ORDER BY e.id ASC
        LIMIT $3 OFFSET $4
      `
      countQuery = `
        SELECT COUNT(*)::int AS total
        FROM employees e
        WHERE e.organization_id = $1
          AND e.manager_id = (
            SELECT id
            FROM employees
            WHERE organization_id = $1 AND user_id = $2
            LIMIT 1
          )
      `
    } else {
      params.push(limit)
      params.push(offset)
    }

    const { rows } = await pool.query(query, params)
    const countResult = await pool.query(countQuery, countParams)
    const total = countResult.rows[0]?.total || 0
    return sendPaginated(res, rows.map(normalizeEmployee), page, limit, total)
  } catch (_error) {
    return sendError(res, 'SERVER_ERROR', 'Failed to fetch employees', {}, 500)
  }
}

export const createEmployee = async (req, res) => {
  const employee = {
    employeeId: req.body.employeeId,
    organizationId: req.user.organizationId,
    name: req.body.name,
    department: req.body.department || 'General',
    designation: req.body.designation || req.body.role || 'Employee',
    role: req.body.role || 'employee',
    skills: Array.isArray(req.body.skills) ? req.body.skills : [],
    joiningDate: req.body.joiningDate || new Date().toISOString().slice(0, 10),
    managerId: req.body.managerId || null,
    manager: req.body.manager || '—',
    location: req.body.location || 'CHARUSAT University, Changa, Gujarat',
    status: req.body.status || 'Active',
    email: req.body.email,
    phone: req.body.phone || '—',
    attendance: req.body.attendance || '—',
    productivity: Number(req.body.productivity || 0),
  }

  if (!employee.name || !employee.email) {
    return sendError(res, 'VALIDATION_ERROR', 'name and email are required', {}, 400)
  }

  try {
    const { rows: existingRows } = await pool.query(
      'SELECT id FROM employees WHERE organization_id = $1 AND LOWER(email) = LOWER($2) LIMIT 1',
      [req.user.organizationId, employee.email]
    )

    if (existingRows[0]) {
      return sendError(res, 'CONFLICT', 'Employee with this email already exists', {}, 409)
    }

    const managerId = await resolveManagerId(req.user.organizationId, employee.managerId, employee.manager)
    const client = await pool.connect()

    let createdEmployeeId
    try {
      await client.query('BEGIN')
      const { rows } = await client.query(
        `
          INSERT INTO employees (
            organization_id,
            employee_code,
            name,
            email,
            department,
            designation,
            role,
            skills,
            joining_date,
            manager_id,
            location,
            status,
            phone,
            attendance,
            productivity
          )
          VALUES ($1, COALESCE($2, CONCAT('EMP-', 2000 + nextval('employees_id_seq'))), $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11, $12, $13, $14, $15)
          RETURNING id
        `,
        [
          req.user.organizationId,
          employee.employeeId || null,
          employee.name,
          employee.email,
          employee.department,
          employee.designation,
          employee.role,
          JSON.stringify(employee.skills),
          employee.joiningDate,
          managerId,
          employee.location,
          employee.status,
          employee.phone,
          employee.attendance,
          employee.productivity,
        ]
      )

      createdEmployeeId = rows[0].id

      await enrollFaceProfile({
        organizationId: req.user.organizationId,
        employeeId: createdEmployeeId,
        faceEnrollment: req.body.faceEnrollment,
        client,
      })

      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }

    const created = await pool.query(`${employeeSelect} WHERE e.id = $1`, [createdEmployeeId])
    return sendSuccess(res, normalizeEmployee(created.rows[0]), {}, 201)
  } catch (error) {
    return sendError(res, 'SERVER_ERROR', error.message || 'Failed to create employee', {}, 500)
  }
}

export const getEmployeeById = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `${employeeSelect} WHERE e.id = $1 AND e.organization_id = $2 LIMIT 1`,
      [Number(req.params.id), req.user.organizationId]
    )
    if (!rows[0]) return sendError(res, 'NOT_FOUND', 'Employee not found', {}, 404)
    return sendSuccess(res, normalizeEmployee(rows[0]))
  } catch (_error) {
    return sendError(res, 'SERVER_ERROR', 'Failed to fetch employee', {}, 500)
  }
}

export const updateEmployee = async (req, res) => {
  try {
    const updates = []
    const values = []
    const fieldMap = {
      employeeId: 'employee_code',
      name: 'name',
      email: 'email',
      department: 'department',
      designation: 'designation',
      role: 'role',
      joiningDate: 'joining_date',
      location: 'location',
      status: 'status',
      phone: 'phone',
      attendance: 'attendance',
      productivity: 'productivity',
    }

    Object.entries(fieldMap).forEach(([key, column]) => {
      if (req.body[key] !== undefined) {
        values.push(req.body[key])
        updates.push(`${column} = $${values.length}`)
      }
    })

    if (req.body.skills !== undefined) {
      values.push(JSON.stringify(Array.isArray(req.body.skills) ? req.body.skills : []))
      updates.push(`skills = $${values.length}::jsonb`)
    }

    if (req.body.managerId !== undefined || req.body.manager !== undefined) {
      const managerId = await resolveManagerId(
        req.user.organizationId,
        req.body.managerId,
        req.body.manager
      )
      values.push(managerId)
      updates.push(`manager_id = $${values.length}`)
    }

    if (updates.length === 0) {
      return sendError(res, 'VALIDATION_ERROR', 'No valid fields provided for update', {}, 400)
    }

    values.push(Number(req.params.id))
    values.push(req.user.organizationId)

    const result = await pool.query(
      `
        UPDATE employees
        SET ${updates.join(', ')}
        WHERE id = $${values.length - 1} AND organization_id = $${values.length}
        RETURNING id
      `,
      values
    )

    if (!result.rows[0]) return sendError(res, 'NOT_FOUND', 'Employee not found', {}, 404)

    const updated = await pool.query(`${employeeSelect} WHERE e.id = $1`, [result.rows[0].id])
    return sendSuccess(res, normalizeEmployee(updated.rows[0]))
  } catch (_error) {
    return sendError(res, 'SERVER_ERROR', 'Failed to update employee', {}, 500)
  }
}

export const deleteEmployee = async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM employees WHERE id = $1 AND organization_id = $2 RETURNING id',
      [Number(req.params.id), req.user.organizationId]
    )
    if (!result.rows[0]) return sendError(res, 'NOT_FOUND', 'Employee not found', {}, 404)
    return sendSuccess(res, { message: 'Employee deleted' })
  } catch (_error) {
    return sendError(res, 'SERVER_ERROR', 'Failed to delete employee', {}, 500)
  }
}
