# ENTERPRISE HRMS: UI/UX COMPONENTS & WORKFLOW PATTERNS

## UI Component Architecture Across Three Systems

### Frappe HRMS Component Hierarchy

#### Component Library (Frappe UI - Vue-based)

**Core Components**:
```
FrappeApp (Root)
├── Sidebar
│   ├── Logo & Branding
│   ├── NavMenu
│   │   └── NavItem (with icons & counters)
│   └── UserProfile (Avatar, name, logout)
├── TopBar
│   ├── Breadcrumbs
│   ├── Search Box
│   ├── Notifications
│   └── Quick Actions
└── MainContent
    ├── PageHeader
    │   ├── Title
    │   ├── ActionButtons Array
    │   └── FilterBar
    ├── ContentContainer
    │   └── View (List/Form/Report)
    └── Footer
```

**Data Display Components**:
```
ListView {
  ├── ListHeader
  │   ├── SearchBox
  │   ├── FilterButton
  │   ├── ColumnSelector
  │   └── ExportButton
  ├── DataTable
  │   ├── Thead (sortable columns)
  │   ├── Tbody
  │   │   └── Row (clickable, selectable)
  │   └── Pagination
  └── BulkActions (for selected rows)
}

FormView {
  ├── FormHeader
  │   ├── Title
  │   └── StatusBadge
  ├── FormTabs
  │   ├── TabPane (Details, Attachments, Comments, etc.)
  │   └── TabContent
  └── FormFooter
      ├── SaveButton
      ├── SubmitButton
      └── MoreActions (menu)
}
```

**Action & Control Components**:
```
Button {
  variant: 'primary' | 'secondary' | 'danger' | 'ghost'
  size: 'sm' | 'md' | 'lg'
  icon?: Icon
  loading?: boolean
}

Dialog {
  title: string
  content: Component
  actions: Button[]
  onConfirm: () => void
}

Notification {
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration: number  // auto-dismiss
}

FormField {
  label: string
  fieldtype: 'Data' | 'Link' | 'Date' | 'Select' | ...
  value: any
  error?: string
  required: boolean
}
```

#### Page Templates

**Employee Master Form**:
```vue
<template>
  <Form>
    <Tabs>
      <Tab name="Basic Information">
        <FormField label="Employee ID" fieldtype="Data" readonly />
        <FormField label="Employee Name" fieldtype="Data" required />
        <FormField label="Email" fieldtype="Data" validation="email" />
        <FormField label="Department" fieldtype="Link" options="Department" />
      </Tab>
      <Tab name="Employment Details">
        <FormField label="Date of Joining" fieldtype="Date" />
        <FormField label="Designation" fieldtype="Link" options="Designation" />
        <FormField label="Employment Type" fieldtype="Select" options="[...]" />
      </Tab>
      <Tab name="Attachments">
        <FileUpload maxFiles="10" />
      </Tab>
    </Tabs>
  </Form>
</template>
```

**Leave Management Form**:
```vue
<template>
  <Form>
    <Row>
      <Col class="col-6">
        <FormField label="Employee" fieldtype="Link" readonly />
      </Col>
      <Col class="col-6">
        <FormField label="Leave Type" fieldtype="Link" required />
      </Col>
    </Row>
    <Row>
      <Col class="col-6">
        <FormField label="From Date" fieldtype="Date" required />
      </Col>
      <Col class="col-6">
        <FormField label="To Date" fieldtype="Date" required />
      </Col>
    </Row>
    <FormField label="Total Days" fieldtype="Int" readonly :value="computed_days" />
    <FormField label="Reason" fieldtype="Text" required />
    
    <AlertBox v-if="insufficient_balance" type="warning">
      Insufficient leave balance
    </AlertBox>
  </Form>
</template>
```

---

### OrangeHRM Component Structure

#### View Hierarchy

**Dashboard Layout**:
```
Layout
├── Header
│   ├── Logo
│   ├── MainMenu (Primary navigation)
│   ├── SearchBox
│   └── UserMenu
│       ├── My Info
│       ├── Profile Settings
│       ├── Logout
│       └── Help
├── SideBar (Context menu)
│   ├── Modules (collapsible)
│   └── Quick Links
└── MainContent
    ├── Breadcrumb
    ├── PageTitle
    ├── ContentArea
    └── Footer
```

**List View Component Tree**:
```
ListContainer
├── ToolBar
│   ├── SearchInput
│   ├── FilterButton (Open filter panel)
│   ├── ColumnVisibility (Toggle columns)
│   └── ExportButton (PDF, Excel)
├── FilterPanel (Drawer/Modal)
│   ├── FilterField (multiple)
│   ├── ApplyButton
│   └── ClearButton
├── DataTable
│   ├── Checkbox column (select all/individual)
│   ├── Data columns (sortable)
│   └── Actions column (Edit, Delete, More)
├── Pagination
│   ├── PageInfo ("Showing 1-10 of 100")
│   ├── PreviousButton
│   ├── PageSelector (1, 2, 3...)
│   └── NextButton
└── BulkActions (conditionally shown if rows selected)
    ├── BulkDeleteButton
    ├── BulkExportButton
    └── ApplyActionButton
```

**Form Component Tree**:
```
FormContainer
├── FormHeader
│   ├── PageTitle (with ID)
│   ├── FormActions
│   │   ├── SaveButton
│   │   ├── CancelButton
│   │   └── DeleteButton
│   └── StatusIndicator
├── FormContent
│   ├── FormSection (repeating)
│   │   ├── SectionTitle
│   │   └── FormFieldGroup
│   │       ├── FormField (varying types)
│   │       ├── FormField
│   │       └── FormField
│   ├── TabContainer (if complex form)
│   │   ├── Tab (Overview)
│   │   ├── Tab (Details)
│   │   ├── Tab (History)
│   │   └── Tab (Attachments)
│   └── ApprovalChain (if workflow-enabled)
│       ├── ApprovalStep (pending)
│       ├── ApprovalStep (approved)
│       └── Timeline
└── FormFooter
    ├── SaveButton (sticky)
    ├── CancelButton
    └── MoreActions (dropdown)
```

**Form Field Types**:
```javascript
FormField: {
  textInput:     { type: "text", placeholder, validation }
  numberInput:   { type: "number", min, max }
  emailInput:    { type: "email", validation }
  dateInput:     { type: "date", placeholder }
  selectDropdown:{ options: [{ label, value }], clearable, searchable }
  multiSelect:   { options: [], tags: true }
  radioButton:   { options: [], value }
  checkbox:      { label, checked }
  textarea:      { rows, placeholder, maxLength }
  fileUpload:    { accept, multiple, maxSize }
  richTextEditor:{ toolbar: ['bold', 'italic', 'link'] }
  dateRange:     { startDate, endDate }
  timePicker:    { format: "HH:mm" }
}
```

---

### Horilla Component Structure (Bootstrap-based)

#### Layout Architecture

**Master Layout**:
```html
<body>
  <Header>
    <Logo />
    <Navigation />
    <UserDropdown />
  </Header>
  
  <div class="main-container">
    <Sidebar>
      <Logo />
      <NavMenu collapse-toggle>
        <NavItem icon="dashboard" label="Dashboard" />
        <NavItem icon="users" label="Employee" />
        <NavItem icon="calendar" label="Leave" />
        <NavItem icon="briefcase" label="Recruitment" />
        ...
      </NavMenu>
      <UserProfile />
    </Sidebar>
    
    <MainContent>
      <Breadcrumb path={currentPath} />
      <PageHeader>
        <PageTitle />
        <ActionButtons />
      </PageHeader>
      
      <ContentArea>
        {/* Dynamic content via @include or HTMX */}
      </ContentArea>
      
      <Footer />
    </MainContent>
  </div>
  
  <Scripts bundled="{bootstrap.js, jquery.js, htmx.js}" />
</body>
```

**List View Template (Bootstrap Grid)**:
```html
<div class="card">
  <div class="card-header">
    <h5>Employee List</h5>
    <div class="btn-toolbar">
      <SearchInput hx-post="/api/employee/search" />
      <FilterButton toggle="#filterModal" />
      <ExportButton />
      <CreateButton href="/employee/new" />
    </div>
  </div>
  
  <div class="card-body">
    <table class="table table-hover">
      <thead>
        <tr>
          <th><input type="checkbox" id="selectAll" /></th>
          <th onclick="sortBy('name')">Name <i class="sort-icon"></i></th>
          <th onclick="sortBy('email')">Email </th>
          <th>Department</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody id="tableBody" hx-trigger="search from:input">
        <tr hx-get="/employee/1" hx-target="this" hx-swap="outerHTML">
          <td><input type="checkbox" class="row-check" /></td>
          <td>John Doe</td>
          <td>john@example.com</td>
          <td>Engineering</td>
          <td><span class="badge bg-success">Active</span></td>
          <td>
            <div class="btn-group btn-group-sm">
              <a href="/employee/1" class="btn btn-info">Edit</a>
              <button hx-delete="/api/employee/1" class="btn btn-danger">Delete</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  
  <div class="card-footer">
    <Pagination current="1" total="10" />
  </div>
</div>

<!-- Filter Modal -->
<div id="filterModal" class="modal">
  <form hx-post="/employee/filter" hx-target="#tableBody">
    <FormField name="department" label="Department" />
    <FormField name="status" label="Status" />
    <button type="submit">Apply Filters</button>
  </form>
</div>
```

**Form Template (Bootstrap Form Groups)**:
```html
<div class="row">
  <div class="col-md-8">
    <form method="POST" hx-post="/api/employee" hx-target="this">
      <div class="form-group mb-3">
        <label for="name" class="form-label">Name *</label>
        <input type="text" class="form-control" id="name" name="name" 
               required hx-validate />
        <span class="invalid-feedback">Name is required</span>
      </div>
      
      <div class="form-group mb-3">
        <label for="email" class="form-label">Email *</label>
        <input type="email" class="form-control" id="email" name="email" 
               required />
      </div>
      
      <div class="form-row">
        <div class="form-group col-md-6 mb-3">
          <label for="department" class="form-label">Department *</label>
          <select class="form-select" id="department" name="department" 
                  hx-get="/api/department" hx-trigger="load">
            <option value="">Select Department</option>
          </select>
        </div>
        <div class="form-group col-md-6 mb-3">
          <label for="designation" class="form-label">Designation *</label>
          <select class="form-select" id="designation" name="designation">
            <option value="">Select Designation</option>
          </select>
        </div>
      </div>
      
      <div class="form-group mb-3">
        <label for="documents" class="form-label">Attachments</label>
        <input type="file" class="form-control" id="documents" 
               name="documents" multiple accept=".pdf,.doc" />
        <small class="form-text text-muted">Max 5 files, 10MB each</small>
      </div>
      
      <div class="formActions">
        <button type="submit" class="btn btn-primary">Save</button>
        <button type="reset" class="btn btn-secondary">Clear</button>
        <a href="/employee" class="btn btn-outline-secondary">Cancel</a>
      </div>
    </form>
  </div>
  
  <div class="col-md-4">
    <div class="card">
      <div class="card-header">Quick Info</div>
      <div class="card-body">
        <!-- Right panel with additional info -->
      </div>
    </div>
  </div>
</div>
```

---

## Workflow Visualization Patterns

### Leave Approval Workflow Visualization

**Timeline View**:
```
┌─────────────────────────────────────────────────────────┐
│ Leave Request Timeline                                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ [✓] 2026-03-20 10:30 AM - Employee Submitted          │
│     John Doe submitted leave request for 5 days        │
│                                                         │
│ [▶] 2026-03-20 01:00 PM - Awaiting Manager Review     │
│     Sarah Manager (Department Head)                    │
│     [Approve] [Reject] [Request Info]                 │
│                                                         │
│ [ ] 2026-03-20 02:00 PM - HR Review (Pending)         │
│     If approved by manager                             │
│                                                         │
│ [ ] 2026-03-20 03:00 PM - HR Manager Approval         │
│     If approved by HR                                  │
│                                                         │
│ [ ] 2026-03-20 04:00 PM - System Processing           │
│     Deduct leave balance, Update attendance            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**State Machine Diagram**:
```
     ┌──────────────┐
     │    DRAFT     │
     └──────┬───────┘
            │ (Submit)
            ↓
     ┌──────────────────┐
     │ PENDING APPROVAL │◄─────┐
     └──────┬───────────┘      │
            │                  │ (Request More Info)
            │ (Approve/Reject) │
     ┌──────▼───────┐          │
     │              │──────────┘
     ├─ APPROVED ──→ Process Leave Balance Deduction
     │              │
     ├─ REJECTED ──→ Send Rejection Notification
     │              │
     └──────────────┘
```

**Manager Approval UI**:
```
┌─────────────────────────────────────────────────┐
│ Leave Application #LEV-2026-001                 │
├─────────────────────────────────────────────────┤
│ Employee:       John Doe (EMP-001)              │
│ Leave Type:     Annual Leave                    │
│ Duration:       5 days (Mar 25-29)              │
│ Reason:         Family vacation                 │
│ Leave Balance:  12 days remaining               │
├─────────────────────────────────────────────────┤
│ Manager Action:                                 │
│                                                 │
│ ┌─ Action ─────────────────────────────────┐  │
│ │ ○ Approve   ○ Reject   ○ Request Info   │  │
│ ├───────────────────────────────────────────┤  │
│ │ Feedback (Optional):                     │  │
│ │ ┌─────────────────────────────────────┐  │  │
│ │ │ [Text area for comments]            │  │  │
│ │ └─────────────────────────────────────┘  │  │
│ ├───────────────────────────────────────────┤  │
│ │ [Approve] [Reject] [Save & Exit]        │  │
│ └─────────────────────────────────────────┘  │
│                                                │
├─────────────────────────────────────────────────┤
│ Approval History:                              │
│ • Submitted: 2026-03-20 10:30 AM (John Doe)  │
│ • Pending: Sarah Manager (since 01:00 PM)    │
│                                                │
└─────────────────────────────────────────────────┘
```

---

### Recruitment Pipeline Visualization

**Kanban Board View**:
```
┌──────────────────┬──────────────────┬──────────────────┬──────────────────┐
│  APPLICATIONS    │  SHORTLISTED     │  INTERVIEW       │  SELECTED        │
│  (12)            │  (8)             │  (5)             │  (2)             │
├──────────────────┼──────────────────┼──────────────────┼──────────────────┤
│                  │                  │                  │                  │
│ ┌──────────────┐ │ ┌──────────────┐ │ ┌──────────────┐ │ ┌──────────────┐ │
│ │ Alex Kumar   │ │ │ Sarah Johnson│ │ │ Mike Brown   │ │ │ Lisa Wang    │ │
│ │ Software Dev │ │ │ Senior Dev   │ │ │ Tech Lead    │ │ │ Principal Eng│ │
│ │ ★★★★☆       │ │ │ ★★★★★       │ │ │ ★★★★☆       │ │ │ ★★★★★       │ │
│ │ [Move] [+]   │ │ │ [Move] [+]   │ │ │ [Move] [+]   │ │ │ [Move] [+]   │ │
│ └──────────────┘ │ └──────────────┘ │ └──────────────┘ │ └──────────────┘ │
│                  │                  │                  │                  │
│ ┌──────────────┐ │ ┌──────────────┐ │ ┌──────────────┐ │ ┌──────────────┐ │
│ │ James Chen   │ │ │ Emma Davis   │ │ │ Robert Park  │ │ │ David Miller │ │
│ │ Full Stack   │ │ │ Backend Dev  │ │ │ DevOps Engr  │ │ │ QA Engineer  │ │
│ │ ★★★☆☆       │ │ │ ★★★★☆       │ │ │ ★★★★☆       │ │ │ [Offer sent] │ │
│ │ [Move] [+]   │ │ │ [Move] [+]   │ │ │ [Move] [+]   │ │ │              │ │
│ └──────────────┘ │ └──────────────┘ │ └──────────────┘ │ └──────────────┘ │
│                  │                  │                  │                  │
└──────────────────┴──────────────────┴──────────────────┴──────────────────┘

Drag & drop between columns to move candidates through pipeline
```

**Funnel Chart**:
```
Applications Received     100 candidates
    │
    │ (Applied: 100, Viewed: 85)
    ↓
Initial Screening         85 candidates
    │
    │ (Shortlisted: 25)
    ↓
Shortlisted               25 candidates
    │
    │ (Interview: 12)
    ↓
Round 1 Interview         12 candidates
    │
    │ (Passed: 8)
    ↓
Round 2 Interview          8 candidates
    │
    │ (Selected: 2)
    ↓
Selected for Hire          2 candidates
    │
    ↓
Offer Accepted             1 candidate → Employee
```

---

### Payroll Processing Workflow

**Monthly Payroll Cycle Dashboard**:
```
┌──────────────────────────────────────────────────────────┐
│ Payroll Processing - March 2026                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Status: ⓘ In Progress (75% complete)                   │
│                                                          │
│ Steps:                                                   │
│ [✓] 1. Attendance Finalization        (2026-03-10)     │
│ [✓] 2. Salary Structure Validation    (2026-03-15)     │
│ [▶] 3. Salary Computation             (In progress)    │
│ [ ] 4. Tax Calculation                (Pending)        │
│ [ ] 5. Salary Slip Generation         (Pending)        │
│ [ ] 6. Bank Transfer Setup            (Pending)        │
│ [ ] 7. Employee Notification          (Pending)        │
│                                                          │
├──────────────────────────────────────────────────────────┤
│ Statistics:                                              │
│                                                          │
│ Total Employees:       250                              │
│ Processed:             187 ✓                             │
│ Processing:            50  ▶                             │
│ Error:                 10  ✗                             │
│ Skipped:               3   -                             │
│                                                          │
│ Avg Salary:            $4,500                            │
│ Total Payroll:         $1,125,000                        │
│ Total Deductions:      $225,000                          │
│ Net Amount:            $900,000                          │
│                                                          │
├──────────────────────────────────────────────────────────┤
│ [Retry Errors] [View Details] [Download Report]        │
│ [Pause Processing] [Complete & Send Slips]             │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Dashboard Patterns

### Executive HR Dashboard

```
┌────────────────────────────────────────────────────────────────────────┐
│ HR Dashboard - March 2026                                              │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ ┌──────────────────┬──────────────────┬──────────────────────────────┐ │
│ │ Headcount        │ Leave Balance    │ Recruiting Pipeline        │ │
│ │ ╔════════════╗   │ ╔═══════════╗    │ Open Positions:    5       │ │
│ │ ║    250     ║   │ ║   8.2d    ║    │ Shortlisted:       12      │ │
│ │ ╚════════════╝   │ ╚═══════════╝    │ Interviews:        8       │ │
│ │ Current Month    │ From Yesterday   │ Offers Pending:    2       │ │
│ │ ▲ +3 Hires       │ ▼ -4.2 Days      │ Selected:          0       │ │
│ │ (Onboarding)     │ vs Last Month     │                            │ │
│ └──────────────────┴──────────────────┴──────────────────────────────┘ │
│                                                                         │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ Attendance Trend (Last 30 Days)                                   │ │
│ │ ┌──────────────────────────────────────────────────────────────┐  │ │
│ │ │ Present                    ▁▂▃▃▄▅▅▆▆▇▇▇█▇▆▆▅▄▄▃▂▂▁▂▃▃▃▃   │  │ │
│ │ │ Absent                     ▁▁▁▁▁▁▁▁▁▁▁▁▁▁▂▂▁▁▁▁▁▁▁▁▁▁▁▁   │  │ │
│ │ │ Leave                      ▁▁▁▂▂▂▁▁▁▁▁▁▁▁▁▁▁▂▂▂▂▁▁▁▁▁▁▁   │  │ │
│ │ │                           Mar 1    Mar 10   Mar 20   Mar 30   │  │ │
│ │ └──────────────────────────────────────────────────────────────┘  │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ Leave Utilization by Type                                          │ │
│ │                                                                    │ │
│ │ Annual Leave     ████████████░░░░░░░░ 65% (651/1000 days used) │ │
│ │ Sick Leave       ███░░░░░░░░░░░░░░░░░ 15% (45/300 days used)  │ │
│ │ Casual Leave     ███░░░░░░░░░░░░░░░░░ 12% (36/300 days used)  │ │
│ │ Comp Off         ██░░░░░░░░░░░░░░░░░░ 8%  (16/200 days used)  │ │
│ │                                                                    │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ ┌────────────────────────┬────────────────────────────────────────────┐ │
│ │ Pending Approvals      │ Recent Activities                          │ │
│ │ • Leave Requests: 8    │ • Hired: Sarah Johnson (Eng Team)       │ │
│ │ • Expenses: 15         │ • Left: Mike Brown (Resignation)        │ │
│ │ • Performance Reviews:  │ • Promoted: Lisa Wang (to Sr. role)    │ │
│ │   45 (Q2 Review)       │ • New Joiner: David Miller (Today)      │ │
│ │                        │ • Birthday: 5 Employees (This week)     │ │
│ └────────────────────────┴────────────────────────────────────────────┘ │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Notification & Alert Typography

### In-App Notification Types

```
Success Notification:
┌─ ✓ ─────────────────────────────────┐
│ Leave request approved successfully │
│ (Auto-dismiss in 3 seconds)         │
└─────────────────────────────────────┘

Error Notification:
┌─ ✗ ─────────────────────────────────┐
│ Failed to save employee record       │
│ Please check the error messages      │
│ [Retry] [Dismiss]                   │
└─────────────────────────────────────┘

Warning Notification:
┌─ ⚠ ─────────────────────────────────┐
│ Leave balance is low (2 days)        │
│ Consider planning ahead              │
└─────────────────────────────────────┘

Info Notification:
┌─ ℹ ─────────────────────────────────┐
│ New payroll cycle started (Mar 21)   │
│ Salaries will be processed by Mar 31 │
└─────────────────────────────────────┘
```

### Modal Dialog Patterns

```
Confirmation Dialog:
╔════════════════════════════════════╗
║ Confirm Action                     ║
╠════════════════════════════════════╣
║                                    ║
║ Are you sure you want to reject    ║
║ this leave request?                ║
║                                    ║
║ This action cannot be undone.      ║
║                                    ║
╠════════════════════════════════════╣
║ [Cancel]  [Reject]                 ║
╚════════════════════════════════════╝

Error Dialog:
╔════════════════════════════════════╗
║ Validation Error                   ║
╠════════════════════════════════════╣
║                                    ║
║ • Email field is invalid           ║
║ • Department is required           ║
║ • Start date must be before end    ║
║   date                             ║
║                                    ║
╠════════════════════════════════════╣
║ [OK]                               ║
╚════════════════════════════════════╝

Form Dialog:
╔════════════════════════════════════╗
║ Add Employee                       ║
╠════════════════════════════════════╣
║                                    ║
║ Name*  [ Enter name        ]       ║
║ Email* [ Enter email       ]       ║
║ Dept*  [ Select department ▼]      ║
║                                    ║
╠════════════════════════════════════╣
║ [Cancel]  [Create]                 ║
╚════════════════════════════════════╝
```

---

## Summary: UI/UX Best Practices Across Systems

1. **Consistent Navigation**: Sidebar navigation in all three systems
2. **Data-First Design**: Tables with filtering/sorting before forms
3. **Progressive Disclosure**: Advanced options hidden until needed
4. **Workflow Visualization**: Clear status indicators and timelines
5. **Touch-Friendly**: Large buttons and spacing for mobile devices
6. **Real-time Feedback**: Immediate response to user actions
7. **Error Prevention**: Validation before submission
8. **Accessibility**: ARIA labels, keyboard navigation, screen reader support
9. **Performance**: Pagination, lazy loading, client-side updates (HTMX/Vue)
10. **Responsive Design**: Works on desktop, tablet, and mobile

