import type { RouteHandler } from "../../../types/requestTypes.ts";
import { initializeCategoriesFromJson, initializeScrapersFromConfig } from "../../../services/scrapingService.ts";

/**
 * POST /api/database/seed - Seed database with categories and scrapers from config
 */
export const POST: RouteHandler = async () => {
  try {
    // Seed categories from JSON config
    await initializeCategoriesFromJson();
    
    // Seed scrapers from config
    await initializeScrapersFromConfig();
    
    return Response.json({ 
      success: true, 
      message: "Database seeded successfully. Categories and scrapers have been initialized." 
    });
  } catch (error) {
    console.error("Error seeding database:", error);
    return Response.json({ error: "Failed to seed database" }, { status: 500 });
  }
};
