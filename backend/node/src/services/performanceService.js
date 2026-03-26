import { pool } from '../config/db.js'

const GOAL_STATUSES = ['planned', 'in_progress', 'completed', 'deferred']
const REVIEW_STATUSES = ['draft', 'submitted', 'acknowledged']
let performanceInfraReady = false

export const ensurePerformanceInfrastructure = async () => {
  if (performanceInfraReady) return

  await pool.query(`
    CREATE TABLE IF NOT EXISTS performance_goals (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      status VARCHAR(30) NOT NULL DEFAULT 'planned',
      progress NUMERIC(5,2) NOT NULL DEFAULT 0,
      weight NUMERIC(4,2) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS performance_reviews (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      reviewer_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      period_start DATE,
      period_end DATE,
      overall_rating NUMERIC(3,1) DEFAULT 0,
      summary TEXT,
      status VARCHAR(30) NOT NULL DEFAULT 'draft',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS performance_feedback (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      review_id INTEGER NOT NULL REFERENCES performance_reviews(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      comment TEXT NOT NULL,
      sentiment VARCHAR(20),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_performance_goals_org ON performance_goals(organization_id)`)
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_performance_reviews_org ON performance_reviews(organization_id)`)
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_performance_feedback_org ON performance_feedback(organization_id)`)

  performanceInfraReady = true
}

export const listPerformanceGoals = async ({ organizationId, employeeId, status }) => {
  await ensurePerformanceInfrastructure()

  const where = ['organization_id = $1']
  const params = [organizationId]

  if (employeeId) {
    params.push(Number(employeeId))
    where.push(`employee_id = $${params.length}`)
  }
  if (status) {
    params.push(String(status))
    where.push(`status = $${params.length}`)
  }

  const { rows } = await pool.query(
    `
      SELECT
        pg.id,
        pg.organization_id AS "organizationId",
        pg.employee_id AS "employeeId",
        pg.title,
        pg.description,
        pg.status,
        pg.progress,
        pg.weight,
        pg.created_at AS "createdAt",
        pg.updated_at AS "updatedAt",
        e.name AS "employeeName",
        e.department AS "department"
      FROM performance_goals pg
      LEFT JOIN employees e ON e.id = pg.employee_id
      WHERE ${where.join(' AND ')}
      ORDER BY pg.created_at DESC
      LIMIT 200
    `,
    params
  )

  return rows
}

export const createPerformanceGoal = async ({ organizationId, employeeId, title, description, status = 'planned', weight = 1 }) => {
  await ensurePerformanceInfrastructure()

  if (!title) throw new Error('Goal title is required')
  if (!employeeId) throw new Error('Employee is required')
  const normalizedStatus = GOAL_STATUSES.includes(String(status)) ? status : 'planned'

  const { rows } = await pool.query(
    `
      INSERT INTO performance_goals (
        organization_id,
        employee_id,
        title,
        description,
        status,
        weight
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING
        id,
        organization_id AS "organizationId",
        employee_id AS "employeeId",
        title,
        description,
        status,
        progress,
        weight,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `,
    [organizationId, Number(employeeId), title, description || null, normalizedStatus, Number(weight || 1)]
  )

  return rows[0]
}

export const updatePerformanceGoal = async ({ organizationId, goalId, status, progress }) => {
  await ensurePerformanceInfrastructure()

  const updates = []
  const params = []

  if (status) {
    if (!GOAL_STATUSES.includes(String(status))) throw new Error('Invalid goal status')
    params.push(status)
    updates.push(`status = $${params.length}`)
  }
  if (progress !== undefined) {
    const value = Math.min(100, Math.max(0, Number(progress)))
    params.push(value)
    updates.push(`progress = $${params.length}`)
  }

  if (updates.length === 0) throw new Error('No updates provided')

  params.push(new Date())
  updates.push(`updated_at = $${params.length}`)

  params.push(Number(goalId))
  params.push(organizationId)

  const { rows } = await pool.query(
    `
      UPDATE performance_goals
      SET ${updates.join(', ')}
      WHERE id = $${params.length - 1} AND organization_id = $${params.length}
      RETURNING
        id,
        organization_id AS "organizationId",
        employee_id AS "employeeId",
        title,
        description,
        status,
        progress,
        weight,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `,
    params
  )

  return rows[0] || null
}

export const listPerformanceReviews = async ({ organizationId, employeeId }) => {
  await ensurePerformanceInfrastructure()

  const where = ['pr.organization_id = $1']
  const params = [organizationId]

  if (employeeId) {
    params.push(Number(employeeId))
    where.push(`pr.employee_id = $${params.length}`)
  }

  const { rows } = await pool.query(
    `
      SELECT
        pr.id,
        pr.employee_id AS "employeeId",
        pr.reviewer_user_id AS "reviewerUserId",
        pr.period_start AS "periodStart",
        pr.period_end AS "periodEnd",
        pr.overall_rating AS "overallRating",
        pr.summary,
        pr.status,
        pr.created_at AS "createdAt",
        pr.updated_at AS "updatedAt",
        e.name AS "employeeName",
        u.name AS "reviewerName",
        COALESCE(f.count, 0) AS "feedbackCount"
      FROM performance_reviews pr
      LEFT JOIN employees e ON e.id = pr.employee_id
      LEFT JOIN users u ON u.id = pr.reviewer_user_id
      LEFT JOIN (
        SELECT review_id, COUNT(*) AS count
        FROM performance_feedback
        GROUP BY review_id
      ) f ON f.review_id = pr.id
      WHERE ${where.join(' AND ')}
      ORDER BY pr.created_at DESC
      LIMIT 200
    `,
    params
  )

  return rows
}

export const createPerformanceReview = async ({
  organizationId,
  employeeId,
  reviewerUserId,
  periodStart,
  periodEnd,
  overallRating,
  summary,
  status = 'draft',
}) => {
  await ensurePerformanceInfrastructure()

  if (!employeeId) throw new Error('Employee is required for review')
  const normalizedStatus = REVIEW_STATUSES.includes(String(status)) ? status : 'draft'
  const rating = overallRating !== undefined ? Number(overallRating) : 0
  if (rating < 0 || rating > 5) throw new Error('Rating must be between 0 and 5')

  const { rows } = await pool.query(
    `
      INSERT INTO performance_reviews (
        organization_id,
        employee_id,
        reviewer_user_id,
        period_start,
        period_end,
        overall_rating,
        summary,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING
        id,
        organization_id AS "organizationId",
        employee_id AS "employeeId",
        reviewer_user_id AS "reviewerUserId",
        period_start AS "periodStart",
        period_end AS "periodEnd",
        overall_rating AS "overallRating",
        summary,
        status,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `,
    [
      organizationId,
      Number(employeeId),
      reviewerUserId ? Number(reviewerUserId) : null,
      periodStart || null,
      periodEnd || null,
      rating,
      summary || null,
      normalizedStatus,
    ]
  )

  return rows[0]
}

export const addReviewFeedback = async ({ organizationId, reviewId, userId, comment, sentiment }) => {
  await ensurePerformanceInfrastructure()
  if (!comment) throw new Error('Feedback comment is required')

  const { rows } = await pool.query(
    `
      INSERT INTO performance_feedback (
        organization_id,
        review_id,
        user_id,
        comment,
        sentiment
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING
        id,
        organization_id AS "organizationId",
        review_id AS "reviewId",
        user_id AS "userId",
        comment,
        sentiment,
        created_at AS "createdAt"
    `,
    [organizationId, Number(reviewId), userId ? Number(userId) : null, comment, sentiment || null]
  )

  return rows[0]
}
