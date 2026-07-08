# Testing & Quality Playbook - Retail Sales Intelligence App

This document outlines the testing strategy, sample test cases, automated testing commands, and visual validation checklists used to ensure the quality of the Retail Sales Intelligence Application.

---

## 1. Automated Test Cases

Automated unit tests are structured around data validation, column checks, and merge operations.

### Test Case A: Excel Column Validation
- **Objective:** Verify that missing required headers throw validation anomalies.
- **Input headers:** `["Store ID", "Week", "Net Sales", "Transactions"]` (Missing `Footfall`, `Return Amount`, etc.)
- **Expected Outcome:** `validateColumns()` returns `{ valid: false, missing: ["Date", "Category", "Target Sales", "Footfall", "Return Amount", "Discount Amount", "Inventory Status"] }`.

### Test Case B: Dataset Merging & Orphans Recovery
- **Objective:** Ensure orphaned rows without a matching `Store ID` in `store_master` report clean diagnostic warnings rather than dropping silently.
- **Input:** Sales row with `Store ID: "ST-INVALID"`
- **Expected Outcome:** `mergeDatasets()` registers a string warning: `Sales row X contains Store ID "ST-INVALID" which is missing from Store Master.`

### Test Case C: Dynamic KPI Re-Calculations
- **Objective:** Test KPI math consistency.
- **Input mock row values:**
  - `Net Sales: 10000`
  - `Target Sales: 8000`
  - `Discount Amount: 2000` (Gross Sales = 12000)
  - `Transactions: 100`
  - `Footfall: 500`
- **Expected Aggregates:**
  - **Target Achievement %:** $125.0\%$
  - **Discount Rate %:** $16.67\%$ (2000 / 12000)
  - **Conversion Rate %:** $20.0\%$ (100 / 500)

---

## 2. QA Validation Checklist

Prior to final builds, verify the following visual and operational checkpoints:

| Checkpoint | Category | Expected Behavior | Status |
| :--- | :--- | :--- | :--- |
| **Theme Alignment** | UI/UX | Text and grid components adjust correctly between Light and Dark mode. | Verified |
| **Zero Code Upload** | Usability | Drop template spreadsheet merges rows immediately without compile adjustments. | Verified |
| **12-Chart Deck** | Visuals | All 12 charts compile and render inside responsive wrapper grids. | Verified |
| **AI Fallback** | Backend | App reverts to local analytics report if `GEMINI_API_KEY` is not set. | Verified |
| **Data Exports** | Utilities | PDF export captures the entire scrollable dashboard layout; Excel download formats columns. | Verified |

---

## 3. Mock Test File Implementation
We've created a test file located at `/src/tests/dataModel.test.ts` to execute automated validation checks on mock data. Run tests via standard Node scripts: `npm run lint` or custom Vitest runners.
