import { useEffect, useRef } from "react";

export interface FilterState {
  search: string;
  categoryIds: string[];
  minProbability: string;
  scraperIds: string[];
  maxPrice: string;
  sortBy: "date" | "price" | "probability";
  sortOrder: "asc" | "desc";
  limit: "25" | "50" | "100";
}

const VALID_LIMITS = ["25", "50", "100"];
const VALID_SORT_BY = ["date", "price", "probability"];
const VALID_SORT_ORDER = ["asc", "desc"];

function isValidNumber(value: string, min: number, max: number): boolean {
  const num = parseFloat(value);
  return !isNaN(num) && num >= min && num <= max;
}

function sanitizeString(str: string): string {
  // Remove potential XSS attempts and trim whitespace
  return str
    .replace(/[<>'"&]/g, "")
    .trim()
    .slice(0, 500); // Limit length to prevent DoS
}

function parseCommaSeparated(value: string | null): string[] {
  if (!value || typeof value !== "string") return [];
  return value
    .split(",")
    .map((v) => sanitizeString(v))
    .filter((v) => v.length > 0);
}

export function parseUrlFilters(
  searchParams: URLSearchParams,
  availableCategoryIds: string[] = [],
  availableScraperIds: string[] = []
): Partial<FilterState> {
  const filters: Partial<FilterState> = {};

  // Parse search (sanitize XSS attempts)
  const search = searchParams.get("search");
  if (search) {
    filters.search = sanitizeString(search);
  }

  // Parse categories (comma-separated, validate against available options)
  const categories = searchParams.get("categories");
  if (categories) {
    const parsedCategories = parseCommaSeparated(categories);
    // Only include category IDs that exist in available options
    filters.categoryIds = parsedCategories.filter((id) =>
      availableCategoryIds.includes(id)
    );
  }

  // Parse minCertainty (validate as number between 0 and 1)
  const minCertainty = searchParams.get("minCertainty");
  if (minCertainty && isValidNumber(minCertainty, 0, 1)) {
    filters.minProbability = minCertainty;
  }

  // Parse scrapers (comma-separated, validate against available options)
  const scrapers = searchParams.get("scrapers");
  if (scrapers) {
    const parsedScrapers = parseCommaSeparated(scrapers);
    filters.scraperIds = parsedScrapers.filter((id) =>
      availableScraperIds.includes(id)
    );
  }

  // Parse maxPrice (validate as non-negative number)
  const maxPrice = searchParams.get("maxPrice");
  if (maxPrice && isValidNumber(maxPrice, 0, Number.MAX_SAFE_INTEGER)) {
    filters.maxPrice = maxPrice;
  }

  // Parse sortBy (validate enum)
  const sortBy = searchParams.get("sortBy");
  if (sortBy && VALID_SORT_BY.includes(sortBy)) {
    filters.sortBy = sortBy as FilterState["sortBy"];
  }

  // Parse sortOrder (validate enum)
  const sortOrder = searchParams.get("sortOrder");
  if (sortOrder && VALID_SORT_ORDER.includes(sortOrder)) {
    filters.sortOrder = sortOrder as FilterState["sortOrder"];
  }

  // Parse limit (validate enum)
  const limit = searchParams.get("limit");
  if (limit && VALID_LIMITS.includes(limit)) {
    filters.limit = limit as FilterState["limit"];
  }

  return filters;
}

export function updateUrlFilters(filters: FilterState): void {
  const params = new URLSearchParams();

  // Only add non-default values to keep URL clean
  if (filters.search && filters.search.length > 0) {
    params.set("search", filters.search);
  }

  if (filters.categoryIds.length > 0) {
    params.set("categories", filters.categoryIds.join(","));
  }

  if (filters.minProbability && filters.minProbability.length > 0) {
    params.set("minCertainty", filters.minProbability);
  }

  if (filters.scraperIds.length > 0) {
    params.set("scrapers", filters.scraperIds.join(","));
  }

  if (filters.maxPrice && filters.maxPrice.length > 0) {
    params.set("maxPrice", filters.maxPrice);
  }

  // sortBy defaults to "date" but we'll always include it for clarity
  params.set("sortBy", filters.sortBy);

  // sortOrder defaults to "desc" but we'll always include it for clarity
  params.set("sortOrder", filters.sortOrder);

  // limit defaults to "100" but we'll always include it for clarity
  params.set("limit", filters.limit);

  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState(null, "", newUrl);
}

export function useUrlSync(
  filters: FilterState,
  filterOptions: FilterOptions,
  onFiltersChange: (filters: Partial<FilterState>) => void,
  hasLoadedOptions: boolean
) {
  const previousFiltersRef = useRef<FilterState>(filters);
  const previousHasLoadedOptionsRef = useRef(false);

  // Parse available category and scraper IDs from filter options
  const availableCategoryIds = filterOptions.categories.map((c) => c.id);
  const availableScraperIds = filterOptions.scrapers.map((s) => s.id);

  // Parse URL when options become available
  useEffect(() => {
    // Only parse URL when options first become available
    if (!hasLoadedOptions) {
      previousHasLoadedOptionsRef.current = false;
      return;
    }

    if (previousHasLoadedOptionsRef.current === hasLoadedOptions) {
      return;
    }
    previousHasLoadedOptionsRef.current = hasLoadedOptions;

    const searchParams = new URLSearchParams(window.location.search);
    const urlFilters = parseUrlFilters(
      searchParams,
      availableCategoryIds,
      availableScraperIds
    );

    if (Object.keys(urlFilters).length > 0) {
      onFiltersChange(urlFilters);
    }
  }, [hasLoadedOptions, availableCategoryIds.join(","), availableScraperIds.join(","), onFiltersChange]);

  // Sync filter changes to URL
  useEffect(() => {
    // Skip initial render
    const prevFilters = previousFiltersRef.current;
    if (prevFilters === filters) return;

    // Check if any filter has changed
    const hasFilterChanged =
      prevFilters.search !== filters.search ||
      JSON.stringify(prevFilters.categoryIds) !== JSON.stringify(filters.categoryIds) ||
      prevFilters.minProbability !== filters.minProbability ||
      JSON.stringify(prevFilters.scraperIds) !== JSON.stringify(filters.scraperIds) ||
      prevFilters.maxPrice !== filters.maxPrice ||
      prevFilters.sortBy !== filters.sortBy ||
      prevFilters.sortOrder !== filters.sortOrder ||
      prevFilters.limit !== filters.limit;

    if (hasFilterChanged) {
      updateUrlFilters(filters);
    }

    previousFiltersRef.current = filters;
  }, [filters]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const urlFilters = parseUrlFilters(
        searchParams,
        availableCategoryIds,
        availableScraperIds
      );

      // Apply URL filters to component state
      onFiltersChange(urlFilters);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [availableCategoryIds.join(","), availableScraperIds.join(","), onFiltersChange]);
}

interface FilterOptions {
  categories: { id: string; name: string; itemCount: number }[];
  scrapers: { id: string; name: string; imageUrl: string | null }[];
}
