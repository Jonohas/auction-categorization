# Domain Model Documentation

This document describes the domain models used in the Auction Categorization application.

## Overview

The application uses a relational database schema with the following main entities:

- **Scraper**: Represents a website source from which auctions are scraped
- **Auction**: Represents an auction listing from a scraper
- **AuctionItem**: Represents an individual item/lot within an auction
- **Category**: Represents user-defined categories for classifying items
- **CategoryProbability**: Stores AI-calculated probabilities for each category on an item

## Entity Relationships

```
Scraper 1──n Auction
Auction 1──n AuctionItem
Category 1──n AuctionItem (via mainCategoryId)
Category 1──n CategoryProbability
AuctionItem 1──n CategoryProbability
```

## Scraper

Represents a website source that is monitored for auctions.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | integer | @id, primary key, autoincrement | Unique identifier |
| url | text | @unique | Website URL to scrape |
| name | text | not null | Display name for the scraper |
| image_url | text | optional | Favicon/logo URL for display |
| enabled | boolean | default: true | Whether scraping is enabled |
| created_at | integer | timestamp | Record creation timestamp |
| updated_at | integer | timestamp | Last update timestamp |

**Relationships:**
- Has many `Auction` records (cascade delete)

## Auction

Represents an auction listing discovered from a scraper.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | integer | @id, primary key, autoincrement | Unique identifier |
| url | text | @unique | Auction page URL |
| title | text | not null | Auction title |
| description | text | optional | Auction description |
| startDate | integer | timestamp, optional | Auction start time |
| endDate | integer | timestamp, optional | Auction end time |
| itemsCount | text | not null | Cached count of items in this auction |
| scraperId | integer | foreign key (scrapers.id), indexed | Reference to Scraper |
| created_at | integer | timestamp | Record creation timestamp |
| updated_at | integer | timestamp | Last update timestamp |

**Relationships:**
- Belongs to one `Scraper`
- Has many `AuctionItem` records (cascade delete)
- Indexed on `scraperId` for query performance

## AuctionItem

Represents an individual item/lot within an auction.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | integer | @id, primary key, autoincrement | Unique identifier |
| url | text | @unique | Item lot URL |
| title | text | not null | Item title |
| description | text | optional | Item description |
| imageUrl | text | optional | Item image URL |
| currentPrice | real | optional | Current bid price |
| bidCount | integer | not null, default: 0 | Number of bids |
| mainCategoryId | integer | foreign key (categories.id), optional | Reference to assigned main Category |
| auctionId | integer | foreign key (auctions.id), indexed | Reference to Auction |
| created_at | integer | timestamp | Record creation timestamp |
| updated_at | integer | timestamp | Last update timestamp |

**Relationships:**
- Belongs to one `Auction` (cascade delete)
- Belongs to one `Category` via `mainCategoryId` (optional)
- Has many `CategoryProbability` records (cascade delete)

**Notes:**
- `mainCategoryId` is only set if the highest category probability is >= 50%
- Indexed on `auctionId` and `mainCategoryId`

## Category

Represents user-defined categories for classifying auction items.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | integer | @id, primary key, autoincrement | Unique identifier |
| name | text | not null | Category name |
| description | text | optional | Category description |
| isSystem | boolean | optional | System categories cannot be deleted/renamed |
| created_at | integer | timestamp | Record creation timestamp |
| updated_at | integer | timestamp | Last update timestamp |

**Relationships:**
- Has many `AuctionItem` via `mainCategoryId`
- Has many `CategoryProbability` records

**System Categories:**
- System categories (`isSystem = true`) are protected and cannot be deleted or renamed
- The "Other" category is used as a fallback for items that don't match other categories

## CategoryProbability

Stores AI-calculated category probabilities for each item.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | integer | @id, primary key, autoincrement | Unique identifier |
| probability | real | not null | AI-calculated probability (0-1) |
| categoryId | integer | foreign key (categories.id), indexed | Reference to Category |
| itemId | integer | foreign key (auctionItem.id), indexed | Reference to AuctionItem |
| created_at | integer | timestamp | Record creation timestamp |
| updated_at | integer | timestamp | Last update timestamp |

**Relationships:**
- Belongs to one `AuctionItem` (cascade delete)
- Belongs to one `Category` (cascade delete)

**Constraints:**
- Unique constraint on `[itemId, categoryId]` prevents duplicate probability records
- Indexed on `itemId` and `categoryId` for efficient lookups

## Schema Definition (Drizzle ORM)

```typescript
import { sqliteTable, text, integer, index, real } from "drizzle-orm/sqlite-core";

export const scrapers = sqliteTable("scrapers", {
    id: integer("id").primaryKey().autoincrement(),
    url: text("url").unique(),
    name: text("name").notNull(),
    image_url: text("image_url"),
    enabled: integer({mode: 'boolean'}),
    created_at: integer("created_at"),
    updated_at: integer("updated_at"),
});

export const auctions = sqliteTable("auctions", {
    id: integer("id").primaryKey().autoincrement(),
    url: text().unique(),
    title: text("title").notNull(),
    description: text("description"),
    startDate: integer({mode: 'timestamp'}),
    endDate: integer({mode: 'timestamp'}),
    itemsCount: text("items").notNull(),
    scraperId: integer("scraper_id").references(() => scrapers.id),
    created_at: integer("created_at"),
    updated_at: integer("updated_at"),
}, (table) => [
    index("scraper_index").on(table.scraperId)
]);

export const auctionItem = sqliteTable("auction_items", {
    id: integer("id").primaryKey().autoincrement(),
    url: text("url").unique(),
    title: text("title").notNull(),
    description: text("description"),
    imageUrl: text("image_url"),
    currentPrice: real("current_price"),
    bidCount: integer("bid_count").notNull().default(0),
    mainCategoryId: integer("main_category_id").references(() => categories.id),
    auctionId: integer("auction_id").references(() => auctions.id),
    created_at: integer("created_at"),
    updated_at: integer("updated_at"),
});

export const categories = sqliteTable("categories", {
    id: integer("id").primaryKey().autoincrement(),
    name: text("name").notNull(),
    description: text("description"),
    isSystem: integer({mode: 'boolean'}),
    created_at: integer("created_at"),
    updated_at: integer("updated_at"),
});

export const categoryProbability = sqliteTable("category_probability", {
    id: integer("id").primaryKey().autoincrement(),
    probability: real("probability"),
    categoryId: integer("category_id").references(() => categories.id),
    itemId: integer("item_id").references(() => auctionItem.id),
    created_at: integer("created_at"),
    updated_at: integer("updated_at"),
});
```

## Data Flow

### Scraping Flow
1. Scraper fetches auction pages from configured websites
2. Auctions are created/updated based on discovered listings
3. Items are extracted from each auction
4. Hardware probability is calculated for each item using AI

### Categorization Flow
1. User triggers AI categorization for items
2. AI analyzes item title and description
3. Probabilities are calculated for each category
4. If highest probability >= 50%, that category becomes the main category
5. All probabilities are stored for reference

## Confidence Threshold

The application uses a **50% confidence threshold** for automatic category assignment:

- Only categories with probability >= 0.5 (50%) are considered for automatic assignment
- The highest-probability category above 50% becomes the `mainCategoryId`
- Categories below 50% threshold are stored but not assigned as main category
- Users can manually override the assigned category

## Example Queries (Drizzle ORM)

### Get auctions with items
```typescript
import { db } from "./db/db.ts";
import { auctions, auctionItem, scrapers } from "./db/schema.ts";

const allAuctions = await db.select().from(auctions);
```

### Get items with category probabilities
```typescript
import { eq } from "drizzle-orm";
import { auctionItem, categoryProbability, categories } from "./db/schema.ts";

const items = await db.select().from(auctionItem);
```

### Get category statistics
```typescript
import { categories } from "./db/schema.ts";

const allCategories = await db.select().from(categories);
```