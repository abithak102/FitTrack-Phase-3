from datetime import date, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import Workout, User, Goal
from ..auth import get_current_user



router = APIRouter(
    prefix="/analytics",
    tags=["Fitness Analytics"]
)


@router.get("/overview")
def get_analytics_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Total workout count
    total_workouts = db.query(
        func.count(Workout.id)
    ).filter(
        Workout.user_id == current_user.id
    ).scalar() or 0

    # Total calories burned
    total_calories = db.query(
        func.coalesce(func.sum(Workout.calories_burned), 0)
    ).filter(
        Workout.user_id == current_user.id
    ).scalar()

    # Total workout duration
    total_duration = db.query(
        func.coalesce(func.sum(Workout.duration), 0)
    ).filter(
        Workout.user_id == current_user.id
    ).scalar()

    # Workout category breakdown
    category_data = db.query(
        Workout.category,
        func.count(Workout.id).label("count")
    ).filter(
        Workout.user_id == current_user.id
    ).group_by(
        Workout.category
    ).all()

    category_breakdown = [
        {
            "category": category,
            "count": count
        }
        for category, count in category_data
    ]

    # Monthly workout statistics
    monthly_data = db.query(
        func.strftime("%Y-%m", Workout.workout_date).label("month"),
        func.count(Workout.id).label("workouts"),
        func.coalesce(
            func.sum(Workout.calories_burned), 0
        ).label("calories")
    ).filter(
        Workout.user_id == current_user.id
    ).group_by(
        func.strftime("%Y-%m", Workout.workout_date)
    ).order_by(
        func.strftime("%Y-%m", Workout.workout_date)
    ).all()

    monthly_statistics = [
        {
            "month": month,
            "workouts": workouts,
            "calories": calories
        }
        for month, workouts, calories in monthly_data
    ]

    return {
        "total_workouts": total_workouts,
        "total_calories": total_calories,
        "total_duration": total_duration,
        "category_breakdown": category_breakdown,
        "monthly_statistics": monthly_statistics
    }
# ADVANCED ANALYTICS
@router.get("/advanced")
def get_advanced_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = date.today()

    # WEEKLY WORKOUT TREND - LAST 7 DAYS
    week_start = today - timedelta(days=6)

    weekly_data = db.query(
        Workout.workout_date,
        func.count(Workout.id).label("workouts"),
        func.coalesce(
            func.sum(Workout.calories_burned), 0
        ).label("calories")
    ).filter(
        Workout.user_id == current_user.id,
        Workout.workout_date >= week_start,
        Workout.workout_date <= today
    ).group_by(
        Workout.workout_date
    ).all()

    weekly_lookup = {
        item.workout_date: {
            "workouts": item.workouts,
            "calories": float(item.calories)
        }
        for item in weekly_data
    }

    weekly_trend = []

    for day_number in range(7):
        current_day = week_start + timedelta(days=day_number)

        day_data = weekly_lookup.get(
            current_day,
            {"workouts": 0, "calories": 0}
        )

        weekly_trend.append({
            "date": current_day.isoformat(),
            "workouts": day_data["workouts"],
            "calories": day_data["calories"]
        })

    # GOAL COMPLETION STATISTICS
    goals = db.query(Goal).filter(
        Goal.user_id == current_user.id
    ).all()

    total_goals = len(goals)

    completed_goals = sum(
        1 for goal in goals
        if goal.status.upper() == "COMPLETED"
    )

    active_goals = sum(
        1 for goal in goals
        if goal.status.upper() == "ACTIVE"
    )

    completion_percentage = (
        (completed_goals / total_goals) * 100
        if total_goals > 0 else 0
    )

    progress_values = [
        min((goal.current_value / goal.target_value) * 100, 100)
        for goal in goals
        if goal.target_value > 0
    ]

    average_goal_progress = (
        sum(progress_values) / len(progress_values)
        if progress_values else 0
    )

    # WORKOUT CONSISTENCY - LAST 30 DAYS
    month_start = today - timedelta(days=29)

    active_workout_days = db.query(
        func.count(func.distinct(Workout.workout_date))
    ).filter(
        Workout.user_id == current_user.id,
        Workout.workout_date >= month_start,
        Workout.workout_date <= today
    ).scalar() or 0

    consistency_percentage = (
        (active_workout_days / 30) * 100
    )

    return {
        "weekly_trend": weekly_trend,

        "goal_statistics": {
            "total_goals": total_goals,
            "active_goals": active_goals,
            "completed_goals": completed_goals,
            "completion_percentage": round(
                completion_percentage, 2
            ),
            "average_goal_progress": round(
                average_goal_progress, 2
            )
        },

        "workout_consistency": {
            "period_days": 30,
            "active_workout_days": active_workout_days,
            "consistency_percentage": round(
                consistency_percentage, 2
            )
        }
    }
