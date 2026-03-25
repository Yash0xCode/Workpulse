import { pool } from '../config/db.js'

export const getAttendanceAnalytics = async (req, res) => {
  try {
    const [{ rows: attendanceRows }, { rows: orgRows }] = await Promise.all([
      pool.query(
        `
          WITH dates AS (
            SELECT generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, INTERVAL '1 day')::date AS attendance_date
          ),
          headcount AS (
            SELECT COUNT(*)::numeric AS total
            FROM employees
            WHERE organization_id = $1
          ),
          present AS (
            SELECT attendance_date, COUNT(DISTINCT user_id)::numeric AS present_count
            FROM attendance_logs
            WHERE organization_id = $1
            GROUP BY attendance_date
          )
          SELECT
            TO_CHAR(d.attendance_date, 'Dy') AS label,
            CASE
              WHEN h.total = 0 THEN 0
              ELSE ROUND(COALESCE(p.present_count, 0) * 100.0 / h.total)
            END AS value
          FROM dates d
          CROSS JOIN headcount h
          LEFT JOIN present p ON p.attendance_date = d.attendance_date
          ORDER BY d.attendance_date ASC
        `,
        [req.user.organizationId]
      ),
      pool.query('SELECT location FROM organizations WHERE id = $1 LIMIT 1', [req.user.organizationId]),
    ])

    const labels = attendanceRows.map((item) => item.label.trim())
    const trend = attendanceRows.map((item) => Number(item.value || 0))

    return res.json({
      data: {
        trend,
        labels,
        officeLocation: orgRows[0]?.location || 'CHARUSAT University, Changa, Gujarat',
        average: trend.length
          ? Math.round(trend.reduce((sum, item) => sum + item, 0) / trend.length)
          : 0,
      },
    })
  } catch (_error) {
    return res.status(500).json({ message: 'Failed to fetch attendance analytics' })
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
    return res.status(500).json({ message: 'Failed to fetch productivity analytics' })
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
    return res.status(500).json({ message: 'Failed to fetch placement analytics' })
  }
}
