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
- **Runtime**: Bun (recommended) / Node.js
- **Framework**: Express.js 5.x
- **Database**: SQLite with Drizzle ORM + libsql client
- **AI**: Azure OpenAI (GPT-4.1-mini)
- **API Documentation**: OpenAPI

### Frontend
- **Framework**: React 18
- **Routing**: React Router DOM 6
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Bundler**: Vite

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
   # Generate database (SQLite)
   # Database is automatically created at packages/server/db/dev.db
   ```

4. **Configure environment** (optional)
   ```bash
   # Copy example config if needed
   cp packages/server/config/config-example.toml packages/server/config/config.toml
   # Edit packages/server/config/config.toml
   ```

## Configuration

Edit `packages/server/config/config.toml` to configure the application:

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

## Project Structure

This is a **Bun workspace monorepo** with separate client and server packages.

```
auction-categorization/
├── packages/
│   ├── client/                      # React frontend
│   │   ├── src/
│   │   │   ├── app.tsx             # Main React app with routing
│   │   │   ├── main.tsx            # React entry point
│   │   │   ├── pages/              # Page components
│   │   │   │   ├── HomePage.tsx
│   │   │   │   ├── AuctionsPage.tsx
│   │   │   │   ├── AuctionDetailPage.tsx
│   │   │   │   ├── AllItemsPage.tsx
│   │   │   │   ├── CategoriesPage.tsx
│   │   │   │   ├── CategoryDetailPage.tsx
│   │   │   │   ├── ScrapingPage.tsx
│   │   │   │   └── DatabasePage.tsx
│   │   │   ├── components/          # Reusable UI components
│   │   │   └── stores/              # Zustand state stores
│   │   └── package.json
│   └── server/                      # Express backend
│       ├── src/
│       │   ├── index.ts             # Express server entry
│       │   ├── db/
│       │   │   ├── schema.ts        # Drizzle schema
│       │   │   └── db.ts            # Database client
│       │   ├── routes/api/          # File-based API routes
│       │   │   ├── auctions/
│       │   │   ├── categories/
│       │   │   ├── scrapers/
│       │   │   ├── items/
│       │   │   ├── websites/
│       │   │   ├── categorization/
│       │   │   ├── database/
│       │   │   ├── health/
│       │   │   └── stats/
│       │   ├── services/
│       │   │   ├── aiCategorization.ts
│       │   │   ├── aiProbability.ts
│       │   │   └── scrapingService.ts
│       │   ├── scrapers/
│       │   │   ├── index.ts
│       │   │   └── bopaScraper.ts
│       │   └── lib/
│       │       └── config.ts
│       ├── db/                       # SQLite database & migrations
│       │   └── dev.db
│       ├── drizzle/                  # Drizzle migrations
│       ├── config/                    # Configuration files
│       └── package.json
├── package.json                      # Root workspace configuration
└── README.md
```

## Troubleshooting

### Backend won't start

```bash
# Check if port 3000 is in use
lsof -ti:3000 | xargs kill -9

# Check configuration
cat packages/server/config/config.toml

# Check database
ls -la packages/server/db/
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

### Database issues

```bash
# The project uses Drizzle ORM with SQLite
# Database file is at: packages/server/db/dev.db
```

## License

MIT License