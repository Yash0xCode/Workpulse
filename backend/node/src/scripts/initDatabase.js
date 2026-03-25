import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { pool } from '../config/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..', '..', '..');

const schemaFiles = [
  path.join(repoRoot, 'docs', 'DATABASE_SCHEMA.sql'),
  path.join(repoRoot, 'docs', 'WORKFLOW_SCHEMA.sql'),
];

const permissions = [
  ['view_employees', 'View employee records'],
  ['add_employee', 'Create employee records'],
  ['edit_employee', 'Edit employee records'],
  ['delete_employee', 'Delete employee records'],
  ['apply_leave', 'Create and update own leave requests'],
  ['view_leaves', 'View leave requests'],
  ['approve_leave', 'Approve/reject leave requests'],
  ['assign_task', 'Assign tasks to users'],
  ['view_analytics', 'View analytics dashboards'],
  ['view_team_attendance', 'View team attendance reports'],
];

const rolePermissions = {
  super_admin: permissions.map((p) => p[0]),
  hr_manager: [
    'view_employees',
    'add_employee',
    'edit_employee',
    'delete_employee',
    'apply_leave',
    'view_leaves',
    'approve_leave',
    'assign_task',
    'view_analytics',
    'view_team_attendance',
  ],
  department_manager: [
    'view_employees',
    'add_employee',
    'edit_employee',
    'apply_leave',
    'view_leaves',
    'approve_leave',
    'assign_task',
    'view_analytics',
    'view_team_attendance',
  ],
  employee: ['view_employees', 'apply_leave', 'view_leaves'],
  recruiter: ['add_employee', 'edit_employee'],
  institute_admin: permissions.map((p) => p[0]),
  faculty: ['view_employees', 'apply_leave', 'view_leaves', 'assign_task', 'view_analytics'],
  student: ['apply_leave', 'view_leaves'],
  placement_officer: ['view_analytics', 'assign_task'],
};

function roleScope(roleName) {
  if (['institute_admin', 'faculty', 'student', 'placement_officer'].includes(roleName)) {
    return 'education';
  }
  if (['super_admin'].includes(roleName)) {
    return 'global';
  }
  return 'corporate';
}

async function runSqlFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }
  const sql = fs.readFileSync(filePath, 'utf8');
  if (!sql.trim()) {
    return;
  }

  const statements = sql
    .split(/;\s*\n/g)
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await pool.query(`${statement};`);
  }
}

async function seedRbac() {
  for (const [code, description] of permissions) {
    await pool.query(
      `
      INSERT INTO permissions (code, description)
      VALUES ($1, $2)
      ON CONFLICT (code) DO UPDATE SET description = EXCLUDED.description
      `,
      [code, description]
    );
  }

  for (const roleName of Object.keys(rolePermissions)) {
    await pool.query(
      `
      INSERT INTO roles (name, scope)
      VALUES ($1, $2)
      ON CONFLICT (name) DO UPDATE SET scope = EXCLUDED.scope
      `,
      [roleName, roleScope(roleName)]
    );
  }

  for (const [roleName, permCodes] of Object.entries(rolePermissions)) {
    for (const permCode of permCodes) {
      await pool.query(
        `
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT r.id, p.id
        FROM roles r
        JOIN permissions p ON p.code = $2
        WHERE r.name = $1
        ON CONFLICT (role_id, permission_id) DO NOTHING
        `,
        [roleName, permCode]
      );
    }
  }
}

async function seedWorkflowDefinitions() {
  const leaveStates = ['pending', 'approved', 'rejected'];
  const leaveTransitions = [
    { from: 'pending', action: 'approve', to: 'approved' },
    { from: 'pending', action: 'reject', to: 'rejected' },
  ];

  await pool.query(
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
      ON CONFLICT (code) DO UPDATE
      SET states = EXCLUDED.states,
          transitions = EXCLUDED.transitions,
          is_active = EXCLUDED.is_active
    `,
    ['leave_approval', JSON.stringify(leaveStates), JSON.stringify(leaveTransitions)]
  );
}

async function main() {
  try {
    for (const schemaFile of schemaFiles) {
      await runSqlFile(schemaFile);
    }
    await seedRbac();
    await seedWorkflowDefinitions();
    console.log('Database schema initialized and RBAC seeded successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Database initialization failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
