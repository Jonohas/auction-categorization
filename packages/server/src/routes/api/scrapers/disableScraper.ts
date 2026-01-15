import type { Request, Response } from "express";
import { sanitizeId } from "../../../lib/sanitization";
import { disableScraper as disableScraperService } from "../../../services/scrapingService";

export const disableScraper = async (req: Request, res: Response) => {
  try {
    const { scraperId } = req.body as { scraperId?: string };

    // Sanitize input
    const sanitizedScraperId = sanitizeId(scraperId);

    if (!sanitizedScraperId) {
      return res.status(400).json({ error: "Invalid scraper ID" });
    }

    const success = await disableScraperService(sanitizedScraperId);
    res.json({ success });
  } catch (error) {
    res.status(500).json({ error: "Failed to disable scraper" });
  }
};
