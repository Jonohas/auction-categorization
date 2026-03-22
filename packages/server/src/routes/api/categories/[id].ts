import { db } from "../../../db/db.ts";
import { categories, auctionItem, categoryProbability } from "../../../db/schema.ts";
import { eq } from "drizzle-orm";
import type { RouteHandler } from "../../../types/requestTypes.ts";

/**
 * GET /api/categories/:id - Get single category
 * PUT /api/categories/:id - Update category
 * DELETE /api/categories/:id - Delete category
 */

export const GET: RouteHandler = async (req) => {
  try {
    const { id } = req.params;

    if (!id) {
      return Response.json({ error: "Invalid category ID" }, { status: 400 });
    }

    const categoryId = parseInt(id, 10);
    if (isNaN(categoryId)) {
      return Response.json({ error: "Invalid category ID" }, { status: 400 });
    }

    const category = await db.query.categories.findFirst({
      where: eq(categories.id, categoryId),
    });

    if (!category) {
      return Response.json({ error: "Category not found" }, { status: 404 });
    }

    // Get item count
    const items = await db.query.auctionItem.findMany({
      where: eq(auctionItem.mainCategoryId, categoryId),
    });

    return Response.json({
      ...category,
      itemCount: items.length,
    });
  } catch (error) {
    console.error("Error fetching category:", error);
    return Response.json({ error: "Failed to fetch category" }, { status: 500 });
  }
};

export const PUT: RouteHandler = async (req) => {
  try {
    const { id } = req.params;
    const body = await req.json() as { name?: string; description?: string | null };

    if (!id) {
      return Response.json({ error: "Invalid category ID" }, { status: 400 });
    }

    const { name, description } = body;

    if (!name || name.trim().length === 0) {
      return Response.json({ error: "Category name is required" }, { status: 400 });
    }

    const categoryId = parseInt(id, 10);
    if (isNaN(categoryId)) {
      return Response.json({ error: "Invalid category ID" }, { status: 400 });
    }

    // Check if category exists
    const existing = await db.query.categories.findFirst({
      where: eq(categories.id, categoryId),
    });

    if (!existing) {
      return Response.json({ error: "Category not found" }, { status: 404 });
    }

    // Prevent renaming system categories
    if (existing.isSystem && name.trim() !== existing.name) {
      return Response.json({ error: "System categories cannot be renamed" }, { status: 403 });
    }

    // Check for duplicate name
    const duplicate = await db.query.categories.findFirst({
      where: eq(categories.name, name.trim()),
    });

    if (duplicate && duplicate.id !== categoryId) {
      return Response.json({ error: "Category with this name already exists" }, { status: 400 });
    }

    await db.update(categories).set({
      name: name.trim(),
      description: description?.trim() || null,
      updatedAt: new Date(),
    }).where(eq(categories.id, categoryId));

    const updatedCategory = await db.query.categories.findFirst({
      where: eq(categories.id, categoryId),
    });

    return Response.json({ success: true, category: updatedCategory });
  } catch (error) {
    console.error("Error updating category:", error);
    return Response.json({ error: "Failed to update category" }, { status: 500 });
  }
};

export const DELETE: RouteHandler = async (req) => {
  try {
    const { id } = req.params;

    if (!id) {
      return Response.json({ error: "Invalid category ID" }, { status: 400 });
    }

    const categoryId = parseInt(id, 10);
    if (isNaN(categoryId)) {
      return Response.json({ error: "Invalid category ID" }, { status: 400 });
    }

    const category = await db.query.categories.findFirst({
      where: eq(categories.id, categoryId),
    });

    if (!category) {
      return Response.json({ error: "Category not found" }, { status: 404 });
    }

    // Prevent deletion of system categories
    if (category.isSystem) {
      return Response.json({ error: "System categories cannot be deleted" }, { status: 403 });
    }

    // Remove mainCategoryId from items using bulk update
    await db.update(auctionItem).set({
      mainCategoryId: null,
    }).where(eq(auctionItem.mainCategoryId, categoryId));

    // Delete all category probabilities using bulk delete
    await db.delete(categoryProbability).where(eq(categoryProbability.categoryId, categoryId));

    // Delete the category
    await db.delete(categories).where(eq(categories.id, categoryId));

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return Response.json({ error: "Failed to delete category" }, { status: 500 });
  }
};
