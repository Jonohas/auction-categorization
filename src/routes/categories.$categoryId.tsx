import { createFileRoute } from "@tanstack/start";
import { useState, useEffect } from "react";
import { useParams } from "@tanstack/react-router";

export const Route = createFileRoute("/categories/$categoryId")({
  component: CategoryDetailPage,
});

interface Category {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    items: number;
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
  auctionId: string;
  createdAt: string;
  auction: {
    id: string;
    title: string;
    scraper: {
      name: string;
      imageUrl: string | null;
    };
  };
}

interface CategoryItemsResponse {
  category: Category;
  items: AuctionItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function CategoryDetailPage() {
  const { categoryId } = Route.useParams();
  const [data, setData] = useState<CategoryItemsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/getItemsByCategory?categoryId=${categoryId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch category");
        }
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

  const formatPrice = (price: number | null) => {
    if (price === null) return "N/A";
    return `€${price.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-red-500 mb-4">{error || "Category not found"}</div>
          <a href="/categories" className="text-indigo-600 hover:text-indigo-800">
            Back to Categories
          </a>
        </div>
      </div>
    );
  }

  const { category, items, pagination } = data;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Back Link */}
      <a
        href="/categories"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Categories
      </a>

      {/* Category Header */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{category.name}</h1>
          {category.description && (
            <p className="text-gray-600 mb-4">{category.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
              {pagination.total} item{pagination.total !== 1 ? "s" : ""}
            </span>
            <span>
              Created: {new Date(category.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No items in this category</h3>
          <p className="mt-1 text-sm text-gray-500">Items will appear here when they are categorized.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
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
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-bold text-gray-900">
                        {formatPrice(item.currentPrice)}
                      </div>
                      {item.bidCount !== undefined && (
                        <div className="text-sm text-gray-500">
                          {item.bidCount} bid{item.bidCount !== 1 ? "s" : ""}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500 mb-1">
                        {item.auction?.scraper?.name || "Unknown"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <a
                  href={`/categories/${categoryId}?page=${Math.max(1, pagination.page - 1)}`}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  Previous
                </a>
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <a
                  href={`/categories/${categoryId}?page=${Math.min(pagination.totalPages, pagination.page + 1)}`}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  Next
                </a>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
}
