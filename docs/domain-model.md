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
| id | String | @id, @default(cuid()) | Unique identifier |
| url | String | @unique | Website URL to scrape |
| name | String | - | Display name for the scraper |
| imageUrl | String? | optional | Favicon/logo URL for display |
| enabled | Boolean | @default(true) | Whether scraping is enabled |
| createdAt | DateTime | @default(now()) | Record creation timestamp |
| updatedAt | DateTime | @updatedAt | Last update timestamp |

**Relationships:**
- Has many `Auction` records (cascade delete)

## Auction

Represents an auction listing discovered from a scraper.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | @id, @default(cuid()) | Unique identifier |
| url | String | @unique | Auction page URL |
| title | String | - | Auction title |
| description | String? | optional | Auction description |
| startDate | DateTime? | optional | Auction start time |
| endDate | DateTime? | optional | Auction end time |
| hardwareProbability | Float? | optional | AI-calculated probability of containing hardware (0-1) |
| itemsCount | Int | @default(0) | Cached count of items in this auction |
| scraperId | String | @index | Foreign key to Scraper |
| createdAt | DateTime | @default(now()) | Record creation timestamp |
| updatedAt | DateTime | @updatedAt | Last update timestamp |

**Relationships:**
- Belongs to one `Scraper`
- Has many `AuctionItem` records (cascade delete)
- Indexed on `scraperId` and `hardwareProbability` for query performance

## AuctionItem

Represents an individual item/lot within an auction.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | @id, @default(cuid()) | Unique identifier |
| url | String | @unique | Item lot URL |
| title | String | - | Item title |
| description | String? | optional | Item description |
| imageUrl | String? | optional | Item image URL |
| currentPrice | Float? | optional | Current bid price |
| bidCount | Int | @default(0) | Number of bids |
| hardwareProbability | Float? | optional | AI-calculated probability of hardware (0-1) |
| mainCategoryId | String? | optional | Foreign key to assigned main Category |
| auctionId | String | @index | Foreign key to Auction |
| createdAt | DateTime | @default(now()) | Record creation timestamp |
| updatedAt | DateTime | @updatedAt | Last update timestamp |

**Relationships:**
- Belongs to one `Auction` (cascade delete)
- Belongs to one `Category` via `mainCategoryId` (optional)
- Has many `CategoryProbability` records (cascade delete)

**Notes:**
- `mainCategoryId` is only set if the highest category probability is >= 50%
- Indexed on `auctionId`, `hardwareProbability`, and `mainCategoryId`

## Category

Represents user-defined categories for classifying auction items.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | @id, @default(cuid()) | Unique identifier |
| name | String | @unique | Category name (must be unique) |
| description | String? | optional | Category description |
| isSystem | Boolean | @default(false) | System categories cannot be deleted/renamed |
| createdAt | DateTime | @default(now()) | Record creation timestamp |
| updatedAt | DateTime | @updatedAt | Last update timestamp |

**Relationships:**
- Has many `AuctionItem` via `mainCategoryId`
- Has many `CategoryProbability` records

**System Categories:**
- System categories (isSystem = true) are protected and cannot be deleted or renamed
- The "Other" category is used as a fallback for items that don't match other categories

## CategoryProbability

Stores AI-calculated category probabilities for each item.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | @id, @default(cuid()) | Unique identifier |
| probability | Float | - | AI-calculated probability (0-1) |
| itemId | String | @index, @unique([itemId, categoryId]) | Foreign key to AuctionItem |
| categoryId | String | @index | Foreign key to Category |
| createdAt | DateTime | @default(now()) | Record creation timestamp |
| updatedAt | DateTime | @updatedAt | Last update timestamp |

**Relationships:**
- Belongs to one `AuctionItem` (cascade delete)
- Belongs to one `Category` (cascade delete)

**Constraints:**
- Unique constraint on `[itemId, categoryId]` prevents duplicate probability records
- Indexed on `itemId` and `categoryId` for efficient lookups

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

## Example Queries

### Get auctions with items
```typescript
const auctions = await prisma.auction.findMany({
  include: {
    scraper: true,
    items: true,
  },
});
```

### Get items with category probabilities
```typescript
const items = await prisma.auctionItem.findMany({
  include: {
    mainCategory: true,
    categoryProbabilities: {
      include: { category: true },
      orderBy: { probability: 'desc' },
    },
  },
});
```

### Get category statistics
```typescript
const categories = await prisma.category.findMany({
  include: {
    _count: {
      select: { items: true },
    },
  },
});
```
