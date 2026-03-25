from dataclasses import dataclass

import numpy as np
from sklearn.ensemble import RandomForestClassifier


@dataclass
class StudentPerformanceInput:
    attendance_rate: float
    internal_marks: float
    assignment_score: float
    previous_gpa: float


class StudentPerformanceModel:
    def __init__(self):
        self.model = RandomForestClassifier(n_estimators=30, random_state=42)
        self.is_trained = False
        self.classes = ['low', 'medium', 'high']

    def train_dummy(self):
        x = np.array(
            [
                [65, 40, 45, 5.8],
                [82, 64, 69, 7.2],
                [95, 82, 88, 9.1],
                [75, 50, 54, 6.4],
                [89, 72, 79, 8.4],
            ]
        )
        y = np.array(['low', 'medium', 'high', 'medium', 'high'])
        self.model.fit(x, y)
        self.is_trained = True

    def predict(self, payload: StudentPerformanceInput):
        if not self.is_trained:
            self.train_dummy()

        features = np.array(
            [[payload.attendance_rate, payload.internal_marks, payload.assignment_score, payload.previous_gpa]]
        )
        label = str(self.model.predict(features)[0])
        return {'predicted_performance_band': label}
