import { useEffect, useRef, useCallback } from "react";

export interface AuctionFilterState {
  search: string;
  scraperId: string;
  minProbability: string;
  sortBy: "date" | "probability";
  sortOrder: "asc" | "desc";
  hideEmptyAuctions: boolean;
}

const VALID_SORT_BY = ["date", "probability"] as const;
const VALID_SORT_ORDER = ["asc", "desc"] as const;

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

export function parseAuctionUrlFilters(
  searchParams: URLSearchParams,
  availableScraperIds: string[] = []
): Partial<AuctionFilterState> {
  const filters: Partial<AuctionFilterState> = {};

  // Parse search (sanitize XSS attempts)
  const search = searchParams.get("search");
  if (search) {
    filters.search = sanitizeString(search);
  }

  // Parse scraperId (validate against available options)
  const scraperId = searchParams.get("scraperId");
  if (scraperId && availableScraperIds.includes(scraperId)) {
    filters.scraperId = scraperId;
  }

  // Parse minProbability (validate as number between 0 and 1)
  const minProbability = searchParams.get("minProbability");
  if (minProbability && isValidNumber(minProbability, 0, 1)) {
    filters.minProbability = minProbability;
  }

  // Parse hideEmptyAuctions (boolean)
  const hideEmpty = searchParams.get("hideEmptyAuctions");
  if (hideEmpty === "true") {
    filters.hideEmptyAuctions = true;
  } else if (hideEmpty === "false") {
    filters.hideEmptyAuctions = false;
  }

  // Parse sortBy (validate enum)
  const sortBy = searchParams.get("sortBy");
  if (sortBy && VALID_SORT_BY.includes(sortBy as "date" | "probability")) {
    filters.sortBy = sortBy as AuctionFilterState["sortBy"];
  }

  // Parse sortOrder (validate enum)
  const sortOrder = searchParams.get("sortOrder");
  if (sortOrder && VALID_SORT_ORDER.includes(sortOrder as "asc" | "desc")) {
    filters.sortOrder = sortOrder as AuctionFilterState["sortOrder"];
  }

  return filters;
}

export function updateAuctionUrlFilters(filters: AuctionFilterState): void {
  const params = new URLSearchParams();

  // Only add non-default values to keep URL clean
  if (filters.search && filters.search.length > 0) {
    params.set("search", filters.search);
  }

  // scraperId - only add if not "all" (default is "all")
  if (filters.scraperId && filters.scraperId !== "all") {
    params.set("scraperId", filters.scraperId);
  }

  // minProbability - only add if set
  if (filters.minProbability && filters.minProbability.length > 0) {
    params.set("minProbability", filters.minProbability);
  }

  // hideEmptyAuctions - default is true, so only add if false
  if (!filters.hideEmptyAuctions) {
    params.set("hideEmptyAuctions", "false");
  }

  // sortBy defaults to "date" but we'll always include it for clarity
  params.set("sortBy", filters.sortBy);

  // sortOrder defaults to "desc" but we'll always include it for clarity
  params.set("sortOrder", filters.sortOrder);

  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState(null, "", newUrl);
}

export function useAuctionUrlSync(
  filters: AuctionFilterState,
  availableScraperIds: string[],
  onFiltersChange: (filters: Partial<AuctionFilterState>) => void,
  hasLoadedScrapers: boolean
) {
  const previousFiltersRef = useRef<AuctionFilterState>(filters);
  const previousHasLoadedScrapersRef = useRef(false);

  // Parse URL when scrapers data becomes available
  useEffect(() => {
    // Only parse URL when scrapers first become available
    if (!hasLoadedScrapers) {
      previousHasLoadedScrapersRef.current = false;
      return;
    }

    if (previousHasLoadedScrapersRef.current === hasLoadedScrapers) {
      return;
    }
    previousHasLoadedScrapersRef.current = hasLoadedScrapers;

    const searchParams = new URLSearchParams(window.location.search);
    const urlFilters = parseAuctionUrlFilters(searchParams, availableScraperIds);

    if (Object.keys(urlFilters).length > 0) {
      onFiltersChange(urlFilters);
    }
  }, [hasLoadedScrapers, availableScraperIds.join(","), onFiltersChange]);

  // Sync filter changes to URL
  useEffect(() => {
    // Skip initial render
    const prevFilters = previousFiltersRef.current;
    if (prevFilters === filters) return;

    // Check if any filter has changed
    const hasFilterChanged =
      prevFilters.search !== filters.search ||
      prevFilters.scraperId !== filters.scraperId ||
      prevFilters.minProbability !== filters.minProbability ||
      prevFilters.sortBy !== filters.sortBy ||
      prevFilters.sortOrder !== filters.sortOrder ||
      prevFilters.hideEmptyAuctions !== filters.hideEmptyAuctions;

    if (hasFilterChanged) {
      updateAuctionUrlFilters(filters);
    }

    previousFiltersRef.current = filters;
  }, [filters]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const urlFilters = parseAuctionUrlFilters(searchParams, availableScraperIds);

      // Apply URL filters to component state
      onFiltersChange(urlFilters);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [availableScraperIds.join(","), onFiltersChange]);
}
