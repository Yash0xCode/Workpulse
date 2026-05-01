import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { NotificationProvider } from './context/NotificationContext.jsx'
import { setModuleToken } from './services/apiClient.js'
import { logout as logoutService } from './services/authService.js'
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
import Performance from './pages/Performance/Performance.jsx'

const PAGE_META = {
  dashboard:   { title: 'Dashboard',       subtitle: 'Executive summary' },
  manager:     { title: 'Manager Dashboard', subtitle: 'Team, attendance, and productivity' },
  employees:   { title: 'Employees',        subtitle: 'Directory & engagement' },
  tasks:       { title: 'Tasks',            subtitle: 'Sprint operations' },
  attendance:  { title: 'Attendance',       subtitle: 'Time tracking' },
  leave:       { title: 'Leave',            subtitle: 'Approvals & balances' },
  workflows:   { title: 'Workflow Center',  subtitle: 'Approval state and action history' },
  performance: { title: 'Performance',      subtitle: 'Team analytics' },
  payroll:     { title: 'Payroll',          subtitle: 'Compensation management' },
  recruitment: { title: 'Recruitment',      subtitle: 'Jobs, applicants, interviews' },
  analytics:   { title: 'Analytics',        subtitle: 'Insights & ML predictions' },
  students:    { title: 'Students',         subtitle: 'Academic directory' },
  placement:   { title: 'Placement',        subtitle: 'Drive & offer tracking' },
}

function AppInner() {
  const { token, setToken, user, setUser, logout, loading } = useAuth()
  const [route, setRoute] = useState(token ? 'app' : 'login')
  const [appPage, setAppPage] = useState('dashboard')

  // Keep apiClient module-token in sync so services work without token prop
  useEffect(() => {
    setModuleToken(token)
  }, [token])

  // Sync route when auth state changes
  useEffect(() => {
    if (!loading) {
      setRoute(token && user ? 'app' : 'login')
    }
  }, [token, user, loading])

  const pageMeta = useMemo(() => PAGE_META[appPage] ?? PAGE_META.dashboard, [appPage])

  const handleLoginComplete = (payload) => {
    if (payload?.token) setToken(payload.token)
    if (payload?.user) setUser(payload.user)
    setRoute('app')
    setAppPage('dashboard')
  }

  const handleLogout = () => {
    logoutService()
    logout()
    setRoute('login')
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <span style={{ color: 'var(--wp-text-muted, #888)' }}>Loading…</span>
      </div>
    )
  }

  if (route === 'signup') {
    return (
      <Signup
        onNavigate={setRoute}
        onComplete={handleLoginComplete}
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
        onLogout={handleLogout}
      >
        {appPage === 'dashboard'    && <Dashboard token={token} user={user} />}
        {appPage === 'manager'      && <ManagerDashboard token={token} />}
        {appPage === 'employees'    && <EmployeesPage token={token} user={user} />}
        {appPage === 'tasks'        && <Tasks token={token} user={user} />}
        {appPage === 'attendance'   && <Attendance token={token} user={user} />}
        {appPage === 'leave'        && <Leave token={token} user={user} />}
        {appPage === 'payroll'      && <Payroll token={token} user={user} />}
        {appPage === 'recruitment'  && <Recruitment token={token} user={user} />}
        {appPage === 'performance'  && <Performance token={token} user={user} />}
        {appPage === 'workflows'    && <WorkflowCenter token={token} user={user} />}
        {appPage === 'analytics'    && <Analytics token={token} user={user} />}
        {!Object.keys(PAGE_META).includes(appPage) && (
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
      onLogin={handleLoginComplete}
    />
  )
}

function App() {
  return (
    <AuthProvider>
      <NotificationProviderBridge />
    </AuthProvider>
  )
}

// Bridge that sits inside AuthProvider so NotificationProvider can use useAuth()
function NotificationProviderBridge() {
  return (
    <NotificationProvider>
      <AppInner />
    </NotificationProvider>
  )
}

export default App
