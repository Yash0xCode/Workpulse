export const PERMISSIONS = {
  ADD_EMPLOYEE: 'add_employee',
  EDIT_EMPLOYEE: 'edit_employee',
  DELETE_EMPLOYEE: 'delete_employee',
  ASSIGN_TASK: 'assign_task',
  APPROVE_LEAVE: 'approve_leave',
  VIEW_ANALYTICS: 'view_analytics',
  VIEW_TEAM_ATTENDANCE: 'view_team_attendance',
}

export const ROLE_LABELS = {
  super_admin: 'Super Admin',
  hr_manager: 'HR Manager',
  department_manager: 'Department Manager',
  employee: 'Employee',
  recruiter: 'Recruiter',
  institute_admin: 'Institute Admin',
  faculty: 'Faculty',
  student: 'Student',
  placement_officer: 'Placement Officer',
}

export const ROLE_PERMISSIONS = {
  super_admin: Object.values(PERMISSIONS),
  hr_manager: [
    PERMISSIONS.ADD_EMPLOYEE,
    PERMISSIONS.EDIT_EMPLOYEE,
    PERMISSIONS.DELETE_EMPLOYEE,
    PERMISSIONS.ASSIGN_TASK,
    PERMISSIONS.APPROVE_LEAVE,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.VIEW_TEAM_ATTENDANCE,
  ],
  department_manager: [
    PERMISSIONS.ADD_EMPLOYEE,
    PERMISSIONS.EDIT_EMPLOYEE,
    PERMISSIONS.ASSIGN_TASK,
    PERMISSIONS.APPROVE_LEAVE,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.VIEW_TEAM_ATTENDANCE,
  ],
  employee: [],
  recruiter: [PERMISSIONS.ADD_EMPLOYEE, PERMISSIONS.EDIT_EMPLOYEE],
  institute_admin: Object.values(PERMISSIONS),
  faculty: [PERMISSIONS.ASSIGN_TASK, PERMISSIONS.VIEW_ANALYTICS],
  student: [],
  placement_officer: [PERMISSIONS.ASSIGN_TASK, PERMISSIONS.VIEW_ANALYTICS],
}

export const hasPermission = (user, permission) => {
  if (!user?.role) return false
  return Boolean(ROLE_PERMISSIONS[user.role]?.includes(permission))
}
