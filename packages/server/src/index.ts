import express from "express";
import { loadConfig } from "./lib/config";
import { ensureSystemCategories, ensureConfigScrapers } from "./lib/db";
import * as api from "./routes/api";

const config = loadConfig();
const app = express();

// Bootstrap system data
ensureSystemCategories().catch((err) => {
  console.error("Failed to ensure system categories:", err);
});
ensureConfigScrapers().catch((err) => {
  console.error("Failed to ensure config scrapers:", err);
});

app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes - Websites
app.get("/api/getWebsites", api.getWebsites);
app.post("/api/addWebsite", api.addWebsite);
app.post("/api/deleteWebsite", api.deleteWebsite);
app.post("/api/triggerScrapeWebsite", api.triggerScrapeWebsite);
app.get("/api/scrapeBopa", api.scrapeBopa);

// API routes - Scrapers
app.get("/api/getScrapers", api.getScrapers);
app.post("/api/scrapeScraper", api.scrapeScraper);
app.post("/api/enableScraper", api.enableScraper);
app.post("/api/disableScraper", api.disableScraper);

// API routes - Auctions
app.get("/api/getAuctions", api.getAuctions);
app.get("/api/getAuction", api.getAuction);
app.post("/api/triggerScrape", api.triggerScrape);

// API routes - Items
app.get("/api/getItems", api.getItems);
app.get("/api/getItemCategoryProbabilities", api.getItemCategoryProbabilities);

// API routes - Stats
app.get("/api/getStats", api.getStats);

// API routes - Categories
app.get("/api/getCategories", api.getCategories);
app.get("/api/getCategory", api.getCategory);
app.post("/api/createCategory", api.createCategory);
app.post("/api/updateCategory", api.updateCategory);
app.post("/api/deleteCategory", api.deleteCategory);
app.get("/api/getItemsByCategory", api.getItemsByCategory);
app.post("/api/setItemMainCategory", api.setItemMainCategory);
app.post("/api/saveItemCategoryProbabilities", api.saveItemCategoryProbabilities);

// API routes - AI Categorization
app.post("/api/categorizeItem", api.categorizeItem);
app.post("/api/categorizeItems", api.categorizeItems);
app.post("/api/categorizeAuction", api.categorizeAuction);
app.get("/api/getItemCategorization", api.getItemCategorization);

// Database management endpoints
app.post("/api/wipeTables", api.wipeTables);

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static("../dist"));
  app.get("*", (req, res) => {
    res.sendFile("../dist/index.html");
  });
}

const PORT = config.server.port || 3000;
app.listen(PORT, () => {
  console.log(`Auction Scraper server running on http://localhost:${PORT}`);
});
