/**
 * Input sanitization utilities for API security
 */

/**
 * Sanitize a string by removing potentially dangerous characters
 * Allows alphanumeric, spaces, and common punctuation
 */
export function sanitizeString(input: string | undefined | null): string {
  if (input === undefined || input === null) {
    return "";
  }

  return input
    .trim()
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
    .substring(0, 10000); // Limit length
}

/**
 * Sanitize a URL - only allow http/https protocols
 */
export function sanitizeUrl(input: string | undefined | null): string | null {
  if (input === undefined || input === null) {
    return null;
  }

  const trimmed = input.trim();

  // Only allow http and https URLs
  if (!/^https?:\/\//i.test(trimmed)) {
    return null;
  }

  try {
    const url = new URL(trimmed);
    // Remove any suspicious characters from pathname
    url.pathname = url.pathname.replace(/[<>"'{}|\\^`\[\]]/g, "");
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Sanitize a search query - allows alphanumeric, spaces, and common punctuation
 */
export function sanitizeSearchQuery(input: string | undefined | null): string {
  if (input === undefined || input === null) {
    return "";
  }

  // Only allow safe characters for search queries
  return input
    .trim()
    .replace(/[^a-zA-Z0-9\s\-_.,]/g, "")
    .substring(0, 500);
}

/**
 * Sanitize a probability value (0-1 range)
 */
export function sanitizeProbability(input: string | undefined | null): number | undefined {
  if (input === undefined || input === null) {
    return undefined;
  }

  const parsed = parseFloat(input);
  if (isNaN(parsed) || parsed < 0 || parsed > 1) {
    return undefined;
  }

  return parsed;
}

/**
 * Sanitize a numeric ID
 */
export function sanitizeId(input: string | undefined | null): string | undefined {
  if (input === undefined || input === null) {
    return undefined;
  }

  // Only allow alphanumeric characters, underscores, and hyphens (like CUIDs)
  if (!/^[a-zA-Z0-9_-]+$/.test(input)) {
    return undefined;
  }

  return input;
}
