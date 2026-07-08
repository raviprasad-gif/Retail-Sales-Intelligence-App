# System Architecture Guide - Retail Sales Intelligence App

This document describes the software architecture, data pipelines, and security mechanisms of the Retail Sales Intelligence Application.

## 1. High-Level Architecture Block Diagram

```
+--------------------------------------------------------------------------+
|                            CLIENT BROWSER (SPA)                          |
|                                                                          |
|   +--------------------------+    +----------------------------------+   |
|   |   Data Upload (SheetJS)  |    |    Recharts Analytics Deck       |   |
|   | - Parse excel files      |    | - 12 interactive visualizations  |   |
|   | - Validate schemas       |    | - Collapsible filtering sidebar  |   |
|   +-------------+------------+    +----------------+-----------------+   |
|                 |                                  ^                     |
|                 v                                  |                     |
|         [Merged JSON rows]                         |                     |
|                 |                                  |                     |
|                 +---------> [Filter & Recalc] -----+                     |
|                                   |                                      |
|                                   v                                      |
|                       [Aggregated Statistics]                            |
|                                   |                                      |
+-----------------------------------|--------------------------------------+
                                    | Secure Proxy Request
                                    v (POST /api/analyze)
+-----------------------------------|--------------------------------------+
|                           EXPRESS SERVER                                 |
|                                                                          |
|   +-------------------------------+    +-----------------------------+   |
|   |      API Endpoint             |--->|       @google/genai         |   |
|   |   - JSON schema validation    |    |  - gemini-3.5-flash model   |   |
|   |   - Fallback analysis logic   |    |  - Secure key management    |   |
|   +-------------------------------+    +--------------+--------------+   |
+-------------------------------------------------------|------------------+
                                                        v
                                                 [Gemini API]
```

## 2. Component Design & Responsibilities

The application implements a decoupled, full-stack design:

### A. Client Layer (React 18 & Vite)
- **`App.tsx`**: Governs global application state, active filters, metric re-calculations, and dark mode toggles.
- **`DataUploader.tsx`**: Uses SheetJS (`xlsx`) to parse uploaded files locally. By performing parse operations in the browser, we prevent server resource exhaustion, support drag-and-drop feedback, and keep payloads extremely small.
- **`DashboardCharts.tsx`**: Configures 12 interactive Recharts components.
- **`InsightsPanel.tsx`**: Triggers backend AI analysis and renders responses with our custom React 19 markdown engine.

### B. Backend Layer (Express v4 + tsx)
- **`server.ts`**: Launches an Express server binding to host `0.0.0.0` on port `3000`. Serve static client assets in production, and maps API endpoints.
- **`@google/genai` Integration**: Provides server-side Gemini querying using the recommended `gemini-3.5-flash` model.

## 3. Data Flow Strategy

1. **Upload & Merge**:
   - User drops `retail_weekly_sales.xlsx` and `store_master.xlsx` into the UI.
   - SheetJS extracts JSON rows. We check columns against `SALES_REQUIRED_COLS` and `STORE_REQUIRED_COLS`.
   - Records are merged using the `Store ID` key. Null/missing values are automatically handled.
2. **Filtering**:
   - Moving any slider or filter dimension triggers immediate state recalculation.
   - All charts and KPI cards refresh synchronously.
3. **AI Consultation**:
   - The user clicks "Generate Strategic Report".
   - The client packages the aggregated statistics (NOT massive raw files) and posts them to `/api/analyze`.
   - The server queries Gemini, adding the client context to custom system prompts.
   - Markdown is returned and rendered in real-time.
