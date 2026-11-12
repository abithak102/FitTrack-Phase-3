
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..auth import get_current_user
from ..models.health_record import HealthRecord
from ..models.health_connection import HealthConnection
from ..models.health_sync_log import HealthSyncLog

from ..schemas_health import (
    HealthConnectionCreate,
    HealthConnectionOut,
    HealthSyncRequest,
    HealthSyncResponse,
    HealthSyncLogOut
)


router = APIRouter(
    prefix="/health-sync",
    tags=["Health Integration"]
)


# Register Health Platform Connection

@router.post(
    "/connect",
    response_model=HealthConnectionOut
)
def connect_health_platform(
    data: HealthConnectionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    connection = db.query(HealthConnection).filter(
        HealthConnection.user_id == current_user.id,
        HealthConnection.platform == data.platform
    ).first()

    if connection:
        connection.is_connected = True
    else:
        connection = HealthConnection(
            user_id=current_user.id,
            platform=data.platform,
            is_connected=True
        )
        db.add(connection)

    db.commit()
    db.refresh(connection)

    return connection


# Sync Health Records

@router.post(
    "/sync",
    response_model=HealthSyncResponse
)
def sync_health_data(
    data: HealthSyncRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    synced_count = 0

    try:
        connection = db.query(HealthConnection).filter(
            HealthConnection.user_id == current_user.id,
            HealthConnection.platform == data.source
        ).first()

        if not connection or not connection.is_connected:
            raise HTTPException(
                status_code=400,
                detail="Connect the health platform before syncing."
            )

        for record in data.records:

            if record.source != data.source:
                raise HTTPException(
                    status_code=400,
                    detail="Record source does not match sync source."
                )

            existing = db.query(HealthRecord).filter(
                HealthRecord.user_id == current_user.id,
                HealthRecord.source == data.source,
                HealthRecord.external_record_id == record.external_record_id
            ).first()

            if existing:
                continue

            health_record = HealthRecord(
                user_id=current_user.id,
                source=data.source,
                data_type=record.data_type,
                value=record.value,
                unit=record.unit,
                recorded_at=record.recorded_at,
                external_record_id=record.external_record_id
            )

            db.add(health_record)
            synced_count += 1

        connection.last_sync_at = datetime.now()
        connection.is_connected = True

        sync_log = HealthSyncLog(
            user_id=current_user.id,
            platform=data.source,
            status="SUCCESS",
            records_synced=synced_count,
            message="Health data synchronized successfully."
        )

        db.add(sync_log)
        db.commit()

        return HealthSyncResponse(
            status="SUCCESS",
            records_synced=synced_count,
            message="Health data synchronized successfully."
        )

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Health data synchronization failed."
        )


# Health Summary

@router.get("/summary")
def get_health_summary(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    records = db.query(HealthRecord).filter(
        HealthRecord.user_id == current_user.id
    ).all()

    connections = db.query(HealthConnection).filter(
        HealthConnection.user_id == current_user.id
    ).all()

    summary = {}

    for record in records:
        if record.data_type not in summary:
            summary[record.data_type] = {
                "total": 0,
                "unit": record.unit
            }

        summary[record.data_type]["total"] += record.value

    return {
        "health_summary": summary,
        "connections": [
            {
                "platform": connection.platform,
                "is_connected": connection.is_connected,
                "last_sync_at": connection.last_sync_at
            }
            for connection in connections
        ]
    }


# Health Sync History

@router.get(
    "/history",
    response_model=list[HealthSyncLogOut]
)
def get_health_sync_history(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return db.query(HealthSyncLog).filter(
        HealthSyncLog.user_id == current_user.id
    ).order_by(
        HealthSyncLog.synced_at.desc()
    ).all()


# Disconnect Health Platform

@router.delete("/disconnect/{platform}")
def disconnect_health_platform(
    platform: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    platform = platform.upper()

    if platform not in ["ANDROID", "APPLE"]:
        raise HTTPException(
            status_code=400,
            detail="Platform must be ANDROID or APPLE."
        )

    connection = db.query(HealthConnection).filter(
        HealthConnection.user_id == current_user.id,
        HealthConnection.platform == platform
    ).first()

    if not connection:
        raise HTTPException(
            status_code=404,
            detail="Health connection not found."
        )

    connection.is_connected = False

    db.commit()

    return {
        "message": f"{platform} health connection disconnected successfully."
    }
