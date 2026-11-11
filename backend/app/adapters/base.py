from abc import ABC, abstractmethod
from typing import List, Dict, Any

class BaseAdapter(ABC):
    @abstractmethod
    def fetch_papers(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Fetch papers from the external source based on a query."""
        pass