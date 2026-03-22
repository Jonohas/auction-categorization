import { db } from "../../../db/db.ts";
import { categories, auctionItem } from "../../../db/schema.ts";
import { eq, sql, count } from "drizzle-orm";
import type { RouteHandler } from "../../../types/requestTypes.ts";

/**
 * GET /api/categories - List all categories
 */
export const GET: RouteHandler = async (req) => {
  try {
    const categoriesResult = await db.query.categories.findMany({
      orderBy: (categories, { asc }) => [asc(categories.name)],
    });

    // Get item count for each category using SQL count
    const categoriesWithCounts = await Promise.all(
      categoriesResult.map(async (category) => {
        const countResult = await db
          .select({ count: count() })
          .from(auctionItem)
          .where(eq(auctionItem.mainCategoryId, category.id));
        return {
          ...category,
          itemCount: countResult[0]?.count || 0,
        };
      })
    );

    return Response.json(categoriesWithCounts);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return Response.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
};
