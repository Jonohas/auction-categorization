import type { Request, Response } from "express";
import { prisma } from "../../../lib/db";
import { sanitizeId } from "../../../lib/sanitization";
import { categorizeItemsBulk } from "../../../services/aiCategorization";

export const categorizeItems = async (req: Request, res: Response) => {
  try {
    const { itemIds, saveResults = true } = req.body as { itemIds?: string[]; saveResults?: boolean };

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ error: "Item IDs array is required" });
    }

    // Sanitize item IDs
    const sanitizedItemIds = itemIds
      .map((id) => sanitizeId(id))
      .filter((id): id is string => id !== undefined);

    if (sanitizedItemIds.length === 0) {
      return res.status(400).json({ error: "Invalid item IDs" });
    }

    // Fetch the items
    const items = await prisma.auctionItem.findMany({
      where: { id: { in: sanitizedItemIds } },
    });

    if (items.length === 0) {
      return res.status(404).json({ error: "No items found" });
    }

    // Fetch all categories (including isSystem for fallback logic)
    const categories = await prisma.category.findMany({
      select: { id: true, name: true, description: true, isSystem: true },
    });

    if (categories.length === 0) {
      return res.status(400).json({ error: "No categories defined" });
    }

    // Categorize all items using bulk processing (single AI call per batch)
    const results = await categorizeItemsBulk(
      items.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
      })),
      categories
    );

    // Optionally save results to the database
    if (saveResults) {
      for (const result of results) {
        if (result.probabilities.length > 0) {
          // Delete existing probabilities for this item
          await prisma.categoryProbability.deleteMany({
            where: { itemId: result.itemId },
          });

          // Create new probabilities
          await prisma.categoryProbability.createMany({
            data: result.probabilities.map((p) => ({
              itemId: result.itemId,
              categoryId: p.categoryId,
              probability: p.probability,
            })),
          });

          // Set main category to the one with highest probability only if >= 50%
          const highestProbability = result.probabilities.reduce((max, p) =>
            p.probability > max.probability ? p : max
          );

          // Only set main category if probability is above 50%, otherwise clear it
          await prisma.auctionItem.update({
            where: { id: result.itemId },
            data: {
              mainCategoryId: highestProbability.probability >= 0.5
                ? highestProbability.categoryId
                : null,
            },
          });
        }
      }
    }

    res.json({
      itemCount: results.length,
      results,
      saved: saveResults,
    });
  } catch (error) {
    console.error("Error categorizing items:", error);
    res.status(500).json({ error: "Failed to categorize items" });
  }
};
