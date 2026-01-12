import express from "express";
import { loadConfig } from "./lib/config";
import { apiHandlers } from "./routes/api";

const config = loadConfig();
const app = express();

app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
app.get("/api/getWebsites", apiHandlers.getWebsites);
app.get("/api/getScrapers", apiHandlers.getScrapers);
app.post("/api/addWebsite", apiHandlers.addWebsite);
app.post("/api/deleteWebsite", apiHandlers.deleteWebsite);
app.post("/api/scrapeScraper", apiHandlers.scrapeScraper);
app.post("/api/enableScraper", apiHandlers.enableScraper);
app.post("/api/disableScraper", apiHandlers.disableScraper);
app.get("/api/getAuctions", apiHandlers.getAuctions);
app.get("/api/getAuction", apiHandlers.getAuction);
app.get("/api/getItems", apiHandlers.getItems);
app.post("/api/triggerScrape", apiHandlers.triggerScrape);
app.post("/api/triggerScrapeWebsite", apiHandlers.triggerScrapeWebsite);
app.get("/api/scrapeBopa", apiHandlers.scrapeBopa);
app.get("/api/getStats", apiHandlers.getStats);

// Category endpoints
app.get("/api/getCategories", apiHandlers.getCategories);
app.get("/api/getCategory", apiHandlers.getCategory);
app.post("/api/createCategory", apiHandlers.createCategory);
app.post("/api/updateCategory", apiHandlers.updateCategory);
app.post("/api/deleteCategory", apiHandlers.deleteCategory);
app.get("/api/getItemsByCategory", apiHandlers.getItemsByCategory);
app.post("/api/setItemMainCategory", apiHandlers.setItemMainCategory);
app.post("/api/saveItemCategoryProbabilities", apiHandlers.saveItemCategoryProbabilities);
app.get("/api/getItemCategoryProbabilities", apiHandlers.getItemCategoryProbabilities);

// AI Categorization endpoints
app.post("/api/categorizeItem", apiHandlers.categorizeItem);
app.post("/api/categorizeItems", apiHandlers.categorizeItems);
app.post("/api/categorizeAuction", apiHandlers.categorizeAuction);
app.get("/api/getItemCategorization", apiHandlers.getItemCategorization);

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
