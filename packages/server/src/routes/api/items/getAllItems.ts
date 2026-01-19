import type { Request, Response } from "express";
import { prisma } from "../../../lib/db";
import {
  sanitizeId,
  sanitizeSearchQuery,
  sanitizeProbability,
} from "../../../lib/sanitization";

export const getAllItems = async (req: Request, res: Response) => {
  try {
    const {
      search,
      categoryIds,
      minProbability,
      scraperIds,
      maxPrice,
      sortBy,
      sortOrder,
      page = "1",
      limit = "100",
    } = req.query as Record<string, string | undefined>;

    // Build where clause
    const where: Record<string, unknown> = {};

    // Title/description search
    const sanitizedSearch = sanitizeSearchQuery(search);
    if (sanitizedSearch) {
      where.OR = [
        { title: { contains: sanitizedSearch } },
        { description: { contains: sanitizedSearch } },
      ];
    }

    // Category filter (multi-select via comma-separated IDs)
    if (categoryIds) {
      const catIds = categoryIds
        .split(",")
        .map((id) => sanitizeId(id.trim()))
        .filter((id): id is string => id !== undefined);
      if (catIds.length > 0) {
        where.mainCategoryId = { in: catIds };
      }
    }

    // Minimum probability filter (based on main category probability)
    // Find items where their CategoryProbability for their mainCategoryId meets the threshold
    const minProb = sanitizeProbability(minProbability);
    if (minProb !== undefined) {
      // Get item IDs that meet the probability threshold for their main category
      const itemsWithMinProb = await prisma.categoryProbability.findMany({
        where: {
          probability: { gte: minProb },
          item: {
            mainCategoryId: { not: null },
          },
        },
        select: {
          itemId: true,
          categoryId: true,
          item: {
            select: {
              mainCategoryId: true,
            },
          },
        },
      });
      // Filter to only items where categoryId matches the item's mainCategoryId
      const itemIds = itemsWithMinProb
        .filter((cp) => cp.categoryId === cp.item.mainCategoryId)
        .map((cp) => cp.itemId);
      where.id = { in: itemIds };
    }

    // Scraper filter (multi-select via comma-separated IDs)
    if (scraperIds) {
      const scrIds = scraperIds
        .split(",")
        .map((id) => sanitizeId(id.trim()))
        .filter((id): id is string => id !== undefined);
      if (scrIds.length > 0) {
        where.auction = { scraperId: { in: scrIds } };
      }
    }

    // Max price filter
    if (maxPrice) {
      const maxPriceNum = parseFloat(maxPrice);
      if (!isNaN(maxPriceNum) && maxPriceNum >= 0) {
        where.currentPrice = { lte: maxPriceNum };
      }
    }

    // Pagination with upper bound protection
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 100));
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const sanitizedSortBy = sanitizeSearchQuery(sortBy);
    const sanitizedSortOrder = sanitizeSearchQuery(sortOrder);
    const orderBy: Record<string, "asc" | "desc"> = {};

    if (sanitizedSortBy === "price") {
      orderBy.currentPrice = sanitizedSortOrder === "asc" ? "asc" : "desc";
    } else if (sanitizedSortBy === "probability") {
      // Note: Sorting by main category probability requires post-processing
      // since it's stored in CategoryProbability, not directly on AuctionItem.
      // For now, we'll sort by createdAt and let the client handle probability sorting.
      orderBy.createdAt = sanitizedSortOrder === "asc" ? "asc" : "desc";
    } else {
      // Default: sort by date
      orderBy.createdAt = sanitizedSortOrder === "asc" ? "asc" : "desc";
    }

    const [items, total] = await Promise.all([
      prisma.auctionItem.findMany({
        where,
        include: {
          mainCategory: true,
          auction: {
            include: {
              scraper: true,
            },
          },
          categoryProbabilities: {
            include: {
              category: true,
            },
            orderBy: { probability: "desc" },
          },
        },
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
    console.error("Failed to fetch all items:", error);
    res.status(500).json({ error: "Failed to fetch items" });
  }
};
