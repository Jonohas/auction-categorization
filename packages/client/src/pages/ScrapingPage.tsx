import { useState, useEffect } from "react";
import { PageHeader, Card, CardHeader, AlertMessage, Button, StatusBadge } from "../components";

export function ScrapingPage() {
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
      <PageHeader
        title="Scraper Management"
        action={
          <Button onClick={handleScrapeAll} loading={isScraping}>
            {isScraping ? "Scraping..." : "Scrape All Enabled"}
          </Button>
        }
      />

      {error && <AlertMessage type="error" message={error} className="mb-4" />}
      {success && <AlertMessage type="success" message={success} className="mb-4" />}

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">
            Predefined Scrapers ({scrapers.length})
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Scraper configuration is managed via the config.toml file. Enable/disable scrapers and trigger manual scrapes.
          </p>
        </CardHeader>
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
                  <StatusBadge enabled={scraper.enabled} />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleScrapeScraper(scraper.id)}
                    disabled={!scraper.enabled || scrapingId === scraper.id}
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    {scrapingId === scraper.id ? "Scraping..." : "Scrape Now"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleScraper(scraper.id, scraper.enabled)}
                    className={scraper.enabled ? "text-orange-600 hover:text-orange-800" : "text-green-600 hover:text-green-800"}
                  >
                    {scraper.enabled ? "Disable" : "Enable"}
                  </Button>
                </div>
              </li>
            ))
          )}
        </ul>
      </Card>
    </div>
  );
}
