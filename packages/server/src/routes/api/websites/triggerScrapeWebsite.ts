import type { Request, Response } from "express";
import { sanitizeId } from "../../../lib/sanitization";
import { scrapeWebsite } from "../../../services/scrapingService";

export const triggerScrapeWebsite = async (req: Request, res: Response) => {
  try {
    const { websiteId } = req.body as { websiteId?: string };

    // Sanitize input
    const sanitizedWebsiteId = sanitizeId(websiteId);

    if (!sanitizedWebsiteId) {
      return res.status(400).json({ error: "Invalid website ID" });
    }

    const result = await scrapeWebsite(sanitizedWebsiteId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to trigger scraping" });
  }
};
