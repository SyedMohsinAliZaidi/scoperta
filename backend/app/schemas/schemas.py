from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class AuthorBase(BaseModel):
    name: str
    openalex_id: Optional[str] = None
    institution_id: Optional[int] = None

class AuthorResponse(AuthorBase):
    id: int
    class Config:
        from_attributes = True

class TopicResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    class Config:
        from_attributes = True

class SourceResponse(BaseModel):
    id: int
    name: str
    class Config:
        from_attributes = True

class PaperResponse(BaseModel):
    id: int
    doi: Optional[str] = None
    title: str
    abstract: Optional[str] = None
    publication_date: Optional[date] = None
    url: Optional[str] = None
    citation_count: int
    influential_citation_count: int
    source: Optional[SourceResponse] = None
    authors: List[AuthorResponse] = []
    topics: List[TopicResponse] = []
    class Config:
        from_attributes = True

class WatchlistCreate(BaseModel):
    query: str
    target_type: str = Field(..., description="topic, keyword, or author")
    is_active: bool = True

class WatchlistResponse(WatchlistCreate):
    id: int
    last_run_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class CrawlTriggerRequest(BaseModel):
    query: str
    limit_per_source: int = 10

class CrawlRunResponse(BaseModel):
    id: int
    started_at: datetime
    finished_at: Optional[datetime] = None
    status: str
    papers_added: int
    error_message: Optional[str] = None
    class Config:
        from_attributes = True