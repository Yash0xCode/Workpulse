import { useEffect, useMemo, useState } from 'react'
import { createPayrollRun, getPayrollEntries, getPayrollRun, getPayrollRuns, upsertPayrollEntry } from '../../services/payrollService.js'

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1

function formatMoney(value) {
  const n = Number(value || 0)
  return n.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
}

function Payroll({ token = '' }) {
  const [runs, setRuns] = useState([])
  const [selectedRun, setSelectedRun] = useState(null)
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ periodYear: currentYear, periodMonth: currentMonth, payDate: '' })
  const [entryForm, setEntryForm] = useState({ employeeId: '', employeeName: '', department: '', grossPay: '', deductions: '' })

  const totals = useMemo(() => {
    return {
      gross: entries.reduce((sum, item) => sum + Number(item.grossPay || 0), 0),
      deductions: entries.reduce((sum, item) => sum + Number(item.deductions || 0), 0),
      net: entries.reduce((sum, item) => sum + Number(item.netPay || 0), 0),
    }
  }, [entries])

  const loadEntries = async (runId) => {
    const detail = await getPayrollRun(runId, token)
    setSelectedRun(detail?.data || null)
    const result = await getPayrollEntries(runId, token)
    setEntries(result?.data || [])
  }

  const loadRuns = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await getPayrollRuns(token, { limit: 20 })
      const rows = response?.data || []
      setRuns(rows)
      if (rows.length > 0) {
        await loadEntries(rows[0].id)
      } else {
        setSelectedRun(null)
        setEntries([])
      }
    } catch (err) {
      setError(err.message || 'Failed to load payroll runs')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRun = async () => {
    setBusy(true)
    setError('')
    try {
      await createPayrollRun(
        {
          periodYear: Number(form.periodYear),
          periodMonth: Number(form.periodMonth),
          payDate: form.payDate || null,
          notes: 'Payroll generated from dashboard',
        },
        token
      )
      await loadRuns()
    } catch (err) {
      setError(err.message || 'Failed to create payroll run')
    } finally {
      setBusy(false)
    }
  }

  const handleUpsertEntry = async () => {
    if (!selectedRun?.id) return
    setBusy(true)
    setError('')
    try {
      await upsertPayrollEntry(
        selectedRun.id,
        {
          employeeId: Number(entryForm.employeeId),
          employeeName: entryForm.employeeName,
          department: entryForm.department,
          grossPay: Number(entryForm.grossPay || 0),
          deductions: Number(entryForm.deductions || 0),
        },
        token
      )
      await loadEntries(selectedRun.id)
    } catch (err) {
      setError(err.message || 'Failed to upsert payroll entry')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    loadRuns()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <h2>Payroll</h2>
          <p>Generate monthly runs and review payouts.</p>
        </div>
        <div className="inline-form">
          <label>
            Month
            <input
              type="number"
              min="1"
              max="12"
              value={form.periodMonth}
              onChange={(e) => setForm((p) => ({ ...p, periodMonth: e.target.value }))}
            />
          </label>
          <label>
            Year
            <input
              type="number"
              min="2000"
              max="2100"
              value={form.periodYear}
              onChange={(e) => setForm((p) => ({ ...p, periodYear: e.target.value }))}
            />
          </label>
          <label>
            Pay date
            <input
              type="date"
              value={form.payDate}
              onChange={(e) => setForm((p) => ({ ...p, payDate: e.target.value }))}
            />
          </label>
          <button type="button" className="btn btn-primary" onClick={handleCreateRun} disabled={busy}>
            Generate Run
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {loading && <div className="loading-row">Loading payroll…</div>}

      {!loading && (
        <div className="grid-2" style={{ gap: 16 }}>
          <div className="card">
            <div className="card-header">
              <h4>Payroll Runs</h4>
              <span>{runs.length} total</span>
            </div>
            <div className="list-table">
              <div className="list-table-head">
                <span>Period</span>
                <span>Status</span>
                <span>Net</span>
              </div>
              {runs.map((run) => (
                <button
                  key={run.id}
                  type="button"
                  className={`list-row ${selectedRun?.id === run.id ? 'active' : ''}`}
                  onClick={() => loadEntries(run.id)}
                >
                  <span>
                    {run.periodMonth}/{run.periodYear}
                  </span>
                  <span className="pill pill-green">{run.status}</span>
                  <span>{formatMoney(run.totalNet)}</span>
                </button>
              ))}
              {runs.length === 0 && <div className="list-empty">No payroll runs yet.</div>}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4>Entries</h4>
              {selectedRun && (
                <span>
                  {selectedRun.periodMonth}/{selectedRun.periodYear} · {selectedRun.totalEmployees || entries.length} employees
                </span>
              )}
            </div>
            {selectedRun && (
              <div className="inline-form" style={{ marginBottom: 10 }}>
                <input
                  placeholder="Employee ID"
                  value={entryForm.employeeId}
                  onChange={(e) => setEntryForm((p) => ({ ...p, employeeId: e.target.value }))}
                  style={{ width: 120 }}
                />
                <input
                  placeholder="Employee name"
                  value={entryForm.employeeName}
                  onChange={(e) => setEntryForm((p) => ({ ...p, employeeName: e.target.value }))}
                />
                <input
                  placeholder="Department"
                  value={entryForm.department}
                  onChange={(e) => setEntryForm((p) => ({ ...p, department: e.target.value }))}
                  style={{ width: 150 }}
                />
                <input
                  type="number"
                  placeholder="Gross"
                  value={entryForm.grossPay}
                  onChange={(e) => setEntryForm((p) => ({ ...p, grossPay: e.target.value }))}
                  style={{ width: 120 }}
                />
                <input
                  type="number"
                  placeholder="Deductions"
                  value={entryForm.deductions}
                  onChange={(e) => setEntryForm((p) => ({ ...p, deductions: e.target.value }))}
                  style={{ width: 120 }}
                />
                <button type="button" className="btn btn-primary" onClick={handleUpsertEntry} disabled={busy || !entryForm.employeeId}>
                  Add / Update Entry
                </button>
              </div>
            )}
            {entries.length === 0 && <div className="list-empty">Select or generate a payroll run to view entries.</div>}
            {entries.length > 0 && (
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Department</th>
                      <th>Gross</th>
                      <th>Deductions</th>
                      <th>Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr key={entry.id}>
                        <td>{entry.employeeName || '—'}</td>
                        <td>{entry.department || '—'}</td>
                        <td>{formatMoney(entry.grossPay)}</td>
                        <td>{formatMoney(entry.deductions)}</td>
                        <td>{formatMoney(entry.netPay)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <th colSpan={2}>Totals</th>
                      <th>{formatMoney(totals.gross)}</th>
                      <th>{formatMoney(totals.deductions)}</th>
                      <th>{formatMoney(totals.net)}</th>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

export default Payroll