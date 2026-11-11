from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import papers, authors, topics, insights, watchlist, crawl

app = FastAPI(
    title="SCOPERTA Research Intelligence API",
    version="1.0.0",
    description="Backend API for crawling, managing, and analyzing research publications."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(papers.router)
app.include_router(authors.router)
app.include_router(topics.router)
app.include_router(insights.router)
app.include_router(watchlist.router)
app.include_router(crawl.router)

@app.get("/")
def root():
    return {"message": "Welcome to SCOPERTA API. Visit /docs for interactive Swagger documentation."}