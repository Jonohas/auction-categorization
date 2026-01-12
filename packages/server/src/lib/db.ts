import { PrismaClient } from "@prisma/client";
import { getScrapersFromConfig } from "./config";

let prisma: PrismaClient;

declare global {
  var __prisma: PrismaClient | undefined;
}

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient();
  }
  prisma = global.__prisma;
}

const SYSTEM_CATEGORIES = [
  {
    name: "Other",
    description: "Items that don't fit into any other category",
  },
];

/**
 * Ensures system categories exist in the database.
 * Called on server startup to bootstrap required data.
 */
export async function ensureSystemCategories(): Promise<void> {
  for (const category of SYSTEM_CATEGORIES) {
    const existing = await prisma.category.findUnique({
      where: { name: category.name },
    });

    if (!existing) {
      await prisma.category.create({
        data: {
          name: category.name,
          description: category.description,
          isSystem: true,
        },
      });
      console.log(`Created system category: ${category.name}`);
    } else if (!existing.isSystem) {
      // If the category exists but isn't marked as system, update it
      await prisma.category.update({
        where: { id: existing.id },
        data: { isSystem: true },
      });
      console.log(`Marked existing category as system: ${category.name}`);
    }
  }
}

/**
 * Ensures scrapers from config.toml exist in the database.
 * Called on server startup to bootstrap predefined scrapers.
 */
export async function ensureConfigScrapers(): Promise<void> {
  const configScrapers = getScrapersFromConfig();

  for (const scraper of configScrapers) {
    const existing = await prisma.scraper.findUnique({
      where: { url: scraper.url },
    });

    if (!existing) {
      await prisma.scraper.create({
        data: {
          name: scraper.name,
          url: scraper.url,
          imageUrl: scraper.image_url || null,
          enabled: scraper.enabled,
        },
      });
      console.log(`Created scraper from config: ${scraper.name}`);
    } else {
      // Update existing scraper with config values
      await prisma.scraper.update({
        where: { id: existing.id },
        data: {
          name: scraper.name,
          imageUrl: scraper.image_url || null,
        },
      });
    }
  }
}

export { prisma };
