const API_BASE = "http://127.0.0.1:8000";

export async function fetchSummaryStats() {
  const res = await fetch(`${API_BASE}/insights/summary`);
  return res.json();
}
export async function fetchPapers(query = "", author = "", topic = "", source = "", yearMin?: number, yearMax?: number, limit = 20, offset = 0) {
  const params = new URLSearchParams();
  if (query) params.append("q", query);
  if (author) params.append("author", author);
  if (topic) params.append("topic", topic);
  if (source) params.append("source", source);
  if (yearMin) params.append("year_min", yearMin.toString());
  if (yearMax) params.append("year_max", yearMax.toString());
  params.append("limit", limit.toString());
  params.append("offset", offset.toString());
  
  const res = await fetch(`${API_BASE}/papers/?${params.toString()}`);
  return res.json();
}

export async function fetchPaperDetail(id: number) {
  const res = await fetch(`${API_BASE}/papers/${id}`);
  if (!res.ok) throw new Error("Paper not found");
  return res.json();
}

export async function fetchAuthors(sortBy = "citations", query = "") {
  const params = new URLSearchParams();
  params.append("sort_by", sortBy);
  if (query) params.append("q", query);
  
  const res = await fetch(`${API_BASE}/authors/?${params.toString()}`);
  return res.json();
}

export async function fetchTopics() {
  const res = await fetch(`${API_BASE}/topics/`);
  return res.json();
}

export async function fetchPapersPerYear() {
  const res = await fetch(`${API_BASE}/insights/papers-per-year`);
  return res.json();
}

export async function triggerCrawl(query: string, limit_per_source = 10) {
  const res = await fetch(`${API_BASE}/crawl/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, limit_per_source })
  });
  return res.json();
}