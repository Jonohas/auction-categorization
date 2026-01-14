import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Card,
  CardContent,
  PageLoadingSpinner,
  Badge,
  EmptyState,
  InboxIcon,
  ItemCard,
  Button,
  BulkActionToolbar,
  AlertMessage,
} from "../components";
import { useItemSelectionStore } from "../stores/itemSelectionStore";

export function CategoryDetailPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [categorizeProgress, setCategorizeProgress] = useState<string | null>(null);
  const clearSelection = useItemSelectionStore((state) => state.clearSelection);
  const selectAll = useItemSelectionStore((state) => state.selectAll);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/getItemsByCategory?categoryId=${categoryId}`);
        if (!response.ok) throw new Error("Failed to fetch category");
        const result = await response.json();
        setData(result);
        // Select all items by default
        if (result.items && result.items.length > 0) {
          selectAll(result.items.map((item: any) => item.id));
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [categoryId]);

  // Clear selection when leaving page
  useEffect(() => {
    return () => clearSelection();
  }, [clearSelection]);

  const refreshData = async () => {
    const response = await fetch(`/api/getItemsByCategory?categoryId=${categoryId}`);
    if (response.ok) {
      const result = await response.json();
      setData(result);
    }
  };

  const handleBulkCategorize = async (itemIds: string[]) => {
    setError(null);
    setSuccess(null);
    setCategorizeProgress(`Bulk categorizing ${itemIds.length} items...`);

    try {
      const response = await fetch("/api/categorizeItems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemIds, saveResults: true }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to bulk categorize items");
      }

      setSuccess(`Successfully categorized ${result.itemCount} items!`);
      clearSelection();

      // Refresh category data
      await refreshData();
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      console.error("Bulk categorization error:", err);
    } finally {
      setCategorizeProgress(null);
    }
  };

  if (loading) {
    return <PageLoadingSpinner />;
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Card className="p-12 text-center">
          <div className="text-red-500 mb-4">{error || "Category not found"}</div>
          <Link to="/categories" className="text-indigo-600 hover:text-indigo-800">
            Back to Categories
          </Link>
        </Card>
      </div>
    );
  }

  const { category, items, pagination } = data;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
        ← Back to Categories
      </Button>

      <Card className="mb-8">
        <CardContent>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{category.name}</h1>
          {category.description && (
            <p className="text-gray-600 mb-4">{category.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <Badge variant="info" size="md">
              {pagination.total} item{pagination.total !== 1 ? "s" : ""}
            </Badge>
            <span>Created: {new Date(category.createdAt).toLocaleDateString()}</span>
          </div>

          {error && <AlertMessage type="error" message={error} className="mt-4" />}
          {success && <AlertMessage type="success" message={success} className="mt-4" />}
          {categorizeProgress && (
            <AlertMessage type="info" message={categorizeProgress} className="mt-4" />
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        <h2 className="text-xl font-bold text-gray-900">
          Items ({items.length})
        </h2>
        {items.length > 0 && (
          <BulkActionToolbar
            allItemIds={items.map((item: any) => item.id)}
            onBulkCategorize={handleBulkCategorize}
          />
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<InboxIcon />}
          title="No items in this category"
          description="Items will appear here when they are categorized."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item: any) => (
            <ItemCard
              key={item.id}
              item={item}
              showScraper
              currencySymbol="€"
            />
          ))}
        </div>
      )}
    </div>
  );
}
