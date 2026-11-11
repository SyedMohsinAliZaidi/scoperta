from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Date, ForeignKey, Table, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class SourceModel(Base):
    __tablename__ = "sources"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    papers: Mapped[list["PaperModel"]] = relationship("PaperModel", back_populates="source")

class InstitutionModel(Base):
    __tablename__ = "institutions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    authors: Mapped[list["AuthorModel"]] = relationship("AuthorModel", back_populates="institution")

class AuthorModel(Base):
    __tablename__ = "authors"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    openalex_id: Mapped[str | None] = mapped_column(String(100), unique=True, nullable=True)
    institution_id: Mapped[int | None] = mapped_column(ForeignKey("institutions.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    institution: Mapped["InstitutionModel | None"] = relationship("InstitutionModel", back_populates="authors")
    papers: Mapped[list["PaperModel"]] = relationship("PaperModel", secondary="paper_authors", back_populates="authors")

class TopicModel(Base):
    __tablename__ = "topics"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    papers: Mapped[list["PaperModel"]] = relationship("PaperModel", secondary="paper_topics", back_populates="topics")

paper_authors = Table(
    "paper_authors",
    Base.metadata,
    Column("paper_id", Integer, ForeignKey("papers.id", ondelete="CASCADE"), primary_key=True),
    Column("author_id", Integer, ForeignKey("authors.id", ondelete="CASCADE"), primary_key=True)
)

paper_topics = Table(
    "paper_topics",
    Base.metadata,
    Column("paper_id", Integer, ForeignKey("papers.id", ondelete="CASCADE"), primary_key=True),
    Column("topic_id", Integer, ForeignKey("topics.id", ondelete="CASCADE"), primary_key=True)
)

class PaperModel(Base):
    __tablename__ = "papers"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    doi: Mapped[str | None] = mapped_column(String(255), unique=True, index=True, nullable=True)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    abstract: Mapped[str | None] = mapped_column(Text, nullable=True)
    publication_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    url: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_id: Mapped[int] = mapped_column(ForeignKey("sources.id"), nullable=False)
    citation_count: Mapped[int] = mapped_column(Integer, default=0)
    influential_citation_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    source: Mapped["SourceModel"] = relationship("SourceModel", back_populates="papers")
    authors: Mapped[list["AuthorModel"]] = relationship("AuthorModel", secondary=paper_authors, back_populates="papers")
    # topics: Mapped[list["TopicModel"]] = relationship("TopicModel", secondary=paper_topics, back_populates="topics")
    topics: Mapped[list["TopicModel"]] = relationship("TopicModel", secondary=paper_topics, back_populates="papers")
    summaries: Mapped[list["SummaryModel"]] = relationship("SummaryModel", back_populates="paper", cascade="all, delete-orphan")

class WatchlistModel(Base):
    __tablename__ = "watchlist_items"
    __table_args__ = {'extend_existing': True}
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    query: Mapped[str] = mapped_column(String(255), nullable=False)
    target_type: Mapped[str] = mapped_column(String(50), nullable=False)  # topic, keyword, author
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_run_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

# Alias for seed import compatibility
WatchlistItemModel = WatchlistModel

class CitationModel(Base):
    __tablename__ = "citations"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    paper_id: Mapped[int] = mapped_column(ForeignKey("papers.id", ondelete="CASCADE"), nullable=False)
    cited_paper_id: Mapped[int] = mapped_column(ForeignKey("papers.id", ondelete="CASCADE"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class CrawlRunModel(Base):
    __tablename__ = "crawl_runs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False)  # SUCCESS, FAILED, RUNNING
    papers_added: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

class SummaryModel(Base):
    __tablename__ = "summaries"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    paper_id: Mapped[int] = mapped_column(ForeignKey("papers.id", ondelete="CASCADE"), nullable=False)
    summary_text: Mapped[str] = mapped_column(Text, nullable=False)
    model_name: Mapped[str] = mapped_column(String(100), default="gemini-1.5-flash")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    paper: Mapped["PaperModel"] = relationship("PaperModel", back_populates="summaries")