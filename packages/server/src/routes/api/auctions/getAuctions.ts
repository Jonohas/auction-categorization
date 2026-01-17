import type { Request, Response } from "express";
import { prisma } from "../../../lib/db";
import { sanitizeId, sanitizeSearchQuery, sanitizeProbability } from "../../../lib/sanitization";

export const getAuctions = async (req: Request, res: Response) => {
  try {
    const { scraperId, minProbability, maxProbability, search, sortBy, sortOrder } = req.query as {
      scraperId?: string;
      minProbability?: string;
      maxProbability?: string;
      search?: string;
      sortBy?: string;
      sortOrder?: string;
    };

    const where: Record<string, unknown> = {};

    // Sanitize and validate scraperId
    if (scraperId && scraperId !== "all") {
      const sanitizedScraperId = sanitizeId(scraperId);
      if (sanitizedScraperId) {
        where.scraperId = sanitizedScraperId;
      }
    }

    // Sanitize probabilities
    const minProb = sanitizeProbability(minProbability);
    const maxProb = sanitizeProbability(maxProbability);

    if (minProb !== undefined) {
      where.hardwareProbability = { gte: minProb };
    }

    if (maxProb !== undefined) {
      where.hardwareProbability = {
        ...((where.hardwareProbability as Record<string, unknown>) || {}),
        lte: maxProb,
      };
    }

    // Sanitize search query
    const sanitizedSearch = sanitizeSearchQuery(search);
    if (sanitizedSearch) {
      where.OR = [
        { title: { contains: sanitizedSearch } },
        { description: { contains: sanitizedSearch } },
      ];
    }

    // Sanitize sort parameters
    const sanitizedSortBy = sanitizeSearchQuery(sortBy);
    const sanitizedSortOrder = sanitizeSearchQuery(sortOrder);

    const orderBy: Record<string, "asc" | "desc"> = {};
    if (sanitizedSortBy === "probability") {
      orderBy.hardwareProbability = sanitizedSortOrder === "asc" ? "asc" : "desc";
    } else if (sanitizedSortBy === "date") {
      orderBy.createdAt = sanitizedSortOrder === "asc" ? "asc" : "desc";
    } else {
      orderBy.createdAt = "desc";
    }

    const auctions = await prisma.auction.findMany({
      where,
      include: {
        scraper: true,
        items: true,
      },
      orderBy,
    });
    res.json(auctions);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch auctions" });
  }
};
