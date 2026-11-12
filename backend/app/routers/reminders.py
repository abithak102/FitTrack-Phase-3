
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..auth import get_current_user
from ..models.reminder import Reminder
from ..schemas_reminder import (
    ReminderCreate,
    ReminderUpdate,
    ReminderOut
)


router = APIRouter(
    prefix="/reminders",
    tags=["Reminders"]
)


# Create a new reminder
@router.post("/", response_model=ReminderOut, status_code=status.HTTP_201_CREATED)
def create_reminder(
    reminder_data: ReminderCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    new_reminder = Reminder(
        user_id=current_user.id,
        title=reminder_data.title,
        description=reminder_data.description,
        reminder_type=reminder_data.reminder_type,
        reminder_date=reminder_data.reminder_date,
        reminder_time=reminder_data.reminder_time
    )

    db.add(new_reminder)
    db.commit()
    db.refresh(new_reminder)

    return new_reminder


# Get all reminders of the logged-in user
@router.get("/", response_model=list[ReminderOut])
def get_reminders(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return (
        db.query(Reminder)
        .filter(Reminder.user_id == current_user.id)
        .order_by(Reminder.reminder_date, Reminder.reminder_time)
        .all()
    )


# Get upcoming reminders
@router.get("/upcoming", response_model=list[ReminderOut])
def get_upcoming_reminders(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    today = date.today()

    return (
        db.query(Reminder)
        .filter(
            Reminder.user_id == current_user.id,
            Reminder.reminder_date >= today,
            Reminder.is_completed == False
        )
        .order_by(Reminder.reminder_date, Reminder.reminder_time)
        .all()
    )


# Update a reminder
@router.put("/{reminder_id}", response_model=ReminderOut)
def update_reminder(
    reminder_id: int,
    reminder_data: ReminderUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    reminder = (
        db.query(Reminder)
        .filter(
            Reminder.id == reminder_id,
            Reminder.user_id == current_user.id
        )
        .first()
    )

    if not reminder:
        raise HTTPException(
            status_code=404,
            detail="Reminder not found"
        )

    update_data = reminder_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(reminder, field, value)

    db.commit()
    db.refresh(reminder)

    return reminder


# Delete a reminder
@router.delete("/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reminder(
    reminder_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    reminder = (
        db.query(Reminder)
        .filter(
            Reminder.id == reminder_id,
            Reminder.user_id == current_user.id
        )
        .first()
    )

    if not reminder:
        raise HTTPException(
            status_code=404,
            detail="Reminder not found"
        )

    db.delete(reminder)
    db.commit()

    return None
