import type { Request, Response } from "express";
import { prisma } from "../../../lib/db";

export const getStats = async (req: Request, res: Response) => {
  try {
    const [scraperCount, auctionCount, itemCount] = await Promise.all([
      prisma.scraper.count(),
      prisma.auction.count(),
      prisma.auctionItem.count(),
    ]);

    const avgProbability = await prisma.auction.aggregate({
      _avg: { hardwareProbability: true },
    });

    const enabledScrapers = await prisma.scraper.count({
      where: { enabled: true },
    });

    res.json({
      scraperCount,
      auctionCount,
      itemCount,
      avgProbability: avgProbability._avg.hardwareProbability || 0,
      enabledScrapers,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};
