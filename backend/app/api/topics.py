from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import TopicModel

router = APIRouter(prefix="/topics", tags=["Topics"])

@router.get("/")
def get_topics(db: Session = Depends(get_db)):
    topics = db.query(TopicModel).all()
    result = []
    for t in topics:
        paper_count = len(t.papers) if hasattr(t, 'papers') else 0
        
        # Give friendly descriptions to arXiv category codes if generic
        desc = t.description
        if not desc or "arXiv primary category" in desc:
            name_upper = t.name.lower()
            if "cs." in name_upper:
                desc = "Computer Science research domain covering algorithms, systems, and computational theory."
            elif "stat." in name_upper:
                desc = "Statistical modeling, machine learning, and probabilistic data analysis."
            elif "physics." in name_upper:
                desc = "Experimental and theoretical physics publications and preprints."
            elif "math." in name_upper:
                desc = "Pure and applied mathematical foundations."
            else:
                desc = "Active research domain indexed across multi-source literature."

        result.append({
            "id": t.id,
            "name": t.name,
            "description": desc,
            "paper_count": paper_count
        })
    
    # Sort topics by paper count descending so most active areas appear first
    result.sort(key=lambda x: x["paper_count"], reverse=True)
    return result