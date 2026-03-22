import { db } from "../../../db/db.ts";
import { categories, auctionItem } from "../../../db/schema.ts";
import { eq } from "drizzle-orm";
import type { RouteHandler } from "../../../types/requestTypes.ts";

interface SetMainCategoryBody {
  itemId: string;
  categoryId: string | null;
}

/**
 * PUT /api/categories/main-category - Set item's main category
 */
export const PUT: RouteHandler = async (req) => {
  try {
    const body = await req.json() as SetMainCategoryBody;
    const { itemId, categoryId } = body;

    if (!itemId) {
      return Response.json({ error: "Invalid item ID" }, { status: 400 });
    }

    const itemIdNum = parseInt(itemId, 10);
    if (isNaN(itemIdNum)) {
      return Response.json({ error: "Invalid item ID" }, { status: 400 });
    }

    // If categoryId is provided, verify it exists
    if (categoryId !== null && categoryId !== undefined) {
      const parsedCategoryId = parseInt(categoryId, 10);
      if (isNaN(parsedCategoryId)) {
        return Response.json({ error: "Invalid category ID" }, { status: 400 });
      }

      const category = await db.query.categories.findFirst({
        where: eq(categories.id, parsedCategoryId),
      });

      if (!category) {
        return Response.json({ error: "Category not found" }, { status: 404 });
      }

      await db.update(auctionItem).set({
        mainCategoryId: parsedCategoryId,
      }).where(eq(auctionItem.id, itemIdNum));
    } else {
      // Clear main category
      await db.update(auctionItem).set({
        mainCategoryId: null,
      }).where(eq(auctionItem.id, itemIdNum));
    }

    const updatedItem = await db.query.auctionItem.findFirst({
      where: eq(auctionItem.id, itemIdNum),
    });

    return Response.json({ success: true, item: updatedItem });
  } catch (error) {
    console.error("Error setting main category:", error);
    return Response.json({ error: "Failed to set item main category" }, { status: 500 });
  }
};
