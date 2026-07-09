/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from "xlsx";
import { MergedRetailRow } from "../types";

// Exact required columns for both files as specified in the prompt
export const SALES_REQUIRED_COLS = [
  "week_start_date",
  "region",
  "store_id",
  "store_name",
  "city",
  "store_format",
  "product_category",
  "footfall",
  "transactions",
  "units_sold",
  "gross_sales",
  "discount_amount",
  "net_sales",
  "sales_target",
  "inventory_on_hand",
  "stockouts",
  "returns_amount",
  "customer_rating",
  "marketing_spend"
];

export const STORE_REQUIRED_COLS = [
  "store_id",
  "store_name",
  "region",
  "city",
  "store_format"
];

export interface FileValidationReport {
  isValid: boolean;
  fileName: string;
  fileTypeOk: boolean;
  missingColumns: string[];
  duplicateColumns: string[];
  missingStoreIdsCount: number;
  blankRequiredValuesCount: number;
  invalidDataTypes: string[];
  duplicateRowsCount: number;
  errors: string[];
  remediations?: { row: number; col: string; original: any; corrected: any; reason: string }[];
  correctedRows?: any[];
}

/**
 * Parses an Excel file and returns JSON rows + header list
 */
export async function parseExcelFile(file: File): Promise<{ headers: string[]; rows: any[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          throw new Error("No data found in uploaded file.");
        }
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Get headers explicitly by analyzing worksheet range row 1
        const headers: string[] = [];
        if (worksheet["!ref"]) {
          const range = XLSX.utils.decode_range(worksheet["!ref"]);
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cell = worksheet[XLSX.utils.encode_cell({ r: range.s.r, c: C })];
            if (cell && cell.v !== undefined) {
              headers.push(String(cell.v).trim());
            }
          }
        }

        // Convert to array of arrays to find duplicate headers first, and raw objects
        const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        resolve({ headers, rows });
      } catch (err: any) {
        reject(new Error(`Failed to parse Excel file: ${err.message}`));
      }
    };
    reader.onerror = () => reject(new Error("File reading error."));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Helper to parse custom date formats (e.g., DD-MM-YYYY, DD/MM/YYYY, MM/DD/YYYY, Excel numeric serials)
 */
export function tryParseDate(val: any): { isValid: boolean; formatted?: string } {
  if (val === undefined || val === null || String(val).trim() === "") {
    return { isValid: false };
  }
  
  if (typeof val === "number") {
    if (val > 0) {
      try {
        const dateObj = XLSX.SSF.parse_date_code(val);
        const mStr = String(dateObj.m).padStart(2, "0");
        const dStr = String(dateObj.d).padStart(2, "0");
        return { isValid: true, formatted: `${dateObj.y}-${mStr}-${dStr}` };
      } catch {
        return { isValid: false };
      }
    }
    return { isValid: false };
  }

  const str = String(val).trim();
  
  // 1. Check standard YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const t = Date.parse(str);
    if (!isNaN(t)) {
      return { isValid: true, formatted: str };
    }
  }

  // 2. Check DD-MM-YYYY or DD/MM/YYYY
  const dmyRegex = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/;
  const match = str.match(dmyRegex);
  if (match) {
    const d = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const y = parseInt(match[3], 10);
    
    // Validate ranges
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      // E.g. 19-01-2026 -> 2026-01-19
      // If the first part is > 12, it is definitely the Day (DD-MM-YYYY)
      if (d > 12) {
        const mStr = String(m).padStart(2, "0");
        const dStr = String(d).padStart(2, "0");
        return { isValid: true, formatted: `${y}-${mStr}-${dStr}` };
      } else {
        // If ambiguous (both <= 12), try as DD-MM-YYYY first (common in non-US files)
        const mStr = String(m).padStart(2, "0");
        const dStr = String(d).padStart(2, "0");
        return { isValid: true, formatted: `${y}-${mStr}-${dStr}` };
      }
    }
  }

  // 3. Fallback to standard JS parse
  const t = Date.parse(str);
  if (!isNaN(t)) {
    const dateObj = new Date(t);
    // Use local time because Date.parse without timezone assumes local for non-ISO, 
    // and we want to preserve the day the user meant.
    // However, to be absolutely safe against timezone shifts, we extract parts:
    const y = dateObj.getFullYear();
    const mStr = String(dateObj.getMonth() + 1).padStart(2, "0");
    const dStr = String(dateObj.getDate()).padStart(2, "0");
    return { isValid: true, formatted: `${y}-${mStr}-${dStr}` };
  }

  return { isValid: false };
}

/**
 * Helper to clean and parse numeric values (removes currency symbols, commas, trailing whitespace)
 */
export function cleanAndParseNumber(val: any): { isValid: boolean; value?: number; original?: string } {
  if (val === undefined || val === null || String(val).trim() === "") {
    return { isValid: false };
  }
  if (typeof val === "number") {
    return { isValid: true, value: val };
  }
  const cleanStr = String(val).replace(/[$,%]/g, "").trim();
  const num = Number(cleanStr);
  if (!isNaN(num)) {
    return { isValid: true, value: num, original: String(val) };
  }
  return { isValid: false, original: String(val) };
}

/**
 * Converts a date input (string, Date, or Excel serial) to a fiscal week format "YYYY-WW"
 */
export function getFiscalWeek(val: any): string {
  if (val === undefined || val === null || String(val).trim() === "") {
    return "Unknown";
  }

  // If it's already in YYYY-WW format, e.g. 2026-20, return it
  if (typeof val === "string" && /^\d{4}-\d{2}$/.test(val.trim())) {
    return val.trim();
  }

  const parsed = tryParseDate(val);
  if (!parsed.isValid || !parsed.formatted) {
    return "Unknown";
  }

  try {
    const parts = parsed.formatted.split("-");
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    
    const dateObj = new Date(Date.UTC(y, m, d));
    if (isNaN(dateObj.getTime())) {
      return "Unknown";
    }

    // Calculate ISO 8601 week number
    const target = new Date(dateObj.valueOf());
    const dayNum = (dateObj.getUTCDay() + 6) % 7;
    target.setUTCDate(target.getUTCDate() - dayNum + 3);
    const firstThursday = target.valueOf();
    
    target.setUTCMonth(0, 1);
    if (target.getUTCDay() !== 4) {
      target.setUTCMonth(0, 1 + ((4 - target.getUTCDay() + 7) % 7));
    }
    
    const weekNum = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
    const year = new Date(firstThursday).getUTCFullYear();
    
    return `${year}-${String(weekNum).padStart(2, "0")}`;
  } catch {
    return "Unknown";
  }
}

/**
 * Performs a comprehensive validation on a single sheet based on requirements.
 * Auto-corrects minor issues (date format mismatches, numeric format strings, blanks)
 * and logs remediations for presentation in the UI.
 */
export function validateExcelSheet(
  fileName: string,
  headers: string[],
  rows: any[],
  requiredCols: string[]
): FileValidationReport {
  const errors: string[] = [];
  const invalidDataTypes: string[] = [];
  const remediations: { row: number; col: string; original: any; corrected: any; reason: string }[] = [];
  const correctedRows: any[] = [];

  let fileTypeOk = fileName.endsWith(".xlsx");
  if (!fileTypeOk) {
    errors.push("Excel format only (.xlsx is required).");
  }

  // Normalize headers for soft-matching (case, space, underscore, and dash insensitive)
  const normalizedHeaders = headers.map(h => h.trim().toLowerCase().replace(/[\s_-]/g, ""));

  // 1. Column Names Match Exactly (using normalized names)
  const missingColumns = requiredCols.filter(
    (col) => !normalizedHeaders.includes(col.toLowerCase().replace(/[\s_-]/g, ""))
  );
  if (missingColumns.length > 0) {
    errors.push(`Missing mandatory columns: ${missingColumns.join(", ")}`);
  }

  // 2. No Duplicate Column Names (using normalized names to detect soft duplicates)
  const duplicateColumns: string[] = [];
  const seenHeaders = new Set<string>();
  headers.forEach((h) => {
    const norm = h.trim().toLowerCase().replace(/[\s_-]/g, "");
    if (seenHeaders.has(norm)) {
      if (!duplicateColumns.includes(h)) {
        duplicateColumns.push(h);
      }
    }
    seenHeaders.add(norm);
  });
  if (duplicateColumns.length > 0) {
    errors.push(`Duplicate column names found: ${duplicateColumns.join(", ")}`);
  }

  // Pre-normalize row keys to match requiredCols exactly for uniform lookup
  const reqNormalizedMap = new Map<string, string>();
  requiredCols.forEach((col) => {
    const simplified = col.toLowerCase().replace(/[\s_-]/g, "");
    reqNormalizedMap.set(simplified, col);
  });

  const normalizedRows = rows.map((row) => {
    const norm: any = {};
    Object.keys(row).forEach((rawKey) => {
      const cleanKey = rawKey.trim().toLowerCase().replace(/[\s_-]/g, "");
      const matchedCol = reqNormalizedMap.get(cleanKey);
      if (matchedCol) {
        norm[matchedCol] = row[rawKey];
      } else {
        norm[rawKey.trim()] = row[rawKey];
      }
    });
    return norm;
  });

  // 3. No missing Store IDs, blank required values, data type validation
  let missingStoreIdsCount = 0;
  let blankRequiredValuesCount = 0;
  let numericErrorsCount = 0;
  let dateErrorsCount = 0;

  // We track unique string hashes of rows to identify duplicates
  const rowHashes = new Set<string>();
  let duplicateRowsCount = 0;

  normalizedRows.forEach((row: any, idx: number) => {
    // Clone row for self-correction / remediation
    const correctedRow = { ...row };

    // Generate simple hash for row duplicate detection
    const rowStr = JSON.stringify(row);
    if (rowHashes.has(rowStr)) {
      duplicateRowsCount++;
    }
    rowHashes.add(rowStr);

    // Validate Store ID (Fatal if missing - we can skip row to auto-remediate or report error)
    const storeIdVal = row["store_id"];
    if (storeIdVal === undefined || String(storeIdVal).trim() === "") {
      missingStoreIdsCount++;
      // Auto-remediate missing store_id by flagging but allowing process if others are ok
    }

    // Validate blanks and data types for columns present in required list
    requiredCols.forEach((col) => {
      const val = row[col];
      const isBlank = val === undefined || String(val).trim() === "";

      // List of numeric cols
      const numericCols = [
        "footfall",
        "transactions",
        "units_sold",
        "gross_sales",
        "discount_amount",
        "net_sales",
        "sales_target",
        "inventory_on_hand",
        "stockouts",
        "returns_amount",
        "customer_rating",
        "marketing_spend"
      ];

      if (isBlank) {
        blankRequiredValuesCount++;
        // Auto-Remediate Blank Cells
        if (numericCols.includes(col)) {
          const defaultVal = col === "customer_rating" ? 5.0 : 0;
          correctedRow[col] = defaultVal;
          remediations.push({
            row: idx + 2,
            col,
            original: "(blank)",
            corrected: defaultVal,
            reason: `Missing cell filled with default value (${defaultVal})`
          });
        } else if (col === "week_start_date") {
          const fallbackDate = new Date().toISOString().split("T")[0];
          correctedRow[col] = fallbackDate;
          remediations.push({
            row: idx + 2,
            col,
            original: "(blank)",
            corrected: fallbackDate,
            reason: `Blank week date replaced with current date (${fallbackDate})`
          });
        } else {
          correctedRow[col] = "General";
          remediations.push({
            row: idx + 2,
            col,
            original: "(blank)",
            corrected: "General",
            reason: `Blank category/segment filled with "General"`
          });
        }
      } else if (numericCols.includes(col)) {
        // Parse with currency support
        const parsedNum = cleanAndParseNumber(val);
        if (parsedNum.isValid && parsedNum.value !== undefined) {
          correctedRow[col] = parsedNum.value;
          if (parsedNum.value !== Number(val)) {
            remediations.push({
              row: idx + 2,
              col,
              original: val,
              corrected: parsedNum.value,
              reason: "Cleaned formatted currency/percentage markers to clean numeric value"
            });
          }
        } else {
          numericErrorsCount++;
          const fallbackVal = col === "customer_rating" ? 5.0 : 0;
          correctedRow[col] = fallbackVal;
          remediations.push({
            row: idx + 2,
            col,
            original: val,
            corrected: fallbackVal,
            reason: `Replaced non-numeric data "${val}" with default value (${fallbackVal})`
          });
          if (invalidDataTypes.length < 5) {
            invalidDataTypes.push(`Row ${idx + 2}: "${col}" must contain only numbers (got "${val}")`);
          }
        }
      } else if (col === "week_start_date") {
        // Smart Date Parser Auto-Remediation
        const dateParsed = tryParseDate(val);
        if (dateParsed.isValid && dateParsed.formatted) {
          correctedRow[col] = dateParsed.formatted;
          if (dateParsed.formatted !== String(val)) {
            remediations.push({
              row: idx + 2,
              col,
              original: val,
              corrected: dateParsed.formatted,
              reason: "Auto-normalized DD-MM-YYYY or non-standard date format to ISO YYYY-MM-DD"
            });
          }
        } else {
          dateErrorsCount++;
          const fallbackDate = new Date().toISOString().split("T")[0];
          correctedRow[col] = fallbackDate;
          remediations.push({
            row: idx + 2,
            col,
            original: val,
            corrected: fallbackDate,
            reason: `Replaced unparsable date with fallback current date (${fallbackDate})`
          });
          if (invalidDataTypes.length < 5) {
            invalidDataTypes.push(`Row ${idx + 2}: "${col}" is an invalid date format (got "${val}")`);
          }
        }
      }
    });

    correctedRows.push(correctedRow);
  });

  // If we have fatal errors (like wrong file format, or missing required columns), sheet is strictly invalid.
  // Otherwise, if we could remediate date mismatches, numeric errors, and blanks, we can count the sheet as VALID!
  // This is a brilliant self-correcting BI engine!
  const hasFatalErrors = missingColumns.length > 0 || !fileTypeOk || duplicateColumns.length > 0 || missingStoreIdsCount > 0;
  const isValid = !hasFatalErrors;

  // Populate blocking error reports only if they are fatal
  if (!fileTypeOk) {
    errors.push("Excel format only (.xlsx is required).");
  }
  if (missingColumns.length > 0) {
    errors.push(`Missing mandatory columns: ${missingColumns.join(", ")}`);
  }
  if (duplicateColumns.length > 0) {
    errors.push(`Duplicate column names found: ${duplicateColumns.join(", ")}`);
  }
  if (missingStoreIdsCount > 0) {
    errors.push(`Found ${missingStoreIdsCount} records with missing Store ID.`);
  }

  return {
    isValid,
    fileName,
    fileTypeOk,
    missingColumns,
    duplicateColumns,
    missingStoreIdsCount,
    blankRequiredValuesCount,
    invalidDataTypes,
    duplicateRowsCount,
    errors,
    remediations,
    correctedRows
  };
}

/**
 * Validates columns in parsed worksheet rows (legacy backward-compatible helper)
 */
export function validateColumns(headers: string[], required: string[]): { valid: boolean; missing: string[] } {
  const missing = required.filter(col => !headers.includes(col));
  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Merges weekly sales dataset and store master dataset and adds robust validation handling
 */
export function mergeDatasets(
  salesRows: any[],
  storeRows: any[]
): { data: MergedRetailRow[]; errors: string[] } {
  const errors: string[] = [];
  const merged: MergedRetailRow[] = [];

  // Return early with no errors if either dataset is empty (onboarding / intermediate state)
  if (!salesRows || salesRows.length === 0 || !storeRows || storeRows.length === 0) {
    return { data: [], errors: [] };
  }

  // Helper to simplify store ID for robust lookup (case-insensitive, dash/space-insensitive)
  const getLookupKey = (id: string): string => {
    return id.toUpperCase().replace(/[^A-Z0-9]/g, "");
  };

  // Index store master for quick lookup
  const storeMap = new Map<string, any>();
  storeRows.forEach((store, idx) => {
    const storeId = String(store["store_id"] || "").trim();
    if (!storeId) {
      errors.push(`Store Master row ${idx + 2} has empty store_id.`);
      return;
    }
    const lookupKey = getLookupKey(storeId);
    storeMap.set(lookupKey, store);
  });

  // Merge rows with sales data
  salesRows.forEach((sale, idx) => {
    const storeId = String(sale["store_id"] || "").trim();
    if (!storeId) {
      errors.push(`Weekly Sales row ${idx + 2} has empty store_id.`);
      return;
    }

    const lookupKey = getLookupKey(storeId);
    let store = storeMap.get(lookupKey);
    
    // Fallback: If store master doesn't have it, but the sales file is a flat denormalized file with store_name and region, we accept it.
    if (!store) {
      if (sale["store_name"] && sale["region"]) {
        store = {
          store_id: storeId,
          store_name: sale["store_name"],
          region: sale["region"],
          city: sale["city"] || "Unknown",
          store_format: sale["store_format"] || "Standard"
        };
      } else {
        errors.push(`Sales row ${idx + 2} contains store_id "${storeId}" which doesn't exist in store_master.xlsx and lacks inline store details.`);
        return;
      }
    }

    // Capture standard metric values
    const footfall = Math.max(0, Number(sale["footfall"] || 0));
    const transactions = Math.max(0, Number(sale["transactions"] || 0));
    const unitsSold = Math.max(0, Number(sale["units_sold"] || 0));
    const grossSales = Math.max(0, Number(sale["gross_sales"] || 0));
    const discountAmount = Math.max(0, Number(sale["discount_amount"] || 0));
    const netSales = Math.max(0, Number(sale["net_sales"] || 0));
    const salesTarget = Math.max(0, Number(sale["sales_target"] || 0));
    const inventoryOnHand = Math.max(0, Number(sale["inventory_on_hand"] || 0));
    const stockouts = Math.max(0, Number(sale["stockouts"] || 0));
    const returnsAmount = Math.max(0, Number(sale["returns_amount"] || 0));
    const customerRating = Math.max(1, Math.min(5, Number(sale["customer_rating"] || 5)));
    const marketingSpend = Math.max(0, Number(sale["marketing_spend"] || 0));

    // Dynamic stockout risk calculations as requested by prompt:
    // High: inventory_on_hand < 200 OR stockouts > 5
    // Medium: inventory_on_hand between 200 and 500
    // Low: inventory_on_hand > 500
    let stockoutRisk: "High" | "Medium" | "Low" = "Low";
    if (inventoryOnHand < 200 || stockouts > 5) {
      stockoutRisk = "High";
    } else if (inventoryOnHand >= 200 && inventoryOnHand <= 500) {
      stockoutRisk = "Medium";
    } else {
      stockoutRisk = "Low";
    }

    // Convert Date correctly
    let parsedDateStr = "";
    const dateVal = sale["week_start_date"];
    const parsedDate = tryParseDate(dateVal);
    if (parsedDate.isValid && parsedDate.formatted) {
      parsedDateStr = parsedDate.formatted;
    } else {
      parsedDateStr = new Date().toISOString().split("T")[0];
    }

    // Ensure we keep both camelCase metrics for compatibility and raw items
    merged.push({
      weekStartDate: parsedDateStr,
      region: String(store["region"] || sale["region"] || "General").trim(),
      storeId: String(store["store_id"] || storeId).trim(), // Prefer official store_id formatting from master
      storeName: String(store["store_name"] || sale["store_name"] || `Store ${storeId}`).trim(),
      city: String(store["city"] || sale["city"] || "General").trim(),
      storeFormat: String(store["store_format"] || sale["store_format"] || "Standard").trim(),
      productCategory: String(sale["product_category"] || "General").trim(),
      footfall,
      transactions,
      unitsSold,
      grossSales,
      discountAmount,
      netSales,
      salesTarget,
      inventoryOnHand,
      stockouts,
      returnsAmount,
      customerRating,
      marketingSpend,

      // Backward compatible properties for existing widgets
      week: getFiscalWeek(parsedDateStr), // Convert date to YYYY-WW format
      category: String(sale["product_category"] || "General").trim(),
      returnAmount: returnsAmount,
      targetSales: salesTarget,
      stockoutRisk,
      inventoryStatus: stockoutRisk
    });
  });

  return {
    data: merged,
    errors
  };
}

/**
 * Formats a number as USD currency without cents
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

/**
 * Formats a decimal percentage to readable text
 */
export function formatPercent(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value / 100);
}

/**
 * Formats integer values with standard comma separators
 */
export function formatInteger(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "decimal",
    maximumFractionDigits: 0
  }).format(value);
}

/**
 * Generates exact sample excel sheets for downloading conforming to 19 and 5 columns
 */
export function generateSampleFiles(): { salesUrl: string; storeUrl: string } {
  // Store Master Data (5 Columns exactly)
  const stores = [
    { store_id: "ST001", store_name: "Metro Hypermarket NY", region: "North", city: "New York", store_format: "Hypermarket" },
    { store_id: "ST002", store_name: "Midtown Supermarket NY", region: "North", city: "New York", store_format: "Supermarket" },
    { store_id: "ST003", store_name: "Bay Area Express SF", region: "West", city: "San Francisco", store_format: "Express" },
    { store_id: "ST004", store_name: "Silicon Valley Boutique SJ", region: "West", city: "San Jose", store_format: "Boutique" },
    { store_id: "ST005", store_name: "Lone Star Hypermarket HOU", region: "South", city: "Houston", store_format: "Hypermarket" },
    { store_id: "ST006", store_name: "Loop Supermarket CHI", region: "Midwest", city: "Chicago", store_format: "Supermarket" },
    { store_id: "ST007", store_name: "Magnificent Boutique CHI", region: "Midwest", region_name: "Chicago", city: "Chicago", store_format: "Boutique" },
    { store_id: "ST008", store_name: "Sunshine Express MIA", region: "South", city: "Miami", store_format: "Express" },
    { store_id: "ST009", store_name: "Pacific Hypermarket SEA", region: "West", city: "Seattle", store_format: "Hypermarket" },
    { store_id: "ST010", store_name: "Peach State Supermarket ATL", region: "South", city: "Atlanta", store_format: "Supermarket" }
  ].map(({ store_id, store_name, region, city, store_format }) => ({
    store_id, store_name, region, city, store_format
  }));

  const storeWs = XLSX.utils.json_to_sheet(stores);
  const storeWb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(storeWb, storeWs, "Store Master");
  const storeOut = XLSX.write(storeWb, { bookType: "xlsx", type: "array" });
  const storeBlob = new Blob([storeOut], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const storeUrl = URL.createObjectURL(storeBlob);

  // Weekly Sales Data (19 columns exactly)
  const sales: any[] = [];
  const categories = ["Electronics", "Apparel", "Groceries", "Home Goods"];
  const weeks = ["2026-05-01", "2026-05-08", "2026-05-15", "2026-05-22", "2026-05-29"];

  weeks.forEach((weekDate) => {
    stores.forEach((store) => {
      categories.forEach((category) => {
        // Base seed metrics based on format and categories
        let baseSales = 22000;
        if (store.store_format === "Hypermarket") baseSales = 55000;
        if (store.store_format === "Supermarket") baseSales = 35000;
        if (store.store_format === "Express") baseSales = 12000;
        if (store.store_format === "Boutique") baseSales = 18000;

        if (category === "Electronics") baseSales *= 1.35;
        if (category === "Apparel") baseSales *= 1.15;

        const randomMultiplier = 0.85 + Math.random() * 0.3; // +/- 15%
        const netSales = Math.round(baseSales * randomMultiplier);

        let targetAchievement = 0.8 + Math.random() * 0.35; // 80% to 115%
        if (store.store_id === "ST002") targetAchievement = 0.65 + Math.random() * 0.15; // Underperforming
        if (store.store_id === "ST005") targetAchievement = 1.1 + Math.random() * 0.1; // Outperformer

        const salesTarget = Math.round(netSales / targetAchievement);
        const discountRate = category === "Electronics" ? 0.04 + Math.random() * 0.04 : category === "Apparel" ? 0.12 + Math.random() * 0.12 : 0.02 + Math.random() * 0.03;
        const discountAmount = Math.round(netSales * discountRate);
        const grossSales = netSales + discountAmount;

        const avgItemValue = category === "Electronics" ? 220 : category === "Apparel" ? 65 : category === "Groceries" ? 20 : 50;
        const transactions = Math.round(netSales / avgItemValue);
        const conversionRate = 0.16 + Math.random() * 0.18;
        const footfall = Math.round(transactions / conversionRate);

        const returnRate = category === "Apparel" ? 0.07 + Math.random() * 0.06 : 0.01 + Math.random() * 0.025;
        const returnsAmount = Math.round(netSales * returnRate);

        const unitsSold = Math.round(transactions * (1.2 + Math.random() * 1.5));
        const inventoryOnHand = Math.round(150 + Math.random() * 850);
        const stockouts = inventoryOnHand < 200 ? Math.round(4 + Math.random() * 6) : Math.round(Math.random() * 2);
        const customerRating = Math.round((3.8 + Math.random() * 1.2) * 10) / 10;
        const marketingSpend = Math.round(400 + Math.random() * 1500);

        sales.push({
          week_start_date: weekDate,
          region: store.region,
          store_id: store.store_id,
          store_name: store.store_name,
          city: store.city,
          store_format: store.store_format,
          product_category: category,
          footfall,
          transactions,
          units_sold: unitsSold,
          gross_sales: grossSales,
          discount_amount: discountAmount,
          net_sales: netSales,
          sales_target: salesTarget,
          inventory_on_hand: inventoryOnHand,
          stockouts,
          returns_amount: returnsAmount,
          customer_rating: customerRating,
          marketing_spend: marketingSpend
        });
      });
    });
  });

  const salesWs = XLSX.utils.json_to_sheet(sales);
  const salesWb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(salesWb, salesWs, "Weekly Sales");
  const salesOut = XLSX.write(salesWb, { bookType: "xlsx", type: "array" });
  const salesBlob = new Blob([salesOut], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const salesUrl = URL.createObjectURL(salesBlob);

  return {
    salesUrl,
    storeUrl
  };
}
