
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey
)
from sqlalchemy.sql import func

from ..database import Base


class Meal(Base):
    __tablename__ = "meals"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    meal_type = Column(
        String(20),
        nullable=False
    )

    food_name = Column(
        String(120),
        nullable=False
    )

    calories = Column(
        Float,
        nullable=False
    )

    protein = Column(
        Float,
        nullable=False
    )

    carbs = Column(
        Float,
        nullable=False
    )

    fats = Column(
        Float,
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
