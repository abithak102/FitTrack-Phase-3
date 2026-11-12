
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Date,
    Time,
    DateTime,
    Boolean,
    ForeignKey
)
from sqlalchemy.sql import func

from ..database import Base


class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    title = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)

    reminder_type = Column(
        String(30),
        nullable=False,
        default="CUSTOM"
    )

    reminder_date = Column(Date, nullable=False, index=True)
    reminder_time = Column(Time, nullable=False)

    is_completed = Column(Boolean, default=False, nullable=False)

    is_notified = Column(Boolean, default=False, nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
