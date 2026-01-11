import { createStartServer } from "@tanstack/start/server";
import { apiRoutes } from "./routes/api";
import { loadConfig } from "./lib/config";
import "./app.css";

const config = loadConfig();

const { getRouter } = createStartServer({
  router: {
    api: apiRoutes,
  },
});

export const { fetchRequestHandler } = createStartServer({
  router: getRouter(),
});

console.log(`Auction Scraper starting on http://${config.server.host}:${config.server.port}`);
