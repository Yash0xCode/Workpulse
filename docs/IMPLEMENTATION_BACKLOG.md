# WorkPulse Implementation Backlog (6–8 Weeks)

## 1) Scope and Constraints

- Keep existing frontend structure intact in `frontend/src` (no redesign, incremental module completion).
- Implement backend services in existing Node structure under `backend/node/src`.
- Implement ML inference and training pipelines in existing Python structure under `backend/python`.
- Support two organization types using configuration and role-based feature flags:
  - `corporate`
  - `education`

---

## 2) Target Architecture (Incremental, Non-Breaking)

## Frontend (existing)
- Keep routing shell and role navigation from:
  - `frontend/src/App.jsx`
  - `frontend/src/layouts/AppLayout.jsx`
  - `frontend/src/components/layout/Sidebar.jsx`
- Add API layer (new):
  - `frontend/src/services/httpClient.js`
  - `frontend/src/services/authService.js`
  - `frontend/src/services/employeeService.js`
  - `frontend/src/services/studentService.js`
  - `frontend/src/services/attendanceService.js`
  - `frontend/src/services/taskService.js`
  - `frontend/src/services/analyticsService.js`
  - `frontend/src/services/mlService.js`

## Node backend (existing scaffold)
- Build REST APIs in:
  - `backend/node/src/server.js`
  - `backend/node/src/routes/*.js`
  - `backend/node/src/controllers/*.js`
  - `backend/node/src/models/*.js`
  - `backend/node/src/middleware/*.js`

## Python ML service (existing scaffold)
- Build model endpoints in:
  - `backend/python/api/app.py`
- Store training/inference code in:
  - `backend/python/ai/`

---

## 3) Database Blueprint (PostgreSQL-first)

Use PostgreSQL for transactional modules, optional MongoDB for event logs if needed.

## Core entities
- `organizations` (id, name, org_type, domain, size, industry, created_at)
- `users` (id, org_id, role, email, password_hash, status, created_at)
- `profiles` (id, user_id, full_name, phone, avatar_url)
- `roles_permissions` (id, role_name, permission_key)
- `feature_flags` (id, org_id, key, enabled)

## Corporate entities
- `employees` (id, org_id, user_id, employee_code, department, manager_id, join_date, employment_status)
- `leaves` (id, org_id, employee_id, leave_type, start_date, end_date, status, approver_id)
- `attendance_logs` (id, org_id, person_type, person_id, date, check_in, check_out, source, confidence)
- `tasks` (id, org_id, title, description, assignee_id, status, priority, due_date)
- `performance_reviews` (id, org_id, employee_id, cycle, reviewer_id, score, remarks)
- `requisitions` (id, org_id, title, department, status, openings)
- `candidates` (id, org_id, requisition_id, name, email, stage, resume_url, score)

## Education entities
- `students` (id, org_id, user_id, enrollment_no, program, semester, section, status)
- `faculty` (id, org_id, user_id, faculty_code, department, designation)
- `courses` (id, org_id, code, name, credits, semester)
- `course_enrollments` (id, org_id, course_id, student_id)
- `academic_scores` (id, org_id, student_id, course_id, exam_type, marks, max_marks)
- `placements` (id, org_id, student_id, company, role, package_lpa, status)

## Analytics/ML entities
- `events` (id, org_id, event_type, actor_id, entity_type, entity_id, payload_json, created_at)
- `ml_predictions` (id, org_id, model_name, subject_type, subject_id, score, label, explanation_json, predicted_at)
- `ml_feedback` (id, org_id, prediction_id, actual_outcome, outcome_date)

---

## 4) API Backlog (Node + Python)

## Auth and org setup
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/org/select-mode` (corporate/education)
- `GET /api/org/features`

## Corporate APIs
- `GET/POST /api/employees`
- `GET/PATCH/DELETE /api/employees/:id`
- `GET/POST /api/leaves`
- `PATCH /api/leaves/:id/approve`
- `GET/POST /api/attendance`
- `GET/POST /api/tasks`
- `PATCH /api/tasks/:id/status`
- `GET/POST /api/performance-reviews`
- `GET/POST /api/recruitment/requisitions`
- `GET/POST /api/recruitment/candidates`

## Education APIs
- `GET/POST /api/students`
- `GET/POST /api/faculty`
- `GET/POST /api/courses`
- `POST /api/courses/:id/enroll`
- `GET/POST /api/academics/scores`
- `GET/POST /api/placements`

## Analytics APIs
- `GET /api/analytics/admin-summary`
- `GET /api/analytics/hr-summary`
- `GET /api/analytics/employee-summary`
- `GET /api/analytics/student-summary`
- `GET /api/analytics/recruitment-funnel`
- `GET /api/analytics/placement-summary`

## ML APIs (Python service)
- `POST /ml/attrition/predict`
- `POST /ml/resume-screen/predict`
- `POST /ml/student-performance/predict`
- `POST /ml/productivity/predict`
- `POST /ml/face-attendance/verify`
- `GET /ml/health`

Node should call Python ML endpoints and persist outcomes into `ml_predictions`.

---

## 5) UI Backlog by Existing Screens

## Reuse and expand current screens
- `frontend/src/pages/Dashboard/Dashboard.jsx`
  - Replace static KPI cards with API-driven values and role-aware widgets.
- `frontend/src/pages/Employees/EmployeesPage.jsx`
  - Convert mock data to API data and add ML risk badges.
- `frontend/src/pages/Tasks/Tasks.jsx`
  - Persist board state and add workload metrics.

## New page implementations in existing folders
- `frontend/src/pages/Attendance/Attendance.jsx`
- `frontend/src/pages/Leave/Leave.jsx`
- `frontend/src/pages/Performance/Performance.jsx`
- `frontend/src/pages/Reports/Reports.jsx`
- `frontend/src/pages/Recruitment/Recruitment.jsx`
- `frontend/src/pages/Students/Students.jsx`
- `frontend/src/pages/Faculty/Faculty.jsx`
- `frontend/src/pages/Placements/Placements.jsx`

## Shared components to add
- `frontend/src/components/analytics/KpiCard.jsx`
- `frontend/src/components/analytics/TrendChart.jsx`
- `frontend/src/components/analytics/Heatmap.jsx`
- `frontend/src/components/common/InsightPanel.jsx`

---

## 6) ML Integration Plan (Model Cards)

## A) Employee Attrition Prediction
- Problem: identify employees with high leaving risk.
- Inputs: tenure, salary trend, promotions, leaves, overtime, performance, sentiment.
- Output: probability (0–1), risk label, top factors.
- Model: Logistic Regression baseline -> Random Forest/XGBoost.
- UI integration: HR dashboard and employee drawer risk panel.

## B) Resume Screening
- Problem: rank candidates against JD.
- Inputs: resume text, JD text, skills, years experience.
- Output: fit score and missing skills.
- Model: TF-IDF + linear classifier baseline -> SBERT similarity.
- UI integration: recruitment shortlist table.

## C) Student Performance Prediction
- Problem: predict expected grade and at-risk students.
- Inputs: attendance, internals, assignment score, prior GPA.
- Output: predicted band + risk tag.
- Model: Random Forest/LightGBM.
- UI integration: faculty and student dashboards.

## D) Employee Productivity Prediction
- Problem: forecast workload and productivity dip.
- Inputs: task throughput, cycle time, meeting hours, attendance.
- Output: predicted productivity score.
- Model: Regression model (XGBoost/RandomForestRegressor).
- UI integration: manager capacity planning dashboard.

## E) Face Recognition Attendance
- Problem: automate attendance with anti-proxy checks.
- Inputs: face embedding vectors + liveness score.
- Output: person match and confidence.
- Model: FaceNet/ArcFace embedding + cosine threshold.
- UI integration: attendance check-in flow + audit trail.

---

## 7) Datasets and Preprocessing

## Corporate ML
1. IBM HR Analytics Attrition (Kaggle)
- Features: age, job role, monthly income, overtime, satisfaction, tenure.
- Size: ~1.4k rows.
- Preprocess: impute nulls, one-hot encoding, class balancing (SMOTE/weights), train/val split.

2. Resume Screening Dataset (Kaggle/GitHub)
- Features: resume text, category labels, skill terms.
- Size: few thousand resumes.
- Preprocess: text cleaning, stopword handling, lemmatization, vectorization/embeddings.

3. Employee Productivity datasets (Kaggle variants)
- Features: tasks, hours, deadlines, quality/performance labels.
- Size: 1k–10k rows.
- Preprocess: outlier treatment, temporal feature engineering, scaling.

## Education ML
4. Student Performance (UCI/Kaggle)
- Features: attendance, study time, past grades, family/academic factors.
- Size: hundreds to low thousands.
- Preprocess: encoding, normalization, leakage-safe split by term.

5. Placement datasets (Kaggle campus placement)
- Features: academics, aptitude, communication, internships.
- Size: few hundred to a few thousand.
- Preprocess: class imbalance handling, calibration.

## Face Recognition
6. LFW / CelebA (public benchmark datasets)
- Features: labeled face images.
- Size: 10k+ images.
- Preprocess: face alignment, augmentation, embedding extraction, threshold tuning.

---

## 8) 8-Week Sprint Plan

## Sprint 1 (Week 1)
- Initialize Node backend app structure and middleware.
- Add auth/org endpoints and JWT middleware.
- Add DB migration setup + base schema (`organizations`, `users`, `profiles`).
- Frontend: connect login/signup to API.

Deliverable: end-to-end login and organization mode persistence.

## Sprint 2 (Week 2)
- Employees/students/faculty CRUD APIs.
- Attendance and leave schemas + basic APIs.
- Frontend: `EmployeesPage` API integration (replace constants).

Deliverable: persisted people management for both modes.

## Sprint 3 (Week 3)
- Task management APIs and workflow transitions.
- Performance and academic score APIs.
- Dashboard summary APIs (admin, HR, student).

Deliverable: role-based dashboard KPIs with real backend data.

## Sprint 4 (Week 4)
- Recruitment and placement APIs.
- Report generation endpoints and export metadata.
- Event logging table and analytics aggregations.

Deliverable: recruitment + placement operational modules.

## Sprint 5 (Week 5)
- Python ML service skeleton and health checks.
- Implement attrition + student performance v1 models.
- Node-to-ML integration and prediction persistence.

Deliverable: live risk scoring visible in dashboards.

## Sprint 6 (Week 6)
- Resume screening + productivity prediction endpoints.
- Insight cards and explainability payload rendering.
- Notification rules for high-risk events.

Deliverable: AI-assisted recruitment + productivity insights.

## Sprint 7 (Week 7)
- Face attendance prototype (image capture + verification API).
- Security hardening: RBAC checks, audit logs, input validation.
- Dashboard chart enhancements and drill-down filters.

Deliverable: smart attendance prototype + secure access controls.

## Sprint 8 (Week 8)
- QA, bug fixes, test datasets, demo scripts.
- Performance checks (API latency, query optimization).
- SGP demo storyboards (corporate and education journeys).

Deliverable: final SGP-ready intelligent WorkPulse demo.

---

## 9) Definition of Done (Per Module)

- API supports validation, pagination, filters, and error handling.
- UI connected to real API (no hardcoded module data).
- RBAC enforced for role and organization type.
- Events logged for analytics and model retraining.
- At least one dashboard widget consumes module output.
- Unit tests for controllers/services and integration tests for critical paths.

---

## 10) Recommended Immediate Next 5 Tasks

1. Implement `backend/node/src/server.js` with Express + CORS + route registration.
2. Create auth route/controller + JWT middleware in `backend/node/src`.
3. Add DB schema migrations for `organizations`, `users`, `employees`, `students`.
4. Replace login/signup mocks with API calls in `frontend/src/pages/Auth`.
5. Build `backend/python/api/app.py` with `/ml/health` and stub predict endpoints.

This backlog keeps your current WorkPulse structure intact and adds intelligence in layers instead of rebuilding.