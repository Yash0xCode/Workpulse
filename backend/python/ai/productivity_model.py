from dataclasses import dataclass

import numpy as np
from sklearn.ensemble import RandomForestRegressor


@dataclass
class ProductivityInput:
    tasks_completed: int
    avg_cycle_time_hours: float
    attendance_rate: float
    meeting_hours_weekly: float


class ProductivityModel:
    def __init__(self):
        self.model = RandomForestRegressor(n_estimators=25, random_state=42)
        self.is_trained = False

    def train_dummy(self):
        x = np.array(
            [
                [30, 9, 92, 14],
                [45, 6, 97, 8],
                [22, 11, 86, 18],
                [50, 5, 98, 7],
            ]
        )
        y = np.array([68, 88, 57, 93])
        self.model.fit(x, y)
        self.is_trained = True

    def predict(self, payload: ProductivityInput):
        if not self.is_trained:
            self.train_dummy()

        features = np.array(
            [[payload.tasks_completed, payload.avg_cycle_time_hours, payload.attendance_rate, payload.meeting_hours_weekly]]
        )
        score = float(self.model.predict(features)[0])
        return {'predicted_productivity_score': round(score, 2)}
