import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  PageHeader,
  Card,
  CardContent,
  PageLoadingSpinner,
  EmptyState,
  ProbabilityBadge,
} from "../components";

export function AuctionsPage() {
  const [auctions, setAuctions] = useState<any[]>([]);
  const [scrapers, setScrapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [scraperId, setScraperId] = useState("all");
  const [minProbability, setMinProbability] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [hideEmptyAuctions, setHideEmptyAuctions] = useState(true);

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

  const filteredAuctions = hideEmptyAuctions
    ? auctions.filter((auction) => (auction.items?.length || 0) > 0)
    : auctions;

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
                  <option key={scraper.id} value={scraper.id}>
                    {scraper.name}
                  </option>
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
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hideEmptyAuctions}
                  onChange={(e) => setHideEmptyAuctions(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700">Hide empty</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-sm text-gray-500 mb-4">
        {loading ? "Loading..." : `${filteredAuctions.length} auctions found`}
      </div>

      {loading ? (
        <PageLoadingSpinner />
      ) : filteredAuctions.length === 0 ? (
        <EmptyState title="No auctions found" />
      ) : (
        <div className="space-y-4">
          {filteredAuctions.map((auction) => (
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
                      <span>{auction.items?.length || 0} items</span>
                      {auction.endDate && (
                        <span>Closes: {new Date(auction.endDate).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 flex flex-col items-end gap-2">
                    <ProbabilityBadge probability={auction.hardwareProbability} />
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
