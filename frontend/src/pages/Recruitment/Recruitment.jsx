import { useEffect, useMemo, useState } from 'react'
import {
  createApplication,
  createJob,
  listApplications,
  listJobs,
  updateApplicationStatus,
} from '../../services/recruitmentService.js'

const defaultJob = { title: '', department: '', location: '', description: '' }
const defaultCandidate = { jobId: '', name: '', email: '', phone: '', source: '', experienceYears: '', status: 'applied' }

function Recruitment({ token = '' }) {
  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [selectedJobId, setSelectedJobId] = useState(null)
  const [jobForm, setJobForm] = useState(defaultJob)
  const [candidateForm, setCandidateForm] = useState(defaultCandidate)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const statusOptions = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected']

  const selectedJob = useMemo(() => jobs.find((j) => j.id === selectedJobId) || null, [jobs, selectedJobId])

  const loadJobs = async () => {
    setError('')
    const result = await listJobs(token)
    const rows = result?.data || []
    setJobs(rows)
    if (!selectedJobId && rows.length > 0) {
      setSelectedJobId(rows[0].id)
    }
  }

  const loadApplications = async (jobId) => {
    setError('')
    const result = await listApplications({ jobId }, token)
    setApplications(result?.data || [])
  }

  useEffect(() => {
    loadJobs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  useEffect(() => {
    if (selectedJobId) {
      loadApplications(selectedJobId)
    } else {
      setApplications([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedJobId])

  const handleCreateJob = async () => {
    if (!jobForm.title) return
    setBusy(true)
    setError('')
    try {
      await createJob(jobForm, token)
      setJobForm(defaultJob)
      await loadJobs()
    } catch (err) {
      setError(err.message || 'Failed to create job')
    } finally {
      setBusy(false)
    }
  }

  const handleCreateApplication = async () => {
    if (!candidateForm.jobId) return
    setBusy(true)
    setError('')
    try {
      await createApplication(
        {
          jobId: Number(candidateForm.jobId),
          candidate: {
            name: candidateForm.name,
            email: candidateForm.email,
            phone: candidateForm.phone,
            experienceYears: Number(candidateForm.experienceYears || 0),
            skills: [],
          },
          source: candidateForm.source,
          notes: candidateForm.notes,
        },
        token
      )
      setCandidateForm({ ...defaultCandidate, jobId: candidateForm.jobId })
      await loadApplications(candidateForm.jobId)
    } catch (err) {
      setError(err.message || 'Failed to create application')
    } finally {
      setBusy(false)
    }
  }

  const handleStatusChange = async (applicationId, status) => {
    setBusy(true)
    setError('')
    try {
      await updateApplicationStatus(applicationId, { status }, token)
      await loadApplications(selectedJobId)
    } catch (err) {
      setError(err.message || 'Failed to update status')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <h2>Recruitment</h2>
          <p>Manage job openings and advance candidates through hiring stages.</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="grid-2" style={{ gap: 16 }}>
        <div className="card">
          <div className="card-header">
            <h4>Job Openings</h4>
            <span>{jobs.length} listed</span>
          </div>
          <div className="inline-form" style={{ marginBottom: 12 }}>
            <input
              placeholder="Title"
              value={jobForm.title}
              onChange={(e) => setJobForm((p) => ({ ...p, title: e.target.value }))}
            />
            <input
              placeholder="Department"
              value={jobForm.department}
              onChange={(e) => setJobForm((p) => ({ ...p, department: e.target.value }))}
            />
            <input
              placeholder="Location"
              value={jobForm.location}
              onChange={(e) => setJobForm((p) => ({ ...p, location: e.target.value }))}
            />
            <button type="button" className="btn btn-primary" onClick={handleCreateJob} disabled={busy || !jobForm.title}>
              Post Job
            </button>
          </div>
          <textarea
            rows={3}
            placeholder="Description"
            value={jobForm.description}
            onChange={(e) => setJobForm((p) => ({ ...p, description: e.target.value }))}
          />
          <div className="list-table" style={{ marginTop: 12 }}>
            <div className="list-table-head">
              <span>Title</span>
              <span>Department</span>
              <span>Status</span>
            </div>
            {jobs.map((job) => (
              <button
                key={job.id}
                type="button"
                className={`list-row ${selectedJobId === job.id ? 'active' : ''}`}
                onClick={() => setSelectedJobId(job.id)}
              >
                <span>{job.title}</span>
                <span>{job.department || '—'}</span>
                <span className="pill pill-green">{job.status}</span>
              </button>
            ))}
            {jobs.length === 0 && <div className="list-empty">No openings posted yet.</div>}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h4>Applications</h4>
            {selectedJob && <span>{selectedJob.title}</span>}
          </div>

          {selectedJobId && (
            <div className="inline-form" style={{ marginBottom: 10 }}>
              <select value={candidateForm.jobId || selectedJobId} onChange={(e) => setCandidateForm((p) => ({ ...p, jobId: e.target.value }))}>
                <option value="">Select job</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </select>
              <input
                placeholder="Candidate name"
                value={candidateForm.name}
                onChange={(e) => setCandidateForm((p) => ({ ...p, name: e.target.value }))}
              />
              <input
                placeholder="Email"
                value={candidateForm.email}
                onChange={(e) => setCandidateForm((p) => ({ ...p, email: e.target.value }))}
              />
              <input
                placeholder="Phone"
                value={candidateForm.phone}
                onChange={(e) => setCandidateForm((p) => ({ ...p, phone: e.target.value }))}
              />
              <input
                type="number"
                min="0"
                step="0.5"
                placeholder="Exp (years)"
                value={candidateForm.experienceYears}
                onChange={(e) => setCandidateForm((p) => ({ ...p, experienceYears: e.target.value }))}
                style={{ width: 110 }}
              />
              <input
                placeholder="Source"
                value={candidateForm.source}
                onChange={(e) => setCandidateForm((p) => ({ ...p, source: e.target.value }))}
              />
              <button type="button" className="btn btn-primary" onClick={handleCreateApplication} disabled={busy || !candidateForm.jobId || !candidateForm.name}>
                Add Applicant
              </button>
            </div>
          )}

          {applications.length === 0 && <div className="list-empty">No applications for this job yet.</div>}
          {applications.length > 0 && (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Contact</th>
                    <th>Status</th>
                    <th>Update</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id}>
                      <td>
                        <div>{app.candidateName}</div>
                        <div className="muted">{app.jobTitle}</div>
                      </td>
                      <td>
                        <div>{app.candidateEmail || '—'}</div>
                        <div className="muted">{app.candidatePhone || '—'}</div>
                      </td>
                      <td>
                        <span className="pill pill-blue">{app.status}</span>
                      </td>
                      <td>
                        <select onChange={(e) => handleStatusChange(app.id, e.target.value)} value={app.status} disabled={busy}>
                          {statusOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default Recruitment
