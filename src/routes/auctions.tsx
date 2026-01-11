import { createFileRoute } from "@tanstack/start";
import { useState, useEffect } from "react";
import { useSearchParams } from "@tanstack/react-router";

export const Route = createFileRoute("/auctions")({
  component: AuctionsPage,
});

function AuctionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [auctions, setAuctions] = useState<any[]>([]);
  const [websites, setWebsites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [websiteId, setWebsiteId] = useState(searchParams.get("websiteId") || "all");
  const [minProbability, setMinProbability] = useState(searchParams.get("minProbability") || "");
  const [maxProbability, setMaxProbability] = useState(searchParams.get("maxProbability") || "");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "date");
  const [sortOrder, setSortOrder] = useState(searchParams.get("sortOrder") || "desc");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch auctions
        const params = new URLSearchParams();
        if (websiteId !== "all") params.set("websiteId", websiteId);
        if (minProbability) params.set("minProbability", minProbability);
        if (maxProbability) params.set("maxProbability", maxProbability);
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

    fetchData();
  }, [websiteId, minProbability, maxProbability, search, sortBy, sortOrder]);

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (websiteId !== "all") params.set("websiteId", websiteId);
    if (minProbability) params.set("minProbability", minProbability);
    if (maxProbability) params.set("maxProbability", maxProbability);
    if (search) params.set("search", search);
    params.set("sortBy", sortBy);
    params.set("sortOrder", sortOrder);
    setSearchParams(params);
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
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              placeholder="Search titles..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Website Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website
            </label>
            <select
              value={websiteId}
              onChange={(e) => setWebsiteId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Websites</option>
              {websites.map((site: any) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          </div>

          {/* Min Probability */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Hardware Probability
            </label>
            <select
              value={minProbability}
              onChange={(e) => setMinProbability(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Any</option>
              <option value="0.7">70% or higher</option>
              <option value="0.5">50% or higher</option>
              <option value="0.3">30% or higher</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="date">Date</option>
                <option value="probability">Hardware Probability</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="desc">Newest/High</option>
                <option value="asc">Oldest/Low</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={applyFilters}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
          >
            Apply Filters
          </button>
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
          <p className="text-sm text-gray-400">
            Try adjusting your filters or add more websites to scrape.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {auctions.map((auction) => (
            <div
              key={auction.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {auction.website?.favicon && (
                        <img
                          src={auction.website.favicon}
                          alt=""
                          className="w-4 h-4"
                        />
                      )}
                      <span className="text-sm text-gray-500">
                        {auction.website?.name || "Unknown"}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      <a
                        href={auction.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-indigo-600"
                      >
                        {auction.title}
                      </a>
                    </h3>
                    {auction.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {auction.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {auction.startDate && (
                        <span>
                          Starts: {new Date(auction.startDate).toLocaleDateString()}
                        </span>
                      )}
                      {auction.endDate && (
                        <span>
                          Ends: {new Date(auction.endDate).toLocaleDateString()}
                        </span>
                      )}
                      <span>{auction.itemsCount ?? auction.items?.length ?? 0} items</span>
                    </div>
                  </div>
                  <div className="ml-4 flex flex-col items-end gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getProbabilityColor(
                        auction.hardwareProbability
                      )}`}
                    >
                      {formatProbability(auction.hardwareProbability)} hardware
                    </span>
                    <a
                      href={`/auctions/${auction.id}`}
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                    >
                      View Items
                    </a>
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
