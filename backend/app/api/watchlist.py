import os
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import WatchlistModel
from app.schemas.schemas import WatchlistCreate, WatchlistResponse

router = APIRouter(prefix="/watchlist", tags=["Watchlist"])

def verify_admin(x_admin_key: str = Header(...)):
    expected_key = os.getenv("ADMIN_API_KEY", "secret-admin-key")
    if x_admin_key != expected_key:
        raise HTTPException(status_code=403, detail="Invalid admin API key")
    return True

@router.get("/", response_model=List[WatchlistResponse])
def get_watchlist(db: Session = Depends(get_db)):
    return db.query(WatchlistModel).all()

@router.post("/", response_model=WatchlistResponse)
def create_watchlist(item: WatchlistCreate, db: Session = Depends(get_db), admin: bool = Depends(verify_admin)):
    watchlist_item = WatchlistModel(**item.model_dump())
    db.add(watchlist_item)
    db.commit()
    db.refresh(watchlist_item)
    return watchlist_item