import { useEffect, useMemo, useState } from 'react'
import './App.css'
import Login from './pages/Auth/Login.jsx'
import Signup from './pages/Auth/Signup.jsx'
import AppLayout from './layouts/AppLayout.jsx'
import Dashboard from './pages/Dashboard/Dashboard.jsx'
import EmployeesPage from './pages/Employees/EmployeesPage.jsx'
import Tasks from './pages/Tasks/Tasks.jsx'
import Attendance from './pages/Attendance/Attendance.jsx'
import Leave from './pages/Leave/Leave.jsx'
import WorkflowCenter from './pages/Workflows/WorkflowCenter.jsx'
import ManagerDashboard from './pages/Manager/ManagerDashboard.jsx'
import Analytics from './pages/Analytics/Analytics.jsx'
import Payroll from './pages/Payroll/Payroll.jsx'
import Recruitment from './pages/Recruitment/Recruitment.jsx'
import { getMe, logout } from './services/authService.js'

function App() {
  const [route, setRoute] = useState(localStorage.getItem('workpulse_token') ? 'app' : 'login')
  const [user, setUser] = useState(null)
  const [appPage, setAppPage] = useState('dashboard')
  const [token, setToken] = useState(localStorage.getItem('workpulse_token') || '')

  useEffect(() => {
    if (!token || user) return
    getMe(token)
      .then((response) => {
        if (response?.user) {
          setUser(response.user)
        }
      })
      .catch(() => {
        logout()
        setToken('')
        setRoute('login')
      })
  }, [token, user])

  const pageMeta = useMemo(() => {
    const meta = {
      dashboard: { title: 'Dashboard', subtitle: 'Executive summary' },
      manager: { title: 'Manager Dashboard', subtitle: 'Team, attendance, and productivity' },
      employees: { title: 'Employees', subtitle: 'Directory & engagement' },
      tasks: { title: 'Tasks', subtitle: 'Sprint operations' },
      attendance: { title: 'Attendance', subtitle: 'Time tracking' },
      leave: { title: 'Leave', subtitle: 'Approvals & balances' },
      workflows: { title: 'Workflow Center', subtitle: 'Approval state and action history' },
      performance: { title: 'Performance', subtitle: 'Team analytics' },
      payroll: { title: 'Payroll', subtitle: 'Compensation management' },
      recruitment: { title: 'Recruitment', subtitle: 'Jobs, applicants, interviews' },
      reports: { title: 'Reports', subtitle: 'Insights & exports' },
      settings: { title: 'Settings', subtitle: 'Organization controls' },
      students: { title: 'Students', subtitle: 'Academic directory' },
      placement: { title: 'Placement', subtitle: 'Drive & offer tracking' },
      analytics: { title: 'Analytics', subtitle: 'Insights & ML predictions' },
    }

    return meta[appPage] ?? meta.dashboard
  }, [appPage])

  if (route === 'signup') {
    return (
      <Signup
        onNavigate={(nextRoute) => {
          setRoute(nextRoute)
        }}
        onComplete={(payload) => {
          if (payload?.token) {
            localStorage.setItem('workpulse_token', payload.token)
            setToken(payload.token)
          }
          if (payload?.user) {
            setUser(payload.user)
          }
          setRoute('app')
          setAppPage('dashboard')
        }}
      />
    )
  }

  if (route === 'app') {
    return (
      <AppLayout
        activePage={appPage}
        onNavigate={setAppPage}
        role={user?.role || 'employee'}
        pageMeta={pageMeta}
        user={user}
        token={token}
        onLogout={() => {
          logout()
          setToken('')
          setUser(null)
          setRoute('login')
        }}
      >
        {appPage === 'dashboard' && <Dashboard token={token} user={user} />}
        {appPage === 'manager' && <ManagerDashboard token={token} />}
        {appPage === 'employees' && <EmployeesPage token={token} user={user} />}
        {appPage === 'tasks' && <Tasks token={token} user={user} />}
        {appPage === 'attendance' && <Attendance token={token} user={user} />}
        {appPage === 'leave' && <Leave token={token} user={user} />}
        {appPage === 'payroll' && <Payroll token={token} user={user} />}
        {appPage === 'recruitment' && <Recruitment token={token} user={user} />}
        {appPage === 'workflows' && <WorkflowCenter token={token} user={user} />}
        {appPage === 'analytics' && <Analytics token={token} user={user} />}
        {!['dashboard', 'manager', 'employees', 'tasks', 'attendance', 'leave', 'payroll', 'recruitment', 'workflows', 'analytics'].includes(appPage) && (
          <div className="placeholder">
            <h2>Section in progress</h2>
            <p>We are crafting this workspace module with enterprise-grade UX patterns.</p>
          </div>
        )}
      </AppLayout>
    )
  }

  return (
    <Login
      onNavigate={setRoute}
      onLogin={(payload) => {
        if (payload?.token) {
          localStorage.setItem('workpulse_token', payload.token)
          setToken(payload.token)
        }
        if (payload?.user) {
          setUser(payload.user)
        }
        setRoute('app')
        setAppPage('dashboard')
      }}
    />
  )
}

export default App