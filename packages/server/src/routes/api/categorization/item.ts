import { db } from "../../../db/db.ts";
import { auctionItem } from "../../../db/schema.ts";
import { eq } from "drizzle-orm";
import { enqueueCategorizationJob, toJobView } from "../../../services/categorizationJobs.ts";
import type { RouteHandler } from "../../../types/requestTypes.ts";

interface CategorizeItemBody {
  itemId: string;
}

/**
 * POST /api/categorization/item - Queue categorization of a single item
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

    const item = await db.query.auctionItem.findFirst({
      where: eq(auctionItem.id, itemIdNum),
    });

    if (!item) {
      return Response.json({ error: "Item not found" }, { status: 404 });
    }

    const category = await db.query.categories.findFirst();
    if (!category) {
      return Response.json({ error: "No categories defined" }, { status: 400 });
    }

    const job = await enqueueCategorizationJob({ itemIds: [item.id] });
    return Response.json(toJobView(job), { status: 202 });
  } catch (error) {
    console.error("Error queueing item categorization:", error);
    return Response.json({ error: "Failed to queue item categorization" }, { status: 500 });
  }
};
