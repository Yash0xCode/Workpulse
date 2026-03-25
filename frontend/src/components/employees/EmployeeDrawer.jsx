import Button from '../common/Button.jsx'

function EmployeeDrawer({ employee, onClose, onEdit }) {
  if (!employee) return null

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside className="drawer" onClick={(event) => event.stopPropagation()}>
        <div className="drawer-header">
          <div>
            <div className="employee-name">{employee.name}</div>
            <div className="employee-role">{employee.role}</div>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="drawer-body">
          <div className="drawer-section">
            <h4>Personal info</h4>
            <p>{employee.location}</p>
            <p>Employee ID: {employee.id}</p>
            <span className={`status-pill ${employee.statusKey}`}>{employee.status}</span>
          </div>
          <div className="drawer-section">
            <h4>Job details</h4>
            <p>Department: {employee.department}</p>
            <p>Manager: {employee.manager}</p>
            <p>Start date: {employee.startDate}</p>
            <p>
              Attrition risk: {(employee.attritionRisk || 'unknown').toUpperCase()} ({Math.round((employee.attritionProbability || 0) * 100)}%)
            </p>
          </div>
          <div className="drawer-section">
            <h4>Contact info</h4>
            <p>{employee.email}</p>
            <p>{employee.phone}</p>
          </div>
        </div>

        <div className="drawer-footer">
          {onEdit && (
            <Button variant="outline" onClick={() => onEdit(employee)}>
              Edit employee
            </Button>
          )}
          <Button onClick={() => window.open(`mailto:${employee.email}`, '_blank', 'noopener,noreferrer')}>
            Message
          </Button>
        </div>
      </aside>
    </div>
  )
}

export default EmployeeDrawer
