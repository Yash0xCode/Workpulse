import { Router } from 'express';
import {
  predictAttrition,
  predictProductivity,
  predictStress,
  predictStudentPerformance,
  scoreResume,
  verifyFace,
} from '../controllers/mlController.js';
import { PERMISSIONS } from '../config/rbac.js';
import { requirePermission } from '../middleware/permissionMiddleware.js';

const router = Router();

// All ML endpoints require analytics permission
router.post('/attrition', requirePermission(PERMISSIONS.VIEW_ANALYTICS), predictAttrition);
router.post('/productivity', requirePermission(PERMISSIONS.VIEW_ANALYTICS), predictProductivity);
router.post('/stress', requirePermission(PERMISSIONS.VIEW_ANALYTICS), predictStress);
router.post('/resume-score', requirePermission(PERMISSIONS.VIEW_ANALYTICS), scoreResume);
router.post('/student-performance', requirePermission(PERMISSIONS.VIEW_ANALYTICS), predictStudentPerformance);
router.post('/face-verify', requirePermission(PERMISSIONS.VIEW_ANALYTICS), verifyFace);

export default router;
