from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import PaperModel, SourceModel
from app.schemas.schemas import PaperResponse

router = APIRouter(prefix="/papers", tags=["Papers"])

@router.get("/", response_model=List[PaperResponse])
def get_papers(
    q: Optional[str] = Query(None, description="Full-text search over title or abstract"),
    author: Optional[str] = Query(None, description="Filter by author name"),
    topic: Optional[str] = Query(None, description="Filter by topic name"),
    source: Optional[str] = Query(None, description="Filter by data source name"),
    year_min: Optional[int] = Query(None, description="Minimum publication year"),
    year_max: Optional[int] = Query(None, description="Maximum publication year"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(PaperModel)

    if q:
        search_term = f"%{q}%"
        query = query.filter(
            (PaperModel.title.ilike(search_term)) | 
            (PaperModel.abstract.ilike(search_term)) |
            (PaperModel.doi.ilike(search_term))
        )

    if author:
        query = query.join(PaperModel.authors).filter(PaperModel.authors.any(name=author))

    if topic:
        query = query.join(PaperModel.topics).filter(PaperModel.topics.any(name=topic))

    if source:
        query = query.join(PaperModel.source).filter(SourceModel.name == source)

    if year_min:
        query = query.filter(db.func.extract('year', PaperModel.publication_date) >= year_min)

    if year_max:
        query = query.filter(db.func.extract('year', PaperModel.publication_date) <= year_max)

    papers = query.offset(offset).limit(limit).all()
    return papers

@router.get("/{paper_id}", response_model=PaperResponse)
def get_paper_detail(paper_id: int, db: Session = Depends(get_db)):
    paper = db.query(PaperModel).filter_by(id=paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    return paper