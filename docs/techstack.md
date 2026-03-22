# Technology Stack

This document describes the technology stack used in the Auction Categorization application.

## Overview

The application is a full-stack web application with:
- **Backend**: Express.js server with TypeScript
- **Frontend**: React application with TypeScript
- **Database**: SQLite with Drizzle ORM
- **AI Services**: Azure OpenAI integration

## Backend

### Runtime Environment
| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| Runtime | Bun | Latest | JavaScript runtime (preferred) |
| Alternative | Node.js | 18+ | Alternative runtime |
| Package Manager | Bun | Latest | Dependency management |

### Web Framework
| Component | Technology | Purpose |
|-----------|------------|---------|
| Framework | Express.js | REST API server |
| Language | TypeScript | Type-safe JavaScript |
| Request Types | Express.Request/Response | HTTP request handling |

### Database Layer
| Component | Technology | Purpose |
|-----------|------------|---------|
| Database | SQLite | Lightweight file-based database |
| ORM | Drizzle | Type-safe database client |
| Client | libsql (@libsql/client) | SQLite client |
| Migration Tool | Drizzle Kit | Database schema management |

### AI Integration
| Component | Technology | Purpose |
|-----------|------------|---------|
| Primary AI | Azure OpenAI | Category classification |
| Model | GPT-4.1-mini | Default categorization model |
| SDK | OpenAI SDK | AI API calls |

### HTML Parsing & Scraping
| Component | Technology | Purpose |
|-----------|------------|---------|
| HTML Parser | Cheerio | jQuery-like HTML parsing |
| HTTP Client | Built-in fetch | Web requests |

### Configuration
| Component | Technology | Purpose |
|-----------|------------|---------|
| Format | TOML | Configuration file format |
| Parser | toml | TOML parsing |

## Frontend

### Core Framework
| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| Framework | React | 18.3.1 | UI component library |
| Language | TypeScript | 5.6 | Type-safe frontend |
| Bundler | Vite | 5.4 | Fast build tool |
| Package Manager | Bun | Latest | Dependency management |

### Routing
| Component | Technology | Purpose |
|-----------|------------|---------|
| Router | React Router DOM | Client-side routing |
| Version | 6.x | SPA routing |

### State Management
| Component | Technology | Purpose |
|-----------|------------|---------|
| State | Zustand | Lightweight state management |

### Styling
| Component | Technology | Purpose |
|-----------|------------|---------|
| CSS Framework | Tailwind CSS | Utility-first styling |
| Version | 3.4 | Current version |

## API Client & Testing

### Bruno API Collection
| Component | Technology | Purpose |
|-----------|------------|---------|
| Testing Tool | Bruno | API endpoint testing |
| Format | .bru files | Bruno request files |

## File Structure

```
auction-categorization/
├── packages/
│   ├── client/                 # React frontend
│   │   ├── src/
│   │   │   ├── app.tsx        # Main app with routing
│   │   │   ├── main.tsx       # Entry point
│   │   │   ├── pages/         # Page components
│   │   │   ├── components/    # UI components
│   │   │   └── stores/        # Zustand stores
│   │   └── package.json
│   │
│   └── server/                 # Express backend
│       ├── src/
│       │   ├── index.ts        # Server entry point
│       │   ├── routes/api/     # File-based API routes
│       │   ├── services/       # Business logic
│       │   │   ├── aiCategorization.ts
│       │   │   ├── aiProbability.ts
│       │   │   └── scrapingService.ts
│       │   ├── scrapers/       # Website scrapers
│       │   │   ├── index.ts
│       │   │   └── bopaScraper.ts
│       │   ├── db/             # Database schema
│       │   │   ├── schema.ts
│       │   │   └── db.ts
│       │   └── lib/            # Utilities
│       │       └── config.ts
│       ├── db/                  # SQLite database
│       ├── drizzle/             # Drizzle migrations
│       └── config/              # Configuration files
│
├── package.json                # Workspace root
└── bun.lock                    # Lockfile
```

## Dependencies

### Main Dependencies

**Server (packages/server/package.json):**
```json
{
  "dependencies": {
    "@libsql/client": "^0.17.0",
    "cheerio": "^1.0.0-rc.10",
    "dotenv": "^17.2.3",
    "drizzle-orm": "^0.45.1",
    "express": "^5.2.1",
    "openai": "^4.73.0",
    "toml": "^3.0.0"
  }
}
```

**Client (packages/client/package.json):**
```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.30.3",
    "zustand": "^5.0.10"
  }
}
```

## Environment Configuration

### Configuration File (packages/server/config/config-example.toml)

```toml
[ai]
model = "gpt-4o"
api_key = ""
base_url = ""
azure_endpoint = ""
azure_api_version = "2025-01-01-preview"
azure_deployment = ""

[scraping]
interval_minutes = 60
timeout_seconds = 30
max_concurrent = 5

[database]
path = "./db/dev.db"

[server]
port = 3000
host = "localhost"
```

### Environment Variables
| Variable | Description | Required |
|----------|-------------|----------|
| AI_API_KEY | OpenAI/Azure API key | Yes (for AI features) |
| AI_MODEL | Model name | No |
| AI_AZURE_ENDPOINT | Azure OpenAI endpoint | No |
| AI_AZURE_API_VERSION | Azure API version | No |
| AI_AZURE_DEPLOYMENT | Azure deployment name | No |
| SERVER_PORT | Server port | No (default: 3000) |

## Running the Application

### Development
```bash
# Run both frontend and backend
bun run dev

# Run only backend
bun run dev:server

# Run only frontend
bun run dev:client
```

### Production
```bash
# Build the application
cd packages/server && bun run build

# Start production server
cd packages/server && bun run start
```

## Browser Access

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | React application |
| Backend API | http://localhost:3000 | REST API server |