import os
import requests
from typing import List, Dict, Any
from app.adapters.base import BaseAdapter

class SemanticScholarAdapter(BaseAdapter):
    def __init__(self):
        self.api_key = os.getenv("SEMANTIC_SCHOLAR_API_KEY")
        self.base_url = "https://api.semanticscholar.org/graph/v1/paper/search"

    def fetch_papers(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        headers = {}
        if self.api_key:
            headers["x-api-key"] = self.api_key

        params = {
            "query": query,
            "limit": limit,
            "fields": "paperId,externalIds,title,abstract,publicationDate,url,citationCount,influentialCitationCount,tldr,authors,fieldsOfStudy"
        }

        try:
            response = requests.get(self.base_url, headers=headers, params=params, timeout=15)
            if response.status_code == 429:
                print("Semantic Scholar rate limit reached (429). Skipping S2 for this run (OpenAlex & arXiv will still supply papers).")
                return []
            if response.status_code != 200:
                print(f"Semantic Scholar API error: {response.status_code} - {response.text}")
                return []

            data = response.json().get("data", [])
            results = []
            for paper in data:
                external_ids = paper.get("externalIds", {}) or {}
                doi = external_ids.get("DOI")
                title = paper.get("title")
                if not title:
                    continue

                abstract = paper.get("abstract")
                tldr_obj = paper.get("tldr")
                if tldr_obj and tldr_obj.get("text"):
                    abstract = f"TLDR: {tldr_obj.get('text')}\n\n{abstract}" if abstract else f"TLDR: {tldr_obj.get('text')}"

                authors = []
                for author in paper.get("authors", []):
                    authors.append({
                        "name": author.get("name"),
                        "openalex_id": None,
                        "institution": None,
                        "country": None
                    })

                topics = []
                for field in paper.get("fieldsOfStudy", []) or []:
                    if field:
                        topics.append({
                            "name": field,
                            "description": "Semantic Scholar field of study"
                        })

                results.append({
                    "doi": doi,
                    "title": title,
                    "abstract": abstract,
                    "publication_date": paper.get("publicationDate"),
                    "url": paper.get("url"),
                    "source_name": "Semantic Scholar",
                    "citation_count": paper.get("citationCount", 0),
                    "influential_citation_count": paper.get("influentialCitationCount", 0),
                    "authors": authors,
                    "topics": topics
                })
            return results
        except Exception as e:
            print(f"Error fetching from Semantic Scholar: {e}")
            return []