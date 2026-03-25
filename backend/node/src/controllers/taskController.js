import { pool } from '../config/db.js'

const taskSelect = `
  SELECT
    t.id,
    t.organization_id AS "organizationId",
    t.title,
    t.description,
    t.assigned_to_employee_id AS "assignedToEmployeeId",
    COALESCE(t.assignee_name, assignee_employee.name, assignee_user.name, 'Unassigned') AS assignee,
    t.assigned_by AS "createdByUserId",
    COALESCE(t.priority, 'Medium') AS priority,
    COALESCE(t.status, 'backlog') AS status,
    t.due_date AS "dueDate",
    COALESCE(t.department, assignee_employee.department, 'General') AS department
  FROM tasks t
  LEFT JOIN employees assignee_employee ON assignee_employee.id = t.assigned_to_employee_id
  LEFT JOIN users assignee_user ON assignee_user.id = t.assigned_to
`

const normalizeTask = (row) => ({
  ...row,
  dueDate: row.dueDate ? new Date(row.dueDate).toISOString().slice(0, 10) : null,
})

const resolveAssignee = async (organizationId, assignedToEmployeeId, assigneeName) => {
  if (assignedToEmployeeId) {
    const { rows } = await pool.query(
      `
        SELECT id, user_id AS "userId", name, department
        FROM employees
        WHERE organization_id = $1 AND id = $2
        LIMIT 1
      `,
      [organizationId, Number(assignedToEmployeeId)]
    )
    return rows[0] || null
  }

  if (!assigneeName) {
    return null
  }

  const { rows } = await pool.query(
    `
      SELECT id, user_id AS "userId", name, department
      FROM employees
      WHERE organization_id = $1 AND LOWER(name) = LOWER($2)
      LIMIT 1
    `,
    [organizationId, assigneeName]
  )

  return rows[0] || null
}

export const createTask = async (req, res) => {
  if (!req.body.title) {
    return res.status(400).json({ message: 'title is required' })
  }

  try {
    const assignee = await resolveAssignee(
      req.user.organizationId,
      req.body.assignedToEmployeeId,
      req.body.assignee
    )

    const { rows } = await pool.query(
      `
        INSERT INTO tasks (
          organization_id,
          title,
          description,
          assigned_to,
          assigned_by,
          priority,
          status,
          due_date,
          assigned_to_employee_id,
          assignee_name,
          department
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
      `,
      [
        req.user.organizationId,
        req.body.title,
        req.body.description || '',
        assignee?.userId || null,
        req.user.id,
        req.body.priority || 'Medium',
        req.body.status || 'backlog',
        req.body.dueDate || null,
        assignee?.id || null,
        assignee?.name || req.body.assignee || null,
        req.body.department || assignee?.department || 'General',
      ]
    )

    const created = await pool.query(`${taskSelect} WHERE t.id = $1`, [rows[0].id])
    return res.status(201).json({ data: normalizeTask(created.rows[0]) })
  } catch (_error) {
    return res.status(500).json({ message: 'Failed to create task' })
  }
}

export const getTasks = async (req, res) => {
  try {
    if (req.query.view === 'team') {
      const { rows } = await pool.query(
        `
          WITH manager_record AS (
            SELECT id
            FROM employees
            WHERE organization_id = $1 AND user_id = $2
            LIMIT 1
          )
          ${taskSelect}
          WHERE t.organization_id = $1
            AND t.assigned_to_employee_id IN (
              SELECT id
              FROM employees
              WHERE organization_id = $1
                AND manager_id = (SELECT id FROM manager_record)
            )
          ORDER BY t.id DESC
        `,
        [req.user.organizationId, req.user.id]
      )
      return res.json({ data: rows.map(normalizeTask) })
    }

    const { rows } = await pool.query(
      `${taskSelect} WHERE t.organization_id = $1 ORDER BY t.id DESC`,
      [req.user.organizationId]
    )
    return res.json({ data: rows.map(normalizeTask) })
  } catch (_error) {
    return res.status(500).json({ message: 'Failed to fetch tasks' })
  }
}

export const updateTask = async (req, res) => {
  try {
    const updates = []
    const values = []
    const fieldMap = {
      title: 'title',
      description: 'description',
      priority: 'priority',
      status: 'status',
      dueDate: 'due_date',
      department: 'department',
    }

    Object.entries(fieldMap).forEach(([key, column]) => {
      if (req.body[key] !== undefined) {
        values.push(req.body[key])
        updates.push(`${column} = $${values.length}`)
      }
    })

    if (req.body.assignedToEmployeeId !== undefined || req.body.assignee !== undefined) {
      const assignee = await resolveAssignee(
        req.user.organizationId,
        req.body.assignedToEmployeeId,
        req.body.assignee
      )
      values.push(assignee?.userId || null)
      updates.push(`assigned_to = $${values.length}`)
      values.push(assignee?.id || null)
      updates.push(`assigned_to_employee_id = $${values.length}`)
      values.push(assignee?.name || req.body.assignee || null)
      updates.push(`assignee_name = $${values.length}`)
      if (req.body.department === undefined) {
        values.push(assignee?.department || 'General')
        updates.push(`department = $${values.length}`)
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No valid fields provided for update' })
    }

    values.push(Number(req.params.id))
    values.push(req.user.organizationId)

    const result = await pool.query(
      `
        UPDATE tasks
        SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${values.length - 1} AND organization_id = $${values.length}
        RETURNING id
      `,
      values
    )

    if (!result.rows[0]) return res.status(404).json({ message: 'Task not found' })

    const updated = await pool.query(`${taskSelect} WHERE t.id = $1`, [result.rows[0].id])
    return res.json({ data: normalizeTask(updated.rows[0]) })
  } catch (_error) {
    return res.status(500).json({ message: 'Failed to update task' })
  }
}
