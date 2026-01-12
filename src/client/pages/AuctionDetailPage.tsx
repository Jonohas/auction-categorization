import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardFooter,
  PageLoadingSpinner,
  AlertMessage,
  Button,
  EmptyState,
  ItemCard,
} from "../components";

const AIIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
    />
  </svg>
);

export function AuctionDetailPage() {
  const { auctionId } = useParams<{ auctionId: string }>();
  const navigate = useNavigate();
  const [auction, setAuction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [categorizing, setCategorizing] = useState(false);
  const [categorizeProgress, setCategorizeProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

      const refreshResponse = await fetch(`/api/getAuction?id=${auctionId}`);
      const refreshData = await refreshResponse.json();
      setAuction(refreshData);
    } catch (err: any) {
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

      const refreshResponse = await fetch(`/api/getAuction?id=${auctionId}`);
      const refreshData = await refreshResponse.json();
      setAuction(refreshData);
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      console.error("Item categorization error:", err);
    }
  };

  if (loading) {
    return <PageLoadingSpinner />;
  }

  if (!auction) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Card className="p-12 text-center">
          <div className="text-gray-500 mb-4">Auction not found</div>
          <Link to="/auctions" className="text-indigo-600 hover:text-indigo-800">
            Back to Auctions
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
        ← Back to Auctions
      </Button>

      <Card className="mb-8">
        <CardContent>
          <div className="flex items-center gap-2 mb-2">
            {auction.scraper?.imageUrl && (
              <img src={auction.scraper.imageUrl} alt="" className="w-4 h-4" />
            )}
            <span className="text-sm text-gray-500">{auction.scraper?.name || "Unknown"}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{auction.title}</h1>
          <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
            <span>{auction.items?.length || 0} items</span>
            {auction.endDate && (
              <span>Closes: {new Date(auction.endDate).toLocaleDateString()}</span>
            )}
          </div>

          {error && <AlertMessage type="error" message={error} className="mb-4" />}
          {success && <AlertMessage type="success" message={success} className="mb-4" />}
          {categorizeProgress && (
            <AlertMessage type="info" message={categorizeProgress} className="mb-4" />
          )}

          <Button onClick={handleCategorizeAuction} loading={categorizing}>
            <AIIcon />
            <span className="ml-2">
              {categorizing ? "Categorizing..." : "AI Categorize All Items"}
            </span>
          </Button>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          <a
            href={auction.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            View Original Auction →
          </a>
          <span className="text-xs text-gray-400">ID: {auction.id}</span>
        </CardFooter>
      </Card>

      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Auction Items ({auction.items?.length || 0})
      </h2>

      {auction.items?.length === 0 ? (
        <EmptyState title="No items found" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {auction.items?.map((item: any) => (
            <ItemCard key={item.id} item={item} onCategorize={handleCategorizeItem} />
          ))}
        </div>
      )}
    </div>
  );
}
