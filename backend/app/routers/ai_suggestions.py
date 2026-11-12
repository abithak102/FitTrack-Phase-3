
from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..auth import get_current_user
from ..models.workout import Workout
from ..models.goal import Goal
from ..schemas_ai import (
    AISuggestionResponse,
    WorkoutRecommendation
)


router = APIRouter(
    prefix="/ai-suggestions",
    tags=["AI Workout Suggestions"]
)


@router.get(
    "/",
    response_model=AISuggestionResponse
)
def get_ai_suggestions(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    today = date.today()
    seven_days_ago = today - timedelta(days=6)

    # Get recent workout history
    recent_workouts = (
        db.query(Workout)
        .filter(
            Workout.user_id == current_user.id,
            Workout.workout_date >= seven_days_ago,
            Workout.workout_date <= today
        )
        .all()
    )

    workouts_last_7_days = len(recent_workouts)

    # Get all previous workout dates
    workout_dates = (
        db.query(Workout.workout_date)
        .filter(
            Workout.user_id == current_user.id,
            Workout.workout_date <= today
        )
        .distinct()
        .order_by(Workout.workout_date.desc())
        .all()
    )

    dates = [item[0] for item in workout_dates]

    # Calculate current streak
    current_streak = 0

    if dates and dates[0] in (
        today,
        today - timedelta(days=1)
    ):
        expected_date = dates[0]

        for workout_date in dates:
            if workout_date == expected_date:
                current_streak += 1
                expected_date -= timedelta(days=1)
            else:
                break

    last_workout_date = dates[0] if dates else None

    # Get active fitness goals
    active_goals = (
        db.query(Goal)
        .filter(
            Goal.user_id == current_user.id,
            Goal.status == "ACTIVE"
        )
        .all()
    )

    # Analyze workout categories
    category_counts = {}

    for workout in recent_workouts:
        category = workout.category.lower()
        category_counts[category] = (
            category_counts.get(category, 0) + 1
        )

    # Analyze goal titles
    goal_text = " ".join(
        goal.goal_title.lower()
        for goal in active_goals
    )

    recommendations = []

    # Cardio recommendation
    if (
        category_counts.get("cardio", 0) == 0
        or any(word in goal_text for word in [
            "weight", "fat", "cardio", "calorie"
        ])
    ):
        recommendations.append(
            WorkoutRecommendation(
                title="Brisk Walking",
                category="Cardio",
                duration_minutes=25,
                intensity="Beginner",
                reason=(
                    "Build cardiovascular endurance and "
                    "support your fitness goals."
                )
            )
        )

    # Strength recommendation
    if (
        category_counts.get("strength", 0) == 0
        or any(word in goal_text for word in [
            "strength", "muscle", "fitness"
        ])
    ):
        recommendations.append(
            WorkoutRecommendation(
                title="Full Body Bodyweight Workout",
                category="Strength",
                duration_minutes=20,
                intensity="Beginner",
                reason=(
                    "Improve overall strength using "
                    "simple bodyweight exercises."
                )
            )
        )

    # Yoga recommendation
    if (
        category_counts.get("yoga", 0) == 0
        or current_streak >= 3
    ):
        recommendations.append(
            WorkoutRecommendation(
                title="Full Body Yoga",
                category="Yoga",
                duration_minutes=15,
                intensity="Beginner",
                reason=(
                    "Improve flexibility and support "
                    "recovery between workouts."
                )
            )
        )

    # Default recommendations if needed
    if not recommendations:
        recommendations.append(
            WorkoutRecommendation(
                title="Light Recovery Walk",
                category="Cardio",
                duration_minutes=15,
                intensity="Beginner",
                reason=(
                    "Maintain an active routine with "
                    "a light recovery session."
                )
            )
        )

    recommendations = recommendations[:3]

    # Personalized message
    if workouts_last_7_days == 0:
        message = (
            "Let's get started! Begin with these "
            "simple beginner-friendly workouts."
        )
    elif current_streak >= 3:
        message = (
            "Great consistency! Keep going and "
            "remember to include recovery."
        )
    else:
        message = (
            "Here are some workout suggestions "
            "based on your recent activity and goals."
        )

    return AISuggestionResponse(
        current_streak=current_streak,
        workouts_last_7_days=workouts_last_7_days,
        active_goals_count=len(active_goals),
        last_workout_date=last_workout_date,
        recommendations=recommendations,
        message=message
    )
