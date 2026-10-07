import { db } from "../../../db/db.ts";
import { auctions, auctionItem } from "../../../db/schema.ts";
import { eq } from "drizzle-orm";
import { enqueueCategorizationJob, toJobView } from "../../../services/categorizationJobs.ts";
import type { RouteHandler } from "../../../types/requestTypes.ts";

interface CategorizeAuctionBody {
  auctionId: string;
}

/**
 * POST /api/categorization/auction - Queue categorization of all items in an auction
 */
export const POST: RouteHandler = async (req) => {
  try {
    const body = await req.json() as CategorizeAuctionBody;
    const { auctionId } = body;

    if (!auctionId) {
      return Response.json({ error: "Invalid auction ID" }, { status: 400 });
    }

    const parsedAuctionId = parseInt(auctionId, 10);
    if (isNaN(parsedAuctionId)) {
      return Response.json({ error: "Invalid auction ID" }, { status: 400 });
    }

    const auction = await db.query.auctions.findFirst({
      where: eq(auctions.id, parsedAuctionId),
    });

    if (!auction) {
      return Response.json({ error: "Auction not found" }, { status: 404 });
    }

    const items = await db.query.auctionItem.findMany({
      columns: { id: true },
      where: eq(auctionItem.auctionId, parsedAuctionId),
    });

    if (items.length === 0) {
      return Response.json({ error: "Auction has no items" }, { status: 400 });
    }

    const category = await db.query.categories.findFirst();
    if (!category) {
      return Response.json({ error: "No categories defined" }, { status: 400 });
    }

    const job = await enqueueCategorizationJob({
      itemIds: items.map((item) => item.id),
      auctionId: auction.id,
    });
    return Response.json(toJobView(job), { status: 202 });
  } catch (error) {
    console.error("Error queueing auction categorization:", error);
    return Response.json({ error: "Failed to queue auction categorization" }, { status: 500 });
  }
};
