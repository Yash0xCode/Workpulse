# PHASE 4 IMPLEMENTATION: WEEK 1-3 SETUP GUIDE

## Critical Path: Database Foundation & ORM Migration

### Step 1: Database Setup (Manual - PostgreSQL required)

```bash
# Install PostgreSQL if not already installed
# macOS: brew install postgresql
# Windows: Download from https://www.postgresql.org/download/windows/
# Linux: apt-get install postgresql

# Create database
psql -U postgres

postgres=# CREATE DATABASE workpulse_dev;
postgres=# \q

# Run schema
psql -U postgres -d workpulse_dev < docs/DATABASE_SCHEMA.sql
```

### Step 2: Backend Setup

```bash
cd backend/node

# Install dependencies (includes Sequelize)
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your database credentials
nano .env

# Test database connection
npm run dev
# Check: GET /health/db
```

### Step 3: Models & Services Architecture

**New Structure** (following Frappe/OrangeHRM patterns):

```
src/
├── models/              # Sequelize ORM models
│   ├── User.js
│   ├── Employee.js
│   ├── Leave.js
│   ├── Attendance.js
│   ├── Task.js
│   └── index.js         # Model associations
│
├── services/            # Business logic layer
│   ├── AuthService.js
│   ├── EmployeeService.js
│   ├── AttendanceService.js
│   ├── LeaveService.js
│   └── TaskService.js
│
├── controllers/         # HTTP handlers (minimal logic)
│   ├── authController.js
│   ├── employeeController.js
│   ├── attendanceController.js
│   ├── leaveController.js
│   └── taskController.js
│
├── middleware/          # Cross-cutting concerns
│   ├── auth.js
│   ├── errorHandler.js  # NEW: Centralized error handling
│   ├── pagination.js    # NEW: Pagination support
│   ├── sorting.js       # NEW: Sorting support
│   └── organizationContext.js  # NEW: Multi-tenant isolation
│
└── utils/
    ├── response.js      # NEW: Standard response format
    ├── errors.js        # NEW: Custom error classes
    └── logger.js        # TODO: Structured logging
```

### Step 4: API Response Format

**All endpoints now return standardized format:**

```json
{
  "success": true,
  "data": {...},
  "meta": {
    "timestamp": "2026-03-22T10:30:00Z",
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

**Error responses:**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "email": ["Invalid email format"],
      "password": ["Must be at least 8 characters"]
    },
    "timestamp": "2026-03-22T10:30:00Z",
    "requestId": "req_1234567890"
  }
}
```

### Step 5: Key Improvements Implemented

✅ **Database Layer**
- Sequelize ORM (replaces raw SQL queries)
- Model associations (Employee → Manager, Leave → Approver, etc.)
- Type safety with model validations
- Soft deletes support

✅ **API Layer**
- Standard response wrapper (success/error format)
- Pagination middleware (page, limit, offset)
- Sorting support (asc/desc by field)
- Error handling middleware (custom error classes)

✅ **Architecture**
- Service layer (business logic separation)
- Controller lean-ness (HTTP only)
- Middleware stack (auth → pagination → sorting → errors)
- Multi-tenant organization isolation

✅ **Security**
- JWT-based authentication
- Organization context enforcement
- Role-based access control ready
- Custom error messages (no SQL leaks)

### Step 6: Migration from Pool to Sequelize

**Before (old pool-based approach):**
```javascript
const { rows } = await pool.query('SELECT * FROM employees WHERE id = $1', [id]);
```

**After (new Sequelize approach):**
```javascript
const employee = await Employee.findByPk(id, {
  include: ['manager', 'user']
});
```

**Benefits:**
- Type-safe queries
- Automatic SQL injection prevention
- Built-in relationship loading
- Better error handling
- Testable with mock models

### Step 7: Testing the Setup

```bash
# Start backend
npm run dev

# Test endpoints
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "organizationName": "Test Corp",
    "organizationType": "corporate",
    "email": "admin@test.com",
    "password": "password123",
    "adminName": "Admin User"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "password123"
  }'

# Get employees (with pagination)
curl -H "Authorization: Bearer <TOKEN>" \
  "http://localhost:5000/api/employees?page=1&limit=20&sort=-created_at"

# Get with filters
curl -H "Authorization: Bearer <TOKEN>" \
  "http://localhost:5000/api/employees?department=Sales&status=Active"
```

### Step 8: Outstanding Tasks (P0 Week 2-3)

- [ ] RBAC enforcement (roles + permissions)
- [ ] Audit logging (who did what, when)
- [ ] API Documentation (Swagger/OpenAPI)
- [ ] Unit tests for services
- [ ] Database connection pooling tuning

### Notes

- Database schema already exists in `docs/DATABASE_SCHEMA.sql`
- Models mirror existing database structure
- Gradual migration: Can run pool and Sequelize in parallel
- No breaking changes to existing routes (yet)
- Frontend continues working with new API format

### Next: PHASE 4 Week 2

- P0: API Response Standardization ✓ (partially done)
- P0: RBAC Implementation & Middleware
- P1: Workflow Engine & Notifications
