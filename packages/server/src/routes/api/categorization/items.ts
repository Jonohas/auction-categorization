import { db } from "../../../db/db.ts";
import { auctionItem, categories, categoryProbability } from "../../../db/schema.ts";
import { eq, inArray } from "drizzle-orm";
import { categorizeItemsBulk } from "../../../services/aiCategorization.ts";
import type { RouteHandler } from "../../../types/requestTypes.ts";

interface CategorizeItemsBody {
  itemIds: string[];
  saveResults?: boolean;
}

/**
 * POST /api/categorization/items - Bulk categorize multiple items
 */
export const POST: RouteHandler = async (req) => {
  try {
    const body = await req.json() as CategorizeItemsBody;
    const { itemIds, saveResults = true } = body;

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return Response.json({ error: "Item IDs array is required" }, { status: 400 });
    }

    // Parse and validate item IDs
    const parsedItemIds = itemIds
      .map((id) => parseInt(id, 10))
      .filter((id) => !isNaN(id));

    if (parsedItemIds.length === 0) {
      return Response.json({ error: "Invalid item IDs" }, { status: 400 });
    }

    // Fetch the items
    const items = await db.query.auctionItem.findMany({
      where: inArray(auctionItem.id, parsedItemIds),
    });

    if (items.length === 0) {
      return Response.json({ error: "No items found" }, { status: 404 });
    }

    // Fetch all categories
    const allCategories = await db.query.categories.findMany();

    if (allCategories.length === 0) {
      return Response.json({ error: "No categories defined" }, { status: 400 });
    }

    const categoriesForAI = allCategories.map((c) => ({
      id: c.id.toString(),
      name: c.name,
      description: c.description ?? null,
      isSystem: c.isSystem ?? false,
    }));

    // Categorize all items using bulk processing
    const results = await categorizeItemsBulk(
      items.map((item) => ({
        id: item.id.toString(),
        title: item.title,
        description: item.description,
      })),
      categoriesForAI
    );

    // Optionally save results to the database
    if (saveResults) {
      for (const result of results) {
        if (result.probabilities.length > 0) {
          const itemIdNum = parseInt(result.itemId, 10);

          // Delete existing probabilities for this item
          const existingProbs = await db.query.categoryProbability.findMany({
            where: eq(categoryProbability.itemId, itemIdNum),
          });

          for (const prob of existingProbs) {
            await db.delete(categoryProbability).where(eq(categoryProbability.id, prob.id));
          }

          // Create new probabilities
          for (const p of result.probabilities) {
            await db.insert(categoryProbability).values({
              itemId: itemIdNum,
              categoryId: parseInt(p.categoryId, 10),
              probability: p.probability,
            });
          }

          // Set main category to the one with highest probability only if >= 50%
          const highestProbability = result.probabilities.reduce((max, p) =>
            p.probability > max.probability ? p : max
          );

          // Only set main category if probability is above 50%, otherwise clear it
          await db.update(auctionItem).set({
            mainCategoryId: highestProbability.probability >= 0.5
              ? parseInt(highestProbability.categoryId, 10)
              : null,
          }).where(eq(auctionItem.id, itemIdNum));
        }
      }
    }

    return Response.json({
      itemCount: results.length,
      results,
      saved: saveResults,
    });
  } catch (error) {
    console.error("Error categorizing items:", error);
    return Response.json({ error: "Failed to categorize items" }, { status: 500 });
  }
};
