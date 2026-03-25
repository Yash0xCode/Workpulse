import Input from '../common/Input.jsx'
import Select from '../common/Select.jsx'

const viewOptions = [
  { label: 'Table', value: 'table' },
  { label: 'Cards', value: 'cards' },
]

function EmployeeFilters({
  search,
  department,
  status,
  view,
  departments,
  statuses,
  onSearch,
  onDepartment,
  onStatus,
  onView,
}) {
  return (
    <div className="employees-filters">
      <Input
        id="employeeSearch"
        label="Search"
        placeholder="Search by name, role, department"
        value={search}
        onChange={(event) => onSearch(event.target.value)}
      />
      <Select
        id="employeeDepartment"
        label="Department"
        options={departments}
        value={department}
        onChange={(event) => onDepartment(event.target.value)}
      />
      <Select
        id="employeeStatus"
        label="Status"
        options={statuses}
        value={status}
        onChange={(event) => onStatus(event.target.value)}
      />
      <Select
        id="employeeView"
        label="View"
        options={viewOptions}
        value={view}
        onChange={(event) => onView(event.target.value)}
      />
    </div>
  )
}

export default EmployeeFilters
