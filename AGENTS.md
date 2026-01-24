# AGENTS.md - Development Guidelines for Auction Categorization

This document provides essential information for AI coding agents working on the auction-categorization project.

## Project Overview

This is a Bun workspace monorepo with:
- **Client**: React 18 + TypeScript + Vite + Tailwind CSS frontend
- **Server**: Node.js/Express + TypeScript + Prisma + SQLite backend
- **Purpose**: Web scraping auction sites and AI-powered item categorization

## Build/Lint/Test Commands

### Development Commands
```bash
# Start both client and server in development mode
bun run dev

# Start client only (React dev server on port 5173)
bun run dev:client

# Start server only (Express server on port 3000)
bun run dev:server
```

### Type Checking
```bash
# Type check server code
cd packages/server && bun run typecheck
```

### Build Commands
```bash
# Build server for production
cd packages/server && bun run build

# Start production server
cd packages/server && bun run start
```

### Database Commands
```bash
# Generate Prisma client
bun run prisma-generate

# Run database migrations
cd packages/server && bunx prisma migrate dev
```

### Running a Single Test
There are currently no test files configured. To add tests:
1. Install a testing framework like Vitest for client or Jest for server
2. Add test scripts to package.json
3. Run tests with the appropriate command (e.g., `bun test` or `npm test`)

### Linting
No linting tools are currently configured. Consider adding:
- ESLint for JavaScript/TypeScript linting
- Prettier for code formatting
- Run with: `bun run lint` (after configuration)

## Code Style Guidelines

### TypeScript Configuration
- **Strict mode**: Enabled (`"strict": true`)
- **ES Modules**: Use `"type": "module"` in package.json
- **Target**: ESNext for modern JavaScript features
- **Module resolution**: Bundler mode for optimal tree-shaking

### Import Style
```typescript
// External dependencies first
import express from "express";
import type { Request, Response } from "express";

// Relative imports with proper paths
import { loadConfig } from "../lib/config";
import type { ScrapedAuction } from "../scrapers";

// React imports
import type { ReactNode, ButtonHTMLAttributes } from "react";
```

### Naming Conventions
- **Variables/Functions**: camelCase (`getAuctions`, `scrapeWebsite`)
- **Components**: PascalCase (`Button`, `AuctionCard`)
- **Types/Interfaces**: PascalCase (`ButtonProps`, `AuctionItem`)
- **Files**: PascalCase for components, camelCase for utilities
- **Constants**: UPPER_SNAKE_CASE (`MAX_CONCURRENT_SCRAPES`)

### Component Patterns (React)
```typescript
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  // Implementation
}
```

### Server Patterns (Express/TypeScript)
```typescript
// Route handlers with proper typing
export async function getAuctions(req: Request, res: Response) {
  try {
    const auctions = await prisma.auction.findMany();
    res.json(auctions);
  } catch (error) {
    console.error("Error fetching auctions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Service functions with return types
export interface ScrapeResult {
  success: boolean;
  scraperId: string;
  auctionsFound: number;
  auctionsCreated: number;
  error?: string;
}

export async function scrapeWebsite(scraperId: string): Promise<ScrapeResult> {
  // Implementation
}
```

### Database Patterns (Prisma)
```typescript
// Use Prisma client with proper error handling
const scraper = await prisma.scraper.findUnique({
  where: { id: scraperId },
});

// Upsert operations for safe updates
await prisma.auctionItem.upsert({
  where: { url: item.url },
  create: data,
  update: data,
});
```

### Error Handling
- **Server**: Use try/catch blocks, return appropriate HTTP status codes
- **Client**: Handle API errors gracefully, show user-friendly messages
- **Async operations**: Always await promises, handle rejections
- **Logging**: Use console.error for errors, console.log for info

### Styling (Tailwind CSS)
```typescript
// Component with conditional styling
<button
  className={`inline-flex items-center justify-center border rounded-md shadow-sm font-medium transition-colors ${
    variant === "primary"
      ? "bg-indigo-600 text-white hover:bg-indigo-700"
      : "bg-white text-gray-700 hover:bg-gray-50"
  } ${className}`}
>
  {children}
</button>
```

### File Organization
```
packages/
├── client/src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Page components
│   ├── stores/        # Zustand stores
│   └── main.tsx       # Entry point
└── server/src/
    ├── routes/        # API route handlers
    ├── services/      # Business logic
    ├── scrapers/      # Web scraping implementations
    ├── lib/           # Utilities and config
    └── index.ts       # Server entry point
```

### Security Best Practices
- **Input validation**: Sanitize user inputs and API data
- **Environment variables**: Never commit secrets, use .env files
- **CORS**: Configure properly for production
- **SQL injection**: Use Prisma's parameterized queries
- **Rate limiting**: Consider implementing for scraping endpoints

### Performance Considerations
- **Database queries**: Use Prisma's include/select to avoid N+1 queries
- **API responses**: Paginate large datasets
- **Image optimization**: Lazy load images, optimize formats
- **Bundle size**: Monitor and optimize client bundle

### Git Workflow
- **Commit messages**: Use conventional commits (feat:, fix:, docs:, etc.)
- **Branch naming**: feature/, bugfix/, hotfix/
- **PR reviews**: Required for all changes
- **Testing**: Ensure builds pass before merging

## AI-Specific Guidelines

### When Adding New Features
1. Update TypeScript interfaces first
2. Implement server-side logic
3. Add API endpoints
4. Create/update React components
5. Test end-to-end functionality

### Code Review Checklist
- [ ] TypeScript types are correct and complete
- [ ] Error handling is appropriate
- [ ] Database queries are optimized
- [ ] Security best practices followed
- [ ] Code follows established patterns
- [ ] Tests added/updated (when applicable)

### Common Patterns to Follow
- Use functional components with hooks (React)
- Prefer async/await over Promises
- Keep components small and focused
- Use custom hooks for shared logic
- Follow REST API conventions
- Use proper HTTP status codes

## Getting Help

- **Build issues**: Check package.json scripts and dependencies
- **Type errors**: Run `bun run typecheck` in server package
- **Database issues**: Check Prisma schema and run migrations
- **Runtime errors**: Check server logs and client console

## Environment Setup

### Required Tools
- Node.js 18+
- Bun (recommended)
- Git

### Development Environment
- Client runs on http://localhost:5173
- Server runs on http://localhost:3000
- Database: SQLite (packages/server/prisma/dev.db)

### Configuration
- Server config: config/config.toml
- Environment variables: Override config.toml values
- Database: Auto-generated from Prisma schema</content>
<parameter name="filePath">AGENTS.md