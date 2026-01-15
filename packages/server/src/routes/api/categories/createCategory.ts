import type { Request, Response } from "express";
import { prisma } from "../../../lib/db";

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body as { name?: string; description?: string };

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: "Category name is required" });
    }

    // Check if category already exists
    const existing = await prisma.category.findUnique({
      where: { name: name.trim() },
    });

    if (existing) {
      return res.status(400).json({ error: "Category with this name already exists" });
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    });

    res.json({ success: true, category });
  } catch (error) {
    res.status(500).json({ error: "Failed to create category" });
  }
};
