import type { Request, Response } from "express";
import { prisma } from "../../../lib/db";
import { sanitizeId } from "../../../lib/sanitization";

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.body as { id?: string };

    const sanitizedId = sanitizeId(id);

    if (!sanitizedId) {
      return res.status(400).json({ error: "Invalid category ID" });
    }

    const category = await prisma.category.findUnique({
      where: { id: sanitizedId },
    });

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Prevent deletion of system categories
    if (category.isSystem) {
      return res.status(403).json({ error: "System categories cannot be deleted" });
    }

    // Remove mainCategoryId from items first
    await prisma.auctionItem.updateMany({
      where: { mainCategoryId: sanitizedId },
      data: { mainCategoryId: null },
    });

    // Delete all category probabilities
    await prisma.categoryProbability.deleteMany({
      where: { categoryId: sanitizedId },
    });

    await prisma.category.delete({
      where: { id: sanitizedId },
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete category" });
  }
};
