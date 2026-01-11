import { createFileRoute } from "@tanstack/start";
import { createServerFn } from "@tanstack/start";
import { useServerData } from "@tanstack/start";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const stats = useServerData("stats");

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
          <a
            href="/scraping"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200"
          >
            <div className="text-2xl mb-2">🔗</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Manage Websites
            </h2>
            <p className="text-gray-600">
              Add and remove websites to scrape for auctions
            </p>
          </a>
          <a
            href="/auctions"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200"
          >
            <div className="text-2xl mb-2">🔨</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              View Auctions
            </h2>
            <p className="text-gray-600">
              Browse all scraped auctions with advanced filters
            </p>
          </a>
          <a
            href="/auctions?sortBy=probability&sortOrder=desc"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200"
          >
            <div className="text-2xl mb-2">⭐</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              High Probability
            </h2>
            <p className="text-gray-600">
              View auctions most likely to contain hardware
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}
