import Button from '../common/Button.jsx'

function EmployeeCards({ employees, onView, onEdit, onDelete, canEdit = true, canDelete = false }) {
  return (
    <div className="employee-cards">
      {employees.map((employee) => (
        <article key={employee.id} className="employee-card">
          <div className="employee-card-header">
            <div className="avatar">{employee.initials}</div>
            <div>
              <div className="employee-name">{employee.name}</div>
              <div className="employee-role">{employee.role}</div>
            </div>
          </div>
          <div className="employee-card-body">
            <div>
              <span className="employee-label">Department</span>
              <div>{employee.department}</div>
            </div>
            <div>
              <span className="employee-label">Location</span>
              <div>{employee.location}</div>
            </div>
            <div>
              <span className="employee-label">Manager</span>
              <div>{employee.manager}</div>
            </div>
            <div>
              <span className="employee-label">Attrition Risk</span>
              <div>{(employee.attritionRisk || 'unknown').toUpperCase()}</div>
            </div>
          </div>
          <div className="employee-card-footer">
            <span className={`status-pill ${employee.statusKey}`}>{employee.status}</span>
            <div className="employee-actions">
              <Button variant="outline" onClick={() => onView(employee)}>
                View
              </Button>
              {canEdit && <Button onClick={() => onEdit(employee)}>Edit</Button>}
              {canDelete && (
                <Button variant="outline" onClick={() => onDelete?.(employee)}>
                  Delete
                </Button>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

export default EmployeeCards
