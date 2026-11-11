from app.core.database import SessionLocal, engine, Base
from app.models.models import SourceModel, WatchlistItemModel

def seed_database():
    print("Dropping existing tables to sync with latest schema...")
    Base.metadata.drop_all(bind=engine)
    
    print("Creating fresh database tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Seed standard research sources
        sources = ["OpenAlex", "Semantic Scholar", "arXiv"]
        for src_name in sources:
            existing = db.query(SourceModel).filter_by(name=src_name).first()
            if not existing:
                db.add(SourceModel(name=src_name, description=f"Official adapter for {src_name} API"))
        
        # Seed initial watchlist query with required target_type
        existing_watchlist = db.query(WatchlistItemModel).filter_by(query="machine learning").first()
        if not existing_watchlist:
            db.add(WatchlistItemModel(query="machine learning", target_type="keyword", is_active=True))

        db.commit()
        print("Database schema created and seeded successfully locally.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()