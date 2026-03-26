import { useEffect, useMemo, useState } from 'react'
import Button from '../../components/common/Button.jsx'
import { addFeedback, createGoal, createReview, listGoals, listReviews, updateGoal } from '../../services/performanceService.js'

const goalStatuses = [
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'deferred', label: 'Deferred' },
]

const reviewStatuses = [
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'acknowledged', label: 'Acknowledged' },
]

const defaultGoal = { employeeId: '', title: '', description: '', weight: 1, status: 'planned' }
const defaultReview = { employeeId: '', periodStart: '', periodEnd: '', overallRating: '', summary: '', status: 'submitted' }

function Performance({ token = '', user }) {
  const [goals, setGoals] = useState([])
  const [reviews, setReviews] = useState([])
  const [goalForm, setGoalForm] = useState(defaultGoal)
  const [reviewForm, setReviewForm] = useState(defaultReview)
  const [feedbackNotes, setFeedbackNotes] = useState({})
  const [goalEdits, setGoalEdits] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)

  const managerView = useMemo(() => ['hr_manager', 'department_manager', 'super_admin', 'institute_admin'].includes(user?.role), [user?.role])

  const loadGoals = async () => {
    const result = await listGoals({}, token)
    const rows = result?.data || []
    setGoals(rows)
    const edits = {}
    rows.forEach((g) => {
      edits[g.id] = { status: g.status, progress: g.progress }
    })
    setGoalEdits(edits)
  }

  const loadReviews = async () => {
    const result = await listReviews({}, token)
    setReviews(result?.data || [])
  }

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      setError('')
      try {
        await Promise.all([loadGoals(), loadReviews()])
      } catch (err) {
        setError(err.message || 'Failed to load performance data')
      } finally {
        setLoading(false)
      }
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const handleCreateGoal = async () => {
    if (!goalForm.title || !goalForm.employeeId) return
    setBusy(true)
    setError('')
    try {
      await createGoal(
        {
          employeeId: Number(goalForm.employeeId),
          title: goalForm.title,
          description: goalForm.description,
          weight: Number(goalForm.weight || 1),
          status: goalForm.status,
        },
        token
      )
      setGoalForm(defaultGoal)
      await loadGoals()
    } catch (err) {
      setError(err.message || 'Failed to create goal')
    } finally {
      setBusy(false)
    }
  }

  const handleUpdateGoal = async (goalId) => {
    const edits = goalEdits[goalId]
    if (!edits) return
    setBusy(true)
    setError('')
    try {
      await updateGoal(
        goalId,
        {
          status: edits.status,
          progress: Number(edits.progress ?? 0),
        },
        token
      )
      await loadGoals()
    } catch (err) {
      setError(err.message || 'Failed to update goal')
    } finally {
      setBusy(false)
    }
  }

  const handleCreateReview = async () => {
    if (!reviewForm.employeeId) return
    setBusy(true)
    setError('')
    try {
      await createReview(
        {
          employeeId: Number(reviewForm.employeeId),
          periodStart: reviewForm.periodStart || null,
          periodEnd: reviewForm.periodEnd || null,
          overallRating: reviewForm.overallRating ? Number(reviewForm.overallRating) : 0,
          summary: reviewForm.summary,
          status: reviewForm.status,
        },
        token
      )
      setReviewForm(defaultReview)
      await loadReviews()
    } catch (err) {
      setError(err.message || 'Failed to create review')
    } finally {
      setBusy(false)
    }
  }

  const handleAddFeedback = async (reviewId) => {
    const comment = feedbackNotes[reviewId]
    if (!comment) return
    setBusy(true)
    setError('')
    try {
      await addFeedback(reviewId, { comment, sentiment: 'positive' }, token)
      setFeedbackNotes((prev) => ({ ...prev, [reviewId]: '' }))
      await loadReviews()
    } catch (err) {
      setError(err.message || 'Failed to add feedback')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <h2>Performance</h2>
          <p>Set goals, record reviews, and capture feedback in one place.</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {loading && <div className="loading-row">Loading performance workspace…</div>}

      {!loading && (
        <div className="grid-2" style={{ gap: 16 }}>
          <div className="card">
            <div className="card-header">
              <h4>Goals</h4>
              <span>{goals.length} active</span>
            </div>

            {managerView && (
              <div className="inline-form" style={{ marginBottom: 12 }}>
                <input
                  placeholder="Employee ID"
                  value={goalForm.employeeId}
                  onChange={(e) => setGoalForm((p) => ({ ...p, employeeId: e.target.value }))}
                  style={{ width: 140 }}
                />
                <input
                  placeholder="Goal title"
                  value={goalForm.title}
                  onChange={(e) => setGoalForm((p) => ({ ...p, title: e.target.value }))}
                />
                <select value={goalForm.status} onChange={(e) => setGoalForm((p) => ({ ...p, status: e.target.value }))}>
                  {goalStatuses.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  placeholder="Weight"
                  value={goalForm.weight}
                  onChange={(e) => setGoalForm((p) => ({ ...p, weight: e.target.value }))}
                  style={{ width: 110 }}
                />
                <Button onClick={handleCreateGoal} disabled={busy || !goalForm.title || !goalForm.employeeId}>
                  Add Goal
                </Button>
              </div>
            )}

            <textarea
              rows={3}
              placeholder="Description (optional)"
              value={goalForm.description}
              onChange={(e) => setGoalForm((p) => ({ ...p, description: e.target.value }))}
            />

            <div className="table-scroll" style={{ marginTop: 10 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Owner</th>
                    <th>Status</th>
                    <th>Progress</th>
                    {managerView && <th>Update</th>}
                  </tr>
                </thead>
                <tbody>
                  {goals.map((goal) => {
                    const edit = goalEdits[goal.id] || { status: goal.status, progress: goal.progress }
                    return (
                      <tr key={goal.id}>
                        <td>
                          <div>{goal.title}</div>
                          <div className="muted">{goal.description || '—'}</div>
                        </td>
                        <td>
                          <div>{goal.employeeName || `Emp #${goal.employeeId}`}</div>
                          <div className="muted">{goal.department || '—'}</div>
                        </td>
                        <td>
                          <select
                            value={edit.status}
                            disabled={!managerView || busy}
                            onChange={(e) =>
                              setGoalEdits((prev) => ({
                                ...prev,
                                [goal.id]: { ...edit, status: e.target.value },
                              }))
                            }
                          >
                            {goalStatuses.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={edit.progress}
                            disabled={!managerView || busy}
                            onChange={(e) =>
                              setGoalEdits((prev) => ({
                                ...prev,
                                [goal.id]: { ...edit, progress: e.target.value },
                              }))
                            }
                            style={{ width: 90 }}
                          />
                          <div className="muted">{edit.progress}%</div>
                        </td>
                        {managerView && (
                          <td>
                            <Button variant="outline" onClick={() => handleUpdateGoal(goal.id)} disabled={busy}>
                              Save
                            </Button>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                  {goals.length === 0 && (
                    <tr>
                      <td colSpan={5}>
                        <div className="list-empty">No goals set yet.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4>Reviews</h4>
              <span>{reviews.length} captured</span>
            </div>

            {managerView && (
              <div className="inline-form" style={{ marginBottom: 12 }}>
                <input
                  placeholder="Employee ID"
                  value={reviewForm.employeeId}
                  onChange={(e) => setReviewForm((p) => ({ ...p, employeeId: e.target.value }))}
                  style={{ width: 140 }}
                />
                <label>
                  From
                  <input type="date" value={reviewForm.periodStart} onChange={(e) => setReviewForm((p) => ({ ...p, periodStart: e.target.value }))} />
                </label>
                <label>
                  To
                  <input type="date" value={reviewForm.periodEnd} onChange={(e) => setReviewForm((p) => ({ ...p, periodEnd: e.target.value }))} />
                </label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  placeholder="Rating"
                  value={reviewForm.overallRating}
                  onChange={(e) => setReviewForm((p) => ({ ...p, overallRating: e.target.value }))}
                  style={{ width: 110 }}
                />
                <select value={reviewForm.status} onChange={(e) => setReviewForm((p) => ({ ...p, status: e.target.value }))}>
                  {reviewStatuses.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <Button onClick={handleCreateReview} disabled={busy || !reviewForm.employeeId}>
                  Add Review
                </Button>
              </div>
            )}

            <textarea
              rows={3}
              placeholder="Review summary"
              value={reviewForm.summary}
              onChange={(e) => setReviewForm((p) => ({ ...p, summary: e.target.value }))}
            />

            <div className="table-scroll" style={{ marginTop: 10 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Period</th>
                    <th>Rating</th>
                    <th>Status</th>
                    <th>Feedback</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((review) => (
                    <tr key={review.id}>
                      <td>
                        <div>{review.employeeName || `Emp #${review.employeeId}`}</div>
                        <div className="muted">{review.reviewerName ? `By ${review.reviewerName}` : '—'}</div>
                      </td>
                      <td>
                        <div>{review.periodStart || '—'} → {review.periodEnd || '—'}</div>
                        <div className="muted">{review.summary || 'No summary yet'}</div>
                      </td>
                      <td>
                        <span className="pill pill-green">{Number(review.overallRating || 0).toFixed(1)}</span>
                      </td>
                      <td>
                        <span className="pill pill-blue">{review.status}</span>
                        <div className="muted">{review.feedbackCount || 0} feedback</div>
                      </td>
                      <td>
                        {managerView ? (
                          <div className="inline-form">
                            <input
                              placeholder="Add quick feedback"
                              value={feedbackNotes[review.id] || ''}
                              onChange={(e) => setFeedbackNotes((prev) => ({ ...prev, [review.id]: e.target.value }))}
                            />
                            <Button variant="outline" onClick={() => handleAddFeedback(review.id)} disabled={busy || !feedbackNotes[review.id]}>
                              Send
                            </Button>
                          </div>
                        ) : (
                          <span className="muted">Feedback restricted</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {reviews.length === 0 && (
                    <tr>
                      <td colSpan={5}>
                        <div className="list-empty">No reviews recorded yet.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default Performance
