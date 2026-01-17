import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  PageHeader,
  PageLoadingSpinner,
  EmptyState,
  ItemCard,
  BulkActionToolbar,
  AlertMessage,
} from "../components";
import { Pagination } from "../components/Pagination";
import { MultiSelectDropdown } from "../components/MultiSelectDropdown";
import { useItemSelectionStore } from "../stores/itemSelectionStore";

interface FilterOptions {
  categories: { id: string; name: string; itemCount: number }[];
  scrapers: { id: string; name: string; imageUrl: string | null }[];
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function AllItemsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    categories: [],
    scrapers: [],
  });
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [minProbability, setMinProbability] = useState("");
  const [scraperIds, setScraperIds] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [limit, setLimit] = useState("100");

  const clearSelection = useItemSelectionStore((state) => state.clearSelection);
  const selectAll = useItemSelectionStore((state) => state.selectAll);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch filter options on mount
  useEffect(() => {
    fetch("/api/getFilterOptions")
      .then((res) => res.json())
      .then((data) => setFilterOptions(data))
      .catch((err) => console.error("Failed to fetch filter options:", err));
  }, []);

  // Fetch items when filters or pagination changes
  useEffect(() => {
    fetchItems(1);
  }, [debouncedSearch, categoryIds, minProbability, scraperIds, maxPrice, sortBy, sortOrder, limit]);

  // Clear selection when leaving page
  useEffect(() => {
    return () => clearSelection();
  }, [clearSelection]);

  const fetchItems = async (page: number) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (categoryIds.length > 0) params.set("categoryIds", categoryIds.join(","));
      if (minProbability) params.set("minProbability", minProbability);
      if (scraperIds.length > 0) params.set("scraperIds", scraperIds.join(","));
      if (maxPrice) params.set("maxPrice", maxPrice);
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      params.set("page", page.toString());
      params.set("limit", limit);

      const response = await fetch(`/api/getAllItems?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch items");
      }

      let sortedItems = data.items;

      // Client-side sorting by probability (main category)
      if (sortBy === "probability") {
        sortedItems = [...data.items].sort((a: any, b: any) => {
          const aProb =
            a.categoryProbabilities?.find(
              (cp: any) => cp.categoryId === a.mainCategoryId
            )?.probability ?? 0;
          const bProb =
            b.categoryProbabilities?.find(
              (cp: any) => cp.categoryId === b.mainCategoryId
            )?.probability ?? 0;
          return sortOrder === "asc" ? aProb - bProb : bProb - aProb;
        });
      }

      setItems(sortedItems);
      setPagination(data.pagination);

      // Select all items by default
      if (data.items.length > 0) {
        selectAll(data.items.map((item: any) => item.id));
      }
    } catch (err) {
      console.error("Failed to fetch items:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch items");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    fetchItems(page);
  };

  const handleBulkCategorize = async (itemIds: string[]) => {
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/categorizeItems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemIds, saveResults: true }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to bulk categorize items");
      }

      setSuccess(`Successfully categorized ${data.itemCount} items!`);
      clearSelection();

      // Refresh items
      fetchItems(pagination.page);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      console.error("Bulk categorization error:", err);
    }
  };

  const categoryOptions = filterOptions.categories.map((c) => ({
    value: c.id,
    label: `${c.name} (${c.itemCount})`,
  }));

  const scraperOptions = filterOptions.scrapers.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <PageHeader title="All Auction Items" />

      {/* Filters */}
      <Card className="mb-8">
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search titles..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Category Multi-Select */}
            <MultiSelectDropdown
              label="Categories"
              options={categoryOptions}
              selectedValues={categoryIds}
              onChange={setCategoryIds}
              placeholder="All categories"
            />

            {/* Min Probability */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Category Certainty
              </label>
              <select
                value={minProbability}
                onChange={(e) => setMinProbability(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Any</option>
                <option value="0.5">50%+</option>
                <option value="0.6">60%+</option>
                <option value="0.7">70%+</option>
                <option value="0.8">80%+</option>
                <option value="0.9">90%+</option>
              </select>
            </div>

            {/* Scraper/Site Multi-Select */}
            <MultiSelectDropdown
              label="Auction Sites"
              options={scraperOptions}
              selectedValues={scraperIds}
              onChange={setScraperIds}
              placeholder="All sites"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Max Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Price</label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="No limit"
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="date">Date</option>
                  <option value="price">Price</option>
                  <option value="probability">Certainty</option>
                </select>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="desc">Desc</option>
                  <option value="asc">Asc</option>
                </select>
              </div>
            </div>

            {/* Items Per Page */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Items Per Page</label>
              <select
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      {error && <AlertMessage type="error" message={error} className="mb-4" />}
      {success && <AlertMessage type="success" message={success} className="mb-4" />}

      {/* Results header and bulk actions */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        <div className="text-sm text-gray-500">
          {loading ? "Loading..." : `${pagination.total} items found`}
        </div>
        {items.length > 0 && (
          <BulkActionToolbar
            allItemIds={items.map((item) => item.id)}
            onBulkCategorize={handleBulkCategorize}
          />
        )}
      </div>

      {/* Items grid */}
      {loading ? (
        <PageLoadingSpinner />
      ) : items.length === 0 ? (
        <EmptyState title="No items found" />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} showScraper />
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}
