
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey
)
from sqlalchemy.sql import func

from ..database import Base


class HealthSyncLog(Base):
    __tablename__ = "health_sync_logs"

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

    status = Column(
        String(20),
        nullable=False
    )

    records_synced = Column(
        Integer,
        default=0,
        nullable=False
    )

    message = Column(
        Text,
        nullable=True
    )

    synced_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
