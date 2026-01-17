import type { Request, Response } from "express";
import { prisma } from "../../../lib/db";
import { sanitizeId } from "../../../lib/sanitization";

export const getAuction = async (req: Request, res: Response) => {
  try {
    const { id } = req.query as { id?: string };

    // Sanitize input
    const sanitizedId = sanitizeId(id);

    if (!sanitizedId) {
      return res.status(400).json({ error: "Invalid auction ID" });
    }

    const auction = await prisma.auction.findUnique({
      where: { id: sanitizedId },
      include: {
        scraper: true,
        items: {
          include: {
            mainCategory: true,
            categoryProbabilities: {
              include: { category: true },
              orderBy: { probability: "desc" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    res.json(auction);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch auction" });
  }
};
