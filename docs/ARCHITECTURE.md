# Architecture

This document provides a comprehensive overview of the Auction Scraper with AI Categorization application architecture.

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Backend Architecture](#backend-architecture)
- [Frontend Architecture](#frontend-architecture)
- [Database Schema](#database-schema)
- [API Overview](#api-overview)
- [Data Flow](#data-flow)
- [Configuration](#configuration)
- [Getting Started](#getting-started)

## Project Overview

A full-stack web application for scraping auction websites and automatically categorizing items using AI. The application is built as a **Bun workspace monorepo** with separate client and server packages.

### Key Features

- **Web Scraping**: Scrape auction data from configurable sources with pagination support
- **AI Categorization**: Automatically categorize auction items using Azure OpenAI
- **Category Management**: Create and manage categories with descriptions
- **Probability Scoring**: AI provides probability scores for each category (0-1 range)
- **50% Confidence Threshold**: Items only get assigned a main category if AI confidence >= 50%
- **Hardware Detection**: AI-powered probability scoring for computer hardware/server equipment

## Tech Stack

| Layer | Current | Future (Bun-native) |
|-------|---------|---------------------|
| Runtime | Bun / Node.js | Bun |
| Backend Framework | Express.js 5.x | Elysia or Hono |
| Database | SQLite + Prisma 6 | SQLite + Prisma (or Bun SQLite) |
| Frontend Framework | React 18 | React |
| Frontend Bundler | Vite 5 | Vite |
| Styling | Tailwind CSS 3 | Tailwind CSS |
| Routing | React Router DOM 6 | React Router DOM |
| AI Provider | Azure OpenAI (GPT-4.1-mini) | Azure OpenAI |
| Web Scraping | Cheerio | Cheerio |
| Configuration | TOML | TOML |

## Repository Structure

```
auction-categorization/
├── packages/
│   ├── client/                 # React frontend application
│   └── server/                 # Express.js backend API
├── prisma/
│   ├── schema.prisma           # Database schema definition
│   ├── migrations/             # Database migrations
│   └── dev.db                  # SQLite database file
├── config/
│   ├── config.toml             # Application configuration
│   └── config-example.toml     # Configuration template
├── docs/                       # Documentation
├── package.json                # Root workspace configuration
└── bun.lock                    # Bun lockfile
```

## Backend Architecture

### Current Structure (Express.js)

```
packages/server/src/
├── index.ts                    # Express server entry point
│                               # - Initializes Express app
│                               # - Loads configuration
│                               # - Bootstraps system categories
│                               # - Sets up API routes
│
├── routes/
│   └── api.ts                  # API route handlers
│                               # - Scraper management endpoints
│                               # - Auction CRUD operations
│                               # - Category management
│                               # - AI categorization endpoints
│                               # - Statistics endpoints
│
├── services/
│   ├── aiCategorization.ts     # AI categorization logic
│   │                           # - Builds prompts with category definitions
│   │                           # - Calls Azure OpenAI API
│   │                           # - Parses JSON responses
│   │                           # - Applies 50% confidence threshold
│   │
│   ├── aiProbability.ts        # Hardware probability scoring
│   │                           # - Determines if items are computer hardware
│   │                           # - Returns probability 0-1
│   │
│   └── scrapingService.ts      # Web scraping orchestration
│                               # - Manages scraper lifecycle
│                               # - Handles batch processing
│                               # - Upserts auctions and items
│
├── scrapers/
│   ├── index.ts                # Scraper factory/registry
│   │                           # - Routes URLs to appropriate scraper
│   │                           # - Provides scraper interface
│   │
│   └── bopaScraper.ts          # BOPA auction scraper
│                               # - Multi-page auction scraping
│                               # - Lot/item extraction
│                               # - Price and bid count parsing
│
└── lib/
    ├── config.ts               # TOML configuration loader
    │                           # - Loads config.toml
    │                           # - Supports environment variable overrides
    │
    ├── db.ts                   # Prisma client singleton
    │                           # - Database connection management
    │                           # - System category initialization
    │
    └── sanitization.ts         # Input sanitization utilities
                                # - ID validation (CUID format)
                                # - URL validation
                                # - Search query sanitization
                                # - Probability range validation
```

### Recommended Future Structure (Bun-native)

For improved performance and developer experience, consider migrating to a Bun-first framework like **Elysia** or **Hono**.

**Benefits of Bun-native stack:**
- Native Bun performance optimizations
- Built-in TypeScript support with end-to-end type safety
- OpenAPI/Swagger generation out of the box
- Lighter footprint and faster cold starts
- Plugin ecosystem for common functionality

**Elysia** is recommended for Bun-optimized projects with excellent TypeScript inference. **Hono** is recommended if multi-runtime support (Node.js, Deno, Cloudflare Workers) is needed.

```
packages/server/src/
├── index.ts                    # Elysia/Hono server entry
│
├── app/
│   ├── routes/                 # Route modules (feature-based)
│   │   ├── auctions.ts         # Auction endpoints
│   │   ├── categories.ts       # Category endpoints
│   │   ├── scrapers.ts         # Scraper endpoints
│   │   └── ai.ts               # AI categorization endpoints
│   │
│   ├── middleware/             # Custom middleware
│   │   ├── auth.ts             # Authentication (if needed)
│   │   └── validation.ts       # Request validation
│   │
│   └── plugins/                # Elysia plugins or Hono middleware
│
├── domain/
│   ├── entities/               # Domain models/types
│   │   ├── auction.ts
│   │   ├── category.ts
│   │   └── scraper.ts
│   │
│   ├── repositories/           # Data access interfaces
│   │   ├── auction.repository.ts
│   │   ├── category.repository.ts
│   │   └── scraper.repository.ts
│   │
│   └── services/               # Business logic
│       ├── categorization.service.ts
│       ├── probability.service.ts
│       └── scraping.service.ts
│
├── infrastructure/
│   ├── database/               # Database client and migrations
│   │   └── prisma.ts
│   │
│   ├── ai/                     # AI provider integrations
│   │   └── openai.ts
│   │
│   ├── scrapers/               # Web scraper implementations
│   │   ├── scraper.interface.ts
│   │   ├── bopa.scraper.ts
│   │   └── generic.scraper.ts
│   │
│   └── config/                 # Configuration management
│       └── config.ts
│
└── shared/
    ├── types/                  # Shared TypeScript types
    ├── utils/                  # Utility functions
    └── errors/                 # Custom error classes
```

## Frontend Architecture

The frontend follows a **feature-based architecture** for scalability and maintainability.

### Project Structure

```
src/
├── app/                        # Application layer
│   ├── routes/                 # Application routes / pages
│   ├── app.tsx                 # Main application component
│   ├── provider.tsx            # Application provider (wraps app with global providers)
│   └── router.tsx              # Application router configuration
│
├── assets/                     # Static files (images, fonts, etc.)
│
├── components/                 # Shared components used across the entire application
│
├── config/                     # Global configurations, exported env variables
│
├── features/                   # Feature-based modules
│   ├── auctions/               # Auction browsing and details
│   ├── categories/             # Category management
│   └── scraping/               # Scraper management
│
├── hooks/                      # Shared hooks used across the entire application
│
├── lib/                        # Reusable libraries preconfigured for the application
│
├── stores/                     # Global state stores
│
├── testing/                    # Test utilities and mocks
│
├── types/                      # Shared types used across the application
│
└── utils/                      # Shared utility functions
```

### Feature Module Structure

Each feature folder contains code specific to that feature, keeping things neatly separated:

```
src/features/awesome-feature/
├── api/                        # Exported API request declarations and api hooks
│
├── assets/                     # Static files for a specific feature
│
├── components/                 # Components scoped to a specific feature
│
├── hooks/                      # Hooks scoped to a specific feature
│
├── stores/                     # State stores for a specific feature
│
├── types/                      # TypeScript types used within the feature
│
└── utils/                      # Utility functions for a specific feature
```

### Architecture Guidelines

1. **Only include necessary folders** - Not every feature needs all folders. Include only what's required for that specific feature.

2. **Import files directly** - Avoid barrel files (index.ts re-exports) as they can cause issues with Vite tree shaking and lead to performance issues.

3. **Don't import across features** - Features should be independent. Instead, compose different features at the application level. This keeps the codebase less convoluted.

4. **Shared API calls** - In some cases it might be more practical to keep all API calls outside of the features folders in a dedicated `api` folder if you have a lot of shared API calls between features.

### Current Components

The application includes these shared UI components:

| Component | Purpose |
|-----------|---------|
| `Layout` | Main layout with navigation bar |
| `PageHeader` | Reusable page title header with optional actions |
| `Card` | Composable card system (Card, CardHeader, CardContent, CardFooter) |
| `Modal` | Overlay modal dialog for forms |
| `Button` | Primary button with variants (primary, secondary, danger, ghost) |
| `Badge` | Badge with color variants (default, success, warning, error, info) |
| `LoadingSpinner` | Animated loading indicator |
| `AlertMessage` | Alert notifications for success, error, info |
| `ItemCard` | Complex auction item card with category visualization |
| `StatCard` | Statistics display card |
| `EmptyState` | Empty state template |
| `FormInput` | Form field components (TextInput, TextArea, SelectInput) |

## Database Schema

The application uses SQLite with Prisma ORM. See [domain-model.md](./domain-model.md) for detailed field documentation.

### Entity Relationships

```
┌──────────┐     ┌──────────┐     ┌─────────────┐
│ Scraper  │────<│ Auction  │────<│ AuctionItem │
└──────────┘     └──────────┘     └─────────────┘
                                         │
                                         │ mainCategoryId
                                         ▼
┌──────────┐     ┌─────────────────────┐
│ Category │────<│ CategoryProbability │
└──────────┘     └─────────────────────┘
```

### Models Overview

| Model | Description |
|-------|-------------|
| **Scraper** | Website source configuration (url, name, enabled status) |
| **Auction** | Auction listing (title, dates, hardware probability) |
| **AuctionItem** | Individual lot/item (title, price, bid count, main category) |
| **Category** | User-defined categories (name, description, isSystem flag) |
| **CategoryProbability** | AI-calculated probability per category per item |

### Key Constraints

- **50% Confidence Threshold**: `mainCategoryId` is only set if the highest probability >= 0.5
- **System Categories**: Categories with `isSystem = true` cannot be deleted or renamed
- **Cascade Deletes**: Deleting a scraper removes all its auctions and items

## API Overview

The backend provides a REST API organized into these categories:

| Category | Endpoints | Description |
|----------|-----------|-------------|
| **Scrapers** | `getScrapers`, `enableScraper`, `disableScraper`, `scrapeScraper`, `triggerScrape` | Manage scraper configurations and trigger scraping |
| **Auctions** | `getAuctions`, `getAuction`, `getItems` | Browse and filter auctions and items |
| **Categories** | `getCategories`, `getCategory`, `createCategory`, `updateCategory`, `deleteCategory`, `getItemsByCategory` | CRUD operations for categories |
| **AI Categorization** | `categorizeItem`, `categorizeItems`, `categorizeAuction`, `getItemCategorization` | AI-powered item categorization |
| **Statistics** | `getStats` | Dashboard statistics |

See [endpoints.md](./endpoints.md) for full API documentation.

## Data Flow

### Scraping Flow

```
1. Trigger scrape (manual or scheduled)
         │
         ▼
2. Scraper fetches auction listing pages
         │
         ▼
3. Parse HTML with Cheerio, extract auction cards
         │
         ▼
4. For each auction:
   ├── Upsert auction record (by URL)
   └── Extract items from auction detail page
         │
         ▼
5. For each item:
   ├── Upsert item record (by URL)
   └── Calculate hardware probability via AI
         │
         ▼
6. Store results in database
```

### AI Categorization Flow

```
1. User triggers categorization (single item, batch, or auction)
         │
         ▼
2. Build system prompt with category definitions
         │
         ▼
3. Build user prompt with item title + description
         │
         ▼
4. Call Azure OpenAI API (gpt-4.1-mini)
         │
         ▼
5. Parse JSON response with category probabilities
         │
         ▼
6. Store all probabilities in CategoryProbability table
         │
         ▼
7. Apply 50% confidence threshold:
   ├── If highest probability >= 0.5: Set mainCategoryId
   └── If highest probability < 0.5: mainCategoryId remains null
```

## Configuration

### config.toml Structure

```toml
[ai]
model = "gpt-4o"                              # AI model name
api_key = ""                                  # OpenAI API key (prefer env var)
base_url = ""                                 # Self-hosted model URL (optional)
azure_endpoint = "https://your-resource.openai.azure.com/"
azure_api_version = "2025-01-01-preview"
azure_deployment = "gpt-4.1-mini"

[scraping]
interval_minutes = 60                         # Scrape interval
timeout_seconds = 30                          # Request timeout
max_concurrent = 5                            # Parallel request limit

[database]
path = "./prisma/dev.db"                      # SQLite database path

[server]
port = 3000                                   # Server port
host = "localhost"                            # Server host

[[scrapers]]                                  # Pre-configured scrapers
name = "BOPA Veilingen"
url = "https://www.bopa.be"
image_url = "https://www.bopa.be/favicon.ico"
enabled = true
```

### Environment Variables

Environment variables override config.toml values:

| Variable | Description | Required |
|----------|-------------|----------|
| `AI_API_KEY` | Azure OpenAI API key | Yes (for AI features) |
| `AI_MODEL` | AI model name | No |
| `AI_AZURE_ENDPOINT` | Azure OpenAI endpoint URL | No |
| `AI_AZURE_API_VERSION` | Azure API version | No |
| `AI_AZURE_DEPLOYMENT` | Azure deployment name | No |
| `SERVER_PORT` | Backend server port | No (default: 3000) |
| `VITE_BACKEND_URL` | Backend URL for frontend | No (default: http://localhost:3000) |

## Getting Started

### Prerequisites

- **Bun** (recommended) or Node.js 18+
- **Git**

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd auction-categorization

# Install dependencies
bun install

# Set up database
bun run prisma-generate
cd packages/server && bunx prisma migrate dev

# Start development servers
bun run dev
```

### Access Points

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| API Documentation | http://localhost:3000/api |

### Development Commands

```bash
bun run dev           # Start both client and server
bun run dev:client    # Start frontend only
bun run dev:server    # Start backend only
bun run prisma-generate  # Generate Prisma client
```

## Additional Documentation

- [Domain Model](./domain-model.md) - Detailed database schema documentation
- [API Endpoints](./endpoints.md) - Complete REST API reference
- [Tech Stack](./techstack.md) - Technology stack details
- [Functionality](./functionality.md) - Feature descriptions and business logic
