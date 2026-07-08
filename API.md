# API Reference Guide - Retail Sales Intelligence App

This document outlines the API endpoints, payloads, and response interfaces of the Retail Sales Intelligence Application.

---

## 1. System Endpoints

### A. Server Health Check
Retrieves system status, active database indicators, and API key availability.

- **URL:** `/api/health`
- **Method:** `GET`
- **Headers:** `None`
- **Response Format:** `application/json`

**Sample Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-07-08T01:21:00.000Z",
  "api_key_configured": true
}
```

---

### B. AI Sales Analysis & Strategic Consulting Report
Analyzes aggregated filter statistics and generates a tailored strategic business diagnostic using the Gemini API.

- **URL:** `/api/analyze`
- **Method:** `POST`
- **Headers:** `Content-Type: application/json`
- **Request Body Parameters:**

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `kpis` | `object` | Yes | Map of dynamic KPIs (Net Sales, Return rates, etc.) |
| `summary` | `object` | Yes | Map of outlet metrics, best/worst performance details |
| `filterState` | `object` | Yes | List of active dimensions used to generate statistics |

**Sample Request Body:**
```json
{
  "kpis": {
    "netSalesFormatted": "$145,200",
    "targetSalesFormatted": "$150,000",
    "targetAchievement": 96.8,
    "totalTransactions": 1200,
    "totalFootfall": 4000,
    "conversionRate": 30.0,
    "avgTransactionValueFormatted": "$121.00",
    "returnRate": 3.2,
    "discountRate": 6.8,
    "stockoutLevel": "Low"
  },
  "summary": {
    "bestRegion": { "name": "North", "sales": 45000 },
    "worstRegion": { "name": "South", "sales": 21000 },
    "bestStore": { "name": "Metro Hypermarket NY", "sales": 25000 },
    "worstStore": { "name": "Midtown Supermarket NY", "sales": 10000 },
    "storesMissingTarget": [
      { "name": "Midtown Supermarket NY", "achievement": 82.5, "netSales": 10000, "targetSales": 12121 }
    ],
    "categoriesReturns": [
      { "category": "Apparel", "returnAmount": 1200, "returnRate": 4.5 }
    ],
    "categoriesDiscounts": [
      { "category": "Electronics", "discountAmount": 3000, "discountRate": 8.5 }
    ],
    "regionsStockout": [
      { "region": "South", "stockoutRatio": 12.0 }
    ],
    "weeklyTrend": [
      { "week": "Week 21", "sales": 32000, "growthRate": 0 }
    ],
    "largestOpportunity": "Rebuilding sales momentum at Midtown Supermarket NY..."
  },
  "filterState": {
    "weeks": ["Week 21"],
    "regions": ["North", "South"],
    "stores": [],
    "cities": [],
    "storeFormats": [],
    "categories": []
  }
}
```

**Response Format:** `application/json`

**Sample Response:**
```json
{
  "analysis": "## Executive Performance Assessment\n\nThe business is currently operating at **96.8%** of target goals, indicating a mild $4,800 deficit. Net Sales volume stands at $145,200...\n\n## Operational Recommendations\n- Focus immediate support on **Midtown Supermarket NY**...\n- Expand apparel sizing options..."
}
```

---

## 2. Server Error Codes

The backend returns clean JSON error descriptions:

- **`400 Bad Request`**: Sent if `kpis` or `summary` parameters are missing from the request.
- **`500 Internal Server Error`**: Sent if the Gemini API fails or throws a rate-limit exception. The response carries the message description inside the `error` field.
