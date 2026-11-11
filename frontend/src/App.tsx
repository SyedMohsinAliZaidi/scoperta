import React, { useState, useEffect } from 'react';
import { 
  Compass, BookOpen, Users, Tag, BarChart3, Bot, Bookmark, 
  Search, ExternalLink, RefreshCw, Layers, Sparkles, ArrowRight, ShieldCheck 
} from 'lucide-react';
import logoSvg from './assets/logo.svg';
import { 
  fetchSummaryStats, fetchPapers, fetchPaperDetail, 
  fetchAuthors, fetchTopics, fetchPapersPerYear, triggerCrawl 
} from './services/api';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'overview' | 'discover' | 'publications' | 'authors' | 'topics' | 'insights' | 'assistant' | 'library'>('overview');
  
  // Stats & Data state
  const [stats, setStats] = useState({ total_papers: 0, total_authors: 0, total_topics: 0, total_sources: 0 });
  const [papers, setPapers] = useState<any[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<any | null>(null);
  const [authorSort, setAuthorSort] = useState('citations');
  const [authorSearchQuery, setAuthorSearchQuery] = useState('');
  const pageSize = 12; // Number of papers per page
  const [page, setPage] = useState(1);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState('');
  const [yearMin, setYearMin] = useState<number | undefined>(undefined);
  
  // Library state (localStorage backed)
  const [libraryIds, setLibraryIds] = useState<number[]>(() => {
    const saved = localStorage.getItem('scoperta_library');
    return saved ? JSON.parse(saved) : [];
  });

  // Crawler trigger state
  const [crawlQuery, setCrawlQuery] = useState('');
  const [crawlStatus, setCrawlStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

async function loadInitialData() {
    try {
      setLoading(true);
      const results = await Promise.allSettled([
        fetchSummaryStats(),
        fetchPapers(),
        fetchAuthors(),
        fetchTopics(),
        fetchPapersPerYear()
      ]);

      if (results[0].status === 'fulfilled') setStats(results[0].value);
      if (results[1].status === 'fulfilled') setPapers(results[1].value);
      if (results[2].status === 'fulfilled') setAuthors(results[2].value);
      if (results[3].status === 'fulfilled') setTopics(results[3].value);
      if (results[4].status === 'fulfilled') setChartData(results[4].value);
    } catch (err) {
      console.error("Failed to load backend data", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetchPapers(searchQuery, '', '', selectedSource, yearMin);
      setPapers(res);
      setCurrentTab('publications');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCrawl(e: React.FormEvent) {
    e.preventDefault();
    if (!crawlQuery) return;
    setCrawlStatus("Crawling external databases (OpenAlex, arXiv)...");
    try {
      const res = await triggerCrawl(crawlQuery);
      setCrawlStatus(`Success! Added ${res.papers_added} new unique papers.`);
      loadInitialData();
    } catch (err) {
      setCrawlStatus("Crawl failed. Ensure FastAPI backend is running.");
    }
  }

  async function handleSourceChange(newSource: string) {
    setSelectedSource(newSource);
    setLoading(true);
    try {
      const res = await fetchPapers(searchQuery, '', '', newSource, yearMin);
      setPapers(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadPapersForPage(newPage: number, src = selectedSource) {
    setLoading(true);
    try {
      const offset = (newPage - 1) * pageSize;
      const res = await fetchPapers(searchQuery, '', '', src, yearMin, undefined, pageSize, offset);
      setPapers(res);
      setPage(newPage);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }
  async function handleExploreTopic(topicName: string) {
    setLoading(true);
    try {
      const res = await fetchPapers("", "", topicName, selectedSource, yearMin);
      setPapers(res);
      setCurrentTab('publications');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }
  async function handleExploreAuthor(authorName: string) {
    setLoading(true);
    try {
      const res = await fetchPapers("", authorName, "", selectedSource, yearMin);
      setPapers(res);
      setCurrentTab('publications');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }
  async function handleAuthorSortChange(newSort: string) {
    setAuthorSort(newSort);
    try {
      const res = await fetchAuthors(newSort);
      setAuthors(res);
    } catch (err) {
      console.error(err);
    }
  }
  async function handleAuthorSearch(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetchAuthors(authorSort, authorSearchQuery);
      setAuthors(res);
    } catch (err) {
      console.error(err);
    }
  }
  function toggleLibrary(paperId: number) {
    let updated;
    if (libraryIds.includes(paperId)) {
      updated = libraryIds.filter(id => id !== paperId);
    } else {
      updated = [...libraryIds, paperId];
    }
    setLibraryIds(updated);
    localStorage.setItem('scoperta_library', JSON.stringify(updated));
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F8FC] text-[#101D32]">
      {/* Top Navbar */}
      <header className="bg-white border-b border-[#E2EAF2] sticky top-0 z-30 px-6 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-8 cursor-pointer" onClick={() => setCurrentTab('overview')}>
          <img src={logoSvg} alt="SCOPERTA Logo" className="h-8" />
          <span className="text-xs uppercase tracking-widest font-semibold px-2 py-1 bg-[#16B8A6]/10 text-[#16B8A6] rounded-md">
            Research Intelligence
          </span>
        </div>

        {/* Global Quick Search */}
        <form onSubmit={handleSearch} className="relative w-96 hidden md:block">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search titles, abstracts, DOIs..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#F5F8FC] border border-[#E2EAF2] rounded-lg text-sm focus:outline-none focus:border-[#16B8A6]"
          />
        </form>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setCurrentTab('library')}
            className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg border border-[#E2EAF2] hover:bg-slate-50 transition"
          >
            <Bookmark className="h-4 w-4 text-[#16B8A6]" />
            <span>Library ({libraryIds.length})</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-[#E2EAF2] p-4 hidden lg:flex flex-col gap-1 sticky top-[61px] h-[calc(100vh-61px)]">
          <NavItem icon={<Compass />} label="Overview" active={currentTab === 'overview'} onClick={() => setCurrentTab('overview')} />
          <NavItem icon={<Search />} label="Discover & Crawl" active={currentTab === 'discover'} onClick={() => setCurrentTab('discover')} />
          <NavItem icon={<BookOpen />} label="Publications" active={currentTab === 'publications'} onClick={() => setCurrentTab('publications')} />
          <NavItem icon={<Users />} label="Authors" active={currentTab === 'authors'} onClick={() => setCurrentTab('authors')} />
          <NavItem icon={<Tag />} label="Topics" active={currentTab === 'topics'} onClick={() => setCurrentTab('topics')} />
          <NavItem icon={<BarChart3 />} label="Analytics & Insights" active={currentTab === 'insights'} onClick={() => setCurrentTab('insights')} />
          <NavItem icon={<Bot />} label="AI Assistant" active={currentTab === 'assistant'} onClick={() => setCurrentTab('assistant')} />
          <NavItem icon={<Bookmark />} label="My Library" active={currentTab === 'library'} onClick={() => setCurrentTab('library')} />
          
          <div className="mt-auto p-3 bg-[#101D32] text-white rounded-xl text-xs flex flex-col gap-2">
            <div className="flex items-center gap-2 font-bold text-[#16B8A6]">
              <ShieldCheck className="h-4 w-4" /> Local Engine Active
            </div>
            <p className="text-slate-300">PostgreSQL running on localhost:5432 with 0 cloud latency.</p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto overflow-y-auto">
          
          {/* OVERVIEW TAB */}
          {currentTab === 'overview' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-[#101D32] to-[#26364B] text-white p-8 rounded-2xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <h1 className="text-3xl font-bold font-heading mb-2">Discover Beyond the Known.</h1>
                  <p className="text-slate-300 max-w-xl text-sm leading-relaxed">
                    SCOPERTA indexes, normalizes, and analyzes scholarly publications across OpenAlex, Semantic Scholar, and arXiv into a unified local PostgreSQL intelligence engine.
                  </p>
                </div>
                <button 
                  onClick={() => setCurrentTab('discover')}
                  className="bg-[#16B8A6] text-white font-semibold px-5 py-3 rounded-xl flex items-center gap-2 hover:bg-[#139a8c] transition shadow-md"
                >
                  <Sparkles className="h-5 w-5" /> Start Exploring
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Publications" value={stats.total_papers} icon={<BookOpen className="text-[#16B8A6]" />} />
                <StatCard title="Indexed Authors" value={stats.total_authors} icon={<Users className="text-[#16B8A6]" />} />
                <StatCard title="Research Topics" value={stats.total_topics} icon={<Tag className="text-[#16B8A6]" />} />
                <StatCard title="Data Sources" value={stats.total_sources} icon={<Layers className="text-[#16B8A6]" />} />
              </div>

              {/* Recent Papers Section */}
              <div className="bg-white border border-[#E2EAF2] rounded-2xl p-6 shadow-xs">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold font-heading">Recent Publications</h2>
                  <button onClick={() => setCurrentTab('publications')} className="text-sm font-semibold text-[#16B8A6] flex items-center gap-1 hover:underline">
                    View all <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
                {loading ? (
                  <p className="text-sm text-slate-500 py-8 text-center">Loading papers from local database...</p>
                ) : papers.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <p>No papers found in database.</p>
                    <button onClick={() => setCurrentTab('discover')} className="mt-2 text-sm text-[#16B8A6] font-semibold underline">Run a crawler ingestion</button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {papers.slice(0, 5).map(paper => (
                      <PaperCard 
                        key={paper.id} 
                        paper={paper} 
                        onSelect={() => setSelectedPaper(paper)}
                        isSaved={libraryIds.includes(paper.id)}
                        onToggleSave={() => toggleLibrary(paper.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DISCOVER & CRAWL TAB */}
          {currentTab === 'discover' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="bg-white border border-[#E2EAF2] rounded-2xl p-6 shadow-xs">
                <h2 className="text-xl font-bold font-heading mb-2">Live ETL Crawler & Ingestion</h2>
                <p className="text-sm text-slate-500 mb-6">
                  Trigger a live crawl query across OpenAlex, Semantic Scholar, and arXiv. New papers will be normalized, deduplicated, and stored instantly in your local PostgreSQL database.
                </p>
                <form onSubmit={handleCrawl} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Research Query / Topic</label>
                    <input 
                      type="text" 
                      placeholder="e.g. quantum computing, transformer models, CRISPR..." 
                      value={crawlQuery}
                      onChange={(e) => setCrawlQuery(e.target.value)}
                      className="w-full px-4 py-3 bg-[#F5F8FC] border border-[#E2EAF2] rounded-xl text-sm focus:outline-none focus:border-[#16B8A6]"
                      required
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="w-full bg-[#101D32] text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-[#1b2f4e] transition"
                  >
                    <RefreshCw className="h-4 w-4" /> Run ETL Pipeline
                  </button>
                </form>
                {crawlStatus && (
                  <div className="mt-4 p-4 bg-[#16B8A6]/10 border border-[#16B8A6]/30 rounded-xl text-sm text-[#101D32] font-medium">
                    {crawlStatus}
                  </div>
                )}
              </div>
            </div>
          )}

         {/* PUBLICATIONS TAB */}
          {currentTab === 'publications' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold font-heading">Publications Library</h1>
                  <p className="text-sm text-slate-500">Showing indexed scholarly articles from your local database.</p>
                </div>
                <div className="flex gap-2">
                  <select 
                    value={selectedSource}
                    onChange={(e) => { 
                      setSelectedSource(e.target.value); 
                      loadPapersForPage(1, e.target.value);
                    }}
                    className="px-3 py-2 bg-white border border-[#E2EAF2] rounded-lg text-sm"
                  >
                    <option value="">All Sources</option>
                    <option value="OpenAlex">OpenAlex</option>
                    <option value="Semantic Scholar">Semantic Scholar</option>
                    <option value="arXiv">arXiv</option>
                  </select>
                </div>
              </div>

              {/* Responsive Grid Layout */}
              {papers.length === 0 ? (
                <div className="bg-white border border-[#E2EAF2] rounded-2xl p-12 text-center text-slate-500">
                  No publications match your current filters.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {papers.map(paper => (
                    <PaperCard 
                      key={paper.id} 
                      paper={paper} 
                      onSelect={() => setSelectedPaper(paper)}
                      isSaved={libraryIds.includes(paper.id)}
                      onToggleSave={() => toggleLibrary(paper.id)}
                    />
                  ))}
                </div>
              )}

              {/* Pagination Controls */}
              <div className="flex items-center justify-between pt-6 border-t border-[#E2EAF2]">
                <button 
                  onClick={() => loadPapersForPage(Math.max(page - 1, 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white border border-[#E2EAF2] rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-slate-50 transition"
                >
                  Previous
                </button>
                <span className="text-sm font-medium text-slate-600">
                  Page {page}
                </span>
                <button 
                  onClick={() => loadPapersForPage(page + 1)}
                  disabled={papers.length < pageSize}
                  className="px-4 py-2 bg-white border border-[#E2EAF2] rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-slate-50 transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}

         {/* AUTHORS TAB */}
          {currentTab === 'authors' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold font-heading">Indexed Researchers & Authors</h1>
                  <p className="text-sm text-slate-500">Ranked by citation impact and scholarly contribution.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  {/* Author Search Bar */}
                  <form onSubmit={handleAuthorSearch} className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search author name..." 
                      value={authorSearchQuery}
                      onChange={(e) => {
                        setAuthorSearchQuery(e.target.value);
                        // Auto-fetch as user types
                        fetchAuthors(authorSort, e.target.value).then(setAuthors);
                      }}
                      className="w-full pl-9 pr-4 py-2 bg-white border border-[#E2EAF2] rounded-lg text-sm focus:outline-none focus:border-[#16B8A6]"
                    />
                  </form>
                  <select 
                    value={authorSort}
                    onChange={(e) => {
                      setAuthorSort(e.target.value);
                      fetchAuthors(e.target.value, authorSearchQuery).then(setAuthors);
                    }}
                    className="px-3 py-2 bg-white border border-[#E2EAF2] rounded-lg text-sm"
                  >
                    <option value="citations">Sort by: Highest Citations</option>
                    <option value="papers">Sort by: Most Papers</option>
                  </select>
                </div>
              </div>

              {authors.length === 0 ? (
                <div className="bg-white border border-[#E2EAF2] rounded-2xl p-12 text-center text-slate-500">
                  No authors match your search query.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {authors.map(author => (
                    <div key={author.id} className="bg-white border border-[#E2EAF2] p-6 rounded-2xl shadow-xs hover:border-[#16B8A6] transition flex flex-col justify-between gap-4">
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-[#16B8A6]/10 text-[#16B8A6] font-bold flex items-center justify-center text-lg font-heading">
                              {author.name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-bold text-base text-[#101D32] font-heading">{author.name}</h3>
                              <p className="text-xs text-slate-500">OpenAlex ID: {author.openalex_id ? author.openalex_id.split('/').pop() : 'N/A'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Citation Rating Badge */}
                        <div className="mb-3 px-3 py-1.5 bg-[#16B8A6]/10 text-[#16B8A6] text-xs font-semibold rounded-lg inline-block">
                          ⭐ {author.rating}
                        </div>

                        <div className="grid grid-cols-2 gap-2 p-3 bg-[#F5F8FC] rounded-xl text-xs">
                          <div>
                            <span className="text-slate-400 block">Citations</span>
                            <span className="font-bold text-[#101D32] text-sm">{author.citation_count || 0}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Publications</span>
                            <span className="font-bold text-[#101D32] text-sm">{author.paper_count || 0}</span>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleExploreAuthor(author.name)}
                        className="w-full py-2 px-3 bg-[#101D32] hover:bg-[#16B8A6] text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1 shadow-xs"
                      >
                        View Author Papers →
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TOPICS TAB */}
          {/* TOPICS TAB */}
          {currentTab === 'topics' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold font-heading">Research Topics & Domains</h1>
                <p className="text-sm text-slate-500">Explore literature categorized by active scholarly domains and keywords.</p>
              </div>

              {topics.length === 0 ? (
                <div className="bg-white border border-[#E2EAF2] rounded-2xl p-12 text-center text-slate-500">
                  No topics indexed yet. Run a crawler query in <span className="text-[#16B8A6] font-semibold">Discover & Crawl</span> to extract research areas.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {topics.map(topic => (
                    <div key={topic.id} className="bg-white border border-[#E2EAF2] p-6 rounded-2xl shadow-xs hover:border-[#16B8A6] transition flex flex-col justify-between gap-4">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-lg text-[#101D32] font-heading">{topic.name}</h3>
                          <span className="text-xs font-semibold px-2.5 py-1 bg-[#16B8A6]/10 text-[#16B8A6] rounded-full">
                            {topic.paper_count} papers
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {topic.description}
                        </p>
                      </div>
                      <button 
                        onClick={() => handleExploreTopic(topic.name)}
                        className="w-full mt-2 py-2 px-3 bg-[#F5F8FC] hover:bg-[#16B8A6] hover:text-white text-[#101D32] rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1"
                      >
                        Explore Topic Papers →
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

         {/* INSIGHTS TAB */}
          {currentTab === 'insights' && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold font-heading">Analytics & Data Science Insights</h1>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-[#E2EAF2] p-6 rounded-2xl shadow-xs">
                  <h3 className="font-bold text-base mb-4">Publications per Year</h3>
                  {chartData.length === 0 ? (
                    <p className="text-sm text-slate-500 py-8 text-center">No publication year data available yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {chartData.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4">
                          <span className="w-12 text-xs font-bold text-slate-600">{item.year}</span>
                          <div className="flex-1 bg-slate-100 h-4 rounded-full overflow-hidden">
                            <div className="bg-[#16B8A6] h-full" style={{ width: `${Math.min(item.count * 10, 100)}%` }}></div>
                          </div>
                          <span className="w-8 text-xs text-right text-slate-500">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="bg-white border border-[#E2EAF2] p-6 rounded-2xl shadow-xs flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-base mb-2">Academic Dataset Summary</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      All records are fully indexed and normalized in local PostgreSQL. University coursework pipelines and analytics notebooks can directly query these tables (`papers`, `authors`, `topics`, `citations`).
                    </p>
                  </div>
                  <div className="p-4 bg-[#F5F8FC] rounded-xl font-mono text-xs text-slate-700">
                    SELECT COUNT(*), source_id FROM papers GROUP BY source_id;
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI ASSISTANT TAB */}
          {currentTab === 'assistant' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="bg-white border border-[#E2EAF2] rounded-2xl p-6 shadow-xs">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-[#16B8A6]/10 text-[#16B8A6] rounded-xl"><Bot className="h-6 w-6" /></div>
                  <div>
                    <h2 className="text-lg font-bold font-heading">SCOPERTA AI Research Assistant</h2>
                    <p className="text-xs text-slate-500">Ask questions about your ingested literature graph.</p>
                  </div>
                </div>
                <div className="h-96 bg-[#F5F8FC] rounded-xl p-4 border border-[#E2EAF2] flex flex-col justify-between">
                  <div className="space-y-3 text-sm">
                    <div className="p-3 bg-white rounded-xl shadow-xs max-w-md">
                      Hello! I am ready to help you analyze papers, synthesize abstracts, or formulate literature reviews from your local PostgreSQL database.
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <input type="text" placeholder="Ask about papers, authors, or research trends..." className="flex-1 px-4 py-2 bg-white border border-[#E2EAF2] rounded-lg text-sm focus:outline-none focus:border-[#16B8A6]" />
                    <button className="bg-[#101D32] text-white px-4 py-2 rounded-lg text-sm font-semibold">Send</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MY LIBRARY TAB */}
          {currentTab === 'library' && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold font-heading">My Saved Library</h1>
              <p className="text-sm text-slate-500">Papers bookmarked for your research review.</p>
              <div className="space-y-4">
                {libraryIds.length === 0 ? (
                  <div className="bg-white border border-[#E2EAF2] rounded-2xl p-12 text-center text-slate-500">
                    Your library is empty. Click the bookmark icon on any paper to save it here.
                  </div>
                ) : (
                  papers.filter(p => libraryIds.includes(p.id)).map(paper => (
                    <PaperCard 
                      key={paper.id} 
                      paper={paper} 
                      onSelect={() => setSelectedPaper(paper)}
                      isSaved={true}
                      onToggleSave={() => toggleLibrary(paper.id)}
                    />
                  ))
                )}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* PAPER DETAIL MODAL */}
      {selectedPaper && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-semibold px-2 py-1 bg-[#16B8A6]/10 text-[#16B8A6] rounded-md">
                {selectedPaper.source?.name || 'Scholarly Source'}
              </span>
              <button onClick={() => setSelectedPaper(null)} className="text-slate-400 hover:text-slate-700 font-bold text-lg">✕</button>
            </div>
            <h2 className="text-xl font-bold font-heading mb-3">{selectedPaper.title}</h2>
            <div className="flex flex-wrap gap-2 mb-4 text-xs text-slate-500">
              <span>📅 {selectedPaper.publication_date || 'Date N/A'}</span>
              <span>•</span>
              <span>⭐ {selectedPaper.citation_count} Citations</span>
              <span>•</span>
              <span>🔥 {selectedPaper.influential_citation_count} Influential</span>
            </div>
            <div className="mb-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Authors</h4>
              <p className="text-sm text-slate-700">{selectedPaper.authors?.map((a: any) => a.name).join(', ') || 'Authors not specified'}</p>
            </div>
            <div className="mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Abstract</h4>
              <p className="text-sm text-slate-600 leading-relaxed bg-[#F5F8FC] p-4 rounded-xl border border-[#E2EAF2]">
                {selectedPaper.abstract || 'No abstract available for this publication.'}
              </p>
            </div>
            {selectedPaper.url && (
              <a 
                href={selectedPaper.url} 
                target="_blank" 
                rel="noreferrer" 
                className="inline-flex items-center gap-2 bg-[#101D32] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#1b2f4e] transition"
              >
                View Original Source <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition ${
        active ? 'bg-[#101D32] text-white' : 'text-slate-600 hover:bg-[#F5F8FC]'
      }`}
    >
      <span className={active ? 'text-[#16B8A6]' : 'text-slate-400'}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function StatCard({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#E2EAF2] p-5 rounded-2xl shadow-xs flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-bold font-heading mt-1">{value}</h3>
      </div>
      <div className="p-3 bg-[#16B8A6]/10 rounded-xl">{icon}</div>
    </div>
  );
}

function PaperCard({ paper, onSelect, isSaved, onToggleSave }: { paper: any, onSelect: () => void, isSaved: boolean, onToggleSave: () => void }) {
  return (
    <div className="bg-white border border-[#E2EAF2] p-5 rounded-2xl shadow-xs hover:border-[#16B8A6] transition flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2 py-0.5 bg-[#16B8A6]/10 text-[#16B8A6] rounded">
            {paper.source?.name || 'Source'}
          </span>
          <span className="text-xs text-slate-400">{paper.publication_date || 'Year N/A'}</span>
        </div>
        <button 
          onClick={onToggleSave} 
          className={`p-1.5 rounded-lg border transition ${isSaved ? 'bg-[#16B8A6] text-white border-[#16B8A6]' : 'border-[#E2EAF2] text-slate-400 hover:text-slate-700'}`}
        >
          <Bookmark className="h-4 w-4" />
        </button>
      </div>

      <h3 onClick={onSelect} className="font-bold text-base cursor-pointer hover:text-[#16B8A6] transition line-clamp-2">
        {paper.title}
      </h3>

      <p className="text-xs text-slate-500 line-clamp-2">
        {paper.abstract || 'No abstract preview available.'}
      </p>

      <div className="flex items-center justify-between pt-2 border-t border-[#E2EAF2] text-xs text-slate-500">
        <span className="truncate max-w-[250px]">
          By {paper.authors?.map((a: any) => a.name).join(', ') || 'Unknown Author'}
        </span>
        <button onClick={onSelect} className="font-semibold text-[#16B8A6] hover:underline flex items-center gap-1">
          Read Details <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}