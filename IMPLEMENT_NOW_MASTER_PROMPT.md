# WorkPulse Master Execution Prompt (Use Existing Roadmaps)

Use ONLY the existing roadmap and task docs in this repository as source-of-truth. Do not create a new roadmap.

## Source Plan Files (Must Reference)
- PHASE4_IMPLEMENTATION_STATUS.md
- PHASE4_WEEK1-2_REMAINING_TASKS.md
- PHASE3_MASTER_TASK_LIST.md
- PHASE2_GAP_ANALYSIS.md
- WORKPULSE_HRMS_ROADMAP.md
- README_ANALYSIS_INDEX.md

## Reference Feature Repositories
- Frappe HRMS: https://github.com/frappe/hrms
- OrangeHRM: https://github.com/orangehrm/orangehrm
- Horilla: https://github.com/horilla-opensource/horilla

## Database Credentials (Current Project)
- DB_HOST=localhost
- DB_PORT=5432
- DB_NAME=workpulse_db
- DB_USER=postgres
- DB_PASSWORD=1234

## Objective
Complete pending backend + frontend work one-by-one in priority order, while keeping API contract consistent and delivering an advanced UI that is visually appealing, easy to use, and structured for enterprise HR workflows.

## Execution Rules
1. Start from pending P1 work already in progress, then proceed to remaining P0, then P2.
2. For each task:
   - Implement code
   - Validate with runtime/build checks
   - Update status notes in plan files when verified
3. Keep response envelope standardized: success/data/meta and error object.
4. Keep RBAC enforced at route level and data scope level.
5. Maintain multi-tenant organization isolation.

## Immediate Priority Queue (Now)
1. Workflow Engine completion
   - Keep generic workflow definitions/instances/actions complete.
   - Ensure leave submission and approval transitions are persisted.
   - Add workflow APIs with permission guards and pagination.

2. Notification System completion
   - In-app notifications complete path (list/read/read-all/count).
   - Add email notification pipeline stub/service and template structure.

3. Leave Allocation + Balance Tracking
   - Add leave allocation tables/model logic and APIs.
   - Add leave-balance endpoint and validations before approval.

4. Attendance Status Calculation
   - Add status resolution (present/absent/half-day/on_leave/weekend/holiday).

5. Frontend UX upgrade
   - Build Workflow Center page (timeline + status + details).
   - Improve dashboard visual hierarchy and responsive behavior.
   - Keep typography, color variables, and spacing system coherent.

## Output Format For Each Completed Task
- Files changed
- Why changed
- Validation run and result
- Remaining blockers (if any)

## Definition of Done (Per Feature)
- Backend endpoints implemented and permission-protected.
- Frontend screens connected and usable for target role(s).
- No lint/build/runtime blocker in changed modules.
- Plan file task status updated from pending to done where verified.
