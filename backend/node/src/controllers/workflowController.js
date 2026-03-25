import { pool } from '../config/db.js'
import { ensureLeaveWorkflowDefinition } from '../services/workflowService.js'
import { sendError, sendPaginated, sendSuccess } from '../utils/response.js'

const managerRoles = ['department_manager', 'hr_manager', 'super_admin', 'institute_admin']

const definitionSelect = `
  SELECT
    id,
    code,
    resource_type AS "resourceType",
    initial_state AS "initialState",
    states,
    transitions,
    is_active AS "isActive",
    created_at AS "createdAt"
  FROM workflow_definitions
`

const instanceSelect = `
  SELECT
    wi.id,
    wi.definition_id AS "definitionId",
    wd.code AS "definitionCode",
    wi.resource_type AS "resourceType",
    wi.resource_id AS "resourceId",
    wi.organization_id AS "organizationId",
    wi.requester_user_id AS "requesterUserId",
    requester.name AS "requesterName",
    wi.current_state AS "currentState",
    wi.status,
    wi.created_at AS "createdAt",
    wi.updated_at AS "updatedAt",
    wi.closed_at AS "closedAt"
  FROM workflow_instances wi
  JOIN workflow_definitions wd ON wd.id = wi.definition_id
  LEFT JOIN users requester ON requester.id = wi.requester_user_id
`

export const seedWorkflowDefinitions = async (_req, res) => {
  try {
    if (!managerRoles.includes(_req.user?.role || '')) {
      return sendError(res, 'FORBIDDEN', 'Insufficient permissions for seeding workflows', {}, 403)
    }

    await ensureLeaveWorkflowDefinition(pool)
    return sendSuccess(res, { seeded: true })
  } catch (_error) {
    return sendError(res, 'SERVER_ERROR', 'Failed to seed workflow definitions', {}, 500)
  }
}

export const getWorkflowDefinitions = async (_req, res) => {
  try {
    const rows = await pool.query(`${definitionSelect} ORDER BY created_at DESC`)
    return sendSuccess(res, rows.rows)
  } catch (_error) {
    return sendError(res, 'SERVER_ERROR', 'Failed to fetch workflow definitions', {}, 500)
  }
}

export const getWorkflowInstances = async (req, res) => {
  try {
    const { page, limit, offset } = req.pagination || { page: 1, limit: 20, offset: 0 }
    const isManager = managerRoles.includes(req.user?.role)

    let query = `${instanceSelect} WHERE wi.organization_id = $1 ORDER BY wi.created_at DESC LIMIT $2 OFFSET $3`
    let countQuery = 'SELECT COUNT(*)::int AS total FROM workflow_instances wi WHERE wi.organization_id = $1'
    let params = [req.user.organizationId, limit, offset]
    let countParams = [req.user.organizationId]

    if (!isManager) {
      query = `${instanceSelect} WHERE wi.organization_id = $1 AND wi.requester_user_id = $2 ORDER BY wi.created_at DESC LIMIT $3 OFFSET $4`
      countQuery = 'SELECT COUNT(*)::int AS total FROM workflow_instances wi WHERE wi.organization_id = $1 AND wi.requester_user_id = $2'
      params = [req.user.organizationId, req.user.id, limit, offset]
      countParams = [req.user.organizationId, req.user.id]
    }

    const list = await pool.query(query, params)
    const count = await pool.query(countQuery, countParams)

    return sendPaginated(res, list.rows, page, limit, count.rows[0]?.total || 0)
  } catch (_error) {
    return sendError(res, 'SERVER_ERROR', 'Failed to fetch workflow instances', {}, 500)
  }
}

export const getWorkflowInstanceById = async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!id) return sendError(res, 'VALIDATION_ERROR', 'Invalid workflow instance id', {}, 400)

    const isManager = managerRoles.includes(req.user?.role)
    let query = `${instanceSelect} WHERE wi.id = $1 AND wi.organization_id = $2 LIMIT 1`
    let params = [id, req.user.organizationId]

    if (!isManager) {
      query = `${instanceSelect} WHERE wi.id = $1 AND wi.organization_id = $2 AND wi.requester_user_id = $3 LIMIT 1`
      params = [id, req.user.organizationId, req.user.id]
    }

    const result = await pool.query(query, params)
    if (!result.rows[0]) return sendError(res, 'NOT_FOUND', 'Workflow instance not found', {}, 404)

    return sendSuccess(res, result.rows[0])
  } catch (_error) {
    return sendError(res, 'SERVER_ERROR', 'Failed to fetch workflow instance', {}, 500)
  }
}

export const getWorkflowActions = async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!id) return sendError(res, 'VALIDATION_ERROR', 'Invalid workflow instance id', {}, 400)

    const isManager = managerRoles.includes(req.user?.role)

    let accessQuery = 'SELECT id FROM workflow_instances WHERE id = $1 AND organization_id = $2 LIMIT 1'
    let accessParams = [id, req.user.organizationId]

    if (!isManager) {
      accessQuery = 'SELECT id FROM workflow_instances WHERE id = $1 AND organization_id = $2 AND requester_user_id = $3 LIMIT 1'
      accessParams = [id, req.user.organizationId, req.user.id]
    }

    const access = await pool.query(accessQuery, accessParams)
    if (!access.rows[0]) return sendError(res, 'NOT_FOUND', 'Workflow instance not found', {}, 404)

    const actions = await pool.query(
      `
        SELECT
          wa.id,
          wa.instance_id AS "instanceId",
          wa.step_no AS "stepNo",
          wa.actor_user_id AS "actorUserId",
          actor.name AS "actorName",
          wa.action,
          wa.from_state AS "fromState",
          wa.to_state AS "toState",
          wa.comments,
          wa.created_at AS "createdAt"
        FROM workflow_actions wa
        LEFT JOIN users actor ON actor.id = wa.actor_user_id
        WHERE wa.instance_id = $1
        ORDER BY wa.step_no ASC
      `,
      [id]
    )

    return sendSuccess(res, actions.rows)
  } catch (_error) {
    return sendError(res, 'SERVER_ERROR', 'Failed to fetch workflow actions', {}, 500)
  }
}
