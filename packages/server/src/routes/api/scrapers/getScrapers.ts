import type { Request, Response } from "express";
import { getScrapers as getScrapersService } from "../../../services/scrapingService";

export const getScrapers = async (req: Request, res: Response) => {
  try {
    const scrapers = await getScrapersService();
    res.json(scrapers);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch scrapers" });
  }
};
