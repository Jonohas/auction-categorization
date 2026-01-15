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

type DateRegexArrayResult = RegExpExecArray & {
  groups: {
    day: string,
    month: string,
    year: string,
    time: string,
  },
} | null;
type BidCountRegexArrayResult = RegExpExecArray & {
  groups: {
    bidCount: string,
  },
} | null;

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
      const { groups } = regex.exec(data) as DateRegexArrayResult ?? {};

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
  private parseAuctionItems($: cheerio.CheerioAPI, baseUrl: string): ScrapedAuctionItem[] {
    const lotElements = $(".auction-item");
    if (lotElements.length === 0) {
      return [];
    }

    console.log(`    Found ${lotElements.length} lots with .auction-item.data-1-lot selector`);
    const items = lotElements.map((_, element): ScrapedAuctionItem | null => {
      const $el = $(element);

      // find nearest auction lot link
      const href = $el.find("a").first().attr("href");
      if (!href) {
        return null;
      }
      const url = makeAbsoluteUrl(baseUrl, href);

      // find nearest h5 title
      const title = $el.find("h5").text().trim();
      if (!title) {
        return null;
      }

      // find image url, this one could potentially be undefined but that's fine
      const imageUrl = $el.find("img").first().attr("src");

      // Extract current price from .bid-amount
      const currentPrice = parseInt($el.find(".bid-amount").text().trim());

      // Extract bid count from auction-info
      const bidText = $el.find(".auction-info").text();
      const bidCountRegex = /(?<bidCount>\d+) bod|(\d+) biedingen/gm;
      const { groups } = bidCountRegex.exec(bidText) as BidCountRegexArrayResult ?? {};
      const bidCount = parseInt(groups?.bidCount ?? "0");

      return {
        url,
        title,
        description: undefined, // TODO: parse in the future
        imageUrl,
        currentPrice,
        bidCount
      };
    }).get();

    return items.filter((val) => val !== null);
  }

  getFaviconUrl(websiteUrl: string): string {
    return makeAbsoluteUrl(websiteUrl, "/favicon.ico");
  }
}
