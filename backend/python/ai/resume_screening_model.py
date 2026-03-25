from dataclasses import dataclass


@dataclass
class ResumeInput:
    resume_text: str
    job_description: str


class ResumeScreeningModel:
    def predict(self, payload: ResumeInput):
        resume_tokens = set(payload.resume_text.lower().split())
        jd_tokens = set(payload.job_description.lower().split())

        if not jd_tokens:
            return {'resume_score': 0.0, 'match_level': 'low'}

        overlap = len(resume_tokens.intersection(jd_tokens))
        score = (overlap / len(jd_tokens)) * 100
        if score >= 70:
            match = 'high'
        elif score >= 40:
            match = 'medium'
        else:
            match = 'low'

        return {'resume_score': round(score, 2), 'match_level': match}
