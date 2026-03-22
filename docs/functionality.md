# Key Functionality

This document describes the key functionality of the Auction Categorization application.

## Overview

The Auction Categorization application provides the following core capabilities:

1. **Website Scraping** - Automatically discover and collect auctions from configured websites
2. **Hardware Detection** - AI-powered probability scoring for computer hardware/server equipment
3. **Item Categorization** - AI-driven categorization of auction items into user-defined categories
4. **Category Management** - Create, update, and manage custom categories
5. **Filtering & Search** - Browse auctions and items with advanced filters

## Website Scraping

### Supported Scrapers

| Scraper | Website | Description |
|---------|---------|-------------|
| BopaScraper | bopa.be | BOPA Veilingen auction website |

### Scraping Features

- **Automatic Discovery**: Scraper identifies auctions from the main listing pages
- **Pagination**: Handles multiple pages of auction listings
- **Duplicate Prevention**: Uses URL-based deduplication to avoid creating duplicate auctions
- **Concurrent Processing**: Multiple scrapers can run concurrently (configurable)
- **Item Extraction**: Extracts individual lots/items from each auction

### Scraping Process

```
1. Fetch auction listing page(s)
2. Parse auction cards/entries
3. Extract auction metadata (title, description, dates, URL)
4. Create/update auction records
5. Extract items from auction detail pages
6. Calculate hardware probability for each item
7. Store items in database
```

### Enabling/Disabling Scrapers

Scrapers can be enabled or disabled through the API:
- Disabled scrapers are skipped during batch scraping
- Disabled scrapers still appear in the UI for management

## Hardware Probability Scoring

### Purpose

The hardware probability feature uses AI to determine the likelihood that an auction/item contains computer hardware or server equipment.

### Probability Scale

| Probability | Meaning |
|-------------|---------|
| 0.0 - 0.3 | Unlikely to contain hardware |
| 0.3 - 0.7 | Possibly contains hardware |
| 0.7 - 1.0 | Very likely to contain hardware |

### Usage

Hardware probability is calculated:
- Automatically during scraping for each item
- On-demand via the `/api/categorization/item` endpoint
- In batch via `/api/categorization/auction` for entire auctions

## Item Categorization

### AI Categorization Process

The categorization service uses Azure OpenAI to analyze item titles and descriptions, then calculates probabilities for each category.

### Process Flow

```
1. User triggers categorization (single item, batch, or entire auction)
2. For each item:
   a. Build system prompt with category definitions
   b. Build user prompt with item title and description
   c. Call Azure OpenAI API
   d. Parse JSON response with category probabilities
   e. Store probabilities in CategoryProbability table
3. Apply 50% confidence threshold
4. Set main category for items with >= 50% confidence
```

### 50% Confidence Threshold

The application uses a **50% confidence threshold** for automatic category assignment:

- Only categories with probability >= 0.5 are considered for auto-assignment
- The highest-probability category above 50% becomes the main category
- Categories below 50% are stored but not assigned
- Users can manually override assigned categories

### Batch Processing

Items are processed in batches to:
- Avoid overwhelming the AI API
- Enable progress tracking
- Allow for retry on failures

### Fallback Categories

The system uses an "Other" system category as a fallback:
- Items with unrecognized categories get probability assigned to "Other"
- System categories cannot be deleted or renamed

## Category Management

### System Categories

System categories are protected and cannot be:
- Deleted
- Renamed

Typical system categories:
- **Other** - Fallback for uncategorized items

### User Categories

User-created categories:
- Can be created, updated, and deleted
- Support custom names and descriptions
- Used for organizing auction items

### Category Assignment

Categories can be assigned:
1. **Automatically** via AI (if >= 50% confidence)
2. **Manually** via the `/api/categories/main-category` endpoint

## Filtering & Search

### Auction Filtering

Available filters for `/api/auctions`:

| Filter | Type | Description |
|--------|------|-------------|
| scraperId | string | Filter by scraper source |
| search | string | Search in title and description |
| sortBy | string | Sort field (date) |
| sortOrder | string | Sort order (asc, desc) |

### Item Filtering

Available filters for `/api/items`:

| Filter | Type | Description |
|--------|------|-------------|
| auctionId | string | Filter by auction (required) |
| search | string | Search in title and description |
| sortBy | string | Sort field (price, date) |
| sortOrder | string | Sort order (asc, desc) |
| page | number | Page number (default: 1) |
| limit | number | Items per page (max: 100) |

### Global Item Filtering

Available filters for `/api/items/all`:

| Filter | Type | Description |
|--------|------|-------------|
| search | string | Search in title and description |
| categoryIds | string | Comma-separated category IDs |
| scraperIds | string | Comma-separated scraper IDs |
| maxPrice | string | Maximum price filter |
| sortBy | string | Sort field (price, date) |
| sortOrder | string | Sort order (asc, desc) |
| page | number | Page number (default: 1) |
| limit | number | Items per page (max: 100) |

### Category Filtering

Get items by category via `/api/categories/items`:
- Paginated results
- Includes auction and scraper information

## Input Sanitization

All API inputs are sanitized to prevent:
- SQL injection
- XSS attacks
- Invalid data types
- Malformed URLs

## Error Handling

### Common Error Responses

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Invalid ID/URL | Malformed request data |
| 400 | Scraper disabled | Cannot scrape disabled scraper |
| 400 | No categories | No categories defined |
| 404 | Not found | Resource doesn't exist |
| 403 | System category | Cannot modify system categories |
| 500 | Server error | Internal error |

### Graceful Degradation

- Missing AI API key: Returns error with helpful message
- AI API failure: Returns empty probabilities, logs error
- Database errors: Returns 500, logs error details

## Statistics & Dashboard

The dashboard provides aggregated statistics via `/api/stats`:

| Metric | Description |
|--------|-------------|
| scraperCount | Total number of scrapers |
| auctionCount | Total number of auctions |
| itemCount | Total number of items |
| categoryProbabilityCount | Total number of category probabilities |
| enabledScrapers | Number of enabled scrapers |
| avgProbability | Average probability across all items |

## Performance Considerations

### Database Indexes

The schema includes indexes for common query patterns:
- `scraper_index` on `auctions.scraperId` - Filter auctions by scraper
- `auction_items.auctionId` - Get items for auction
- `auction_items.mainCategoryId` - Get items by category
- `category_probability.itemId` - Get probabilities for item
- `category_probability.categoryId` - Get all probabilities for category

### Pagination

All list endpoints support pagination:
- Default page size: 50 items (or 100 for `/api/items/all`)
- Maximum page size: 100 items
- Pagination metadata included in response

### Batch Processing

AI categorization processes items in batches:
- Prevents API rate limiting
- Enables progress tracking