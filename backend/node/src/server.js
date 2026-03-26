import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { pool } from './config/db.js';
import apiRoutes from './routes/index.js';
import authMiddleware from './middleware/authMiddleware.js';
import paginationMiddleware from './middleware/pagination.js';
import sortingMiddleware from './middleware/sorting.js';
import organizationContext from './middleware/organizationContext.js';
import errorHandler from './middleware/errorHandler.js';
import { ensurePayrollInfrastructure } from './services/payrollService.js';
import { ensureRecruitmentInfrastructure } from './services/recruitmentService.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(paginationMiddleware);
app.use(sortingMiddleware);

// Health checks
app.get('/health', (_req, res) => {
	res.json({ status: 'ok', service: 'workpulse-node-api' });
});

app.get('/health/db', async (_req, res) => {
	try {
		await pool.query('SELECT 1 AS ok');
		res.json({ status: 'ok', database: process.env.DB_NAME || 'workpulse_db', timestamp: new Date().toISOString() });
	} catch (_error) {
		res.status(500).json({ status: 'error', database: 'disconnected' });
	}
});

// Public routes (before auth middleware)
app.use('/api/auth', apiRoutes.authRoutes);
app.use('/api/students', apiRoutes.studentRoutes); // Public for now

// Protected routes (after auth middleware)
app.use(authMiddleware);
app.use(organizationContext);

app.use('/api/employees', apiRoutes.employeeRoutes);
app.use('/api/attendance', apiRoutes.attendanceRoutes);
app.use('/api/leaves', apiRoutes.leaveRoutes);
app.use('/api/payroll', apiRoutes.payrollRoutes);
app.use('/api/recruitment', apiRoutes.recruitmentRoutes);
app.use('/api/workflows', apiRoutes.workflowRoutes);
app.use('/api/tasks', apiRoutes.taskRoutes);
app.use('/api/analytics', apiRoutes.analyticsRoutes);
app.use('/api/notifications', apiRoutes.notificationRoutes);

// Error handler (must be last)
app.use(errorHandler);

const REQUIRED_TABLES = [
	'organizations',
	'roles',
	'permissions',
	'role_permissions',
	'users',
	'employees',
	'students',
	'attendance_logs',
	'leaves',
	'leave_balances',
	'employee_face_profiles',
	'tasks',
	'workflow_definitions',
	'workflow_instances',
	'workflow_actions',
	'notifications',
	'payroll_runs',
	'payroll_entries',
	'job_openings',
	'candidates',
	'job_applications',
];

async function verifyDatabaseReadiness() {
	await pool.query('SELECT 1');

	const result = await pool.query(
		`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
	);

	const existingTables = new Set(result.rows.map((row) => row.table_name));
	const missing = REQUIRED_TABLES.filter((tableName) => !existingTables.has(tableName));

	if (missing.length > 0) {
		throw new Error(
			`Database schema is incomplete. Missing tables: ${missing.join(', ')}. Run: npm run db:init`
		);
	}
}

// Initialize database and start server
async function initializeApp() {
	try {
		await ensurePayrollInfrastructure();
		await ensureRecruitmentInfrastructure();
		await verifyDatabaseReadiness();

		const PORT = Number(process.env.PORT || 5000);
		app.listen(PORT, () => {
			console.log(`✓ WorkPulse Node API running on port ${PORT}`);
			console.log(`✓ Database: ${process.env.DB_NAME || 'workpulse_db'}`);
		});
	} catch (error) {
		console.error('Failed to start application:', error);
		process.exit(1);
	}
}

initializeApp();

