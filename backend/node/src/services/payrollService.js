import { pool } from '../config/db.js'

let payrollInfraReady = false

export const ensurePayrollInfrastructure = async () => {
  if (payrollInfraReady) return

  await pool.query(
    `
      CREATE TABLE IF NOT EXISTS payroll_runs (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        period_year INTEGER NOT NULL,
        period_month INTEGER NOT NULL,
        pay_date DATE,
        status VARCHAR(30) NOT NULL DEFAULT 'draft',
        total_employees INTEGER NOT NULL DEFAULT 0,
        total_gross NUMERIC(14,2) NOT NULL DEFAULT 0,
        total_deductions NUMERIC(14,2) NOT NULL DEFAULT 0,
        total_net NUMERIC(14,2) NOT NULL DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (organization_id, period_year, period_month)
      )
    `
  )

  await pool.query(
    `
      CREATE TABLE IF NOT EXISTS payroll_entries (
        id SERIAL PRIMARY KEY,
        run_id INTEGER NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
        employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
        employee_name VARCHAR(255),
        department VARCHAR(120),
        gross_pay NUMERIC(14,2) NOT NULL DEFAULT 0,
        deductions NUMERIC(14,2) NOT NULL DEFAULT 0,
        net_pay NUMERIC(14,2) NOT NULL DEFAULT 0,
        components JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (run_id, employee_id)
      )
    `
  )

  await pool.query(
    `
      CREATE INDEX IF NOT EXISTS idx_payroll_runs_org_period
        ON payroll_runs(organization_id, period_year DESC, period_month DESC)
    `
  )

  await pool.query(
    `
      CREATE INDEX IF NOT EXISTS idx_payroll_entries_run
        ON payroll_entries(run_id)
    `
  )

  payrollInfraReady = true
}

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
  await ensurePayrollInfrastructure()
  const runs = await pool.query(
    `
      SELECT
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
      LIMIT $2 OFFSET $3
    `,
    [organizationId, limit, offset]
  )

  const totalResult = await pool.query(
    `SELECT COUNT(*)::int AS total FROM payroll_runs WHERE organization_id = $1`,
    [organizationId]
  )

  return { rows: runs.rows, total: totalResult.rows[0]?.total || 0 }
}

export const getPayrollRun = async ({ organizationId, runId }) => {
  await ensurePayrollInfrastructure()
  const { rows } = await pool.query(
    `
      SELECT
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
      LIMIT 1
    `,
    [organizationId, Number(runId)]
  )

  return rows[0] || null
}

export const getPayrollEntries = async ({ organizationId, runId }) => {
  await ensurePayrollInfrastructure()
  const { rows } = await pool.query(
    `
      SELECT
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
      ORDER BY pe.id
    `,
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
  await ensurePayrollInfrastructure()
  const { yearNum, monthNum } = validatePeriod(periodYear, periodMonth)

  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const existing = await client.query(
      `
        SELECT id
        FROM payroll_runs
        WHERE organization_id = $1 AND period_year = $2 AND period_month = $3
        LIMIT 1
      `,
      [organizationId, yearNum, monthNum]
    )

    if (existing.rows[0]) {
      throw new Error('Payroll run already exists for this period')
    }

    const employees = await client.query(
      `
        SELECT id, name, department, salary
        FROM employees
        WHERE organization_id = $1
      `,
      [organizationId]
    )

    const baseComponents = employees.rows.map((emp) => {
      const gross = coerceNumber(emp.salary)
      const deductions = 0
      const net = gross - deductions
      return {
        employeeId: emp.id,
        employeeName: emp.name,
        department: emp.department || null,
        gross,
        deductions,
        net,
        components: { base: gross, deductions },
      }
    })

    let totalEmployees = baseComponents.length
    let totalGross = 0
    let totalDeductions = 0
    let totalNet = 0

    for (const comp of baseComponents) {
      totalGross += comp.gross
      totalDeductions += comp.deductions
      totalNet += comp.net
    }

    const runInsert = await client.query(
      `
        INSERT INTO payroll_runs (
          organization_id,
          period_year,
          period_month,
          pay_date,
          status,
          total_employees,
          total_gross,
          total_deductions,
          total_net,
          notes
        )
        VALUES ($1, $2, $3, $4, 'completed', $5, $6, $7, $8, $9)
        RETURNING id
      `,
      [
        organizationId,
        yearNum,
        monthNum,
        payDate ? new Date(payDate) : null,
        totalEmployees,
        totalGross,
        totalDeductions,
        totalNet,
        notes || '',
      ]
    )

    const runId = runInsert.rows[0].id

    for (const comp of baseComponents) {
      await client.query(
        `
          INSERT INTO payroll_entries (
            run_id,
            employee_id,
            employee_name,
            department,
            gross_pay,
            deductions,
            net_pay,
            components
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
        `,
        [
          runId,
          comp.employeeId,
          comp.employeeName,
          comp.department,
          comp.gross,
          comp.deductions,
          comp.net,
          JSON.stringify(comp.components),
        ]
      )
    }

    await client.query('COMMIT')
    return {
      id: runId,
      periodYear: yearNum,
      periodMonth: monthNum,
      totalEmployees,
      totalGross,
      totalDeductions,
      totalNet,
    }
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
  await ensurePayrollInfrastructure()

  const run = await pool.query(
    `
      SELECT id, status
      FROM payroll_runs
      WHERE id = $1 AND organization_id = $2
      LIMIT 1
    `,
    [Number(runId), organizationId]
  )

  const currentRun = run.rows[0]
  if (!currentRun) throw new Error('Payroll run not found')
  if (currentRun.status === 'paid') throw new Error('Paid runs cannot be modified')

  const gross = coerceNumber(grossPay)
  const ded = coerceNumber(deductions)
  const net = gross - ded

  const { rows } = await pool.query(
    `
      INSERT INTO payroll_entries (
        run_id,
        employee_id,
        employee_name,
        department,
        gross_pay,
        deductions,
        net_pay,
        components
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
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
        updated_at AS "updatedAt"
    `,
    [Number(runId), Number(employeeId), employeeName || null, department || null, gross, ded, net, JSON.stringify(components || {})]
  )

  return rows[0]
}