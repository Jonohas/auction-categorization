import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  PageHeader,
  Card,
  CardContent,
  PageLoadingSpinner,
  EmptyState,
  ProbabilityBadge,
} from "../components";
import { useAuctionUrlSync, type AuctionFilterState } from "../hooks/useAuctionUrlSync";

const DEFAULT_FILTERS: AuctionFilterState = {
  search: "",
  scraperId: "all",
  minProbability: "",
  sortBy: "date",
  sortOrder: "desc",
  hideEmptyAuctions: true,
};

export function AuctionsPage() {
  const [auctions, setAuctions] = useState<any[]>([]);
  const [scrapers, setScrapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AuctionFilterState>(DEFAULT_FILTERS);

  const availableScraperIds = useMemo(() => scrapers.map((s) => String(s.id)), [scrapers]);
  const hasLoadedScrapers = scrapers.length > 0;

  // Sync filters with URL
  useAuctionUrlSync(
    filters,
    availableScraperIds,
    (newFilters) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
    hasLoadedScrapers
  );

  // Fetch scrapers on mount
  useEffect(() => {
    const fetchScrapers = async () => {
      try {
        const res = await fetch("/api/scrapers");
        const data = await res.json();
        setScrapers(data);
      } catch (error) {
        console.error("Failed to fetch scrapers:", error);
      }
    };
    fetchScrapers();
  }, []);

  // Fetch auctions when filters change
  useEffect(() => {
    const fetchAuctions = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filters.scraperId !== "all") params.set("scraperId", filters.scraperId);
        if (filters.minProbability) params.set("minProbability", filters.minProbability);
        if (filters.search) params.set("search", filters.search);
        params.set("sortBy", filters.sortBy);
        params.set("sortOrder", filters.sortOrder);
        params.set("hideEmptyAuctions", String(filters.hideEmptyAuctions));

        const res = await fetch(`/api/auctions?${params}`);
        const data = await res.json();
        setAuctions(data);
      } catch (error) {
        console.error("Failed to fetch auctions:", error);
      } finally {
        setLoading(false);
      }
    };

    if (hasLoadedScrapers) {
      fetchAuctions();
    }
  }, [filters, hasLoadedScrapers]);

  const updateFilter = <K extends keyof AuctionFilterState>(
    key: K,
    value: AuctionFilterState[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <PageHeader title="Auctions" />

      <Card className="mb-8">
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => updateFilter("search", e.target.value)}
                placeholder="Search titles..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scraper</label>
              <select
                value={filters.scraperId}
                onChange={(e) => updateFilter("scraperId", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Scrapers</option>
                {scrapers.map((scraper) => (
                  <option key={scraper.id} value={scraper.id}>
                    {scraper.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Probability</label>
              <select
                value={filters.minProbability}
                onChange={(e) => updateFilter("minProbability", e.target.value)}
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
                  value={filters.sortBy}
                  onChange={(e) => updateFilter("sortBy", e.target.value as "date" | "probability")}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="date">Date</option>
                  <option value="probability">Probability</option>
                </select>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => updateFilter("sortOrder", e.target.value as "asc" | "desc")}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="desc">Desc</option>
                  <option value="asc">Asc</option>
                </select>
              </div>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.hideEmptyAuctions}
                  onChange={(e) => updateFilter("hideEmptyAuctions", e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700">Hide empty</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-sm text-gray-500 mb-4">
        {loading ? "Loading..." : `${auctions.length} auctions found`}
      </div>

      {loading ? (
        <PageLoadingSpinner />
      ) : auctions.length === 0 ? (
        <EmptyState title="No auctions found" />
      ) : (
        <div className="space-y-4">
          {auctions.map((auction) => (
            <Card key={auction.id} hover>
              <CardContent>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {auction.scraper?.imageUrl && (
                        <img src={auction.scraper.imageUrl} alt="" className="w-4 h-4" />
                      )}
                      <span className="text-sm text-gray-500">
                        {auction.scraper?.name || "Unknown"}
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
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{auction.itemsCount || 0} items</span>
                      {auction.endDate && (
                        <span>Closes: {new Date(auction.endDate).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 flex flex-col items-end gap-2">
                    <ProbabilityBadge probability={auction.maxProbability} />
                    <Link
                      to={`/auctions/${auction.id}`}
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                    >
                      View Items
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
