import { BrowserRouter, Routes, Route, Link, useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import type { ReactNode } from "react";

// Layout Component
function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="text-xl font-bold text-indigo-600">
                  Auction Scraper
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Home
                </Link>
                <Link
                  to="/scraping"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Scraping
                </Link>
                <Link
                  to="/auctions"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Auctions
                </Link>
                <Link
                  to="/categories"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Categories
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}

// Home Page
function HomePage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch("/api/getStats")
      .then((res) => res.json())
      .then(setStats)
      .catch(console.error);
  }, []);

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Auction Scraper
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Monitor auctions for computer hardware and server equipment using AI-powered filtering
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-indigo-600">{stats?.scraperCount || 0}</div>
            <div className="text-gray-600 mt-1">Scrapers</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-indigo-600">{stats?.auctionCount || 0}</div>
            <div className="text-gray-600 mt-1">Auctions</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-indigo-600">{stats?.itemCount || 0}</div>
            <div className="text-gray-600 mt-1">Items</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-indigo-600">
              {stats?.avgProbability ? `${(stats.avgProbability * 100).toFixed(1)}%` : "0%"}
            </div>
            <div className="text-gray-600 mt-1">Avg. Probability</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/scraping"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200"
          >
            <div className="text-2xl mb-2">🔗</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Manage Scrapers
            </h2>
            <p className="text-gray-600">
              Configure and manage predefined scrapers from config.toml
            </p>
          </Link>
          <Link
            to="/auctions"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200"
          >
            <div className="text-2xl mb-2">🔨</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              View Auctions
            </h2>
            <p className="text-gray-600">
              Browse all scraped auctions with advanced filters
            </p>
          </Link>
          <Link
            to="/auctions?sortBy=probability&sortOrder=desc"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200"
          >
            <div className="text-2xl mb-2">⭐</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              High Probability
            </h2>
            <p className="text-gray-600">
              View auctions most likely to contain hardware
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Scraping Page
function ScrapingPage() {
  const [scrapers, setScrapers] = useState<any[]>([]);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapingId, setScrapingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchScrapers();
  }, []);

  const fetchScrapers = () => {
    fetch("/api/getScrapers")
      .then((res) => res.json())
      .then(setScrapers)
      .catch(console.error);
  };

  const handleScrapeAll = async () => {
    setIsScraping(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/triggerScrape", {
        method: "POST",
      });
      const results = await response.json();

      let totalFound = 0;
      let totalCreated = 0;
      let hasErrors = false;

      for (const result of results) {
        if (result.success) {
          totalFound += result.auctionsFound;
          totalCreated += result.auctionsCreated;
        } else {
          hasErrors = true;
        }
      }

      if (hasErrors) {
        setError(`Scraping completed with some errors. Found ${totalFound} auctions, created ${totalCreated} new.`);
      } else {
        setSuccess(`Scraping complete! Found ${totalFound} auctions, created ${totalCreated} new.`);
      }
      fetchScrapers();
    } catch (err) {
      setError("Failed to trigger scraping");
    } finally {
      setIsScraping(false);
    }
  };

  const handleScrapeScraper = async (scraperId: string) => {
    setScrapingId(scraperId);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/scrapeScraper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scraperId }),
      });
      const result = await response.json();

      if (result.success) {
        setSuccess(`Found ${result.auctionsFound} auctions, created ${result.auctionsCreated} new.`);
        fetchScrapers();
      } else {
        setError(result.error || "Failed to scrape");
      }
    } catch (err) {
      setError("Failed to scrape scraper");
    } finally {
      setScrapingId(null);
    }
  };

  const handleToggleScraper = async (scraperId: string, enabled: boolean) => {
    try {
      const response = await fetch(enabled ? "/api/disableScraper" : "/api/enableScraper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scraperId }),
      });
      const result = await response.json();

      if (result.success) {
        setSuccess(`Scraper ${enabled ? "disabled" : "enabled"} successfully!`);
        fetchScrapers();
      } else {
        setError(result.error || "Failed to update scraper");
      }
    } catch (err) {
      setError("Failed to update scraper");
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Scraper Management</h1>
        <button
          onClick={handleScrapeAll}
          disabled={isScraping}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {isScraping ? "Scraping..." : "Scrape All Enabled"}
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {/* Scrapers List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Predefined Scrapers ({scrapers.length})
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Scraper configuration is managed via the config.toml file. Enable/disable scrapers and trigger manual scrapes.
          </p>
        </div>
        <ul className="divide-y divide-gray-200">
          {scrapers.length === 0 ? (
            <li className="px-6 py-8 text-center text-gray-500">
              No scrapers configured. Add scrapers to your config.toml file.
            </li>
          ) : (
            scrapers.map((scraper) => (
              <li key={scraper.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {scraper.imageUrl ? (
                    <img src={scraper.imageUrl} alt="" className="w-8 h-8" />
                  ) : (
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-500 text-sm">
                        {scraper.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-gray-900">{scraper.name}</div>
                    <div className="text-sm text-gray-500 truncate max-w-md">
                      {scraper.url}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {scraper._count?.auctions || 0} auctions
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <span className={`px-2 py-1 text-xs rounded-full ${scraper.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {scraper.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <button
                    onClick={() => handleScrapeScraper(scraper.id)}
                    disabled={!scraper.enabled || scrapingId === scraper.id}
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium disabled:opacity-50"
                  >
                    {scrapingId === scraper.id ? "Scraping..." : "Scrape Now"}
                  </button>
                  <button
                    onClick={() => handleToggleScraper(scraper.id, scraper.enabled)}
                    className={`text-sm font-medium ${scraper.enabled ? 'text-orange-600 hover:text-orange-800' : 'text-green-600 hover:text-green-800'}`}
                  >
                    {scraper.enabled ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

// Auctions Page
function AuctionsPage() {
  const [auctions, setAuctions] = useState<any[]>([]);
  const [scrapers, setScrapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [scraperId, setScraperId] = useState("all");
  const [minProbability, setMinProbability] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    fetchData();
  }, [scraperId, minProbability, search, sortBy, sortOrder]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (scraperId !== "all") params.set("scraperId", scraperId);
      if (minProbability) params.set("minProbability", minProbability);
      if (search) params.set("search", search);
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);

      const [auctionsRes, scrapersRes] = await Promise.all([
        fetch(`/api/getAuctions?${params}`),
        fetch("/api/getScrapers"),
      ]);

      const auctionsData = await auctionsRes.json();
      const scrapersData = await scrapersRes.json();

      setAuctions(auctionsData);
      setScrapers(scrapersData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getProbabilityColor = (probability: number | null) => {
    if (probability === null || probability === undefined) return "bg-gray-100 text-gray-800";
    if (probability >= 0.7) return "bg-green-100 text-green-800";
    if (probability >= 0.4) return "bg-yellow-100 text-yellow-800";
    return "bg-gray-100 text-gray-800";
  };

  const formatProbability = (probability: number | null) => {
    if (probability === null || probability === undefined) return "not yet estimated";
    return `${(probability * 100).toFixed(0)}%`;
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Auctions</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search titles..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Scraper</label>
            <select
              value={scraperId}
              onChange={(e) => setScraperId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Scrapers</option>
              {scrapers.map((scraper) => (
                <option key={scraper.id} value={scraper.id}>{scraper.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Probability</label>
            <select
              value={minProbability}
              onChange={(e) => setMinProbability(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Any</option>
              <option value="0.7">70%+</option>
              <option value="0.5">50%+</option>
              <option value="0.3">30%+</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="date">Date</option>
                <option value="probability">Probability</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-500 mb-4">
        {loading ? "Loading..." : `${auctions.length} auctions found`}
      </div>

      {/* Auctions List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : auctions.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-gray-500 mb-4">No auctions found</div>
        </div>
      ) : (
        <div className="space-y-4">
          {auctions.map((auction) => (
            <div key={auction.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {auction.scraper?.imageUrl && (
                        <img src={auction.scraper.imageUrl} alt="" className="w-4 h-4" />
                      )}
                      <span className="text-sm text-gray-500">{auction.scraper?.name || "Unknown"}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      <a href={auction.url} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600">
                        {auction.title}
                      </a>
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{auction.items?.length || 0} items</span>
                      {auction.endDate && (
                        <span>Closes: {new Date(auction.endDate).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getProbabilityColor(auction.hardwareProbability)}`}>
                      {formatProbability(auction.hardwareProbability)} hardware
                    </span>
                    <Link to={`/auctions/${auction.id}`} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                      View Items
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Auction Detail Page
function AuctionDetailPage() {
  const { auctionId } = useParams<{ auctionId: string }>();
  const navigate = useNavigate();
  const [auction, setAuction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [categorizing, setCategorizing] = useState(false);
  const [categorizeProgress, setCategorizeProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/getAuction?id=${auctionId}`)
      .then((res) => res.json())
      .then((data) => {
        setAuction(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [auctionId]);

  const toggleExpand = (itemId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const getCategoryColor = (probability: number) => {
    if (probability >= 0.7) return "bg-green-500";
    if (probability >= 0.4) return "bg-yellow-500";
    return "bg-gray-400";
  };

  const handleCategorizeAuction = async () => {
    if (!auction) return;

    setCategorizing(true);
    setError(null);
    setSuccess(null);
    setCategorizeProgress("Starting categorization...");

    try {
      const response = await fetch("/api/categorizeAuction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auctionId: auction.id, saveResults: true }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to categorize auction");
      }

      setCategorizeProgress(`Categorized ${data.itemCount} items...`);
      setSuccess(`Successfully categorized ${data.itemCount} items!`);

      // Refresh auction data
      const refreshResponse = await fetch(`/api/getAuction?id=${auctionId}`);
      const refreshData = await refreshResponse.json();
      setAuction(refreshData);
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      console.error("Categorization error:", err);
    } finally {
      setCategorizing(false);
      setCategorizeProgress(null);
    }
  };

  const handleCategorizeItem = async (itemId: string) => {
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/categorizeItem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to categorize item");
      }

      setSuccess("Item categorized successfully!");

      // Refresh auction data
      const refreshResponse = await fetch(`/api/getAuction?id=${auctionId}`);
      const refreshData = await refreshResponse.json();
      setAuction(refreshData);
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      console.error("Item categorization error:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-gray-500 mb-4">Auction not found</div>
          <Link to="/auctions" className="text-indigo-600 hover:text-indigo-800">Back to Auctions</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        ← Back to Auctions
      </button>

      <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-2">
            {auction.scraper?.imageUrl && <img src={auction.scraper.imageUrl} alt="" className="w-4 h-4" />}
            <span className="text-sm text-gray-500">{auction.scraper?.name || "Unknown"}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{auction.title}</h1>
          <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
            <span>{auction.items?.length || 0} items</span>
            {auction.endDate && <span>Closes: {new Date(auction.endDate).toLocaleDateString()}</span>}
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {success}
            </div>
          )}
          {categorizeProgress && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {categorizeProgress}
            </div>
          )}

          {/* Categorize Button */}
          <button
            onClick={handleCategorizeAuction}
            disabled={categorizing}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${categorizing ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"}`}
          >
            <svg className={`w-4 h-4 ${categorizing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            {categorizing ? "Categorizing..." : "AI Categorize All Items"}
          </button>
        </div>
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-between items-center">
          <a href={auction.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
            View Original Auction →
          </a>
          <span className="text-xs text-gray-400">ID: {auction.id}</span>
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-4">Auction Items ({auction.items?.length || 0})</h2>

      {auction.items?.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-gray-500">No items found</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {auction.items?.map((item: any) => (
            <div key={item.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
              {item.imageUrl && (
                <div className="aspect-video bg-gray-100">
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-contain" />
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600">
                    {item.title}
                  </a>
                </h3>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    {item.currentPrice && <div className="text-lg font-bold text-gray-900">${item.currentPrice.toFixed(2)}</div>}
                    {item.bidCount !== undefined && <div className="text-sm text-gray-500">{item.bidCount} bid{item.bidCount !== 1 ? "s" : ""}</div>}
                  </div>
                  {(() => {
                    // Check if highest probability is >= 50%
                    const highestProb = item.categoryProbabilities?.length > 0
                      ? Math.max(...item.categoryProbabilities.map((cp: any) => cp.probability))
                      : 0;
                    const hasHighConfidence = highestProb >= 0.5;

                    if (item.mainCategory && hasHighConfidence) {
                      return (
                        <Link to={`/categories/${item.mainCategory.id}`} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 hover:bg-indigo-200">
                          {item.mainCategory.name}
                        </Link>
                      );
                    }
                    return (
                      <button
                        onClick={() => handleCategorizeItem(item.id)}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"
                      >
                        Categorize
                      </button>
                    );
                  })()}
                </div>

                {/* Item ID */}
                <div className="text-xs text-gray-400 mb-2 font-mono">
                  ID: {item.id}
                </div>

                {item.categoryProbabilities && item.categoryProbabilities.length > 0 ? (
                  <div className="mt-3">
                    <button
                      onClick={() => toggleExpand(item.id)}
                      className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                      <svg className={`w-4 h-4 transition-transform ${expandedItems.has(item.id) ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      {expandedItems.has(item.id) ? "Hide" : "Show"} category distribution
                    </button>

                    {expandedItems.has(item.id) && (
                      <div className="mt-2 space-y-1">
                        {item.categoryProbabilities.map((cp: any) => (
                          <div key={cp.id} className="text-xs">
                            <div className="flex justify-between text-gray-600 mb-0.5">
                              <span>{cp.category?.name || "Unknown"}</span>
                              <span>{(cp.probability * 100).toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div className={`${getCategoryColor(cp.probability)} h-1.5 rounded-full transition-all`} style={{ width: `${cp.probability * 100}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-gray-400 italic">No categories estimated yet</span>
                    <button
                      onClick={() => handleCategorizeItem(item.id)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      AI Categorize →
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Categories Page
function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/getCategories");
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      setError("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (category?: any) => {
    if (category) {
      setEditingCategory(category);
      setFormData({ name: category.name, description: category.description || "" });
    } else {
      setEditingCategory(null);
      setFormData({ name: "", description: "" });
    }
    setShowModal(true);
    setError(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ name: "", description: "" });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("Category name is required");
      return;
    }

    try {
      if (editingCategory) {
        const response = await fetch("/api/updateCategory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingCategory.id,
            name: formData.name,
            description: formData.description,
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to update category");
        }
        setSuccess("Category updated successfully");
      } else {
        const response = await fetch("/api/createCategory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to create category");
        }
        setSuccess("Category created successfully");
      }

      handleCloseModal();
      fetchCategories();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm("Are you sure you want to delete this category? Items in this category will have their main category removed.")) {
      return;
    }

    try {
      const response = await fetch("/api/deleteCategory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: categoryId }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete category");
      }
      setSuccess("Category deleted successfully");
      fetchCategories();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600 mt-1">Manage item categories for your auctions</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Category
        </button>
      </div>

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex">
            <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="ml-3 text-sm text-green-700">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <p className="ml-3 text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {categories.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No categories</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new category.</p>
          <div className="mt-6">
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Category
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div key={category.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => handleOpenModal(category)} className="text-gray-400 hover:text-gray-600" title="Edit">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button onClick={() => handleDelete(category.id)} className="text-gray-400 hover:text-red-600" title="Delete">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                {category.description && <p className="text-sm text-gray-600 mb-4">{category.description}</p>}
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    {category._count?.items || 0} item{(category._count?.items || 0) !== 1 ? "s" : ""}
                  </span>
                  <Link to={`/categories/${category.id}`} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                    View Items →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">{editingCategory ? "Edit Category" : "New Category"}</h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-4">
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}
                <div className="mb-4">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text" id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Servers" required
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Optional description of this category"
                  />
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                <button type="button" onClick={handleCloseModal} className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">{editingCategory ? "Update" : "Create"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Category Detail Page
function CategoryDetailPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/getItemsByCategory?categoryId=${categoryId}`);
        if (!response.ok) throw new Error("Failed to fetch category");
        const result = await response.json();
        setData(result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [categoryId]);

  const formatPrice = (price: number | null) => {
    if (price === null) return "N/A";
    return `€${price.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-red-500 mb-4">{error || "Category not found"}</div>
          <Link to="/categories" className="text-indigo-600 hover:text-indigo-800">Back to Categories</Link>
        </div>
      </div>
    );
  }

  const { category, items, pagination } = data;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <button onClick={() => navigate(-1)} className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6">
        ← Back to Categories
      </button>

      <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{category.name}</h1>
          {category.description && <p className="text-gray-600 mb-4">{category.description}</p>}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
              {pagination.total} item{pagination.total !== 1 ? "s" : ""}
            </span>
            <span>Created: {new Date(category.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No items in this category</h3>
          <p className="mt-1 text-sm text-gray-500">Items will appear here when they are categorized.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item: any) => (
            <div key={item.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
              {item.imageUrl && (
                <div className="aspect-video bg-gray-100">
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-contain" />
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600">{item.title}</a>
                </h3>
                {item.description && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>}
                <div className="flex items-center justify-between">
                  <div>
                    {item.currentPrice && <div className="text-lg font-bold text-gray-900">{formatPrice(item.currentPrice)}</div>}
                    {item.bidCount !== undefined && <div className="text-sm text-gray-500">{item.bidCount} bid{item.bidCount !== 1 ? "s" : ""}</div>}
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 mb-1">{item.auction?.scraper?.name || "Unknown"}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Main App Component
export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/scraping" element={<ScrapingPage />} />
          <Route path="/auctions" element={<AuctionsPage />} />
          <Route path="/auctions/:auctionId" element={<AuctionDetailPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/categories/:categoryId" element={<CategoryDetailPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
