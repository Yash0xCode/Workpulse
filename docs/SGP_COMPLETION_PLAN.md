# WorkPulse SGP Completion Plan (Demo-Ready Today)

## 1) Existing System Analysis (Practical)

## What is already implemented
- Frontend shell with role-aware navigation and layout.
- Auth screens (login/signup UI) and basic navigation logic.
- Employee management UI with filtering, pagination, modal/drawer interactions.
- Task board UI (kanban-style state updates).
- Basic dashboard cards/placeholders.
- Backend folders exist for Node and Python, ready for integration.

## Current limitations
- Node backend APIs were missing implementation and route wiring.
- Python ML service was scaffolded but not implemented.
- Current frontend mostly uses local constants/mock data.
- No persistent DB schema setup script.
- Charts and analytics are mostly placeholder visuals.

## Missing features for demo completeness
- Full API coverage for auth/employee/student/attendance/leave/tasks/analytics.
- SQL schema for all HR + academic + placement entities.
- ML inference endpoints for key demo use cases.
- Role-based dashboard content with real analytics payloads.

## What to prioritize today
1. Run database schema.
2. Start Node API and verify all endpoints.
3. Start Python ML API and test predict endpoints.
4. Connect frontend modules to API responses.
5. Replace placeholder analytics with real chart data.

---

## 2) Backend API Design + Implemented Skeletons

Node skeleton created in `backend/node/src` with route/controller separation.

## Authentication APIs
- POST `/api/auth/signup`
- POST `/api/auth/login`
- GET `/api/auth/me`

## Employee APIs
- GET `/api/employees`
- POST `/api/employees`
- GET `/api/employees/:id`
- PUT `/api/employees/:id`
- DELETE `/api/employees/:id`

## Student APIs
- GET `/api/students`
- POST `/api/students`
- GET `/api/students/:id`

## Attendance APIs
- POST `/api/attendance/checkin`
- POST `/api/attendance/checkout`
- GET `/api/attendance/user/:id`

## Leave APIs
- POST `/api/leaves`
- GET `/api/leaves`
- PUT `/api/leaves/:id`

## Task APIs
- POST `/api/tasks`
- GET `/api/tasks`
- PUT `/api/tasks/:id`

## Analytics APIs
- GET `/api/analytics/attendance`
- GET `/api/analytics/productivity`
- GET `/api/analytics/placement`

### Implemented Node code skeleton files
- `backend/node/src/server.js`
- `backend/node/src/routes/index.js`
- `backend/node/src/routes/authRoutes.js`
- `backend/node/src/routes/employeeRoutes.js`
- `backend/node/src/routes/studentRoutes.js`
- `backend/node/src/routes/attendanceRoutes.js`
- `backend/node/src/routes/leaveRoutes.js`
- `backend/node/src/routes/taskRoutes.js`
- `backend/node/src/routes/analyticsRoutes.js`
- `backend/node/src/controllers/authController.js`
- `backend/node/src/controllers/employeeController.js`
- `backend/node/src/controllers/studentController.js`
- `backend/node/src/controllers/attendanceController.js`
- `backend/node/src/controllers/leaveController.js`
- `backend/node/src/controllers/taskController.js`
- `backend/node/src/controllers/analyticsController.js`
- `backend/node/src/middleware/authMiddleware.js`
- `backend/node/src/config/db.js`

---

## 3) Database Schema (SQL)

Complete schema file generated:
- `docs/DATABASE_SCHEMA.sql`

Includes required tables:
- organizations
- users
- employees
- students
- attendance
- leaves
- tasks
- jobs
- applications
- courses
- grades
- placement_drives
- offers

---

## 4) Machine Learning Integration (Local)

Python FastAPI skeleton implemented in `backend/python`.

## Model: Employee Attrition Prediction
- Problem: identify employees likely to leave.
- Input: salary, experience years, promotion count, avg work hours, job satisfaction.
- Output: attrition probability + risk label.
- Type: Logistic Regression (baseline).
- Code: `backend/python/ai/attrition_model.py`

## Model: Employee Productivity Prediction
- Problem: estimate near-term productivity score.
- Input: tasks completed, cycle time, attendance rate, meeting load.
- Output: predicted productivity score.
- Type: RandomForestRegressor.
- Code: `backend/python/ai/productivity_model.py`

## Model: Student Performance Prediction
- Problem: predict student risk/performance band.
- Input: attendance, internal marks, assignment score, previous GPA.
- Output: low/medium/high band.
- Type: RandomForestClassifier.
- Code: `backend/python/ai/student_performance_model.py`

## Model: Resume Screening System
- Problem: score candidate resume against job description.
- Input: resume text, JD text.
- Output: resume score + match level.
- Type: keyword overlap baseline (fast demo-ready).
- Code: `backend/python/ai/resume_screening_model.py`

## Model: Face Recognition Attendance (Prototype)
- Problem: verify attendance identity quickly in demo.
- Input: user id, embedding distance, liveness score.
- Output: verified/rejected + confidence.
- Type: threshold-based verifier skeleton.
- Code: `backend/python/ai/face_attendance_model.py`

## ML Endpoints (implemented)
- POST `/ml/attrition`
- POST `/ml/productivity`
- POST `/ml/student-performance`
- POST `/ml/resume-score`
- POST `/ml/face-attendance`
- GET `/ml/health`

API file:
- `backend/python/api/app.py`

Dependencies:
- `backend/python/requirements.txt`

---

## 5) UI/UX Improvements (Quick Win Structure)

Use existing App layout and sidebar; keep CSS/system intact.

## React page structure to complete
- Landing Page
- Organization Registration
- Login Page
- Admin Dashboard
- HR Dashboard
- Employee Dashboard
- Student Dashboard
- Recruitment Dashboard
- Placement Dashboard
- Analytics Panel

## Practical UI layout (SaaS style)
- Left sidebar: role-based navigation (already present).
- Top nav: search, notifications, profile chip (already present).
- Main content zones:
  1) KPI summary row
  2) Charts row
  3) Insights / alerts row
  4) Tabular operational widgets

## Suggested quick page mapping in your current frontend
- `src/pages/Dashboard/Dashboard.jsx` -> Admin/HR overview toggle by role.
- `src/pages/Employees/EmployeesPage.jsx` -> HR module.
- `src/pages/Tasks/Tasks.jsx` -> Employee/manager task module.
- Add: `src/pages/Students/StudentsPage.jsx`.
- Add: `src/pages/Recruitment/RecruitmentPage.jsx`.
- Add: `src/pages/Placement/PlacementPage.jsx`.
- Add: `src/pages/Analytics/AnalyticsPage.jsx`.

---

## 6) Analytics Dashboard (Charts)

Use Recharts or Chart.js in frontend.

## Charts to add now
- Attendance trend (line chart) from `/api/analytics/attendance`.
- Productivity graph (line/bar) from `/api/analytics/productivity`.
- Attrition risk distribution (pie/bar) from `/ml/attrition` aggregated output.
- Hiring funnel (funnel/bar) from recruitment APIs.
- Placement stats (bar + counters) from `/api/analytics/placement`.

## Minimal implementation approach today
- Keep static fallback values if API fails.
- Add loading skeleton + error state in dashboard cards.
- Add date range selector with weekly/monthly toggle.

---

## 7) Smart AI Features (Quick Today)

## AI HR chatbot
- Rule-based FAQ + retrieval from policy JSON.
- Integrate as floating chat panel in dashboard.

## Employee sentiment analysis
- Basic sentiment on feedback text (TextBlob/VADER).
- Show sentiment trend in HR analytics card.

## Smart notifications
- Trigger alert if low attendance / high attrition risk / pending approvals.
- Add top-nav notification list from analytics endpoints.

## Performance insights
- Generate text insights from computed metrics.
- Show in "AI Insights" card already present in dashboard UI.

---

## 8) Recommended Folder Structure (Complete)

```txt
frontend/
  src/
    components/
      analytics/
        AttendanceChart.jsx
        ProductivityChart.jsx
        HiringFunnel.jsx
        PlacementStats.jsx
      common/
      employees/
      layout/
    pages/
      Auth/
        Login.jsx
        Signup.jsx
      Dashboard/
        Dashboard.jsx
      Employees/
        EmployeesPage.jsx
      Students/
        StudentsPage.jsx
      Recruitment/
        RecruitmentPage.jsx
      Placement/
        PlacementPage.jsx
      Analytics/
        AnalyticsPage.jsx
    services/
      apiClient.js
      authService.js
      employeeService.js
      studentService.js
      attendanceService.js
      leaveService.js
      taskService.js
      analyticsService.js
      mlService.js

backend/
  node/
    package.json
    src/
      server.js
      config/
        db.js
      middleware/
        authMiddleware.js
      routes/
        index.js
        authRoutes.js
        employeeRoutes.js
        studentRoutes.js
        attendanceRoutes.js
        leaveRoutes.js
        taskRoutes.js
        analyticsRoutes.js
      controllers/
        authController.js
        employeeController.js
        studentController.js
        attendanceController.js
        leaveController.js
        taskController.js
        analyticsController.js
      models/

  python/
    requirements.txt
    api/
      app.py
    ai/
      attrition_model.py
      productivity_model.py
      student_performance_model.py
      resume_screening_model.py
      face_attendance_model.py

datasets/
  hr/
  students/
  resumes/
  faces/

docs/
  DATABASE_SCHEMA.sql
  IMPLEMENTATION_BACKLOG.md
  SGP_COMPLETION_PLAN.md
```

---

## 9) One-Day Implementation Checklist (Execution Order)

## Step 1 – Setup database (45 min)
- Create PostgreSQL DB `workpulse`.
- Run `docs/DATABASE_SCHEMA.sql`.

## Step 2 – Start Node backend (45 min)
- Install deps in `backend/node`.
- Run server and verify `/health` + `/api/*` routes.

## Step 3 – Start Python ML backend (30 min)
- Install deps in `backend/python`.
- Run FastAPI and verify `/ml/health` + prediction routes.

## Step 4 – Wire frontend services (2–3 hours)
- Replace mock employee/task/dashboard constants with API fetch calls.
- Keep fallback mock data for safe demo.

## Step 5 – Add charts (1.5 hours)
- Integrate Recharts/Chart.js with analytics endpoints.
- Implement attendance/productivity/placement widgets.

## Step 6 – Integrate ML cards (1 hour)
- Add quick predict forms/buttons in HR and student dashboards.
- Show attrition risk, student risk, resume score in cards.

## Step 7 – Demo flow polishing (1 hour)
- Seed sample records.
- Validate role-based journeys:
  - Corporate admin -> HR dashboard -> employees -> attrition score.
  - Education admin -> student dashboard -> performance score -> placement stats.

## Step 8 – Final demo script (30 min)
- Prepare 5-minute narrative and test every endpoint once.

---

## Dataset Recommendations (Fast Access)

- IBM HR Analytics Attrition (Kaggle)
- Student Performance (UCI/Kaggle)
- Resume Screening datasets (Kaggle)
- Campus Placement dataset (Kaggle)
- LFW/CelebA for face prototype

Preprocess quickly: clean nulls, encode categoricals, scale numerics, and keep a small training split for rapid local demo.

---

## Final Recommendation

For today’s SGP demo, treat this as a **functional vertical slice**:
- End-to-end APIs work.
- Database persists core entities.
- Dashboards show live analytics.
- ML endpoints return meaningful predictions.

That is enough to convincingly demonstrate an AI-powered HRMS + Academic Management platform without rebuilding your current system.
