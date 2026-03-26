from dataclasses import dataclass

import numpy as np
from sklearn.ensemble import RandomForestClassifier


@dataclass
class StressInput:
    avg_work_hours_daily: float
    task_count: int
    attendance_rate: float
    leave_days_taken: int


class StressModel:
    def __init__(self):
        self.model = RandomForestClassifier(n_estimators=20, random_state=42)
        self.is_trained = False
        self.labels = ['low', 'medium', 'high']

    def train_dummy(self):
        # Feature order: avg_work_hours_daily, task_count, attendance_rate, leave_days_taken
        # Stress label: 0=low, 1=medium, 2=high
        x = np.array([
            [6.0, 2, 95, 0],   # low stress
            [7.0, 3, 90, 1],   # low stress
            [8.0, 5, 85, 2],   # medium stress
            [9.0, 7, 80, 3],   # medium stress
            [10.0, 10, 70, 4], # high stress
            [11.0, 12, 60, 5], # high stress
            [7.5, 4, 88, 1],   # medium stress
            [6.5, 2, 92, 0],   # low stress
            [9.5, 9, 65, 4],   # high stress
            [8.5, 6, 78, 3],   # medium stress
        ])
        y = np.array([0, 0, 1, 1, 2, 2, 1, 0, 2, 1])
        self.model.fit(x, y)
        self.is_trained = True

    def predict(self, payload: StressInput):
        if not self.is_trained:
            self.train_dummy()

        features = np.array([[
            payload.avg_work_hours_daily,
            payload.task_count,
            payload.attendance_rate,
            payload.leave_days_taken,
        ]])

        label_idx = int(self.model.predict(features)[0])
        proba = self.model.predict_proba(features)[0]
        # Weighted score: medium stress contributes 50%, high stress contributes 100%.
        # This produces a continuous 0–1 value where purely-high predictions → 1.0
        # and purely-low predictions → 0.0.
        stress_score = round(float(proba[1] * 0.5 + proba[2] * 1.0), 3)

        return {
            'stress_score': stress_score,
            'stress_level': self.labels[label_idx],
            'probabilities': {
                'low': round(float(proba[0]), 3),
                'medium': round(float(proba[1]), 3),
                'high': round(float(proba[2]), 3),
            },
        }
