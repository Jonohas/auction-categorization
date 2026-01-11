import { createRouter, RouterProvider } from "@tanstack/react-router";
import { useLoaderData, useRoute } from "@tanstack/react-router";
import { createRootRoute, createRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import type { ReactNode } from "react";

// Root Route
const rootRoute = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  );
}

// Layout Route
const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "layout",
  component: LayoutComponent,
});

function LayoutComponent({ children }: { children: ReactNode }) {
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
                  activeProps={{
                    className: "border-indigo-500 text-gray-900",
                  }}
                >
                  Home
                </Link>
                <Link
                  to="/scraping"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  activeProps={{
                    className: "border-indigo-500 text-gray-900",
                  }}
                >
                  Scraping
                </Link>
                <Link
                  to="/auctions"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  activeProps={{
                    className: "border-indigo-500 text-gray-900",
                  }}
                >
                  Auctions
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

// Index Route
const indexRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/",
  component: IndexComponent,
});

function IndexComponent() {
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
            <div className="text-3xl font-bold text-indigo-600">{stats?.websiteCount || 0}</div>
            <div className="text-gray-600 mt-1">Websites</div>
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
              Manage Websites
            </h2>
            <p className="text-gray-600">
              Add and remove websites to scrape for auctions
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
            to="/auctions"
            search={{ sortBy: "probability", sortOrder: "desc" }}
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

// Scraping Route
const scrapingRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "scraping",
  component: ScrapingPage,
});

function ScrapingPage() {
  const [websites, setWebsites] = useState<any[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchWebsites();
  }, []);

  const fetchWebsites = () => {
    fetch("/api/getWebsites")
      .then((res) => res.json())
      .then(setWebsites)
      .catch(console.error);
  };

  const handleAddWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;

    setIsAdding(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/addWebsite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newUrl }),
      });
      const data = await response.json();

      if (data.success) {
        setSuccess(`Added website successfully!`);
        setNewUrl("");
        fetchWebsites();
      } else {
        setError(data.error || "Failed to add website");
      }
    } catch (err) {
      setError("Failed to add website");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveWebsite = async (id: string) => {
    if (!confirm("Are you sure you want to remove this website?")) return;

    try {
      const response = await fetch("/api/deleteWebsite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await response.json();

      if (data.success) {
        setSuccess("Website removed successfully!");
        fetchWebsites();
      } else {
        setError(data.error || "Failed to remove website");
      }
    } catch (err) {
      setError("Failed to remove website");
    }
  };

  const handleScrapeAll = async () => {
    setIsScraping(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/addWebsite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newUrl }),
      });
      const results = await response.json();

      let totalFound = 0;
      let totalCreated = 0;

      for (const result of results) {
        if (result.success) {
          totalFound += result.auctionsFound;
          totalCreated += result.auctionsCreated;
        }
      }

      setSuccess(`Scraping complete! Found ${totalFound} auctions, created ${totalCreated} new.`);
    } catch (err) {
      setError("Failed to trigger scraping");
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

  const formatProbability = (probability: number | null) => {
    if (probability === null || probability === undefined) return "not yet estimated";
    return `${(probability * 100).toFixed(0)}%`;
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Website Management</h1>
        <button
          onClick={handleScrapeAll}
          disabled={isScraping}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {isScraping ? "Scraping..." : "Scrape All Websites"}
        </button>
      </div>

      {/* Add Website Form */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Website</h2>
        <form onSubmit={handleAddWebsite} className="flex gap-4">
          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://example.com/auctions"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            required
          />
          <button
            type="submit"
            disabled={isAdding}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {isAdding ? "Adding..." : "Add Website"}
          </button>
        </form>
        <p className="mt-2 text-sm text-gray-500">
          Enter the URL of an auction website. The scraper will find and monitor auction listings.
        </p>
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

      {/* Websites List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Monitored Websites ({websites.length})
          </h2>
        </div>
        <ul className="divide-y divide-gray-200">
          {websites.length === 0 ? (
            <li className="px-6 py-8 text-center text-gray-500">
              No websites added yet. Add your first website above.
            </li>
          ) : (
            websites.map((website) => (
              <li key={website.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {website.favicon ? (
                    <img src={website.favicon} alt="" className="w-8 h-8" />
                  ) : (
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-500 text-sm">
                        {website.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-gray-900">{website.name}</div>
                    <div className="text-sm text-gray-500 truncate max-w-md">
                      {website.url}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {website._count?.auctions || 0} auctions
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRemoveWebsite(website.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Remove
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

// Auctions Route
const auctionsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "auctions",
  component: AuctionsPage,
});

function AuctionsPage() {
  const [auctions, setAuctions] = useState<any[]>([]);
  const [websites, setWebsites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [websiteId, setWebsiteId] = useState("all");
  const [minProbability, setMinProbability] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    fetchData();
  }, [websiteId, minProbability, search, sortBy, sortOrder]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (websiteId !== "all") params.set("websiteId", websiteId);
      if (minProbability) params.set("minProbability", minProbability);
      if (search) params.set("search", search);
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);

      const [auctionsRes, websitesRes] = await Promise.all([
        fetch(`/api/getAuctions?${params}`),
        fetch("/api/getWebsites"),
      ]);

      const auctionsData = await auctionsRes.json();
      const websitesData = await websitesRes.json();

      setAuctions(auctionsData);
      setWebsites(websitesData);
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
            <select
              value={websiteId}
              onChange={(e) => setWebsiteId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Websites</option>
              {websites.map((site) => (
                <option key={site.id} value={site.id}>{site.name}</option>
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
                      {auction.website?.favicon && (
                        <img src={auction.website.favicon} alt="" className="w-4 h-4" />
                      )}
                      <span className="text-sm text-gray-500">{auction.website?.name || "Unknown"}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      <a href={auction.url} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600">
                        {auction.title}
                      </a>
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{auction.items?.length || 0} items</span>
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

// Auction Detail Route
const auctionDetailRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "auctions/$auctionId",
  component: AuctionDetailPage,
});

function AuctionDetailPage() {
  const { auctionId } = auctionDetailRoute.useParams();
  const [auction, setAuction] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
      <Link to="/auctions" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6">
        ← Back to Auctions
      </Link>

      <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-2">
            {auction.website?.favicon && <img src={auction.website.favicon} alt="" className="w-4 h-4" />}
            <span className="text-sm text-gray-500">{auction.website?.name || "Unknown"}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{auction.title}</h1>
          <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getProbabilityColor(auction.hardwareProbability)}`}>
              {formatProbability(auction.hardwareProbability)} hardware
            </span>
            <span>{auction.items?.length || 0} items</span>
          </div>
        </div>
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
          <a href={auction.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
            View Original Auction →
          </a>
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
                <div className="flex items-center justify-between">
                  {item.currentPrice && <div className="text-lg font-bold text-gray-900">${item.currentPrice.toFixed(2)}</div>}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getProbabilityColor(item.hardwareProbability)}`}>
                    {formatProbability(item.hardwareProbability)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Create the router
const routeTree = rootRoute.addChildren([
  layoutRoute.addChildren([
    indexRoute,
    scrapingRoute,
    auctionsRoute,
    auctionDetailRoute,
  ]),
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export function AppRouter() {
  return <RouterProvider router={router} />;
}
