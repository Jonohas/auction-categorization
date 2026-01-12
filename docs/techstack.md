# Technology Stack

This document describes the technology stack used in the Auction Categorization application.

## Overview

The application is a full-stack web application with:
- **Backend**: Express.js server with TypeScript
- **Frontend**: React application with TypeScript
- **Database**: SQLite with Prisma ORM
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
| ORM | Prisma | Type-safe database client |
| Migration Tool | Prisma Migrate | Database schema management |

### AI Integration
| Component | Technology | Purpose |
|-----------|------------|---------|
| Primary AI | Azure OpenAI | Category classification |
| Model | GPT-4.1-mini | Default categorization model |
| Fallback AI | OpenAI (standard) | Alternative AI provider |

### HTML Parsing & Scraping
| Component | Technology | Purpose |
|-----------|------------|---------|
| HTML Parser | Cheerio | jQuery-like HTML parsing |
| HTTP Client | Built-in fetch | Web requests |

### Configuration
| Component | Technology | Purpose |
|-----------|------------|---------|
| Format | TOML | Configuration file format |
| Loader | @iarna/toml | TOML parsing |

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

### Styling
| Component | Technology | Purpose |
|-----------|------------|---------|
| CSS Framework | Tailwind CSS | Utility-first styling |
| Version | 3.4 | Current version |

### Development Tools
| Component | Technology | Purpose |
|-----------|------------|---------|
| Build Tool | Vite | Development server & bundler |
| Linter | ESLint | Code quality |
| Type Checking | TypeScript Compiler | Type validation |

## API Client & Testing

### Bruno API Collection
| Component | Technology | Purpose |
|-----------|------------|---------|
| Testing Tool | Bruno | API endpoint testing |
| Format | .bru files | Bruno request files |

## File Structure

```
auction-categorization/
├── config/                 # Configuration files
│   └── config-example.toml
├── prisma/                 # Database layer
│   ├── schema.prisma      # Database schema
│   └── migrations/        # Database migrations
├── src/                    # Source code
│   ├── main.tsx           # Frontend entry point
│   ├── app.tsx            # Frontend app with routing
│   ├── app.css            # Global styles
│   └── server/            # Backend server
│       ├── index.ts       # Express server entry
│       ├── routes/
│       │   └── api.ts     # API route handlers
│       ├── services/      # Business logic
│       │   ├── aiCategorization.ts
│       │   ├── aiProbability.ts
│       │   └── scrapingService.ts
│       ├── scrapers/      # Website scrapers
│       │   ├── index.ts
│       │   └── bopaScraper.ts
│       └── lib/           # Shared utilities
│           ├── config.ts
│           ├── db.ts
│           └── sanitization.ts
├── bruno/                  # API test collections
│   └── Auction Scraper/
├── package.json           # Dependencies
├── vite.config.ts         # Vite configuration
├── tailwind.config.ts     # Tailwind configuration
└── tsconfig.json          # TypeScript configuration
```

## Dependencies

### Main Dependencies (package.json)
```json
{
  "dependencies": {
    "express": "^4.x",
    "@prisma/client": "^5.x",
    "openai": "^4.x",
    "cheerio": "^1.0.x",
    "@iarna/toml": "^2.2.x",
    "react": "^18.x",
    "react-dom": "^18.x",
    "react-router-dom": "^6.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "vite": "^5.x",
    "tailwindcss": "^3.x",
    "prisma": "^5.x",
    "@types/express": "^4.x",
    "@types/node": "^20.x"
  }
}
```

## Environment Configuration

### Configuration File (config/config-example.toml)

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
path = "./prisma/dev.db"

[server]
port = 3000
host = "localhost"

[[scrapers]]
name = "BOPA Veilingen"
url = "https://www.bopa.be"
image_url = "https://www.bopa.be/favicon.ico"
enabled = true
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
bun run build

# Start production server
bun run start
```

### Database
```bash
# Run migrations
bun prisma migrate dev

# Open Prisma Studio
bun prisma studio
```

## Browser Access

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | React application |
| Backend API | http://localhost:3000 | REST API server |
| Prisma Studio | http://localhost:5555 | Database GUI (dev) |
