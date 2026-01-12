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
- **Pagination**: Handles multiple pages of auction listings (up to 100 pages)
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

### Scoring Factors

The AI considers:
- **Servers, rack servers, blade servers**
- **CPUs, GPUs, RAM/memory modules**
- **Storage devices (SSDs, hard drives)**
- **Network equipment (switches, routers)**
- **Computer components and accessories**
- **Workstations and enterprise hardware**

### Probability Scale

| Probability | Meaning |
|-------------|---------|
| 0.0 - 0.3 | Unlikely to contain hardware |
| 0.3 - 0.7 | Possibly contains hardware |
| 0.7 - 1.0 | Very likely to contain hardware |

### Usage

Hardware probability is calculated:
- Automatically during scraping for each item
- On-demand via the `/api/categorizeItem` endpoint
- In batch via `/api/categorizeAuction` for entire auctions

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

Items are processed in batches (5 items per batch) to:
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
2. **Manually** via the setItemMainCategory endpoint

## Filtering & Search

### Auction Filtering

Available filters for `/api/getAuctions`:

| Filter | Type | Description |
|--------|------|-------------|
| scraperId | string | Filter by scraper source |
| minProbability | number | Minimum hardware probability (0-1) |
| maxProbability | number | Maximum hardware probability (0-1) |
| search | string | Search in title and description |
| sortBy | string | Sort field (probability, date) |
| sortOrder | string | Sort order (asc, desc) |

### Item Filtering

Available filters for `/api/getItems`:

| Filter | Type | Description |
|--------|------|-------------|
| auctionId | string | Filter by auction |
| minProbability | number | Minimum hardware probability |
| maxProbability | number | Maximum hardware probability |
| search | string | Search in title and description |
| sortBy | string | Sort field (probability, price, date) |
| sortOrder | string | Sort order (asc, desc) |
| page | number | Page number (default: 1) |
| limit | number | Items per page (max: 100) |

### Category Filtering

Get items by category via `/api/getItemsByCategory`:
- Paginated results
- Includes auction and scraper information

## Input Sanitization

All API inputs are sanitized to prevent:
- SQL injection
- XSS attacks
- Invalid data types
- Malformed URLs

### Sanitization Functions

| Function | Purpose |
|----------|---------|
| sanitizeId | Validates CUID/ID format |
| sanitizeSearchQuery | Escapes special characters |
| sanitizeProbability | Validates 0-1 range |
| sanitizeUrl | Validates URL format |

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

- Missing AI API key: Returns default probabilities (0.5)
- AI API failure: Returns empty probabilities, logs error
- Database errors: Returns 500, logs error details

## Statistics & Dashboard

The dashboard provides aggregated statistics:

| Metric | Endpoint | Description |
|--------|----------|-------------|
| scraperCount | getStats | Total number of scrapers |
| auctionCount | getStats | Total number of auctions |
| itemCount | getStats | Total number of items |
| avgProbability | getStats | Average hardware probability |
| enabledScrapers | getStats | Number of enabled scrapers |

## Performance Considerations

### Database Indexes

The schema includes indexes for common query patterns:
- `Auction.scraperId` - Filter auctions by scraper
- `Auction.hardwareProbability` - Filter/sort by probability
- `AuctionItem.auctionId` - Get items for auction
- `AuctionItem.hardwareProbability` - Filter items by probability
- `AuctionItem.mainCategoryId` - Get items by category
- `CategoryProbability.itemId` - Get probabilities for item
- `CategoryProbability.categoryId` - Get all probabilities for category

### Pagination

All list endpoints support pagination:
- Default page size: 50 items
- Maximum page size: 100 items
- Pagination metadata included in response

### Batch Processing

AI categorization processes items in batches:
- Batch size: 5 items
- Delay between batches: 500ms
- Prevents API rate limiting
