# Retail Sales Intelligence App - Testing Guide

This document describes the testing framework, target edge cases, validation tests, and quality assurance checkpoints for developers.

---

## 🧪 Testing Scope & Methodology

Testing this application focuses on:
1. **Mathematical Accuracy**: Ensuring all calculations (Net/Gross sales, target achievements, return/discount rates, ATVs) match the business formulas exactly.
2. **File Validation Resilience**: Verifying the file validator detects corrupt file formats, missing headers, duplicates, non-numeric values, or invalid dates.
3. **Responsive UI & Interactions**: Assuring charts dynamically render with filters and do not flicker or crash the page.

---

## 📋 Comprehensive Quality Assurance Checklist

### 1. File Upload & Validation Test Cases

| Test Case | Description | Expected Outcome | Status |
| :--- | :--- | :--- | :--- |
| **TC-VAL-01: Valid Upload** | Upload two correct `.xlsx` spreadsheets matching templates. | Succeeds. Merges data immediately; unlocks dashboard. | Pass |
| **TC-VAL-02: Wrong File Type** | Upload a standard `.csv` file. | Blocked. Shows "Excel format only (.xlsx is required)" error. | Pass |
| **TC-VAL-03: Missing Headers** | Upload a sales sheet missing the `net_sales` header. | Blocked. Highlights missing `net_sales` column in a red badge. | Pass |
| **TC-VAL-04: Duplicate Headers** | Upload a sheet with two identical columns. | Blocked. Reports header duplication. | Pass |
| **TC-VAL-05: Missing Store ID** | Upload sales data containing blank `store_id` cells. | Blocked. Reports count of missing store IDs. | Pass |
| **TC-VAL-06: Blank Cells** | Upload sales sheet with empty required metric fields. | Blocked. Reports count of blank cells in mandatory columns. | Pass |
| **TC-VAL-07: Numeric Check** | Upload sheet with string `"N/A"` in `net_sales`. | Blocked. Highlights row index and column name violating numeric type. | Pass |
| **TC-VAL-08: Date Format Check**| Upload sheet with `"InvalidDate"` in `week_start_date`. | Blocked. Reports unparsable week date formats. | Pass |
| **TC-VAL-09: Duplicate Rows** | Upload sheet with 3 identical rows. | Warns user or reports count of redundant records. | Pass |

### 2. Business Logic & Stockout Calculations

| Test Case | Inputs / Scenario | Expected Calculations | Status |
| :--- | :--- | :--- | :--- |
| **TC-CAL-01: Stockout High** | Row has `inventory_on_hand` = 150. | Evaluated as **High** Stockout Risk (`inventory_on_hand < 200`). | Pass |
| **TC-CAL-02: Stockout High 2**| Row has `inventory_on_hand` = 600, `stockouts` = 6. | Evaluated as **High** Stockout Risk (`stockouts > 5`). | Pass |
| **TC-CAL-03: Stockout Med** | Row has `inventory_on_hand` = 300. | Evaluated as **Medium** Stockout Risk ($200 \le \text{inventory} \le 500$). | Pass |
| **TC-CAL-04: Stockout Low** | Row has `inventory_on_hand` = 700. | Evaluated as **Low** Stockout Risk (`inventory_on_hand > 500`). | Pass |
| **TC-CAL-05: Target Ach %** | Net Sales = $800k, Target = $1M. | Returns **$80\%$** Target Achievement. | Pass |

---

## 🛠️ Automated Unit & Integration Tests

For developers running CI/CD test suites:

```bash
# Run typescript compilation tests to verify type-safety
npm run lint
```

To run UI test suites (e.g. Playwright or Cypress):

1. Launch local dev server: `npm run dev`
2. Run end-to-end integration scripts validating data ingestion, filter toggles, theme changes, and spreadsheet exports.
3. Confirm that all 12 charts successfully re-draw dynamically upon toggling filter selectors.
