from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import PaperModel, AuthorModel, TopicModel, SourceModel

router = APIRouter(prefix="/insights", tags=["Insights"])

@router.get("/summary")
def get_summary_stats(db: Session = Depends(get_db)):
    total_papers = db.query(PaperModel).count()
    total_authors = db.query(AuthorModel).count()
    total_topics = db.query(TopicModel).count()
    total_sources = db.query(SourceModel).count()
    
    return {
        "total_papers": total_papers,
        "total_authors": total_authors,
        "total_topics": total_topics,
        "total_sources": total_sources
    }

@router.get("/papers-per-year")
def get_papers_per_year(db: Session = Depends(get_db)):
    try:
        papers = db.query(PaperModel).all()
        year_counts = {}
        for p in papers:
            if p.publication_date:
                # Extract 4-digit year string regardless of whether it's a date object or string
                year_str = str(p.publication_date)[:4]
                if year_str.isdigit():
                    yr = int(year_str)
                    year_counts[yr] = year_counts.get(yr, 0) + 1
        
        sorted_years = sorted(year_counts.keys(), reverse=True)
        return [{"year": yr, "count": year_counts[yr]} for yr in sorted_years]
    except Exception as e:
        print(f"Error computing papers per year: {e}")
        return []