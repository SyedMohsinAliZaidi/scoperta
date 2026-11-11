from datetime import datetime
from sqlalchemy.orm import Session
from app.models.models import (
    PaperModel, AuthorModel, InstitutionModel, TopicModel, 
    SourceModel, CrawlRunModel
)
from app.adapters.openalex import OpenAlexAdapter
from app.adapters.semanticscholar import SemanticScholarAdapter
from app.adapters.arxiv import ArxivAdapter

class ETLEngine:
    def __init__(self, db: Session):
        self.db = db
        self.adapters = [
            OpenAlexAdapter(),
            SemanticScholarAdapter(),
            ArxivAdapter()
        ]

    def run_crawl(self, query: str, limit_per_source: int = 10) -> int:
        crawl_run = CrawlRunModel(status="RUNNING", papers_added=0)
        self.db.add(crawl_run)
        self.db.commit()
        self.db.refresh(crawl_run)

        total_added = 0
        try:
            all_raw_papers = []
            for adapter in self.adapters:
                papers = adapter.fetch_papers(query, limit=limit_per_source)
                all_raw_papers.extend(papers)

            # Deduplication by DOI or normalized Title
            seen_keys = set()
            unique_papers = []
            for p in all_raw_papers:
                doi = p.get("doi")
                title_key = p.get("title", "").lower().strip()
                dedup_key = doi if doi else title_key
                if not dedup_key or dedup_key in seen_keys:
                    continue
                seen_keys.add(dedup_key)
                unique_papers.append(p)

            for p_data in unique_papers:
                existing = None
                if p_data.get("doi"):
                    existing = self.db.query(PaperModel).filter_by(doi=p_data["doi"]).first()
                if not existing:
                    existing = self.db.query(PaperModel).filter(PaperModel.title.ilike(p_data["title"])).first()

                if existing:
                    if p_data.get("citation_count", 0) > existing.citation_count:
                        existing.citation_count = p_data["citation_count"]
                    if p_data.get("influential_citation_count", 0) > existing.influential_citation_count:
                        existing.influential_citation_count = p_data["influential_citation_count"]
                    self.db.commit()
                    continue

                source_obj = self.db.query(SourceModel).filter_by(name=p_data["source_name"]).first()
                if not source_obj:
                    source_obj = SourceModel(name=p_data["source_name"])
                    self.db.add(source_obj)
                    self.db.commit()
                    self.db.refresh(source_obj)

                pub_date = p_data.get("publication_date")
                if isinstance(pub_date, str):
                    try:
                        pub_date = datetime.strptime(pub_date[:10], "%Y-%m-%d")
                    except Exception:
                        pub_date = None

                paper = PaperModel(
                    doi=p_data.get("doi"),
                    title=p_data.get("title"),
                    abstract=p_data.get("abstract"),
                    publication_date=pub_date,
                    url=p_data.get("url"),
                    source_id=source_obj.id,
                    citation_count=p_data.get("citation_count", 0),
                    influential_citation_count=p_data.get("influential_citation_count", 0)
                )
                self.db.add(paper)
                self.db.commit()
                self.db.refresh(paper)

                for author_data in p_data.get("authors", []):
                    a_name = author_data.get("name")
                    if not a_name:
                        continue
                    
                    institution_id = None
                    inst_name = author_data.get("institution")
                    if inst_name:
                        inst = self.db.query(InstitutionModel).filter_by(name=inst_name).first()
                        if not inst:
                            inst = InstitutionModel(name=inst_name, country=author_data.get("country"))
                            self.db.add(inst)
                            self.db.commit()
                            self.db.refresh(inst)
                        institution_id = inst.id

                    author = None
                    oa_id = author_data.get("openalex_id")
                    if oa_id:
                        author = self.db.query(AuthorModel).filter_by(openalex_id=oa_id).first()
                    if not author:
                        author = self.db.query(AuthorModel).filter_by(name=a_name).first()

                    if not author:
                        author = AuthorModel(name=a_name, openalex_id=oa_id, institution_id=institution_id)
                        self.db.add(author)
                        self.db.commit()
                        self.db.refresh(author)
                    
                    if author not in paper.authors:
                        paper.authors.append(author)

                for topic_data in p_data.get("topics", []):
                    t_name = topic_data.get("name")
                    if not t_name:
                        continue
                    topic = self.db.query(TopicModel).filter_by(name=t_name).first()
                    if not topic:
                        topic = TopicModel(name=t_name, description=topic_data.get("description"))
                        self.db.add(topic)
                        self.db.commit()
                        self.db.refresh(topic)
                    
                    if topic not in paper.topics:
                        paper.topics.append(topic)

                self.db.commit()
                total_added += 1

            crawl_run.status = "SUCCESS"
            crawl_run.papers_added = total_added
            crawl_run.finished_at = datetime.utcnow()
            self.db.commit()
            return total_added
        except Exception as e:
            self.db.rollback()
            crawl_run.status = "FAILED"
            crawl_run.error_message = str(e)
            crawl_run.finished_at = datetime.utcnow()
            self.db.commit()
            print(f"ETL Crawl failed: {e}")
            raise e