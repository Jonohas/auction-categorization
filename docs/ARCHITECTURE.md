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

| Layer | Technology |
|-------|------------|
| Runtime | Bun / Node.js |
| Backend Framework | Express.js 5.x |
| Database | SQLite + Drizzle ORM + libsql client |
| Frontend Framework | React 18 |
| Frontend Bundler | Vite 5 |
| Styling | Tailwind CSS 3 |
| Routing | React Router DOM 6 |
| AI Provider | Azure OpenAI (GPT-4.1-mini) |
| Web Scraping | Cheerio |
| Configuration | TOML |

## Repository Structure

```
auction-categorization/
├── packages/
│   ├── client/                 # React frontend application
│   └── server/                 # Express.js backend API
│       ├── src/
│       │   ├── index.ts        # Server entry point
│       │   ├── routes/api/     # File-based API routes
│       │   ├── services/      # Business logic
│       │   ├── scrapers/      # Web scraper implementations
│       │   ├── db/            # Drizzle schema and client
│       │   └── lib/           # Utilities
│       ├── db/                # SQLite database file
│       ├── drizzle/            # Database migrations
│       └── config/             # Configuration files
├── docs/                       # Documentation
├── package.json                # Root workspace configuration
└── bun.lock                    # Bun lockfile
```

## Backend Architecture

### Current Structure (Express.js with File-Based Routing)

```
packages/server/src/
├── index.ts                    # Express server entry point
│                               # - Initializes Express app
│                               # - Loads configuration
│                               # - Bootstraps system categories
│                               # - Sets up API routes
│
├── routes/api/                 # File-based API routes
│   ├── auctions/
│   │   ├── index.ts           # GET /api/auctions
│   │   ├── [id].ts            # GET /api/auctions/:id
│   │   └── trigger-scrape.ts # POST /api/auctions/trigger-scrape
│   │
│   ├── categories/
│   │   ├── index.ts           # GET/POST /api/categories
│   │   ├── [id].ts            # GET/PUT/DELETE /api/categories/:id
│   │   ├── create.ts          # POST /api/categories/create
│   │   ├── items.ts           # GET /api/categories/items
│   │   ├── main-category.ts   # POST /api/categories/main-category
│   │   └── probabilities.ts   # GET /api/categories/probabilities
│   │
│   ├── scrapers/
│   │   ├── index.ts           # GET /api/scrapers
│   │   └── [id]/
│   │       ├── enable.ts      # POST /api/scrapers/:id/enable
│   │       ├── disable.ts     # POST /api/scrapers/:id/disable
│   │       └── scrape.ts      # POST /api/scrapers/:id/scrape
│   │
│   ├── items/
│   │   ├── index.ts           # GET /api/items
│   │   ├── all.ts            # GET /api/items/all
│   │   ├── filter-options.ts # GET /api/items/filter-options
│   │   └── [id]/
│   │       └── probabilities.ts # GET /api/items/:id/probabilities
│   │
│   ├── websites/
│   │   ├── index.ts           # GET/POST /api/websites
│   │   ├── [id].ts           # GET/DELETE /api/websites/:id
│   │   └── [id]/scrape.ts    # POST /api/websites/:id/scrape
│   │
│   ├── categorization/
│   │   ├── item.ts           # POST /api/categorization/item
│   │   ├── items.ts          # POST /api/categorization/items
│   │   ├── auction.ts       # POST /api/categorization/auction
│   │   └── [id].ts           # GET /api/categorization/:id
│   │
│   ├── database/
│   │   ├── seed.ts           # POST /api/database/seed
│   │   └── wipe.ts           # POST /api/database/wipe
│   │
│   ├── health/
│   │   ├── index.ts          # GET /api/health
│   │   └── [id].ts           # GET /api/health/:id
│   │
│   └── stats/
│       └── index.ts          # GET /api/stats
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
├── db/
│   ├── schema.ts              # Drizzle ORM schema definitions
│   │                           # - scrapers, auctions, auctionItem
│   │                           # - categories, categoryProbability
│   │
│   ├── db.ts                  # Database client (libsql)
│   │                           # - Database connection management
│   │                           # - System category initialization
│   │
│   └── columns.helpers.ts     # Shared column definitions
│
└── lib/
    └── config.ts               # TOML configuration loader
                                # - Loads config.toml
                                # - Supports environment variable overrides
```

## Frontend Architecture

The frontend follows a **feature-based architecture** for scalability and maintainability.

### Project Structure

```
packages/client/src/
├── app/                        # Application layer
│   ├── app.tsx                 # Main application component with routing
│   ├── main.tsx                # React entry point
│   └── app.css                 # Global styles
│
├── components/                 # Shared components used across the entire application
│   ├── Layout.tsx             # Main layout with navigation bar
│   ├── PageHeader.tsx         # Reusable page title header with optional actions
│   ├── Card.tsx               # Composable card system (Card, CardHeader, CardContent, CardFooter)
│   ├── Modal.tsx               # Overlay modal dialog for forms
│   ├── Button.tsx              # Primary button with variants (primary, secondary, danger, ghost)
│   ├── Badge.tsx               # Badge with color variants (default, success, warning, error, info)
│   ├── LoadingSpinner.tsx      # Animated loading indicator
│   ├── AlertMessage.tsx        # Alert notifications for success, error, info
│   ├── ItemCard.tsx            # Complex auction item card with category visualization
│   ├── StatCard.tsx            # Statistics display card
│   ├── EmptyState.tsx          # Empty state template
│   ├── FormInput.tsx           # Form field components (TextInput, TextArea, SelectInput)
│   ├── Pagination.tsx          # Pagination controls
│   ├── BulkActionToolbar.tsx   # Bulk action toolbar for item selection
│   ├── ItemSelectionCheckbox.tsx # Checkbox for item selection
│   └── MultiSelectDropdown.tsx # Multi-select dropdown component
│
├── pages/                      # Page components
│   ├── HomePage.tsx            # Dashboard/home page
│   ├── AuctionsPage.tsx       # Auction listing page
│   ├── AuctionDetailPage.tsx   # Auction detail with items
│   ├── AllItemsPage.tsx        # All items listing page
│   ├── CategoriesPage.tsx      # Category management page
│   ├── CategoryDetailPage.tsx  # Category detail with items
│   ├── ScrapingPage.tsx        # Scraper management page
│   └── DatabasePage.tsx        # Database management page
│
├── stores/                     # Zustand state stores
│   └── itemSelectionStore.ts   # Item selection state for bulk actions
│
└── vite-env.d.ts              # Vite type declarations
```

## Database Schema

The application uses SQLite with Drizzle ORM. See [domain-model.md](./domain-model.md) for detailed field documentation.

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
| **Auction** | Auction listing (title, dates, items count) |
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
| **Auctions** | `GET /api/auctions`, `GET /api/auctions/:id`, `POST /api/auctions/trigger-scrape` | Browse and trigger scraping |
| **Categories** | `GET/POST /api/categories`, `GET/PUT/DELETE /api/categories/:id` | CRUD operations for categories |
| **Scrapers** | `GET /api/scrapers`, `POST /api/scrapers/:id/enable|disable|scrape` | Manage scraper configurations |
| **Items** | `GET /api/items`, `GET /api/items/all`, `GET /api/items/:id/probabilities` | Browse and filter items |
| **AI Categorization** | `POST /api/categorization/item|items|auction`, `GET /api/categorization/:id` | AI-powered item categorization |
| **Statistics** | `GET /api/stats` | Dashboard statistics |
| **Database** | `POST /api/database/seed|wipe` | Database management |
| **Health** | `GET /api/health`, `GET /api/health/:id` | Health check endpoints |
| **Websites** | `GET/POST /api/websites`, `GET/DELETE /api/websites/:id` | Website management |

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
path = "./db/dev.db"                           # SQLite database path

[server]
port = 3000                                   # Server port
host = "localhost"                            # Server host
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
```

## Additional Documentation

- [Domain Model](./domain-model.md) - Detailed database schema documentation
- [API Endpoints](./endpoints.md) - Complete REST API reference
- [Tech Stack](./techstack.md) - Technology stack details
- [Functionality](./functionality.md) - Feature descriptions and business logic