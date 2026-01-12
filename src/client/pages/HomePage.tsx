import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { StatCard, Card } from "../components";

export function HomePage() {
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
          <StatCard value={stats?.scraperCount || 0} label="Scrapers" />
          <StatCard value={stats?.auctionCount || 0} label="Auctions" />
          <StatCard value={stats?.itemCount || 0} label="Items" />
          <StatCard
            value={stats?.avgProbability ? `${(stats.avgProbability * 100).toFixed(1)}%` : "0%"}
            label="Avg. Probability"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/scraping">
            <Card hover className="p-6 border border-gray-200 h-full">
              <div className="text-2xl mb-2">🔗</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Manage Scrapers
              </h2>
              <p className="text-gray-600">
                Configure and manage predefined scrapers from config.toml
              </p>
            </Card>
          </Link>
          <Link to="/auctions">
            <Card hover className="p-6 border border-gray-200 h-full">
              <div className="text-2xl mb-2">🔨</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                View Auctions
              </h2>
              <p className="text-gray-600">
                Browse all scraped auctions with advanced filters
              </p>
            </Card>
          </Link>
          <Link to="/auctions?sortBy=probability&sortOrder=desc">
            <Card hover className="p-6 border border-gray-200 h-full">
              <div className="text-2xl mb-2">⭐</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                High Probability
              </h2>
              <p className="text-gray-600">
                View auctions most likely to contain hardware
              </p>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
