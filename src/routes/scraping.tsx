import { createFileRoute } from "@tanstack/start";
import { createServerFn } from "@tanstack/start";
import { useState } from "react";
import { useServerData } from "@tanstack/start";

export const Route = createFileRoute("/scraping")({
  component: ScrapingPage,
});

export const getScrapersFn = createServerFn({
  handler: async () => {
    const response = await fetch("http://localhost:3000/api/getScrapers");
    return await response.json();
  },
});

export const triggerScraperScrapeFn = createServerFn({
  handler: async ({ scraperId }: { scraperId: string }) => {
    const response = await fetch("http://localhost:3000/api/scrapeScraper", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scraperId }),
    });
    return await response.json();
  },
});

export const enableScraperFn = createServerFn({
  handler: async ({ scraperId }: { scraperId: string }) => {
    const response = await fetch("http://localhost:3000/api/enableScraper", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scraperId }),
    });
    return await response.json();
  },
});

export const disableScraperFn = createServerFn({
  handler: async ({ scraperId }: { scraperId: string }) => {
    const response = await fetch("http://localhost:3000/api/disableScraper", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scraperId }),
    });
    return await response.json();
  },
});

function ScrapingPage() {
  const [isScraping, setIsScraping] = useState(false);
  const [scrapingId, setScrapingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const scrapers = useServerData("scrapers");

  const handleScrapeAll = async () => {
    setIsScraping(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("http://localhost:3000/api/triggerScrape", {
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

    console.log(scraperId);

    try {
      const response = await fetch("http://localhost:3000/api/scrapeScraper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scraperId }),
      });
      const result = await response.json();

      if (result.success) {
        setSuccess(`Found ${result.auctionsFound} auctions, created ${result.auctionsCreated} new.`);
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
      const response = await fetch(enabled ? "http://localhost:3000/api/disableScraper" : "http://localhost:3000/api/enableScraper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scraperId }),
      });
      const result = await response.json();

      if (result.success) {
        setSuccess(`Scraper ${enabled ? "disabled" : "enabled"} successfully!`);
        // Refresh the page data
        window.location.reload();
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
        <div className="flex gap-4">
          <button
            onClick={handleScrapeAll}
            disabled={isScraping}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {isScraping ? "Scraping..." : "Scrape All Enabled"}
          </button>
        </div>
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
            Predefined Scrapers ({scrapers?.length || 0})
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Configure and manage your auction scrapers. Scraper configuration is managed via the config.toml file.
          </p>
        </div>
        <ul className="divide-y divide-gray-200">
          {scrapers?.length === 0 ? (
            <li className="px-6 py-8 text-center text-gray-500">
              No scrapers configured. Add scrapers to your config.toml file.
            </li>
          ) : (
            scrapers?.map((scraper: { id: string; name: string; url: string; imageUrl?: string | null; enabled: boolean; _count: { auctions: number } }) => (
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
                      {scraper._count.auctions} auctions
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
