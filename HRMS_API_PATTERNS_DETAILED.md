# ENTERPRISE HRMS: DETAILED API SPECIFICATIONS & PATTERNS

## API Endpoint Naming Conventions Analysis

### Frappe HRMS API Patterns

**Base URL**: `{base_url}/api/resource/`

#### Example Endpoints:
```
# Employee Management
GET    /api/resource/Employee
GET    /api/resource/Employee/EMP-001
POST   /api/resource/Employee
PUT    /api/resource/Employee/EMP-001
DELETE /api/resource/Employee/EMP-001

# Method-based Calls (Frappe-specific pattern)
POST   /api/resource/Employee/EMP-001/method/get_employee_details
POST   /api/resource/LeaveApplication/LEV-001/method/approve
POST   /api/resource/LeaveApplication/LEV-001/method/reject

# List Filters
GET    /api/resource/LeaveApplication?filters=[["employee","=","EMP-001"],["status","=","Pending"]]
GET    /api/resource/Employee?fields=["name","employee_name","email"]&limit_page_length=20

# Search
GET    /api/resource/Employee?q=John
```

#### Response Format:
```json
{
  "data": [
    {
      "name": "EMP-001",
      "employee_name": "John Doe",
      "email": "john@example.com",
      "department": "Engineering",
      "status": "Active"
    }
  ],
  "message": "Success",
  "exc": null
}
```

#### Query Parameter Patterns:
- `filters`: Multi-condition filter array `[["field","operator","value"]]`
- `fields`: Specific fields to return
- `limit_page_length`: Pagination limit
- `start`: Offset for pagination
- `order_by`: `"field_name asc"` or `"field_name desc"`
- `q`: Simple text search

---

### OrangeHRM API Patterns

**Base URL**: `{base_url}/api/v2/{modulePath}/`

#### Example Endpoints:
```
# Employee Module
GET    /api/v2/hr/employee
GET    /api/v2/hr/employee/1
POST   /api/v2/hr/employee
PUT    /api/v2/hr/employee/1
DELETE /api/v2/hr/employee/1

# Leave Management
GET    /api/v2/leave/leave-request
POST   /api/v2/leave/leave-request
PUT    /api/v2/leave/leave-request/1/approve
PUT    /api/v2/leave/leave-request/1/reject

# Recruitment
GET    /api/v2/recruitment/vacancy
POST   /api/v2/recruitment/vacancy
GET    /api/v2/recruitment/candidate
POST   /api/v2/recruitment/candidate/1/interview

# Attendance
GET    /api/v2/attendance/attendance-record
POST   /api/v2/attendance/punch-in
POST   /api/v2/attendance/punch-out
```

#### Query Parameters:
```
GET /api/v2/hr/employee?offset=0&limit=10&sortField=firstName&sortOrder=asc
GET /api/v2/hr/employee?firstName=John&departmentId=5
```

#### Response Format:
```json
{
  "data": [
    {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "departmentId": 5
    }
  ],
  "meta": {
    "total": 100,
    "offset": 0,
    "limit": 10
  }
}
```

#### Error Response:
```json
{
  "error": {
    "status": 404,
    "message": "Resource not found"
  }
}
```

---

### Horilla API Patterns

**Base URL**: `{base_url}/api/` or `{base_url}/api/v1/`

#### Example Endpoints:
```
# Employee CRUD
GET    /api/employee/
GET    /api/employee/1/
POST   /api/employee/
PUT    /api/employee/1/
PATCH  /api/employee/1/
DELETE /api/employee/1/

# Leave Management Workflow
POST   /api/leave/request/
GET    /api/leave/request/1/
PUT    /api/leave/request/1/approve/
PUT    /api/leave/request/1/reject/
GET    /api/leave/balance/{employee_id}/

# Attendance Punch
POST   /api/attendance/check-in/
POST   /api/attendance/check-out/
GET    /api/attendance/{employee_id}/

# Recruitment Pipeline
GET    /api/recruitment/job/
POST   /api/recruitment/job/
GET    /api/recruitment/candidate/
POST   /api/recruitment/candidate/
PUT    /api/recruitment/candidate/1/interview/
```

#### Query Parameters:
```
GET /api/employee/?page=1&limit=20&search=john&filter[department]=5&order_by=-created_at
```

#### Response Format:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "department": "Engineering"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

#### Error Response:
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "email": ["Email already exists"],
    "name": ["Name is required"]
  }
}
```

---

## Core Module Relationships

### Leave Management Data Flow

```
LeaveType
  ├── LeavePolicy (allowance per type)
  ├── LeaveAllocation (employee allotment)
  │   ├── LeaveRequest (employee request)
  │   │   ├── LeaveApprover (multi-level)
  │   │   ├── ApprovalHistory
  │   │   └── LeaveBalance (deduction)
  │   └── LeaveEncashment (unused leaves)
  └── HolidayList (blocked dates)
```

**Frappe Implementation**:
```python
class LeaveAllocation(Document):
    employee = Link("Employee")
    leave_type = Link("LeaveType")
    from_date = Date()
    to_date = Date()
    total_leaves_allocated = Int()
    balance_leaves = Currency()  # calculated field

class LeaveApplication(Document):
    employee = Link("Employee")
    leave_type = Link("LeaveType")
    from_date = Date()
    to_date = Date()
    half_day = Check()
    reason = Text()
    status = Select(["Draft", "Pending", "Approved", "Rejected"])
    
    def validate(self):
        # Check leave balance
        # Check for conflicts
        # Set approvers dynamically
```

**OrangeHRM Implementation**:
```
ompLeaveRequest (table)
  - id (PK)
  - empNumber (FK to ompEmployee)
  - leaveTypeId (FK to ompLeaveType)
  - fromDate
  - toDate
  - comments
  - status (Pending, Approved, Rejected)
  - createdDate
  - updatedDate

ompLeaveApprover (bridge table)
  - leaveRequestId (FK)
  - approverId (FK to ompEmployee)
  - actionedDate
  - comments
```

**Horilla Implementation**:
```python
class LeaveRequest(models.Model):
    employee = ForeignKey(Employee)
    leave_type = ForeignKey(LeaveType)
    from_date = DateField()
    to_date = DateField()
    reason = TextField()
    status = CharField(choices=[...])
    created_at = DateTimeField(auto_now_add=True)
    
    # Approval chain (ManyToMany or through table)
    approvers = ManyToManyField(Employee, through='LeaveApproval')

class LeaveApproval(models.Model):
    leave_request = ForeignKey(LeaveRequest)
    approver = ForeignKey(Employee)
    status = CharField(choices=[...])
    comments = TextField()
    approved_at = DateTimeField(null=True)
```

---

### Attendance Data Model

**Common Fields Across Systems**:
```
Attendance {
  employee_id (PK)
  attendance_date (PK)
  check_in_time (datetime, geolocation)
  check_out_time (datetime, geolocation)
  worked_hours (calculated)
  status (Present, Absent, Leave, Holiday, Late, Early)
  late_by_minutes (calculated)
  early_by_minutes (calculated)
  overtime_hours (calculated)
  notes (manager notes)
  approved_by (manager)
  synced_from (biometric/manual/api)
}
```

**Frappe**:
```python
class EmployeeCheckin(Document):
    employee = Link("Employee")
    checkin_time = DateTime()
    checkout_time = DateTime()
    checkin_lat = Float()
    checkin_lng = Float()
    
    def after_insert(self):
        # Update Attendance record
        # Calculate hours
        # Check for anomalies
```

**OrangeHRM**:
```
ompEmployeeAttendanceRecord {
  id (PK)
  empNumber (FK)
  attendanceDate
  attendanceStatus (Present, Absent, etc.)
  workspaceHoursOverTime
}
```

**Horilla**:
```python
class Attendance(models.Model):
    employee = ForeignKey(Employee)
    attendance_date = DateField(unique_together=['employee', 'attendance_date'])
    check_in = DateTimeField()
    check_out = DateTimeField()
    check_in_latitude = FloatField()
    check_in_longitude = FloatField()
    worked_hours = DecimalField(calculated=True)
    status = CharField()
```

---

### Recruitment Pipeline Data Model

**Workflow State Machine**:
```
Job Vacancy (Open)
  ↓
Job Candidate Applied
  ├── Initial Resume Screen (Accept/Reject/Shortlist)
  ├── Interview Round 1 (Schedule, Conduct, Feedback)
  ├── Interview Round 2/3 (if advanced)
  ├── HR Interview (if passed)
  ├── Final Selection (Selected/Not Selected)
  ├── Offer Letter (Generated, Accepted/Declined)
  └── Hire Employee (Create employee record)
```

**Frappe**:
```python
class JobOpening(Document):
    job_title = Data()
    designation = Link("Designation")
    status = Select(["Open", "Closed"])
    
class JobApplicant(Document):
    job_title = Data()
    applicant_name = Data()
    email = Data()
    status = Select(["Open", "Shortlist", "Interview", "Offer", "Hired", "Rejected"])
    
class JobApplicantSource(Document):
    applicant = Link("JobApplicant")
    source = Select(["Email", "Portal", "LinkedIn", "Referral"])
    date_of_application = Date()
```

**OrangeHRM**:
```
ompJobCandidate {
  id (PK)
  jobOpeningId (FK)
  candidateFirstName
  candidateLastName
  candidateEmail
  candidateContactNumber
  candidateResume (file reference)
  status (Application_Initiated, Shortlisted, Interview, etc.)
}

ompJobInterview {
  id (PK)
  candidateId (FK)
  interviewName
  interviewDate
  interviewDuration
  interviewer (Employee)
  status (Scheduled, Conducted, Cancelled)
}
```

**Horilla**:
```python
class RecruitmentJob(models.Model):
    job_title = CharField()
    job_description = TextField()
    vacancy = IntegerField()
    status = CharField(choices=[...])
    published_date = DateTimeField()

class JobCandidate(models.Model):
    recruitment_job = ForeignKey(RecruitmentJob)
    first_name = CharField()
    last_name = CharField()
    email = EmailField()
    phone = CharField()
    resume = FileField()
    status = CharField()
    
class InterviewSchedule(models.Model):
    candidate = ForeignKey(JobCandidate)
    interview_round = IntegerField()
    scheduled_date = DateTimeField()
    interviewer = ForeignKey(Employee)
    interview_feedback = TextField()
    rating = IntegerField(choices=range(1, 6))
```

---

### Payroll Data Model

**Salary Structure Hierarchy**:
```
PayrollPeriod
  ├── SalaryStructure (template)
  │   ├── SalaryComponent (earnings)
  │   │   ├── Fixed Component
  │   │   └── Variable Component
  │   └── SalaryComponent (deductions)
  │       ├── PF (Provident Fund)
  │       ├── ESI (Social Security)
  │       ├── IT (Income Tax)
  │       └── Other Deductions
  └── SalarySlip (monthly)
      ├── SalarySlipEarning
      ├── SalarySlipDeduction
      └── NetAmount (calculated)
```

**Frappe**:
```python
class SalaryStructure(Document):
    employee = Link("Employee")
    from_date = Date()
    to_date = Date()
    docstatus = Select([0, 1, 2])  # Draft, Submitted, Amended
    
class SalaryStructureAssignment(Document):
    employee = Link("Employee")
    salary_structure = Link("SalaryStructure")
    from_date = Date()

class SalarySlip(Document):
    employee = Link("Employee")
    payroll_frequency = Select(["Monthly", "Quarterly"])
    start_date = Date()
    end_date = Date()
    
    # Automatic calculation
    earnings = Table("SalarySlipEarning")
    deductions = Table("SalarySlipDeduction")
    total_in_words = Data()
```

**OrangeHRM**:
```
ompPayGrade {
  id (PK)
  payGradeName
  currencyId (FK)
}

ompSalaryStructure {
  id (PK)
  gradeId (FK)
  salaryComponent (FK)
  amount
}

ompPayslip {
  id (PK)
  empNumber (FK)
  payPeriodId (FK)
  payslipPeriodStart
  payslipPeriodEnd
  earningsTotal
  deductionsTotal
  netPay
}
```

**Horilla**:
```python
class SalaryStructure(models.Model):
    company = ForeignKey(Company)
    name = CharField()
    created_date = DateTimeField()

class SalaryComponent(models.Model):
    salary_structure = ForeignKey(SalaryStructure)
    name = CharField()
    category = CharField(choices=['Earning', 'Deduction'])
    type = CharField(choices=['Fixed', 'Formula', 'Percentage'])
    amount = DecimalField()

class PaySlip(models.Model):
    employee = ForeignKey(Employee)
    payroll_period = ForeignKey(PayrollPeriod)
    gross_amount = DecimalField(calculated=True)
    total_deductions = DecimalField(calculated=True)
    net_amount = DecimalField(calculated=True)
    generated_date = DateTimeField()
    paid_date = DateTimeField(null=True)
```

---

## Permission Matrix Patterns

### Frappe Permission Model

**Document Type Permissions**:
```
{
  "doctype": "LeaveApplication",
  "roles": [
    {
      "role": "Employee",
      "permissions": {
        "read": "if name.startswith(user_id)",
        "write": "if status='Draft'",
        "submit": true,
        "cancel": "if submitted_within_24_hours"
      }
    },
    {
      "role": "HR Manager",
      "permissions": {
        "read": true,
        "write": true,
        "submit": true,
        "cancel": true,
        "amend": true
      }
    }
  ]
}
```

### OrangeHRM Permission Matrix

```
Role: HR Manager
├── Admin: Full
├── HR: Full (Employee, Leave, Payroll, Recruitment)
├── Dashboard: View All
├── Reports: Generate All
├── Leave: Approve All
└── Recruitment: Full Pipeline

Role: Manager
├── Admin: None
├── HR: Limited (My Team Only)
├── Dashboard: My Team
├── Reports: My Team
├── Leave: Approve My Team
└── Recruitment: None
```

### Horilla Permission Structure

```
Permission {
  section (Module)
  action (Create, Read, Update, Delete, Manage)
  level (Own, Department, All)
}

User Role: Manager
├── Attendance: Read (All), Update (Department)
├── Leave: Read (All), Approve (Department)
├── Payroll: Read (Department)
├── Recruitment: None
├── Reports: Read (Department)
└── Employee: Read (All), Update (Self)
```

---

## Workflow Automation Patterns

### State Machine Definition

**Frappe Workflow**:
```javascript
{
  "name": "LeaveApplicationWorkflow",
  "doctype": "LeaveApplication",
  "workflow_state_field": "status",
  "states": [
    {"state": "Draft", "allow_on_submit": false},
    {"state": "Pending Approval", "allow_on_submit": false},
    {"state": "Approved", "allow_on_submit": true},
    {"state": "Rejected", "allow_on_submit": true}
  ],
  "transitions": [
    {
      "from_state": "Draft",
      "to_state": "Pending Approval",
      "action": "Submit",
      "allow_self_approval": false
    }
  ]
}
```

**OrangeHRM Workflow**:
```php
class LeaveRequestWorkflow {
    private $states = ['Pending', 'Approved', 'Rejected'];
    
    public function getApprovers($leaveRequest) {
        // Get approver list based on department/hierarchy
        return $approvers;
    }
    
    public function approve($leaveRequestId, $approverId) {
        // Update status
        // Check if all approvers approved
        // If yes, deduct leave balance
    }
}
```

**Horilla Workflow**:
```python
class WorkflowAction(models.Model):
    name = CharField()
    status = CharField()
    next_actions = JSONField()  # Configuration of possible next states
    
class WorkflowAudit(models.Model):
    document_id = CharField()
    from_state = CharField()
    to_state = CharField()
    action_by = ForeignKey(Employee)
    action_at = DateTimeField()
    comments = TextField()
```

---

## Integration Patterns

### Common Integration Points

**1. LDAP/Active Directory**
```
Configuration:
├── LDAP Server (hostname, port)
├── Authentication (username, password)
├── User Search Base
├── Field Mappings:
│   ├── username → employeeId
│   ├── mail → email
│   ├── cn → full_name
│   └── department → department

Sync Process:
├── Query LDAP users
├── Compare with existing users
├── Create new users
├── Update modified users
├── Disable removed users
```

**2. Calendar Integration (Outlook/Google)**
```
Sync Points:
├── Leave Approval → Add to manager's calendar
├── Interview Schedule → Add to interviewer's calendar
├── Meetings → Sync from calendar to system

Bidirectional:
├── System events → Calendar
├── Calendar events → System (limited)
```

**3. Email Integration**
```
Triggers:
├── Leave Request Submitted → Email manager
├── Leave Approved → Email employee
├── Payslip Generated → Email employee
├── Interview Scheduled → Email candidate

Template System:
├── Subject line
├── Body (with placeholders)
├── Attachment inclusion
├── Retry logic
```

---

## Key Takeaways for API Design

1. **Consistency in Naming**: Use either camelCase or snake_case consistently
2. **Versioning**: Include API version in path (/api/v1/)
3. **Pagination**: Support both offset-based and page-based pagination
4. **Filtering**: Allow multiple filter conditions
5. **Response Wrapping**: Always wrap responses, don't expose bare data
6. **Error Handling**: Standardized error format with meaningful messages
7. **Documentation**: OpenAPI/Swagger documentation essential
8. **Rate Limiting**: Implement for production systems
9. **Caching**: Cache frequently accessed read-only data
10. **Webhooks**: Support webhooks for external integrations

