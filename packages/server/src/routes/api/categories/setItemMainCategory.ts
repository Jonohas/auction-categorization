import type { Request, Response } from "express";
import { prisma } from "../../../lib/db";
import { sanitizeId } from "../../../lib/sanitization";

export const setItemMainCategory = async (req: Request, res: Response) => {
  try {
    const { itemId, categoryId } = req.body as { itemId?: string; categoryId?: string | null };

    const sanitizedItemId = sanitizeId(itemId);

    if (!sanitizedItemId) {
      return res.status(400).json({ error: "Invalid item ID" });
    }

    if (categoryId !== null) {
      const sanitizedCategoryId = sanitizeId(categoryId);
      if (!sanitizedCategoryId) {
        return res.status(400).json({ error: "Invalid category ID" });
      }

      // Verify category exists
      const category = await prisma.category.findUnique({
        where: { id: sanitizedCategoryId },
      });

      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
    }

    const item = await prisma.auctionItem.update({
      where: { id: sanitizedItemId },
      data: { mainCategoryId: categoryId || null },
    });

    res.json({ success: true, item });
  } catch (error) {
    res.status(500).json({ error: "Failed to set item main category" });
  }
};
