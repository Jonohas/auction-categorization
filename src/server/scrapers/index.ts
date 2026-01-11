import * as cheerio from "cheerio";
import { BopaScraper } from "./bopaScraper"; // Import at the end to avoid circular dependency

export interface ScrapedAuction {
  url: string;
  title: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  items: ScrapedAuctionItem[];
}

export interface ScrapedAuctionItem {
  url: string;
  title: string;
  description?: string;
  imageUrl?: string;
  currentPrice?: number;
  bidCount?: number;
}

export interface Scraper {
  name: string;
  canHandle(url: string): boolean;
  scrape(websiteUrl: string): Promise<ScrapedAuction[]>;
  getFaviconUrl(websiteUrl: string): string;
}

// Utility function to fetch HTML
export async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; AuctionScraper/1.0)",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }

  return response.text();
}

// Utility to get hostname from URL
export function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

// Utility to make URLs absolute
export function makeAbsoluteUrl(baseUrl: string, relativeUrl: string): string {
  try {
    const base = new URL(baseUrl);
    const relative = relativeUrl.startsWith("/") ? relativeUrl : `/${relativeUrl}`;
    return new URL(relative, base).toString();
  } catch {
    return relativeUrl;
  }
}

// Generic auction site scraper - handles most auction sites with standard HTML structure
export class GenericAuctionScraper implements Scraper {
  name = "Generic Auction Scraper";

  canHandle(url: string): boolean {
    // This scraper handles any auction-related URLs
    const auctionPatterns = [
      /auction/i,
      /bid/i,
      /lot/i,
      /sale/i,
    ];
    return auctionPatterns.some((pattern) => pattern.test(url));
  }

  async scrape(websiteUrl: string): Promise<ScrapedAuction[]> {
    const html = await fetchHtml(websiteUrl);
    const $ = cheerio.load(html);
    const auctions: ScrapedAuction[] = [];

    // Look for auction listings in common patterns
    $("a[href*='auction'], a[href*='lot'], a[href*='bid']").each((_, element) => {
      const href = $(element).attr("href");
      if (href) {
        const url = makeAbsoluteUrl(websiteUrl, href);
        const title = $(element).text().trim() || $(element).attr("title") || "Untitled Auction";

        // Avoid duplicates
        if (!auctions.some((a) => a.url === url)) {
          auctions.push({
            url,
            title,
            items: [],
          });
        }
      }
    });

    // Also look for common auction card patterns
    $(".auction-card, .lot-card, .bid-card, .auction-item, [class*='auction']").each(
      (_, element) => {
        const link = $(element).find("a[href]").first();
        if (link.length) {
          const href = link.attr("href");
          if (href) {
            const url = makeAbsoluteUrl(websiteUrl, href);
            if (!auctions.some((a) => a.url === url)) {
              auctions.push({
                url,
                title: $(element).text().trim().substring(0, 100) || "Untitled Auction",
                items: [],
              });
            }
          }
        }
      }
    );

    return auctions;
  }

  getFaviconUrl(websiteUrl: string): string {
    return makeAbsoluteUrl(websiteUrl, "/favicon.ico");
  }
}

// Auction House scraper for common auction house sites
export class AuctionHouseScraper implements Scraper {
  name = "Auction House";

  canHandle(url: string): boolean {
    const auctionHouseDomains = [
      "proxibid.com",
      "liveauctioneers.com",
      "invaluable.com",
      "bidspotter.com",
      "rrauction.com",
      "govdeals.com",
      "publicsurplus.com",
    ];
    return auctionHouseDomains.some((domain) => url.includes(domain));
  }

  async scrape(websiteUrl: string): Promise<ScrapedAuction[]> {
    const html = await fetchHtml(websiteUrl);
    const $ = cheerio.load(html);
    const auctions: ScrapedAuction[] = [];

    // Common auction house patterns
    $("a[href*='lot'], a[href*='auction'], [class*='lot'], [class*='auction']").each(
      (_, element) => {
        const href = $(element).attr("href");
        if (href && (href.includes("lot") || href.includes("auction") || href.includes("item"))) {
          const url = makeAbsoluteUrl(websiteUrl, href);
          const title = $(element).text().trim().substring(0, 100);

          if (title && !auctions.some((a) => a.url === url)) {
            auctions.push({
              url,
              title,
              items: [],
            });
          }
        }
      }
    );

    return auctions;
  }

  getFaviconUrl(websiteUrl: string): string {
    return makeAbsoluteUrl(websiteUrl, "/favicon.ico");
  }
}

// Scraper factory
export class ScraperFactory {
  private scrapers: Scraper[];

  constructor() {
    this.scrapers = [
      new AuctionHouseScraper(),
      new BopaScraper(),
      new GenericAuctionScraper(),
    ];
  }

  getScraper(url: string): Scraper {
    for (const scraper of this.scrapers) {
      if (scraper.canHandle(url)) {
        return scraper;
      }
    }
    return this.scrapers[this.scrapers.length - 1]; // Return generic scraper as fallback
  }

  getAllScrapers(): Scraper[] {
    return this.scrapers;
  }
}

export const scraperFactory = new ScraperFactory();
