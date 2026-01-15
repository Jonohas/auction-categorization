import * as cheerio from "cheerio";
import type { Scraper, ScrapedAuction, ScrapedAuctionItem } from "./index";

// Utility functions duplicated to avoid circular dependency
async function fetchHtml(url: string | URL | Request): Promise<string> {
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

    // Look for links that contain /auction/
    const urls: Set<string> = new Set(
      $('a[href*="/auction/"]').map(
        (_, el) => makeAbsoluteUrl(websiteUrl, $(el).attr("href")!)
      ).get()
    );
    console.log(`Found ${urls.size} auction items on BOPA listing page`);

    // Scrape each auction page to get items
    for (const url of urls) {
      // simplest way of filtering these stupid recommendations
      if (!url.includes('lots')) {
        continue;
      }

      console.log(`Scraping auction: ${url}`);
      const auctionDetails = await this.scrapeAuctionDetails(url);

      if (auctionDetails) {
        auctions.push({
          url: auctionDetails.url,
          title: auctionDetails.title,
          description: auctionDetails.description,
          items: auctionDetails.items
        });
      }
    }

    return auctions;
  }

  /**
   * Scrape detailed auction page including all lots/items with pagination
   */
  private async scrapeAuctionDetails(auctionUrl: string): Promise<ScrapedAuction | null> {
    const html = await fetchHtml(auctionUrl);
    const $ = cheerio.load(html);

    const title = $("h1").text().trim();
    const description = $("#auction-info-container > div > p").text().trim();

    const startDateRegex = /Opent.*?(?<day>\d\d)-(?<month>\d\d)-(?<year>\d{4}).*?(?<time>\d\d:\d\d)/gm;
    const endDateRegex = /Sluit.*?(?<day>\d\d)-(?<month>\d\d)-(?<year>\d{4}).*?(?<time>\d\d:\d\d)/gm;

    const getDate = (regex: RegExp, data: string) => {
      const { groups } = regex.exec(data) as RegExpExecArray & {
        groups: {
          day: string,
          month: string,
          year: string,
          time: string,
        },
      } | null ?? {};

      return groups
        ? new Date(`${groups.year}-${groups.month}-${groups.day}T${groups.time}`)
        : undefined; // no start/end date??
    };

    const generalInformation = $(".auction-info-content > p").text();
    const startDate = getDate(startDateRegex, generalInformation);
    const endDate = getDate(endDateRegex, generalInformation);

    const auctionDetails: ScrapedAuction = {
      url: auctionUrl,
      title,
      description,
      startDate,
      endDate,
      items: this.parseAuctionItems($, auctionUrl) // its already in our context why not use it?
    };

    const getLastPageNumber = (): number => {
      const lastPageUrl = $($("[aria-label*='Pagination Navigation'] a").get(-2)).attr('href')?.trim();
      if (!lastPageUrl) {
        return 1;
      }

      const pageNumber = new URL(lastPageUrl).searchParams.get('page');
      if (!pageNumber) {
        return 1;
      }

      return parseInt(pageNumber);
    };
    const lastPage = getLastPageNumber();

    const pageUrl = new URL(auctionUrl);
    // we're starting from page 2 as page one is already parsed on our initial fetch
    for (let pageNumber = 2; pageNumber <= lastPage; ++pageNumber) {
      try {
        pageUrl.searchParams.set("page", pageNumber.toString());

        const html = await fetchHtml(pageUrl);
        const $ = cheerio.load(html);

        // Scrape lots/items from this page
        const pageItems = this.parseAuctionItems($, auctionUrl);
        auctionDetails.items.push(...pageItems);
      } catch (error) {
        console.error(`  Error scraping page ${pageNumber}:`, error);
        break;
      }
    }

    console.log(`  Total items found: ${auctionDetails.items.length}`);
    return auctionDetails as ScrapedAuction;
  }

  /**
   * Parse auction items from an auction detail page
   * BOPA uses .auction-item.data-1-lot for main lots
   * NOTE: We explicitly exclude "aanbevolen" (recommended) items as they are from other auctions
   */
  private parseAuctionItems($: cheerio.CheerioAPI, auctionBaseUrl: string): ScrapedAuctionItem[] {
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
        if (bidMatch && bidMatch[1]) {
          bidCount = parseInt(bidMatch[1], 10);
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
