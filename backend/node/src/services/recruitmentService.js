import { pool } from '../config/db.js'

const APPLICATION_STATUSES = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected']
let recruitmentInfraReady = false

export const ensureRecruitmentInfrastructure = async () => {
  if (recruitmentInfraReady) return

  await pool.query(`
    CREATE TABLE IF NOT EXISTS job_openings (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      department VARCHAR(120),
      location VARCHAR(255),
      description TEXT,
      status VARCHAR(30) NOT NULL DEFAULT 'open',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS candidates (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      phone VARCHAR(50),
      experience_years NUMERIC(4,1) DEFAULT 0,
      skills JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS job_applications (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      job_id INTEGER NOT NULL REFERENCES job_openings(id) ON DELETE CASCADE,
      candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
      status VARCHAR(30) NOT NULL DEFAULT 'applied',
      source VARCHAR(80),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (organization_id, job_id, candidate_id)
    )
  `)

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_job_openings_org_status
      ON job_openings(organization_id, status)
  `)

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_job_applications_org_status
      ON job_applications(organization_id, status)
  `)

  recruitmentInfraReady = true
}

export const listJobOpenings = async ({ organizationId, limit = 50, offset = 0 }) => {
  await ensureRecruitmentInfrastructure()
  const { rows } = await pool.query(
    `
      SELECT
        id,
        organization_id AS "organizationId",
        title,
        department,
        location,
        description,
        status,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM job_openings
      WHERE organization_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `,
    [organizationId, limit, offset]
  )
  return rows
}

export const createJobOpening = async ({ organizationId, title, department, location, description, status = 'open' }) => {
  await ensureRecruitmentInfrastructure()
  if (!title) throw new Error('Job title is required')

  const { rows } = await pool.query(
    `
      INSERT INTO job_openings (
        organization_id,
        title,
        department,
        location,
        description,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING
        id,
        organization_id AS "organizationId",
        title,
        department,
        location,
        description,
        status,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `,
    [organizationId, title, department || null, location || null, description || null, status || 'open']
  )

  return rows[0]
}

export const listApplications = async ({ organizationId, jobId, status }) => {
  await ensureRecruitmentInfrastructure()
  const where = ['ja.organization_id = $1']
  const params = [organizationId]

  if (jobId) {
    params.push(Number(jobId))
    where.push(`ja.job_id = $${params.length}`)
  }
  if (status) {
    params.push(String(status))
    where.push(`ja.status = $${params.length}`)
  }

  const { rows } = await pool.query(
    `
      SELECT
        ja.id,
        ja.job_id AS "jobId",
        ja.candidate_id AS "candidateId",
        c.name AS "candidateName",
        c.email AS "candidateEmail",
        c.phone AS "candidatePhone",
        ja.status,
        ja.source,
        ja.notes,
        ja.created_at AS "createdAt",
        ja.updated_at AS "updatedAt",
        jo.title AS "jobTitle",
        jo.department,
        jo.location
      FROM job_applications ja
      JOIN candidates c ON c.id = ja.candidate_id
      JOIN job_openings jo ON jo.id = ja.job_id
      WHERE ${where.join(' AND ')}
      ORDER BY ja.created_at DESC
      LIMIT 100
    `,
    params
  )

  return rows
}

export const createApplication = async ({
  organizationId,
  jobId,
  candidateId,
  candidate,
  source,
  notes,
}) => {
  await ensureRecruitmentInfrastructure()

  const job = await pool.query(
    `SELECT id, status FROM job_openings WHERE id = $1 AND organization_id = $2 LIMIT 1`,
    [Number(jobId), organizationId]
  )
  const jobRow = job.rows[0]
  if (!jobRow) throw new Error('Job not found')
  if (jobRow.status !== 'open') throw new Error('Job is not open')

  let cid = candidateId ? Number(candidateId) : null
  if (!cid) {
    if (!candidate?.name) throw new Error('Candidate name is required')
    const insertCandidate = await pool.query(
      `
        INSERT INTO candidates (organization_id, name, email, phone, experience_years, skills)
        VALUES ($1, $2, $3, $4, $5, $6::jsonb)
        RETURNING id
      `,
      [organizationId, candidate.name, candidate.email || null, candidate.phone || null, candidate.experienceYears || 0, JSON.stringify(candidate.skills || [])]
    )
    cid = insertCandidate.rows[0].id
  }

  const { rows } = await pool.query(
    `
      INSERT INTO job_applications (
        organization_id,
        job_id,
        candidate_id,
        status,
        source,
        notes
      )
      VALUES ($1, $2, $3, 'applied', $4, $5)
      ON CONFLICT (organization_id, job_id, candidate_id) DO UPDATE SET
        status = EXCLUDED.status,
        source = COALESCE(EXCLUDED.source, job_applications.source),
        notes = COALESCE(EXCLUDED.notes, job_applications.notes),
        updated_at = CURRENT_TIMESTAMP
      RETURNING id
    `,
    [organizationId, Number(jobId), cid, source || null, notes || null]
  )

  return rows[0]
}

export const updateApplicationStatus = async ({ organizationId, applicationId, status, notes }) => {
  await ensureRecruitmentInfrastructure()
  const nextStatus = String(status || '').toLowerCase()
  if (!APPLICATION_STATUSES.includes(nextStatus)) throw new Error('Invalid status')

  const { rows } = await pool.query(
    `
      UPDATE job_applications
      SET status = $3,
          notes = COALESCE($4, notes),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND organization_id = $2
      RETURNING
        id,
        job_id AS "jobId",
        candidate_id AS "candidateId",
        status,
        notes,
        updated_at AS "updatedAt"
    `,
    [Number(applicationId), organizationId, nextStatus, notes || null]
  )

  return rows[0] || null
}
