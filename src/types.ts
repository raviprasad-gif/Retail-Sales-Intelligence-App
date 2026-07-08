/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MergedRetailRow {
  weekStartDate: string;
  region: string;
  storeId: string;
  storeName: string;
  city: string;
  storeFormat: string;
  productCategory: string;
  footfall: number;
  transactions: number;
  unitsSold: number;
  grossSales: number;
  discountAmount: number;
  netSales: number;
  salesTarget: number;
  inventoryOnHand: number;
  stockouts: number;
  returnsAmount: number;
  customerRating: number;
  marketingSpend: number;
  
  // Calculated fields and backward-compatible properties
  week: string;
  category: string;
  returnAmount: number;
  targetSales: number;
  stockoutRisk: "High" | "Medium" | "Low";
  inventoryStatus: "High" | "Medium" | "Low";
}

export interface FilterState {
  weeks: string[];
  regions: string[];
  stores: string[];
  cities: string[];
  storeFormats: string[];
  categories: string[];
}

export interface KPIStats {
  netSales: number;
  grossSales: number;
  targetSales: number;
  targetAchievement: number;
  avgTransactionValue: number;
  returnRate: number;
  discountRate: number;
  conversionRate: number;
  stockoutLevel: "High" | "Medium" | "Low";
  
  // Added KPI stats for full prompt coverage
  avgCustomerRating: number;
  marketingSpend: number;
  unitsSold: number;
  footfall: number;
  transactions: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: any;
}
