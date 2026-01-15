import type { Request, Response } from "express";
import { scrapeAllWebsites } from "../../../services/scrapingService";

export const triggerScrape = async (req: Request, res: Response) => {
  try {
    const results = await scrapeAllWebsites();
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: "Failed to trigger scraping" });
  }
};
