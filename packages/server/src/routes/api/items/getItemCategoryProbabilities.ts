import type { Request, Response } from "express";
import { prisma } from "../../../lib/db";
import { sanitizeId } from "../../../lib/sanitization";

export const getItemCategoryProbabilities = async (req: Request, res: Response) => {
  try {
    const { itemId } = req.query as { itemId?: string };

    const sanitizedItemId = sanitizeId(itemId);

    if (!sanitizedItemId) {
      return res.status(400).json({ error: "Invalid item ID" });
    }

    const item = await prisma.auctionItem.findUnique({
      where: { id: sanitizedItemId },
      include: {
        mainCategory: true,
        categoryProbabilities: {
          include: { category: true },
          orderBy: { probability: "desc" },
        },
        auction: {
          include: { scraper: true },
        },
      },
    });

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json(item);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch item category probabilities" });
  }
};
