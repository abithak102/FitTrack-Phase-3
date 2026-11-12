from datetime import date, datetime
from pydantic import BaseModel, Field, ConfigDict


# Water Intake Schemas

class WaterIntakeCreate(BaseModel):
    amount_ml: int = Field(gt=0, le=10000)
    intake_date: date


class WaterIntakeOut(BaseModel):
    id: int
    user_id: int
    amount_ml: int
    intake_date: date
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Water Goal Schemas

class WaterGoalCreate(BaseModel):
    daily_goal_ml: int = Field(gt=0, le=10000)


class WaterGoalOut(BaseModel):
    id: int
    user_id: int
    daily_goal_ml: int

    model_config = ConfigDict(from_attributes=True)


# Daily Water Summary Schema

class WaterSummary(BaseModel):
    intake_date: date
    total_intake_ml: int
    daily_goal_ml: int
    remaining_ml: int
    completion_percentage: float