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
} from "../components";

export function CategoryDetailPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/getItemsByCategory?categoryId=${categoryId}`);
        if (!response.ok) throw new Error("Failed to fetch category");
        const result = await response.json();
        setData(result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [categoryId]);

  if (loading) {
    return <PageLoadingSpinner />;
  }

  if (error || !data) {
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
        </CardContent>
      </Card>

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
