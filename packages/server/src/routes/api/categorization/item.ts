import { db } from "../../../db/db.ts";
import { auctionItem, categories } from "../../../db/schema.ts";
import { eq } from "drizzle-orm";
import { categorizeItem as categorizeItemService } from "../../../services/aiCategorization.ts";
import type { RouteHandler } from "../../../types/requestTypes.ts";

interface CategorizeItemBody {
  itemId: string;
}

/**
 * POST /api/categorization/item - Categorize a single item
 */
export const POST: RouteHandler = async (req) => {
  try {
    const body = await req.json() as CategorizeItemBody;
    const { itemId } = body;

    if (!itemId) {
      return Response.json({ error: "Invalid item ID" }, { status: 400 });
    }

    const itemIdNum = parseInt(itemId, 10);
    if (isNaN(itemIdNum)) {
      return Response.json({ error: "Invalid item ID" }, { status: 400 });
    }

    // Fetch the item
    const item = await db.query.auctionItem.findFirst({
      where: eq(auctionItem.id, itemIdNum),
    });

    if (!item) {
      return Response.json({ error: "Item not found" }, { status: 404 });
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

    // Categorize the item
    const result = await categorizeItemService(
      {
        id: item.id.toString(),
        title: item.title,
        description: item.description,
      },
      categoriesForAI
    );

    return Response.json(result);
  } catch (error) {
    console.error("Error categorizing item:", error);
    return Response.json({ error: "Failed to categorize item" }, { status: 500 });
  }
};
