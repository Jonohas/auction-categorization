# API Endpoints

This document describes all available REST API endpoints.

## Base URL

```
http://localhost:3000/api
```

## Response Format

All responses return JSON data. Error responses include an `error` field:

```json
{
  "error": "Error message"
}
```

## Statistics

### Get Dashboard Statistics

**Endpoint:** `GET /api/stats`

**Description:** Returns aggregated statistics for the dashboard.

**Response:**
```json
{
  "scraperCount": 5,
  "auctionCount": 150,
  "itemCount": 1200,
  "categoryProbabilityCount": 5000,
  "enabledScrapers": 3,
  "avgProbability": 0.65
}
```

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Success |
| 500 | Server error |

---

## Scrapers

### Get All Scrapers

**Endpoint:** `GET /api/scrapers`

**Description:** Returns all scrapers.

**Response:**
```json
[
  {
    "id": 1,
    "url": "https://www.bopa.be",
    "name": "BOPA Veilingen",
    "image_url": "https://www.bopa.be/favicon.ico",
    "enabled": true
  }
]
```

---

### Enable Scraper

**Endpoint:** `POST /api/scrapers/:id/enable`

**Description:** Enables a disabled scraper.

**Response:**
```json
{
  "success": true
}
```

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Invalid scraper ID |
| 500 | Server error |

---

### Disable Scraper

**Endpoint:** `POST /api/scrapers/:id/disable`

**Description:** Disables an enabled scraper.

**Response:**
```json
{
  "success": true
}
```

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Invalid scraper ID |
| 500 | Server error |

---

### Scrape Specific Scraper

**Endpoint:** `POST /api/scrapers/:id/scrape`

**Description:** Triggers scraping for a specific scraper.

**Response:**
```json
{
  "success": true,
  "scraperId": "1",
  "auctionsFound": 10,
  "newAuctions": 5
}
```

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Invalid scraper ID or scraper disabled |
| 404 | Scraper not found |
| 500 | Server error |

---

## Auctions

### Get All Auctions

**Endpoint:** `GET /api/auctions`

**Description:** Returns all auctions with optional filtering.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| scraperId | string | Filter by scraper (use "all" for all scrapers) |
| search | string | Search term for title/description |
| sortBy | string | Sort field: "date" (default) |
| sortOrder | string | Sort order: "asc" or "desc" (default) |

**Response:**
```json
[
  {
    "id": 1,
    "url": "https://www.bopa.be/auction/123",
    "title": "Server Equipment Auction",
    "description": "Various server equipment",
    "startDate": "2026-01-10T00:00:00.000Z",
    "endDate": "2026-01-20T00:00:00.000Z",
    "itemsCount": "25",
    "scraperId": 1,
    "createdAt": "2026-01-12T00:00:00.000Z",
    "updatedAt": "2026-01-12T00:00:00.000Z"
  }
]
```

---

### Get Auction Details

**Endpoint:** `GET /api/auctions/:id`

**Description:** Returns a single auction with all its items.

**Response:**
```json
{
  "id": 1,
  "url": "https://www.bopa.be/auction/123",
  "title": "Server Equipment Auction",
  "description": "Various server equipment",
  "startDate": "2026-01-10T00:00:00.000Z",
  "endDate": "2026-01-20T00:00:00.000Z",
  "itemsCount": "25",
  "scraperId": 1,
  "scraper": {
    "id": 1,
    "name": "BOPA Veilingen",
    "url": "https://www.bopa.be"
  },
  "items": [
    {
      "id": 1,
      "title": "Dell PowerEdge R740",
      "mainCategory": {"id": 1, "name": "Servers"},
      "categoryProbabilities": [...]
    }
  ],
  "createdAt": "2026-01-12T00:00:00.000Z",
  "updatedAt": "2026-01-12T00:00:00.000Z"
}
```

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Invalid auction ID |
| 404 | Auction not found |
| 500 | Server error |

---

### Trigger All Scraping

**Endpoint:** `POST /api/auctions/trigger-scrape`

**Description:** Triggers scraping for all enabled websites.

**Response:**
```json
{
  "results": [
    {
      "scraperId": "1",
      "success": true,
      "auctionsFound": 10,
      "newAuctions": 5
    }
  ]
}
```

---

## Items

### Get Items (by Auction)

**Endpoint:** `GET /api/items`

**Description:** Returns paginated items for an auction with filtering.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| auctionId | string | Auction ID (required) |
| search | string | Search term for title/description |
| sortBy | string | Sort field: "price" or "date" |
| sortOrder | string | Sort order: "asc" or "desc" |
| page | string | Page number (default: 1) |
| limit | string | Items per page (max: 100, default: 50) |

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "url": "https://www.bopa.be/item/456",
      "title": "Dell PowerEdge R740 Server",
      "description": "2U rack server with dual Xeon",
      "imageUrl": "https://example.com/image.jpg",
      "currentPrice": 1500.00,
      "bidCount": 12,
      "mainCategoryId": 1,
      "auctionId": 1,
      "createdAt": "2026-01-12T00:00:00.000Z",
      "updatedAt": "2026-01-12T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 25,
    "totalPages": 1
  }
}
```

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Auction ID required or invalid |
| 500 | Server error |

---

### Get All Items (Global)

**Endpoint:** `GET /api/items/all`

**Description:** Returns paginated items across all auctions with filtering.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| search | string | Search term for title/description |
| categoryIds | string | Comma-separated category IDs |
| scraperIds | string | Comma-separated scraper IDs |
| maxPrice | string | Maximum price filter |
| sortBy | string | Sort field: "price" or "date" |
| sortOrder | string | Sort order: "asc" or "desc" |
| page | string | Page number (default: 1) |
| limit | string | Items per page (max: 100, default: 100) |

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "title": "Dell PowerEdge R740 Server",
      "mainCategory": {"id": 1, "name": "Servers"},
      "auction": {
        "id": 1,
        "title": "Server Equipment Auction",
        "scraper": {"id": 1, "name": "BOPA"}
      },
      "categoryProbabilities": [...]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 500,
    "totalPages": 5
  }
}
```

---

### Get Filter Options

**Endpoint:** `GET /api/items/filter-options`

**Description:** Returns available filter options for items.

**Response:**
```json
{
  "categories": [
    {"id": 1, "name": "Servers", "itemCount": 45}
  ],
  "scrapers": [
    {"id": 1, "name": "BOPA Veilingen", "imageUrl": "..."}
  ]
}
```

---

### Get Item Probabilities

**Endpoint:** `GET /api/items/:id/probabilities`

**Description:** Returns an item with its category probabilities.

**Response:**
```json
{
  "id": 1,
  "title": "Dell PowerEdge R740 Server",
  "mainCategory": {"id": 1, "name": "Servers"},
  "categoryProbabilities": [
    {
      "id": 1,
      "probability": 0.85,
      "category": {"id": 1, "name": "Servers"}
    }
  ],
  "auction": {
    "id": 1,
    "title": "Server Equipment Auction",
    "scraper": {"id": 1, "name": "BOPA"}
  }
}
```

---

## Categories

### Get All Categories

**Endpoint:** `GET /api/categories`

**Description:** Returns all categories with item counts.

**Response:**
```json
[
  {
    "id": 1,
    "name": "Servers",
    "description": "Rack servers, blade servers, tower servers",
    "isSystem": false,
    "itemCount": 45,
    "createdAt": "2026-01-10T00:00:00.000Z",
    "updatedAt": "2026-01-10T00:00:00.000Z"
  }
]
```

---

### Get Category

**Endpoint:** `GET /api/categories/:id`

**Description:** Returns a single category.

**Response:**
```json
{
  "id": 1,
  "name": "Servers",
  "description": "Rack servers, blade servers, tower servers",
  "isSystem": false,
  "itemCount": 45,
  "createdAt": "2026-01-10T00:00:00.000Z",
  "updatedAt": "2026-01-10T00:00:00.000Z"
}
```

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Invalid category ID |
| 404 | Category not found |
| 500 | Server error |

---

### Create Category

**Endpoint:** `POST /api/categories`

**Description:** Creates a new category.

**Request Body:**
```json
{
  "name": "Storage",
  "description": "Storage devices, NAS, SAN equipment"
}
```

**Response:**
```json
{
  "success": true,
  "category": {
    "id": 2,
    "name": "Storage",
    "description": "Storage devices, NAS, SAN equipment",
    "isSystem": false,
    "createdAt": "2026-01-12T00:00:00.000Z",
    "updatedAt": "2026-01-12T00:00:00.000Z"
  }
}
```

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Category name required or already exists |
| 500 | Server error |

---

### Update Category

**Endpoint:** `PUT /api/categories/:id`

**Description:** Updates a category.

**Request Body:**
```json
{
  "name": "Storage Devices",
  "description": "Updated description"
}
```

**Response:**
```json
{
  "success": true,
  "category": {
    "id": 2,
    "name": "Storage Devices",
    "description": "Updated description",
    "isSystem": false,
    ...
  }
}
```

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Invalid ID, name required, or duplicate name |
| 403 | Cannot rename system category |
| 404 | Category not found |
| 500 | Server error |

---

### Delete Category

**Endpoint:** `DELETE /api/categories/:id`

**Description:** Deletes a category.

**Response:**
```json
{
  "success": true
}
```

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Invalid category ID |
| 403 | Cannot delete system category |
| 404 | Category not found |
| 500 | Server error |

---

### Get Items by Category

**Endpoint:** `GET /api/categories/items`

**Description:** Returns items assigned to a specific category.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| categoryId | string | Category ID (required) |
| page | string | Page number (default: 1) |
| limit | string | Items per page (max: 100, default: 50) |

**Response:**
```json
{
  "category": {
    "id": 1,
    "name": "Servers"
  },
  "items": [
    {
      "id": 1,
      "title": "Dell PowerEdge R740",
      "auction": {
        "id": 1,
        "title": "Server Auction",
        "scraper": {"id": 1, "name": "BOPA"}
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 45,
    "totalPages": 1
  }
}
```

---

### Save Item Probabilities

**Endpoint:** `POST /api/categories/probabilities`

**Description:** Saves AI-calculated probabilities for an item.

**Request Body:**
```json
{
  "itemId": "1",
  "probabilities": [
    { "categoryId": "1", "probability": 0.85 },
    { "categoryId": "2", "probability": 0.12 }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "item": {
    "id": 1,
    "mainCategoryId": 1,
    "categoryProbabilities": [...]
  }
}
```

---

### Set Item Main Category

**Endpoint:** `PUT /api/categories/main-category`

**Description:** Manually assigns a category to an item.

**Request Body:**
```json
{
  "itemId": "1",
  "categoryId": "1"
}
```

To remove the category assignment:
```json
{
  "itemId": "1",
  "categoryId": null
}
```

**Response:**
```json
{
  "success": true,
  "item": {
    "id": 1,
    "mainCategoryId": 1
  }
}
```

---

## AI Categorization

### Categorize Single Item

**Endpoint:** `POST /api/categorization/item`

**Description:** Uses AI to categorize a single item (returns probabilities without saving).

**Request Body:**
```json
{
  "itemId": "1"
}
```

**Response:**
```json
{
  "itemId": "1",
  "probabilities": [
    { "categoryId": "1", "probability": 0.85 },
    { "categoryId": "2", "probability": 0.12 }
  ]
}
```

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Invalid item ID or no categories defined |
| 404 | Item not found |
| 500 | Server error |

---

### Categorize Multiple Items

**Endpoint:** `POST /api/categorization/items`

**Description:** Uses AI to categorize multiple items.

**Request Body:**
```json
{
  "itemIds": ["1", "2", "3"],
  "saveResults": true
}
```

**Response:**
```json
{
  "itemCount": 3,
  "results": [
    {
      "itemId": "1",
      "probabilities": [...]
    }
  ],
  "saved": true
}
```

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Invalid item IDs, empty array, or no categories defined |
| 404 | No items found |
| 500 | Server error |

---

### Categorize Entire Auction

**Endpoint:** `POST /api/categorization/auction`

**Description:** Uses AI to categorize all items in an auction.

**Request Body:**
```json
{
  "auctionId": "1",
  "saveResults": true
}
```

**Response:**
```json
{
  "auctionId": 1,
  "itemCount": 25,
  "results": [
    {
      "itemId": "1",
      "probabilities": [...]
    }
  ],
  "saved": true
}
```

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Invalid auction ID, no items, or no categories defined |
| 404 | Auction not found |
| 500 | Server error |

---

### Get Item Categorization

**Endpoint:** `GET /api/categorization/:id`

**Description:** Returns an item with its categorization details.

**Response:**
```json
{
  "id": 1,
  "title": "Dell PowerEdge R740 Server",
  "mainCategory": {"id": 1, "name": "Servers"},
  "categoryProbabilities": [
    {
      "id": 1,
      "probability": 0.85,
      "category": {"id": 1, "name": "Servers"}
    }
  ],
  "auction": {
    "id": 1,
    "title": "Server Auction",
    "scraper": {"id": 1, "name": "BOPA"}
  }
}
```

---

## Websites

### Get All Websites

**Endpoint:** `GET /api/websites`

**Description:** Returns all websites (scrapers).

**Response:**
```json
[
  {
    "id": 1,
    "url": "https://www.bopa.be",
    "name": "BOPA Veilingen",
    "imageUrl": "https://www.bopa.be/favicon.ico",
    "enabled": true
  }
]
```

---

### Add Website

**Endpoint:** `POST /api/websites`

**Description:** Adds a new website (scraper).

**Request Body:**
```json
{
  "url": "https://example-auction.com"
}
```

**Response:**
```json
{
  "success": true,
  "scraper": {
    "id": 2,
    "url": "https://example-auction.com",
    "name": "Example Auctions",
    "imageUrl": "https://example-auction.com/favicon.ico",
    "enabled": true
  }
}
```

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Invalid URL or website already exists |
| 500 | Server error |

---

### Delete Website

**Endpoint:** `DELETE /api/websites/:id`

**Description:** Deletes a website and all its data.

**Response:**
```json
{
  "success": true
}
```

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Invalid website ID |
| 404 | Website not found |
| 500 | Server error |

---

### Scrape Website

**Endpoint:** `POST /api/websites/:id/scrape`

**Description:** Triggers scraping for a specific website.

**Response:**
```json
{
  "success": true,
  "scraperId": "1",
  "auctionsFound": 10,
  "newAuctions": 5
}
```

---

## Database

### Seed Database

**Endpoint:** `POST /api/database/seed`

**Description:** Seeds the database with categories and scrapers from config files.

**Response:**
```json
{
  "success": true,
  "message": "Database seeded successfully. Categories and scrapers have been initialized."
}
```

---

### Wipe Database Tables

**Endpoint:** `POST /api/database/wipe`

**Description:** Wipes specific database tables.

**Request Body:**
```json
{
  "tables": ["categoryProbabilities", "auctionItems", "auctions"]
}
```

Valid tables: `auctions`, `auctionItems`, `categoryProbabilities`

**Response:**
```json
{
  "success": true,
  "deleted": {
    "categoryProbabilities": 0,
    "auctionItems": 0,
    "auctions": 0
  }
}
```

---

## Health

### Health Check

**Endpoint:** `GET /api/health`

**Description:** Basic health check.

**Response:**
```json
"Hello world!"
```

---

## Error Handling

All endpoints return appropriate HTTP status codes:

| Status Code | Meaning |
|-------------|---------|
| 200 | Success |
| 400 | Bad Request - Invalid input |
| 403 | Forbidden - Cannot modify system categories |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |

Error responses include a descriptive message:

```json
{
  "error": "Invalid scraper ID"
}
```