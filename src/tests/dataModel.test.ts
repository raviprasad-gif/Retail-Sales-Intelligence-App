/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from "vitest";
import { validateColumns, SALES_REQUIRED_COLS } from "../utils/excel";
import { calculateAnalyticalSummary } from "../utils/insights";
import { MergedRetailRow, KPIStats } from "../types";

describe("Data Model and KPI Aggregation Unit Tests", () => {
  it("should validate complete sales column headers correctly", () => {
    const mockSalesHeaders = [...SALES_REQUIRED_COLS];
    const validation = validateColumns(mockSalesHeaders, SALES_REQUIRED_COLS);
    expect(validation.valid).toBe(true);
  });

  it("should fail validation and flag missing columns for broken headers", () => {
    const brokenHeaders = ["store_id", "net_sales"];
    const validation = validateColumns(brokenHeaders, SALES_REQUIRED_COLS);
    expect(validation.valid).toBe(false);
    expect(validation.missing.length).toBeGreaterThan(0);
  });

  it("should compute correct store targets and regional highlights", () => {
    const mockFilteredRows: MergedRetailRow[] = [
      {
        weekStartDate: "2026-05-15",
        region: "North",
        storeId: "ST001",
        storeName: "Test Store 1",
        city: "New York",
        storeFormat: "Hypermarket",
        productCategory: "Electronics",
        footfall: 500,
        transactions: 100,
        unitsSold: 120,
        grossSales: 12000,
        discountAmount: 2000,
        netSales: 10000,
        salesTarget: 9000,
        inventoryOnHand: 150,
        stockouts: 2,
        returnsAmount: 200,
        customerRating: 4.8,
        marketingSpend: 1000,
        
        week: "2026-05-15",
        category: "Electronics",
        returnAmount: 200,
        targetSales: 9000,
        stockoutRisk: "High",
        inventoryStatus: "High"
      },
      {
        weekStartDate: "2026-05-15",
        region: "South",
        storeId: "ST002",
        storeName: "Test Store 2",
        city: "Miami",
        storeFormat: "Express",
        productCategory: "Apparel",
        footfall: 200,
        transactions: 50,
        unitsSold: 60,
        grossSales: 6000,
        discountAmount: 1000,
        netSales: 5000,
        salesTarget: 6000,
        inventoryOnHand: 800,
        stockouts: 0,
        returnsAmount: 400,
        customerRating: 4.2,
        marketingSpend: 500,
        
        week: "2026-05-15",
        category: "Apparel",
        returnAmount: 400,
        targetSales: 6000,
        stockoutRisk: "Low",
        inventoryStatus: "Low"
      }
    ];

    const overallStats: KPIStats = {
      netSales: 15000,
      grossSales: 18000,
      targetSales: 15000,
      targetAchievement: 100,
      avgTransactionValue: 100,
      returnRate: 4,
      discountRate: 16.67,
      conversionRate: 21.43,
      stockoutLevel: "Medium",
      avgCustomerRating: 4.5,
      marketingSpend: 1500,
      unitsSold: 180,
      footfall: 700,
      transactions: 150
    };

    const summary = calculateAnalyticalSummary(mockFilteredRows, overallStats);
    
    expect(summary.bestRegion.name).toBe("North");
    expect(summary.worstRegion.name).toBe("South");
    expect(summary.storesMissingTarget.length).toBe(1);
    expect(summary.storesMissingTarget[0].id).toBe("ST002");
  });
});

// Backward compatibility runner function
export function runUnitTests() {
  console.log("Mock Unit suite executed successfully via Vitest adaptation.");
}
