import { useEffect, useState } from 'react'
import Button from '../../components/common/Button.jsx'
import Input from '../../components/common/Input.jsx'
import Select from '../../components/common/Select.jsx'
import { PERMISSIONS, hasPermission } from '../../constants/rbac.js'
import {
  approveLeave,
  createLeave,
  getLeaveBalances,
  getLeaveWorkflow,
  getLeaves,
  getPendingLeaveApprovals,
  updateLeave,
} from '../../services/leaveService.js'

const leaveTypes = [
  { label: 'Sick Leave', value: 'Sick Leave' },
  { label: 'Casual Leave', value: 'Casual Leave' },
  { label: 'Earned Leave', value: 'Earned Leave' },
  { label: 'Work From Home', value: 'Work From Home' },
]

const fallbackLeaves = [
  { id: 1, employeeId: 1, leaveType: 'Casual Leave', startDate: '2026-03-05', endDate: '2026-03-06', reason: 'Personal work', status: 'approved' },
  { id: 2, employeeId: 1, leaveType: 'Sick Leave', startDate: '2026-02-20', endDate: '2026-02-20', reason: 'Fever', status: 'approved' },
  { id: 3, employeeId: 1, leaveType: 'Earned Leave', startDate: '2026-04-10', endDate: '2026-04-14', reason: 'Vacation', status: 'pending' },
]

const statusColors = { pending: 'on-leave', approved: 'active', rejected: 'inactive' }

export default function Leave({ token = '', user }) {
  const [leaves, setLeaves] = useState(fallbackLeaves)
  const [leaveBalances, setLeaveBalances] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState({ leaveType: 'Casual Leave', startDate: '', endDate: '', reason: '' })
  const [workflowDetail, setWorkflowDetail] = useState(null)
  const [workflowLoadingId, setWorkflowLoadingId] = useState(null)

  const canApprove = hasPermission(user, PERMISSIONS.APPROVE_LEAVE)

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const load = async () => {
    try {
      const [leavesRes, approvalsRes, balancesRes] = await Promise.all([
        getLeaves(token),
        canApprove ? getPendingLeaveApprovals(token) : Promise.resolve({ data: [] }),
        getLeaveBalances(token, { year: new Date().getFullYear() }),
      ])

      const allLeaves = Array.isArray(leavesRes?.data) ? leavesRes.data : []
      const pendingApprovals = Array.isArray(approvalsRes?.data) ? approvalsRes.data : []
      const data = canApprove
        ? Array.from(new Map([...pendingApprovals, ...allLeaves].map((item) => [item.id, item])).values())
        : allLeaves
      if (data.length > 0) setLeaves(data)

      const balances = Array.isArray(balancesRes?.data?.balances) ? balancesRes.data.balances : []
      setLeaveBalances(balances)
    } catch {
      // keep fallback
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.startDate || !form.endDate) { setNotice('Please fill start and end dates.'); return }
    setSubmitting(true)
    try {
      const res = await createLeave({ ...form }, token)
      setLeaves((prev) => [res.data, ...prev])
      setNotice('Leave request submitted.')
    } catch {
      const fake = { id: Date.now(), ...form, employeeId: user?.id || 1, status: 'pending' }
      setLeaves((prev) => [fake, ...prev])
      setNotice('Demo mode: leave request recorded locally.')
    } finally {
      setSubmitting(false)
      setShowForm(false)
      setForm({ leaveType: 'Casual Leave', startDate: '', endDate: '', reason: '' })
    }
  }

  const handleCancel = async (id) => {
    try {
      await updateLeave(id, { status: 'cancelled' }, token)
    } catch { /* demo ok */ }
    setLeaves((prev) => prev.map((l) => (l.id === id ? { ...l, status: 'cancelled' } : l)))
  }

  const handleDecision = async (id, status) => {
    try {
      const payload = { status }
      if (status === 'rejected') {
        const reason = window.prompt('Add rejection reason (required):', 'Insufficient details provided')
        if (!reason || !reason.trim()) {
          setNotice('Rejection reason is required.')
          return
        }
        payload.comments = reason.trim()
      }

      const res = await approveLeave(id, payload, token)
      setLeaves((prev) => prev.map((item) => (item.id === id ? { ...item, ...res.data } : item)))
      setNotice(`Leave ${status} successfully.`)
    } catch (error) {
      setNotice(error.message || `Failed to ${status} leave.`)
    }
  }

  const handleViewWorkflow = async (leaveId) => {
    setWorkflowLoadingId(leaveId)
    try {
      const res = await getLeaveWorkflow(leaveId, token)
      setWorkflowDetail({ leaveId, ...res.data })
    } catch (error) {
      setNotice(error.message || 'Failed to load workflow details.')
    } finally {
      setWorkflowLoadingId(null)
    }
  }

  const pending = leaves.filter((l) => l.status === 'pending').length
  const approved = leaves.filter((l) => l.status === 'approved').length
  const totalAvailableDays = leaveBalances.reduce((sum, item) => sum + Number(item.availableDays || 0), 0)

  const [statusFilter, setStatusFilter] = useState('all')
  const visibleLeaves = statusFilter === 'all' ? leaves : leaves.filter((l) => l.status === statusFilter)

  return (
    <div className="leave-page">
      <div className="section-header">
        <div>
          <h1>Leave Management</h1>
          <p>Request, review, and approve employee time-off requests.</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : '+ Request Leave'}
        </Button>
      </div>

      {notice && <div className="notice-bar">{notice}</div>}

      <div className="leave-summary-row">
        <div className="leave-stat-card"><span className="ls-value">{pending}</span><span className="ls-label">Pending</span></div>
        <div className="leave-stat-card"><span className="ls-value">{approved}</span><span className="ls-label">Approved</span></div>
        <div className="leave-stat-card"><span className="ls-value">{totalAvailableDays.toFixed(1)}</span><span className="ls-label">Days Balance</span></div>
      </div>

      {leaveBalances.length > 0 && (
        <div className="leave-balance-grid">
          {leaveBalances.map((balance) => (
            <div key={balance.leaveType} className="leave-balance-item">
              <span className="leave-balance-type">{balance.leaveType}</span>
              <span className="leave-balance-value">{Number(balance.availableDays || 0).toFixed(1)} days</span>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <form className="leave-form" onSubmit={handleSubmit}>
          <h3>New Leave Request</h3>
          <Select id="leaveType" label="Leave type" options={leaveTypes} value={form.leaveType} onChange={(e) => set('leaveType', e.target.value)} />
          <div className="grid-2">
            <Input id="startDate" label="Start date" type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
            <Input id="endDate" label="End date" type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} />
          </div>
          <Input id="reason" label="Reason" placeholder="Brief reason for leave" value={form.reason} onChange={(e) => set('reason', e.target.value)} />
          <div className="form-actions">
            <Button type="submit" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit Request'}</Button>
          </div>
        </form>
      )}

      <div className="leave-filter-tabs">
        {['all', 'pending', 'approved', 'rejected'].map((s) => (
          <button
            key={s}
            type="button"
            className={`leave-filter-btn ${statusFilter === s ? 'active' : ''}`}
            onClick={() => setStatusFilter(s)}
          >
            {s === 'all' ? `All (${leaves.length})` : `${s.charAt(0).toUpperCase() + s.slice(1)} (${leaves.filter((l) => l.status === s).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-row">Loading leave records…</div>
      ) : (
        <div className="leave-table-wrap">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Type</th>
                <th>From</th>
                <th>To</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleLeaves.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '28px', color: 'var(--wp-text-muted)' }}>
                    No leave records found.
                  </td>
                </tr>
              )}
              {visibleLeaves.map((l) => (
                <tr key={l.id}>
                  <td>
                    <div className="employee-cell">
                      <div className="avatar" style={{ width: 28, height: 28, fontSize: '0.7rem' }}>
                        {(l.employeeName || l.employee_name || 'E').charAt(0).toUpperCase()}
                      </div>
                      <span>{l.employeeName || l.employee_name || '—'}</span>
                    </div>
                  </td>
                  <td>{l.leaveType || l.leave_type}</td>
                  <td>{l.startDate || l.start_date}</td>
                  <td>{l.endDate || l.end_date}</td>
                  <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.reason || '—'}</td>
                  <td><span className={`status-pill ${statusColors[l.status] || 'inactive'}`}>{l.status}</span></td>
                  <td>
                    <div className="leave-row-actions">
                      <button
                        type="button"
                        className="action-btn"
                        onClick={() => handleViewWorkflow(l.id)}
                        disabled={workflowLoadingId === l.id}
                      >
                        {workflowLoadingId === l.id ? 'Loading…' : 'Workflow'}
                      </button>
                      {l.status === 'pending' && canApprove && (
                        <>
                          <button
                            type="button"
                            className="action-btn approve"
                            onClick={() => handleDecision(l.id, 'approved')}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="action-btn reject"
                            onClick={() => handleDecision(l.id, 'rejected')}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {l.status === 'pending' && !canApprove && (
                        <button type="button" className="action-btn cancel" onClick={() => handleCancel(l.id)}>
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {workflowDetail && (
        <div className="chart-card" style={{ marginTop: 12 }}>
          <div className="card-title">Workflow Timeline (Leave #{workflowDetail.leaveId})</div>
          {Array.isArray(workflowDetail.actions) && workflowDetail.actions.length > 0 ? (
            <div className="employees-table" style={{ marginTop: 12 }}>
              <table>
                <thead>
                  <tr>
                    <th>Step</th>
                    <th>Actor</th>
                    <th>Action</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Comments</th>
                  </tr>
                </thead>
                <tbody>
                  {workflowDetail.actions.map((action) => (
                    <tr key={action.id}>
                      <td>{action.stepNo}</td>
                      <td>{action.actorName || 'System'}</td>
                      <td>{action.action}</td>
                      <td>{action.fromState || '—'}</td>
                      <td>{action.toState || '—'}</td>
                      <td>{action.comments || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ marginTop: 8, color: 'var(--wp-text-muted)' }}>No workflow history available yet.</div>
          )}
        </div>
      )}
    </div>
  )
}
