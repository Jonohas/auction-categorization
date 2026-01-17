import type { Request, Response } from "express";
import { prisma } from "../../../lib/db";
import { sanitizeId } from "../../../lib/sanitization";

export const getCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.query as { id?: string };

    const sanitizedId = sanitizeId(id);

    if (!sanitizedId) {
      return res.status(400).json({ error: "Invalid category ID" });
    }

    const category = await prisma.category.findUnique({
      where: { id: sanitizedId },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json(category);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch category" });
  }
};
