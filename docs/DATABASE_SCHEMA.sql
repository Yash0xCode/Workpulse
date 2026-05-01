-- WorkPulse PostgreSQL schema — canonical source of truth.
-- Run via: npm run db:init  (scripts/initDatabase.js)

CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('corporate', 'education')),
  location VARCHAR(255),
  email VARCHAR(255),
  admin_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  scope VARCHAR(50) NOT NULL CHECK (scope IN ('corporate', 'education', 'global')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  code VARCHAR(120) NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  employee_code VARCHAR(50),
  name VARCHAR(255),
  email VARCHAR(255),
  department VARCHAR(120),
  designation VARCHAR(120),
  role VARCHAR(120),
  skills JSONB DEFAULT '[]'::jsonb,
  joining_date DATE,
  salary NUMERIC(12,2),
  manager_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  location VARCHAR(255),
  status VARCHAR(50) DEFAULT 'Active',
  phone VARCHAR(50),
  productivity INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_employees_org ON employees(organization_id);
CREATE INDEX IF NOT EXISTS idx_employees_user ON employees(user_id);

CREATE TABLE IF NOT EXISTS salary_structures (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  basic NUMERIC(12,2) NOT NULL DEFAULT 0,
  hra NUMERIC(12,2) NOT NULL DEFAULT 0,
  transport_allowance NUMERIC(12,2) NOT NULL DEFAULT 0,
  medical_allowance NUMERIC(12,2) NOT NULL DEFAULT 0,
  other_allowances NUMERIC(12,2) NOT NULL DEFAULT 0,
  pf_deduction NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_deduction NUMERIC(12,2) NOT NULL DEFAULT 0,
  other_deductions NUMERIC(12,2) NOT NULL DEFAULT 0,
  gross_computed NUMERIC(12,2) GENERATED ALWAYS AS
    (basic + hra + transport_allowance + medical_allowance + other_allowances) STORED,
  net_computed NUMERIC(12,2) GENERATED ALWAYS AS
    (basic + hra + transport_allowance + medical_allowance + other_allowances
     - pf_deduction - tax_deduction - other_deductions) STORED,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_salary_structures_employee ON salary_structures(employee_id, effective_date DESC);

CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  roll_no VARCHAR(50),
  name VARCHAR(255),
  email VARCHAR(255),
  course VARCHAR(120),
  semester INTEGER,
  cgpa NUMERIC(3,2),
  attendance_percent NUMERIC(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_students_org ON students(organization_id);

CREATE TABLE IF NOT EXISTS attendance_logs (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  check_in_time TIMESTAMP,
  check_out_time TIMESTAMP,
  status VARCHAR(30) DEFAULT 'present',
  source VARCHAR(30) DEFAULT 'manual',
  face_verified BOOLEAN DEFAULT FALSE,
  location_verified BOOLEAN DEFAULT FALSE,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  location_name VARCHAR(255),
  location_city VARCHAR(255),
  distance_meters NUMERIC(10,2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attendance_org_date ON attendance_logs(organization_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance_logs(user_id, attendance_date);

CREATE TABLE IF NOT EXISTS leaves (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  leave_type VARCHAR(40) NOT NULL,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  reason TEXT,
  status VARCHAR(30) DEFAULT 'pending',
  reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reviewer_comments TEXT,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leaves_org_status ON leaves(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_leaves_user ON leaves(user_id);

CREATE TABLE IF NOT EXISTS leave_balances (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  leave_type VARCHAR(40) NOT NULL,
  leave_year INTEGER NOT NULL,
  allocated_days NUMERIC(6,2) DEFAULT 0,
  carry_forward_days NUMERIC(6,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (organization_id, employee_id, leave_type, leave_year)
);

CREATE TABLE IF NOT EXISTS leave_policies (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  leave_type VARCHAR(40) NOT NULL,
  allocated_days NUMERIC(6,2) NOT NULL DEFAULT 0,
  max_carry_forward_days NUMERIC(6,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (organization_id, leave_type)
);

CREATE INDEX IF NOT EXISTS idx_leave_policies_org_active ON leave_policies(organization_id, is_active);

CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
  assigned_to_employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  assignee_name VARCHAR(255),
  assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  priority VARCHAR(20) DEFAULT 'Medium',
  status VARCHAR(30) DEFAULT 'backlog',
  department VARCHAR(120),
  due_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tasks_org ON tasks(organization_id);

CREATE TABLE IF NOT EXISTS payroll_runs (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  pay_date DATE,
  status VARCHAR(40) NOT NULL DEFAULT 'draft',
  total_employees INTEGER DEFAULT 0,
  total_gross NUMERIC(14,2) DEFAULT 0,
  total_deductions NUMERIC(14,2) DEFAULT 0,
  total_net NUMERIC(14,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (organization_id, period_year, period_month)
);

CREATE INDEX IF NOT EXISTS idx_payroll_runs_org_period ON payroll_runs(organization_id, period_year, period_month);

CREATE TABLE IF NOT EXISTS payroll_entries (
  id SERIAL PRIMARY KEY,
  run_id INTEGER NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
  employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  employee_name VARCHAR(255),
  department VARCHAR(120),
  gross_pay NUMERIC(14,2) NOT NULL DEFAULT 0,
  deductions NUMERIC(14,2) NOT NULL DEFAULT 0,
  net_pay NUMERIC(14,2) NOT NULL DEFAULT 0,
  components JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (run_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_payroll_entries_run ON payroll_entries(run_id);

CREATE TABLE IF NOT EXISTS job_openings (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  department VARCHAR(120),
  location VARCHAR(255),
  description TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS candidates (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  experience_years NUMERIC(4,1) DEFAULT 0,
  skills JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS job_applications (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  job_id INTEGER NOT NULL REFERENCES job_openings(id) ON DELETE CASCADE,
  candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  status VARCHAR(30) NOT NULL DEFAULT 'applied',
  source VARCHAR(80),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (organization_id, job_id, candidate_id)
);

CREATE TABLE IF NOT EXISTS performance_goals (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'planned',
  progress NUMERIC(5,2) NOT NULL DEFAULT 0,
  weight NUMERIC(4,2) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_performance_goals_org ON performance_goals(organization_id);

CREATE TABLE IF NOT EXISTS performance_reviews (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  reviewer_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  period_start DATE,
  period_end DATE,
  overall_rating NUMERIC(3,1) DEFAULT 0,
  summary TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_performance_reviews_org ON performance_reviews(organization_id);

CREATE TABLE IF NOT EXISTS performance_feedback (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  review_id INTEGER NOT NULL REFERENCES performance_reviews(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  comment TEXT NOT NULL,
  sentiment VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_performance_feedback_org ON performance_feedback(organization_id);

CREATE TABLE IF NOT EXISTS employee_face_profiles (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  enrollment_status VARCHAR(30) NOT NULL DEFAULT 'pending',
  embedding_distance NUMERIC(8,4),
  liveness_score NUMERIC(8,4),
  verification_confidence NUMERIC(8,4) DEFAULT 0,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_verified_at TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (organization_id, employee_id)
);

CREATE TABLE IF NOT EXISTS employee_stress (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  stress_score NUMERIC(5,3) NOT NULL DEFAULT 0,
  stress_level VARCHAR(20) NOT NULL DEFAULT 'low',
  avg_work_hours_daily NUMERIC(5,2),
  task_count INTEGER DEFAULT 0,
  attendance_rate NUMERIC(5,2),
  leave_days_taken INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (organization_id, employee_id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(120) NOT NULL,
  resource_type VARCHAR(80) NOT NULL,
  resource_id INTEGER,
  before_state JSONB,
  after_state JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON audit_logs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
