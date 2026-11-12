
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
    UniqueConstraint
)
from sqlalchemy.sql import func

from ..database import Base


class HealthRecord(Base):
    __tablename__ = "health_records"

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "source",
            "external_record_id",
            name="uq_health_record_external_id"
        ),
    )

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    source = Column(
        String(20),
        nullable=False
    )

    data_type = Column(
        String(30),
        nullable=False
    )

    value = Column(
        Float,
        nullable=False
    )

    unit = Column(
        String(20),
        nullable=False
    )

    recorded_at = Column(
        DateTime,
        nullable=False,
        index=True
    )

    external_record_id = Column(
        String(150),
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
