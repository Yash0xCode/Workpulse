import { useState } from 'react'
import Button from '../common/Button.jsx'
import Input from '../common/Input.jsx'
import Select from '../common/Select.jsx'

function EmployeeModal({ mode = 'add', employee, departments, statuses, onClose, onSubmit, submitting = false }) {
  const [values, setValues] = useState({
    name: employee?.name ?? '',
    employeeId: employee?.employeeId ?? '',
    email: employee?.email ?? '',
    designation: employee?.designation ?? employee?.role ?? '',
    department: employee?.department ?? departments[0]?.value ?? '',
    manager: employee?.manager ?? '',
    skills: Array.isArray(employee?.skills) ? employee.skills.join(', ') : '',
    joiningDate: employee?.joiningDate ?? '',
    status: employee?.status ?? statuses[0]?.value ?? '',
    faceEnrollmentEnabled: false,
    faceEmbeddingDistance: '0.35',
    faceLivenessScore: '0.85',
  })
  const [errors, setErrors] = useState({})

  const updateField = (field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  const validate = () => {
    const nextErrors = {}
    if (!values.name) nextErrors.name = 'Name is required'
    if (!values.email) nextErrors.email = 'Email is required'
    if (!values.designation) nextErrors.designation = 'Designation is required'
    if (!values.department) nextErrors.department = 'Department is required'
    if (!values.status) nextErrors.status = 'Status is required'
    if (values.faceEnrollmentEnabled) {
      const embedding = Number(values.faceEmbeddingDistance)
      const liveness = Number(values.faceLivenessScore)
      if (Number.isNaN(embedding)) nextErrors.faceEmbeddingDistance = 'Embedding distance must be numeric'
      if (Number.isNaN(liveness)) nextErrors.faceLivenessScore = 'Liveness score must be numeric'
      if (!Number.isNaN(liveness) && (liveness < 0 || liveness > 1)) {
        nextErrors.faceLivenessScore = 'Liveness score must be between 0 and 1'
      }
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>{mode === 'add' ? 'Add employee' : 'Edit employee'}</h3>
            <p>Keep profiles consistent with your organizational directory.</p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <Input
            id="employeeCode"
            label="Employee ID"
            placeholder="EMP-2006"
            value={values.employeeId}
            onChange={(event) => updateField('employeeId', event.target.value)}
          />

          <Input
            id="employeeName"
            label="Full name"
            placeholder="Avery Reed"
            value={values.name}
            onChange={(event) => updateField('name', event.target.value)}
          />
          {errors.name && <span className="field-error">{errors.name}</span>}

          <Input
            id="employeeEmail"
            label="Work email"
            type="email"
            placeholder="name@company.com"
            value={values.email}
            onChange={(event) => updateField('email', event.target.value)}
          />
          {errors.email && <span className="field-error">{errors.email}</span>}

          <Input
            id="employeeRole"
            label="Designation"
            placeholder="HR Manager"
            value={values.designation}
            onChange={(event) => updateField('designation', event.target.value)}
          />
          {errors.designation && <span className="field-error">{errors.designation}</span>}

          <Select
            id="employeeDepartment"
            label="Department"
            options={departments}
            value={values.department}
            onChange={(event) => updateField('department', event.target.value)}
          />
          {errors.department && <span className="field-error">{errors.department}</span>}

          <Input
            id="employeeManager"
            label="Manager"
            placeholder="Amit Desai"
            value={values.manager}
            onChange={(event) => updateField('manager', event.target.value)}
          />

          <Input
            id="employeeSkills"
            label="Skills"
            placeholder="React, Node.js, SQL"
            value={values.skills}
            onChange={(event) => updateField('skills', event.target.value)}
          />

          <Input
            id="employeeJoiningDate"
            label="Joining Date"
            type="date"
            value={values.joiningDate}
            onChange={(event) => updateField('joiningDate', event.target.value)}
          />

          <Select
            id="employeeStatus"
            label="Status"
            options={statuses}
            value={values.status}
            onChange={(event) => updateField('status', event.target.value)}
          />
          {errors.status && <span className="field-error">{errors.status}</span>}

          {mode === 'add' && (
            <>
              <label className="checkbox" htmlFor="faceEnrollmentEnabled">
                <input
                  id="faceEnrollmentEnabled"
                  type="checkbox"
                  checked={values.faceEnrollmentEnabled}
                  onChange={(event) => updateField('faceEnrollmentEnabled', event.target.checked)}
                />
                <span>Enroll face profile for future attendance verification</span>
              </label>

              {values.faceEnrollmentEnabled && (
                <>
                  <Input
                    id="faceEmbeddingDistance"
                    label="Embedding Distance"
                    placeholder="0.35"
                    value={values.faceEmbeddingDistance}
                    onChange={(event) => updateField('faceEmbeddingDistance', event.target.value)}
                  />
                  {errors.faceEmbeddingDistance && <span className="field-error">{errors.faceEmbeddingDistance}</span>}

                  <Input
                    id="faceLivenessScore"
                    label="Liveness Score"
                    placeholder="0.85"
                    value={values.faceLivenessScore}
                    onChange={(event) => updateField('faceLivenessScore', event.target.value)}
                  />
                  {errors.faceLivenessScore && <span className="field-error">{errors.faceLivenessScore}</span>}
                </>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={submitting}
            onClick={() => {
              if (validate()) {
                onSubmit?.({
                  ...values,
                  role: values.designation,
                  designation: values.designation,
                  skills: values.skills
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean),
                  faceEnrollment: {
                    enabled: values.faceEnrollmentEnabled,
                    embeddingDistance: Number(values.faceEmbeddingDistance),
                    livenessScore: Number(values.faceLivenessScore),
                  },
                })
              }
            }}
          >
            {submitting ? 'Saving...' : mode === 'add' ? 'Add employee' : 'Save changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default EmployeeModal
