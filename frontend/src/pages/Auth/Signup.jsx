import { useState } from 'react'
import Logo from '../../components/branding/Logo.jsx'
import Button from '../../components/common/Button.jsx'
import Input from '../../components/common/Input.jsx'
import Stepper from '../../components/common/Stepper.jsx'
import Select from '../../components/common/Select.jsx'
import AuthLayout from '../../layouts/AuthLayout.jsx'
import { signup as signupRequest } from '../../services/authService.js'

const steps = [
  {
    label: 'Type',
    caption: 'Choose organization mode',
  },
  {
    label: 'Register',
    caption: 'Organization details',
  },
  {
    label: 'Launch',
    caption: 'Create super admin workspace',
  },
]

const orgTypes = [
  { label: 'Corporate', value: 'corporate' },
  { label: 'Educational Institution', value: 'education' },
]

function Signup({ onNavigate, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [organizationType, setOrganizationType] = useState('corporate')
  const [organizationName, setOrganizationName] = useState('WorkPulse Demo Corporate')
  const [adminName, setAdminName] = useState('Rahul Patel')
  const [adminEmail, setAdminEmail] = useState('admin@workpulse.in')
  const [adminPassword, setAdminPassword] = useState('password123')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState('')

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0))

  const visual = (
    <>
      <div className="visual-hero">
        <span className="badge">Guided Onboarding</span>
        <h1>Create your organization in three clear steps.</h1>
        <p>
          Start with Corporate or Education mode, register your organization, and launch a
          super-admin workspace instantly.
        </p>
      </div>

      <div className="visual-card-grid">
        <div className="visual-card">
          <h4>Corporate + Education Modes</h4>
          <p>Purpose-built role sets for HRMS and academic ERP operations.</p>
        </div>
        <div className="visual-card">
          <h4>Super Admin Control</h4>
          <p>Create your organization owner account during registration.</p>
        </div>
        <div className="visual-card">
          <h4>Role-Based Access</h4>
          <p>Secure actions like leave approvals, employee edits, and task assignment.</p>
        </div>
        <div className="visual-card">
          <h4>Ready Dashboard</h4>
          <p>Land directly into admin workspace with seeded operational data.</p>
        </div>
      </div>
    </>
  )

  return (
    <AuthLayout visual={visual}>
      <div className="auth-card auth-card--wide">
        <Logo />
        <h2>Create Organization</h2>
        <p>Set up your WorkPulse organization and launch your admin dashboard.</p>

        <Stepper steps={steps} currentStep={currentStep} />

        <div className="onboarding-panel">
          {currentStep === 0 && (
            <div className="onboarding-step">
              <Select
                id="organizationType"
                label="Organization Type"
                options={orgTypes}
                value={organizationType}
                onChange={(event) => setOrganizationType(event.target.value)}
              />
            </div>
          )}

          {currentStep === 1 && (
            <div className="onboarding-step">
              <Input
                id="organizationName"
                label="Organization Name"
                placeholder="WorkPulse Demo Corporate"
                value={organizationName}
                onChange={(event) => setOrganizationName(event.target.value)}
              />
              <Input
                id="adminEmail"
                label="Email"
                type="email"
                placeholder="admin@workpulse.in"
                value={adminEmail}
                onChange={(event) => setAdminEmail(event.target.value)}
              />
              <Input
                id="adminName"
                label="Admin Name"
                placeholder="Rahul Patel"
                value={adminName}
                onChange={(event) => setAdminName(event.target.value)}
              />
              <Input
                id="adminPassword"
                label="Password"
                type="password"
                placeholder="Minimum 8 characters"
                value={adminPassword}
                onChange={(event) => setAdminPassword(event.target.value)}
              />
            </div>
          )}

          {currentStep === 2 && (
            <div className="onboarding-step">
              <div className="invite-note">
                Final check before creating organization:
                <br />
                <strong>{organizationName}</strong> ({organizationType === 'corporate' ? 'Corporate' : 'Educational Institution'})
                <br />
                Super Admin: <strong>{adminName}</strong> ({adminEmail})
              </div>
              {summary && <div className="notice-bar">{summary}</div>}
            </div>
          )}
        </div>

        <div className="onboarding-actions">
          <Button variant="outline" onClick={prevStep} disabled={currentStep === 0}>
            Back
          </Button>
          {currentStep < steps.length - 1 ? (
            <Button onClick={nextStep}>Continue</Button>
          ) : (
            <Button
              onClick={async () => {
                if (!organizationName || !adminEmail || !adminName || !adminPassword) {
                  setError('Please complete all required fields.')
                  return
                }

                setSubmitting(true)
                setError('')
                try {
                  const response = await signupRequest({
                    organizationName,
                    organizationType,
                    email: adminEmail,
                    password: adminPassword,
                    adminName,
                  })
                  setSummary('Organization created. Launching dashboard...')
                  onComplete?.({ token: response.token, user: response.user })
                } catch (apiError) {
                  setError(apiError.message || 'Unable to create organization.')
                }
                setSubmitting(false)
              }}
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create Organization'}
            </Button>
          )}
        </div>

        {error && <div className="field-error">{error}</div>}

        <div className="auth-footer">
          Already have an account?{' '}
          <a
            href="#"
            onClick={(event) => {
              event.preventDefault()
              onNavigate?.('login')
            }}
          >
            Sign in
          </a>
        </div>
      </div>
    </AuthLayout>
  )
}

export default Signup
