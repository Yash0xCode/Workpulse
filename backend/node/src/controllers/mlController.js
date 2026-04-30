import { MLService } from '../services/MLService.js';
import { AuditService } from '../services/AuditService.js';
import { sendError, sendSuccess } from '../utils/response.js';

export const predictAttrition = async (req, res) => {
  try {
    const result = await MLService.predictAttrition({
      salary: Number(req.body.salary),
      experienceYears: Number(req.body.experienceYears),
      promotionCount: Number(req.body.promotionCount ?? 0),
      avgWorkHours: Number(req.body.avgWorkHours),
      jobSatisfaction: Number(req.body.jobSatisfaction),
    });
    AuditService.log({
      organizationId: req.user.organizationId,
      actorUserId: req.user.id,
      action: 'ml.attrition.predict',
      resourceType: 'employee',
      resourceId: req.body.employeeId || null,
    });
    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, 'ML_ERROR', error.message || 'Attrition prediction failed', {}, 502);
  }
};

export const predictProductivity = async (req, res) => {
  try {
    const result = await MLService.predictProductivity({
      tasksCompleted: Number(req.body.tasksCompleted),
      avgCycleTimeHours: Number(req.body.avgCycleTimeHours),
      attendanceRate: Number(req.body.attendanceRate),
      meetingHoursWeekly: Number(req.body.meetingHoursWeekly ?? 0),
    });
    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, 'ML_ERROR', error.message || 'Productivity prediction failed', {}, 502);
  }
};

export const predictStress = async (req, res) => {
  try {
    const result = await MLService.predictStress({
      avgWorkHoursDaily: Number(req.body.avgWorkHoursDaily),
      taskCount: Number(req.body.taskCount ?? 0),
      attendanceRate: Number(req.body.attendanceRate),
      leaveDaysTaken: Number(req.body.leaveDaysTaken ?? 0),
    });
    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, 'ML_ERROR', error.message || 'Stress prediction failed', {}, 502);
  }
};

export const scoreResume = async (req, res) => {
  try {
    const result = await MLService.scoreResume({
      resumeText: String(req.body.resumeText || ''),
      jobDescription: String(req.body.jobDescription || ''),
    });
    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, 'ML_ERROR', error.message || 'Resume scoring failed', {}, 502);
  }
};

export const predictStudentPerformance = async (req, res) => {
  try {
    const result = await MLService.predictStudentPerformance({
      attendanceRate: Number(req.body.attendanceRate),
      internalMarks: Number(req.body.internalMarks),
      assignmentScore: Number(req.body.assignmentScore),
      previousGpa: Number(req.body.previousGpa),
    });
    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, 'ML_ERROR', error.message || 'Student performance prediction failed', {}, 502);
  }
};

export const verifyFace = async (req, res) => {
  try {
    const result = await MLService.verifyFace({
      userId: Number(req.body.userId),
      embeddingDistance: Number(req.body.embeddingDistance),
      livenessScore: Number(req.body.livenessScore),
    });
    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, 'ML_ERROR', error.message || 'Face verification failed', {}, 502);
  }
};
