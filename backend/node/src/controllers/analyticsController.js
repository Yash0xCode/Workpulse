import { pool } from '../config/db.js'
import { sendError } from '../utils/response.js'

export const getAttendanceAnalytics = async (req, res) => {
  try {
    const requestedDays = Number.parseInt(req.query.days, 10)
    const days = Number.isFinite(requestedDays) ? Math.min(Math.max(requestedDays, 7), 60) : 7

    const endDate = new Date()
    const startDate = new Date(endDate)
    startDate.setDate(endDate.getDate() - (days - 1))
    const startDateKey = startDate.toISOString().slice(0, 10)
    const endDateKey = endDate.toISOString().slice(0, 10)

    const [{ rows: attendanceRows }, { rows: statusRows }, { rows: weekdayRows }, { rows: orgRows }] =
      await Promise.all([
      pool.query(
        `
          WITH dates AS (
            SELECT generate_series($2::date, $3::date, INTERVAL '1 day')::date AS attendance_date
          ),
          headcount AS (
            SELECT COUNT(*)::numeric AS total
            FROM employees
            WHERE organization_id = $1
              AND user_id IS NOT NULL
          ),
          day_logs AS (
            SELECT
              attendance_date,
              user_id,
              MAX(check_in_time) AS check_in_time,
              MAX(check_out_time) AS check_out_time
            FROM attendance_logs
            WHERE organization_id = $1
              AND attendance_date BETWEEN $2::date AND $3::date
            GROUP BY attendance_date, user_id
          )
          SELECT
            d.attendance_date AS "attendanceDate",
            TO_CHAR(d.attendance_date, 'DD Mon') AS label,
            CASE
              WHEN h.total = 0 THEN 0
              ELSE ROUND(COALESCE(COUNT(DISTINCT dl.user_id), 0) * 100.0 / h.total, 2)
            END AS value
            ,COUNT(DISTINCT dl.user_id)::int AS "presentCount"
            ,COALESCE(
              ROUND(
                AVG(
                  CASE
                    WHEN dl.check_in_time IS NOT NULL AND dl.check_out_time IS NOT NULL
                    THEN EXTRACT(EPOCH FROM (dl.check_out_time - dl.check_in_time)) / 3600
                  END
                )::numeric,
                2
              ),
              0
            ) AS "avgWorkedHours"
            ,COALESCE(
              COUNT(*) FILTER (WHERE dl.check_in_time::time <= TIME '09:15:00'),
              0
            )::int AS "onTimeCount"
            ,COALESCE(
              COUNT(*) FILTER (WHERE dl.check_in_time::time > TIME '09:15:00'),
              0
            )::int AS "lateCount"
            ,h.total::int AS "totalEmployees"
          FROM dates d
          CROSS JOIN headcount h
          LEFT JOIN day_logs dl ON dl.attendance_date = d.attendance_date
          GROUP BY d.attendance_date, h.total
          ORDER BY d.attendance_date ASC
        `,
        [req.user.organizationId, startDateKey, endDateKey]
      ),
      pool.query(
        `
          SELECT COALESCE(status, 'present') AS status, COUNT(*)::int AS count
          FROM attendance_logs
          WHERE organization_id = $1
            AND attendance_date BETWEEN $2::date AND $3::date
          GROUP BY COALESCE(status, 'present')
        `,
        [req.user.organizationId, startDateKey, endDateKey]
      ),
      pool.query(
        `
          WITH dates AS (
            SELECT generate_series($2::date, $3::date, INTERVAL '1 day')::date AS attendance_date
          ),
          headcount AS (
            SELECT COUNT(*)::numeric AS total
            FROM employees
            WHERE organization_id = $1
              AND user_id IS NOT NULL
          ),
          day_presence AS (
            SELECT attendance_date, COUNT(DISTINCT user_id)::numeric AS present_count
            FROM attendance_logs
            WHERE organization_id = $1
              AND attendance_date BETWEEN $2::date AND $3::date
            GROUP BY attendance_date
          )
          SELECT
            EXTRACT(ISODOW FROM d.attendance_date)::int AS "isoDay",
            TO_CHAR(d.attendance_date, 'Dy') AS label,
            CASE
              WHEN h.total = 0 THEN 0
              ELSE ROUND(COALESCE(dp.present_count, 0) * 100.0 / h.total, 2)
            END AS value
          FROM dates d
          CROSS JOIN headcount h
          LEFT JOIN day_presence dp ON dp.attendance_date = d.attendance_date
          ORDER BY "isoDay" ASC
        `,
        [req.user.organizationId, startDateKey, endDateKey]
      ),
      pool.query('SELECT location FROM organizations WHERE id = $1 LIMIT 1', [req.user.organizationId]),
      ])

    const labels = attendanceRows.map((item) => item.label.trim())
    const trend = attendanceRows.map((item) => Number(item.value || 0))
    const dailyHours = attendanceRows.map((item) => Number(item.avgWorkedHours || 0))

    const onTimeTotal = attendanceRows.reduce((sum, item) => sum + Number(item.onTimeCount || 0), 0)
    const lateArrivals = attendanceRows.reduce((sum, item) => sum + Number(item.lateCount || 0), 0)
    const checkInTotal = onTimeTotal + lateArrivals

    const statusDistribution = statusRows.reduce((acc, row) => {
      acc[row.status] = Number(row.count || 0)
      return acc
    }, {})

    const weekdayBuckets = weekdayRows.reduce((acc, row) => {
      const key = Number(row.isoDay)
      if (!acc[key]) {
        acc[key] = { total: 0, count: 0, label: String(row.label || '').trim() }
      }
      acc[key].total += Number(row.value || 0)
      acc[key].count += 1
      return acc
    }, {})

    const weekdayPattern = [1, 2, 3, 4, 5, 6, 7]
      .filter((isoDay) => Boolean(weekdayBuckets[isoDay]))
      .map((isoDay) => ({
        isoDay,
        label: weekdayBuckets[isoDay].label,
        value: Number((weekdayBuckets[isoDay].total / weekdayBuckets[isoDay].count).toFixed(2)),
      }))

    const averageAttendance = trend.length
      ? Number((trend.reduce((sum, item) => sum + item, 0) / trend.length).toFixed(2))
      : 0
    const averageHours = dailyHours.length
      ? Number((dailyHours.reduce((sum, item) => sum + item, 0) / dailyHours.length).toFixed(2))
      : 0
    const onTimeRate = checkInTotal ? Number(((onTimeTotal * 100) / checkInTotal).toFixed(2)) : 0

    return res.json({
      data: {
        trend,
        labels,
        dailyHours,
        officeLocation: orgRows[0]?.location || 'CHARUSAT University, Changa, Gujarat',
        average: averageAttendance,
        averageHours,
        onTimeRate,
        lateArrivals,
        statusDistribution,
        weekdayPattern,
        range: {
          days,
          from: startDateKey,
          to: endDateKey,
        },
        daily: attendanceRows.map((item) => ({
          date: item.attendanceDate,
          label: String(item.label || '').trim(),
          attendanceRate: Number(item.value || 0),
          avgWorkedHours: Number(item.avgWorkedHours || 0),
          presentCount: Number(item.presentCount || 0),
          totalEmployees: Number(item.totalEmployees || 0),
          onTimeCount: Number(item.onTimeCount || 0),
          lateCount: Number(item.lateCount || 0),
        })),
      },
    })
  } catch (_error) {
    return sendError(res, 'SERVER_ERROR', 'Failed to fetch attendance analytics', {}, 500)
  }
}

export const getProductivityAnalytics = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `
        SELECT id, name, COALESCE(productivity, 0) AS productivity
        FROM employees
        WHERE organization_id = $1
        ORDER BY productivity DESC, name ASC
        LIMIT 6
      `,
      [req.user.organizationId]
    )

    const employeeRisk = rows.map((item) => {
      const productivityScore = Number(item.productivity || 0)
      const attritionProbability = Number((Math.max(0.1, (100 - productivityScore) / 100)).toFixed(2))
      const riskBand = productivityScore < 75 ? 'high' : productivityScore < 85 ? 'medium' : 'low'

      return {
        employeeId: item.id,
        employeeName: item.name,
        productivityScore,
        attritionProbability,
        riskBand,
      }
    })

    return res.json({
      data: {
        productivity: employeeRisk.map((item) => item.productivityScore),
        labels: employeeRisk.map((item) => item.employeeName),
        attritionRiskDistribution: {
          low: employeeRisk.filter((item) => item.riskBand === 'low').length,
          medium: employeeRisk.filter((item) => item.riskBand === 'medium').length,
          high: employeeRisk.filter((item) => item.riskBand === 'high').length,
        },
        employeeRisk,
      },
    })
  } catch (_error) {
    return sendError(res, 'SERVER_ERROR', 'Failed to fetch productivity analytics', {}, 500)
  }
}

export const getPlacementAnalytics = async (req, res) => {
  try {
    const [{ rows: leaveRows }, { rows: taskRows }] = await Promise.all([
      pool.query(
        `
          SELECT status, COUNT(*)::int AS count
          FROM leaves
          WHERE organization_id = $1
          GROUP BY status
        `,
        [req.user.organizationId]
      ),
      pool.query(
        `
          SELECT status, COUNT(*)::int AS count
          FROM tasks
          WHERE organization_id = $1
          GROUP BY status
        `,
        [req.user.organizationId]
      ),
    ])

    const leaveSummary = leaveRows.reduce(
      (acc, row) => ({ ...acc, [row.status]: row.count }),
      { pending: 0, approved: 0 }
    )
    const taskSummary = taskRows.reduce(
      (acc, row) => ({
        ...acc,
        total: acc.total + row.count,
        done: row.status === 'done' ? row.count : acc.done,
        inProgress: row.status === 'in-progress' ? row.count : acc.inProgress,
      }),
      { total: 0, done: 0, inProgress: 0 }
    )

    return res.json({
      data: {
        applied: 140,
        shortlisted: 72,
        interviewed: 39,
        offers: 21,
        placementStatistics: {
          registeredStudents: 320,
          placedStudents: 214,
          placementRate: 66.9,
        },
        leaveSummary,
        taskSummary,
      },
    })
  } catch (_error) {
    return sendError(res, 'SERVER_ERROR', 'Failed to fetch placement analytics', {}, 500)
  }
}
