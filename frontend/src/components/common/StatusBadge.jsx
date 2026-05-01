/**
 * StatusBadge – coloured pill for status labels.
 * Props:
 *   status  – raw status string (e.g. 'pending', 'approved', 'active', 'inactive')
 *   label   – optional display override
 */
const STATUS_MAP = {
  // Leave
  pending:   { cls: 'badge--warning', label: 'Pending' },
  approved:  { cls: 'badge--success', label: 'Approved' },
  rejected:  { cls: 'badge--danger',  label: 'Rejected' },
  // Employees
  active:    { cls: 'badge--success', label: 'Active' },
  inactive:  { cls: 'badge--muted',   label: 'Inactive' },
  'on leave': { cls: 'badge--warning', label: 'On Leave' },
  'on_leave': { cls: 'badge--warning', label: 'On Leave' },
  // Tasks
  backlog:      { cls: 'badge--muted',   label: 'Backlog' },
  'in-progress': { cls: 'badge--info',  label: 'In Progress' },
  progress:     { cls: 'badge--info',   label: 'In Progress' },
  review:       { cls: 'badge--warning', label: 'Review' },
  done:         { cls: 'badge--success', label: 'Done' },
  // Payroll
  completed: { cls: 'badge--success', label: 'Completed' },
  draft:     { cls: 'badge--muted',   label: 'Draft' },
  paid:      { cls: 'badge--info',    label: 'Paid' },
  // Recruitment
  applied:    { cls: 'badge--muted',   label: 'Applied' },
  screening:  { cls: 'badge--info',    label: 'Screening' },
  interview:  { cls: 'badge--warning', label: 'Interview' },
  offer:      { cls: 'badge--success', label: 'Offer' },
  hired:      { cls: 'badge--success', label: 'Hired' },
  // Workflow
  in_progress: { cls: 'badge--info',    label: 'In Progress' },
  // Performance
  planned:      { cls: 'badge--muted',   label: 'Planned' },
  in_progress_goal: { cls: 'badge--info', label: 'In Progress' },
  deferred:     { cls: 'badge--warning', label: 'Deferred' },
  submitted:    { cls: 'badge--info',    label: 'Submitted' },
  acknowledged: { cls: 'badge--success', label: 'Acknowledged' },
}

function StatusBadge({ status = '', label }) {
  const key = String(status).toLowerCase()
  const config = STATUS_MAP[key] || { cls: 'badge--muted', label: status }
  return (
    <span className={`status-badge ${config.cls}`}>
      {label ?? config.label}
    </span>
  )
}

export default StatusBadge
