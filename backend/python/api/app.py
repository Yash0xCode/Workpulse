from fastapi import FastAPI
from pydantic import BaseModel

from ai.attrition_model import AttritionInput, AttritionModel
from ai.face_attendance_model import FaceAttendanceInput, FaceAttendanceModel, FaceEnrollmentInput
from ai.productivity_model import ProductivityInput, ProductivityModel
from ai.resume_screening_model import ResumeInput, ResumeScreeningModel
from ai.stress_model import StressInput, StressModel
from ai.student_performance_model import StudentPerformanceInput, StudentPerformanceModel

app = FastAPI(title='WorkPulse ML API', version='1.0.0')

attrition_model = AttritionModel()
productivity_model = ProductivityModel()
student_model = StudentPerformanceModel()
resume_model = ResumeScreeningModel()
face_model = FaceAttendanceModel()
stress_model = StressModel()


class AttritionPayload(BaseModel):
	salary: float
	experience_years: float
	promotion_count: int
	avg_work_hours: float
	job_satisfaction: float


class ProductivityPayload(BaseModel):
	tasks_completed: int
	avg_cycle_time_hours: float
	attendance_rate: float
	meeting_hours_weekly: float


class StudentPerformancePayload(BaseModel):
	attendance_rate: float
	internal_marks: float
	assignment_score: float
	previous_gpa: float


class ResumePayload(BaseModel):
	resume_text: str
	job_description: str


class FaceAttendancePayload(BaseModel):
	user_id: int
	embedding_distance: float
	liveness_score: float


class FaceEnrollmentPayload(BaseModel):
	employee_id: int
	embedding_distance: float
	liveness_score: float


class StressPayload(BaseModel):
	avg_work_hours_daily: float
	task_count: int
	attendance_rate: float
	leave_days_taken: int


@app.get('/ml/health')
def health():
	return {'status': 'ok', 'service': 'workpulse-ml-api'}


@app.post('/ml/attrition')
def predict_attrition(payload: AttritionPayload):
	result = attrition_model.predict(AttritionInput(**payload.model_dump()))
	return {'data': result}


@app.post('/ml/productivity')
def predict_productivity(payload: ProductivityPayload):
	result = productivity_model.predict(ProductivityInput(**payload.model_dump()))
	return {'data': result}


@app.post('/ml/student-performance')
def predict_student_performance(payload: StudentPerformancePayload):
	result = student_model.predict(StudentPerformanceInput(**payload.model_dump()))
	return {'data': result}


@app.post('/ml/resume-score')
def score_resume(payload: ResumePayload):
	result = resume_model.predict(ResumeInput(**payload.model_dump()))
	return {'data': result}


@app.post('/ml/face-attendance')
def verify_face(payload: FaceAttendancePayload):
	result = face_model.verify(FaceAttendanceInput(**payload.model_dump()))
	return {'data': result}


@app.post('/ml/face-enroll')
def enroll_face(payload: FaceEnrollmentPayload):
	result = face_model.enroll(FaceEnrollmentInput(**payload.model_dump()))
	return {'data': result}


@app.post('/ml/stress')
def predict_stress(payload: StressPayload):
	result = stress_model.predict(StressInput(**payload.model_dump()))
	return {'data': result}
