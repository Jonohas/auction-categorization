import { readFileSync } from "fs";
import { resolve } from "path";
import toml from "toml";

export interface AiConfig {
  model: string;
  api_key: string;
  base_url: string;
  azure_endpoint: string;
  azure_api_version: string;
  azure_deployment: string;
}

export interface ScrapingConfig {
  interval_minutes: number;
  timeout_seconds: number;
  max_concurrent: number;
}

export interface DatabaseConfig {
  path: string;
}

export interface ServerConfig {
  port: number;
  host: string;
}

export interface ScraperConfig {
  name: string;
  url: string;
  image_url: string;
  enabled: boolean;
}

export interface Config {
  ai: AiConfig;
  scraping: ScrapingConfig;
  database: DatabaseConfig;
  server: ServerConfig;
  scrapers: ScraperConfig[];
}

let cachedConfig: Config | null = null;

export function loadConfig(): Config {
  if (cachedConfig) {
    return cachedConfig;
  }

  const configPaths = [
    resolve(process.cwd(), "config/config.toml"),
    resolve(process.cwd(), "../config/config.toml"),
    resolve(__dirname, "..", "config/config.toml"),
  ];

  let configPath: string | null = null;
  for (const path of configPaths) {
    try {
      const content = readFileSync(path, "utf-8");
      if (content) {
        configPath = path;
        break;
      }
    } catch {
      // Try next path
    }
  }

  if (!configPath) {
    // Return default config if no config file found
    cachedConfig = getDefaultConfig();
    return cachedConfig;
  }

  try {
    const content = readFileSync(configPath, "utf-8");
    const config = toml.parse(content) as Config;

    // Apply environment variable overrides
    if (process.env.AI_API_KEY) {
      config.ai.api_key = process.env.AI_API_KEY;
    }
    if (process.env.AI_MODEL) {
      config.ai.model = process.env.AI_MODEL;
    }
    if (process.env.AI_AZURE_ENDPOINT) {
      config.ai.azure_endpoint = process.env.AI_AZURE_ENDPOINT;
    }
    if (process.env.AI_AZURE_API_VERSION) {
      config.ai.azure_api_version = process.env.AI_AZURE_API_VERSION;
    }
    if (process.env.AI_AZURE_DEPLOYMENT) {
      config.ai.azure_deployment = process.env.AI_AZURE_DEPLOYMENT;
    }
    if (process.env.SERVER_PORT) {
      config.server.port = parseInt(process.env.SERVER_PORT, 10);
    }

    cachedConfig = config;
    return config;
  } catch (error) {
    console.error("Error loading config:", error);
    cachedConfig = getDefaultConfig();
    return cachedConfig;
  }
}

export function getScrapersFromConfig(): ScraperConfig[] {
  const config = loadConfig();
  return config.scrapers || [];
}

function getDefaultConfig(): Config {
  return {
    ai: {
      model: "gpt-4o",
      api_key: "",
      base_url: "",
      azure_endpoint: "",
      azure_api_version: "2025-01-01-preview",
      azure_deployment: "",
    },
    scraping: {
      interval_minutes: 60,
      timeout_seconds: 30,
      max_concurrent: 5,
    },
    database: {
      path: "./prisma/dev.db",
    },
    server: {
      port: 3000,
      host: "localhost",
    },
    scrapers: [],
  };
}
