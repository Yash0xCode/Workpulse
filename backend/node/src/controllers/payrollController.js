import { sendError, sendPaginated, sendSuccess } from '../utils/response.js'
import { createPayrollRun, getPayrollEntries, getPayrollRun, listPayrollRuns, upsertPayrollEntry } from '../services/payrollService.js'

export const getRuns = async (req, res) => {
  try {
    const { page = 1, limit = 20, offset = 0 } = req.pagination || {}
    const { rows, total } = await listPayrollRuns({
      organizationId: req.user.organizationId,
      limit,
      offset,
    })

    return sendPaginated(res, rows, page, limit, total)
  } catch (error) {
    return sendError(res, 'SERVER_ERROR', 'Failed to fetch payroll runs', {}, 500)
  }
}

export const createRun = async (req, res) => {
  try {
    const { periodYear, periodMonth, payDate, notes } = req.body || {}
    if (!periodYear || !periodMonth) {
      return sendError(res, 'VALIDATION_ERROR', 'periodYear and periodMonth are required', {}, 400)
    }

    const created = await createPayrollRun({
      organizationId: req.user.organizationId,
      periodYear,
      periodMonth,
      payDate,
      notes,
    })

    return sendSuccess(res, created, {}, 201)
  } catch (error) {
    const message = error.message || 'Failed to create payroll run'
    const statusCode = message.includes('exists for this period') ? 400 : 500
    return sendError(res, 'PAYROLL_CREATE_FAILED', message, {}, statusCode)
  }
}

export const getRunById = async (req, res) => {
  try {
    const run = await getPayrollRun({ organizationId: req.user.organizationId, runId: req.params.id })
    if (!run) return sendError(res, 'NOT_FOUND', 'Payroll run not found', {}, 404)
    return sendSuccess(res, run)
  } catch (_error) {
    return sendError(res, 'SERVER_ERROR', 'Failed to fetch payroll run', {}, 500)
  }
}

export const getRunEntries = async (req, res) => {
  try {
    const entries = await getPayrollEntries({ organizationId: req.user.organizationId, runId: req.params.id })
    return sendSuccess(res, entries)
  } catch (_error) {
    return sendError(res, 'SERVER_ERROR', 'Failed to fetch payroll entries', {}, 500)
  }
}

export const upsertEntry = async (req, res) => {
  try {
    const runId = Number(req.params.id)
    const employeeId = Number(req.body?.employeeId)
    if (!runId || !employeeId) {
      return sendError(res, 'VALIDATION_ERROR', 'runId and employeeId are required', {}, 400)
    }

    const entry = await upsertPayrollEntry({
      organizationId: req.user.organizationId,
      runId,
      employeeId,
      employeeName: req.body?.employeeName,
      department: req.body?.department,
      grossPay: req.body?.grossPay,
      deductions: req.body?.deductions,
      components: req.body?.components,
    })

    return sendSuccess(res, entry)
  } catch (error) {
    const message = error.message || 'Failed to upsert payroll entry'
    const code = message.includes('not found') ? 404 : 400
    return sendError(res, 'PAYROLL_ENTRY_FAILED', message, {}, code)
  }
}