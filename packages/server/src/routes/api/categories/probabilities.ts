import { db } from "../../../db/db.ts";
import { categories, auctionItem, categoryProbability } from "../../../db/schema.ts";
import { eq } from "drizzle-orm";
import type { RouteHandler } from "../../../types/requestTypes.ts";

interface SaveProbabilitiesBody {
  itemId: string;
  probabilities: Array<{ categoryId: string; probability: number }>;
}

/**
 * POST /api/categories/probabilities - Save item category probabilities
 */
export const POST: RouteHandler = async (req) => {
  try {
    const body = await req.json() as SaveProbabilitiesBody;
    const { itemId, probabilities } = body;

    if (!itemId) {
      return Response.json({ error: "Invalid item ID" }, { status: 400 });
    }

    if (!probabilities || !Array.isArray(probabilities)) {
      return Response.json({ error: "Probabilities array is required" }, { status: 400 });
    }

    const itemIdNum = parseInt(itemId, 10);
    if (isNaN(itemIdNum)) {
      return Response.json({ error: "Invalid item ID" }, { status: 400 });
    }

    // Verify item exists
    const item = await db.query.auctionItem.findFirst({
      where: eq(auctionItem.id, itemIdNum),
    });

    if (!item) {
      return Response.json({ error: "Item not found" }, { status: 404 });
    }

    // Delete existing probabilities
    const existingProbs = await db.query.categoryProbability.findMany({
      where: eq(categoryProbability.itemId, itemIdNum),
    });

    for (const prob of existingProbs) {
      await db.delete(categoryProbability).where(eq(categoryProbability.id, prob.id));
    }

    // Create new probabilities
    if (probabilities.length > 0) {
      for (const p of probabilities) {
        await db.insert(categoryProbability).values({
          itemId: itemIdNum,
          categoryId: parseInt(p.categoryId, 10),
          probability: p.probability,
        });
      }
    }

    // Set main category to the one with highest probability only if >= 50%
    if (probabilities.length > 0) {
      const highestProbability = probabilities.reduce((max, p) =>
        p.probability > max.probability ? p : max
      );

      // Only set main category if probability is above 50%
      if (highestProbability.probability >= 0.5) {
        await db.update(auctionItem).set({
          mainCategoryId: parseInt(highestProbability.categoryId, 10),
        }).where(eq(auctionItem.id, itemIdNum));
      }
    }

    // Get updated item with probabilities
    const updatedProbabilities = await db.query.categoryProbability.findMany({
      where: eq(categoryProbability.itemId, itemIdNum),
    });

    const probabilitiesWithCategories = await Promise.all(
      updatedProbabilities.map(async (prob) => {
        let category = null;
        if (prob.categoryId !== null) {
          category = await db.query.categories.findFirst({
            where: eq(categories.id, prob.categoryId),
          });
        }
        return {
          ...prob,
          category,
        };
      })
    );

    const updatedItem = await db.query.auctionItem.findFirst({
      where: eq(auctionItem.id, itemIdNum),
    });

    return Response.json({
      success: true,
      item: {
        ...updatedItem,
        categoryProbabilities: probabilitiesWithCategories.sort(
          (a, b) => (b.probability ?? 0) - (a.probability ?? 0)
        ),
      },
    });
  } catch (error) {
    console.error("Error saving category probabilities:", error);
    return Response.json({ error: "Failed to save category probabilities" }, { status: 500 });
  }
};
