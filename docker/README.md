# Docker Deployment

This directory contains everything needed to build and run the auction-categorization application in Docker.

## Directory Structure

```
docker/
├── Dockerfile          # Multi-stage build for the application
├── docker-compose.yml  # Compose configuration for easy deployment
├── entrypoint.sh       # Container startup script
├── config/
│   └── config.toml     # Application configuration (mounted as volume)
├── prisma/
│   ├── schema.prisma   # Database schema
│   ├── migrations/     # Database migrations
│   └── dev.db          # SQLite database (created at runtime)
└── .gitignore          # Ignores config/ and prisma/ for local overrides
```

## Files Overview

### Dockerfile

A multi-stage build that creates an optimized production image:

1. **base** - Uses `oven/bun:1-alpine` as the runtime base
2. **dependencies** - Installs all workspace dependencies via `bun i`
3. **frontend** - Builds the Vite client application (`bunx vite build`)
4. **backend** - Generates Prisma client and bundles the server (`bun build`)
5. **production** - Final slim image containing:
   - Compiled frontend assets in `/app/dist`
   - Bundled backend in `/app/index.js`
   - Prisma schema and migrations in `/prisma` (copied to `/app/prisma` at runtime)

### docker-compose.yml

Simplifies deployment with:

- **Build context**: Uses parent directory (`..`) with the Dockerfile from this folder
- **Port mapping**: Exposes port `3000`
- **Timezone**: Set to `Europe/Brussels`
- **Restart policy**: `unless-stopped` for reliability
- **Volumes**:
  - `./config:/app/config` - Persist and customize configuration
  - `./prisma:/app/prisma` - Persist database and allow migration updates

### entrypoint.sh

Startup script that runs when the container starts:

1. Sets `NODE_ENV=production` (if not already set)
2. Checks if Prisma schema exists in the mounted volume
   - If missing, copies the bundled schema and migrations from `/prisma`
3. Runs `prisma migrate deploy` to apply any pending migrations
4. Starts the application with `bun index.js`

### config/config.toml

Application configuration file with sections for:

- **[ai]** - AI model settings (model name, API key, Azure endpoint)
- **[scraping]** - Scraper behavior (interval, timeout, concurrency)
- **[database]** - SQLite database path
- **[server]** - Server host and port
- **[[scrapers]]** - Predefined scraper configurations

### prisma/

Contains the database schema and migrations:

- **schema.prisma** - Defines models: `Scraper`, `Auction`, `AuctionItem`, `Category`, `CategoryProbability`
- **migrations/** - SQL migration files for schema changes
- **dev.db** - SQLite database file (created after first run)

## Quick Start

1. **Configure the application**

   Edit `config/config.toml` with your API keys and settings.

2. **Build and run**

   ```bash
   cd docker
   docker compose up -d --build
   ```

3. **View logs**

   ```bash
   docker compose logs -f
   ```

4. **Stop the container**

   ```bash
   docker compose down
   ```

## Data Persistence

The following directories are mounted as volumes and persist across container restarts:

| Volume | Purpose |
|--------|---------|
| `./config` | Application configuration |
| `./prisma` | Database file and migrations |

To reset the database, stop the container and delete `prisma/dev.db`.

## Updating

When pulling new changes that include database migrations:

1. The new migrations are bundled in the image at `/prisma`
2. On startup, `entrypoint.sh` runs `prisma migrate deploy`
3. Migrations are applied automatically to your existing database

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Application environment |
| `TZ` | `Europe/Brussels` | Container timezone |

## Ports

| Port | Description |
|------|-------------|
| 3000 | HTTP server (API + frontend) |