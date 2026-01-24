import type {RouteHandler} from "../../../types/requestTypes.ts";

export const GET: RouteHandler = async (req) => {
    try {
        console.log(req.params);

        // const auction = await db.select().from(auctions).where(eq(auctions.id, id))
        return Response.json({data: `auctions! ${req.params.id}`});
    } catch (error) {
        return Response.json({ error: error, code: 500 });
    }
};