
from datetime import datetime
from typing import Optional, Literal

from pydantic import BaseModel, Field, ConfigDict


# Health Record Schemas

class HealthRecordCreate(BaseModel):
    source: Literal["ANDROID", "APPLE"]

    data_type: Literal[
        "STEPS",
        "ACTIVE_CALORIES",
        "DISTANCE",
        "WORKOUT",
        "HEART_RATE"
    ]

    value: float = Field(ge=0)
    unit: str = Field(min_length=1, max_length=20)
    recorded_at: datetime
    external_record_id: str = Field(
        min_length=1,
        max_length=150
    )


class HealthRecordOut(BaseModel):
    id: int
    user_id: int
    source: str
    data_type: str
    value: float
    unit: str
    recorded_at: datetime
    external_record_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Health Connection Schemas

class HealthConnectionCreate(BaseModel):
    platform: Literal["ANDROID", "APPLE"]


class HealthConnectionOut(BaseModel):
    id: int
    user_id: int
    platform: str
    is_connected: bool
    last_sync_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Health Sync Schemas

class HealthSyncRequest(BaseModel):
    source: Literal["ANDROID", "APPLE"]
    records: list[HealthRecordCreate] = Field(
        min_length=1,
        max_length=500
    )


class HealthSyncResponse(BaseModel):
    status: str
    records_synced: int
    message: str


class HealthSyncLogOut(BaseModel):
    id: int
    user_id: int
    platform: str
    status: str
    records_synced: int
    message: Optional[str] = None
    synced_at: datetime

    model_config = ConfigDict(from_attributes=True)
