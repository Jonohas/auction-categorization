import type { Request, Response } from "express";
import { prisma } from "../../../lib/db";

export const getFilterOptions = async (_req: Request, res: Response) => {
  try {
    const [categories, scrapers] = await Promise.all([
      prisma.category.findMany({
        select: {
          id: true,
          name: true,
          _count: { select: { items: true } },
        },
        orderBy: { name: "asc" },
      }),
      prisma.scraper.findMany({
        where: { enabled: true },
        select: {
          id: true,
          name: true,
          imageUrl: true,
        },
        orderBy: { name: "asc" },
      }),
    ]);

    res.json({
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        itemCount: c._count.items,
      })),
      scrapers,
    });
  } catch (error) {
    console.error("Failed to fetch filter options:", error);
    res.status(500).json({ error: "Failed to fetch filter options" });
  }
};
