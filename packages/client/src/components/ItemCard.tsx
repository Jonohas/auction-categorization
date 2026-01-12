import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "./Badge";

interface CategoryProbability {
  id: string;
  probability: number;
  category?: {
    id: string;
    name: string;
  };
}

interface ItemCardProps {
  item: {
    id: string;
    title: string;
    url: string;
    imageUrl?: string;
    description?: string;
    currentPrice?: number;
    bidCount?: number;
    mainCategory?: {
      id: string;
      name: string;
    };
    categoryProbabilities?: CategoryProbability[];
    auction?: {
      scraper?: {
        name: string;
      };
    };
  };
  onCategorize?: (itemId: string) => void;
  showScraper?: boolean;
  currencySymbol?: string;
}

export function ItemCard({ item, onCategorize, showScraper = false, currencySymbol = "$" }: ItemCardProps) {
  const [expanded, setExpanded] = useState(false);

  const getCategoryColor = (probability: number) => {
    if (probability >= 0.7) return "bg-green-500";
    if (probability >= 0.4) return "bg-yellow-500";
    return "bg-gray-400";
  };

  const highestProb = item.categoryProbabilities?.length
    ? Math.max(...item.categoryProbabilities.map((cp) => cp.probability))
    : 0;
  const hasHighConfidence = highestProb >= 0.5;

  const formatPrice = (price: number) => {
    return `${currencySymbol}${price.toFixed(2)}`;
  };

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
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

        {item.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
        )}

        <div className="flex items-center justify-between mb-3">
          <div>
            {item.currentPrice !== undefined && (
              <div className="text-lg font-bold text-gray-900">{formatPrice(item.currentPrice)}</div>
            )}
            {item.bidCount !== undefined && (
              <div className="text-sm text-gray-500">
                {item.bidCount} bid{item.bidCount !== 1 ? "s" : ""}
              </div>
            )}
          </div>

          <div className="text-right">
            {item.mainCategory && hasHighConfidence ? (
              <Link
                to={`/categories/${item.mainCategory.id}`}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
              >
                {item.mainCategory.name}
              </Link>
            ) : onCategorize ? (
              <button
                onClick={() => onCategorize(item.id)}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                Categorize
              </button>
            ) : null}
          </div>
        </div>

        {showScraper && item.auction?.scraper?.name && (
          <div className="text-xs text-gray-500 mb-2">{item.auction.scraper.name}</div>
        )}

        <div className="text-xs text-gray-400 mb-2 font-mono">ID: {item.id}</div>

        {item.categoryProbabilities && item.categoryProbabilities.length > 0 ? (
          <div className="mt-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <svg
                className={`w-4 h-4 transition-transform ${expanded ? "rotate-90" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              {expanded ? "Hide" : "Show"} category distribution
            </button>

            {expanded && (
              <div className="mt-2 space-y-1">
                {item.categoryProbabilities.map((cp) => (
                  <div key={cp.id} className="text-xs">
                    <div className="flex justify-between text-gray-600 mb-0.5">
                      <span>{cp.category?.name || "Unknown"}</span>
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
        ) : onCategorize ? (
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-gray-400 italic">No categories estimated yet</span>
            <button
              onClick={() => onCategorize(item.id)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              AI Categorize →
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
