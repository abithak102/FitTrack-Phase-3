from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.auth import get_current_user
from app.models import WaterIntake, WaterGoal
from app.schemas_water import (
    WaterIntakeCreate,
    WaterIntakeOut,
    WaterGoalCreate,
    WaterGoalOut,
    WaterSummary
)

router = APIRouter(
    prefix="/water",
    tags=["Water Intake Tracker"]
)


# Add Water Intake
@router.post("/", response_model=WaterIntakeOut, status_code=status.HTTP_201_CREATED)
def add_water_intake(
    intake: WaterIntakeCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    water = WaterIntake(
        user_id=current_user.id,
        amount_ml=intake.amount_ml,
        intake_date=intake.intake_date
    )

    db.add(water)
    db.commit()
    db.refresh(water)

    return water


# Get Water Intake Records
@router.get("/", response_model=list[WaterIntakeOut])
def get_water_intakes(
    target_date: date | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    query = db.query(WaterIntake).filter(
        WaterIntake.user_id == current_user.id
    )

    if target_date:
        query = query.filter(WaterIntake.intake_date == target_date)

    return query.order_by(WaterIntake.created_at.desc()).all()


# Delete Water Intake
@router.delete("/{intake_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_water_intake(
    intake_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    water = db.query(WaterIntake).filter(
        WaterIntake.id == intake_id,
        WaterIntake.user_id == current_user.id
    ).first()

    if not water:
        raise HTTPException(
            status_code=404,
            detail="Water intake record not found"
        )

    db.delete(water)
    db.commit()


# Set or Update Daily Water Goal
@router.put("/goal", response_model=WaterGoalOut)
def set_water_goal(
    goal: WaterGoalCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    water_goal = db.query(WaterGoal).filter(
        WaterGoal.user_id == current_user.id
    ).first()

    if water_goal:
        water_goal.daily_goal_ml = goal.daily_goal_ml
    else:
        water_goal = WaterGoal(
            user_id=current_user.id,
            daily_goal_ml=goal.daily_goal_ml
        )
        db.add(water_goal)

    db.commit()
    db.refresh(water_goal)

    return water_goal


# Get Daily Water Summary
@router.get("/daily-summary", response_model=WaterSummary)
def get_water_summary(
    target_date: date | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    selected_date = target_date or date.today()

    total_intake = db.query(
        func.coalesce(func.sum(WaterIntake.amount_ml), 0)
    ).filter(
        WaterIntake.user_id == current_user.id,
        WaterIntake.intake_date == selected_date
    ).scalar()

    water_goal = db.query(WaterGoal).filter(
        WaterGoal.user_id == current_user.id
    ).first()

    daily_goal = water_goal.daily_goal_ml if water_goal else 2000
    remaining = max(daily_goal - total_intake, 0)

    percentage = round((total_intake / daily_goal) * 100, 2) if daily_goal > 0 else 0

    return {
        "intake_date": selected_date,
        "total_intake_ml": total_intake,
        "daily_goal_ml": daily_goal,
        "remaining_ml": remaining,
        "completion_percentage": percentage
    }