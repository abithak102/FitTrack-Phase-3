
from datetime import date
from typing import List, Optional

from pydantic import BaseModel


class WorkoutRecommendation(BaseModel):
    title: str
    category: str
    duration_minutes: int
    intensity: str
    reason: str


class AISuggestionResponse(BaseModel):
    current_streak: int
    workouts_last_7_days: int
    active_goals_count: int
    last_workout_date: Optional[date] = None
    recommendations: List[WorkoutRecommendation]
    message: str
