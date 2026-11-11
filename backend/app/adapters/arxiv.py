import requests
import xml.etree.ElementTree as ET
from typing import List, Dict, Any
from datetime import datetime
from app.adapters.base import BaseAdapter

class ArxivAdapter(BaseAdapter):
    def fetch_papers(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        formatted_query = query.replace(" ", "+")
        url = f"http://export.arxiv.org/api/query?search_query=all:{formatted_query}&start=0&max_results={limit}"
        
        try:
            headers = {"User-Agent": "ScopertaApp/1.0 (research project)"}
            response = requests.get(url, headers=headers, timeout=15)
            if response.status_code != 200:
                print(f"arXiv API error: {response.status_code}")
                return []

            xml_data = response.content
            root = ET.fromstring(xml_data)
            namespace = {"atom": "http://www.w3.org/2005/Atom", "arxiv": "http://arxiv.org/schemas/atom"}
            
            results = []
            for entry in root.findall("atom:entry", namespace):
                title_elem = entry.find("atom:title", namespace)
                title = title_elem.text.strip().replace("\n", " ") if title_elem is not None else ""
                if not title:
                    continue

                summary_elem = entry.find("atom:summary", namespace)
                abstract = summary_elem.text.strip().replace("\n", " ") if summary_elem is not None else ""

                published_elem = entry.find("atom:published", namespace)
                pub_date = None
                if published_elem is not None and published_elem.text:
                    try:
                        pub_date = datetime.strptime(published_elem.text[:10], "%Y-%m-%d")
                    except Exception:
                        pub_date = None

                id_elem = entry.find("atom:id", namespace)
                url = id_elem.text if id_elem is not None else None

                doi = None
                for link in entry.findall("atom:link", namespace):
                    if link.get("title") == "doi":
                        doi = link.get("href")

                authors = []
                for author_elem in entry.findall("atom:author", namespace):
                    name_elem = author_elem.find("atom:name", namespace)
                    if name_elem is not None and name_elem.text:
                        authors.append({
                            "name": name_elem.text.strip(),
                            "openalex_id": None,
                            "institution": None,
                            "country": None
                        })

                topics = []
                for cat in entry.findall("atom:category", namespace):
                    term = cat.get("term")
                    if term:
                        topics.append({
                            "name": term,
                            "description": "arXiv primary category"
                        })

                results.append({
                    "doi": doi,
                    "title": title,
                    "abstract": abstract,
                    "publication_date": pub_date,
                    "url": url,
                    "source_name": "arXiv",
                    "citation_count": 0,
                    "influential_citation_count": 0,
                    "authors": authors,
                    "topics": topics
                })
            return results
        except Exception as e:
            print(f"Error fetching from arXiv: {e}")
            return []