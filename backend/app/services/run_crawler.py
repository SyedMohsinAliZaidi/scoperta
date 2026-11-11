from app.core.database import SessionLocal
from app.services.etl import ETLEngine

def test_crawl():
    db = SessionLocal()
    etl = ETLEngine(db)
    print("Starting test crawl for query: 'machine learning'...")
    added = etl.run_crawl(query="machine learning", limit_per_source=3)
    print(f"Crawl completed successfully! Added {added} new unique papers to local PostgreSQL.")
    db.close()

if __name__ == "__main__":
    test_crawl()