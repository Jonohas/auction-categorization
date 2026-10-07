import { db } from "../db/db.ts";
import { auctionItem, categoryProbability } from "../db/schema.ts";
import { eq } from "drizzle-orm";
import type { CategorizationResult } from "./aiCategorization.ts";

const MAIN_CATEGORY_THRESHOLD = 0.5;

export interface CategoryForAI {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
}

/**
 * Load all categories in the shape the AI categorization service expects
 */
export async function loadCategoriesForAI(): Promise<CategoryForAI[]> {
  const allCategories = await db.query.categories.findMany();
  return allCategories.map((c) => ({
    id: c.id.toString(),
    name: c.name,
    description: c.description ?? null,
    isSystem: c.isSystem ?? false,
  }));
}

/**
 * Replace stored probabilities for each item and set its main category
 * when the highest probability reaches the threshold
 */
export async function saveCategorizationResults(results: CategorizationResult[]): Promise<void> {
  for (const result of results) {
    if (result.probabilities.length === 0) continue;

    const itemId = parseInt(result.itemId, 10);
    const best = result.probabilities.reduce((max, p) => (p.probability > max.probability ? p : max));

    db.transaction((tx) => {
      tx.delete(categoryProbability).where(eq(categoryProbability.itemId, itemId)).run();
      tx.insert(categoryProbability).values(
        result.probabilities.map((p) => ({
          itemId,
          categoryId: parseInt(p.categoryId, 10),
          probability: p.probability,
        }))
      ).run();
      tx.update(auctionItem).set({
        mainCategoryId: best.probability >= MAIN_CATEGORY_THRESHOLD ? parseInt(best.categoryId, 10) : null,
      }).where(eq(auctionItem.id, itemId)).run();
    });
  }
}
