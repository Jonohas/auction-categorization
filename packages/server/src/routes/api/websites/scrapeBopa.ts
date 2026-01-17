import type { Request, Response } from "express";
import { BopaScraper } from "../../../scrapers/bopaScraper";

export const scrapeBopa = async (req: Request, res: Response) => {
  try {
    const scraper = new BopaScraper();
    const auctions = await scraper.scrape("https://www.bopa.be");
    res.json({
      auctions,
      lastUpdated: new Date().toISOString(),
      source: "https://www.bopa.be",
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to scrape BOPA" });
  }
};
