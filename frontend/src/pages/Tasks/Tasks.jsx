import { useEffect, useMemo, useState } from 'react'
import Button from '../../components/common/Button.jsx'
import Input from '../../components/common/Input.jsx'
import Select from '../../components/common/Select.jsx'
import { PERMISSIONS, hasPermission } from '../../constants/rbac.js'
import { tasksByColumn } from '../../constants/tasks.js'
import { getEmployees, getTeamEmployees } from '../../services/employeeService.js'
import { createTask, getTasks, updateTask } from '../../services/taskService.js'

const columns = [
  { key: 'backlog', label: 'Backlog' },
  { key: 'progress', label: 'In Progress' },
  { key: 'review', label: 'Review' },
  { key: 'done', label: 'Done' },
]

const statusToColumn = { backlog: 'backlog', 'in-progress': 'progress', progress: 'progress', review: 'review', done: 'done' }

function apiTasksToBoard(tasks) {
  const board = { backlog: [], progress: [], review: [], done: [] }
  tasks.forEach((t) => {
    const col = statusToColumn[t.status] || 'backlog'
    board[col].push({
      id: t.id,
      title: t.title,
      assignee: t.assignee || t.assigned_to || 'Unassigned',
      due: t.dueDate || t.due_date || '—',
      priority: t.priority || 'Medium',
    })
  })
  return board
}

function Tasks({ token = '', user }) {
  const [board, setBoard] = useState(tasksByColumn)
  const [dragging, setDragging] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState({ title: '', assignee: '', dueDate: '', priority: 'Medium' })
  const [employees, setEmployees] = useState([])

  const canAssign = hasPermission(user, PERMISSIONS.ASSIGN_TASK)

  useEffect(() => {
    let mounted = true
    getTasks(token)
      .then((res) => {
        const tasks = Array.isArray(res?.data) ? res.data : []
        if (mounted && tasks.length > 0) setBoard(apiTasksToBoard(tasks))
      })
      .catch(() => {})
    return () => { mounted = false }
  }, [token])

  useEffect(() => {
    if (!canAssign) return
    let mounted = true
    const load = user?.role === 'department_manager' ? getTeamEmployees : getEmployees
    load(token)
      .then((res) => {
        if (mounted && Array.isArray(res?.data)) setEmployees(res.data)
      })
      .catch(() => {})
    return () => { mounted = false }
  }, [token, canAssign, user?.role]) // eslint-disable-line react-hooks/exhaustive-deps

  const totals = useMemo(
    () =>
      columns.reduce((acc, column) => {
        acc[column.key] = board[column.key].length
        return acc
      }, {}),
    [board]
  )

  const handleDrop = (columnKey) => {
    if (!dragging) return
    const colToStatus = { backlog: 'backlog', progress: 'in-progress', review: 'review', done: 'done' }
    updateTask(dragging.task.id, { status: colToStatus[columnKey] }, token).catch(() => {})
    setBoard((prev) => {
      const next = { ...prev }
      const sourceTasks = [...next[dragging.columnKey]]
      const taskIndex = sourceTasks.findIndex((task) => task.id === dragging.task.id)
      if (taskIndex === -1) return prev
      sourceTasks.splice(taskIndex, 1)
      next[dragging.columnKey] = sourceTasks
      next[columnKey] = [dragging.task, ...next[columnKey]]
      return next
    })
    setDragging(null)
  }

  const handleCreateTask = async () => {
    if (!form.title) {
      setNotice('Task title is required.')
      return
    }

    try {
      const res = await createTask(
        {
          title: form.title,
          assignee: form.assignee,
          dueDate: form.dueDate,
          priority: form.priority,
          status: 'backlog',
        },
        token
      )

      const task = {
        id: res?.data?.id || Date.now(),
        title: res?.data?.title || form.title,
        assignee: res?.data?.assignee || form.assignee || 'Unassigned',
        due: res?.data?.dueDate || form.dueDate || '—',
        priority: res?.data?.priority || form.priority,
      }
      setBoard((prev) => ({ ...prev, backlog: [task, ...prev.backlog] }))
      setNotice('Task created successfully.')
      setShowCreate(false)
      setForm({ title: '', assignee: '', dueDate: '', priority: 'Medium' })
    } catch (error) {
      setNotice(error.message || 'Unable to create task.')
    }
  }

  return (
    <div className="tasks">
      <div className="section-header">
        <div>
          <h1>Task Management</h1>
          <p>Plan, prioritize, and execute with a clear team-wide kanban view.</p>
        </div>
        <div className="section-actions">
          <Button variant="outline" onClick={() => setNotice('Use drag-and-drop to update task status.')}>Filter</Button>
          {canAssign && <Button onClick={() => setShowCreate((v) => !v)}>{showCreate ? 'Close' : 'Create task'}</Button>}
        </div>
      </div>

      {notice && <div className="notice-bar">{notice}</div>}

      {showCreate && (
        <div className="leave-form">
          <h3>New Task</h3>
          <div className="grid-2">
            <Input
              id="taskTitle"
              label="Task Title"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            />
            <Input
              id="taskDueDate"
              label="Due Date"
              type="date"
              value={form.dueDate}
              onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))}
            />
          </div>
          <div className="grid-2">
            {employees.length > 0 ? (
              <Select
                id="taskAssignee"
                label="Assign To"
                options={[
                  { label: 'Select employee…', value: '' },
                  ...employees.map((e) => ({ label: e.name || e.full_name || 'Unknown', value: e.name || e.full_name || '' })),
                ]}
                value={form.assignee}
                onChange={(event) => setForm((prev) => ({ ...prev, assignee: event.target.value }))}
              />
            ) : (
              <Input
                id="taskAssignee"
                label="Assignee"
                placeholder="Enter name"
                value={form.assignee}
                onChange={(event) => setForm((prev) => ({ ...prev, assignee: event.target.value }))}
              />
            )}
            <Select
              id="taskPriority"
              label="Priority"
              options={[
                { label: 'High', value: 'High' },
                { label: 'Medium', value: 'Medium' },
                { label: 'Low', value: 'Low' },
              ]}
              value={form.priority}
              onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value }))}
            />
          </div>
          <div className="form-actions">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreateTask}>Save Task</Button>
          </div>
        </div>
      )}

      <div className="kanban-board">
        {columns.map((column) => (
          <div
            key={column.key}
            className="kanban-column"
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => handleDrop(column.key)}
          >
            <div className="kanban-header">
              <span>{column.label}</span>
              <span className="kanban-count">{totals[column.key]}</span>
            </div>
            <div className="kanban-cards">
              {board[column.key].map((task) => (
                <div
                  key={task.id}
                  className="task-card"
                  draggable
                  onDragStart={() => setDragging({ task, columnKey: column.key })}
                >
                  <div className="task-title">{task.title}</div>
                  <div className="task-meta">
                    <span>{task.assignee}</span>
                    <span>Due {task.due}</span>
                  </div>
                  <div className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Tasks
