from typing import List
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.etl import ETLEngine
from app.models.models import CrawlRunModel
from app.schemas.schemas import CrawlTriggerRequest, CrawlRunResponse

router = APIRouter(prefix="/crawl", tags=["Crawler"])

@router.post("/run", response_model=dict)
def trigger_crawl(payload: CrawlTriggerRequest, db: Session = Depends(get_db)):
    try:
        etl = ETLEngine(db)
        added_count = etl.run_crawl(query=payload.query, limit_per_source=payload.limit_per_source)
        return {"status": "success", "papers_added": added_count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/runs", response_model=List[CrawlRunResponse])
def get_crawl_runs(db: Session = Depends(get_db)):
    return db.query(CrawlRunModel).order_by(CrawlRunModel.started_at.desc()).limit(10).all()