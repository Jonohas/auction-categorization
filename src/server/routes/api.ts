import { Request, Response } from "express";
import { prisma } from "../lib/db";
import { scrapeWebsite, scrapeAllWebsites, getScrapers, triggerScraperScrape, enableScraper, disableScraper } from "../services/scrapingService";
import { scraperFactory, makeAbsoluteUrl } from "../scrapers";
import { BopaScraper } from "../scrapers/bopaScraper";
import { sanitizeId, sanitizeSearchQuery, sanitizeProbability, sanitizeUrl } from "../lib/sanitization";
import { categorizeItem, categorizeItems, categorizeAuctionItems, CategorizationResult } from "../services/aiCategorization";

export const apiHandlers = {
  // WebSites (alias for getScrapers)
  getWebsites: async (req: Request, res: Response) => {
    try {
      const scrapers = await getScrapers();
      res.json(scrapers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch websites" });
    }
  },

  // Scrapers
  getScrapers: async (req: Request, res: Response) => {
    try {
      const scrapers = await getScrapers();
      res.json(scrapers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scrapers" });
    }
  },

  scrapeScraper: async (req: Request, res: Response) => {
    try {
      const { scraperId } = await req.body;

      // Sanitize input
      const sanitizedScraperId = sanitizeId(scraperId);

      if (!sanitizedScraperId) {
        return res.status(400).json({ error: "Invalid scraper ID" });
      }

      // Guard rail: Check if scraper exists
      const scraper = await prisma.scraper.findUnique({
        where: { id: sanitizedScraperId },
      });

      if (!scraper) {
        return res.status(404).json({ error: "Scraper not found" });
      }

      // Guard rail: Check if scraper is enabled
      if (!scraper.enabled) {
        return res.status(400).json({ error: "Scraper is disabled" });
      }

      // Guard rail: Check if we have a valid scraper implementation
      const scraperImpl = scraperFactory.getScraper(scraper.url);
      if (!(scraperImpl instanceof BopaScraper)) {
        return res.status(400).json({ error: "No scraper available for this URL" });
      }

      const result = await triggerScraperScrape(sanitizedScraperId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to trigger scraping" });
    }
  },

  enableScraper: async (req: Request, res: Response) => {
    try {
      const { scraperId } = req.body as { scraperId?: string };

      // Sanitize input
      const sanitizedScraperId = sanitizeId(scraperId);

      if (!sanitizedScraperId) {
        return res.status(400).json({ error: "Invalid scraper ID" });
      }

      const success = await enableScraper(sanitizedScraperId);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ error: "Failed to enable scraper" });
    }
  },

  disableScraper: async (req: Request, res: Response) => {
    try {
      const { scraperId } = req.body as { scraperId?: string };

      // Sanitize input
      const sanitizedScraperId = sanitizeId(scraperId);

      if (!sanitizedScraperId) {
        return res.status(400).json({ error: "Invalid scraper ID" });
      }

      const success = await disableScraper(sanitizedScraperId);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ error: "Failed to disable scraper" });
    }
  },

  // Auctions
  getAuctions: async (req: Request, res: Response) => {
    try {
      const { scraperId, minProbability, maxProbability, search, sortBy, sortOrder } = req.query as {
        scraperId?: string;
        minProbability?: string;
        maxProbability?: string;
        search?: string;
        sortBy?: string;
        sortOrder?: string;
      };

      const where: Record<string, unknown> = {};

      // Sanitize and validate scraperId
      if (scraperId && scraperId !== "all") {
        const sanitizedScraperId = sanitizeId(scraperId);
        if (sanitizedScraperId) {
          where.scraperId = sanitizedScraperId;
        }
      }

      // Sanitize probabilities
      const minProb = sanitizeProbability(minProbability);
      const maxProb = sanitizeProbability(maxProbability);

      if (minProb !== undefined) {
        where.hardwareProbability = { gte: minProb };
      }

      if (maxProb !== undefined) {
        where.hardwareProbability = {
          ...((where.hardwareProbability as Record<string, unknown>) || {}),
          lte: maxProb,
        };
      }

      // Sanitize search query
      const sanitizedSearch = sanitizeSearchQuery(search);
      if (sanitizedSearch) {
        where.OR = [
          { title: { contains: sanitizedSearch } },
          { description: { contains: sanitizedSearch } },
        ];
      }

      // Sanitize sort parameters
      const sanitizedSortBy = sanitizeSearchQuery(sortBy);
      const sanitizedSortOrder = sanitizeSearchQuery(sortOrder);

      const orderBy: Record<string, "asc" | "desc"> = {};
      if (sanitizedSortBy === "probability") {
        orderBy.hardwareProbability = sanitizedSortOrder === "asc" ? "asc" : "desc";
      } else if (sanitizedSortBy === "date") {
        orderBy.createdAt = sanitizedSortOrder === "asc" ? "asc" : "desc";
      } else {
        orderBy.createdAt = "desc";
      }

      const auctions = await prisma.auction.findMany({
        where,
        include: {
          scraper: true,
          items: true,
        },
        orderBy,
      });
      res.json(auctions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch auctions" });
    }
  },

  getAuction: async (req: Request, res: Response) => {
    try {
      const { id } = req.query as { id?: string };

      // Sanitize input
      const sanitizedId = sanitizeId(id);

      if (!sanitizedId) {
        return res.status(400).json({ error: "Invalid auction ID" });
      }

      const auction = await prisma.auction.findUnique({
        where: { id: sanitizedId },
        include: {
          scraper: true,
          items: {
            include: {
              mainCategory: true,
              categoryProbabilities: {
                include: { category: true },
                orderBy: { probability: "desc" },
              },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });
      res.json(auction);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch auction" });
    }
  },

  // Auction Items
  getItems: async (req: Request, res: Response) => {
    try {
      const { auctionId, minProbability, maxProbability, search, sortBy, sortOrder, page = "1", limit = "50" } = req.query as {
        auctionId?: string;
        minProbability?: string;
        maxProbability?: string;
        search?: string;
        sortBy?: string;
        sortOrder?: string;
        page?: string;
        limit?: string;
      };

      // Sanitize input
      const sanitizedAuctionId = sanitizeId(auctionId);

      if (!sanitizedAuctionId) {
        return res.status(400).json({ error: "Invalid auction ID" });
      }

      const where: Record<string, unknown> = {
        auctionId: sanitizedAuctionId,
      };

      // Sanitize probabilities
      const minProb = sanitizeProbability(minProbability);
      const maxProb = sanitizeProbability(maxProbability);

      if (minProb !== undefined) {
        where.hardwareProbability = { gte: minProb };
      }

      if (maxProb !== undefined) {
        where.hardwareProbability = {
          ...((where.hardwareProbability as Record<string, unknown>) || {}),
          lte: maxProb,
        };
      }

      // Sanitize search query
      const sanitizedSearch = sanitizeSearchQuery(search);
      if (sanitizedSearch) {
        where.OR = [
          { title: { contains: sanitizedSearch } },
          { description: { contains: sanitizedSearch } },
        ];
      }

      // Parse pagination
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
      const skip = (pageNum - 1) * limitNum;

      // Sanitize sort parameters
      const sanitizedSortBy = sanitizeSearchQuery(sortBy);
      const sanitizedSortOrder = sanitizeSearchQuery(sortOrder);

      const orderBy: Record<string, "asc" | "desc"> = {};
      if (sanitizedSortBy === "probability") {
        orderBy.hardwareProbability = sanitizedSortOrder === "asc" ? "asc" : "desc";
      } else if (sanitizedSortBy === "price") {
        orderBy.currentPrice = sanitizedSortOrder === "asc" ? "asc" : "desc";
      } else if (sanitizedSortBy === "date") {
        orderBy.createdAt = sanitizedSortOrder === "asc" ? "asc" : "desc";
      } else {
        orderBy.createdAt = "desc";
      }

      const [items, total] = await Promise.all([
        prisma.auctionItem.findMany({
          where,
          orderBy,
          skip,
          take: limitNum,
        }),
        prisma.auctionItem.count({ where }),
      ]);

      res.json({
        items,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch items" });
    }
  },

  // Scraping
  triggerScrape: async (req: Request, res: Response) => {
    try {
      const results = await scrapeAllWebsites();
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to trigger scraping" });
    }
  },

  // Website management (for dynamic website adding)
  addWebsite: async (req: Request, res: Response) => {
    try {
      const { url } = req.body as { url?: string };

      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      // Validate URL
      const sanitizedUrl = sanitizeUrl(url);
      if (!sanitizedUrl) {
        return res.status(400).json({ error: "Invalid URL" });
      }

      // Check if website already exists
      const existing = await prisma.scraper.findUnique({
        where: { url: sanitizedUrl },
      });

      if (existing) {
        return res.status(400).json({ error: "Website already exists" });
      }

      // Generate a name from the URL
      const hostname = new URL(sanitizedUrl).hostname.replace("www.", "");
      const name = hostname.split(".")[0].charAt(0).toUpperCase() + hostname.split(".")[0].slice(1);

      const scraper = await prisma.scraper.create({
        data: {
          url: sanitizedUrl,
          name: `${name} Auctions`,
          imageUrl: makeAbsoluteUrl(sanitizedUrl, "/favicon.ico"),
          enabled: true,
        },
      });

      res.json({ success: true, scraper });
    } catch (error) {
      res.status(500).json({ error: "Failed to add website" });
    }
  },

  deleteWebsite: async (req: Request, res: Response) => {
    try {
      const { id } = req.body as { id?: string };

      // Sanitize input
      const sanitizedId = sanitizeId(id);

      if (!sanitizedId) {
        return res.status(400).json({ error: "Invalid website ID" });
      }

      const scraper = await prisma.scraper.findUnique({
        where: { id: sanitizedId },
      });

      if (!scraper) {
        return res.status(404).json({ error: "Website not found" });
      }

      await prisma.scraper.delete({
        where: { id: sanitizedId },
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete website" });
    }
  },

  triggerScrapeWebsite: async (req: Request, res: Response) => {
    try {
      const { websiteId } = req.body as { websiteId?: string };

      // Sanitize input
      const sanitizedWebsiteId = sanitizeId(websiteId);

      if (!sanitizedWebsiteId) {
        return res.status(400).json({ error: "Invalid website ID" });
      }

      const result = await scrapeWebsite(sanitizedWebsiteId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to trigger scraping" });
    }
  },

  // BOPA specific scraping
  scrapeBopa: async (req: Request, res: Response) => {
    try {
      const scraper = new BopaScraper();
      const auctions = await scraper.scrape("https://www.bopa.be");
      res.json({
        auctions,
        lastUpdated: new Date().toISOString(),
        source: "https://www.bopa.be",
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to scrape BOPA" });
    }
  },

  // Stats
  getStats: async (req: Request, res: Response) => {
    try {
      const [scraperCount, auctionCount, itemCount] = await Promise.all([
        prisma.scraper.count(),
        prisma.auction.count(),
        prisma.auctionItem.count(),
      ]);

      const avgProbability = await prisma.auction.aggregate({
        _avg: { hardwareProbability: true },
      });

      const enabledScrapers = await prisma.scraper.count({
        where: { enabled: true },
      });

      res.json({
        scraperCount,
        auctionCount,
        itemCount,
        avgProbability: avgProbability._avg.hardwareProbability || 0,
        enabledScrapers,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  },

  // Categories
  getCategories: async (req: Request, res: Response) => {
    try {
      const categories = await prisma.category.findMany({
        include: {
          _count: {
            select: { items: true },
          },
        },
        orderBy: { name: "asc" },
      });
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  },

  getCategory: async (req: Request, res: Response) => {
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
  },

  createCategory: async (req: Request, res: Response) => {
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
  },

  updateCategory: async (req: Request, res: Response) => {
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
  },

  deleteCategory: async (req: Request, res: Response) => {
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
  },

  // Get items by category
  getItemsByCategory: async (req: Request, res: Response) => {
    try {
      const { categoryId, page = "1", limit = "50" } = req.query as {
        categoryId?: string;
        page?: string;
        limit?: string;
      };

      const sanitizedCategoryId = sanitizeId(categoryId);

      if (!sanitizedCategoryId) {
        return res.status(400).json({ error: "Invalid category ID" });
      }

      // Check if category exists
      const category = await prisma.category.findUnique({
        where: { id: sanitizedCategoryId },
      });

      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }

      // Parse pagination
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
      const skip = (pageNum - 1) * limitNum;

      const [items, total] = await Promise.all([
        prisma.auctionItem.findMany({
          where: { mainCategoryId: sanitizedCategoryId },
          include: {
            auction: {
              include: {
                scraper: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limitNum,
        }),
        prisma.auctionItem.count({ where: { mainCategoryId: sanitizedCategoryId } }),
      ]);

      res.json({
        category,
        items,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch items by category" });
    }
  },

  // Set main category for an item
  setItemMainCategory: async (req: Request, res: Response) => {
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
  },

  // Save category probabilities for an item
  saveItemCategoryProbabilities: async (req: Request, res: Response) => {
    try {
      const { itemId, probabilities } = req.body as {
        itemId?: string;
        probabilities?: Array<{ categoryId: string; probability: number }>;
      };

      const sanitizedItemId = sanitizeId(itemId);

      if (!sanitizedItemId) {
        return res.status(400).json({ error: "Invalid item ID" });
      }

      if (!probabilities || !Array.isArray(probabilities)) {
        return res.status(400).json({ error: "Probabilities array is required" });
      }

      // Verify item exists
      const item = await prisma.auctionItem.findUnique({
        where: { id: sanitizedItemId },
      });

      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }

      // Delete existing probabilities
      await prisma.categoryProbability.deleteMany({
        where: { itemId: sanitizedItemId },
      });

      // Create new probabilities
      await prisma.categoryProbability.createMany({
        data: probabilities.map((p) => ({
          itemId: sanitizedItemId,
          categoryId: p.categoryId,
          probability: p.probability,
        })),
      });

      // Set main category to the one with highest probability only if >= 50%
      if (probabilities.length > 0) {
        const highestProbability = probabilities.reduce((max, p) =>
          p.probability > max.probability ? p : max
        );

        // Only set main category if probability is above 50%
        if (highestProbability.probability >= 0.5) {
          await prisma.auctionItem.update({
            where: { id: sanitizedItemId },
            data: { mainCategoryId: highestProbability.categoryId },
          });
        }
      }

      const updatedItem = await prisma.auctionItem.findUnique({
        where: { id: sanitizedItemId },
        include: {
          categoryProbabilities: {
            include: { category: true },
          },
        },
      });

      res.json({ success: true, item: updatedItem });
    } catch (error) {
      res.status(500).json({ error: "Failed to save category probabilities" });
    }
  },

  // Get item with category probabilities
  getItemCategoryProbabilities: async (req: Request, res: Response) => {
    try {
      const { itemId } = req.query as { itemId?: string };

      const sanitizedItemId = sanitizeId(itemId);

      if (!sanitizedItemId) {
        return res.status(400).json({ error: "Invalid item ID" });
      }

      const item = await prisma.auctionItem.findUnique({
        where: { id: sanitizedItemId },
        include: {
          mainCategory: true,
          categoryProbabilities: {
            include: { category: true },
            orderBy: { probability: "desc" },
          },
          auction: {
            include: { scraper: true },
          },
        },
      });

      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }

      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch item category probabilities" });
    }
  },

  // AI Categorization Endpoints

  /**
   * Categorize a single item by ID using AI
   * POST /api/categorizeItem
   * Body: { itemId: string }
   */
  categorizeItem: async (req: Request, res: Response) => {
    try {
      const { itemId } = req.body as { itemId?: string };

      const sanitizedItemId = sanitizeId(itemId);

      if (!sanitizedItemId) {
        return res.status(400).json({ error: "Invalid item ID" });
      }

      // Fetch the item
      const item = await prisma.auctionItem.findUnique({
        where: { id: sanitizedItemId },
      });

      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }

      // Fetch all categories
      const categories = await prisma.category.findMany({
        select: { id: true, name: true, description: true },
      });

      if (categories.length === 0) {
        return res.status(400).json({ error: "No categories defined" });
      }

      // Categorize the item
      const result = await categorizeItem(
        {
          id: item.id,
          title: item.title,
          description: item.description,
        },
        categories
      );

      res.json(result);
    } catch (error) {
      console.error("Error categorizing item:", error);
      res.status(500).json({ error: "Failed to categorize item" });
    }
  },

  /**
   * Categorize multiple items by IDs using AI
   * POST /api/categorizeItems
   * Body: { itemIds: string[] }
   */
  categorizeItems: async (req: Request, res: Response) => {
    try {
      const { itemIds } = req.body as { itemIds?: string[] };

      if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
        return res.status(400).json({ error: "Item IDs array is required" });
      }

      // Sanitize item IDs
      const sanitizedItemIds = itemIds
        .map((id) => sanitizeId(id))
        .filter((id): id is string => id !== undefined);

      if (sanitizedItemIds.length === 0) {
        return res.status(400).json({ error: "Invalid item IDs" });
      }

      // Fetch the items
      const items = await prisma.auctionItem.findMany({
        where: { id: { in: sanitizedItemIds } },
      });

      if (items.length === 0) {
        return res.status(404).json({ error: "No items found" });
      }

      // Fetch all categories
      const categories = await prisma.category.findMany({
        select: { id: true, name: true, description: true },
      });

      if (categories.length === 0) {
        return res.status(400).json({ error: "No categories defined" });
      }

      // Categorize all items
      const results = await categorizeItems(
        items.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
        })),
        categories
      );

      res.json({ results });
    } catch (error) {
      console.error("Error categorizing items:", error);
      res.status(500).json({ error: "Failed to categorize items" });
    }
  },

  /**
   * Categorize all items in an auction using AI and save results
   * POST /api/categorizeAuction
   * Body: { auctionId: string, saveResults?: boolean }
   */
  categorizeAuction: async (req: Request, res: Response) => {
    try {
      const { auctionId, saveResults = true } = req.body as {
        auctionId?: string;
        saveResults?: boolean;
      };

      const sanitizedAuctionId = sanitizeId(auctionId);

      if (!sanitizedAuctionId) {
        return res.status(400).json({ error: "Invalid auction ID" });
      }

      // Fetch the auction with items
      const auction = await prisma.auction.findUnique({
        where: { id: sanitizedAuctionId },
        include: {
          items: {
            select: {
              id: true,
              title: true,
              description: true,
            },
          },
        },
      });

      if (!auction) {
        return res.status(404).json({ error: "Auction not found" });
      }

      if (auction.items.length === 0) {
        return res.status(400).json({ error: "Auction has no items" });
      }

      // Fetch all categories
      const categories = await prisma.category.findMany({
        select: { id: true, name: true, description: true },
      });

      if (categories.length === 0) {
        return res.status(400).json({ error: "No categories defined" });
      }

      // Categorize all items in the auction
      const results = await categorizeAuctionItems(
        auction.id,
        auction.items.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
        })),
        categories
      );

      // Optionally save results to the database
      if (saveResults) {
        for (const result of results) {
          if (result.probabilities.length > 0) {
            // Delete existing probabilities for this item
            await prisma.categoryProbability.deleteMany({
              where: { itemId: result.itemId },
            });

            // Create new probabilities
            await prisma.categoryProbability.createMany({
              data: result.probabilities.map((p) => ({
                itemId: result.itemId,
                categoryId: p.categoryId,
                probability: p.probability,
              })),
            });

            // Set main category to the one with highest probability only if >= 50%
            const highestProbability = result.probabilities.reduce((max, p) =>
              p.probability > max.probability ? p : max
            );

            // Only set main category if probability is above 50%, otherwise clear it
            await prisma.auctionItem.update({
              where: { id: result.itemId },
              data: {
                mainCategoryId: highestProbability.probability >= 0.5
                  ? highestProbability.categoryId
                  : null,
              },
            });
          }
        }
      }

      res.json({
        auctionId: auction.id,
        itemCount: results.length,
        results,
        saved: saveResults,
      });
    } catch (error) {
      console.error("Error categorizing auction:", error);
      res.status(500).json({ error: "Failed to categorize auction" });
    }
  },

  /**
   * Get categorization results for an item (with saved probabilities)
   * GET /api/getItemCategorization
   * Query: { itemId: string }
   */
  getItemCategorization: async (req: Request, res: Response) => {
    try {
      const { itemId } = req.query as { itemId?: string };

      const sanitizedItemId = sanitizeId(itemId);

      if (!sanitizedItemId) {
        return res.status(400).json({ error: "Invalid item ID" });
      }

      const item = await prisma.auctionItem.findUnique({
        where: { id: sanitizedItemId },
        include: {
          mainCategory: true,
          categoryProbabilities: {
            include: { category: true },
            orderBy: { probability: "desc" },
          },
          auction: {
            include: { scraper: true },
          },
        },
      });

      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }

      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch item categorization" });
    }
  },
};