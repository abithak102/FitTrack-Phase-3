
from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    UniqueConstraint
)
from sqlalchemy.sql import func

from ..database import Base


class HealthConnection(Base):
    __tablename__ = "health_connections"

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "platform",
            name="uq_user_health_platform"
        ),
    )

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    platform = Column(
        String(20),
        nullable=False
    )

    is_connected = Column(
        Boolean,
        default=False,
        nullable=False
    )

    last_sync_at = Column(
        DateTime,
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    updated_at = Column(
        DateTime(timezone=True),
        onupdate=func.now(),
        nullable=True
    )
