# Server Package

This is the Express.js backend server for the Auction Categorization application.

## Tech Stack

- **Runtime**: Bun (recommended) or Node.js
- **Framework**: Express.js 5.x
- **Database**: SQLite with Drizzle ORM
- **AI**: Azure OpenAI integration

## Installation

To install dependencies:

```bash
bun install
```

## Development

To run in development mode with hot reloading:

```bash
bun run dev
```

This starts the server at `http://localhost:3000` with file-based routing.

## Production Build

To build for production:

```bash
bun run build
```

To start the production server:

```bash
bun run start
```

## Database

The server uses SQLite with Drizzle ORM:

- **Database file**: `db/dev.db`
- **Migrations**: `drizzle/` folder
- **Schema**: `src/db/schema.ts`

## Configuration

Configuration is loaded from `config/config.toml`. Copy `config-example.toml` to `config.toml` and adjust as needed.

## API Routes

The server uses file-based routing under `src/routes/api/`:

- `/api/auctions` - Auction endpoints
- `/api/categories` - Category management
- `/api/scrapers` - Scraper configuration
- `/api/items` - Item queries
- `/api/websites` - Website management
- `/api/categorization` - AI categorization
- `/api/stats` - Dashboard statistics
- `/api/database` - Database operations
- `/api/health` - Health checks