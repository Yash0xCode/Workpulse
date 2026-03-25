import { pool } from '../config/db.js'

const LEAVE_WORKFLOW_CODE = 'leave_approval'

const LEAVE_WORKFLOW_STATES = ['pending', 'approved', 'rejected']

const LEAVE_WORKFLOW_TRANSITIONS = [
  { from: 'pending', action: 'approve', to: 'approved' },
  { from: 'pending', action: 'reject', to: 'rejected' },
]

const getNextStepNumber = async (client, instanceId) => {
  const result = await client.query(
    'SELECT COALESCE(MAX(step_no), 0)::int + 1 AS next FROM workflow_actions WHERE instance_id = $1',
    [instanceId]
  )
  return result.rows[0]?.next || 1
}

const normalizeState = (value) => String(value || '').trim().toLowerCase()

const normalizeTransition = (transition) => ({
  from: normalizeState(transition?.from),
  action: normalizeState(transition?.action),
  to: normalizeState(transition?.to),
})

const validateWorkflowDefinitionPayload = ({ code, resourceType, initialState, states, transitions }) => {
  const normalizedCode = String(code || '').trim().toLowerCase()
  const normalizedResourceType = String(resourceType || '').trim().toLowerCase()
  const normalizedStates = Array.from(new Set((states || []).map(normalizeState).filter(Boolean)))
  const normalizedInitialState = normalizeState(initialState)
  const normalizedTransitions = (transitions || []).map(normalizeTransition)

  if (!normalizedCode) throw new Error('Workflow code is required')
  if (!normalizedResourceType) throw new Error('resourceType is required')
  if (normalizedStates.length < 2) throw new Error('At least two workflow states are required')
  if (!normalizedInitialState || !normalizedStates.includes(normalizedInitialState)) {
    throw new Error('initialState must be one of the declared states')
  }

  for (const transition of normalizedTransitions) {
    if (!transition.from || !transition.action || !transition.to) {
      throw new Error('Each transition must contain from, action, and to')
    }
    if (!normalizedStates.includes(transition.from) || !normalizedStates.includes(transition.to)) {
      throw new Error('Transition states must be declared in states')
    }
  }

  return {
    code: normalizedCode,
    resourceType: normalizedResourceType,
    initialState: normalizedInitialState,
    states: normalizedStates,
    transitions: normalizedTransitions,
  }
}

export const createWorkflowDefinition = async ({
  code,
  resourceType,
  initialState,
  states,
  transitions,
  isActive = true,
}) => {
  const payload = validateWorkflowDefinitionPayload({
    code,
    resourceType,
    initialState,
    states,
    transitions,
  })

  const { rows } = await pool.query(
    `
      INSERT INTO workflow_definitions (
        code,
        resource_type,
        initial_state,
        states,
        transitions,
        is_active
      )
      VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6)
      RETURNING id
    `,
    [
      payload.code,
      payload.resourceType,
      payload.initialState,
      JSON.stringify(payload.states),
      JSON.stringify(payload.transitions),
      Boolean(isActive),
    ]
  )

  return rows[0]
}

export const updateWorkflowDefinition = async ({
  definitionId,
  code,
  resourceType,
  initialState,
  states,
  transitions,
  isActive,
}) => {
  const existing = await pool.query(
    `
      SELECT
        id,
        code,
        resource_type AS "resourceType",
        initial_state AS "initialState",
        states,
        transitions,
        is_active AS "isActive"
      FROM workflow_definitions
      WHERE id = $1
      LIMIT 1
    `,
    [Number(definitionId)]
  )

  if (!existing.rows[0]) return null

  const base = existing.rows[0]
  const payload = validateWorkflowDefinitionPayload({
    code: code ?? base.code,
    resourceType: resourceType ?? base.resourceType,
    initialState: initialState ?? base.initialState,
    states: states ?? base.states,
    transitions: transitions ?? base.transitions,
  })

  const { rows } = await pool.query(
    `
      UPDATE workflow_definitions
      SET
        code = $2,
        resource_type = $3,
        initial_state = $4,
        states = $5::jsonb,
        transitions = $6::jsonb,
        is_active = $7
      WHERE id = $1
      RETURNING id
    `,
    [
      Number(definitionId),
      payload.code,
      payload.resourceType,
      payload.initialState,
      JSON.stringify(payload.states),
      JSON.stringify(payload.transitions),
      isActive === undefined ? Boolean(base.isActive) : Boolean(isActive),
    ]
  )

  return rows[0] || null
}

export const createWorkflowInstance = async ({
  definitionId,
  organizationId,
  requesterUserId,
  resourceId,
  actorUserId,
  comments = 'Workflow request submitted',
}) => {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const definition = await client.query(
      `
        SELECT id, resource_type AS "resourceType", initial_state AS "initialState", is_active AS "isActive"
        FROM workflow_definitions
        WHERE id = $1
        LIMIT 1
      `,
      [Number(definitionId)]
    )

    const row = definition.rows[0]
    if (!row) throw new Error('Workflow definition not found')
    if (!row.isActive) throw new Error('Workflow definition is inactive')

    const existing = await client.query(
      `
        SELECT id
        FROM workflow_instances
        WHERE organization_id = $1
          AND definition_id = $2
          AND resource_id = $3
        LIMIT 1
      `,
      [organizationId, row.id, Number(resourceId)]
    )

    if (existing.rows[0]) {
      await client.query('COMMIT')
      return existing.rows[0]
    }

    const instance = await client.query(
      `
        INSERT INTO workflow_instances (
          definition_id,
          resource_type,
          resource_id,
          organization_id,
          requester_user_id,
          current_state,
          status
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'in_progress')
        RETURNING id
      `,
      [row.id, row.resourceType, Number(resourceId), organizationId, requesterUserId || null, row.initialState]
    )

    await client.query(
      `
        INSERT INTO workflow_actions (
          instance_id,
          step_no,
          actor_user_id,
          action,
          from_state,
          to_state,
          comments
        )
        VALUES ($1, 1, $2, 'submit', NULL, $3, $4)
      `,
      [instance.rows[0].id, actorUserId || requesterUserId || null, row.initialState, comments]
    )

    await client.query('COMMIT')
    return instance.rows[0]
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export const transitionWorkflowInstance = async ({
  instanceId,
  actorUserId,
  action,
  comments = '',
}) => {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const result = await client.query(
      `
        SELECT
          wi.id,
          wi.current_state AS "currentState",
          wi.status,
          wd.transitions,
          wd.states,
          wd.initial_state AS "initialState"
        FROM workflow_instances wi
        JOIN workflow_definitions wd ON wd.id = wi.definition_id
        WHERE wi.id = $1
        LIMIT 1
      `,
      [Number(instanceId)]
    )

    const instance = result.rows[0]
    if (!instance) throw new Error('Workflow instance not found')
    if (instance.status === 'completed') throw new Error('Workflow instance already completed')

    const transitions = (instance.transitions || []).map(normalizeTransition)
    const matched = transitions.find(
      (item) => item.from === normalizeState(instance.currentState) && item.action === normalizeState(action)
    )

    if (!matched) throw new Error('Transition is not allowed from current state')

    const nextState = matched.to
    const stepNo = await getNextStepNumber(client, instance.id)

    try {
      await client.query(
        `
          INSERT INTO workflow_actions (
            instance_id,
            step_no,
            actor_user_id,
            action,
            from_state,
            to_state,
            comments
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
        [instance.id, stepNo, actorUserId || null, normalizeState(action), instance.currentState, nextState, comments]
      )
    } catch (error) {
      throw new Error(`transition_action_insert_failed: ${error.message}`)
    }

    const pendingStateSet = new Set(['pending', instance.initialState])
    const nextStatus = pendingStateSet.has(nextState) ? 'in_progress' : 'completed'
    const closedAt = nextStatus === 'completed' ? new Date().toISOString() : null

    try {
      await client.query(
        `
          UPDATE workflow_instances
          SET
            current_state = $2::varchar,
            status = $3::varchar,
            updated_at = CURRENT_TIMESTAMP,
            closed_at = $4::timestamp
          WHERE id = $1
        `,
        [instance.id, nextState, nextStatus, closedAt]
      )
    } catch (error) {
      throw new Error(`transition_instance_update_failed: ${error.message}`)
    }

    await client.query('COMMIT')
    return { id: instance.id, currentState: nextState, status: nextStatus }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export const ensureLeaveWorkflowDefinition = async (client = pool) => {
  const existing = await client.query(
    `
      SELECT id
      FROM workflow_definitions
      WHERE code = $1
      LIMIT 1
    `,
    [LEAVE_WORKFLOW_CODE]
  )

  if (existing.rows[0]) {
    return existing.rows[0]
  }

  const created = await client.query(
    `
      INSERT INTO workflow_definitions (
        code,
        resource_type,
        initial_state,
        states,
        transitions,
        is_active
      )
      VALUES ($1, 'leave', 'pending', $2::jsonb, $3::jsonb, TRUE)
      RETURNING id
    `,
    [LEAVE_WORKFLOW_CODE, JSON.stringify(LEAVE_WORKFLOW_STATES), JSON.stringify(LEAVE_WORKFLOW_TRANSITIONS)]
  )

  return created.rows[0]
}

export const createLeaveWorkflowInstance = async ({ organizationId, leaveId, requesterUserId, actorUserId }) => {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const definition = await ensureLeaveWorkflowDefinition(client)

    const existing = await client.query(
      `
        SELECT id
        FROM workflow_instances
        WHERE organization_id = $1
          AND resource_type = 'leave'
          AND resource_id = $2
        LIMIT 1
      `,
      [organizationId, leaveId]
    )

    if (existing.rows[0]) {
      await client.query('COMMIT')
      return existing.rows[0]
    }

    const instanceResult = await client.query(
      `
        INSERT INTO workflow_instances (
          definition_id,
          resource_type,
          resource_id,
          organization_id,
          requester_user_id,
          current_state,
          status
        )
        VALUES ($1, 'leave', $2, $3, $4, 'pending', 'in_progress')
        RETURNING id
      `,
      [definition.id, leaveId, organizationId, requesterUserId]
    )

    const instanceId = instanceResult.rows[0].id

    await client.query(
      `
        INSERT INTO workflow_actions (
          instance_id,
          step_no,
          actor_user_id,
          action,
          from_state,
          to_state,
          comments
        )
        VALUES ($1, 1, $2, 'submit', NULL, 'pending', 'Leave request submitted')
      `,
      [instanceId, actorUserId || requesterUserId]
    )

    await client.query('COMMIT')
    return { id: instanceId }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export const transitionLeaveWorkflowInstance = async ({ organizationId, leaveId, actorUserId, finalStatus, comments = '' }) => {
  const { rows } = await pool.query(
    `
      SELECT id
      FROM workflow_instances
      WHERE organization_id = $1
        AND resource_type = 'leave'
        AND resource_id = $2
      LIMIT 1
    `,
    [organizationId, leaveId]
  )

  if (!rows[0]) return null

  return transitionWorkflowInstance({
    instanceId: rows[0].id,
    actorUserId,
    action: finalStatus === 'approved' ? 'approve' : 'reject',
    comments,
  })
}
