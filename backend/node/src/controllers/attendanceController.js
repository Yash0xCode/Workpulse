import { pool } from '../config/db.js'

const attendanceSelect = `
  SELECT
    a.id,
    a.user_id AS "userId",
    a.organization_id AS "organizationId",
    a.check_in_time AS "checkIn",
    a.check_out_time AS "checkOut",
    COALESCE(a.source, 'manual') AS source,
    COALESCE(a.face_verified, FALSE) AS "faceVerified",
    COALESCE(a.location_verified, FALSE) AS "locationVerified",
    a.attendance_date AS "attendanceDate",
    COALESCE(a.status, 'present') AS status,
    CASE
      WHEN a.location_name IS NULL AND a.location_city IS NULL AND a.distance_meters IS NULL THEN NULL
      ELSE json_build_object(
        'name', a.location_name,
        'city', a.location_city,
        'distanceMeters', a.distance_meters
      )
    END AS location
  FROM attendance_logs a
`

const normalizeAttendance = (row) => ({
  ...row,
  attendanceDate: row.attendanceDate
    ? new Date(row.attendanceDate).toISOString().slice(0, 10)
    : null,
})

const canViewOrganizationAttendance = (role) =>
  ['hr_manager', 'super_admin', 'institute_admin'].includes(role)

export const checkIn = async (req, res) => {
  if (!req.body.faceVerified || !req.body.locationVerified) {
    return res.status(400).json({
      message: 'Attendance requires both face verification and office location verification',
    })
  }

  try {
    const userId = Number(req.body.userId || req.user.id)
    const { rows: openRows } = await pool.query(
      `
        SELECT id
        FROM attendance_logs
        WHERE user_id = $1
          AND organization_id = $2
          AND check_out_time IS NULL
        LIMIT 1
      `,
      [userId, req.user.organizationId]
    )

    if (openRows[0]) {
      return res.status(409).json({ message: 'Open check-in already exists' })
    }

    const location = req.body.location || {}
    const { rows } = await pool.query(
      `
        INSERT INTO attendance_logs (
          organization_id,
          user_id,
          attendance_date,
          check_in_time,
          status,
          face_verified,
          location_verified,
          source,
          latitude,
          longitude,
          location_name,
          location_city,
          distance_meters
        )
        VALUES ($1, $2, CURRENT_DATE, CURRENT_TIMESTAMP, 'present', $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `,
      [
        req.user.organizationId,
        userId,
        Boolean(req.body.faceVerified),
        Boolean(req.body.locationVerified),
        req.body.source || 'face+geo',
        location.latitude || null,
        location.longitude || null,
        location.name || null,
        location.city || null,
        location.distanceMeters || null,
      ]
    )

    const created = await pool.query(`${attendanceSelect} WHERE a.id = $1`, [rows[0].id])
    return res.status(201).json({ data: normalizeAttendance(created.rows[0]) })
  } catch (_error) {
    return res.status(500).json({ message: 'Failed to check in' })
  }
}

export const checkOut = async (req, res) => {
  try {
    const userId = Number(req.body.userId || req.user.id)
    const result = await pool.query(
      `
        UPDATE attendance_logs
        SET check_out_time = CURRENT_TIMESTAMP
        WHERE id = (
          SELECT id
          FROM attendance_logs
          WHERE user_id = $1
            AND organization_id = $2
            AND check_out_time IS NULL
          ORDER BY check_in_time DESC
          LIMIT 1
        )
        RETURNING id
      `,
      [userId, req.user.organizationId]
    )

    if (!result.rows[0]) return res.status(404).json({ message: 'Open check-in not found' })

    const updated = await pool.query(`${attendanceSelect} WHERE a.id = $1`, [result.rows[0].id])
    return res.json({ data: normalizeAttendance(updated.rows[0]) })
  } catch (_error) {
    return res.status(500).json({ message: 'Failed to check out' })
  }
}

export const getAttendanceByUser = async (req, res) => {
  try {
    if (!req.params.id) {
      const { rows } = await pool.query(
        `
          WITH manager_team AS (
            SELECT team.id
            FROM employees manager
            JOIN employees team ON team.manager_id = manager.id
            WHERE manager.organization_id = $1
              AND manager.user_id = $2
          )
          ${attendanceSelect}
          WHERE a.organization_id = $1
            AND a.user_id IN (
              SELECT user_id FROM employees WHERE id IN (SELECT id FROM manager_team) AND user_id IS NOT NULL
            )
          ORDER BY a.check_in_time DESC
        `,
        [req.user.organizationId, req.user.id]
      )
      return res.json({ data: rows.map(normalizeAttendance) })
    }

    const { rows } = await pool.query(
      `${attendanceSelect} WHERE a.user_id = $1 AND a.organization_id = $2 ORDER BY a.check_in_time DESC`,
      [Number(req.params.id), req.user.organizationId]
    )
    return res.json({ data: rows.map(normalizeAttendance) })
  } catch (_error) {
    return res.status(500).json({ message: 'Failed to fetch attendance logs' })
  }
}

export const getAttendanceStatusSummary = async (req, res) => {
  try {
    const role = req.user?.role
    const orgId = req.user.organizationId

    let employeeScopeSql = `
      SELECT e.id, e.user_id AS "userId"
      FROM employees e
      WHERE e.organization_id = $1
        AND e.user_id IS NOT NULL
    `
    let params = [orgId]

    if (!canViewOrganizationAttendance(role)) {
      employeeScopeSql = `
        SELECT e.id, e.user_id AS "userId"
        FROM employees e
        WHERE e.organization_id = $1
          AND e.user_id IS NOT NULL
          AND e.manager_id = (
            SELECT m.id
            FROM employees m
            WHERE m.organization_id = $1 AND m.user_id = $2
            LIMIT 1
          )
      `
      params = [orgId, req.user.id]
    }

    const { rows } = await pool.query(
      `
        WITH employee_scope AS (
          ${employeeScopeSql}
        ),
        today_logs AS (
          SELECT
            a.user_id AS "userId",
            MAX(a.check_in_time) AS "latestCheckIn",
            MAX(a.check_out_time) AS "latestCheckOut"
          FROM attendance_logs a
          JOIN employee_scope es ON es."userId" = a.user_id
          WHERE a.organization_id = $1
            AND a.attendance_date = CURRENT_DATE
          GROUP BY a.user_id
        )
        SELECT
          (SELECT COUNT(*)::int FROM employee_scope) AS "totalEmployees",
          (SELECT COUNT(*)::int FROM today_logs) AS "presentToday",
          (SELECT COUNT(*)::int FROM today_logs WHERE "latestCheckIn" IS NOT NULL AND "latestCheckOut" IS NULL) AS "inProgress",
          (SELECT COUNT(*)::int FROM today_logs WHERE "latestCheckOut" IS NOT NULL) AS "completed",
          GREATEST(
            (SELECT COUNT(*)::int FROM employee_scope) - (SELECT COUNT(*)::int FROM today_logs),
            0
          ) AS "absentToday"
      `,
      params
    )

    return res.json({ data: rows[0] || {} })
  } catch (_error) {
    return res.status(500).json({ message: 'Failed to fetch attendance summary' })
  }
}
