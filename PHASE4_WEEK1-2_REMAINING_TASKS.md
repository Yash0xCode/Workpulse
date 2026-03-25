# PHASE 4 WEEK 1-2: REMAINING WORK CHECKLIST

## CRITICAL PATH TO FUNCTIONAL SYSTEM

### ✅ COMPLETED (22 March)
- [x] Database models (10 models, all associations)
- [x] Service layer (5 services, 15+ methods)
- [x] Middleware stack (6 pieces, fully integrated)
- [x] Error handling (custom classes, centralized handler)
- [x] RBAC infrastructure (permission middleware, RBACService)
- [x] API response standardization
- [x] Server bootstrap

---

## 🔴 BLOCKING ISSUES (MUST FIX NOW)

### Issue 1: Controllers Still Use Old Pool Queries
**Status**: Drafted but not applied  
**Impact**: Services created but not used by endpoints  
**Fix**: Replace existing controller files (replace_string_in_file)

**Files to Update**:
1. `src/controllers/authController.js` - Use AuthService
2. `src/controllers/employeeController.js` - Use EmployeeService  
3. `src/controllers/attendanceController.js` - Use AttendanceService
4. `src/controllers/leaveController.js` - Use LeaveService

**Verification**: After replacement, server should start without errors
```bash
npm run dev
# Check: GET http://localhost:5000/health/db returns true
```

### Issue 2: Database Not Initialized
**Status**: Schema exists (docs/DATABASE_SCHEMA.sql) but not imported  
**Impact**: Cannot test endpoints with real data  
**Fix**: PostgreSQL setup + schema import

**Steps**:
```bash
# 1. Create .env from .env.example
cp .env.example .env
# Edit .env: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME

# 2. Create database
createdb workpulse_dev

# 3. Import schema (SKIP IF USING MIGRATIONS)
psql -d workpulse_dev < docs/DATABASE_SCHEMA.sql

# 4. Test connection
npm run dev
curl http://localhost:5000/health/db
# Expected: {"success": true, "message": "DB connected"}
```

### Issue 3: Routes Not Using Permission Middleware
**Status**: Middleware created but not wired to protected routes  
**Impact**: No endpoint-level access control  
**Fix**: Update route files to add permission checks

**Example**:
```javascript
// Before:
router.get('/', getEmployees);

// After:
router.get('/', 
  requirePermission(['employee_view']), 
  getEmployees
);
```

---

## 📋 PHASE 4 WEEK 2 TASKS (Priority Order)

### TIER 1: UNBLOCK DATABASE CONNECTIVITY
**Timeline**: 1-2 hours

- [ ] **T1.1**: Create .env from template
  - Location: `/Workpulse/backend/node/.env`
  - Template: `/Workpulse/backend/node/.env.example`
  - Action: Update DB credentials

- [ ] **T1.2**: Initialize PostgreSQL
  - Run: `createdb workpulse_dev`
  - Verify: `psql -l | grep workpulse_dev`

- [ ] **T1.3**: Import schema (if not using migrations)
  - Run: `psql -d workpulse_dev < docs/DATABASE_SCHEMA.sql`
  - Verify: `psql -d workpulse_dev -c "SELECT count(*) FROM pg_tables"`

- [ ] **T1.4**: Test Sequelize connection
  - Run: `npm run dev`
  - Test: `curl http://localhost:5000/health/db`
  - Expected: `{"success": true, "message": "Database connected"}`

### TIER 2: COMPLETE SERVICE INTEGRATION
**Timeline**: 2-3 hours

- [ ] **T2.1**: Update authController
  - File: `src/controllers/authController.js`
  - Replace pool queries with AuthService calls
  - Use sendSuccess/sendError from response.js

- [ ] **T2.2**: Update employeeController
  - File: `src/controllers/employeeController.js`
  - Replace pool queries with EmployeeService calls
  - Use sendPaginated for list endpoints

- [ ] **T2.3**: Update attendanceController
  - File: `src/controllers/attendanceController.js`
  - Replace pool queries with AttendanceService
  - Handle check-in/check-out workflow

- [ ] **T2.4**: Update leaveController
  - File: `src/controllers/leaveController.js`
  - Replace pool queries with LeaveService
  - Implement leave approval workflow

- [ ] **T2.5**: Test all endpoints
  - Start server: `npm run dev`
  - Test Auth: POST /api/auth/signup, /api/auth/login
  - Test Employees: GET /api/employees?page=1
  - Test Attendance: POST /api/attendance/checkin
  - Test Leaves: POST /api/leaves, PUT /api/leaves/:id/approve

### TIER 3: IMPLEMENT ENDPOINT PROTECTION
**Timeline**: 2-3 hours

- [ ] **T3.1**: Add permission middleware to auth routes
  - Routes: /api/auth/* (public)
  - Action: No permission needed

- [ ] **T3.2**: Add permission middleware to employee routes
  - Routes: GET /api/employees → requirePermission(['employee_view'])
  - Routes: POST /api/employees → requirePermission(['employee_create'])
  - Routes: PUT /api/employees/:id → requirePermission(['employee_edit'])
  - Routes: DELETE /api/employees/:id → requirePermission(['employee_delete'])

- [ ] **T3.3**: Add permission middleware to attendance routes
  - Routes: POST /api/attendance/checkin → requirePermission(['attendance_checkin'])
  - Routes: POST /api/attendance/checkout → requirePermission(['attendance_checkout'])
  - Routes: GET /api/attendance → requirePermission(['attendance_view'])

- [ ] **T3.4**: Add permission middleware to leave routes
  - Routes: POST /api/leaves → requirePermission(['leave_create'])
  - Routes: GET /api/leaves → requirePermission(['leave_view'])
  - Routes: PUT /api/leaves/:id/approve → requirePermission(['leave_approve'])
  - Routes: PUT /api/leaves/:id/reject → requirePermission(['leave_reject'])

- [ ] **T3.5**: Test permission enforcement
  - Test without token → 401 Unauthorized
  - Test with token but wrong permission → 403 Forbidden
  - Test with correct permission → 200 Success

### TIER 4: ADD REMAINING SERVICES
**Timeline**: 3-4 hours (can be parallel with TIER 3)

- [ ] **T4.1**: Create TaskService
  - Methods: createTask, getTasks, updateTask, deleteTask, assignTask
  - Parameters: taskId, orgId, userId
  - Pagination: Yes (default 20 items)

- [ ] **T4.2**: Create StudentService
  - Methods: getStudents, getStudentById, createStudent, updateStudent
  - Filters: course, semester, organization
  - Pagination: Yes

- [ ] **T4.3**: Create AnalyticsService
  - Methods: getAttendanceStats, getLeaveStats, getEmployeeStats, getTaskStats
  - Date range filtering: Yes
  - Aggregation: Daily/weekly/monthly

- [ ] **T4.4**: Create taskController, studentController, analyticsController
  - Use respective services
  - Apply permission middleware

### TIER 5: DATA SEEDING & TESTING
**Timeline**: 2 hours

- [ ] **T5.1**: Create seed script for roles
  ```javascript
  // src/scripts/seedRoles.js
  - Employee, Manager, HR Admin, Super Admin
  ```

- [ ] **T5.2**: Create seed script for permissions
  ```javascript
  // src/scripts/seedPermissions.js
  - employee_view, employee_create, employee_edit, employee_delete
  - leave_view, leave_create, leave_approve, leave_reject
  - attendance_checkin, attendance_checkout, attendance_view
  ```

- [ ] **T5.3**: Create seed script for default organization
  - Name: "Demo Organization"
  - Type: "corporate"
  - Admin user: admin@demo.com / password123

- [ ] **T5.4**: Run seeds
  ```bash
  npm run seed:roles
  npm run seed:permissions
  npm run seed:org
  ```

- [ ] **T5.5**: Test full flow
  - Signup: admin@demo.com
  - Login: admin@demo.com
  - Create Employee (with permission)
  - Create Leave Request
  - Approve Leave
  - Check Attendance

### TIER 6: API DOCUMENTATION
**Timeline**: 2-3 hours (can be done in Week 3)

- [ ] **T6.1**: Install Swagger
  - `npm install swagger-jsdoc swagger-ui-express`

- [ ] **T6.2**: Document each endpoint
  - Parameters (path, query, body)
  - Responses (success, error examples)
  - Required permissions

- [ ] **T6.3**: Generate OpenAPI spec
  - Endpoint: GET /api/docs
  - UI: Swagger UI dashboard

---

## 🧪 TESTING CHECKLIST

### Authentication Flow
```bash
# 1. Signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@1234","name":"Test User"}'

# 2. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@1234"}'
# Note: Copy JWT token from response

# 3. Use token
curl -X GET http://localhost:5000/api/employees \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Employee Operations
```bash
# List with pagination
curl "http://localhost:5000/api/employees?page=1&limit=10" \
  -H "Authorization: Bearer <TOKEN>"

# Create
curl -X POST http://localhost:5000/api/employees \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"userId": 1, "employeeCode": "E001", "department": "IT"}'

# Update
curl -X PUT http://localhost:5000/api/employees/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"department": "HR"}'
```

### Attendance Operations
```bash
# Check-in
curl -X POST http://localhost:5000/api/attendance/checkin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"latitude": 28.5240, "longitude": 77.1025}'

# Check-out
curl -X POST http://localhost:5000/api/attendance/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"latitude": 28.5240, "longitude": 77.1025}'

# Get attendance
curl "http://localhost:5000/api/attendance?userId=1" \
  -H "Authorization: Bearer <TOKEN>"
```

### Leave Operations
```bash
# Create request
curl -X POST http://localhost:5000/api/leaves \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "leaveType": "Casual",
    "fromDate": "2026-03-25",
    "toDate": "2026-03-26",
    "reason": "Personal work"
  }'

# Approve (as HR)
curl -X PUT http://localhost:5000/api/leaves/1/approve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{}'

# Get leaves
curl "http://localhost:5000/api/leaves?userId=1" \
  -H "Authorization: Bearer <TOKEN>"
```

### Permission Testing
```bash
# No token → 401
curl http://localhost:5000/api/employees

# Wrong permission → 403 (after RBAC setup)
curl http://localhost:5000/api/employees/delete/1 \
  -H "Authorization: Bearer <LIMITED_TOKEN>"

# Correct permission → 200
curl http://localhost:5000/api/employees \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

---

## 📊 SUCCESS CRITERIA

### Week 2 Definition of Done
- [ ] All 4 main controllers using services
- [ ] All endpoints tested and working
- [ ] Database initialized and populated
- [ ] Permission middleware attached to protected routes
- [ ] 100+ test cases passing (manual curl testing)
- [ ] No console errors on `npm run dev`

### API Response Examples

**Success**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "test@example.com",
    "name": "Test User"
  },
  "meta": {
    "timestamp": "2026-03-22T10:30:45.123Z",
    "version": "1.0"
  }
}
```

**Error**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password",
    "details": {},
    "timestamp": "2026-03-22T10:30:45.123Z"
  }
}
```

**Paginated**:
```json
{
  "success": true,
  "data": [
    {"id": 1, "name": "Employee 1"},
    {"id": 2, "name": "Employee 2"}
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    },
    "timestamp": "2026-03-22T10:30:45.123Z"
  }
}
```

---

## 📞 COMMON ISSUES & FIXES

### Error: "Cannot find module 'sequelize'"
**Fix**: `npm install sequelize` (already done, but verify)

### Error: "Database connection failed"
**Fix**: 
- Verify PostgreSQL is running
- Check .env credentials match your setup
- Run: `psql -U your_user -d workpulse_dev -c "SELECT 1"` to test

### Error: "UnauthorizedError: Invalid token"
**Fix**:
- Ensure JWT_SECRET in .env matches between signup/login
- Bearer token format: `Authorization: Bearer <token>`

### Error: "ForbiddenError: Insufficient permissions"
**Fix**:
- User's role must have the required permission
- Check RBACService.hasPermission() logic
- Verify seed script assigned permissions to role

### Error: "Cannot POST /api/leaves/1/approve"
**Fix**:
- Permission middleware must be before route handler
- Check routes/leaveRoutes.js order:
  ```javascript
  router.put('/:id/approve', 
    requirePermission(['leave_approve']),
    controller
  );
  ```

---

## 🎯 DELIVERABLE BY END OF WEEK 2

**Code**:
- Updated controllers (auth, employee, attendance, leave)
- Permission middleware on all protected routes
- 3 remaining services (task, student, analytics)

**Database**:
- PostgreSQL running with schema imported
- Initial data seeded (roles, permissions, default org)

**Documentation**:
- API endpoints documented
- Permission matrix defined
- Deployment checklist ready

**Testing**:
- 50+ manual endpoint tests passing
- No console errors
- Full authentication flow working

