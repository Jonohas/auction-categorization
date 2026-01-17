import type { Request, Response } from "express";
import { prisma } from "../../../lib/db";

export const getStats = async (req: Request, res: Response) => {
  try {
    const [scraperCount, auctionCount, itemCount, categoryProbabilityCount, enabledScrapers, avgProbability] = await Promise.all([
      prisma.scraper.count(),
      prisma.auction.count(),
      prisma.auctionItem.count(),
      prisma.categoryProbability.count(),
      prisma.scraper.count({ where: { enabled: true } }),
      prisma.auction.aggregate({ _avg: { hardwareProbability: true } }),
    ]);

    res.json({
      scraperCount,
      auctionCount,
      itemCount,
      categoryProbabilityCount,
      avgProbability: avgProbability._avg.hardwareProbability || 0,
      enabledScrapers,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};
