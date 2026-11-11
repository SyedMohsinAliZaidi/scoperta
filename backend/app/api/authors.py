from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import AuthorModel

router = APIRouter(prefix="/authors", tags=["Authors"])

@router.get("/")
def get_authors(
    q: Optional[str] = Query(None, description="Search authors by name"),
    sort_by: str = Query("citations", description="Sort by 'citations' or 'papers'"),
    db: Session = Depends(get_db)
):
    query = db.query(AuthorModel)
    if q:
        query = query.filter(AuthorModel.name.ilike(f"%{q}%"))
    
    authors = query.all()
    result = []
    for author in authors:
        paper_count = len(author.papers) if hasattr(author, 'papers') else 0
        total_citations = sum([p.citation_count for p in author.papers]) if hasattr(author, 'papers') else 0
        
        # Calculate citation rating tier / stars
        if total_citations >= 500:
            rating = "Elite Scholar (5⭐)"
        elif total_citations >= 100:
            rating = "Highly Cited (4⭐)"
        elif total_citations >= 20:
            rating = "Active Researcher (3⭐)"
        else:
            rating = "Contributor (2⭐)"

        result.append({
            "id": author.id,
            "name": author.name,
            "openalex_id": author.openalex_id,
            "paper_count": paper_count,
            "citation_count": total_citations,
            "rating": rating
        })
    
    # Sort according to requested metric (default: highest citations first)
    if sort_by == "papers":
        result.sort(key=lambda x: x["paper_count"], reverse=True)
    else:
        result.sort(key=lambda x: x["citation_count"], reverse=True)
        
    return result