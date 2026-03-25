import { useState } from 'react'
import Button from '../../components/common/Button.jsx'
import Checkbox from '../../components/common/Checkbox.jsx'
import Input from '../../components/common/Input.jsx'
import SocialButton from '../../components/common/SocialButton.jsx'
import Logo from '../../components/branding/Logo.jsx'
import AuthLayout from '../../layouts/AuthLayout.jsx'
import { login as loginRequest } from '../../services/authService.js'

function Login({ onNavigate, onLogin }) {
  const [email, setEmail] = useState('admin@workpulse.in')
  const [password, setPassword] = useState('password123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const visual = (
    <>
      <div className="visual-hero">
        <span className="badge">Enterprise Workforce Platform</span>
        <h1>Focus the team. Accelerate performance.</h1>
        <p>
          WorkPulse unifies attendance, task orchestration, and performance insights in a
          single control center built for modern teams.
        </p>
      </div>

      <div className="visual-card-grid">
        <div className="visual-card">
          <h4>Live Productivity Pulse</h4>
          <p>Monitor focus time and deliverables in real time.</p>
        </div>
        <div className="visual-card">
          <h4>Smart Attendance</h4>
          <p>Automated punches, approvals, and audit-ready reports.</p>
        </div>
        <div className="visual-card">
          <h4>Performance Insights</h4>
          <p>Compare teams, highlight trends, and unlock coaching.</p>
        </div>
        <div className="visual-card">
          <h4>Payroll Ready</h4>
          <p>Accurate payout snapshots backed by time data.</p>
        </div>
      </div>
    </>
  )

  return (
    <AuthLayout visual={visual}>
      <div className="auth-card">
        <Logo />
        <h2>Welcome back</h2>
        <p>Log in to continue managing your workforce operations.</p>

        <form
          className="auth-form"
          onSubmit={async (event) => {
            event.preventDefault()
            setLoading(true)
            setError('')

            try {
              const response = await loginRequest({ email, password })
              onLogin?.({ token: response.token, user: response.user })
            } catch (apiError) {
              setError(apiError.message || 'Login failed. Please check credentials.')
            } finally {
              setLoading(false)
            }
          }}
        >
          <Input
            id="email"
            label="Work email"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Input
            id="password"
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {error && <div className="field-error">{error}</div>}

          <div className="row-between">
            <Checkbox id="remember" label="Remember me" />
            <a className="link" href="#">
              Forgot password?
            </a>
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>

          <div className="divider">or continue with</div>
          <div className="social-stack">
            <SocialButton>Continue with Google</SocialButton>
            <SocialButton>Continue with Microsoft</SocialButton>
          </div>

          <div className="auth-footer">
            New to WorkPulse?{' '}
            <a
              href="#"
              onClick={(event) => {
                event.preventDefault()
                onNavigate?.('signup')
              }}
            >
              Create an account
            </a>
          </div>
        </form>
      </div>
    </AuthLayout>
  )
}

export default Login
