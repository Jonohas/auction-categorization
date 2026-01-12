import * as cheerio from "cheerio";
import type { Scraper, ScrapedAuction, ScrapedAuctionItem } from "./index";

// Utility functions duplicated to avoid circular dependency
async function fetchHtml(url: string): Promise<string> {
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

function makeAbsoluteUrl(baseUrl: string, relativeUrl: string): string {
  try {
    // If the URL is already absolute, return it as-is
    if (relativeUrl.startsWith("http://") || relativeUrl.startsWith("https://")) {
      return relativeUrl;
    }
    const base = new URL(baseUrl);
    const relative = relativeUrl.startsWith("/") ? relativeUrl : `/${relativeUrl}`;
    return new URL(relative, base).toString();
  } catch {
    return relativeUrl;
  }
}

export class BopaScraper implements Scraper {
  name = "BOPA Veilingen";

  canHandle(url: string): boolean {
    return url.includes("bopa.be");
  }

  async scrape(websiteUrl: string): Promise<ScrapedAuction[]> {
    const html = await fetchHtml(websiteUrl);
    const $ = cheerio.load(html);
    const auctions: ScrapedAuction[] = [];

    // Find all auction items on the main listing page
    // BOPA uses different patterns for auctions
    const auctionSelectors = [
      ".veiling-item",
      ".auction-item",
      "[class*='auction-item']",
      ".auction-item-listing",
      "article[class*='auction']",
    ];

    let auctionElements = $();

    for (const selector of auctionSelectors) {
      const found = $(selector);
      if (found.length > 0) {
        auctionElements = found;
        break;
      }
    }

    // If no specific selectors match, look for auction links
    if (auctionElements.length === 0) {
      // Look for links that contain /auction/
      const seenUrls = new Set<string>();
      $("a[href*='/auction/']").each((_, element) => {
        const href = $(element).attr("href");
        if (href && href.includes("/auction/") && href.includes("/lots")) {
          const url = makeAbsoluteUrl(websiteUrl, href);
          if (!seenUrls.has(url)) {
            seenUrls.add(url);
            const title = $(element).text().trim();
            if (title) {
              auctions.push({
                url,
                title,
                items: [],
              });
            }
          }
        }
      });
    } else {
      // Parse auction elements
      auctionElements.each((_, element) => {
        const $el = $(element);
        const link = $el.find("a[href*='/auction/']").first();
        const href = link.attr("href") || "";
        const title = link.text().trim() || $el.find("h2, h3, h4").first().text().trim() || $el.text().trim().substring(0, 100);

        if (href && title) {
          const url = makeAbsoluteUrl(websiteUrl, href);
          if (!auctions.some((a) => a.url === url)) {
            auctions.push({
              url,
              title,
              items: [],
            });
          }
        }
      });
    }

    // If still no auctions found, look for any /auction/ links in the page
    if (auctions.length === 0) {
      const seenUrls = new Set<string>();
      $("a[href*='/auction/']").each((_, element) => {
        const href = $(element).attr("href");
        if (href && href.includes("/lots")) {
          const url = makeAbsoluteUrl(websiteUrl, href);
          if (!seenUrls.has(url)) {
            seenUrls.add(url);
            const title = $(element).text().trim() || "BOPA Auction";
            auctions.push({
              url,
              title,
              items: [],
            });
          }
        }
      });
    }

    console.log(`Found ${auctions.length} auction items on BOPA listing page`);

    // Scrape each auction page to get items
    for (const auction of auctions) {
      try {
        console.log(`Scraping auction: ${auction.url}`);
        const auctionDetails = await this.scrapeAuctionDetails(auction.url);
        if (auctionDetails) {
          auction.title = auction.title || auctionDetails.title;
          auction.description = auctionDetails.description;
          auction.endDate = auctionDetails.endDate;
          auction.items = auctionDetails.items;
        }
      } catch (error) {
        console.error(`Error scraping auction ${auction.url}:`, error);
      }
    }

    return auctions;
  }

  /**
   * Scrape detailed auction page including all lots/items with pagination
   */
  private async scrapeAuctionDetails(auctionUrl: string): Promise<ScrapedAuction | null> {
    // Scrape all pages of lots for this auction
    const allItems: ScrapedAuctionItem[] = [];
    let pageUrl = auctionUrl;
    let pageIndex = 1;
    const maxPages = 100; // Safety limit to prevent infinite loops

    while (pageUrl && pageIndex <= maxPages) {
      console.log(`  Scraping page ${pageIndex}: ${pageUrl}`);

      try {
        const html = await fetchHtml(pageUrl);
        const $ = cheerio.load(html);

        // Extract title (from first page only)
        let title = "BOPA Auction";
        if (pageIndex === 1) {
          title = $("h1").first().text().trim() ||
            $(".auction-title, .title-auction").first().text().trim() ||
            $("title").text().trim().replace(" | BOPA Veilingen", "") ||
            "BOPA Auction";
        }

        // Extract description (from first page only)
        let description = "";
        if (pageIndex === 1) {
          description = $(".auction-description, .description, [class*='description']").first().text().trim() || "";
        }

        // Extract end date (from first page only)
        let endDate: Date | undefined;
        if (pageIndex === 1) {
          // Look for closing date in the lot items
          const closingText = $(".auction-info, [class*='closing'], [class*='end'], .timer").first().text();
          if (closingText) {
            const dateMatch = closingText.match(/(\d{2})[-/.](\d{2})[-/.](\d{4})\s*(?:om|:)?\s*(\d{2}):(\d{2})/);
            if (dateMatch) {
              const [, day, month, year, hour, minute] = dateMatch;
              endDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
            }
          }
        }

        // Scrape lots/items from this page
        const pageItems = this.parseAuctionItems($, pageUrl, auctionUrl);
        allItems.push(...pageItems);

        console.log(`  Found ${pageItems.length} items on page ${pageIndex}`);

        // Find next page URL
        const nextPage = this.findNextPageUrl($, auctionUrl);

        if (nextPage) {
          pageUrl = nextPage;
          pageIndex++;
        } else {
          break;
        }
      } catch (error) {
        console.error(`  Error scraping page ${pageIndex}:`, error);
        break;
      }
    }

    console.log(`  Total items found: ${allItems.length}`);

    // Get title and description from first page if we have items
    let finalTitle = "BOPA Auction";
    let finalDescription = "";
    let finalEndDate: Date | undefined;

    if (allItems.length > 0) {
      try {
        const firstPageHtml = await fetchHtml(auctionUrl);
        const $ = cheerio.load(firstPageHtml);
        finalTitle = $("h1").first().text().trim() || "BOPA Auction";
        finalDescription = $(".auction-description, .description, [class*='description']").first().text().trim() || "";
      } catch {
        // Use defaults
      }
    }

    return {
      url: auctionUrl,
      title: finalTitle,
      description: finalDescription,
      endDate: finalEndDate,
      items: allItems,
    };
  }

  /**
   * Find the URL for the next page of results
   */
  private findNextPageUrl($: cheerio.CheerioAPI, currentPageUrl: string): string | null {
    // Determine current page number from URL
    let currentPageNum = 1;
    const currentPageMatch = currentPageUrl.match(/[?&]page=(\d+)/i);
    if (currentPageMatch) {
      currentPageNum = parseInt(currentPageMatch[1], 10);
    }

    // Look for pagination links
    const paginationSelectors = [
      "a.next, a.next-page, a.pagination-next",
      "a[rel='next']",
      "a[class*='next']",
    ];

    for (const selector of paginationSelectors) {
      const nextLink = $(selector);
      if (nextLink.length > 0) {
        const href = nextLink.attr("href");
        if (href && !href.includes("#") && !href.includes("javascript:") && href.trim() !== "") {
          return makeAbsoluteUrl(currentPageUrl, href);
        }
      }
    }

    // Look for page links and find the next sequential page
    const pageLinks = $("a[href*='page='], a[href*='/page/'], a[href*='?p=']");
    const nextPageNum = currentPageNum + 1;
    let nextPageUrl: string | null = null;

    pageLinks.each((_, element) => {
      const href = $(element).attr("href");
      if (href) {
        const pageMatch = href.match(/[?&]page=(\d+)|\/page\/(\d+)|[?&]p=(\d+)/i);
        if (pageMatch) {
          const pageNum = parseInt(pageMatch[1] || pageMatch[2] || pageMatch[3], 10);
          // Look for the next sequential page number
          if (pageNum === nextPageNum) {
            nextPageUrl = makeAbsoluteUrl(currentPageUrl, href);
          }
        }
      }
    });

    return nextPageUrl;
  }

  /**
   * Parse auction items from an auction detail page
   * BOPA uses .auction-item.data-1-lot for main lots
   * NOTE: We explicitly exclude "aanbevolen" (recommended) items as they are from other auctions
   */
  private parseAuctionItems($: cheerio.CheerioAPI, pageUrl: string, auctionBaseUrl: string): ScrapedAuctionItem[] {
    const items: ScrapedAuctionItem[] = [];
    const seenUrls = new Set<string>();

    // Primary selector: BOPA's main lot structure
    // <div class='auction-item data-1-lot'> inside .lijst-veilingen
    // IMPORTANT: We exclude .aanbevolen section which contains "recommended" items from OTHER auctions
    const lotElements = $(".lijst-veilingen .auction-item.data-1-lot:not(.aanbevolen *), .auction-item.data-1-lot:not(.aanbevolen *)");

    if (lotElements.length > 0) {
      console.log(`    Found ${lotElements.length} lots with .auction-item.data-1-lot selector`);
      lotElements.each((_, element) => {
        const $el = $(element);

        // Skip if this element is inside an "aanbevolen" section
        if ($el.closest(".aanbevolen, [class*='aanbevolen'], section[class*='advised']").length > 0) {
          console.log(`    Skipping aanbevolen (recommended) item`);
          return;
        }

        // Find the link to the lot detail page
        // Links are in .auction-image.meer-info-link and h5 > a.meer-info-link
        const link = $el.find("a.meer-info-link[href*='/lot/']").first();
        const href = link.attr("href") || "";

        if (!href) return;

        const url = makeAbsoluteUrl(auctionBaseUrl, href);

        // Check for duplicate
        if (seenUrls.has(url)) return;
        seenUrls.add(url);

        // Extract title from h5 > a
        const titleEl = $el.find("h5 a.meer-info-link, h4 a.meer-info-link");
        let title = titleEl.text().trim();

        if (!title) {
          // Fallback to link text or parent text
          title = link.text().trim() || $el.clone().children().remove().end().text().trim().substring(0, 200);
        }

        if (!title) return;

        // Extract image URL
        const imgEl = $el.find("img.auction-image, img.img-lot-listitem");
        let imageUrl = imgEl.first().attr("src") || undefined;

        // Clean up image URL if it has onerror handler
        if (imageUrl && imageUrl.includes("onerror=")) {
          imageUrl = undefined;
        }

        // Extract current price from .bid-amount
        let currentPrice: number | undefined;
        const priceEl = $el.find(".bid-amount, [class*='bid-amount']");
        if (priceEl.length > 0) {
          const priceText = priceEl.text().trim();
          const priceMatch = priceText.match(/[\d.,]+/);
          if (priceMatch) {
            currentPrice = parseFloat(priceMatch[0].replace(",", "."));
          }
        }

        // Extract bid count from auction-info
        let bidCount: number | undefined;
        const bidText = $el.find(".auction-info").text();
        const bidMatch = bidText.match(/(\d+)\s*bod/i);
        if (bidMatch) {
          bidCount = parseInt(bidMatch[1], 10);
        }

        // Extract closing date
        let endDate: Date | undefined;
        const closingText = $el.find(".auction-info").text();
        const dateMatch = closingText.match(/Sluit op\s+(\d{2})[-/.](\d{2})[-/.](\d{4})\s*(?:om|:)?\s*(\d{2}):(\d{2})/i);
        if (dateMatch) {
          const [, day, month, year, hour, minute] = dateMatch;
          endDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
        }

        items.push({
          url,
          title: title.substring(0, 500),
          imageUrl,
          currentPrice,
          bidCount,
        });
      });

      return items;
    }

    // Fallback: Look for any lot links on the page
    // IMPORTANT: We explicitly skip any items from "aanbevolen" or "advised" sections
    console.log(`    No .auction-item.data-1-lot found, looking for any /lot/ links (excluding aanbevolen)`);

    // First, collect all aanbevolen lot URLs to exclude
    const advisedLotUrls = new Set<string>();
    $(".aanbevolen a[href*='/lot/'], [class*='aanbevolen'] a[href*='/lot/'], figure.data-1-advised-lot a[href*='/lot/']").each((_, element) => {
      const href = $(element).attr("href");
      if (href) {
        const url = makeAbsoluteUrl(auctionBaseUrl, href);
        advisedLotUrls.add(url);
      }
    });
    console.log(`    Found ${advisedLotUrls.size} aanbevolen (recommended) lot URLs to exclude`);

    const lotLinks = $("a[href*='/lot/']");
    console.log(`    Found ${lotLinks.length} lot links total`);

    lotLinks.each((_, element) => {
      const href = $(element).attr("href");
      if (href) {
        const url = makeAbsoluteUrl(auctionBaseUrl, href);

        // Skip if this is an aanbevolen (recommended) item from another auction
        if (advisedLotUrls.has(url)) {
          console.log(`    Skipping aanbevolen item: ${url.substring(0, 80)}...`);
          return;
        }

        if (!seenUrls.has(url)) {
          seenUrls.add(url);

          const title = $(element).text().trim() ||
            $(element).closest("figure, div, li").find("figcaption, .title, h3, h4").first().text().trim() ||
            "Lot";

          const img = $(element).closest("figure, div, li").find("img[src]").first();
          const imageUrl = img.attr("src") || undefined;

          items.push({
            url,
            title: title.substring(0, 500),
            imageUrl,
          });
        }
      }
    });

    return items;
  }

  getFaviconUrl(websiteUrl: string): string {
    return makeAbsoluteUrl(websiteUrl, "/favicon.ico");
  }
}
