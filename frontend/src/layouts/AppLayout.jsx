import { useState } from 'react'
import Sidebar from '../components/layout/Sidebar.jsx'
import TopNav from '../components/layout/TopNav.jsx'

function AppLayout({ children, activePage, onNavigate, role, pageMeta, user, token = '', onLogout }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="app-shell">
      <Sidebar
        collapsed={collapsed}
        activeItem={activePage}
        onSelect={onNavigate}
        role={role}
        user={user}
        onToggle={() => setCollapsed((prev) => !prev)}
      />
      <div className="app-main">
        <TopNav
          title={pageMeta?.title}
          subtitle={pageMeta?.subtitle}
          user={user}
          token={token}
          onLogout={onLogout}
        />
        <div className="app-content">
          {children}
        </div>
      </div>
    </div>
  )
}

export default AppLayout
