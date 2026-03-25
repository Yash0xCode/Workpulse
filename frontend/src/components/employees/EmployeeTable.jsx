import Button from '../common/Button.jsx'

function EmployeeTable({ employees, onView, onEdit, onDelete, canEdit = true, canDelete = false }) {
  return (
    <div className="employees-table">
      <table>
        <thead>
          <tr>
            <th>Employee</th>
            <th>Role</th>
            <th>Department</th>
            <th>Status</th>
            <th>Attrition Risk</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => (
            <tr key={employee.id}>
              <td>
                <div className="employee-cell">
                  <div className="avatar">{employee.initials}</div>
                  <div>
                    <div className="employee-name">{employee.name}</div>
                    <div className="employee-meta">{employee.location}</div>
                  </div>
                </div>
              </td>
              <td>
                <div className="employee-role">{employee.role}</div>
              </td>
              <td>{employee.department}</td>
              <td>
                <span className={`status-pill ${employee.statusKey}`}>{employee.status}</span>
              </td>
              <td>
                <span className={`status-pill risk-${employee.attritionRisk || 'unknown'}`}>
                  {(employee.attritionRisk || 'unknown').toUpperCase()}
                </span>
              </td>
              <td>
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default EmployeeTable
