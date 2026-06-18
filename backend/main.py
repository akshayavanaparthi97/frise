"""FastAPI main application for Frise."""
import os
import re
import json
import math
from datetime import datetime
from typing import Dict, List, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.models import (
    ActivityLog,
    FoodItem,
    Notification,
    NotificationTypeEnum,
    StatusEnum,
)
import schemas
from database import get_db, init_db

FRIDGE_CAPACITY_UNITS = 40
SHELF_CAPACITY_UNITS = {
    "Top Shelf": 8,
    "Middle Shelf": 8,
    "Bottom Shelf": 8,
    "Door Rack": 5,
    "Crisper Drawer": 5,
    "Freezer": 4,
    "Chiller Tray": 2,
}


# Lifespan context manager for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management."""
    # Startup
    init_db()
    print("Database initialized")
    yield
    # Shutdown
    print("Application shutting down")


# Create FastAPI app
app = FastAPI(
    title="Frise API",
    description="Smart Food Shelf-Life Tracker",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration - Add BEFORE any middleware or routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://localhost",
        "*"  # Allow all origins for development
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    max_age=3600,
)

# Create uploads directory if it doesn't exist
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


# ==================== Utility Functions ====================

def calculate_status(expiry_date: datetime) -> StatusEnum:
    """Calculate food item status based on expiry date."""
    now = datetime.now()
    time_diff = expiry_date - now

    if time_diff.total_seconds() < 0:
        return StatusEnum.EXPIRED
    elif time_diff.total_seconds() < 48 * 3600:  # 48 hours
        return StatusEnum.EXPIRING_SOON
    else:
        return StatusEnum.FRESH


def format_remaining_time(expiry_date: datetime) -> str:
    """Format remaining time until expiry."""
    now = datetime.now()
    diff = expiry_date - now

    if diff.total_seconds() < 0:
        return "Expired"

    days = diff.days
    hours = diff.seconds // 3600
    minutes = (diff.seconds % 3600) // 60

    if days > 0:
        return f"{days} Day{'s' if days != 1 else ''}"
    elif hours > 0:
        return f"{hours} Hour{'s' if hours != 1 else ''}"
    else:
        return f"{minutes} Minute{'s' if minutes != 1 else ''}"


def build_notification_message(item: FoodItem, status: StatusEnum) -> str:
    """Build a user-facing notification message for an item status."""
    if status == StatusEnum.EXPIRED:
        return f"{item.item_name} has expired."

    remaining_time = format_remaining_time(item.expiry_date)
    return f"{item.item_name} is expiring soon. {remaining_time} remaining."


def ensure_status_notification(
    db: Session,
    item: FoodItem,
    status: StatusEnum
) -> None:
    """Create a status notification if one does not already exist."""
    if status not in (StatusEnum.EXPIRING_SOON, StatusEnum.EXPIRED):
        return

    notification_type = NotificationTypeEnum(status.value)
    existing = db.query(Notification).filter(
        Notification.item_id == item.id,
        Notification.notification_type == notification_type
    ).first()

    if existing:
        return

    db.add(Notification(
        item_id=item.id,
        message=build_notification_message(item, status),
        notification_type=notification_type,
        triggered_at=datetime.now()
    ))


def sync_item_statuses_and_notifications(db: Session) -> None:
    """Refresh item statuses and generate expiry notifications."""
    changed = False
    items = db.query(FoodItem).all()

    for item in items:
        status = calculate_status(item.expiry_date)
        if item.status != status:
            item.status = status
            db.add(item)
            changed = True

        if status in (StatusEnum.EXPIRING_SOON, StatusEnum.EXPIRED):
            before_new = len(db.new)
            ensure_status_notification(db, item, status)
            changed = changed or len(db.new) > before_new

    if changed:
        db.commit()


def get_used_space(db: Session, exclude_item_id: Optional[int] = None) -> int:
    """Calculate fridge space used by stored items."""
    query = db.query(FoodItem)
    if exclude_item_id is not None:
        query = query.filter(FoodItem.id != exclude_item_id)

    return sum((item.space_units or 1) for item in query.all())


def get_shelf_used_space(
    db: Session,
    shelf_location: Optional[str],
    exclude_item_id: Optional[int] = None
) -> int:
    """Calculate fridge space used on a specific shelf."""
    if not shelf_location:
        return 0

    query = db.query(FoodItem).filter(FoodItem.shelf_location == shelf_location)
    if exclude_item_id is not None:
        query = query.filter(FoodItem.id != exclude_item_id)

    return sum((item.space_units or 1) for item in query.all())


def ensure_fridge_space(
    db: Session,
    requested_space: Optional[int],
    shelf_location: Optional[str] = None,
    exclude_item_id: Optional[int] = None
) -> None:
    """Reject create/update requests that exceed fridge or shelf capacity."""
    space_units = requested_space or 1
    used_space = get_used_space(db, exclude_item_id=exclude_item_id)
    empty_space = FRIDGE_CAPACITY_UNITS - used_space

    if space_units > empty_space:
        unit_label = "unit" if empty_space == 1 else "units"
        raise HTTPException(
            status_code=400,
            detail=(
                f"Not enough fridge space. {empty_space} space "
                f"{unit_label} available."
            )
        )

    if shelf_location in SHELF_CAPACITY_UNITS:
        shelf_capacity = SHELF_CAPACITY_UNITS[shelf_location]
        shelf_used = get_shelf_used_space(
            db,
            shelf_location,
            exclude_item_id=exclude_item_id
        )
        shelf_empty = shelf_capacity - shelf_used

        if space_units > shelf_empty:
            unit_label = "unit" if shelf_empty == 1 else "units"
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Not enough space on {shelf_location}. "
                    f"{shelf_empty} space {unit_label} available."
                )
            )


def build_upload_filename(
    item_id: int,
    original_filename: Optional[str]
) -> str:
    """Create a safe, stable filename for an uploaded item image."""
    basename = os.path.basename(original_filename or "image")
    stem, extension = os.path.splitext(basename)
    safe_stem = (
        re.sub(r"[^A-Za-z0-9._-]+", "_", stem).strip("._") or "image"
    )
    safe_extension = re.sub(r"[^A-Za-z0-9.]+", "", extension.lower())
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S%f")
    return f"{item_id}_{timestamp}_{safe_stem[:80]}{safe_extension}"


def get_item_lifecycle_days(item: FoodItem) -> int:
    """Return how many days an item has been tracked."""
    created_at = item.created_at or datetime.now()
    if getattr(created_at, "tzinfo", None) is not None:
        created_at = created_at.replace(tzinfo=None)

    seconds = max((datetime.now() - created_at).total_seconds(), 0)
    return max(1, math.ceil(seconds / 86400))


def log_item_outcome(db: Session, item: FoodItem, outcome: str) -> None:
    """Persist a consumption/waste event for pattern learning."""
    details = {
        "item_name": item.item_name,
        "category": item.category,
        "quantity": item.quantity or 1,
        "unit": item.unit or "unit",
        "days_in_fridge": get_item_lifecycle_days(item),
        "outcome": outcome.lower(),
    }

    db.add(ActivityLog(
        action=outcome.upper(),
        item_id=item.id,
        details=json.dumps(details)
    ))


def delete_item_records(db: Session, item: FoodItem) -> None:
    """Remove an item and its active notifications."""
    db.query(Notification).filter(Notification.item_id == item.id).delete()
    db.delete(item)


def parse_outcome_details(log: ActivityLog) -> Optional[Dict]:
    """Read structured learning details from an activity log row."""
    if log.action not in ("CONSUMED", "WASTED") or not log.details:
        return None

    try:
        details = json.loads(log.details)
    except json.JSONDecodeError:
        return None

    if not details.get("item_name"):
        return None

    return details


def build_pattern_insights(db: Session) -> Dict:
    """Build learned consumption and waste suggestions."""
    logs = db.query(ActivityLog).filter(
        ActivityLog.action.in_(["CONSUMED", "WASTED"])
    ).order_by(desc(ActivityLog.created_at)).all()

    grouped = {}
    for log in logs:
        details = parse_outcome_details(log)
        if not details:
            continue

        key = details["item_name"].strip().lower()
        group = grouped.setdefault(key, {
            "item_name": details["item_name"].strip(),
            "category": details.get("category") or "Other",
            "consumed_days": [],
            "wasted_count": 0,
            "total_count": 0,
            "last_seen": log.created_at,
        })

        group["total_count"] += 1
        if details.get("outcome") == "wasted":
            group["wasted_count"] += 1
        else:
            group["consumed_days"].append(details.get("days_in_fridge") or 1)

    insights = []
    for group in grouped.values():
        average_days = None
        if group["consumed_days"]:
            average_days = round(sum(group["consumed_days"]) / len(group["consumed_days"]))

        messages = []
        if average_days:
            messages.append(
                f"You usually finish {group['item_name']} in {average_days} day"
                f"{'s' if average_days != 1 else ''}."
            )

        if group["wasted_count"] > 0:
            messages.append(f"You usually waste {group['item_name']}.")

        if group["wasted_count"] > 0:
            recommendation = f"Buy smaller quantity of {group['item_name']} next time."
        elif average_days:
            recommendation = (
                f"Plan {group['item_name']} for about {average_days} day"
                f"{'s' if average_days != 1 else ''} after buying."
            )
        else:
            recommendation = f"Keep tracking {group['item_name']} to improve suggestions."

        insights.append({
            "item_name": group["item_name"],
            "category": group["category"],
            "average_consumption_days": average_days,
            "wasted_count": group["wasted_count"],
            "total_events": group["total_count"],
            "messages": messages,
            "recommendation": recommendation,
            "confidence": min(group["total_count"], 4),
        })

    insights.sort(key=lambda insight: (insight["wasted_count"], insight["total_events"]), reverse=True)

    return {
        "total_events": sum(group["total_count"] for group in grouped.values()),
        "insights": insights[:6],
    }


# ==================== Food Items Endpoints ====================

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Frise API - Smart Food Shelf-Life Tracker",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.post("/api/food-items", response_model=schemas.FoodItemResponse)
async def create_food_item(
    item: schemas.FoodItemCreate,
    db: Session = Depends(get_db)
):
    """Create a new food item."""
    # Check for duplicate barcode
    if item.barcode:
        existing = db.query(FoodItem).filter(
            FoodItem.barcode == item.barcode
        ).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail="Barcode already exists"
            )

    # Calculate initial status
    status = calculate_status(item.expiry_date)
    ensure_fridge_space(db, item.space_units, item.shelf_location)

    # Create food item
    db_item = FoodItem(
        item_name=item.item_name,
        category=item.category,
        barcode=item.barcode,
        expiry_date=item.expiry_date,
        quantity=item.quantity,
        description=item.description,
        unit=item.unit,
        shelf_location=item.shelf_location,
        storage_state=item.storage_state,
        space_units=item.space_units,
        status=status
    )

    db.add(db_item)
    db.commit()
    db.refresh(db_item)

    ensure_status_notification(db, db_item, status)

    # Log activity
    log = ActivityLog(
        action="CREATE",
        item_id=db_item.id,
        details=f"Created food item: {item.item_name}"
    )
    db.add(log)
    db.commit()

    return db_item


@app.get("/api/food-items", response_model=List[schemas.FoodItemResponse])
async def list_food_items(
    category: Optional[str] = None,
    status: Optional[str] = None,
    sort_by: Optional[str] = "expiry_date",
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all food items with filtering and sorting."""
    sync_item_statuses_and_notifications(db)

    query = db.query(FoodItem)

    if category:
        query = query.filter(FoodItem.category == category)

    if status:
        try:
            status_enum = StatusEnum(status)
            query = query.filter(FoodItem.status == status_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid status")

    # Sorting
    if sort_by == "expiry_date":
        query = query.order_by(FoodItem.expiry_date)
    elif sort_by == "name":
        query = query.order_by(FoodItem.item_name)
    elif sort_by == "category":
        query = query.order_by(FoodItem.category)
    elif sort_by == "created_at":
        query = query.order_by(desc(FoodItem.created_at))

    items = query.offset(skip).limit(limit).all()
    return items


@app.get("/api/food-items/{item_id}", response_model=schemas.FoodItemResponse)
async def get_food_item(item_id: int, db: Session = Depends(get_db)):
    """Get a specific food item."""
    sync_item_statuses_and_notifications(db)

    item = db.query(FoodItem).filter(
        FoodItem.id == item_id
    ).first()

    if not item:
        raise HTTPException(status_code=404, detail="Food item not found")

    return item


@app.put("/api/food-items/{item_id}", response_model=schemas.FoodItemResponse)
async def update_food_item(
    item_id: int,
    item_update: schemas.FoodItemUpdate,
    db: Session = Depends(get_db)
):
    """Update a food item."""
    db_item = db.query(FoodItem).filter(
        FoodItem.id == item_id
    ).first()

    if not db_item:
        raise HTTPException(status_code=404, detail="Food item not found")

    # Check for duplicate barcode
    if item_update.barcode and item_update.barcode != db_item.barcode:
        existing = db.query(FoodItem).filter(
            FoodItem.barcode == item_update.barcode
        ).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail="Barcode already exists"
            )

    # Update fields
    update_data = item_update.model_dump(exclude_unset=True)
    requested_space = update_data.get("space_units", db_item.space_units or 1)
    requested_shelf = update_data.get("shelf_location", db_item.shelf_location)
    ensure_fridge_space(
        db,
        requested_space,
        requested_shelf,
        exclude_item_id=item_id
    )

    for field, value in update_data.items():
        setattr(db_item, field, value)

    # Recalculate status if expiry_date changed
    if item_update.expiry_date:
        db_item.status = calculate_status(item_update.expiry_date)

    db.add(db_item)
    db.commit()
    db.refresh(db_item)

    ensure_status_notification(db, db_item, db_item.status)

    # Log activity
    log = ActivityLog(
        action="UPDATE",
        item_id=db_item.id,
        details=f"Updated food item: {db_item.item_name}"
    )
    db.add(log)
    db.commit()

    return db_item


@app.delete("/api/food-items/{item_id}")
async def delete_food_item(item_id: int, db: Session = Depends(get_db)):
    """Delete a food item."""
    db_item = db.query(FoodItem).filter(
        FoodItem.id == item_id
    ).first()

    if not db_item:
        raise HTTPException(status_code=404, detail="Food item not found")

    item_name = db_item.item_name

    delete_item_records(db, db_item)
    db.commit()

    # Log activity
    log = ActivityLog(
        action="DELETE",
        item_id=item_id,
        details=f"Deleted food item: {item_name}"
    )
    db.add(log)
    db.commit()

    return {"message": "Food item deleted successfully"}


@app.post("/api/food-items/{item_id}/consume")
async def mark_food_item_consumed(item_id: int, db: Session = Depends(get_db)):
    """Mark an item as used so Frise can learn consumption patterns."""
    db_item = db.query(FoodItem).filter(FoodItem.id == item_id).first()

    if not db_item:
        raise HTTPException(status_code=404, detail="Food item not found")

    log_item_outcome(db, db_item, "CONSUMED")
    delete_item_records(db, db_item)
    db.commit()

    return {"message": "Item marked as used"}


@app.post("/api/food-items/{item_id}/waste")
async def mark_food_item_wasted(item_id: int, db: Session = Depends(get_db)):
    """Mark an item as wasted so Frise can learn waste patterns."""
    db_item = db.query(FoodItem).filter(FoodItem.id == item_id).first()

    if not db_item:
        raise HTTPException(status_code=404, detail="Food item not found")

    log_item_outcome(db, db_item, "WASTED")
    delete_item_records(db, db_item)
    db.commit()

    return {"message": "Item marked as wasted"}


# ==================== Image Upload Endpoint ====================

@app.post("/api/food-items/{item_id}/upload-image")
async def upload_image(
    item_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload an image for a food item."""
    db_item = db.query(FoodItem).filter(
        FoodItem.id == item_id
    ).first()

    if not db_item:
        raise HTTPException(status_code=404, detail="Food item not found")

    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type")

    # Save file
    filename = build_upload_filename(item_id, file.filename)
    file_path = os.path.join("uploads", filename)

    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    # Update item
    db_item.image_path = f"/uploads/{filename}"
    db.add(db_item)
    db.commit()

    return {
        "message": "Image uploaded successfully",
        "path": db_item.image_path
    }


# ==================== Search Endpoint ====================

@app.get("/api/search")
async def search_items(
    query: str,
    db: Session = Depends(get_db)
):
    """Search food items by name or barcode."""
    if len(query) < 2:
        raise HTTPException(status_code=400, detail="Query too short")

    items = db.query(FoodItem).filter(
        (FoodItem.item_name.ilike(f"%{query}%")) |
        (FoodItem.barcode == query)
    ).limit(10).all()

    return items


# ==================== Dashboard Endpoints ====================

@app.get("/api/dashboard/stats", response_model=schemas.DashboardStats)
async def get_dashboard_stats(db: Session = Depends(get_db)):
    """Get dashboard statistics."""
    sync_item_statuses_and_notifications(db)

    total_items = db.query(FoodItem).count()
    fresh_items = db.query(FoodItem).filter(
        FoodItem.status == StatusEnum.FRESH
    ).count()
    expiring_soon_items = db.query(FoodItem).filter(
        FoodItem.status == StatusEnum.EXPIRING_SOON
    ).count()
    expired_items = db.query(FoodItem).filter(
        FoodItem.status == StatusEnum.EXPIRED
    ).count()

    total_notifications = db.query(Notification).count()
    unread_notifications = db.query(Notification).filter(
        Notification.is_read.is_(False)
    ).count()
    used_space = get_used_space(db)

    return schemas.DashboardStats(
        total_items=total_items,
        fresh_items=fresh_items,
        expiring_soon_items=expiring_soon_items,
        expired_items=expired_items,
        total_notifications=total_notifications,
        unread_notifications=unread_notifications,
        fridge_capacity=FRIDGE_CAPACITY_UNITS,
        used_space=used_space,
        empty_space=max(FRIDGE_CAPACITY_UNITS - used_space, 0)
    )


@app.get(
    "/api/dashboard/categories",
    response_model=List[schemas.CategoryStats]
)
async def get_category_stats(db: Session = Depends(get_db)):
    """Get statistics by category."""
    sync_item_statuses_and_notifications(db)

    categories = db.query(FoodItem.category).distinct().all()

    stats = []
    for (category,) in categories:
        total = db.query(FoodItem).filter(
            FoodItem.category == category
        ).count()
        fresh = db.query(FoodItem).filter(
            FoodItem.category == category,
            FoodItem.status == StatusEnum.FRESH
        ).count()
        expiring_soon = db.query(FoodItem).filter(
            FoodItem.category == category,
            FoodItem.status == StatusEnum.EXPIRING_SOON
        ).count()
        expired = db.query(FoodItem).filter(
            FoodItem.category == category,
            FoodItem.status == StatusEnum.EXPIRED
        ).count()

        stats.append(schemas.CategoryStats(
            category=category,
            count=total,
            fresh=fresh,
            expiring_soon=expiring_soon,
            expired=expired
        ))

    return stats


@app.get("/api/dashboard/consumption-patterns")
async def get_consumption_patterns(db: Session = Depends(get_db)):
    """Get learned food consumption and waste patterns."""
    return build_pattern_insights(db)


# ==================== Notification Endpoints ====================

@app.get(
    "/api/notifications",
    response_model=List[schemas.NotificationResponse]
)
async def get_notifications(
    skip: int = 0,
    limit: int = 50,
    unread_only: bool = False,
    db: Session = Depends(get_db)
):
    """Get notifications."""
    sync_item_statuses_and_notifications(db)

    query = db.query(Notification)

    if unread_only:
        query = query.filter(Notification.is_read.is_(False))

    notifications = query.order_by(
        desc(Notification.created_at)
    ).offset(skip).limit(limit).all()

    return notifications


@app.put("/api/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db)
):
    """Mark notification as read."""
    notification = db.query(Notification).filter(
        Notification.id == notification_id
    ).first()

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = True
    db.add(notification)
    db.commit()

    return {"message": "Notification marked as read"}


@app.delete("/api/notifications/{notification_id}")
async def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db)
):
    """Delete a notification."""
    notification = db.query(Notification).filter(
        Notification.id == notification_id
    ).first()

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    db.delete(notification)
    db.commit()

    return {"message": "Notification deleted"}


# ==================== Health Check ====================

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
