from dataclasses import dataclass

import numpy as np
from sklearn.linear_model import LogisticRegression


@dataclass
class AttritionInput:
    salary: float
    experience_years: float
    promotion_count: int
    avg_work_hours: float
    job_satisfaction: float


class AttritionModel:
    def __init__(self):
        self.model = LogisticRegression()
        self.is_trained = False

    def train_dummy(self):
        x = np.array(
            [
                [30000, 1, 0, 9, 2],
                [70000, 6, 1, 8, 4],
                [45000, 3, 0, 10, 2],
                [90000, 10, 2, 7, 5],
            ]
        )
        y = np.array([1, 0, 1, 0])
        self.model.fit(x, y)
        self.is_trained = True

    def predict(self, payload: AttritionInput):
        if not self.is_trained:
            self.train_dummy()

        features = np.array(
            [[payload.salary, payload.experience_years, payload.promotion_count, payload.avg_work_hours, payload.job_satisfaction]]
        )
        probability = float(self.model.predict_proba(features)[0][1])
        return {
            'attrition_probability': round(probability, 4),
            'risk_label': 'high' if probability >= 0.6 else 'medium' if probability >= 0.35 else 'low',
        }
