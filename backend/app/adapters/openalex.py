import os
from typing import List, Dict, Any
from pyalex import Works, config
from app.adapters.base import BaseAdapter

class OpenAlexAdapter(BaseAdapter):
    def __init__(self):
        config.email = os.getenv("OPENALEX_EMAIL", "researcher@scoperta.app")
        api_key = os.getenv("OPENALEX_API_KEY")
        if api_key:
            config.api_key = api_key

    def fetch_papers(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        try:
            pager = Works().search(query).get(per_page=limit)
            results = []
            for work in pager:
                doi = work.get("doi")
                if doi:
                    doi = doi.replace("https://doi.org/", "")
                
                title = work.get("title")
                if not title:
                    continue

                abstract_index = work.get("abstract_inverted_index")
                abstract = self._reconstruct_abstract(abstract_index) if abstract_index else None
                publication_date = work.get("publication_date")
                
                authors = []
                for authorship in work.get("authorships", []):
                    author_info = authorship.get("author", {})
                    institutions = authorship.get("institutions", [])
                    inst_name = institutions[0].get("name") if institutions else None
                    inst_country = institutions[0].get("country_code") if institutions else None
                    authors.append({
                        "name": author_info.get("display_name"),
                        "openalex_id": author_info.get("id"),
                        "institution": inst_name,
                        "country": inst_country
                    })

                topics = []
                for concept in work.get("concepts", []):
                    if concept.get("score", 0) > 0.4:
                        topics.append({
                            "name": concept.get("display_name"),
                            "description": f"OpenAlex concept score: {concept.get('score')}"
                        })

                citation_count = work.get("cited_by_count", 0)

                results.append({
                    "doi": doi,
                    "title": title,
                    "abstract": abstract,
                    "publication_date": publication_date,
                    "url": work.get("id"),
                    "source_name": "OpenAlex",
                    "citation_count": citation_count,
                    "influential_citation_count": 0,
                    "authors": authors,
                    "topics": topics
                })
            return results
        except Exception as e:
            print(f"Error fetching from OpenAlex: {e}")
            return []

    def _reconstruct_abstract(self, inverted_index: dict) -> str:
        if not inverted_index:
            return ""
        try:
            word_positions = []
            for word, positions in inverted_index.items():
                for pos in positions:
                    word_positions.append((pos, word))
            word_positions.sort(key=lambda x: x[0])
            return " ".join([word for _, word in word_positions])
        except Exception:
            return ""