import { db } from "../../../db/db.ts";
import { categories } from "../../../db/schema.ts";
import { eq } from "drizzle-orm";
import type { RouteHandler } from "../../../types/requestTypes.ts";

/**
 * POST /api/categories - Create a new category
 */
export const POST: RouteHandler = async (req) => {
  try {
    const body = await req.json() as { name?: string; description?: string };

    const { name, description } = body;

    if (!name || name.trim().length === 0) {
      return Response.json({ error: "Category name is required" }, { status: 400 });
    }

    // Check if category already exists
    const existing = await db.query.categories.findFirst({
      where: eq(categories.name, name.trim()),
    });

    if (existing) {
      return Response.json({ error: "Category with this name already exists" }, { status: 400 });
    }

    const result = await db.insert(categories).values({
      name: name.trim(),
      description: description?.trim() || null,
      isSystem: false,
    }).returning();

    const category = result[0];

    return Response.json({ success: true, category });
  } catch (error) {
    console.error("Error creating category:", error);
    return Response.json({ error: "Failed to create category" }, { status: 500 });
  }
};
