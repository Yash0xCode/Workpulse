import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Button from '../../components/common/Button.jsx'
import { Icon } from '../../components/common/Icons.jsx'
import { getTeamAttendance } from '../../services/attendanceService.js'
import { getTeamEmployees } from '../../services/employeeService.js'
import { getTeamTasks } from '../../services/taskService.js'

const DEPT_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#0ea5e9', '#8b5cf6', '#ef4444']

const hoursByDate = (records) => {
  const map = new Map()
  records.forEach((item) => {
    if (!item.checkIn || !item.checkOut) return
    const date = new Date(item.checkIn).toISOString().slice(0, 10)
    const hours = (new Date(item.checkOut) - new Date(item.checkIn)) / 1000 / 3600
    map.set(date, (map.get(date) || 0) + hours)
  })
  return Array.from(map.entries())
    .sort((a, b) => (a[0] > b[0] ? 1 : -1))
    .slice(-7)
    .map(([date, value]) => ({ date: date.slice(5), value: Number(value.toFixed(1)) }))
}

function MemberCard({ member, color }) {
  const initials = (member.name || 'E').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className="member-card">
      <div className="member-avatar" style={{ background: color }}>
        {initials}
      </div>
      <div className="member-info">
        <div className="member-name">{member.name || '—'}</div>
        <div className="member-role">{member.designation || member.role || '—'}</div>
      </div>
      <div className="member-stats">
        <div className="member-stat">
          <span className="member-stat-val">{member.attendance || '—'}</span>
          <span className="member-stat-lbl">Attendance</span>
        </div>
        <div className="member-stat">
          <span className="member-stat-val">{member.productivity || '—'}</span>
          <span className="member-stat-lbl">Score</span>
        </div>
      </div>
    </div>
  )
}

function ManagerDashboard({ token = '' }) {
  const [teamMembers, setTeamMembers] = useState([])
  const [teamTasks, setTeamTasks] = useState([])
  const [attendance, setAttendance] = useState([])
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const [employeesRes, taskRes, attendanceRes] = await Promise.all([
          getTeamEmployees(token),
          getTeamTasks(token),
          getTeamAttendance(token),
        ])
        if (!mounted) return
        setTeamMembers(Array.isArray(employeesRes?.data) ? employeesRes.data : [])
        setTeamTasks(Array.isArray(taskRes?.data) ? taskRes.data : [])
        setAttendance(Array.isArray(attendanceRes?.data) ? attendanceRes.data : [])
      } catch (error) {
        if (!mounted) return
        setNotice(error.message || 'Unable to load manager dashboard data.')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [token])

  const attendanceChartData = useMemo(() => hoursByDate(attendance), [attendance])

  const tasksByStatus = useMemo(() => {
    const grouped = { backlog: [], 'in-progress': [], review: [], done: [] }
    teamTasks.forEach((task) => {
      const s = grouped[task.status] ? task.status : 'backlog'
      grouped[s].push(task)
    })
    return grouped
  }, [teamTasks])

  const averageProductivity = useMemo(() => {
    const vals = teamMembers.map((m) => Number(m.productivity || 0)).filter((v) => v > 0)
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0
  }, [teamMembers])

  const openTasks = teamTasks.filter((t) => t.status !== 'done').length
  const presentToday = attendance.filter((a) => {
    const d = a.checkIn ? new Date(a.checkIn).toISOString().slice(0, 10) : ''
    return d === new Date().toISOString().slice(0, 10)
  }).length

  return (
    <section className="manager-dashboard">
      <div className="section-header">
        <div>
          <h1>Manager Dashboard</h1>
          <p>Your team overview — attendance, tasks, and productivity at a glance.</p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          <Icon name="refresh" size={15} style={{ marginRight: 6 }} />
          Refresh
        </Button>
      </div>

      {notice && <div className="notice-bar">{notice}</div>}

      <div className="kpi-grid kpi-grid-4">
        <div className="kpi-card" style={{ '--kpi-accent': '#6366f1' }}>
          <div className="kpi-card-top">
            <div className="kpi-icon-wrap" style={{ background: '#6366f120', color: '#6366f1' }}>
              <Icon name="users" size={18} />
            </div>
          </div>
          <div className="kpi-value">{loading ? '—' : teamMembers.length}</div>
          <div className="kpi-label">Team Members</div>
        </div>
        <div className="kpi-card" style={{ '--kpi-accent': '#10b981' }}>
          <div className="kpi-card-top">
            <div className="kpi-icon-wrap" style={{ background: '#10b98120', color: '#10b981' }}>
              <Icon name="clock" size={18} />
            </div>
          </div>
          <div className="kpi-value">{loading ? '—' : presentToday}</div>
          <div className="kpi-label">Present Today</div>
        </div>
        <div className="kpi-card" style={{ '--kpi-accent': '#f59e0b' }}>
          <div className="kpi-card-top">
            <div className="kpi-icon-wrap" style={{ background: '#f59e0b20', color: '#f59e0b' }}>
              <Icon name="tasks" size={18} />
            </div>
          </div>
          <div className="kpi-value">{loading ? '—' : openTasks}</div>
          <div className="kpi-label">Open Tasks</div>
        </div>
        <div className="kpi-card" style={{ '--kpi-accent': '#8b5cf6' }}>
          <div className="kpi-card-top">
            <div className="kpi-icon-wrap" style={{ background: '#8b5cf620', color: '#8b5cf6' }}>
              <Icon name="trendingUp" size={18} />
            </div>
          </div>
          <div className="kpi-value">{loading ? '—' : averageProductivity}</div>
          <div className="kpi-label">Avg Productivity</div>
        </div>
      </div>

      <div className="section-subheader">
        <Icon name="users" size={16} />
        <h3>Team Members</h3>
      </div>
      {loading ? (
        <div className="loading-row">Loading team data…</div>
      ) : (
        <div className="member-cards-grid">
          {teamMembers.map((member, i) => (
            <MemberCard key={member.id} member={member} color={DEPT_COLORS[i % DEPT_COLORS.length]} />
          ))}
          {teamMembers.length === 0 && (
            <p style={{ color: 'var(--wp-text-muted)', padding: '12px 0' }}>No team members assigned yet.</p>
          )}
        </div>
      )}

      {attendanceChartData.length > 0 && (
        <div className="chart-card">
          <div className="chart-card-header">
            <div className="card-title">Team Attendance (Hours)</div>
            <div className="card-subtitle">Last 7 days</div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={attendanceChartData} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--wp-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="section-subheader">
        <Icon name="tasks" size={16} />
        <h3>Team Tasks</h3>
      </div>
      <div className="kanban-board">
        {Object.entries(tasksByStatus).map(([key, items]) => (
          <div key={key} className="kanban-column">
            <div className="kanban-header">
              <span>{key === 'in-progress' ? 'In Progress' : key.charAt(0).toUpperCase() + key.slice(1)}</span>
              <span className="kanban-count">{items.length}</span>
            </div>
            <div className="kanban-cards">
              {items.map((task) => (
                <article key={task.id} className="task-card">
                  <div className="task-title">{task.title}</div>
                  <div className="task-meta">
                    <span>{task.assignee || task.assigneeName || 'Unassigned'}</span>
                    <span>{task.dueDate || task.due_date || '—'}</span>
                  </div>
                  <div className={`priority ${(task.priority || 'medium').toLowerCase()}`}>
                    {task.priority || 'Medium'}
                  </div>
                </article>
              ))}
              {items.length === 0 && (
                <div className="kanban-empty">No tasks</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default ManagerDashboard

