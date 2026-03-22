import { getScrapers, scrapeWebsite } from "../../../services/scrapingService.ts";
import { db } from "../../../db/db.ts";
import { scrapers } from "../../../db/schema.ts";
import { eq } from "drizzle-orm";
import { makeAbsoluteUrl } from "../../../scrapers/index.ts";
import type { RouteHandler } from "../../../types/requestTypes.ts";

interface AddWebsiteBody {
  url: string;
}

/**
 * GET /api/websites - List all websites (scrapers)
 * POST /api/websites - Add a new website (scraper)
 */
export const GET: RouteHandler = async (req) => {
  try {
    const scrapersList = await getScrapers();
    return Response.json(scrapersList);
  } catch (error) {
    console.error("Error fetching websites:", error);
    return Response.json({ error: "Failed to fetch websites" }, { status: 500 });
  }
};

export const POST: RouteHandler = async (req) => {
  try {
    const body = await req.json() as AddWebsiteBody;
    const { url } = body;

    if (!url) {
      return Response.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL - only allow http and https protocols
    let sanitizedUrl: string;
    try {
      const urlObj = new URL(url);
      if (!["http:", "https:"].includes(urlObj.protocol)) {
        return Response.json({ error: "Only HTTP and HTTPS protocols are allowed" }, { status: 400 });
      }
      sanitizedUrl = urlObj.toString();
    } catch {
      return Response.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Check if website already exists
    const existing = await db.query.scrapers.findFirst({
      where: eq(scrapers.url, sanitizedUrl),
    });

    if (existing) {
      return Response.json({ error: "Website already exists" }, { status: 400 });
    }

    // Generate a name from the URL
    const hostname = new URL(sanitizedUrl).hostname.replace("www.", "");
    const namePart = hostname.split(".")[0] ?? "";
    const name = namePart.charAt(0).toUpperCase() + namePart.slice(1);

    const result = await db.insert(scrapers).values({
      url: sanitizedUrl,
      name: `${name} Auctions`,
      image_url: makeAbsoluteUrl(sanitizedUrl, "/favicon.ico"),
      enabled: true,
    }).returning();

    const newScraper = result[0];

    return Response.json({ success: true, scraper: newScraper });
  } catch (error) {
    console.error("Error adding website:", error);
    return Response.json({ error: "Failed to add website" }, { status: 500 });
  }
};
