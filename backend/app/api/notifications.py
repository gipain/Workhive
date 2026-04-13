import uuid

from fastapi import APIRouter, Query

from app.api.deps import CurrentUser, DB
from app.models.notification import Notification
from app.schemas.notification import NotificationResponse, NotificationListResponse, UnreadCountResponse
from app.core.exceptions import NotFoundError, ForbiddenError

router = APIRouter(prefix="/notifications", tags=["Сповіщення"])


@router.get("", response_model=NotificationListResponse)
def list_notifications(
    current_user: CurrentUser,
    db: DB,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
):
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    total = query.count()
    unread = query.filter(Notification.is_read == False).count()
    items = query.order_by(Notification.created_at.desc()).offset((page - 1) * size).limit(size).all()
    return NotificationListResponse(items=items, total=total, unread_count=unread, page=page, size=size)


@router.get("/unread-count", response_model=UnreadCountResponse)
def unread_count(current_user: CurrentUser, db: DB):
    count = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id, Notification.is_read == False)
        .count()
    )
    return UnreadCountResponse(count=count)


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def mark_read(notification_id: uuid.UUID, current_user: CurrentUser, db: DB):
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        raise NotFoundError("Сповіщення не знайдено")
    if notif.user_id != current_user.id:
        raise ForbiddenError("Це не ваше сповіщення")

    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif


@router.patch("/read-all")
def mark_all_read(current_user: CurrentUser, db: DB):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False,
    ).update({"is_read": True})
    db.commit()
    return {"message": "Всі сповіщення позначено як прочитані"}
