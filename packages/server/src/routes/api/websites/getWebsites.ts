import type { Request, Response } from "express";
import { getScrapers } from "../../../services/scrapingService";

export const getWebsites = async (req: Request, res: Response) => {
  try {
    const scrapers = await getScrapers();
    res.json(scrapers);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch websites" });
  }
};
