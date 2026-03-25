import { pool } from '../config/db.js'
import {
  createLeaveWorkflowInstance,
  transitionLeaveWorkflowInstance,
} from '../services/workflowService.js'
import {
  createInAppNotification,
  sendEmailNotificationStub,
} from '../services/notificationService.js'
import { sendError, sendPaginated, sendSuccess } from '../utils/response.js'

const DEFAULT_LEAVE_TYPES = ['casual', 'sick', 'earned', 'unpaid']

const normalizeLeaveType = (value) => String(value || '').trim().toLowerCase()

const toNumber = (value, fallback = 0) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

const canManageBalances = (role) =>
  ['department_manager', 'hr_manager', 'super_admin', 'institute_admin'].includes(role)

const leaveSelect = `
  SELECT
    l.id,
    l.organization_id AS "organizationId",
    COALESCE(l.employee_id, e.id) AS "employeeId",
    l.user_id AS "userId",
    l.leave_type AS "leaveType",
    l.from_date AS "startDate",
    l.to_date AS "endDate",
    l.reason,
    COALESCE(l.status, 'pending') AS status,
    COALESCE(e.name, u.name) AS "employeeName",
    l.reviewed_by AS "reviewedBy",
    l.reviewed_at AS "reviewedAt"
  FROM leaves l
  LEFT JOIN employees e ON e.id = l.employee_id
  LEFT JOIN users u ON u.id = l.user_id
`

const normalizeLeave = (row) => ({
  ...row,
  startDate: row.startDate ? new Date(row.startDate).toISOString().slice(0, 10) : null,
  endDate: row.endDate ? new Date(row.endDate).toISOString().slice(0, 10) : null,
})

const notifyApproversForLeave = async ({
  organizationId,
  leaveId,
  employeeId,
  employeeName,
  leaveType,
  startDate,
  endDate,
  requesterUserId,
}) => {
  const recipientRows = await pool.query(
    `
      SELECT DISTINCT u.id AS "userId", u.email, u.name
      FROM users u
      LEFT JOIN roles r ON r.id = u.role_id
      LEFT JOIN employees mgr ON mgr.id = $3
      WHERE u.organization_id = $1
        AND u.id <> $2
        AND (
          r.name IN ('hr_manager', 'super_admin', 'institute_admin')
          OR u.id = mgr.user_id
        )
    `,
    [organizationId, requesterUserId, employeeId]
  )

  await Promise.all(
    recipientRows.rows.map((recipient) =>
      createInAppNotification({
        organizationId,
        userId: recipient.userId,
        title: 'Leave Request Pending Approval',
        message: `${employeeName || 'An employee'} submitted a leave request requiring your review.`,
        type: 'workflow',
        resourceType: 'leave',
        resourceId: leaveId,
      })
    )
  )

  await Promise.all(
    recipientRows.rows.map((recipient) =>
      sendEmailNotificationStub({
        organizationId,
        userId: recipient.userId,
        recipientEmail: recipient.email,
        template: 'leave_pending_approval',
        context: {
          employeeName,
          leaveType,
          startDate,
          endDate,
        },
        resourceType: 'leave',
        resourceId: leaveId,
      })
    )
  )
}

const getEmployeeForLeave = async (organizationId, employeeId, userId) => {
  if (employeeId) {
    const { rows } = await pool.query(
      `
        SELECT id, user_id AS "userId", name
        FROM employees
        WHERE organization_id = $1 AND id = $2
        LIMIT 1
      `,
      [organizationId, Number(employeeId)]
    )
    return rows[0] || null
  }

  const { rows } = await pool.query(
    `
      SELECT id, user_id AS "userId", name
      FROM employees
      WHERE organization_id = $1 AND user_id = $2
      LIMIT 1
    `,
    [organizationId, userId]
  )
  return rows[0] || null
}

const getYearRange = (year) => {
  const parsedYear = Number.isInteger(Number(year)) ? Number(year) : new Date().getFullYear()
  return {
    year: parsedYear,
    startDate: `${parsedYear}-01-01`,
    endDate: `${parsedYear}-12-31`,
  }
}

const getEmployeeById = async (organizationId, employeeId) => {
  const { rows } = await pool.query(
    `
      SELECT id, user_id AS "userId", name
      FROM employees
      WHERE organization_id = $1 AND id = $2
      LIMIT 1
    `,
    [organizationId, Number(employeeId)]
  )
  return rows[0] || null
}

const getLeaveUsageByType = async ({ organizationId, employeeId, year }) => {
  const { startDate, endDate } = getYearRange(year)
  const { rows } = await pool.query(
    `
      SELECT
        leave_type AS "leaveType",
        COALESCE(SUM((to_date - from_date + 1)), 0)::numeric(10,2) AS "usedDays"
      FROM leaves
      WHERE organization_id = $1
        AND employee_id = $2
        AND status = 'approved'
        AND from_date >= $3
        AND to_date <= $4
      GROUP BY leave_type
    `,
    [organizationId, employeeId, startDate, endDate]
  )

  return rows.reduce((acc, row) => {
    acc[normalizeLeaveType(row.leaveType)] = toNumber(row.usedDays, 0)
    return acc
  }, {})
}

const getStoredLeaveAllocations = async ({ organizationId, employeeId, year }) => {
  const { rows } = await pool.query(
    `
      SELECT
        leave_type AS "leaveType",
        allocated_days AS "allocatedDays",
        carry_forward_days AS "carryForwardDays"
      FROM leave_balances
      WHERE organization_id = $1
        AND employee_id = $2
        AND leave_year = $3
    `,
    [organizationId, employeeId, year]
  )

  return rows.reduce((acc, row) => {
    acc[normalizeLeaveType(row.leaveType)] = {
      allocatedDays: toNumber(row.allocatedDays, 0),
      carryForwardDays: toNumber(row.carryForwardDays, 0),
    }
    return acc
  }, {})
}

const getLeaveBalanceSummary = async ({ organizationId, employeeId, year }) => {
  const stored = await getStoredLeaveAllocations({ organizationId, employeeId, year })
  const usage = await getLeaveUsageByType({ organizationId, employeeId, year })
  const leaveTypes = Array.from(new Set([...DEFAULT_LEAVE_TYPES, ...Object.keys(stored), ...Object.keys(usage)]))

  return leaveTypes.map((leaveType) => {
    const allocatedDays = stored[leaveType]?.allocatedDays || 0
    const carryForwardDays = stored[leaveType]?.carryForwardDays || 0
    const usedDays = usage[leaveType] || 0
    const availableDays = allocatedDays + carryForwardDays - usedDays

    return {
      leaveType,
      allocatedDays,
      carryForwardDays,
      usedDays,
      availableDays,
    }
  })
}

export const createLeave = async (req, res) => {
  if (!req.body.leaveType || !req.body.startDate || !req.body.endDate) {
    return sendError(
      res,
      'VALIDATION_ERROR',
      'leaveType, startDate, endDate and employeeId are required',
      {},
      400
    )
  }

  try {
    const employee = await getEmployeeForLeave(
      req.user.organizationId,
      req.body.employeeId,
      req.user.id
    )

    if (!employee?.id) {
      return sendError(
        res,
        'VALIDATION_ERROR',
        'leaveType, startDate, endDate and employeeId are required',
        {},
        400
      )
    }

    const { rows } = await pool.query(
      `
        INSERT INTO leaves (
          organization_id,
          user_id,
          employee_id,
          leave_type,
          from_date,
          to_date,
          reason,
          status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
        RETURNING id
      `,
      [
        req.user.organizationId,
        employee.userId || req.user.id,
        employee.id,
        req.body.leaveType,
        req.body.startDate,
        req.body.endDate,
        req.body.reason || '',
      ]
    )

    const leaveId = rows[0].id

    try {
      await createLeaveWorkflowInstance({
        organizationId: req.user.organizationId,
        leaveId,
        requesterUserId: employee.userId || req.user.id,
        actorUserId: req.user.id,
      })
    } catch (_workflowError) {
      // Keep leave submission resilient even if workflow tracking fails.
    }

    await notifyApproversForLeave({
      organizationId: req.user.organizationId,
      leaveId,
      employeeId: employee.id,
      employeeName: employee.name,
      leaveType: req.body.leaveType,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      requesterUserId: employee.userId || req.user.id,
    })

    const created = await pool.query(`${leaveSelect} WHERE l.id = $1`, [leaveId])
    return sendSuccess(res, normalizeLeave(created.rows[0]), {}, 201)
  } catch (_error) {
    return sendError(res, 'SERVER_ERROR', 'Failed to create leave request', {}, 500)
  }
}

export const getLeaves = async (req, res) => {
  try {
    const role = req.user?.role
    const { page, limit, offset } = req.pagination || { page: 1, limit: 20, offset: 0 }
    let listQuery = `${leaveSelect} WHERE l.organization_id = $1 ORDER BY l.created_at DESC LIMIT $2 OFFSET $3`
    let countQuery = 'SELECT COUNT(*)::int AS total FROM leaves WHERE organization_id = $1'
    let params = [req.user.organizationId, limit, offset]
    let countParams = [req.user.organizationId]

    if (role === 'employee' || role === 'student') {
      listQuery = `${leaveSelect} WHERE l.organization_id = $1 AND l.user_id = $2 ORDER BY l.created_at DESC LIMIT $3 OFFSET $4`
      countQuery = 'SELECT COUNT(*)::int AS total FROM leaves WHERE organization_id = $1 AND user_id = $2'
      params = [req.user.organizationId, req.user.id, limit, offset]
      countParams = [req.user.organizationId, req.user.id]
    }

    const { rows } = await pool.query(listQuery, params)
    const count = await pool.query(countQuery, countParams)
    return sendPaginated(res, rows.map(normalizeLeave), page, limit, count.rows[0]?.total || 0)
  } catch (_error) {
    return sendError(res, 'SERVER_ERROR', 'Failed to fetch leave requests', {}, 500)
  }
}

export const getLeaveBalances = async (req, res) => {
  try {
    const role = req.user?.role
    const requestedEmployeeId = req.query?.employeeId ? Number(req.query.employeeId) : null
    const year = Number(req.query?.year) || new Date().getFullYear()

    let employee = null
    if (requestedEmployeeId) {
      employee = await getEmployeeById(req.user.organizationId, requestedEmployeeId)
      if (!employee) {
        return sendError(res, 'NOT_FOUND', 'Employee not found', {}, 404)
      }

      if (!canManageBalances(role) && employee.userId !== req.user.id) {
        return sendError(res, 'FORBIDDEN', 'You can only view your own leave balance', {}, 403)
      }
    } else {
      employee = await getEmployeeForLeave(req.user.organizationId, null, req.user.id)
      if (!employee?.id) {
        return sendError(res, 'NOT_FOUND', 'Employee profile not found', {}, 404)
      }
    }

    const balances = await getLeaveBalanceSummary({
      organizationId: req.user.organizationId,
      employeeId: employee.id,
      year,
    })

    return sendSuccess(res, {
      employeeId: employee.id,
      employeeName: employee.name || null,
      year,
      balances,
    })
  } catch (_error) {
    return sendError(res, 'SERVER_ERROR', 'Failed to fetch leave balances', {}, 500)
  }
}

export const updateLeaveBalances = async (req, res) => {
  try {
    if (!canManageBalances(req.user?.role)) {
      return sendError(res, 'FORBIDDEN', 'Only managers or HR can update leave balances', {}, 403)
    }

    const employeeId = Number(req.body?.employeeId)
    const year = Number(req.body?.year) || new Date().getFullYear()
    const allocations = Array.isArray(req.body?.allocations) ? req.body.allocations : []

    if (!employeeId || allocations.length === 0) {
      return sendError(
        res,
        'VALIDATION_ERROR',
        'employeeId and allocations are required',
        {},
        400
      )
    }

    const employee = await getEmployeeById(req.user.organizationId, employeeId)
    if (!employee) {
      return sendError(res, 'NOT_FOUND', 'Employee not found', {}, 404)
    }

    for (const allocation of allocations) {
      const leaveType = String(allocation?.leaveType || '').trim().toLowerCase()
      if (!leaveType) {
        return sendError(res, 'VALIDATION_ERROR', 'allocation.leaveType is required', {}, 400)
      }

      const allocatedDays = toNumber(allocation?.allocatedDays, 0)
      const carryForwardDays = toNumber(allocation?.carryForwardDays, 0)
      if (allocatedDays < 0 || carryForwardDays < 0) {
        return sendError(
          res,
          'VALIDATION_ERROR',
          'allocatedDays and carryForwardDays cannot be negative',
          {},
          400
        )
      }

      await pool.query(
        `
          INSERT INTO leave_balances (
            organization_id,
            employee_id,
            leave_type,
            leave_year,
            allocated_days,
            carry_forward_days,
            updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
          ON CONFLICT (organization_id, employee_id, leave_type, leave_year)
          DO UPDATE SET
            allocated_days = EXCLUDED.allocated_days,
            carry_forward_days = EXCLUDED.carry_forward_days,
            updated_at = CURRENT_TIMESTAMP
        `,
        [req.user.organizationId, employeeId, leaveType, year, allocatedDays, carryForwardDays]
      )
    }

    const balances = await getLeaveBalanceSummary({
      organizationId: req.user.organizationId,
      employeeId,
      year,
    })

    return sendSuccess(res, {
      employeeId,
      employeeName: employee.name || null,
      year,
      balances,
    })
  } catch (_error) {
    return sendError(res, 'SERVER_ERROR', 'Failed to update leave balances', {}, 500)
  }
}

export const updateLeave = async (req, res) => {
  try {
    const updates = []
    const values = []
    const isApprovalAction = req.path.endsWith('/approve')
    let existingLeave = null

    if (isApprovalAction) {
      const nextStatus = req.body.status
      if (!['approved', 'rejected'].includes(nextStatus)) {
        return sendError(res, 'VALIDATION_ERROR', 'status must be approved or rejected', {}, 400)
      }

      const existing = await pool.query(
        `
          SELECT
            l.id,
            l.status,
            l.user_id AS "userId",
            l.organization_id AS "organizationId",
            l.employee_id AS "employeeId",
            l.leave_type AS "leaveType",
            l.from_date AS "startDate",
            l.to_date AS "endDate",
            u.email AS "requesterEmail",
            COALESCE(e.name, u.name) AS "employeeName"
          FROM leaves l
          LEFT JOIN users u ON u.id = l.user_id
          LEFT JOIN employees e ON e.id = l.employee_id
          WHERE l.id = $1 AND l.organization_id = $2
          LIMIT 1
        `,
        [Number(req.params.id), req.user.organizationId]
      )

      if (!existing.rows[0]) {
        return sendError(res, 'NOT_FOUND', 'Leave not found', {}, 404)
      }

      existingLeave = existing.rows[0]

      if (existingLeave.status !== 'pending') {
        return sendError(res, 'VALIDATION_ERROR', 'Only pending leave requests can be reviewed', {}, 400)
      }

      if (existingLeave.userId === req.user.id) {
        return sendError(res, 'FORBIDDEN', 'You cannot approve your own leave request', {}, 403)
      }

      if (nextStatus === 'approved') {
        const leaveDetails = await pool.query(
          `
            SELECT leave_type AS "leaveType", from_date AS "startDate", to_date AS "endDate"
            FROM leaves
            WHERE id = $1 AND organization_id = $2
            LIMIT 1
          `,
          [Number(req.params.id), req.user.organizationId]
        )

        const leaveInfo = leaveDetails.rows[0]
        const leaveYear = leaveInfo?.startDate
          ? new Date(leaveInfo.startDate).getFullYear()
          : new Date().getFullYear()

        const balances = await getLeaveBalanceSummary({
          organizationId: req.user.organizationId,
          employeeId: existingLeave.employeeId,
          year: leaveYear,
        })

        const daysRequested = leaveInfo
          ? Math.max(
              1,
              Math.ceil(
                (new Date(leaveInfo.endDate).getTime() - new Date(leaveInfo.startDate).getTime()) /
                  (1000 * 60 * 60 * 24)
              ) + 1
            )
          : 0

        const normalizedLeaveType = normalizeLeaveType(leaveInfo?.leaveType)
        const typeBalance = balances.find((b) => b.leaveType === normalizedLeaveType)
        if (!typeBalance || typeBalance.availableDays < daysRequested) {
          return sendError(
            res,
            'VALIDATION_ERROR',
            'Insufficient leave balance for this approval',
            {
              leaveType: normalizedLeaveType || null,
              availableDays: typeBalance?.availableDays || 0,
              requestedDays: daysRequested,
            },
            400
          )
        }
      }

      values.push(nextStatus)
      updates.push(`status = $${values.length}`)
      values.push(req.user.id)
      updates.push(`reviewed_by = $${values.length}`)
      updates.push('reviewed_at = CURRENT_TIMESTAMP')
    } else {
      const fieldMap = {
        leaveType: 'leave_type',
        startDate: 'from_date',
        endDate: 'to_date',
        reason: 'reason',
        status: 'status',
      }

      Object.entries(fieldMap).forEach(([key, column]) => {
        if (req.body[key] !== undefined) {
          values.push(req.body[key])
          updates.push(`${column} = $${values.length}`)
        }
      })
    }

    if (updates.length === 0) {
      return sendError(res, 'VALIDATION_ERROR', 'No valid fields provided for update', {}, 400)
    }

    values.push(Number(req.params.id))
    values.push(req.user.organizationId)

    const result = await pool.query(
      `
        UPDATE leaves
        SET ${updates.join(', ')}
        WHERE id = $${values.length - 1} AND organization_id = $${values.length}
        RETURNING id
      `,
      values
    )

    if (!result.rows[0]) return sendError(res, 'NOT_FOUND', 'Leave not found', {}, 404)

    const updated = await pool.query(`${leaveSelect} WHERE l.id = $1`, [result.rows[0].id])
    const updatedLeave = normalizeLeave(updated.rows[0])

    if (isApprovalAction && existingLeave?.userId) {
      try {
        await transitionLeaveWorkflowInstance({
          organizationId: req.user.organizationId,
          leaveId: updatedLeave.id,
          actorUserId: req.user.id,
          finalStatus: updatedLeave.status,
          comments: req.body?.comments || '',
        })
      } catch (_workflowError) {
        // Keep approval path resilient even if workflow tracking fails.
      }

      const reviewerLabel = req.user?.fullName || req.user?.email || 'A reviewer'
      await createInAppNotification({
        organizationId: req.user.organizationId,
        userId: existingLeave.userId,
        title: `Leave ${updatedLeave.status}`,
        message: `${reviewerLabel} marked your leave request as ${updatedLeave.status}.`,
        type: 'workflow',
        resourceType: 'leave',
        resourceId: updatedLeave.id,
      })

      await sendEmailNotificationStub({
        organizationId: req.user.organizationId,
        userId: existingLeave.userId,
        recipientEmail: existingLeave.requesterEmail,
        template: 'leave_decision',
        context: {
          employeeName: existingLeave.employeeName,
          reviewerName: reviewerLabel,
          status: updatedLeave.status,
          leaveType: existingLeave.leaveType,
          startDate: existingLeave.startDate,
          endDate: existingLeave.endDate,
        },
        resourceType: 'leave',
        resourceId: updatedLeave.id,
      })
    }

    return sendSuccess(res, updatedLeave)
  } catch (_error) {
    return sendError(res, 'SERVER_ERROR', 'Failed to update leave request', {}, 500)
  }
}

export const getPendingLeaveApprovals = async (req, res) => {
  try {
    const role = req.user?.role
    if (!['department_manager', 'hr_manager', 'super_admin', 'institute_admin'].includes(role)) {
      return sendError(res, 'FORBIDDEN', 'Only managers or HR can view pending approvals', {}, 403)
    }

    const { page, limit, offset } = req.pagination || { page: 1, limit: 20, offset: 0 }

    let query = `
      ${leaveSelect}
      WHERE l.organization_id = $1 AND l.status = 'pending'
      ORDER BY l.created_at DESC
      LIMIT $2 OFFSET $3
    `
    let params = [req.user.organizationId, limit, offset]
    let countQuery = `SELECT COUNT(*)::int AS total FROM leaves WHERE organization_id = $1 AND status = 'pending'`
    let countParams = [req.user.organizationId]

    if (role === 'department_manager') {
      query = `
        ${leaveSelect}
        WHERE l.organization_id = $1
          AND l.status = 'pending'
          AND l.employee_id IN (
            SELECT id
            FROM employees
            WHERE organization_id = $1
              AND manager_id = (
                SELECT id
                FROM employees
                WHERE organization_id = $1 AND user_id = $2
                LIMIT 1
              )
          )
        ORDER BY l.created_at DESC
        LIMIT $3 OFFSET $4
      `
      params = [req.user.organizationId, req.user.id, limit, offset]
      countQuery = `
        SELECT COUNT(*)::int AS total
        FROM leaves l
        WHERE l.organization_id = $1
          AND l.status = 'pending'
          AND l.employee_id IN (
            SELECT id
            FROM employees
            WHERE organization_id = $1
              AND manager_id = (
                SELECT id
                FROM employees
                WHERE organization_id = $1 AND user_id = $2
                LIMIT 1
              )
          )
      `
      countParams = [req.user.organizationId, req.user.id]
    }

    const { rows } = await pool.query(query, params)
    const count = await pool.query(countQuery, countParams)
    return sendPaginated(res, rows.map(normalizeLeave), page, limit, count.rows[0]?.total || 0)
  } catch (_error) {
    return sendError(res, 'SERVER_ERROR', 'Failed to fetch pending leave approvals', {}, 500)
  }
}
