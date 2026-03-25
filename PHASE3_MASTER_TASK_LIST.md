# PHASE 3: WORKPULSE MASTER TASK LIST - IMPLEMENTATION BREAKDOWN

**Objective**: Convert gap analysis into actionable, prioritized tasks with sub-tasks and effort estimates

**Format**: 
- **Level 1**: Priority category (11 total)
- **Level 2**: Feature module
- **Level 3**: Individual tasks
- **Level 4**: Sub-tasks with effort estimates

---

## PRIORITY MATRIX

```
┌─────────────────────┬──────────────────┬──────────────────┐
│  PRIORITY LEVEL     │   TIMELINE       │   MODULES        │
├─────────────────────┼──────────────────┼──────────────────┤
│  P0 - CRITICAL      │  Week 1-3        │ DB, API, RBAC    │
│  P1 - HIGH IMPACT   │  Week 4-7        │ Workflows, Notif │
│  P2 - CORE          │  Week 8-12       │ Payroll, Recruit │
│  P3 - INTERACTIVE   │  Week 13-15      │ Analytics, Forms │
│  P4 - POLISH        │  Week 16+        │ Mobile, ML, UX   │
└─────────────────────┴──────────────────┴──────────────────┘
```

---

# P0 - CRITICAL INFRASTRUCTURE (Weeks 1-3)

## PRIORITY 1: Database Foundation & ORM

### 1.1 Initialize PostgreSQL Database

**Effort**: 3 days | **Owner**: Backend Lead | **Dependencies**: None

**Tasks**:
```
□ 1.1.1 Install PostgreSQL locally and on dev server
  ├─ Subtask: Install PostgreSQL v14+ (1 day)
  ├─ Subtask: Create database 'workpulse_dev' (1 hour)
  └─ Subtask: Setup pgAdmin console (2 hours)

□ 1.1.2 Execute DATABASE_SCHEMA.sql
  ├─ Subtask: Run schema creation script (1 hour)
  ├─ Subtask: Create all tables (employees, leaves, attendance, etc.) (1 hour)
  ├─ Subtask: Create indexes for performance (1 hour)
  └─ Subtask: Verify all tables created with proper relationships (1 hour)

□ 1.1.3 Setup connection pooling & configuration
  ├─ Subtask: Create .env with DB credentials (30 min)
  ├─ Subtask: Configure connection pool (max 20 connections) (1 hour)
  ├─ Subtask: Test connection from Node.js (1 hour)
  └─ Subtask: Add health check endpoint GET /api/health/db (1 hour)
```

### 1.2 Implement ORM Layer (Sequelize)

**Effort**: 5 days | **Owner**: Backend Lead | **Dependencies**: 1.1

**Tasks**:
```
□ 1.2.1 Sequelize Setup & Configuration
  ├─ Subtask: npm install sequelize pg pg-hstore (30 min)
  ├─ Subtask: Create sequelize config file (config/sequelize.js) (1 hour)
  ├─ Subtask: Initialize Sequelize instance (1 hour)
  ├─ Subtask: Setup model loader (1 hour)
  └─ Subtask: Add database sync on startup (optional for dev) (1 hour)

□ 1.2.2 Create User Model & Migration
  ├─ Subtask: Define User model (id, email, password_hash, role) (1 hour)
  ├─ Subtask: Create migration for users table (1 hour)
  ├─ Subtask: Add unique index on email (30 min)
  ├─ Subtask: Add password hashing hooks (bcrypt) (1 hour)
  └─ Subtask: Test model CRUD operations (1 hour)

□ 1.2.3 Create Employee Model & Migration
  ├─ Subtask: Define Employee model (30+ fields per schema) (2 hours)
  ├─ Subtask: Setup associations (Employee hasMany Leaves, Attendance) (1 hour)
  ├─ Subtask: Create migration (1 hour)
  ├─ Subtask: Add indexes on frequently queried fields (1 hour)
  └─ Subtask: Add soft delete support (timestamps + paranoid) (1 hour)

□ 1.2.4 Create Attendance Model & Migration
  ├─ Subtask: Define Attendance model (employee_id, check_in, check_out, status) (1 hour)
  ├─ Subtask: Setup association to Employee (1 hour)
  ├─ Subtask: Create migration (1 hour)
  ├─ Subtask: Add indexes on date & employee_id (1 hour)
  └─ Subtask: Test model operations (1 hour)

□ 1.2.5 Create Leave Application Model & Migration
  ├─ Subtask: Define LeaveApplication model (employee_id, leave_type, from_date, to_date, status, reason) (1 hour)
  ├─ Subtask: Define LeaveAllocation model (employee_id, leave_type, balance, year) (1.5 hours)
  ├─ Subtask: Setup associations (Employee hasMany LeaveApplications, LeaveAllocations) (1 hour)
  ├─ Subtask: Create migrations (1 hour)
  └─ Subtask: Test model relationships (1 hour)

□ 1.2.6 Create Task & Project Models
  ├─ Subtask: Define Task model (title, description, assigned_to, status, due_date) (1 hour)
  ├─ Subtask: Define Project model (if needed) (1 hour)
  ├─ Subtask: Setup associations (1 hour)
  ├─ Subtask: Create migrations (1 hour)
  └─ Subtask: Test model operations (1 hour)
```

### 1.3 Database Migration Strategy

**Effort**: 2 days | **Owner**: DevOps/Backend | **Dependencies**: 1.2

**Tasks**:
```
□ 1.3.1 Setup Sequelize Migrations
  ├─ Subtask: Initialize migrations folder structure (30 min)
  ├─ Subtask: Create baseline migration (1 hour)
  ├─ Subtask: Create npm scripts: migrate, rollback (1 hour)
  └─ Subtask: Document migration process in README (1 hour)

□ 1.3.2 Implement Auditability
  ├─ Subtask: Add created_by, updated_by, created_at, updated_at to all models (2 hours)
  ├─ Subtask: Add before/after hooks for audit logging (2 hours)
  ├─ Subtask: Create audit log table schema (1 hour)
  └─ Subtask: Implement audit logger utility (2 hours)
```

---

## PRIORITY 2: API Layer Refactor & Pagination

### 2.1 API Response Standardization

**Effort**: 3 days | **Owner**: Backend Lead | **Dependencies**: 1.2

**Tasks**:
```
□ 2.1.1 Create Standard Response Wrapper
  ├─ Subtask: Create util/response.js with success/error formatters (1.5 hours)
  ├─ Subtask: Success response: {success: true, data, meta, pagination} (1 hour)
  ├─ Subtask: Error response: {success: false, error: {code, message, details}} (1 hour)
  ├─ Subtask: Pagination meta: {page, limit, total, totalPages} (1 hour)
  └─ Subtask: Update all controllers to use response wrapper (3 hours)

□ 2.1.2 Create Custom Error Classes
  ├─ Subtask: Create util/errors.js with custom error classes (1 hour)
  │  ├─ ValidationError
  │  ├─ NotFoundError
  │  ├─ UnauthorizedError
  │  ├─ ForbiddenError
  │  └─ ServerError
  ├─ Subtask: Setup error handler middleware (1 hour)
  ├─ Subtask: Update all controllers to throw custom errors (2 hours)
  └─ Subtask: Add error logging (1 hour)

□ 2.1.3 Add Request Validation Middleware
  ├─ Subtask: npm install joi (for schema validation) (30 min)
  ├─ Subtask: Create middleware/validate.js (1.5 hours)
  ├─ Subtask: Create schemas for each API endpoint (3 hours)
  ├─ Subtask: Apply validation middleware to all routes (2 hours)
  └─ Subtask: Test validation error responses (1.5 hours)

□ 2.1.4 Add Request ID Tracking (for debugging)
  ├─ Subtask: Create middleware that generates UUID for each request (1 hour)
  ├─ Subtask: Add request ID to response headers (30 min)
  ├─ Subtask: Add request ID to logs (1 hour)
  └─ Subtask: Create util/logger.js with structured logging (1.5 hours)
```

### 2.2 Pagination & Filtering Implementation

**Effort**: 4 days | **Owner**: Backend Lead | **Dependencies**: 2.1, 1.2

**Tasks**:
```
□ 2.2.1 Implement Pagination Middleware
  ├─ Subtask: Create middleware/pagination.js (1 hour)
  │  ├─ Parse query params: page, limit
  │  ├─ Validate: page >= 1, limit 1-100
  │  └─ Attach to req.pagination
  ├─ Subtask: Apply to all GET list endpoints (1 hour)
  ├─ Subtask: Update controllers to use pagination (2 hours)
  └─ Subtask: Test pagination with various limits (1 hour)

□ 2.2.2 Implement Sorting
  ├─ Subtask: Create middleware/sorting.js (1 hour)
  │  ├─ Parse query param: sort (e.g., "-created_at")
  │  ├─ Validate field names against model
  │  └─ Attach to req.sort
  ├─ Subtask: Apply to all LIST endpoints (1 hour)
  ├─ Subtask: Update controllers to use sort (2 hours)
  └─ Subtask: Test sorting ascending/descending (1 hour)

□ 2.2.3 Implement Filtering
  ├─ Subtask: Create middleware/filter.js (1.5 hours)
  │  ├─ Parse query param: filter (JSON or key=value)
  │  ├─ Support operators: eq, ne, gt, gte, lt, lte, in, like
  │  └─ Attach to req.filter
  ├─ Subtask: Apply to all LIST endpoints (1 hour)
  ├─ Subtask: Update controllers to use filter (3 hours)
  └─ Subtask: Test filtering with various operators (1 hour)

□ 2.2.4 Implement Full-Text Search
  ├─ Subtask: Add PostgreSQL FTS index on searchable fields (1.5 hours)
  ├─ Subtask: Create search middleware (1 hour)
  ├─ Subtask: Update employee/leave/task LIST endpoints to support search (2 hours)
  └─ Subtask: Test search quality (1 hour)
```

### 2.3 Update All Controllers to Use DB

**Effort**: 5 days | **Owner**: 2-3 Backend Developers | **Dependencies**: 2.2, 1.2

**Tasks**:
```
□ 2.3.1 Update Authentication Controller
  ├─ Subtask: Replace mock users with DB queries (1 hour)
  ├─ Subtask: Signup: INSERT user into db (1 hour)
  ├─ Subtask: Login: Query user from db + compare password hash (1 hour)
  ├─ Subtask: Me endpoint: Query user from db (1 hour)
  └─ Subtask: Test auth flow with DB (1.5 hours)

□ 2.3.2 Update Employee Controller
  ├─ Subtask: GET /api/employees: Query from db + apply filters/pagination (1 hour)
  ├─ Subtask: GET /api/employees/:id: Query single employee (30 min)
  ├─ Subtask: POST /api/employees: Insert new employee (1 hour)
  ├─ Subtask: PUT /api/employees/:id: Update employee (1 hour)
  ├─ Subtask: DELETE /api/employees/:id: Soft delete (1 hour)
  └─ Subtask: Test all CRUD operations (1.5 hours)

□ 2.3.3 Update Attendance Controller
  ├─ Subtask: POST /api/attendance/checkin: Insert attendance record (1 hour)
  ├─ Subtask: POST /api/attendance/checkout: Update attendance record (1 hour)
  ├─ Subtask: GET /api/attendance/user/:id: Query with pagination (1 hour)
  ├─ Subtask: Add status calculation logic (present/absent/half-day) (2 hours)
  └─ Subtask: Test attendance flow (1.5 hours)

□ 2.3.4 Update Leave Controller
  ├─ Subtask: POST /api/leaves: Insert leave application (1.5 hours)
  ├─ Subtask: GET /api/leaves: Query with pagination + filters (1 hour)
  ├─ Subtask: PUT /api/leaves/:id: Update leave status (1 hour)
  ├─ Subtask: Add leave balance validation before insertion (1.5 hours)
  └─ Subtask: Test leave flow (1.5 hours)

□ 2.3.5 Update Tasks & Students Controllers
  ├─ Subtask: Replace all mock data with DB queries (4 hours)
  ├─ Subtask: Test all endpoints (2 hours)
  └─ Subtask: Verify pagination/filtering works (1 hour)
```

---

## PRIORITY 3: RBAC & Security Implementation

### 3.1 Role & Permission Definition

**Effort**: 2 days | **Owner**: Backend Lead, Security | **Dependencies**: 1.2

**Tasks**:
```
□ 3.1.1 Define Roles & Permissions
  ├─ Subtask: Create Roles table: id, name, description (1 hour)
  ├─ Subtask: Create Permissions table: id, name, resource, action (1 hour)
  ├─ Subtask: Create RolePermissions junction table (30 min)
  ├─ Subtask: Define standard roles (EMPLOYEE, MANAGER, HR_ADMIN, FINANCE_ADMIN, SUPER_ADMIN) (1 hour)
  ├─ Subtask: Define 50+ permissions (leave_create, leave_approve, employee_view, etc.) (2 hours)
  ├─ Subtask: Assign permissions to roles via migration (2 hours)
  └─ Subtask: Create seeding script for permissions (1 hour)

□ 3.1.2 RBAC Implementation in Backend
  ├─ Subtask: Create middleware/authorize.js (1.5 hours)
  ├─ Subtask: Create decorators for route protection (@RequireRole, @RequirePermission) (1.5 hours)
  ├─ Subtask: Implement permission checking in middleware (1 hour)
  └─ Subtask: Test RBAC on sample routes (1 hour)
```

### 3.2 Data-Level Access Control

**Effort**: 3 days | **Owner**: Backend Lead | **Dependencies**: 3.1

**Tasks**:
```
□ 3.2.1 Employee Data Scope
  ├─ Subtask: In employeeController.getEmployees(), filter by role (1 hour)
  │  ├─ EMPLOYEE: Only see themselves
  │  ├─ MANAGER: Only see their team
  │  ├─ HR_ADMIN: See all
  │  └─ SUPER_ADMIN: See all
  ├─ Subtask: Implement in all employee queries (1 hour)
  ├─ Subtask: Test data isolation (1 hour)
  └─ Subtask: Document access model (30 min)

□ 3.2.2 Sensitive Field Masking
  ├─ Subtask: Create util/fieldMasking.js (1 hour)
  ├─ Subtask: Define sensitive fields per resource (salary, ssn, aadhar, phone, email) (1 hour)
  ├─ Subtask: Mask sensitive fields based on role (1.5 hours)
  │  ├─ EMPLOYEE: Can see own sensitive data only
  │  ├─ MANAGER: Can see team's salary (not HR data)
  │  ├─ HR_ADMIN: Can see all
  │  └─ Finance: Can see salary only
  ├─ Subtask: Apply to attendance, leave, employee endpoints (2 hours)
  └─ Subtask: Test field masking (1 hour)

□ 3.2.3 Leave Request Access Control
  ├─ Subtask: Only employee can view their own leave requests (1 hour)
  ├─ Subtask: Manager can view team's leave requests (1 hour)
  ├─ Subtask: HR_ADMIN can view all (1 hour)
  └─ Subtask: Test access controls (1 hour)
```

### 3.3 Audit Logging

**Effort**: 2 days | **Owner**: Backend Lead | **Dependencies**: 3.1

**Tasks**:
```
□ 3.3.1 Create Audit Log Infrastructure
  ├─ Subtask: Create AuditLog model: {user_id, resource, action, old_value, new_value, timestamp, ip_address} (1 hour)
  ├─ Subtask: Create migration for audit_logs table (1 hour)
  ├─ Subtask: Create util/auditLogger.js (1 hour)
  ├─ Subtask: Add hooks to Employee, Leave, Attendance models to log changes (2 hours)
  └─ Subtask: Setup immutable audit log (no deletes, only inserts) (1 hour)

□ 3.3.2 Audit Endpoints
  ├─ Subtask: Create GET /api/audit-logs (with access control for HR only) (1 hour)
  ├─ Subtask: Support filtering by resource, action, date range (1.5 hours)
  ├─ Subtask: Create export to CSV functionality (1.5 hours)
  └─ Subtask: Test audit logging end-to-end (1 hour)
```

---

# P1 - HIGH IMPACT (Weeks 4-7)

## PRIORITY 4: Workflow Engine & Notifications

### 4.1 Generic Workflow Engine

**Effort**: 5 days | **Owner**: Backend Architect | **Dependencies**: 1.2, 2.3

**Tasks**:
```
□ 4.1.1 Workflow Engine Core
  ├─ Subtask: Create Workflow model: {id, name, steps, trigger, is_active} (1 hour)
  ├─ Subtask: Create WorkflowInstance model: {workflow_id, resource_id, current_step, state, data} (1 hour)
  ├─ Subtask: Create WorkflowStep model: {workflow_id, step_number, required_role, action, next_step} (1 hour)
  ├─ Subtask: Create util/workflowEngine.js : coordinate state transitions (3 hours)
  ├─ Subtask: Implement step completion & validation (2 hours)
  └─ Subtask: Test workflow transitions (1.5 hours)

□ 4.1.2 Leave Approval Workflow
  ├─ Subtask: Define LeaveApproval workflow configuration (1 hour)
  │  Step 1: EMPLOYEE submits → state = PENDING_MANAGER
  │  Step 2: MANAGER approves → state = PENDING_HR
  │  Step 3: HR approves → state = APPROVED
  ├─ Subtask: Implement leave submission to trigger workflow (1.5 hours)
  ├─ Subtask: Add manager approval endpoint with validation (1.5 hours)
  ├─ Subtask: Add HR approval endpoint (1 hour)
  ├─ Subtask: Add rejection handler (1 hour)
  ├─ Subtask: Deduct leave balance on approval (1 hour)
  └─ Subtask: Test complete leave workflow (1.5 hours)

□ 4.1.3 Expense Claim Workflow
  ├─ Subtask: Define ExpenseApproval workflow (1 hour)
  ├─ Subtask: Create Expense & ExpenseItem models (1.5 hours)
  ├─ Subtask: Implement workflow steps (manager → finance → approved) (2 hours)
  ├─ Subtask: Add rejection with comments (1 hour)
  └─ Subtask: Test expense workflow (1.5 hours)

□ 4.1.4 Other Workflows (Shift Swap, Overtime, etc.)
  ├─ Subtask: Define Shift Swap workflow (1 hour)
  ├─ Subtask: Define Overtime Approval workflow (1 hour)
  ├─ Subtask: Seed workflows into database (1 hour)
  └─ Subtask: Test all workflows (1.5 hours)
```

### 4.2 Notification System

**Effort**: 4 days | **Owner**: Backend Lead | **Dependencies**: 4.1

**Tasks**:
```
□ 4.2.1 Notification Infrastructure
  ├─ Subtask: Create Notification model: {user_id, title, message, type, resource_id, read, created_at} (1 hour)
  ├─ Subtask: Create NotificationTemplate model: {name, subject, body, variables} (1 hour)
  ├─ Subtask: Create NotificationPreference model: {user_id, notification_type, enabled} (1 hour)
  ├─ Subtask: Create util/notificationService.js (2 hours)
  └─ Subtask: Setup notification event bus (1 hour)

□ 4.2.2 In-App Notifications
  ├─ Subtask: Create notification trigger on leave submission (1 hour)
  ├─ Subtask: Create notification trigger on leave approval (1 hour)
  ├─ Subtask: Create GET /api/notifications endpoint (1 hour)
  ├─ Subtask: Create PUT /api/notifications/:id/read endpoint (1 hour)
  ├─ Subtask: Frontend integration (polling or websockets) (Will be in P3)
  └─ Subtask: Test in-app notifications (1 hour)

□ 4.2.3 Email Notifications
  ├─ Subtask: npm install nodemailer (30 min)
  ├─ Subtask: Create util/emailService.js (1.5 hours)
  │  ├─ SMTP configuration
  │  ├─ Template rendering
  │  └─ Retry logic
  ├─ Subtask: Create email templates (30 min each):
  │  ├─ LeaveApprovalEmail
  │  ├─ LeaveRejectionEmail
  │  ├─ ManagerApprovalRequiredEmail
  │  └─ AdminAlertEmail (total 2 hours)
  ├─ Subtask: Trigger emails on workflow actions (2 hours)
  ├─ Subtask: Test email delivery (1 hour)
  └─ Subtask: Setup email queue for reliability (1 hour)

□ 4.2.4 SMS/Push Notifications (Optional for P4)
  ├─ Subtask: npm install firebase-admin (30 min)
  ├─ Subtask: Setup Firebase Cloud Messaging (1 hour)
  ├─ Subtask: Create SMS provider integration stub (1 hour)
  └─ Subtask: Document integration steps (30 min)
```

---

## PRIORITY 5: Leave System Complete Implementation

### 5.1 Leave Allocation & Balance

**Effort**: 3 days | **Owner**: Backend Lead | **Dependencies**: 2.3, 4.1

**Tasks**:
```
□ 5.1.1 Leave Allocation Setup
  ├─ Subtask: Create LeaveAllocation model: {employee_id, leave_type, allocated_balance, financial_year} (1 hour)
  ├─ Subtask: Create migration (1 hour)
  ├─ Subtask: Create leave type templates (Casual, Sick, Earned, Unpaid, etc.) (1 hour)
  ├─ Subtask: Seed initial allocations for existing employees (1 hour)
  └─ Subtask: Create endpoint for HR to allocate leave: POST /api/leave-allocations (1.5 hours)

□ 5.1.2 Leave Balance Calculation
  ├─ Subtask: Implement balance calculation logic (1.5 hours)
  │  ├─ Total allocated for year
  │  ├─ Minus approved leaves
  │  ├─ Equals remaining balance
  ├─ Subtask: GET /api/employees/:id/leave-balance endpoint (1 hour)
  ├─ Subtask: Cache balance for performance (1 hour)
  └─ Subtask: Test balance calculation edge cases (1 hour)

□ 5.1.3 Leave Carry-Forward Rules
  ├─ Subtask: Define carry-forward rules per leave type (1 hour)
  ├─ Subtask: Implement auto-carry-forward on fiscal year end (2 hours)
  ├─ Subtask: Setup leave forfeiture (unused carries expire) (1.5 hours)
  └─ Subtask: Test carry-forward execution (1 hour)
```

### 5.2 Holiday Calendar

**Effort**: 2 days | **Owner**: Backend Lead | **Dependencies**: 5.1

**Tasks**:
```
□ 5.2.1 Holiday Management
  ├─ Subtask: Create Holiday model: {date, name, type (national/regional/company)} (1 hour)
  ├─ Subtask: Create migration + seed national holidays (1 hour)
  ├─ Subtask: Create POST /api/holidays endpoint (HR only) (1 hour)
  └─ Subtask: Create GET /api/holidays with filtering (1 hour)

□ 5.2.2 Leave Duration Calculation
  ├─ Subtask: Exclude holidays from leave duration (1.5 hours)
  ├─ Subtask: Exclude weekends (configurable) (1 hour)
  ├─ Subtask: Calculate working days in leave period (1.5 hours)
  └─ Subtask: Test duration calculation with holidays (1 hour)
```

### 5.3 Leave Request Enhancements

**Effort**: 2 days | **Owner**: Backend Lead | **Dependencies**: 5.2

**Tasks**:
```
□ 5.3.1 Leave Request Validations
  ├─ Subtask: Validate start_date >= today (1 hour)
  ├─ Subtask: Validate sufficient balance available (1 hour)
  ├─ Subtask: Prevent overlapping leaves (1 hour)
  ├─ Subtask: Prevent excessive consecutive leaves (if rules defined) (1 hour)
  ├─ Subtask: Require reason for leave (1 hour)
  └─ Subtask: Test all validations (1 hour)

□ 5.3.2 Leave Cancellation & Amendment
  ├─ Subtask: Allow employee to cancel pending leave (1 hour)
  ├─ Subtask: Allow manager to cancel approved leave (with reason) (1 hour)
  ├─ Subtask: Auto-reinstate balance on cancellation (1 hour)
  └─ Subtask: Test cancellation flow (1 hour)
```

---

## PRIORITY 6: Attendance System Enhancements

### 6.1 Attendance Status Calculation

**Effort**: 3 days | **Owner**: Backend Lead | **Dependencies**: 5.2

**Tasks**:
```
□ 6.1.1 Attendance Status Logic
  ├─ Subtask: Implement status calculation utility (1.5 hours)
  │  PRESENT: Check-in & Check-out done
  │  ABSENT: No check-in or check-out, no leave approved
  │  HALF_DAY: Only one of check-in/check-out, no leave
  │  ON_LEAVE: Approved leave exists for this date
  │  WEEKEND: Date is Saturday/Sunday
  │  HOLIDAY: Date is in holiday calendar
  ├─ Subtask: Add status field to attendance record (1 hour)
  ├─ Subtask: Calculate status on checkout or end-of-day (2 hours)
  ├─ Subtask: Batch update status for past dates (1.5 hours)
  └─ Subtask: Test status calculation (1.5 hours)

□ 6.1.2 Late Arrival & Early Departure
  ├─ Subtask: Define shift-based expected times (1 hour)
  ├─ Subtask: Calculate late minutes on check-in (1 hour)
  ├─ Subtask: Calculate early departure minutes on checkout (1 hour)
  ├─ Subtask: Store lateness metrics for reporting (1 hour)
  └─ Subtask: Test lateness logic (1 hour)

□ 6.1.3 Geolocation Validation
  ├─ Subtask: Store office coordinates in settings (1 hour)
  ├─ Subtask: Validate check-in from office location ±500m (1.5 hours)
  ├─ Subtask: Reject check-in from remote locations (1 hour)
  ├─ Subtask: Allow override for work-from-home (1 hour)
  └─ Subtask: Test geolocation validation (1 hour)
```

### 6.2 Face Recognition Integration

**Effort**: 2 days | **Owner**: ML Engineer | **Dependencies**: Existing model

**Tasks**:
```
□ 6.2.1 Wiring Face Recognition API
  ├─ Subtask: Expose ML model endpoint: POST /ml/attendance/face-verify (30 min)
  ├─ Subtask: Create util/faceRecognitionService.js (1 hour)
  ├─ Subtask: Integrate with check-in endpoint (1.5 hours)
  ├─ Subtask: Validate face match before recording attendance (1 hour)
  └─ Subtask: Test face recognition flow (1 hour)

□ 6.2.2 Face Image Management
  ├─ Subtask: Create FaceImage model for storing employee photos (1 hour)
  ├─ Subtask: Setup image storage (S3 or local) (1 hour)
  ├─ Subtask: Create face enrollment endpoint for new employees (1.5 hours)
  └─ Subtask: Test face image upload & retrieval (1 hour)
```

### 6.3 Attendance Reports & Analytics

**Effort**: 2 days | **Owner**: Backend Lead | **Dependencies**: 6.1

**Tasks**:
```
□ 6.3.1 Attendance Summary Reports
  ├─ Subtask: Daily attendance report (present/absent/leave count) (1 hour)
  ├─ Subtask: Monthly attendance report per employee (1 hour)
  ├─ Subtask: Department-wise attendance report (1 hour)
  ├─ Subtask: Export attendance to CSV (1 hour)
  └─ Subtask: Test reports (1 hour)

□ 6.3.2 Attendance Regularization Workflow
  ├─ Subtask: Create attendance regularization request for marking absent as present (1.5 hours)
  ├─ Subtask: Implement manager approval for regularization (1.5 hours)
  ├─ Subtask: Store regularization audit trail (1 hour)
  └─ Subtask: Test regularization workflow (1 hour)
```

---

# P2 - CORE MODULES (Weeks 8-12)

## PRIORITY 7: Payroll System

### 7.1 Payroll Master Data

**Effort**: 4 days | **Owner**: Backend Lead, Finance | **Dependencies**: 1.2, 2.3

**Tasks**:
```
□ 7.1.1 Salary Structure Setup
  ├─ Subtask: Create SalaryStructure model: {name, company, components} (1 hour)
  ├─ Subtask: Create SalaryComponent model: {name, type (basic/allowance/deduction), formula} (1 hour)
  ├─ Subtask: Create SalaryStructureAssignment model: {employee_id, salary_structure_id, effective_date} (1 hour)
  ├─ Subtask: Create migration (1 hour)
  ├─ Subtask: Create POST /api/salary-structures (1 hour)
  ├─ Subtask: Create GET /api/salary-structures endpoint (1 hour)
  └─ Subtask: Test salary structure CRUD (1 hour)

□ 7.1.2 Income Tax Setup
  ├─ Subtask: Create IncomeTaxSlab model: {min, max, rate, effective_year} (1 hour)
  ├─ Subtask: Create migration (1 hour)
  ├─ Subtask: Seed standard tax slabs (1 hour)
  ├─ Subtask: Create POST /api/income-tax-slabs (1 hour)
  └─ Subtask: Test tax slabs (1 hour)

□ 7.1.3 Deduction Management
  ├─ Subtask: Create Deduction model: {employee_id, type (tax/advance/loan), amount, months_remaining} (1 hour)
  ├─ Subtask: Create migration (1 hour)
  ├─ Subtask: Create POST /api/deductions (1 hour)
  └─ Subtask: Test deduction creation (1 hour)
```

### 7.2 Salary Slip Generation

**Effort**: 4 days | **Owner**: Backend Lead | **Dependencies**: 7.1, 6.1

**Tasks**:
```
□ 7.2.1 Salary Slip Model & Generation
  ├─ Subtask: Create SalarySlip model: {employee_id, month, year, earnings, deductions, net_salary} (1 hour)
  ├─ Subtask: Create SalarySlipComponent model: {salary_slip_id, component_id, amount} (1 hour)
  ├─ Subtask: Create migration (1 hour)
  ├─ Subtask: Implement salary slip calculation logic (3 hours)
  │  ├─ Get salary structure for employee
  │  ├─ Get attendance for the month
  │  ├─ Calculate basic on 26 working days (or actual)
  │  ├─ Calculate allowances
  │  ├─ Deduct tax based on annual salary
  │  ├─ Deduct other deductions
  │  ├─ Calculate net salary
  │  └─ Store all components
  ├─ Subtask: Create POST /api/payroll/calculate-slips (batch) (1.5 hours)
  ├─ Subtask: Create GET /api/salary-slips/:id (1 hour)
  └─ Subtask: Test salary slip generation (1.5 hours)

□ 7.2.2 Salary Slip PDF Generation
  ├─ Subtask: npm install pdfkit (30 min)
  ├─ Subtask: Create util/pdfGenerator.js for salary slip (2 hours)
  ├─ Subtask: GET /api/salary-slips/:id/pdf endpoint (1 hour)
  └─ Subtask: Test PDF generation (1 hour)
```

### 7.3 Payroll Processing & Release

**Effort**: 3 days | **Owner**: Backend Lead | **Dependencies**: 7.2

**Tasks**:
```
□ 7.3.1 Payroll Processing Workflow
  ├─ Subtask: Create PayrollProcessing model: {month, year, status, processed_date} (1 hour)
  ├─ Subtask: Implement payroll lock (prevent changes after payroll run) (1.5 hours)
  ├─ Subtask: Implement payroll release approval workflow (1.5 hours)
  ├─ Subtask: Create POST /api/payroll/process (1.5 hours)
  └─ Subtask: Test payroll processing (1 hour)

□ 7.3.2 Payroll Reports
  ├─ Subtask: Create payroll summary report (total salary, total tax, etc.) (1 hour)
  ├─ Subtask: Export payroll to CSV for bank transfer (1.5 hours)
  ├─ Subtask: Create department-wise payroll report (1 hour)
  └─ Subtask: Test reports (1 hour)
```

---

## PRIORITY 8: Recruitment System

### 8.1 Job Management

**Effort**: 3 days | **Owner**: Backend Lead | **Dependencies**: 1.2, 4.1

**Tasks**:
```
□ 8.1.1 Job Opening Management
  ├─ Subtask: Create JobOpening model: {title, description, department, count, salary_range, status, posted_date} (1 hour)
  ├─ Subtask: Create migration (1 hour)
  ├─ Subtask: Create POST /api/job-openings (1 hour)
  ├─ Subtask: Create GET /api/job-openings (with filters) (1 hour)
  ├─ Subtask: Create PUT /api/job-openings/:id (update, close) (1 hour)
  └─ Subtask: Create DELETE /api/job-openings/:id (1 hour)

□ 8.1.2 Job Skills & Requirements
  ├─ Subtask: Create JobRequirement model: {job_opening_id, skill, years_required, mandatory} (1 hour)
  ├─ Subtask: Create migration (1 hour)
  ├─ Subtask: Create endpoints for managing requirements (1 hour)
  └─ Subtask: Test job management (1 hour)
```

### 8.2 Applicant Tracking

**Effort**: 4 days | **Owner**: Backend Lead & ML | **Dependencies**: 8.1, 4.1

**Tasks**:
```
□ 8.2.1 Job Applicant Model
  ├─ Subtask: Create JobApplicant model: {job_opening_id, email, phone, applied_date, status, resume_url} (1 hour)
  ├─ Subtask: Create migration (1 hour)
  ├─ Subtask: Create POST /api/job-openings/:id/apply endpoint (public) (1 hour)
  ├─ Subtask: Create file upload for resume (1.5 hours)
  ├─ Subtask: Create GET /api/job-applications (list all) (1 hour)
  └─ Subtask: Test applicant submission (1 hour)

□ 8.2.2 Resume Screening Integration
  ├─ Subtask: Integrate resume_screening_model on applicant submission (1.5 hours)
  ├─ Subtask: Calculate resume score against job requirements (1.5 hours)
  ├─ Subtask: Store resume score in database (1 hour)
  ├─ Subtask: Auto-rank candidates by score (1 hour)
  └─ Subtask: Test resume screening (1 hour)

□ 8.2.3 Applicant Status Workflow
  ├─ Subtask: Create ApplicantStatus: APPLIED → SCREENING → SHORTLISTED → INTERVIEW → REJECTED/SELECTED (1 hour)
  ├─ Subtask: Implement status transition workflow (2 hours)
  ├─ Subtask: Create PUT /api/job-applications/:id/status endpoint (1 hour)
  └─ Subtask: Test applicant workflow (1 hour)
```

### 8.3 Interview Management

**Effort**: 3 days | **Owner**: Backend Lead | **Dependencies**: 8.2, 4.1

**Tasks**:
```
□ 8.3.1 Interview Rounds
  ├─ Subtask: Create InterviewRound model: {applicant_id, round_number, interview_type, scheduled_date, interviewer_id, status, feedback} (1.5 hours)
  ├─ Subtask: Create migration (1 hour)
  ├─ Subtask: Create POST /api/interviews (schedule interview) (1.5 hours)
  ├─ Subtask: Create GET /api/interviews (list) (1 hour)
  ├─ Subtask: Create PUT /api/interviews/:id/feedback (record feedback) (1 hour)
  ├─ Subtask: Create interview request workflow (notification to interviewer) (1.5 hours)
  └─ Subtask: Test interview flow (1 hour)

□ 8.3.2 Interview Feedback & Scoring
  ├─ Subtask: Create feedback template (1 hour)
  ├─ Subtask: Implement feedback scoring logic (1.5 hours)
  ├─ Subtask: Calculate average score across rounds (1 hour)
  ├─ Subtask: Auto-move to next round based on score threshold (1 hour)
  └─ Subtask: Test scoring (1 hour)
```

### 8.4 Offer Management

**Effort**: 2 days | **Owner**: Backend Lead | **Dependencies**: 8.3, 4.1

**Tasks**:
```
□ 8.4.1 Offer Letter Generation
  ├─ Subtask: Create JobOffer model: {applicant_id, salary, designation, joining_date, status} (1 hour)
  ├─ Subtask: Create migration (1 hour)
  ├─ Subtask: Create offer letter PDF template (1.5 hours)
  ├─ Subtask: Create POST /api/job-offers (issue offer) (1 hour)
  ├─ Subtask: Create GET /api/job-offers/:id/pdf endpoint (1 hour)
  └─ Subtask: Test offer generation (1 hour)

□ 8.4.2 Offer Acceptance/Rejection
  ├─ Subtask: Create POST /api/job-offers/:id/accept endpoint (1 hour)
  ├─ Subtask: Create POST /api/job-offers/:id/reject endpoint (1 hour)
  ├─ Subtask: On acceptance, create Employee record automatically (1.5 hours)
  ├─ Subtask: Send confirmation emails (1 hour)
  └─ Subtask: Test offer acceptance flow (1 hour)
```

---

## PRIORITY 9: Performance Management System

### 9.1 Appraisal Setup

**Effort**: 3 days | **Owner**: Backend Lead | **Dependencies**: 1.2, 4.1

**Tasks**:
```
□ 9.1.1 Performance Cycle Management
  ├─ Subtask: Create PerformanceCycle model: {name, start_date, end_date, status} (1 hour)
  ├─ Subtask: Create migration (1 hour)
  ├─ Subtask: Create POST /api/performance-cycles (1 hour)
  ├─ Subtask: Create GET /api/performance-cycles (1 hour)
  └─ Subtask: Test cycle management (1 hour)

□ 9.1.2 KRA & Goals Setup
  ├─ Subtask: Create KRA (Key Result Area) model: {performance_cycle_id, name, weight} (1 hour)
  ├─ Subtask: Create Goal model: {employee_id, kra_id, description, target, actual, status} (1 hour)
  ├─ Subtask: Create migration (1 hour)
  ├─ Subtask: Create POST /api/goals endpoint (1 hour)
  └─ Subtask: Test goal creation (1 hour)
```

### 9.2 Appraisal Workflow

**Effort**: 3 days | **Owner**: Backend Lead | **Dependencies**: 9.1, 4.1

**Tasks**:
```
□ 9.2.1 Appraisal Model & Workflow
  ├─ Subtask: Create PerformanceAppraisal model: {employee_id, performance_cycle_id, self_rating, manager_rating, hr_rating, status} (1 hour)
  ├─ Subtask: Create migration (1 hour)
  ├─ Subtask: Create POST /api/appraisals (initiate appraisal) (1.5 hours)
  ├─ Subtask: Implement multi-stage workflow (self-eval → manager-eval → HR review) (2 hours)
  ├─ Subtask: Create rating scales (1-5 or 1-10) (1 hour)
  └─ Subtask: Test appraisal workflow (1 hour)

□ 9.2.2 Performance Scoring
  ├─ Subtask: Implement goal achievement calculation (1.5 hours)
  ├─ Subtask: Implement weighted KRA scoring (1.5 hours)
  ├─ Subtask: Calculate overall performance rating (1 hour)
  └─ Subtask: Test scoring logic (1 hour)
```

### 9.3 Performance Analytics & ML Integration

**Effort**: 2 days | **Owner**: Backend Lead & ML | **Dependencies**: 9.2

**Tasks**:
```
□ 9.3.1 Performance Predictions (Using ML)
  ├─ Subtask: Integrate student_performance_model for performance prediction (1.5 hours)
  ├─ Subtask: Create POST /api/performance/predict endpoint (1 hour)
  ├─ Subtask: Identify at-risk performers (1.5 hours)
  ├─ Subtask: Generate performance improvement recommendations (1 hour)
  └─ Subtask: Test predictions (1 hour)

□ 9.3.2 Performance Reports
  ├─ Subtask: Create individual performance report (1 hour)
  ├─ Subtask: Create department performance comparison (1 hour)
  ├─ Subtask: Create performance trends over cycles (1.5 hours)
  └─ Subtask: Test reports (1 hour)
```

---

# P3 - INTERACTIVE FEATURES (Weeks 13-15)

## PRIORITY 10: Advanced Analytics & Dashboards

### 10.1 Analytics Backend

**Effort**: 3 days | **Owner**: Backend Lead & Data | **Dependencies**: 6.1, 7.2, 9.2

**Tasks**:
```
□ 10.1.1 Analytics Data Aggregation
  ├─ Subtask: Create analytics cache tables (1.5 hours)
  ├─ Subtask: Implement daily aggregation job (1.5 hours)
  │  ├─ Daily attendance aggregates
  │  ├─ Daily leave statistics
  │  ├─ Monthly payroll aggregates
  │  └─ Performance metrics
  ├─ Subtask: Setup cron job for aggregation (1 hour)
  └─ Subtask: Test aggregation (1 hour)

□ 10.1.2 Analytics Endpoints
  ├─ Subtask: GET /api/analytics/attendance (daily, weekly, monthly) (1.5 hours)
  ├─ Subtask: GET /api/analytics/leaves (trends, patterns) (1.5 hours)
  ├─ Subtask: GET /api/analytics/payroll (salary distribution, tax info) (1 hour)
  ├─ Subtask: GET /api/analytics/performance (department comparisons) (1 hour)
  ├─ Subtask: GET /api/analytics/recruitment (pipeline metrics) (1 hour)
  └─ Subtask: Test all analytics endpoints (1 hour)

□ 10.1.3 Attrition Prediction (ML)
  ├─ Subtask: Integrate attrition_model (predict who will leave) (1.5 hours)
  ├─ Subtask: Create POST /api/analytics/attrition-risk endpoint (1 hour)
  ├─ Subtask: Identify at-risk employees (1 hour)
  ├─ Subtask: Generate retention recommendations (1 hour)
  └─ Subtask: Test predictions (1 hour)
```

### 10.2 ML Model Integration

**Effort**: 2 days | **Owner**: ML Engineer | **Dependencies**: All models

**Tasks**:
```
□ 10.2.1 Model Monitoring & Retraining
  ├─ Subtask: Setup model performance tracking (1 hour)
  ├─ Subtask: Implement model versioning (1.5 hours)
  ├─ Subtask: Create retraining trigger logic (monthly/quarterly) (1.5 hours)
  └─ Subtask: Test model retraining (1 hour)

□ 10.2.2 Feature Importance & Explanations
  ├─ Subtask: Extract feature importance from ML models (1.5 hours)
  ├─ Subtask: Create explanations for predictions (1.5 hours)
  ├─ Subtask: Expose explanations in API responses (1 hour)
  └─ Subtask: Test explanations (1 hour)
```

---

## PRIORITY 11: Frontend Refactor & Advanced UI

### 11.1 Frontend Architecture & State Management

**Effort**: 5 days | **Owner**: Frontend Lead | **Dependencies**: 2.1, 10.1

**Tasks**:
```
□ 11.1.1 TypeScript Migration
  ├─ Subtask: Setup TypeScript configuration (tsconfig.json) (1 hour)
  ├─ Subtask: Convert core files to .tsx (App, main components) (2 hours)
  ├─ Subtask: Create type definitions for API responses (1.5 hours)
  ├─ Subtask: Setup type checking in build (1 hour)
  └─ Subtask: Test TypeScript compilation (1 hour)

□ 11.1.2 State Management (Zustand/Redux)
  ├─ Subtask: npm install zustand (or redux + toolkit) (30 min)
  ├─ Subtask: Create global stores (auth, employees, leaves, tasks) (2 hours)
  ├─ Subtask: Migrate useState logic to stores (2 hours)
  ├─ Subtask: Setup store persistence (localStorage) (1 hour)
  └─ Subtask: Test state management (1 hour)

□ 11.1.3 React Query (Data Fetching Cache)
  ├─ Subtask: npm install react-query (30 min)
  ├─ Subtask: Wrap app with QueryClientProvider (1 hour)
  ├─ Subtask: Setup cache invalidation strategies (1.5 hours)
  ├─ Subtask: Migrate API calls to useQuery hooks (2 hours)
  └─ Subtask: Test data caching & invalidation (1 hour)

□ 11.1.4 Error Boundaries & Global Error Handling
  ├─ Subtask: Create ErrorBoundary component (1 hour)
  ├─ Subtask: Create global error toast notifications (1.5 hours)
  ├─ Subtask: Setup error logging to backend (1 hour)
  └─ Subtask: Test error handling (1 hour)
```

### 11.2 Component Library & UI Improvements

**Effort**: 4 days | **Owner**: Frontend Lead | **Dependencies**: 11.1

**Tasks**:
```
□ 11.2.1 Component Library Setup
  ├─ Subtask: npm install @headlessui/react (or Radix UI) (30 min)
  ├─ Subtask: Create base components (Button, Input, Modal, Card, Table) (2 hours)
  ├─ Subtask: Create form components (FormInput, FormSelect, FormCheckbox, FormTextarea) (1.5 hours)
  ├─ Subtask: Create layout components (Header, Sidebar, Container) (1.5 hours)
  ├─ Subtask: Setup Storybook for component documentation (1 hour)
  └─ Subtask: Test component library (1 hour)

□ 11.2.2 Form Handling & Validation
  ├─ Subtask: npm install react-hook-form zod (1 hour)
  ├─ Subtask: Create reusable form components with validation (2 hours)
  ├─ Subtask: Create validation schemas for all major forms (2 hours)
  ├─ Subtask: Migrate existing forms to use react-hook-form (2 hours)
  └─ Subtask: Test form validation & submission (1 hour)

□ 11.2.3 Modal & Dialog Improvements
  ├─ Subtask: Create Modal component with animation (1 hour)
  ├─ Subtask: Create ConfirmDialog component (1 hour)
  ├─ Subtask: Create form modals for employee, leave, task management (2 hours)
  ├─ Subtask: Create multi-step form wizard (1.5 hours)
  └─ Subtask: Test modal components (1 hour)

□ 11.2.4 Table Component with Advanced Features
  ├─ Subtask: Create DataTable component (1 hour)
  ├─ Subtask: Add sorting, filtering, pagination to DataTable (2 hours)
  ├─ Subtask: Add row selection & bulk actions (1.5 hours)
  ├─ Subtask: Add inline editing (1 hour)
  ├─ Subtask: Add column configuration/visibility toggle (1 hour)
  └─ Subtask: Test DataTable (1 hour)
```

### 11.3 Dashboard Enhancements

**Effort**: 3 days | **Owner**: Frontend Lead | **Dependencies**: 10.1, 11.2

**Tasks**:
```
□ 11.3.1 Employee Dashboard
  ├─ Subtask: Create improved dashboard layout (1 hour)
  ├─ Subtask: Add personal KPI cards (attendance this month, leaves remaining, tasks assigned) (1.5 hours)
  ├─ Subtask: Add performance self-rating widget (1 hour)
  ├─ Subtask: Add leave request quick action (1 hour)
  └─ Subtask: Test dashboard (1 hour)

□ 11.3.2 Manager Dashboard
  ├─ Subtask: Create manager-specific dashboard (1.5 hours)
  ├─ Subtask: Add team attendance widget (present/absent today) (1 hour)
  ├─ Subtask: Add pending approvals widget (leave requests, expenses) (1 hour)
  ├─ Subtask: Add team performance scorecard (1.5 hours)
  ├─ Subtask: Add quick action buttons (approve leave, assign task) (1 hour)
  └─ Subtask: Test manager dashboard (1 hour)

□ 11.3.3 HR Dashboard
  ├─ Subtask: Create HR-specific dashboard (1.5 hours)
  ├─ Subtask: Add hiring metrics widget (applications, interviews, offers) (1.5 hours)
  ├─ Subtask: Add employee lifecycle widget (new hires, exits) (1 hour)
  ├─ Subtask: Add leave trends widget (most used leave types) (1 hour)
  ├─ Subtask: Add alerts widget (attrition risk, compliance issue (1 hour)
  └─ Subtask: Test HR dashboard (1 hour)

□ 11.3.4 Dashboard Customization
  ├─ Subtask: Allow users to customize widget visibility (1.5 hours)
  ├─ Subtask: Implement drag-drop widget reordering (1.5 hours)
  ├─ Subtask: Save dashboard preferences to backend (1 hour)
  └─ Subtask: Test customization (1 hour)
```

### 11.4 Mobile Responsive Redesign

**Effort**: 3 days | **Owner**: Frontend Lead | **Dependencies**: All pages

**Tasks**:
```
□ 11.4.1 Mobile Navigation
  ├─ Subtask: Create mobile bottom navigation bar (1 hour)
  ├─ Subtask: Implement drawer/hamburger menu (1 hour)
  ├─ Subtask: Hide desktop sidebar on mobile (1 hour)
  ├─ Subtask: Test mobile navigation (1 hour)

□ 11.4.2 Mobile Form Optimization
  ├─ Subtask: Simplify form layouts for mobile (1.5 hours)
  ├─ Subtask: Use mobile-friendly inputs (date picker, select) (1 hour)
  ├─ Subtask: Add single-column layout for mobile (1 hour)
  ├─ Subtask: Test mobile forms (1 hour)

□ 11.4.3 Mobile Actions & Gestures
  ├─ Subtask: Optimize check-in/check-out for one-tap (1 hour)
  ├─ Subtask: Add PWA capabilities (1.5 hours)
  ├─ Subtask: Implement offline mode (view last data, queue actions) (1.5 hours)
  ├─ Subtask: Test mobile experiences (1 hour)

□ 11.4.4 Mobile Performance
  ├─ Subtask: Code splitting for route-based loading (1 hour)
  ├─ Subtask: Image optimization & lazy loading (1 hour)
  ├─ Subtask: Reduce bundle size for mobile (1 hour)
  └─ Subtask: Test mobile performance (1 hour)
```

### 11.5 Real-time Updates & WebSockets

**Effort**: 2 days | **Owner**: Backend & Frontend Leads | **Dependencies**: All APIs

**Tasks**:
```
□ 11.5.1 WebSocket Setup
  ├─ Subtask: npm install socket.io (both sides) (30 min)
  ├─ Subtask: Setup Socket.IO server on Express (1.5 hours)
  ├─ Subtask: Create Socket.IO client on frontend (1 hour)
  ├─ Subtask: Implement authentication for sockets (1 hour)
  └─ Subtask: Test WebSocket connection (1 hour)

□ 11.5.2 Real-time Notifications
  ├─ Subtask: Send in-app notifications via WebSocket (1 hour)
  ├─ Subtask: Create notification toast component (1 hour)
  ├─ Subtask: Update notification count in real-time (1 hour)
  └─ Subtask: Test real-time notifications (1 hour)

□ 11.5.3 Updated Data Broadcasting
  ├─ Subtask: Broadcast employee updates to connected clients (1 hour)
  ├─ Subtask: Broadcast leave approval completions (1 hour)
  ├─ Subtask: Implement presence indicators (online/offline) (1.5 hours)
  └─ Subtask: Test data broadcasting (1 hour)
```

---

# P4 - POLISH & OPTIMIZATION (Weeks 16+)

## PRIORITY 12: Final Polish & Deployment

### 12.1 Performance Optimization

**Effort**: 2 days | **Owner**: Full Stack Team | **Dependencies**: 11.5

**Tasks**:
```
□ 12.1.1 Backend Optimization
  ├─ Subtask: Add database query caching with Redis (1.5 hours)
  ├─ Subtask: Implement database indexes for slow queries (1 hour)
  ├─ Subtask: Add API response compression (gzip) (1 hour)
  ├─ Subtask: Monitor & optimize hot endpoints (1 hour)
  └─ Subtask: Load test the backend (1.5 hours)

□ 12.1.2 Frontend Performance
  ├─ Subtask: Run Lighthouse audit (30 min)
  ├─ Subtask: Code split routes & lazy load (1 hour)
  ├─ Subtask: Implement virtual scrolling for large tables (1 hour)
  ├─ Subtask: Optimize images (compression, webp) (1 hour)
  └─ Subtask: Achieve Lighthouse score > 80 (1 hour)
```

### 12.2 Security Hardening

**Effort**: 2 days | **Owner**: Security Team | **Dependencies**: All

**Tasks**:
```
□ 12.2.1 Dependency Audits
  ├─ Subtask: npm audit fix for all vulnerabilities (1 hour)
  ├─ Subtask: Update all outdated packages (1 hour)
  ├─ Subtask: Audit sensitive npm packages (bcrypt, jwt) (1 hour)
  └─ Subtask: Setup automated dependency scanning (1 hour)

□ 12.2.2 API Security
  ├─ Subtask: Implement rate limiting (slow down brute force) (1.5 hours)
  ├─ Subtask: Add helmet.js for security headers (1 hour)
  ├─ Subtask: Implement CSRF protection (if needed) (1 hour)
  ├─ Subtask: Validate all inputs thoroughly (1 hour)
  └─ Subtask: Test security measures (1 hour)

□ 12.2.3 Data Protection
  ├─ Subtask: Encrypt sensitive data at rest (passwords, tokens) (1.5 hours)
  ├─ Subtask: Use HTTPS only in production (1 hour)
  ├─ Subtask: Implement data masking in logs (1 hour)
  ├─ Subtask: Create data retention policies (1 hour)
  └─ Subtask: Test data protection (1 hour)
```

### 12.3 Documentation & Training

**Effort**: 2 days | **Owner**: Tech Writer | **Dependencies**: All

**Tasks**:
```
□ 12.3.1 API Documentation
  ├─ Subtask: Generate Swagger/OpenAPI documentation (1 hour)
  ├─ Subtask: Document all endpoints with examples (2 hours)
  ├─ Subtask: Create API authentication guide (1 hour)
  └─ Subtask: Publish to Swagger UI (1 hour)

□ 12.3.2 User Documentation
  ├─ Subtask: Create employee user guide (1 hour)
  ├─ Subtask: Create manager user guide (1 hour)
  ├─ Subtask: Create HR admin guide (1 hour)
  ├─ Subtask: Create video tutorials (2 hours)
  ├─ Subtask: Create FAQ document (1 hour)
  └─ Subtask: Publish to knowledge base (1 hour)

□ 12.3.3 Developer Documentation
  ├─ Subtask: Create setup/development guide (1.5 hours)
  ├─ Subtask: Document architecture & design patterns (1.5 hours)
  ├─ Subtask: Create code style guide (1 hour)
  ├─ Subtask: Create deployment guide (1 hour)
  └─ Subtask: Document ML models & integration (1 hour)
```

### 12.4 Testing & QA

**Effort**: 3 days | **Owner**: QA Team | **Dependencies**: All features

**Tasks**:
```
□ 12.4.1 Unit Testing
  ├─ Subtask: Write unit tests for key business logic (3 hours)
  ├─ Subtask: Aim for 70%+ code coverage (2 hours)
  ├─ Subtask: Setup CI/CD to run tests automatically (1.5 hours)
  └─ Subtask: Test all critical paths (2 hours)

□ 12.4.2 Integration Testing
  ├─ Subtask: Test database operations (1.5 hours)
  ├─ Subtask: Test API endpoints end-to-end (2 hours)
  ├─ Subtask: Test workflows (leave approval, etc.) (1.5 hours)
  ├─ Subtask: Test cross-module interactions (1.5 hours)
  └─ Subtask: Test error handling (1 hour)

□ 12.4.3 User Acceptance Testing
  ├─ Subtask: Create test scenarios for each role (2 hours)
  ├─ Subtask: Test as employees / managers / HR (2 hours)
  ├─ Subtask: Test on different browsers & devices (2 hours)
  ├─ Subtask: Collect & fix bugs (2 hours)
  └─ Subtask: Sign-off from stakeholders (1 hour)
```

### 12.5 Deployment & Launch

**Effort**: 2 days | **Owner**: DevOps Team | **Dependencies**: 12.4

**Tasks**:
```
□ 12.5.1 Production Setup
  ├─ Subtask: Setup PostgreSQL on production server (1 hour)
  ├─ Subtask: Setup Redis cache on production (1 hour)
  ├─ Subtask: Setup Docker containers for app (1 hour)
  ├─ Subtask: Configure environment variables securely (1 hour)
  ├─ Subtask: Setup SSL/HTTPS certificates (1 hour)
  └─ Subtask: Setup CDN for static assets (1 hour)

□ 12.5.2 CI/CD Pipeline
  ├─ Subtask: Setup GitHub Actions (or Jenkins) (1 hour)
  ├─ Subtask: Configure automated tests on push (1 hour)
  ├─ Subtask: Configure automated deployment to staging (1 hour)
  ├─ Subtask: Configure manual approval for production (1 hour)
  └─ Subtask: Setup monitoring & alerting (1.5 hours)

□ 12.5.3 Launch
  ├─ Subtask: Data migration from legacy system (if any) (1-2 hours)
  ├─ Subtask: Beta testing with select users (1 hour)
  ├─ Subtask: Fix last-minute issues (1 hour)
  ├─ Subtask: Go-live (1 hour)
  ├─ Subtask: Monitor system health (2 hours)
  └─ Subtask: Collect user feedback & iterate (ongoing)
```

---

## SUMMARY: TASK COUNT & EFFORT

| Priority | Module | Tasks | Subtasks | Weeks (Effort) | Team Size |
|----------|--------|-------|----------|---|---|
| P0 | DB + API + RBAC | 11 | 120+ | 3 | 2-3 |
| P1 | Workflows + Notifications + Leave | 15 | 145+ | 4 | 2-3 |
| P2 | Payroll + Recruitment + Performance | 20 | 180+ | 5 | 3-4 |
| P3 | Analytics + Frontend Refactor | 18 | 160+ | 3 | 3-4 |
| P4 | Polish + Testing + Deploy | 12 | 90+ | 2 | 4-5 |
| **TOTAL** | **11 Modules** | **76** | **695+** | **16-20 months** | 2-5 |

---

## EXECUTION STRATEGY

### Weekly Sprints (16-20 weeks total)

**Weeks 1-3**: P0 - Critical Foundation
- Sprint 1: Database + ORM
- Sprint 2: API Standardization + Pagination
- Sprint 3: RBAC + Security

**Weeks 4-7**: P1 - Workflows & Leave
- Sprint 4: Workflow Engine
- Sprint 5: Notifications + Leave Allocation
- Sprint 6: Attendance Enhancements
- Sprint 7: Leave Analytics

**Weeks 8-12**: P2 - Core Modules
- Sprint 8-9: Payroll System
- Sprint 10-11: Recruitment System
- Sprint 12: Performance Management

**Weeks 13-15**: P3 - Analytics & UI
- Sprint 13: Backend Analytics
- Sprint 14-15: Frontend Refactor

**Weeks 16-20**: P4 - Polish & Launch
- Final testing, optimization, deployment

---

## RESOURCE ALLOCATION

**Recommended Team Structure**:
- **1 Backend Architect/Lead** (oversees all backend)
- **2 Full-Stack Backend Developers** (implement features)
- **2 Frontend Developers** (UI/UX)
- **1 ML Engineer** (model integration)
- **1 DevOps/DBA** (database, deployment)
- **1 QA Engineer** (testing)
- **1 Technical Writer** (documentation)

**Total: 9 people, working 16-20 weeks = ~6-7 months of development**

---

## RISK MITIGATION

| Risk | Mitigation |
|------|-----------|
| Database migration takes longer | Parallelize with ORM setup, test early |
| API changes require frontend updates | Use API versioning (/v1/), maintain backwards compat |
| Workflow engine too complex | Start simple (2 steps), expand iteratively |
| ML models underperform | Collect more training data, update monthly |
| Scope creep | Stick to priorities, defer "nice-to-haves" to Phase 2 |
| Performance issues at scale | Load test early, add caching upfront |

---

## SUCCESS CRITERIA

WorkPulse will be considered **"Enterprise-Grade"** when:
- ✅ All 11 major modules implemented
- ✅ >90% test coverage on critical paths
- ✅ Dashboard load time < 2 seconds
- ✅ API response time < 500ms (p95)
- ✅ Zero unplanned downtime in 1 week of production
- ✅ 95%+ feature parity with competitor HRMS
- ✅ Support 5000+ employees without degradation
- ✅ Full audit trail for compliance (SOX/GDPR)

