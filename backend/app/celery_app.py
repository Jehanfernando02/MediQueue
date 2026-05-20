from celery import Celery
from celery.schedules import crontab
from app.config import settings

# Initialize Celery
celery_app = Celery(
    "mediqueue_tasks",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

# Optional configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
)

# Celery Beat Schedule
celery_app.conf.beat_schedule = {
    "send-appointment-reminders-every-15-min": {
        "task": "app.tasks.notification_tasks.send_appointment_reminders",
        "schedule": 900.0,  # 15 minutes in seconds
    },
    "nightly-no-show-sweep": {
        "task": "app.tasks.appointment_tasks.nightly_no_show_sweep",
        "schedule": crontab(hour=0, minute=5),  # Run at 12:05 AM every night
    },
}

# Auto-discover tasks
celery_app.autodiscover_tasks(["app.tasks"])
