import { useEffect, useMemo, useState } from 'react'
import Button from '../../components/common/Button.jsx'
import EmployeeCards from '../../components/employees/EmployeeCards.jsx'
import EmployeeDrawer from '../../components/employees/EmployeeDrawer.jsx'
import EmployeeFilters from '../../components/employees/EmployeeFilters.jsx'
import EmployeeModal from '../../components/employees/EmployeeModal.jsx'
import EmployeeSkeleton from '../../components/employees/EmployeeSkeleton.jsx'
import EmployeeTable from '../../components/employees/EmployeeTable.jsx'
import { employees as employeeData } from '../../constants/employees.js'
import { PERMISSIONS, hasPermission } from '../../constants/rbac.js'
import { predictAttrition } from '../../services/mlService.js'
import {
  createEmployee,
  deleteEmployee,
  getEmployees as getEmployeesRequest,
  getTeamEmployees,
  updateEmployee,
} from '../../services/employeeService.js'

const departments = [
  { label: 'All departments', value: 'all' },
  { label: 'IT', value: 'IT' },
  { label: 'HR', value: 'HR' },
  { label: 'Finance', value: 'Finance' },
  { label: 'Operations', value: 'Operations' },
]

const statuses = [
  { label: 'All statuses', value: 'all' },
  { label: 'Active', value: 'Active' },
  { label: 'On Leave', value: 'On Leave' },
  { label: 'Inactive', value: 'Inactive' },
]

const normalizeEmployees = (employees) =>
  employees.map((employee, index) => ({
    id: employee.id || `EMP-${1000 + index}`,
    name: employee.name || employee.full_name || 'Unknown Employee',
    role: employee.role || employee.designation || 'Team Member',
    department: employee.department || 'General',
    location: employee.location || '—',
    status: employee.status || employee.employment_status || 'Active',
    email: employee.email || 'n/a@workpulse.com',
    phone: employee.phone || '—',
    manager: employee.manager || '—',
    startDate: employee.startDate || employee.date_of_joining || '—',
    joiningDate: employee.joiningDate || employee.startDate || employee.date_of_joining || '',
    attendance: employee.attendance || '—',
    productivity: employee.productivity || '—',
    employeeId: employee.employeeId || employee.employee_code || employee.id,
    skills: employee.skills || [],
    designation: employee.designation || employee.role || 'Team Member',
    attritionRisk: employee.attritionRisk || 'unknown',
    attritionProbability: employee.attritionProbability || 0,
    initials: (employee.name || employee.full_name || 'NA')
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2),
    statusKey: String(employee.status || employee.employment_status || 'active').toLowerCase().replace(' ', '-'),
  }))

function EmployeesPage({ token = '', user }) {
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('all')
  const [status, setStatus] = useState('all')
  const [view, setView] = useState('table')
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [modalState, setModalState] = useState({ open: false, mode: 'add', employee: null })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState(normalizeEmployees(employeeData))

  const canAdd = hasPermission(user, PERMISSIONS.ADD_EMPLOYEE)
  const canEdit = hasPermission(user, PERMISSIONS.EDIT_EMPLOYEE)
  const canDelete = hasPermission(user, PERMISSIONS.DELETE_EMPLOYEE)
  const isDepartmentManager = user?.role === 'department_manager'

  useEffect(() => {
    let mounted = true

    const loadEmployees = async () => {
      try {
        const response = isDepartmentManager
          ? await getTeamEmployees(token)
          : await getEmployeesRequest(token)
        const data = Array.isArray(response?.data) ? response.data : []
        if (!mounted) return
        const normalized = data.length > 0 ? normalizeEmployees(data) : normalizeEmployees(employeeData)

        const enriched = await Promise.all(
          normalized.map(async (employee, index) => {
            if (index > 6) return employee
            try {
              const attrition = await predictAttrition(
                {
                  salary: 45000 + index * 8000,
                  experience_years: 1 + index,
                  promotion_count: index % 3,
                  avg_work_hours: 42,
                  job_satisfaction: 0.6 + (index % 3) * 0.1,
                },
                token
              )
              const probability = attrition?.data?.attrition_probability ?? 0
              const risk = probability >= 0.5 ? 'high' : probability >= 0.3 ? 'medium' : 'low'
              return { ...employee, attritionProbability: probability, attritionRisk: risk }
            } catch {
              return employee
            }
          })
        )

        setRows(enriched)
      } catch (_error) {
        if (!mounted) return
        setRows(normalizeEmployees(employeeData))
      } finally {
        if (mounted) {
          setTimeout(() => setLoading(false), 350)
        }
      }
    }

    loadEmployees()

    return () => {
      mounted = false
    }
  }, [token, isDepartmentManager])

  const filteredEmployees = useMemo(() => {
    return rows.filter((employee) => {
      const matchesSearch =
        employee.name.toLowerCase().includes(search.toLowerCase()) ||
        employee.role.toLowerCase().includes(search.toLowerCase()) ||
        employee.department.toLowerCase().includes(search.toLowerCase())
      const matchesDepartment = department === 'all' || employee.department === department
      const matchesStatus = status === 'all' || employee.status === status
      return matchesSearch && matchesDepartment && matchesStatus
    })
  }, [rows, search, department, status])

  const pageSize = 5
  const totalPages = Math.max(Math.ceil(filteredEmployees.length / pageSize), 1)
  const paginatedEmployees = filteredEmployees.slice((page - 1) * pageSize, page * pageSize)

  const openModal = (mode, employee = null) => {
    setModalState({ open: true, mode, employee })
  }

  const closeModal = () => {
    setModalState({ open: false, mode: 'add', employee: null })
  }

  const handleSaveEmployee = async (payload) => {
    setSaving(true)
    try {
      if (modalState.mode === 'add') {
        const res = await createEmployee(payload, token)
        setRows((prev) => [normalizeEmployees([res.data])[0], ...prev])
        setNotice('Employee added successfully.')
      } else if (modalState.employee) {
        const res = await updateEmployee(modalState.employee.id, payload, token)
        const updated = normalizeEmployees([res.data])[0]
        setRows((prev) => prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)))
        setNotice('Employee updated successfully.')
      }
      closeModal()
    } catch (error) {
      setNotice(error.message || 'Failed to save employee.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteEmployee = async (employee) => {
    if (!window.confirm(`Delete ${employee.name}?`)) return
    try {
      await deleteEmployee(employee.id, token)
      setRows((prev) => prev.filter((item) => item.id !== employee.id))
      if (selectedEmployee?.id === employee.id) {
        setSelectedEmployee(null)
      }
      setNotice('Employee deleted successfully.')
    } catch (error) {
      setNotice(error.message || 'Failed to delete employee.')
    }
  }

  return (
    <section className="employees-page">
      <div className="section-header">
        <div>
          <h1>Employee Management</h1>
          <p>Manage profiles, departments, managers, and workforce ownership.</p>
        </div>
        {canAdd && <Button onClick={() => openModal('add')}>Add employee</Button>}
      </div>

      {notice && <div className="notice-bar">{notice}</div>}

      <EmployeeFilters
        search={search}
        department={department}
        status={status}
        view={view}
        departments={departments}
        statuses={statuses}
        onSearch={(value) => {
          setSearch(value)
          setPage(1)
        }}
        onDepartment={(value) => {
          setDepartment(value)
          setPage(1)
        }}
        onStatus={(value) => {
          setStatus(value)
          setPage(1)
        }}
        onView={setView}
      />

      {loading ? (
        <EmployeeSkeleton count={4} />
      ) : view === 'table' ? (
        <EmployeeTable
          employees={paginatedEmployees}
          onView={setSelectedEmployee}
          onEdit={(employee) => canEdit && openModal('edit', employee)}
          onDelete={handleDeleteEmployee}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      ) : (
        <EmployeeCards
          employees={paginatedEmployees}
          onView={setSelectedEmployee}
          onEdit={(employee) => canEdit && openModal('edit', employee)}
          onDelete={handleDeleteEmployee}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      )}

      <div className="pagination">
        <button type="button" onClick={() => setPage((prev) => Math.max(prev - 1, 1))}>
          Prev
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button type="button" onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}>
          Next
        </button>
      </div>

      <EmployeeDrawer
        employee={selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
        onEdit={canEdit ? (employee) => openModal('edit', employee) : null}
      />

      {modalState.open && (
        <EmployeeModal
          mode={modalState.mode}
          employee={modalState.employee}
          departments={departments.slice(1)}
          statuses={statuses.slice(1)}
          onClose={closeModal}
          onSubmit={handleSaveEmployee}
          submitting={saving}
        />
      )}
    </section>
  )
}

export default EmployeesPage
