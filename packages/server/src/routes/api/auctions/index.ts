import {db} from "../../../db/db.ts";

export const GET = async (req: Request) => {
  try {
    const auctionsResult = await db.query.auctions.findMany();
    return Response.json(auctionsResult);
  } catch (error) {
    console.log(error);
    return new Response("Not Found", { status: 500 });
  }
};
