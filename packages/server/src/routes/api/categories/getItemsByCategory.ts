import type { Request, Response } from "express";
import { prisma } from "../../../lib/db";
import { sanitizeId } from "../../../lib/sanitization";

export const getItemsByCategory = async (req: Request, res: Response) => {
  try {
    const { categoryId, page = "1", limit = "50" } = req.query as {
      categoryId?: string;
      page?: string;
      limit?: string;
    };

    const sanitizedCategoryId = sanitizeId(categoryId);

    if (!sanitizedCategoryId) {
      return res.status(400).json({ error: "Invalid category ID" });
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: sanitizedCategoryId },
    });

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Parse pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      prisma.auctionItem.findMany({
        where: { mainCategoryId: sanitizedCategoryId },
        include: {
          auction: {
            include: {
              scraper: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.auctionItem.count({ where: { mainCategoryId: sanitizedCategoryId } }),
    ]);

    res.json({
      category,
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch items by category" });
  }
};
