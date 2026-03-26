import { Icon } from '../common/Icons.jsx'
import Logo from '../branding/Logo.jsx'
import { ROLE_LABELS } from '../../constants/rbac.js'

const ALL_ROLES = [
  'super_admin', 'hr_manager', 'department_manager', 'employee',
  'recruiter', 'institute_admin', 'faculty', 'student', 'placement_officer',
]

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', key: 'dashboard', icon: 'dashboard', roles: ALL_ROLES },
      { label: 'Manager View', key: 'manager', icon: 'briefcase', roles: ['department_manager', 'hr_manager', 'super_admin'] },
    ],
  },
  {
    label: 'Workforce',
    items: [
      { label: 'Employees', key: 'employees', icon: 'users', roles: ['department_manager', 'hr_manager', 'super_admin', 'recruiter', 'institute_admin'] },
      { label: 'Attendance', key: 'attendance', icon: 'clock', roles: ['super_admin', 'hr_manager', 'department_manager', 'employee', 'institute_admin', 'faculty', 'student'] },
      { label: 'Leave', key: 'leave', icon: 'calendar', roles: ['super_admin', 'hr_manager', 'department_manager', 'employee', 'institute_admin', 'faculty'] },
        { label: 'Recruitment', key: 'recruitment', icon: 'briefcase', roles: ['super_admin', 'hr_manager', 'department_manager', 'recruiter', 'institute_admin'] },
      { label: 'Performance', key: 'performance', icon: 'award', roles: ['super_admin', 'hr_manager', 'department_manager', 'institute_admin'] },
      { label: 'Workflows', key: 'workflows', icon: 'activity', roles: ['super_admin', 'hr_manager', 'department_manager', 'employee', 'institute_admin', 'faculty', 'student'] },
      { label: 'Tasks', key: 'tasks', icon: 'tasks', roles: ALL_ROLES },
        { label: 'Payroll', key: 'payroll', icon: 'creditCard', roles: ['super_admin', 'hr_manager', 'department_manager', 'institute_admin'] },
    ],
  },
  {
    label: 'Insights',
    items: [
      { label: 'Analytics', key: 'analytics', icon: 'barChart', roles: ['super_admin', 'hr_manager', 'department_manager', 'institute_admin', 'placement_officer'] },
    ],
  },
]

function Sidebar({ collapsed = false, activeItem = 'dashboard', onSelect, role = 'employee', user, onToggle }) {
  const initials = (user?.fullName || 'WP')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <aside className={`app-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <Logo variant={collapsed ? 'icon' : 'full'} size={28} />
        <button
          type="button"
          className="sidebar-toggle-btn"
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Icon name={collapsed ? 'chevronRight' : 'chevronLeft'} size={15} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {NAV_SECTIONS.map((section) => {
          const visible = section.items.filter((item) => item.roles.includes(role))
          if (visible.length === 0) return null
          return (
            <div key={section.label} className="nav-section">
              {!collapsed && <div className="nav-section-label">{section.label}</div>}
              {visible.map((item) => (
                <button
                  key={item.key}
                  className={`sidebar-link ${activeItem === item.key ? 'active' : ''}`}
                  type="button"
                  onClick={() => onSelect?.(item.key)}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon name={item.icon} size={18} />
                  {!collapsed && <span>{item.label}</span>}
                </button>
              ))}
            </div>
          )
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-profile">
          <div className="avatar">{initials}</div>
          {!collapsed && (
            <div className="sidebar-user-info">
              <div className="sidebar-name">{user?.fullName || 'WorkPulse User'}</div>
              <div className="sidebar-role">{ROLE_LABELS[role] || role}</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
