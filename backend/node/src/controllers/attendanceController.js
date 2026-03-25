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

const resolveAttendanceStatus = ({ checkIn, checkOut, isWeekend, isOnLeave }) => {
  if (isWeekend) return 'weekend'
  if (isOnLeave) return 'on_leave'
  if (!checkIn && !checkOut) return 'absent'
  if (checkIn && !checkOut) return 'in_progress'
  if (!checkIn || !checkOut) return 'absent'

  const hoursWorked = (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60)
  if (hoursWorked >= 8) return 'present'
  if (hoursWorked >= 4) return 'half_day'
  return 'absent'
}

const buildEmployeeScopeQuery = ({ role }) => {
  if (canViewOrganizationAttendance(role)) {
    return {
      sql: `
        SELECT e.id, e.user_id AS "userId", e.name
        FROM employees e
        WHERE e.organization_id = $1
          AND e.user_id IS NOT NULL
      `,
      params: (orgId) => [orgId],
    }
  }

  return {
    sql: `
      SELECT e.id, e.user_id AS "userId", e.name
      FROM employees e
      WHERE e.organization_id = $1
        AND e.user_id IS NOT NULL
        AND e.manager_id = (
          SELECT m.id
          FROM employees m
          WHERE m.organization_id = $1 AND m.user_id = $2
          LIMIT 1
        )
    `,
    params: (orgId, userId) => [orgId, userId],
  }
}

const fetchAttendanceStatuses = async ({ role, organizationId, userId, targetDate }) => {
  const employeeScope = buildEmployeeScopeQuery({ role })
  const scopeParams = employeeScope.params(organizationId, userId)
  const dateParamIndex = scopeParams.length + 1

  const { rows } = await pool.query(
    `
      WITH employee_scope AS (
        ${employeeScope.sql}
      ),
      latest_logs AS (
        SELECT
          a.user_id AS "userId",
          MAX(a.check_in_time) AS "checkIn",
          MAX(a.check_out_time) AS "checkOut"
        FROM attendance_logs a
        JOIN employee_scope es ON es."userId" = a.user_id
        WHERE a.organization_id = $1
          AND a.attendance_date = $${dateParamIndex}::date
        GROUP BY a.user_id
      ),
      approved_leaves AS (
        SELECT DISTINCT l.user_id AS "userId"
        FROM leaves l
        JOIN employee_scope es ON es."userId" = l.user_id
        WHERE l.organization_id = $1
          AND l.status = 'approved'
          AND $${dateParamIndex}::date BETWEEN l.from_date AND l.to_date
      )
      SELECT
        es.id AS "employeeId",
        es."userId",
        es.name,
        ll."checkIn",
        ll."checkOut",
        EXTRACT(ISODOW FROM $${dateParamIndex}::date)::int AS "isoDay",
        (al."userId" IS NOT NULL) AS "isOnLeave"
      FROM employee_scope es
      LEFT JOIN latest_logs ll ON ll."userId" = es."userId"
      LEFT JOIN approved_leaves al ON al."userId" = es."userId"
      ORDER BY es.name ASC
    `,
    [...scopeParams, targetDate]
  )

  return rows.map((row) => {
    const isWeekend = row.isoDay === 6 || row.isoDay === 7
    const status = resolveAttendanceStatus({
      checkIn: row.checkIn,
      checkOut: row.checkOut,
      isWeekend,
      isOnLeave: row.isOnLeave,
    })
    const workedHours =
      row.checkIn && row.checkOut
        ? Number(((new Date(row.checkOut) - new Date(row.checkIn)) / (1000 * 60 * 60)).toFixed(2))
        : 0

    return {
      employeeId: row.employeeId,
      userId: row.userId,
      name: row.name,
      checkIn: row.checkIn,
      checkOut: row.checkOut,
      workedHours,
      status,
      isWeekend,
      isOnLeave: Boolean(row.isOnLeave),
      attendanceDate: targetDate,
    }
  })
}

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
        VALUES ($1, $2, CURRENT_DATE, CURRENT_TIMESTAMP, 'in_progress', $3, $4, $5, $6, $7, $8, $9, $10)
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
    const openRecord = await pool.query(
      `
        SELECT id, check_in_time AS "checkIn"
        FROM attendance_logs
        WHERE user_id = $1
          AND organization_id = $2
          AND check_out_time IS NULL
        ORDER BY check_in_time DESC
        LIMIT 1
      `,
      [userId, req.user.organizationId]
    )

    if (!openRecord.rows[0]) return res.status(404).json({ message: 'Open check-in not found' })

    const checkIn = openRecord.rows[0].checkIn
    const now = new Date()
    const workedHours = (now - new Date(checkIn)) / (1000 * 60 * 60)
    const resolvedStatus = workedHours >= 8 ? 'present' : workedHours >= 4 ? 'half_day' : 'absent'

    const result = await pool.query(
      `
        UPDATE attendance_logs
        SET check_out_time = CURRENT_TIMESTAMP,
            status = $3
        WHERE id = $4
        RETURNING id
      `,
      [userId, req.user.organizationId, resolvedStatus, openRecord.rows[0].id]
    )

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
    const targetDate = String(req.query.date || new Date().toISOString().slice(0, 10))
    const statuses = await fetchAttendanceStatuses({
      role,
      organizationId: req.user.organizationId,
      userId: req.user.id,
      targetDate,
    })

    const summary = statuses.reduce(
      (acc, item) => {
        acc.byStatus[item.status] = (acc.byStatus[item.status] || 0) + 1
        if (item.status === 'present') acc.presentToday += 1
        if (item.status === 'in_progress') acc.inProgress += 1
        if (item.status === 'half_day') acc.halfDay += 1
        if (item.status === 'on_leave') acc.onLeave += 1
        if (item.status === 'weekend') acc.weekend += 1
        if (item.status === 'absent') acc.absentToday += 1
        if (item.checkOut) acc.completed += 1
        return acc
      },
      {
        attendanceDate: targetDate,
        totalEmployees: statuses.length,
        presentToday: 0,
        inProgress: 0,
        completed: 0,
        absentToday: 0,
        halfDay: 0,
        onLeave: 0,
        weekend: 0,
        holiday: 0,
        byStatus: {},
      }
    )

    return res.json({ data: summary })
  } catch (_error) {
    return res.status(500).json({ message: 'Failed to fetch attendance summary' })
  }
}

export const getAttendanceStatusList = async (req, res) => {
  try {
    const targetDate = String(req.query.date || new Date().toISOString().slice(0, 10))
    const statuses = await fetchAttendanceStatuses({
      role: req.user?.role,
      organizationId: req.user.organizationId,
      userId: req.user.id,
      targetDate,
    })

    return res.json({ data: statuses })
  } catch (_error) {
    return res.status(500).json({ message: 'Failed to fetch attendance status list' })
  }
}
