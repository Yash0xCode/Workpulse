/**
 * MLService — proxies all requests to the Python FastAPI ML service.
 * The browser must NEVER call the ML service directly; all ML traffic
 * goes through this backend service so we can enforce auth and audit.
 */

const ML_BASE_URL = process.env.ML_API_URL || 'http://localhost:8001';

async function mlPost(path, body) {
  const response = await fetch(`${ML_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => 'ML service error');
    throw new Error(`ML service error (${response.status}): ${text}`);
  }

  const json = await response.json();
  return json?.data ?? json;
}

export class MLService {
  static async predictAttrition({ salary, experienceYears, promotionCount, avgWorkHours, jobSatisfaction }) {
    return mlPost('/ml/attrition', {
      salary,
      experience_years: experienceYears,
      promotion_count: promotionCount,
      avg_work_hours: avgWorkHours,
      job_satisfaction: jobSatisfaction,
    });
  }

  static async predictProductivity({ tasksCompleted, avgCycleTimeHours, attendanceRate, meetingHoursWeekly }) {
    return mlPost('/ml/productivity', {
      tasks_completed: tasksCompleted,
      avg_cycle_time_hours: avgCycleTimeHours,
      attendance_rate: attendanceRate,
      meeting_hours_weekly: meetingHoursWeekly,
    });
  }

  static async predictStudentPerformance({ attendanceRate, internalMarks, assignmentScore, previousGpa }) {
    return mlPost('/ml/student-performance', {
      attendance_rate: attendanceRate,
      internal_marks: internalMarks,
      assignment_score: assignmentScore,
      previous_gpa: previousGpa,
    });
  }

  static async scoreResume({ resumeText, jobDescription }) {
    return mlPost('/ml/resume-score', { resume_text: resumeText, job_description: jobDescription });
  }

  static async predictStress({ avgWorkHoursDaily, taskCount, attendanceRate, leaveDaysTaken }) {
    return mlPost('/ml/stress', {
      avg_work_hours_daily: avgWorkHoursDaily,
      task_count: taskCount,
      attendance_rate: attendanceRate,
      leave_days_taken: leaveDaysTaken,
    });
  }

  static async verifyFace({ userId, embeddingDistance, livenessScore }) {
    return mlPost('/ml/face-attendance', {
      user_id: userId,
      embedding_distance: embeddingDistance,
      liveness_score: livenessScore,
    });
  }

  static async enrollFace({ employeeId, embeddingDistance, livenessScore }) {
    return mlPost('/ml/face-enroll', {
      employee_id: employeeId,
      embedding_distance: embeddingDistance,
      liveness_score: livenessScore,
    });
  }
}
