import type { Request, Response } from "express";
import { prisma } from "../../../lib/db";
import { sanitizeId } from "../../../lib/sanitization";
import { categorizeAuctionItems } from "../../../services/aiCategorization";

export const categorizeAuction = async (req: Request, res: Response) => {
  try {
    const { auctionId, saveResults = true } = req.body as {
      auctionId?: string;
      saveResults?: boolean;
    };

    const sanitizedAuctionId = sanitizeId(auctionId);

    if (!sanitizedAuctionId) {
      return res.status(400).json({ error: "Invalid auction ID" });
    }

    // Fetch the auction with items
    const auction = await prisma.auction.findUnique({
      where: { id: sanitizedAuctionId },
      include: {
        items: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
      },
    });

    if (!auction) {
      return res.status(404).json({ error: "Auction not found" });
    }

    if (auction.items.length === 0) {
      return res.status(400).json({ error: "Auction has no items" });
    }

    // Fetch all categories (including isSystem for fallback logic)
    const categories = await prisma.category.findMany({
      select: { id: true, name: true, description: true, isSystem: true },
    });

    if (categories.length === 0) {
      return res.status(400).json({ error: "No categories defined" });
    }

    // Categorize all items in the auction
    const results = await categorizeAuctionItems(
      auction.id,
      auction.items.map((item) => ({
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
      auctionId: auction.id,
      itemCount: results.length,
      results,
      saved: saveResults,
    });
  } catch (error) {
    console.error("Error categorizing auction:", error);
    res.status(500).json({ error: "Failed to categorize auction" });
  }
};
