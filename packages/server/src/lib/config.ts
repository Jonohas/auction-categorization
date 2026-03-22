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

export interface CategoryConfig {
  name: string;
  description: string;
  isSystem?: boolean;
}

export interface Config {
  ai: AiConfig;
  scraping: ScrapingConfig;
  database: DatabaseConfig;
  server: ServerConfig;
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

export function loadScrapersFromJson(): ScraperConfig[] {
  const configPaths = [
    resolve(process.cwd(), "config/seeding/scrapers.json"),
    resolve(process.cwd(), "../config/seeding/scrapers.json"),
    resolve(__dirname, "..", "config/seeding/scrapers.json"),
  ];

  for (const path of configPaths) {
    try {
      const content = readFileSync(path, "utf-8");
      if (content) {
        return JSON.parse(content) as ScraperConfig[];
      }
    } catch {
      // Try next path
    }
  }

  return [];
}

export function loadCategoriesFromJson(): CategoryConfig[] {
  const configPaths = [
    resolve(process.cwd(), "config/seeding/categories.json"),
    resolve(process.cwd(), "../config/seeding/categories.json"),
    resolve(__dirname, "..", "config/seeding/categories.json"),
  ];

  for (const path of configPaths) {
    try {
      const content = readFileSync(path, "utf-8");
      if (content) {
        return JSON.parse(content) as CategoryConfig[];
      }
    } catch {
      // Try next path
    }
  }

  return [];
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
  };
}
