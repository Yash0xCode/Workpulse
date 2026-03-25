import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  getAttendanceAnalytics,
  getPlacementAnalytics,
  getProductivityAnalytics,
} from '../../services/analyticsService.js'

const TABS = [
  { key: 'attendance',  label: 'Attendance' },
  { key: 'productivity', label: 'Productivity' },
  { key: 'recruitment', label: 'Recruitment' },
]

function Analytics({ token = '' }) {
  const [tab, setTab] = useState('attendance')
  const [attendance, setAttendance] = useState({ labels: [], trend: [], average: 0, officeLocation: '' })
  const [productivity, setProductivity] = useState({ labels: [], productivity: [], attritionRiskDistribution: {}, employeeRisk: [] })
  const [placement, setPlacement] = useState({ applied: 0, shortlisted: 0, interviewed: 0, offers: 0, leaveSummary: {}, taskSummary: {}, placementStatistics: {} })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const [attendanceRes, productivityRes, placementRes] = await Promise.all([
          getAttendanceAnalytics(token),
          getProductivityAnalytics(token),
          getPlacementAnalytics(token),
        ])
        if (!mounted) return
        setAttendance(attendanceRes?.data || { labels: [], trend: [], average: 0 })
        setProductivity(productivityRes?.data || { labels: [], productivity: [], attritionRiskDistribution: {}, employeeRisk: [] })
        setPlacement(placementRes?.data || { applied: 0, shortlisted: 0, interviewed: 0, offers: 0, leaveSummary: {}, taskSummary: {} })
      } catch (err) {
        if (!mounted) return
        setError(err.message || 'Unable to load analytics')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [token])

  const attendanceChart = useMemo(
    () => attendance.labels.map((l, i) => ({ label: l, value: attendance.trend[i] || 0 })),
    [attendance]
  )

  const productivityChart = useMemo(
    () => productivity.labels.map((l, i) => ({ label: l, value: productivity.productivity[i] || 0 })),
    [productivity]
  )

  const attritionPie = useMemo(() => {
    const d = productivity.attritionRiskDistribution || {}
    return [
      { name: 'Low Risk', value: d.low || 0, color: '#22c55e' },
      { name: 'Medium Risk', value: d.medium || 0, color: '#f59e0b' },
      { name: 'High Risk', value: d.high || 0, color: '#ef4444' },
    ].filter((item) => item.value > 0)
  }, [productivity])

  const recruitmentFunnel = useMemo(
    () => [
      { stage: 'Applied', count: placement.applied || 0, fill: '#6366f1' },
      { stage: 'Shortlisted', count: placement.shortlisted || 0, fill: '#0ea5e9' },
      { stage: 'Interviewed', count: placement.interviewed || 0, fill: '#f59e0b' },
      { stage: 'Offers', count: placement.offers || 0, fill: '#10b981' },
    ],
    [placement]
  )

  const leavePie = useMemo(() => {
    const s = placement.leaveSummary || {}
    return [
      { name: 'Approved', value: s.approved || 0, color: '#22c55e' },
      { name: 'Pending', value: s.pending || 0, color: '#f59e0b' },
      { name: 'Rejected', value: s.rejected || 0, color: '#ef4444' },
    ].filter((item) => item.value > 0)
  }, [placement])

  return (
    <section className="analytics-page">
      {error && <div className="notice-bar">{error}</div>}

      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`tab-btn ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <div className="loading-row">Loading analytics…</div>}

      {!loading && tab === 'attendance' && (
        <div className="tab-content">
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-label">Average Attendance</div>
              <div className="kpi-value">{attendance.average ?? 0}<span className="kpi-suffix">%</span></div>
              <div className="kpi-trend">Last 7 days</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Office Location</div>
              <div className="kpi-value kpi-value--text">{attendance.officeLocation || '—'}</div>
              <div className="kpi-trend">Primary site</div>
            </div>
          </div>
          <div className="chart-card">
            <div className="chart-card-header">
              <div className="card-title">Daily Attendance %</div>
              <div className="card-subtitle">Last 7 days</div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={attendanceChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--wp-border)" />
                <XAxis dataKey="label" />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v) => [`${v}%`, 'Attendance']} />
                <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {!loading && tab === 'productivity' && (
        <div className="tab-content">
          <div className="chart-grid">
            <div className="chart-card">
              <div className="chart-card-header">
                <div className="card-title">Employee Productivity</div>
                <div className="card-subtitle">Top contributors</div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={productivityChart} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--wp-border)" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis type="category" dataKey="label" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => [v, 'Score']} />
                  <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-card">
              <div className="chart-card-header">
                <div className="card-title">Attrition Risk</div>
                <div className="card-subtitle">Distribution by risk band</div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={attritionPie} dataKey="value" nameKey="name" outerRadius={100} innerRadius={55} paddingAngle={4}>
                    {attritionPie.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="employees-table">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Productivity Score</th>
                  <th>Attrition Risk</th>
                  <th>Risk Band</th>
                </tr>
              </thead>
              <tbody>
                {(productivity.employeeRisk || []).map((emp, i) => (
                  <tr key={i}>
                    <td>{emp.name || '—'}</td>
                    <td>
                      <div className="progress-bar-wrap">
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${emp.productivity || 0}%`,
                              background: emp.riskBand === 'high' ? '#ef4444' : emp.riskBand === 'medium' ? '#f59e0b' : '#10b981',
                            }}
                          />
                        </div>
                        <span className="progress-label">{emp.productivity || 0}</span>
                      </div>
                    </td>
                    <td>{emp.attritionProbability != null ? `${(emp.attritionProbability * 100).toFixed(0)}%` : '—'}</td>
                    <td>
                      <span className={`status-pill risk-${emp.riskBand || 'low'}`}>
                        {emp.riskBand || 'low'}
                      </span>
                    </td>
                  </tr>
                ))}
                {(productivity.employeeRisk || []).length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '28px', color: 'var(--wp-text-muted)' }}>
                      No employee data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && tab === 'recruitment' && (
        <div className="tab-content">
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-label">Applied</div>
              <div className="kpi-value">{placement.applied}</div>
              <div className="kpi-trend">Total applicants</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Shortlisted</div>
              <div className="kpi-value">{placement.shortlisted}</div>
              <div className="kpi-trend">Cleared screening</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Interviewed</div>
              <div className="kpi-value">{placement.interviewed}</div>
              <div className="kpi-trend">Panel rounds done</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Offers Made</div>
              <div className="kpi-value">{placement.offers}</div>
              <div className="kpi-trend">
                {placement.applied > 0 ? `${Math.round((placement.offers / placement.applied) * 100)}% conversion` : '0% conversion'}
              </div>
            </div>
          </div>
          <div className="chart-grid">
            <div className="chart-card">
              <div className="chart-card-header">
                <div className="card-title">Recruitment Funnel</div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={recruitmentFunnel}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--wp-border)" />
                  <XAxis dataKey="stage" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {recruitmentFunnel.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-card">
              <div className="chart-card-header">
                <div className="card-title">Leave Status</div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={leavePie} dataKey="value" nameKey="name" outerRadius={100} innerRadius={55} paddingAngle={4}>
                    {leavePie.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default Analytics
