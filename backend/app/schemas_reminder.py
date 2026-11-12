
from datetime import date, time, datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field, ConfigDict


class ReminderCreate(BaseModel):
    title: str = Field(min_length=3, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)

    reminder_type: Literal["WORKOUT", "GOAL", "CUSTOM"] = "CUSTOM"

    reminder_date: date
    reminder_time: time


class ReminderUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=3, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)

    reminder_type: Optional[Literal["WORKOUT", "GOAL", "CUSTOM"]] = None

    reminder_date: Optional[date] = None
    reminder_time: Optional[time] = None
    is_completed: Optional[bool] = None


class ReminderOut(BaseModel):
    id: int
    user_id: int
    title: str
    description: Optional[str]
    reminder_type: str
    reminder_date: date
    reminder_time: time
    is_completed: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
