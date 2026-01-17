import type { Request, Response } from "express";
import { prisma } from "../../../lib/db";
import { sanitizeId } from "../../../lib/sanitization";

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id, name, description } = req.body as { id?: string; name?: string; description?: string | null };

    const sanitizedId = sanitizeId(id);

    if (!sanitizedId) {
      return res.status(400).json({ error: "Invalid category ID" });
    }

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: "Category name is required" });
    }

    // Check if category exists
    const existing = await prisma.category.findUnique({
      where: { id: sanitizedId },
    });

    if (!existing) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Prevent renaming system categories
    if (existing.isSystem && name.trim() !== existing.name) {
      return res.status(403).json({ error: "System categories cannot be renamed" });
    }

    // Check for duplicate name
    const duplicate = await prisma.category.findFirst({
      where: {
        name: name.trim(),
        id: { not: sanitizedId },
      },
    });

    if (duplicate) {
      return res.status(400).json({ error: "Category with this name already exists" });
    }

    const category = await prisma.category.update({
      where: { id: sanitizedId },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    });

    res.json({ success: true, category });
  } catch (error) {
    res.status(500).json({ error: "Failed to update category" });
  }
};
