import type { Request, Response } from "express";
import { prisma } from "../../../lib/db";
import { sanitizeId, sanitizeSearchQuery, sanitizeProbability } from "../../../lib/sanitization";

export const getItems = async (req: Request, res: Response) => {
  try {
    const { auctionId, minProbability, maxProbability, search, sortBy, sortOrder, page = "1", limit = "50" } = req.query as {
      auctionId?: string;
      minProbability?: string;
      maxProbability?: string;
      search?: string;
      sortBy?: string;
      sortOrder?: string;
      page?: string;
      limit?: string;
    };

    // Sanitize input
    const sanitizedAuctionId = sanitizeId(auctionId);

    if (!sanitizedAuctionId) {
      return res.status(400).json({ error: "Invalid auction ID" });
    }

    const where: Record<string, unknown> = {
      auctionId: sanitizedAuctionId,
    };

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

    // Parse pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    // Sanitize sort parameters
    const sanitizedSortBy = sanitizeSearchQuery(sortBy);
    const sanitizedSortOrder = sanitizeSearchQuery(sortOrder);

    const orderBy: Record<string, "asc" | "desc"> = {};
    if (sanitizedSortBy === "probability") {
      orderBy.hardwareProbability = sanitizedSortOrder === "asc" ? "asc" : "desc";
    } else if (sanitizedSortBy === "price") {
      orderBy.currentPrice = sanitizedSortOrder === "asc" ? "asc" : "desc";
    } else if (sanitizedSortBy === "date") {
      orderBy.createdAt = sanitizedSortOrder === "asc" ? "asc" : "desc";
    } else {
      orderBy.createdAt = "desc";
    }

    const [items, total] = await Promise.all([
      prisma.auctionItem.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
      }),
      prisma.auctionItem.count({ where }),
    ]);

    res.json({
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch items" });
  }
};
