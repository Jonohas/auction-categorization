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

**Endpoint:** `GET /api/getStats`

**Description:** Returns aggregated statistics for the dashboard.

**Response:**
```json
{
  "scraperCount": 5,
  "auctionCount": 150,
  "itemCount": 1200,
  "avgProbability": 0.65,
  "enabledScrapers": 3
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

**Endpoint:** `GET /api/getScrapers`

**Description:** Returns all scrapers with auction counts.

**Response:**
```json
[
  {
    "id": "clx123abc",
    "url": "https://www.bopa.be",
    "name": "BOPA Veilingen",
    "imageUrl": "https://www.bopa.be/favicon.ico",
    "enabled": true,
    "auctions": []
  }
]
```

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Success |
| 500 | Server error |

---

### Trigger Single Scraper

**Endpoint:** `POST /api/scrapeScraper`

**Description:** Triggers scraping for a specific scraper.

**Request Body:**
```json
{
  "scraperId": "clx123abc"
}
```

**Response:**
```json
{
  "success": true,
  "auctionsFound": 10,
  "newAuctions": 5
}
```

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Invalid scraper ID, scraper disabled, or no scraper available |
| 404 | Scraper not found |
| 500 | Server error |

---

### Trigger All Scrapers

**Endpoint:** `POST /api/triggerScrape`

**Description:** Triggers scraping for all enabled scrapers concurrently.

**Request Body:** Empty

**Response:**
```json
{
  "results": [
    {
      "scraperId": "clx123abc",
      "success": true,
      "auctionsFound": 10,
      "newAuctions": 5
    }
  ]
}
```

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Success |
| 500 | Server error |

---

### Enable Scraper

**Endpoint:** `POST /api/enableScraper`

**Description:** Enables a disabled scraper.

**Request Body:**
```json
{
  "scraperId": "clx123abc"
}
```

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

**Endpoint:** `POST /api/disableScraper`

**Description:** Disables an enabled scraper.

**Request Body:**
```json
{
  "scraperId": "clx123abc"
}
```

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

### Add Website

**Endpoint:** `POST /api/addWebsite`

**Description:** Adds a new scraper dynamically.

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
    "id": "clx456def",
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

**Endpoint:** `POST /api/deleteWebsite`

**Description:** Deletes a scraper and all its auctions/items.

**Request Body:**
```json
{
  "id": "clx123abc"
}
```

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
| 400 | Invalid ID |
| 404 | Website not found |
| 500 | Server error |

---

### Test BOPA Scraping

**Endpoint:** `GET /api/scrapeBopa`

**Description:** Direct test endpoint for BOPA scraping (bypasses database).

**Response:**
```json
{
  "auctions": [...],
  "lastUpdated": "2026-01-12T10:30:00.000Z",
  "source": "https://www.bopa.be"
}
```

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Success |
| 500 | Server error |

---

## Auctions

### Get All Auctions

**Endpoint:** `GET /api/getAuctions`

**Description:** Returns all auctions with optional filtering.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| scraperId | string | Filter by scraper (use "all" for all scrapers) |
| minProbability | string | Minimum hardware probability (0-1) |
| maxProbability | string | Maximum hardware probability (0-1) |
| search | string | Search term for title/description |
| sortBy | string | Sort field: "probability" or "date" |
| sortOrder | string | Sort order: "asc" or "desc" |

**Response:**
```json
[
  {
    "id": "clx789ghi",
    "url": "https://www.bopa.be/auction/123",
    "title": "Server Equipment Auction",
    "description": "Various server equipment",
    "startDate": "2026-01-10T00:00:00.000Z",
    "endDate": "2026-01-20T00:00:00.000Z",
    "hardwareProbability": 0.85,
    "itemsCount": 25,
    "scraperId": "clx123abc",
    "scraper": {...},
    "items": [...],
    "createdAt": "2026-01-12T00:00:00.000Z",
    "updatedAt": "2026-01-12T00:00:00.000Z"
  }
]
```

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Success |
| 500 | Server error |

---

### Get Auction Details

**Endpoint:** `GET /api/getAuction`

**Description:** Returns a single auction with all its items.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Auction ID |

**Response:**
```json
{
  "id": "clx789ghi",
  "url": "https://www.bopa.be/auction/123",
  "title": "Server Equipment Auction",
  "description": "Various server equipment",
  "startDate": "2026-01-10T00:00:00.000Z",
  "endDate": "2026-01-20T00:00:00.000Z",
  "hardwareProbability": 0.85,
  "itemsCount": 25,
  "scraperId": "clx123abc",
  "scraper": {...},
  "items": [
    {
      "id": "item123",
      "title": "Dell PowerEdge R740",
      "mainCategory": {...},
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

## Auction Items

### Get Items

**Endpoint:** `GET /api/getItems`

**Description:** Returns paginated items for an auction with filtering.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| auctionId | string | Auction ID (required) |
| minProbability | string | Minimum hardware probability (0-1) |
| maxProbability | string | Maximum hardware probability (0-1) |
| search | string | Search term for title/description |
| sortBy | string | Sort field: "probability", "price", or "date" |
| sortOrder | string | Sort order: "asc" or "desc" |
| page | string | Page number (default: 1) |
| limit | string | Items per page (max: 100, default: 50) |

**Response:**
```json
{
  "items": [
    {
      "id": "item123",
      "url": "https://www.bopa.be/item/456",
      "title": "Dell PowerEdge R740 Server",
      "description": "2U rack server with dual Xeon",
      "imageUrl": "https://example.com/image.jpg",
      "currentPrice": 1500.00,
      "bidCount": 12,
      "hardwareProbability": 0.92,
      "mainCategoryId": "cat789",
      "auctionId": "clx789ghi",
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
| 400 | Invalid auction ID |
| 500 | Server error |

---

## Categories

### Get All Categories

**Endpoint:** `GET /api/getCategories`

**Description:** Returns all categories with item counts.

**Response:**
```json
[
  {
    "id": "cat789",
    "name": "Servers",
    "description": "Rack servers, blade servers, tower servers",
    "isSystem": false,
    "_count": {
      "items": 45
    },
    "createdAt": "2026-01-10T00:00:00.000Z",
    "updatedAt": "2026-01-10T00:00:00.000Z"
  }
]
```

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Success |
| 500 | Server error |

---

### Get Category

**Endpoint:** `GET /api/getCategory`

**Description:** Returns a single category.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Category ID |

**Response:**
```json
{
  "id": "cat789",
  "name": "Servers",
  "description": "Rack servers, blade servers, tower servers",
  "isSystem": false,
  "_count": {
    "items": 45
  },
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

**Endpoint:** `POST /api/createCategory`

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
    "id": "cat456",
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

**Endpoint:** `POST /api/updateCategory`

**Description:** Updates a category.

**Request Body:**
```json
{
  "id": "cat456",
  "name": "Storage Devices",
  "description": "Updated description"
}
```

**Response:**
```json
{
  "success": true,
  "category": {
    "id": "cat456",
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

**Endpoint:** `POST /api/deleteCategory`

**Description:** Deletes a category.

**Request Body:**
```json
{
  "id": "cat456"
}
```

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

**Endpoint:** `GET /api/getItemsByCategory`

**Description:** Returns items assigned to a specific category.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| categoryId | string | Category ID |
| page | string | Page number (default: 1) |
| limit | string | Items per page (max: 100, default: 50) |

**Response:**
```json
{
  "category": {
    "id": "cat789",
    "name": "Servers"
  },
  "items": [
    {
      "id": "item123",
      "title": "Dell PowerEdge R740",
      ...
      "auction": {
        "id": "clx789ghi",
        "scraper": {...}
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

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Invalid category ID |
| 404 | Category not found |
| 500 | Server error |

---

## AI Categorization

### Categorize Single Item

**Endpoint:** `POST /api/categorizeItem`

**Description:** Uses AI to categorize a single item.

**Request Body:**
```json
{
  "itemId": "item123"
}
```

**Response:**
```json
{
  "itemId": "item123",
  "probabilities": [
    {
      "categoryId": "cat789",
      "probability": 0.85
    },
    {
      "categoryId": "cat456",
      "probability": 0.12
    }
  ]
}
```

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Invalid item ID |
| 404 | Item not found |
| 400 | No categories defined |
| 500 | Server error |

---

### Categorize Multiple Items

**Endpoint:** `POST /api/categorizeItems`

**Description:** Uses AI to categorize multiple items.

**Request Body:**
```json
{
  "itemIds": ["item123", "item456", "item789"]
}
```

**Response:**
```json
{
  "results": [
    {
      "itemId": "item123",
      "probabilities": [...]
    },
    {
      "itemId": "item456",
      "probabilities": [...]
    }
  ]
}
```

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Invalid item IDs array, empty array, or no items found |
| 400 | No categories defined |
| 500 | Server error |

---

### Categorize Entire Auction

**Endpoint:** `POST /api/categorizeAuction`

**Description:** Uses AI to categorize all items in an auction and saves results.

**Request Body:**
```json
{
  "auctionId": "clx789ghi",
  "saveResults": true
}
```

**Response:**
```json
{
  "auctionId": "clx789ghi",
  "itemCount": 25,
  "results": [
    {
      "itemId": "item123",
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
| 400 | Invalid auction ID or no items in auction |
| 404 | Auction not found |
| 400 | No categories defined |
| 500 | Server error |

**Notes:**
- If `saveResults` is true, probabilities are stored and main categories are set
- Only categories with >= 50% probability are auto-assigned

---

### Save Item Category Probabilities

**Endpoint:** `POST /api/saveItemCategoryProbabilities`

**Description:** Saves AI-calculated probabilities for an item.

**Request Body:**
```json
{
  "itemId": "item123",
  "probabilities": [
    { "categoryId": "cat789", "probability": 0.85 },
    { "categoryId": "cat456", "probability": 0.12 }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "item": {
    "id": "item123",
    "mainCategoryId": "cat789",
    "categoryProbabilities": [...]
  }
}
```

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Invalid item ID, invalid probabilities array, or item not found |
| 500 | Server error |

**Notes:**
- Sets main category to highest probability if >= 50%

---

### Set Item Main Category

**Endpoint:** `POST /api/setItemMainCategory`

**Description:** Manually assigns a category to an item.

**Request Body:**
```json
{
  "itemId": "item123",
  "categoryId": "cat789"
}
```

To remove the category assignment:
```json
{
  "itemId": "item123",
  "categoryId": null
}
```

**Response:**
```json
{
  "success": true,
  "item": {
    "id": "item123",
    "mainCategoryId": "cat789"
  }
}
```

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Invalid item ID or category ID |
| 404 | Category not found (if categoryId provided) |
| 500 | Server error |

---

### Get Item with Probabilities

**Endpoint:** `GET /api/getItemCategoryProbabilities`

**Description:** Returns an item with its category probabilities.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| itemId | string | Item ID |

**Response:**
```json
{
  "id": "item123",
  "title": "Dell PowerEdge R740 Server",
  "mainCategory": {
    "id": "cat789",
    "name": "Servers"
  },
  "categoryProbabilities": [
    {
      "probability": 0.85,
      "category": {
        "id": "cat789",
        "name": "Servers"
      }
    }
  ],
  "auction": {
    "id": "clx789ghi",
    "scraper": {...}
  }
}
```

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Invalid item ID |
| 404 | Item not found |
| 500 | Server error |

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
