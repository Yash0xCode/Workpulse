import { useEffect, useMemo, useState } from 'react'
import { Icon } from '../../components/common/Icons.jsx'
import {
  createWorkflowDefinition,
  createWorkflowInstance,
  getWorkflowActions,
  getWorkflowDefinitions,
  getWorkflowInstances,
  seedWorkflowDefinitions,
  transitionWorkflowInstance,
} from '../../services/workflowService.js'

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString()
}

function statePillClass(status) {
  if (status === 'completed') return 'state-pill success'
  if (status === 'in_progress') return 'state-pill warning'
  return 'state-pill muted'
}

function WorkflowCenter({ token = '' }) {
  const [definitions, setDefinitions] = useState([])
  const [instances, setInstances] = useState([])
  const [selectedInstance, setSelectedInstance] = useState(null)
  const [actions, setActions] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [transitionAction, setTransitionAction] = useState('')

  const [newDefinition, setNewDefinition] = useState({
    code: 'document_approval',
    resourceType: 'document',
    initialState: 'pending',
    states: 'pending,approved,rejected',
    transitions: 'pending:approve:approved,pending:reject:rejected',
  })

  const currentCounts = useMemo(() => {
    const total = instances.length
    const inProgress = instances.filter((i) => i.status === 'in_progress').length
    const completed = instances.filter((i) => i.status === 'completed').length
    return { total, inProgress, completed }
  }, [instances])

  const loadAll = async () => {
    if (!token) return
    setLoading(true)
    setError('')
    try {
      const [defsRes, instRes] = await Promise.all([
        getWorkflowDefinitions(token),
        getWorkflowInstances(token, { page: 1, limit: 50 }),
      ])
      setDefinitions(Array.isArray(defsRes?.data) ? defsRes.data : [])
      const rows = Array.isArray(instRes?.data) ? instRes.data : []
      setInstances(rows)
      if (rows.length > 0) {
        setSelectedInstance((prev) => prev || rows[0])
      }
    } catch (loadError) {
      setError(loadError.message || 'Unable to load workflow center data.')
    } finally {
      setLoading(false)
    }
  }

  const loadActions = async (instanceId) => {
    if (!instanceId || !token) return
    try {
      const response = await getWorkflowActions(instanceId, token)
      setActions(Array.isArray(response?.data) ? response.data : [])
    } catch {
      setActions([])
    }
  }

  const parseTransitions = (raw) =>
    String(raw || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const [from, action, to] = item.split(':').map((v) => (v || '').trim())
        return { from, action, to }
      })

  const handleCreateDefinition = async () => {
    setBusy(true)
    setError('')
    try {
      await createWorkflowDefinition(
        {
          code: newDefinition.code,
          resourceType: newDefinition.resourceType,
          initialState: newDefinition.initialState,
          states: newDefinition.states.split(',').map((item) => item.trim()).filter(Boolean),
          transitions: parseTransitions(newDefinition.transitions),
          isActive: true,
        },
        token
      )
      await loadAll()
    } catch (createError) {
      setError(createError.message || 'Failed to create workflow definition.')
    } finally {
      setBusy(false)
    }
  }

  const availableActions = useMemo(() => {
    if (!selectedInstance) return []
    const definition = definitions.find((d) => d.code === selectedInstance.definitionCode)
    const transitions = Array.isArray(definition?.transitions) ? definition.transitions : []
    return transitions
      .filter((item) => String(item?.from || '').toLowerCase() === String(selectedInstance.currentState || '').toLowerCase())
      .map((item) => item.action)
  }, [definitions, selectedInstance])

  useEffect(() => {
    if (availableActions.length > 0) {
      setTransitionAction(availableActions[0])
    } else {
      setTransitionAction('')
    }
  }, [availableActions])

  const handleTransition = async () => {
    if (!selectedInstance?.id || !transitionAction) return
    setBusy(true)
    setError('')
    try {
      await transitionWorkflowInstance(
        selectedInstance.id,
        { action: transitionAction, comments: `Triggered from Workflow Center: ${transitionAction}` },
        token
      )
      await loadAll()
      await loadActions(selectedInstance.id)
    } catch (transitionError) {
      setError(transitionError.message || 'Failed to transition workflow instance.')
    } finally {
      setBusy(false)
    }
  }

  const handleCreateInstance = async () => {
    if (definitions.length === 0) return
    setBusy(true)
    setError('')
    try {
      await createWorkflowInstance(
        {
          definitionId: definitions[0].id,
          resourceId: Date.now(),
          comments: 'Instance created from Workflow Center',
        },
        token
      )
      await loadAll()
    } catch (instanceError) {
      setError(instanceError.message || 'Failed to create workflow instance.')
    } finally {
      setBusy(false)
    }
  }

  const handleSeed = async () => {
    setBusy(true)
    setError('')
    try {
      await seedWorkflowDefinitions(token)
      await loadAll()
    } catch (seedError) {
      setError(seedError.message || 'Failed to seed workflow definitions.')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadActions(selectedInstance?.id)
  }, [selectedInstance?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="workflow-center">
      <div className="workflow-hero">
        <div>
          <p className="workflow-kicker">Enterprise Orchestration</p>
          <h1>Workflow Control Tower</h1>
          <p className="workflow-subtitle">
            Inspect approval journeys, monitor state transitions, and keep HR operations transparent.
          </p>
        </div>
        <div className="workflow-hero-actions">
          <button className="btn btn-outline" type="button" onClick={loadAll} disabled={loading || busy}>
            <Icon name="refresh" size={15} />
            Refresh
          </button>
          <button className="btn btn-primary" type="button" onClick={handleSeed} disabled={busy}>
            <Icon name="plus" size={15} />
            Seed Default Workflow
          </button>
        </div>
      </div>

      {error && <div className="notice-bar">{error}</div>}

      <div className="workflow-stat-grid">
        <div className="workflow-stat-card">
          <span className="workflow-stat-label">Definitions</span>
          <strong>{definitions.length}</strong>
        </div>
        <div className="workflow-stat-card">
          <span className="workflow-stat-label">Instances</span>
          <strong>{currentCounts.total}</strong>
        </div>
        <div className="workflow-stat-card">
          <span className="workflow-stat-label">In Progress</span>
          <strong>{currentCounts.inProgress}</strong>
        </div>
        <div className="workflow-stat-card">
          <span className="workflow-stat-label">Completed</span>
          <strong>{currentCounts.completed}</strong>
        </div>
      </div>

      <article className="workflow-panel" style={{ marginBottom: 16 }}>
        <div className="workflow-panel-header">
          <h3>Quick Workflow Builder</h3>
          <span>Create reusable definitions fast</span>
        </div>
        <div className="grid-2" style={{ gap: 12 }}>
          <input value={newDefinition.code} onChange={(e) => setNewDefinition((p) => ({ ...p, code: e.target.value }))} placeholder="code" />
          <input value={newDefinition.resourceType} onChange={(e) => setNewDefinition((p) => ({ ...p, resourceType: e.target.value }))} placeholder="resourceType" />
          <input value={newDefinition.initialState} onChange={(e) => setNewDefinition((p) => ({ ...p, initialState: e.target.value }))} placeholder="initialState" />
          <input value={newDefinition.states} onChange={(e) => setNewDefinition((p) => ({ ...p, states: e.target.value }))} placeholder="states comma separated" />
        </div>
        <input
          style={{ marginTop: 10, width: '100%' }}
          value={newDefinition.transitions}
          onChange={(e) => setNewDefinition((p) => ({ ...p, transitions: e.target.value }))}
          placeholder="transitions (from:action:to,from:action:to)"
        />
        <div className="workflow-hero-actions" style={{ marginTop: 12 }}>
          <button className="btn btn-primary" type="button" onClick={handleCreateDefinition} disabled={busy}>
            Create Definition
          </button>
          <button className="btn btn-outline" type="button" onClick={handleCreateInstance} disabled={busy || definitions.length === 0}>
            Create Test Instance
          </button>
        </div>
      </article>

      <div className="workflow-grid">
        <article className="workflow-panel">
          <div className="workflow-panel-header">
            <h3>Workflow Instances</h3>
            <span>{loading ? 'Loading...' : `${instances.length} records`}</span>
          </div>
          <div className="workflow-instance-list">
            {instances.map((instance) => (
              <button
                key={instance.id}
                type="button"
                onClick={() => setSelectedInstance(instance)}
                className={`workflow-instance-item ${selectedInstance?.id === instance.id ? 'active' : ''}`}
              >
                <div>
                  <div className="workflow-instance-title">{instance.definitionCode || instance.resourceType}</div>
                  <div className="workflow-instance-meta">
                    Resource #{instance.resourceId} • {formatDate(instance.createdAt)}
                  </div>
                </div>
                <span className={statePillClass(instance.status)}>{instance.status}</span>
              </button>
            ))}
            {!loading && instances.length === 0 && (
              <div className="workflow-empty">No workflow instances yet. Submit a leave request to start one.</div>
            )}
          </div>
        </article>

        <article className="workflow-panel">
          <div className="workflow-panel-header">
            <h3>Action Timeline</h3>
            <span>{selectedInstance ? `#${selectedInstance.id}` : 'No selection'}</span>
          </div>
          {!selectedInstance && <div className="workflow-empty">Select an instance to view actions.</div>}
          {selectedInstance && (
            <div className="workflow-timeline">
              {availableActions.length > 0 && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <select value={transitionAction} onChange={(e) => setTransitionAction(e.target.value)}>
                    {availableActions.map((action) => (
                      <option key={action} value={action}>
                        {action}
                      </option>
                    ))}
                  </select>
                  <button className="btn btn-primary" type="button" onClick={handleTransition} disabled={busy || !transitionAction}>
                    Transition
                  </button>
                </div>
              )}
              {actions.map((action) => (
                <div key={action.id} className="workflow-timeline-item">
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <div className="timeline-row">
                      <strong>{action.action}</strong>
                      <span>{formatDate(action.createdAt)}</span>
                    </div>
                    <div className="timeline-row muted">
                      {action.fromState || 'start'} → {action.toState || '-'} by {action.actorName || 'System'}
                    </div>
                    {action.comments && <p>{action.comments}</p>}
                  </div>
                </div>
              ))}
              {actions.length === 0 && <div className="workflow-empty">No action history found for this instance.</div>}
            </div>
          )}
        </article>
      </div>
    </section>
  )
}

export default WorkflowCenter
