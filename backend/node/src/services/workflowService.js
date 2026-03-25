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
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const instanceResult = await client.query(
      `
        SELECT id, current_state AS "currentState", status
        FROM workflow_instances
        WHERE organization_id = $1
          AND resource_type = 'leave'
          AND resource_id = $2
        LIMIT 1
      `,
      [organizationId, leaveId]
    )

    if (!instanceResult.rows[0]) {
      await client.query('ROLLBACK')
      return null
    }

    const instance = instanceResult.rows[0]
    const toState = finalStatus
    const action = finalStatus === 'approved' ? 'approve' : 'reject'

    const stepNo = await getNextStepNumber(client, instance.id)

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
      [instance.id, stepNo, actorUserId, action, instance.currentState, toState, comments]
    )

    await client.query(
      `
        UPDATE workflow_instances
        SET current_state = $1,
            status = 'completed',
            updated_at = CURRENT_TIMESTAMP,
            closed_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `,
      [toState, instance.id]
    )

    await client.query('COMMIT')
    return { id: instance.id, currentState: toState, status: 'completed' }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
