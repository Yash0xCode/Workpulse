import { useEffect, useMemo, useState } from 'react'
import Button from '../../components/common/Button.jsx'
import Input from '../../components/common/Input.jsx'
import Select from '../../components/common/Select.jsx'
import { employees as employeeData } from '../../constants/employees.js'

const departments = [
  { label: 'All departments', value: 'all' },
  { label: 'People Ops', value: 'People Ops' },
  { label: 'Engineering', value: 'Engineering' },
  { label: 'Operations', value: 'Operations' },
  { label: 'Design', value: 'Design' },
  { label: 'Finance', value: 'Finance' },
]

const statuses = [
  { label: 'All statuses', value: 'all' },
  { label: 'Active', value: 'Active' },
  { label: 'On Leave', value: 'On Leave' },
  { label: 'Remote', value: 'Remote' },
]

const viewOptions = [
  { label: 'Table', value: 'table' },
  { label: 'Cards', value: 'cards' },
]

function Employees() {
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('all')
  const [status, setStatus] = useState('all')
  const [view, setView] = useState('table')
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formMode, setFormMode] = useState('add')
  const [formEmployee, setFormEmployee] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  const filteredEmployees = useMemo(() => {
    return employeeData.filter((employee) => {
      const matchesSearch = employee.name.toLowerCase().includes(search.toLowerCase())
      const matchesDepartment = department === 'all' || employee.department === department
      const matchesStatus = status === 'all' || employee.status === status
      return matchesSearch && matchesDepartment && matchesStatus
    })
  }, [search, department, status])

  const pageSize = 4
  const totalPages = Math.max(Math.ceil(filteredEmployees.length / pageSize), 1)
  const paginatedEmployees = filteredEmployees.slice((page - 1) * pageSize, page * pageSize)

  const handlePageChange = (nextPage) => {
    setPage(Math.min(Math.max(nextPage, 1), totalPages))
  }

  const openForm = (mode, employee = null) => {
    setFormMode(mode)
    setFormEmployee(employee)
    setIsFormOpen(true)
  }

  return (
    <div className="employees">
      <div className="section-header">
        <div>
          <h1>Employee Directory</h1>
          <p>Track workforce status, performance insights, and engagement health.</p>
        </div>
        <Button onClick={() => openForm('add')}>Add employee</Button>
      </div>

      <div className="filter-bar">
        <Input
          id="employeeSearch"
          label="Search"
          placeholder="Search by name"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(1)
          }}
        />
        <Select
          id="employeeDepartment"
          label="Department"
          options={departments}
          value={department}
          onChange={(event) => {
            setDepartment(event.target.value)
            setPage(1)
          }}
        />
        <Select
          id="employeeStatus"
          label="Status"
          options={statuses}
          value={status}
          onChange={(event) => {
            setStatus(event.target.value)
            setPage(1)
          }}
        />
        <Select
          id="employeeView"
          label="View"
          options={viewOptions}
          value={view}
          onChange={(event) => setView(event.target.value)}
        />
      </div>

      {loading ? (
        <div className="skeleton-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={`skeleton-${index}`} className="skeleton-card" />
          ))}
        </div>
      ) : view === 'table' ? (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Status</th>
                <th>Attendance</th>
                <th>Productivity</th>
                <th>Manager</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEmployees.map((employee) => (
                <tr key={employee.id} onClick={() => setSelectedEmployee(employee)}>
                  <td>
                    <div className="employee-cell">
                      <div className="avatar">{employee.name.split(' ').map((part) => part[0]).join('')}</div>
                      <div>
                        <div className="employee-name">{employee.name}</div>
                        <div className="employee-role">{employee.role}</div>
                      </div>
                    </div>
                  </td>
                  <td>{employee.department}</td>
                  <td>
                    <span className={`status-badge ${employee.status.toLowerCase().replace(' ', '-')}`}>
                      {employee.status}
                    </span>
                  </td>
                  <td>{employee.attendance}</td>
                  <td>{employee.productivity}</td>
                  <td>{employee.manager}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card-grid">
          {paginatedEmployees.map((employee) => (
            <button
              key={employee.id}
              className="employee-card"
              type="button"
              onClick={() => setSelectedEmployee(employee)}
            >
              <div className="employee-card-header">
                <div className="avatar">{employee.name.split(' ').map((part) => part[0]).join('')}</div>
                <div>
                  <div className="employee-name">{employee.name}</div>
                  <div className="employee-role">{employee.role}</div>
                </div>
              </div>
              <div className="employee-meta">
                <span>{employee.department}</span>
                <span>{employee.location}</span>
              </div>
              <div className="employee-stats">
                <div>
                  <div className="stat-label">Attendance</div>
                  <div className="stat-value">{employee.attendance}</div>
                </div>
                <div>
                  <div className="stat-label">Productivity</div>
                  <div className="stat-value">{employee.productivity}</div>
                </div>
              </div>
              <span className={`status-badge ${employee.status.toLowerCase().replace(' ', '-')}`}>
                {employee.status}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="pagination">
        <button type="button" onClick={() => handlePageChange(page - 1)}>
          Prev
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button type="button" onClick={() => handlePageChange(page + 1)}>
          Next
        </button>
      </div>

      {selectedEmployee && (
        <div className="drawer-overlay" onClick={() => setSelectedEmployee(null)}>
          <aside className="drawer" onClick={(event) => event.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <div className="employee-name">{selectedEmployee.name}</div>
                <div className="employee-role">{selectedEmployee.role}</div>
              </div>
              <button type="button" className="icon-btn" onClick={() => setSelectedEmployee(null)}>
                ✕
              </button>
            </div>
            <div className="drawer-body">
              <div className="drawer-section">
                <h4>Contact</h4>
                <p>{selectedEmployee.email}</p>
                <p>{selectedEmployee.phone}</p>
              </div>
              <div className="drawer-section">
                <h4>Details</h4>
                <p>Department: {selectedEmployee.department}</p>
                <p>Manager: {selectedEmployee.manager}</p>
                <p>Location: {selectedEmployee.location}</p>
              </div>
              <div className="drawer-section">
                <h4>Performance</h4>
                <div className="stat-row">
                  <span>Attendance</span>
                  <strong>{selectedEmployee.attendance}</strong>
                </div>
                <div className="stat-row">
                  <span>Productivity</span>
                  <strong>{selectedEmployee.productivity}</strong>
                </div>
              </div>
            </div>
            <div className="drawer-footer">
              <Button variant="outline" onClick={() => openForm('edit', selectedEmployee)}>
                Edit employee
              </Button>
              <Button>Schedule 1:1</Button>
            </div>
          </aside>
        </div>
      )}

      {isFormOpen && (
        <div className="modal-overlay" onClick={() => setIsFormOpen(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>{formMode === 'add' ? 'Add employee' : 'Edit employee'}</h3>
                <p>Keep workforce profiles consistent and audit-ready.</p>
              </div>
              <button type="button" className="icon-btn" onClick={() => setIsFormOpen(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="grid-2">
                <Input
                  id="firstName"
                  label="First name"
                  placeholder="Avery"
                  defaultValue={formEmployee?.name?.split(' ')[0] ?? ''}
                />
                <Input
                  id="lastName"
                  label="Last name"
                  placeholder="Reed"
                  defaultValue={formEmployee?.name?.split(' ')[1] ?? ''}
                />
              </div>
              <Input
                id="email"
                label="Work email"
                type="email"
                placeholder="name@company.com"
                defaultValue={formEmployee?.email ?? ''}
              />
              <Select
                id="department"
                label="Department"
                options={departments.slice(1)}
                defaultValue={formEmployee?.department}
              />
              <Select
                id="status"
                label="Status"
                options={statuses.slice(1)}
                defaultValue={formEmployee?.status}
              />
              <Input
                id="role"
                label="Role"
                placeholder="People Partner"
                defaultValue={formEmployee?.role ?? ''}
              />
            </div>
            <div className="modal-footer">
              <Button variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button>{formMode === 'add' ? 'Add employee' : 'Save changes'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Employees
