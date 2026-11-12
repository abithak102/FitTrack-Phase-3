
from datetime import date

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status
)
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import Meal, User
from ..schemas_meal import (
    MealCreate,
    MealUpdate,
    MealOut,
    NutritionSummary
)
from ..auth import get_current_user


router = APIRouter(
    prefix="/meals",
    tags=["Nutrition & Meals"]
)


# -------------------------
# CREATE MEAL
# -------------------------

@router.post(
    "/",
    response_model=MealOut,
    status_code=status.HTTP_201_CREATED
)
def create_meal(
    meal_data: MealCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_meal = Meal(
        user_id=current_user.id,
        meal_type=meal_data.meal_type.value,
        food_name=meal_data.food_name,
        calories=meal_data.calories,
        protein=meal_data.protein,
        carbs=meal_data.carbs,
        fats=meal_data.fats
    )

    db.add(new_meal)
    db.commit()
    db.refresh(new_meal)

    return new_meal


# -------------------------
# DAILY NUTRITION SUMMARY
# -------------------------

@router.get(
    "/daily-summary",
    response_model=NutritionSummary
)
def get_daily_summary(
    target_date: date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    selected_date = target_date or date.today()

    summary = db.query(
        func.coalesce(func.sum(Meal.calories), 0),
        func.coalesce(func.sum(Meal.protein), 0),
        func.coalesce(func.sum(Meal.carbs), 0),
        func.coalesce(func.sum(Meal.fats), 0),
        func.count(Meal.id)
    ).filter(
        Meal.user_id == current_user.id,
        func.date(Meal.created_at) == selected_date.isoformat()
    ).first()

    return NutritionSummary(
        date=selected_date,
        total_calories=summary[0],
        total_protein=summary[1],
        total_carbs=summary[2],
        total_fats=summary[3],
        total_meals=summary[4]
    )


# -------------------------
# GET ALL USER MEALS
# -------------------------

@router.get("/", response_model=list[MealOut])
def get_meals(
    target_date: date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Meal).filter(
        Meal.user_id == current_user.id
    )

    if target_date:
        query = query.filter(
            func.date(Meal.created_at) == target_date.isoformat()
        )

    meals = query.order_by(
        Meal.created_at.desc()
    ).all()

    return meals


# -------------------------
# UPDATE MEAL
# -------------------------

@router.put("/{meal_id}", response_model=MealOut)
def update_meal(
    meal_id: int,
    meal_data: MealUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    meal = db.query(Meal).filter(
        Meal.id == meal_id,
        Meal.user_id == current_user.id
    ).first()

    if meal is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meal not found"
        )

    update_data = meal_data.model_dump(
        exclude_unset=True,
        exclude_none=True
    )

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid fields provided for update"
        )

    for field, value in update_data.items():
        if field == "meal_type":
            value = value.value

        setattr(meal, field, value)

    db.commit()
    db.refresh(meal)

    return meal


# -------------------------
# DELETE MEAL
# -------------------------

@router.delete(
    "/{meal_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_meal(
    meal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    meal = db.query(Meal).filter(
        Meal.id == meal_id,
        Meal.user_id == current_user.id
    ).first()

    if meal is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meal not found"
        )

    db.delete(meal)
    db.commit()

    return None
