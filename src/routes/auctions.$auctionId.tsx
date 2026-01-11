import { createFileRoute } from "@tanstack/start";
import { useState, useEffect } from "react";
import { useParams } from "@tanstack/react-router";

export const Route = createFileRoute("/auctions/$auctionId")({
  component: AuctionDetailPage,
});

interface CategoryProbability {
  id: string;
  probability: number;
  category: {
    id: string;
    name: string;
    description: string | null;
  };
}

interface AuctionItem {
  id: string;
  url: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  currentPrice: number | null;
  bidCount: number;
  mainCategoryId: string | null;
  mainCategory: {
    id: string;
    name: string;
    description: string | null;
  } | null;
  categoryProbabilities: CategoryProbability[];
}

interface Auction {
  id: string;
  url: string;
  title: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  hardwareProbability: number | null;
  itemsCount: number;
  scraperId: string;
  scraper: {
    id: string;
    name: string;
    url: string;
    imageUrl: string | null;
  };
  items: AuctionItem[];
}

function AuctionDetailPage() {
  const { auctionId } = Route.useParams();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [categorizing, setCategorizing] = useState(false);
  const [categorizeProgress, setCategorizeProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuction = async () => {
      try {
        const response = await fetch(`/api/getAuction?id=${auctionId}`);
        const data = await response.json();
        setAuction(data);
      } catch (error) {
        console.error("Failed to fetch auction:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAuction();
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

  const formatPrice = (price: number | null) => {
    if (price === null) return "N/A";
    return `€${price.toFixed(2)}`;
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
    } catch (err) {
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
    } catch (err) {
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
          <a href="/auctions" className="text-indigo-600 hover:text-indigo-800">
            Back to Auctions
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Back Link */}
      <a
        href="/auctions"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Auctions
      </a>

      {/* Auction Header */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-2">
            {auction.scraper?.imageUrl && (
              <img src={auction.scraper.imageUrl} alt="" className="w-4 h-4" />
            )}
            <span className="text-sm text-gray-500">{auction.scraper?.name || "Unknown"}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{auction.title}</h1>
          {auction.description && (
            <p className="text-gray-600 mb-4">{auction.description}</p>
          )}
          <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
            {auction.startDate && (
              <span>Starts: {new Date(auction.startDate).toLocaleString()}</span>
            )}
            {auction.endDate && (
              <span>Ends: {new Date(auction.endDate).toLocaleString()}</span>
            )}
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
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${
              categorizing
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            <svg className={`w-4 h-4 ${categorizing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            {categorizing ? "Categorizing..." : "AI Categorize All Items"}
          </button>
        </div>
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-between items-center">
          <a
            href={auction.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            View Original Auction →
          </a>
          <span className="text-xs text-gray-400">ID: {auction.id}</span>
        </div>
      </div>

      {/* Items */}
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Auction Items ({auction.itemsCount ?? auction.items?.length ?? 0})
      </h2>

      {(auction.itemsCount ?? auction.items?.length ?? 0) === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-gray-500">No items found in this auction</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(auction.items || []).map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
            >
              {item.imageUrl && (
                <div className="aspect-video bg-gray-100">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-indigo-600"
                  >
                    {item.title}
                  </a>
                </h3>
                {item.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {item.description}
                  </p>
                )}

                <div className="flex items-center justify-between mb-3">
                  <div>
                    {item.currentPrice && (
                      <div className="text-lg font-bold text-gray-900">
                        {formatPrice(item.currentPrice)}
                      </div>
                    )}
                    {item.bidCount !== undefined && (
                      <div className="text-sm text-gray-500">
                        {item.bidCount} bid{item.bidCount !== 1 ? "s" : ""}
                      </div>
                    )}
                  </div>

                  {/* Main Category Badge */}
                  {item.mainCategory ? (
                    <a
                      href={`/categories/${item.mainCategory.id}`}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
                    >
                      {item.mainCategory.name}
                    </a>
                  ) : (
                    <button
                      onClick={() => handleCategorizeItem(item.id)}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"
                    >
                      Categorize
                    </button>
                  )}
                </div>

                {/* Item ID */}
                <div className="text-xs text-gray-400 mb-2 font-mono">
                  ID: {item.id}
                </div>

                {/* Category Distribution */}
                {item.categoryProbabilities && item.categoryProbabilities.length > 0 ? (
                  <div className="mt-3">
                    <button
                      onClick={() => toggleExpand(item.id)}
                      className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                      <svg
                        className={`w-4 h-4 transition-transform ${
                          expandedItems.has(item.id) ? "rotate-90" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                      {expandedItems.has(item.id) ? "Hide" : "Show"} category distribution
                    </button>

                    {expandedItems.has(item.id) && (
                      <div className="mt-2 space-y-1">
                        {item.categoryProbabilities.map((cp) => (
                          <div key={cp.id} className="text-xs">
                            <div className="flex justify-between text-gray-600 mb-0.5">
                              <span>{cp.category.name}</span>
                              <span>{(cp.probability * 100).toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`${getCategoryColor(cp.probability)} h-1.5 rounded-full transition-all`}
                                style={{ width: `${cp.probability * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-gray-400 italic">
                      No categories estimated yet
                    </span>
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
