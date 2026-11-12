
from datetime import datetime

from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session

from .database import SessionLocal
from .models.reminder import Reminder
from .models.notification import Notification


def check_due_reminders():
    db: Session = SessionLocal()

    try:
        now = datetime.now()

        due_reminders = (
            db.query(Reminder)
            .filter(
                Reminder.is_completed == False,
                Reminder.is_notified == False,
                Reminder.reminder_date <= now.date()
            )
            .all()
        )

        for reminder in due_reminders:
            reminder_datetime = datetime.combine(
                reminder.reminder_date,
                reminder.reminder_time
            )

            if reminder_datetime <= now:
                notification = Notification(
                    user_id=reminder.user_id,
                    title="Reminder: " + reminder.title,
                    message=(
                        reminder.description
                        or "Your scheduled reminder is due now."
                    )
                )

                db.add(notification)
                reminder.is_notified = True

        db.commit()

    except Exception as error:
        db.rollback()
        print("Reminder scheduler error:", error)

    finally:
        db.close()


scheduler = BackgroundScheduler()


def start_reminder_scheduler():
    if not scheduler.running:
        scheduler.add_job(
            check_due_reminders,
            trigger="interval",
            seconds=30,
            id="reminder_checker",
            replace_existing=True
        )

        scheduler.start()
        print("Reminder scheduler started successfully!")
