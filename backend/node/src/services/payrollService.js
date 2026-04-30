/**
 * PayrollService — manages payroll runs and entries.
 * Tables are created via DATABASE_SCHEMA.sql (npm run db:init).
 * Salary breakdown uses salary_structures when available, falls back to employees.salary.
 */
import { pool } from '../config/db.js'

const coerceNumber = (value) => {
  const n = Number(value || 0)
  return Number.isFinite(n) ? n : 0
}

const validatePeriod = (periodYear, periodMonth) => {
  const yearNum = Number(periodYear)
  const monthNum = Number(periodMonth)
  if (!Number.isInteger(yearNum) || yearNum < 2000) throw new Error('Invalid period year')
  if (!Number.isInteger(monthNum) || monthNum < 1 || monthNum > 12) throw new Error('Invalid period month')
  return { yearNum, monthNum }
}

export const listPayrollRuns = async ({ organizationId, limit = 20, offset = 0 }) => {
  const runs = await pool.query(
    `SELECT
       id,
       organization_id AS "organizationId",
       period_year AS "periodYear",
       period_month AS "periodMonth",
       pay_date AS "payDate",
       status,
       total_employees AS "totalEmployees",
       total_gross AS "totalGross",
       total_deductions AS "totalDeductions",
       total_net AS "totalNet",
       created_at AS "createdAt"
     FROM payroll_runs
     WHERE organization_id = $1
     ORDER BY period_year DESC, period_month DESC
     LIMIT $2 OFFSET $3`,
    [organizationId, limit, offset]
  )

  const totalResult = await pool.query(
    `SELECT COUNT(*)::int AS total FROM payroll_runs WHERE organization_id = $1`,
    [organizationId]
  )

  return { rows: runs.rows, total: totalResult.rows[0]?.total || 0 }
}

export const getPayrollRun = async ({ organizationId, runId }) => {
  const { rows } = await pool.query(
    `SELECT
       id,
       organization_id AS "organizationId",
       period_year AS "periodYear",
       period_month AS "periodMonth",
       pay_date AS "payDate",
       status,
       total_employees AS "totalEmployees",
       total_gross AS "totalGross",
       total_deductions AS "totalDeductions",
       total_net AS "totalNet",
       notes,
       created_at AS "createdAt",
       updated_at AS "updatedAt"
     FROM payroll_runs
     WHERE organization_id = $1 AND id = $2
     LIMIT 1`,
    [organizationId, Number(runId)]
  )
  return rows[0] || null
}

export const getPayrollEntries = async ({ organizationId, runId }) => {
  const { rows } = await pool.query(
    `SELECT
       pe.id,
       pe.run_id AS "runId",
       pe.employee_id AS "employeeId",
       pe.employee_name AS "employeeName",
       pe.department,
       pe.gross_pay AS "grossPay",
       pe.deductions,
       pe.net_pay AS "netPay",
       pe.components,
       pe.created_at AS "createdAt"
     FROM payroll_entries pe
     JOIN payroll_runs pr ON pr.id = pe.run_id
     WHERE pr.organization_id = $1 AND pr.id = $2
     ORDER BY pe.id`,
    [organizationId, Number(runId)]
  )
  return rows
}

export const createPayrollRun = async ({
  organizationId,
  periodYear,
  periodMonth,
  payDate = null,
  notes = '',
}) => {
  const { yearNum, monthNum } = validatePeriod(periodYear, periodMonth)

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const existing = await client.query(
      `SELECT id FROM payroll_runs
       WHERE organization_id = $1 AND period_year = $2 AND period_month = $3
       LIMIT 1`,
      [organizationId, yearNum, monthNum]
    )
    if (existing.rows[0]) throw new Error('Payroll run already exists for this period')

    // Fetch employees with their latest salary structure (falls back to employees.salary)
    const employees = await client.query(
      `SELECT
         e.id,
         e.name,
         e.department,
         COALESCE(ss.basic, e.salary, 0) AS basic,
         COALESCE(ss.hra, 0) AS hra,
         COALESCE(ss.transport_allowance, 0) AS transport_allowance,
         COALESCE(ss.medical_allowance, 0) AS medical_allowance,
         COALESCE(ss.other_allowances, 0) AS other_allowances,
         COALESCE(ss.pf_deduction, 0) AS pf_deduction,
         COALESCE(ss.tax_deduction, 0) AS tax_deduction,
         COALESCE(ss.other_deductions, 0) AS other_deductions
       FROM employees e
       LEFT JOIN LATERAL (
         SELECT * FROM salary_structures
         WHERE employee_id = e.id
         ORDER BY effective_date DESC
         LIMIT 1
       ) ss ON TRUE
       WHERE e.organization_id = $1 AND e.status = 'Active'`,
      [organizationId]
    )

    const baseComponents = employees.rows.map((emp) => {
      const basic = coerceNumber(emp.basic)
      const hra = coerceNumber(emp.hra)
      const transport = coerceNumber(emp.transport_allowance)
      const medical = coerceNumber(emp.medical_allowance)
      const other = coerceNumber(emp.other_allowances)
      const gross = basic + hra + transport + medical + other

      const pf = coerceNumber(emp.pf_deduction)
      const tax = coerceNumber(emp.tax_deduction)
      const otherDed = coerceNumber(emp.other_deductions)
      const deductions = pf + tax + otherDed
      const net = gross - deductions

      return {
        employeeId: emp.id,
        employeeName: emp.name,
        department: emp.department || null,
        gross,
        deductions,
        net,
        components: { basic, hra, transport, medical, other, pf, tax, otherDed },
      }
    })

    const totalEmployees = baseComponents.length
    const totalGross = baseComponents.reduce((s, c) => s + c.gross, 0)
    const totalDeductions = baseComponents.reduce((s, c) => s + c.deductions, 0)
    const totalNet = baseComponents.reduce((s, c) => s + c.net, 0)

    const runInsert = await client.query(
      `INSERT INTO payroll_runs
         (organization_id, period_year, period_month, pay_date, status,
          total_employees, total_gross, total_deductions, total_net, notes)
       VALUES ($1,$2,$3,$4,'completed',$5,$6,$7,$8,$9)
       RETURNING id`,
      [organizationId, yearNum, monthNum, payDate ? new Date(payDate) : null,
       totalEmployees, totalGross, totalDeductions, totalNet, notes || '']
    )

    const runId = runInsert.rows[0].id

    for (const comp of baseComponents) {
      await client.query(
        `INSERT INTO payroll_entries
           (run_id, employee_id, employee_name, department,
            gross_pay, deductions, net_pay, components)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)`,
        [runId, comp.employeeId, comp.employeeName, comp.department,
         comp.gross, comp.deductions, comp.net, JSON.stringify(comp.components)]
      )
    }

    await client.query('COMMIT')
    return { id: runId, periodYear: yearNum, periodMonth: monthNum,
             totalEmployees, totalGross, totalDeductions, totalNet }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export const upsertPayrollEntry = async ({
  organizationId,
  runId,
  employeeId,
  employeeName,
  department,
  grossPay = 0,
  deductions = 0,
  components = {},
}) => {
  const run = await pool.query(
    `SELECT id, status FROM payroll_runs
     WHERE id = $1 AND organization_id = $2 LIMIT 1`,
    [Number(runId), organizationId]
  )

  const currentRun = run.rows[0]
  if (!currentRun) throw new Error('Payroll run not found')
  if (currentRun.status === 'paid') throw new Error('Paid runs cannot be modified')

  const gross = coerceNumber(grossPay)
  const ded = coerceNumber(deductions)
  const net = gross - ded

  const { rows } = await pool.query(
    `INSERT INTO payroll_entries
       (run_id, employee_id, employee_name, department,
        gross_pay, deductions, net_pay, components)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)
     ON CONFLICT (run_id, employee_id) DO UPDATE SET
       employee_name = EXCLUDED.employee_name,
       department = EXCLUDED.department,
       gross_pay = EXCLUDED.gross_pay,
       deductions = EXCLUDED.deductions,
       net_pay = EXCLUDED.net_pay,
       components = EXCLUDED.components,
       updated_at = CURRENT_TIMESTAMP
     RETURNING
       id,
       run_id AS "runId",
       employee_id AS "employeeId",
       employee_name AS "employeeName",
       department,
       gross_pay AS "grossPay",
       deductions,
       net_pay AS "netPay",
       components,
       created_at AS "createdAt",
       updated_at AS "updatedAt"`,
    [Number(runId), Number(employeeId), employeeName || null, department || null,
     gross, ded, net, JSON.stringify(components || {})]
  )

  return rows[0]
}
