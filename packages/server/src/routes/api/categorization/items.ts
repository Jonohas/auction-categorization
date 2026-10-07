import { db } from "../../../db/db.ts";
import { auctionItem } from "../../../db/schema.ts";
import { inArray } from "drizzle-orm";
import { enqueueCategorizationJob, toJobView } from "../../../services/categorizationJobs.ts";
import type { RouteHandler } from "../../../types/requestTypes.ts";

interface CategorizeItemsBody {
  itemIds: string[];
}

/**
 * POST /api/categorization/items - Queue bulk categorization of multiple items
 */
export const POST: RouteHandler = async (req) => {
  try {
    const body = await req.json() as CategorizeItemsBody;
    const { itemIds } = body;

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return Response.json({ error: "Item IDs array is required" }, { status: 400 });
    }

    const parsedItemIds = itemIds
      .map((id) => parseInt(id, 10))
      .filter((id) => !isNaN(id));

    if (parsedItemIds.length === 0) {
      return Response.json({ error: "Invalid item IDs" }, { status: 400 });
    }

    const items = await db.query.auctionItem.findMany({
      columns: { id: true },
      where: inArray(auctionItem.id, parsedItemIds),
    });

    if (items.length === 0) {
      return Response.json({ error: "No items found" }, { status: 404 });
    }

    const category = await db.query.categories.findFirst();
    if (!category) {
      return Response.json({ error: "No categories defined" }, { status: 400 });
    }

    const job = await enqueueCategorizationJob({ itemIds: items.map((item) => item.id) });
    return Response.json(toJobView(job), { status: 202 });
  } catch (error) {
    console.error("Error queueing items categorization:", error);
    return Response.json({ error: "Failed to queue items categorization" }, { status: 500 });
  }
};
