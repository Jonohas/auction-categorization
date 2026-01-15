import type { Request, Response } from "express";
import { prisma } from "../../../lib/db";
import { sanitizeId } from "../../../lib/sanitization";

export const saveItemCategoryProbabilities = async (req: Request, res: Response) => {
  try {
    const { itemId, probabilities } = req.body as {
      itemId?: string;
      probabilities?: Array<{ categoryId: string; probability: number }>;
    };

    const sanitizedItemId = sanitizeId(itemId);

    if (!sanitizedItemId) {
      return res.status(400).json({ error: "Invalid item ID" });
    }

    if (!probabilities || !Array.isArray(probabilities)) {
      return res.status(400).json({ error: "Probabilities array is required" });
    }

    // Verify item exists
    const item = await prisma.auctionItem.findUnique({
      where: { id: sanitizedItemId },
    });

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    // Delete existing probabilities
    await prisma.categoryProbability.deleteMany({
      where: { itemId: sanitizedItemId },
    });

    // Create new probabilities
    await prisma.categoryProbability.createMany({
      data: probabilities.map((p) => ({
        itemId: sanitizedItemId,
        categoryId: p.categoryId,
        probability: p.probability,
      })),
    });

    // Set main category to the one with highest probability only if >= 50%
    if (probabilities.length > 0) {
      const highestProbability = probabilities.reduce((max, p) =>
        p.probability > max.probability ? p : max
      );

      // Only set main category if probability is above 50%
      if (highestProbability.probability >= 0.5) {
        await prisma.auctionItem.update({
          where: { id: sanitizedItemId },
          data: { mainCategoryId: highestProbability.categoryId },
        });
      }
    }

    const updatedItem = await prisma.auctionItem.findUnique({
      where: { id: sanitizedItemId },
      include: {
        categoryProbabilities: {
          include: { category: true },
        },
      },
    });

    res.json({ success: true, item: updatedItem });
  } catch (error) {
    res.status(500).json({ error: "Failed to save category probabilities" });
  }
};
