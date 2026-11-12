
from datetime import datetime, date
from enum import Enum

from pydantic import BaseModel, Field, ConfigDict


# Allowed meal types
class MealType(str, Enum):
    BREAKFAST = "Breakfast"
    LUNCH = "Lunch"
    DINNER = "Dinner"
    SNACKS = "Snacks"


# Common meal fields
class MealBase(BaseModel):
    meal_type: MealType

    food_name: str = Field(
        min_length=1,
        max_length=120
    )

    calories: float = Field(ge=0)
    protein: float = Field(ge=0)
    carbs: float = Field(ge=0)
    fats: float = Field(ge=0)

    model_config = ConfigDict(
        str_strip_whitespace=True
    )


# Schema for creating a meal
class MealCreate(MealBase):
    pass


# Schema for updating a meal
class MealUpdate(BaseModel):
    meal_type: MealType | None = None

    food_name: str | None = Field(
        default=None,
        min_length=1,
        max_length=120
    )

    calories: float | None = Field(default=None, ge=0)
    protein: float | None = Field(default=None, ge=0)
    carbs: float | None = Field(default=None, ge=0)
    fats: float | None = Field(default=None, ge=0)

    model_config = ConfigDict(
        str_strip_whitespace=True
    )


# Schema for displaying meal details
class MealOut(MealBase):
    id: int
    user_id: int
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


# Schema for daily nutrition summary
class NutritionSummary(BaseModel):
    date: date
    total_calories: float
    total_protein: float
    total_carbs: float
    total_fats: float
    total_meals: int
