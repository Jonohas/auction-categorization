import type { Request, Response } from "express";
import { prisma } from "../../../lib/db";
import { sanitizeId } from "../../../lib/sanitization";
import { categorizeItem as categorizeItemService } from "../../../services/aiCategorization";

export const categorizeItem = async (req: Request, res: Response) => {
  try {
    const { itemId } = req.body as { itemId?: string };

    const sanitizedItemId = sanitizeId(itemId);

    if (!sanitizedItemId) {
      return res.status(400).json({ error: "Invalid item ID" });
    }

    // Fetch the item
    const item = await prisma.auctionItem.findUnique({
      where: { id: sanitizedItemId },
    });

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    // Fetch all categories (including isSystem for fallback logic)
    const categories = await prisma.category.findMany({
      select: { id: true, name: true, description: true, isSystem: true },
    });

    if (categories.length === 0) {
      return res.status(400).json({ error: "No categories defined" });
    }

    // Categorize the item
    const result = await categorizeItemService(
      {
        id: item.id,
        title: item.title,
        description: item.description,
      },
      categories
    );

    res.json(result);
  } catch (error) {
    console.error("Error categorizing item:", error);
    res.status(500).json({ error: "Failed to categorize item" });
  }
};
