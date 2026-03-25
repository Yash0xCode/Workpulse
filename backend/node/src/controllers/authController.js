import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { ROLE_PERMISSIONS } from '../config/rbac.js'
import { pool } from '../config/db.js'
import { sendError, sendSuccess } from '../utils/response.js'

const tokenFor = (user) =>
  jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationType: user.organizationType,
      organizationId: user.organizationId,
      fullName: user.fullName,
    },
    process.env.JWT_SECRET || 'workpulse-secret',
    { expiresIn: '8h' }
  )

const normalizeUser = (row) => ({
  id: row.id,
  email: row.email,
  role: row.role,
  organizationType: row.organizationType,
  organizationId: row.organizationId,
  fullName: row.fullName,
})

const findUserByEmail = async (email) => {
  const { rows } = await pool.query(
    `
      SELECT
        u.id,
        u.email,
        u.password_hash AS "passwordHash",
        u.organization_id AS "organizationId",
        u.name AS "fullName",
        COALESCE(r.name, 'employee') AS role,
        o.type AS "organizationType"
      FROM users u
      LEFT JOIN roles r ON r.id = u.role_id
      LEFT JOIN organizations o ON o.id = u.organization_id
      WHERE LOWER(u.email) = LOWER($1)
        AND COALESCE(u.is_active, TRUE) = TRUE
      LIMIT 1
    `,
    [email]
  )

  return rows[0] || null
}

export const signup = async (req, res) => {
  const { organizationName, organizationType, email, password, adminName } = req.body

  if (!organizationName || !organizationType || !email || !password || !adminName) {
    return sendError(
      res,
      'VALIDATION_ERROR',
      'organizationName, organizationType, email, password, and adminName are required',
      {},
      400
    )
  }

  try {
    const existingUser = await findUserByEmail(email)
    if (existingUser) {
      return sendError(res, 'CONFLICT', 'User already exists', {}, 409)
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const roleName = organizationType === 'education' ? 'institute_admin' : 'super_admin'
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      const organizationResult = await client.query(
        `
          INSERT INTO organizations (name, type, location, email, admin_name)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, name, type, location, created_at AS "createdAt"
        `,
        [organizationName, organizationType, 'CHARUSAT University, Changa, Gujarat', email, adminName]
      )

      const organization = organizationResult.rows[0]

      const roleResult = await client.query('SELECT id FROM roles WHERE name = $1 LIMIT 1', [roleName])
      if (!roleResult.rows[0]) {
        throw new Error(`Role not found: ${roleName}`)
      }

      const userResult = await client.query(
        `
          INSERT INTO users (organization_id, role_id, name, email, password_hash)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, email, name AS "fullName", organization_id AS "organizationId"
        `,
        [organization.id, roleResult.rows[0].id, adminName, email, passwordHash]
      )

      await client.query('COMMIT')

      const user = {
        ...userResult.rows[0],
        role: roleName,
        organizationType,
      }

      const token = tokenFor(user)

      return sendSuccess(
        res,
        {
          message: 'Organization created successfully',
          token,
          user: normalizeUser(user),
          organization,
        },
        {},
        201
      )
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    return sendError(res, 'SERVER_ERROR', error.message || 'Failed to create organization', {}, 500)
  }
}

export const login = async (req, res) => {
  const { email, password } = req.body

  try {
    if (!email || !password) {
      return sendError(res, 'VALIDATION_ERROR', 'email and password are required', {}, 400)
    }

    const user = await findUserByEmail(email)

    if (!user) {
      return sendError(res, 'UNAUTHORIZED', 'Invalid credentials', {}, 401)
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash)
    if (!isMatch) {
      return sendError(res, 'UNAUTHORIZED', 'Invalid credentials', {}, 401)
    }

    const token = tokenFor(user)

    return sendSuccess(res, {
      token,
      user: normalizeUser(user),
    })
  } catch (_error) {
    return sendError(res, 'SERVER_ERROR', 'Login failed', {}, 500)
  }
}

export const me = async (req, res) => {
  return sendSuccess(res, {
    user: req.user,
    permissions: ROLE_PERMISSIONS[req.user?.role] || [],
  })
}
