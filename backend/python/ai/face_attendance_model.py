from dataclasses import dataclass
from datetime import datetime, timezone


@dataclass
class FaceAttendanceInput:
    user_id: int
    embedding_distance: float
    liveness_score: float


@dataclass
class FaceEnrollmentInput:
    employee_id: int
    embedding_distance: float
    liveness_score: float


class FaceAttendanceModel:
    def __init__(self):
        self.enrolled_profiles = {}

    def enroll(self, payload: FaceEnrollmentInput):
        is_live = payload.liveness_score >= 0.7
        is_match_quality = payload.embedding_distance <= 0.5
        enrolled = is_live and is_match_quality

        status = 'enrolled' if enrolled else 'rejected'
        confidence = max(0.0, 1.0 - payload.embedding_distance)

        if enrolled:
            self.enrolled_profiles[payload.employee_id] = {
                'reference_distance': payload.embedding_distance,
                'enrolled_at': datetime.now(timezone.utc).isoformat(),
            }

        return {
            'employee_id': payload.employee_id,
            'status': status,
            'confidence': round(confidence, 3),
            'is_live': is_live,
            'enrolled': enrolled,
        }

    def verify(self, payload: FaceAttendanceInput):
        profile = self.enrolled_profiles.get(payload.user_id)
        is_live = payload.liveness_score >= 0.7
        is_match = payload.embedding_distance <= 0.45

        status = 'verified' if is_live and is_match else 'rejected'
        confidence = max(0.0, 1.0 - payload.embedding_distance)

        return {
            'user_id': payload.user_id,
            'status': status,
            'confidence': round(confidence, 3),
            'is_live': is_live,
            'profile_exists': profile is not None,
        }
