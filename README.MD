# Auction Scraper with AI Categorization

A web application for scraping auction websites and automatically categorizing items using AI. Built with Node.js/Express backend and React frontend.

## Features

- **Web Scraping**: Scrape auction data from configurable sources
- **AI Categorization**: Automatically categorize auction items using Azure OpenAI
- **Category Management**: Create and manage categories with descriptions
- **Category Probabilities**: AI provides probability scores for each category
- **50% Confidence Threshold**: Items only get assigned a main category if AI confidence ≥ 50%
- **Responsive UI**: Works on desktop and mobile devices

## Tech Stack

### Backend
- **Runtime**: Node.js / Bun
- **Framework**: Express.js
- **Database**: SQLite with Prisma ORM
- **AI**: Azure OpenAI (GPT-4.1-mini)
- **API Documentation**: OpenAPI

### Frontend
- **Framework**: React 19
- **Routing**: TanStack Router
- **Styling**: Tailwind CSS
- **Bundler**: Bun

## Prerequisites

### Required Software

1. **Node.js** (v18 or higher)
   ```bash
   # Check version
   node --version
   ```

2. **Bun** (recommended for faster installation and execution)
   ```bash
   # Install Bun
   curl -fsSL https://bun.sh/install | bash
   ```

3. **Git**
   ```bash
   # Check version
   git --version
   ```

### Optional Services

1. **Azure OpenAI** (for AI categorization)
   - Azure subscription
   - Azure OpenAI resource
   - Deployment of `gpt-4.1-mini` or similar model

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd auction-categorization
   ```

2. **Install dependencies**
   ```bash
   # Using bun (recommended)
   bun install

   # Or using npm
   npm install
   ```

3. **Set up the database**
   ```bash
   # Generate Prisma client and run migrations
   bun run prisma-generate
   cd packages/server && bunx prisma migrate dev
   ```

4. **Configure environment** (optional)
   ```bash
   # Copy example config if needed
   # The config.toml file contains all settings
   ```

## Configuration

Edit `config/config.toml` to configure the application:

```toml
[ai]
# AI model configuration
model = "gpt-4o"

# API key - set to empty or use environment variable
api_key = ""

# Base URL for self-hosted models (optional)
base_url = ""

# Azure AI Foundry configuration
azure_endpoint = "https://your-resource.openai.azure.com/"
azure_api_version = "2025-01-01-preview"
azure_deployment = "gpt-4.1-mini"
```

### Environment Variables

You can also configure using environment variables:

| Variable | Description |
|----------|-------------|
| `AI_API_KEY` | Azure OpenAI API key |
| `AI_MODEL` | AI model name |
| `AI_AZURE_ENDPOINT` | Azure OpenAI endpoint URL |
| `AI_AZURE_API_VERSION` | Azure API version |
| `AI_AZURE_DEPLOYMENT` | Azure deployment name |
| `SERVER_PORT` | Backend server port (default: 3000) |

## Running the Application

### Development Mode

Start both backend and frontend in development mode:

```bash
# Start both client and server concurrently
bun run dev

# Or start them separately:
bun run dev:server    # Backend only
bun run dev:client    # Frontend only
```

### Production Build

```bash
# Build server
cd packages/server && bun run build

# Start production server
cd packages/server && bun run start
```

### Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api (OpenAPI)

## API Endpoints

### Auction Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/getAuctions` | List all auctions |
| GET | `/api/getAuction?id=` | Get auction details |
| GET | `/api/getItemsByCategory?categoryId=` | Get items by category |

### Category Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/getCategories` | List all categories |
| POST | `/api/createCategory` | Create a new category |
| POST | `/api/updateCategory` | Update a category |
| POST | `/api/deleteCategory` | Delete a category |

### AI Categorization Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/categorizeItem` | Categorize a single item |
| POST | `/api/categorizeItems` | Categorize multiple items |
| POST | `/api/categorizeAuction` | Categorize all items in an auction |
| GET | `/api/getItemCategorization?itemId=` | Get categorization results |

### Scraping Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/triggerScrape` | Trigger scraping for all enabled scrapers |
| POST | `/api/scrapeScraper` | Scrape a specific scraper |
| GET | `/api/getScrapers` | List all scrapers |
| POST | `/api/enableScraper` | Enable a scraper |
| POST | `/api/disableScraper` | Disable a scraper |

## Usage Guide

### Creating Categories

1. Navigate to the Categories page
2. Click "Add Category"
3. Enter a name and optional description
4. Click "Create"

### Categorizing Items

1. Go to an auction detail page
2. Click "AI Categorize All Items" to categorize all items at once
3. Or click "Categorize" on individual items

### Understanding Results

- **Category Badge**: Shown when AI confidence ≥ 50%
- **Categorize Button**: Shown when no confident prediction exists
- **Category Distribution**: Click "Show category distribution" to see all probabilities

### API Key Setup

To enable AI categorization:

1. Get your Azure OpenAI API key from Azure Portal
2. Add it to `config/config.toml` or set as environment variable
3. Configure `azure_endpoint` and `azure_deployment`
4. Restart the server

Example:
```bash
export AI_API_KEY="your-api-key"
export AI_AZURE_ENDPOINT="https://your-resource.openai.azure.com/"
export AI_AZURE_DEPLOYMENT="gpt-4.1-mini"
```

## Project Structure

This is a **Bun workspace monorepo** with separate client and server packages.

```
auction-categorization/
├── packages/
│   ├── client/                      # React frontend
│   │   ├── src/
│   │   │   ├── app.tsx              # Main React app with routing
│   │   │   ├── main.tsx             # React entry point
│   │   │   ├── pages/               # Page components
│   │   │   │   ├── HomePage.tsx
│   │   │   │   ├── AuctionsPage.tsx
│   │   │   │   ├── AuctionDetailPage.tsx
│   │   │   │   ├── CategoriesPage.tsx
│   │   │   │   ├── CategoryDetailPage.tsx
│   │   │   │   └── ScrapingPage.tsx
│   │   │   └── components/          # Reusable UI components
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── tailwind.config.ts
│   └── server/                      # Express backend
│       ├── src/
│       │   ├── index.ts             # Express server entry
│       │   ├── routes/
│       │   │   └── api.ts           # API route handlers
│       │   ├── services/
│       │   │   ├── aiCategorization.ts   # AI categorization logic
│       │   │   ├── aiProbability.ts      # AI probability scoring
│       │   │   └── scrapingService.ts    # Web scraping service
│       │   ├── scrapers/            # Web scraper implementations
│       │   │   └── bopaScraper.ts
│       │   └── lib/
│       │       ├── config.ts        # Configuration loader
│       │       ├── db.ts            # Prisma client
│       │       └── sanitization.ts
│       └── package.json
├── prisma/
│   ├── schema.prisma                # Database schema
│   ├── dev.db                       # SQLite database
│   └── migrations/                  # Database migrations
├── config/
│   └── config.toml                  # Application configuration
├── docs/
│   └── domain-model.md              # Domain model documentation
├── package.json                     # Root workspace configuration
└── README.md
```

## Troubleshooting

### Backend won't start

```bash
# Check if port 3000 is in use
lsof -ti:3000 | xargs kill -9

# Check configuration
cat config/config.toml

# Check database
cd packages/server && bunx prisma db push
```

### Frontend won't start

```bash
# Check if port 5173 is in use
lsof -ti:5173 | xargs kill -9

# Reinstall dependencies
rm -rf node_modules bun.lockb
bun install
```

### AI Categorization not working

1. Check API key is set correctly
2. Verify Azure OpenAI endpoint and deployment name
3. Check server logs for errors
4. Ensure categories exist in the database

```bash
# Test API key
curl -s -X POST "http://localhost:3000/api/categorizeItem" \
  -H "Content-Type: application/json" \
  -d '{"itemId": "your-item-id"}'
```

### Database issues

```bash
# Reset database (WARNING: loses all data)
rm prisma/dev.db
cd packages/server && bunx prisma migrate dev --name init
```

## License

MIT License
