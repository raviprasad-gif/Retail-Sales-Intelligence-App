/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
  AreaChart,
  Area
} from "recharts";
import { MergedRetailRow } from "../types";
import { formatCurrency, formatPercent, formatInteger } from "../utils/excel";
import { TrendingUp, BarChart3, Store, ShieldAlert, Award, AlertTriangle, HelpCircle, Users, Percent, Flame } from "lucide-react";

interface DashboardChartsProps {
  filteredData: MergedRetailRow[];
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ filteredData }) => {
  const [activeTab, setActiveTab] = useState<"revenue" | "products" | "outlets" | "operations">("revenue");

  // Get current theme from document class
  const isDarkMode = document.documentElement.classList.contains("dark");

  if (filteredData.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1E1E1E] border border-[#E5E7EB] dark:border-[#2D2D2D] rounded-xl p-12 text-center shadow-xs">
        <ShieldAlert className="w-12 h-12 text-[#C62828] mx-auto mb-4" />
        <h3 className="font-semibold text-lg text-[#1F2937] dark:text-[#FFFFFF]">No data available for active filters</h3>
        <p className="text-sm text-[#6B7280] dark:text-[#A0AEC0] mt-1">Try resetting filters or uploading files.</p>
      </div>
    );
  }

  // --- DATA PREPARATIONS FOR THE 12 CHARTS ---

  // 1. Weekly Sales Trend (Smooth line/area)
  const weeklySalesMap = new Map<string, { name: string; sales: number; target: number }>();
  filteredData.forEach(row => {
    const val = weeklySalesMap.get(row.week) || { name: row.week, sales: 0, target: 0 };
    val.sales += row.netSales;
    val.target += row.targetSales;
    weeklySalesMap.set(row.week, val);
  });
  const weeklySalesData = Array.from(weeklySalesMap.values()).sort((a, b) => {
    const aNum = parseInt(a.name.replace(/^\D+/g, ""), 10);
    const bNum = parseInt(b.name.replace(/^\D+/g, ""), 10);
    return !isNaN(aNum) && !isNaN(bNum) ? aNum - bNum : a.name.localeCompare(b.name);
  });

  // 2. Sales by Region (Horizontal bar chart, sorted descending) & Sales Contribution by Region (Pie)
  const regionSalesMap = new Map<string, { name: string; sales: number; target: number }>();
  filteredData.forEach(row => {
    const val = regionSalesMap.get(row.region) || { name: row.region, sales: 0, target: 0 };
    val.sales += row.netSales;
    val.target += row.targetSales;
    regionSalesMap.set(row.region, val);
  });
  const regionalSalesData = Array.from(regionSalesMap.values()).sort((a, b) => b.sales - a.sales);

  // Categorical corporate palette
  const CHART_PALETTE = ["#1F4E79", "#3949AB", "#1976D2", "#0288D1", "#2E7D32", "#F9A825", "#7B1FA2", "#455A64"];

  // 3. Category Performance (Horizontal bars, sorted descending)
  const categorySalesMap = new Map<string, { name: string; sales: number; returns: number; discounts: number; gross: number }>();
  filteredData.forEach(row => {
    const val = categorySalesMap.get(row.category) || { name: row.category, sales: 0, returns: 0, discounts: 0, gross: 0 };
    val.sales += row.netSales;
    val.returns += row.returnAmount;
    val.discounts += row.discountAmount;
    val.gross += row.grossSales;
    categorySalesMap.set(row.category, val);
  });
  const categoryPerformanceData = Array.from(categorySalesMap.values()).sort((a, b) => b.sales - a.sales);

  // 4 & 5. Store Leaderboard & Bottom 10 (Bar)
  const storeSalesMap = new Map<string, { id: string; name: string; sales: number; target: number }>();
  filteredData.forEach(row => {
    const val = storeSalesMap.get(row.storeId) || { id: row.storeId, name: row.storeName, sales: 0, target: 0 };
    val.sales += row.netSales;
    val.target += row.targetSales;
    storeSalesMap.set(row.storeId, val);
  });
  const allStoresSales = Array.from(storeSalesMap.values()).sort((a, b) => b.sales - a.sales);
  
  const top10Stores = allStoresSales.slice(0, 10).map((item, index) => ({
    ...item,
    displayName: `#${index + 1} ${item.name}`
  }));
  
  const bottom10Stores = [...allStoresSales].reverse().slice(0, 10).map((item, index) => ({
    ...item,
    displayName: `#${index + 1} ${item.name}`
  }));

  // 6. Target Achievement Gauge (Semi-circular chart)
  let totalNetSalesSum = 0;
  let totalTargetSalesSum = 0;
  filteredData.forEach(row => {
    totalNetSalesSum += row.netSales;
    totalTargetSalesSum += row.targetSales;
  });
  const totalAchievementRatio = totalTargetSalesSum > 0 ? (totalNetSalesSum / totalTargetSalesSum) * 100 : 100;
  const targetPercent = Math.min(100, totalAchievementRatio);
  const gaugeData = [
    { name: "Achieved Ratio", value: targetPercent, color: targetPercent >= 100 ? "#2E7D32" : "#F9A825" },
    { name: "Deficit Gap", value: Math.max(0, 100 - targetPercent), color: isDarkMode ? "#333" : "#E5E7EB" }
  ];

  // 7. Discount Analysis (Column/Bar chart)
  const categoryDiscountData = categoryPerformanceData.map(c => ({
    name: c.name,
    discountAmount: c.discounts,
    discountRate: c.gross > 0 ? (c.discounts / c.gross) * 100 : 0
  })).sort((a, b) => b.discountRate - a.discountRate);

  // 8. Returns (Stacked bar: Sales vs returns)
  const categoryReturnData = categoryPerformanceData.map(c => ({
    name: c.name,
    sales: c.sales,
    returns: c.returns,
    returnRate: c.sales > 0 ? (c.returns / c.sales) * 100 : 0
  })).sort((a, b) => b.returnRate - a.returnRate);

  // 9. Store Inventory Stockout Risk (Heatmap count)
  let lowRiskCount = 0; // High availability
  let medRiskCount = 0; // Medium availability
  let highRiskCount = 0; // Low availability/stockout risk
  filteredData.forEach(row => {
    if (row.inventoryStatus === "High") lowRiskCount++;
    else if (row.inventoryStatus === "Medium") medRiskCount++;
    else if (row.inventoryStatus === "Low") highRiskCount++;
  });
  const stockoutRiskData = [
    { name: "High Stock Availability", value: lowRiskCount, color: "#2E7D32" },
    { name: "Medium Operational Restock", value: medRiskCount, color: "#F9A825" },
    { name: "High Stockout Action Required", value: highRiskCount, color: "#C62828" }
  ];

  // 10. Customer Ratings (Donut Chart)
  let satisfiedCount = 0;
  let neutralCount = 0;
  let dissatisfiedCount = 0;
  filteredData.forEach(row => {
    const rate = row.netSales > 0 ? (row.returnAmount / row.netSales) * 100 : 0;
    if (rate < 3) satisfiedCount++;
    else if (rate < 6) neutralCount++;
    else dissatisfiedCount++;
  });
  const customerRatingsData = [
    { name: "Exceeds Standards (5★)", value: satisfiedCount, color: "#2E7D32" },
    { name: "Meets Standards (3-4★)", value: neutralCount, color: "#F9A825" },
    { name: "Requires Intervention (1-2★)", value: dissatisfiedCount, color: "#C62828" }
  ];

  // 11. Heatmap Matrix Data (Week vs Region Sales Grid)
  const activeWeeks = Array.from(new Set<string>(filteredData.map(d => d.week))).sort((a, b) => {
    const aNum = parseInt(a.replace(/^\D+/g, ""), 10);
    const bNum = parseInt(b.replace(/^\D+/g, ""), 10);
    return !isNaN(aNum) && !isNaN(bNum) ? aNum - bNum : a.localeCompare(b);
  });
  const activeRegions = Array.from(new Set<string>(filteredData.map(d => d.region))).sort();

  const heatmapGrid: Record<string, Record<string, number>> = {};
  let maxGridSales = 0;
  filteredData.forEach(row => {
    if (!heatmapGrid[row.week]) heatmapGrid[row.week] = {};
    heatmapGrid[row.week][row.region] = (heatmapGrid[row.week][row.region] || 0) + row.netSales;
    if (heatmapGrid[row.week][row.region] > maxGridSales) {
      maxGridSales = heatmapGrid[row.week][row.region];
    }
  });

  // 12. Marketing Spend vs Net Sales Correlation (Scatter Plot)
  const scatterMap = new Map<string, { name: string; marketingSpend: number; sales: number }>();
  filteredData.forEach(row => {
    const key = `${row.storeId}-${row.category}`;
    const val = scatterMap.get(key) || { name: `${row.storeName} - ${row.category}`, marketingSpend: 0, sales: 0 };
    val.marketingSpend += row.marketingSpend;
    val.sales += row.netSales;
    scatterMap.set(key, val);
  });
  const scatterData = Array.from(scatterMap.values()).filter(d => d.marketingSpend > 0);

  // Custom tooltips
  const CustomTooltipCurrency = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1F2937] border border-slate-700 text-white p-3 rounded shadow-md text-xs font-sans">
          <p className="font-bold border-b border-slate-700 pb-1 mb-1.5">{label}</p>
          {payload.map((p: any, i: number) => (
            <p key={i} className="flex justify-between gap-4 mt-0.5">
              <span className="text-slate-300">{p.name}:</span>
              <span className="font-semibold font-mono">{formatCurrency(p.value)}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomTooltipPercent = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1F2937] border border-slate-700 text-white p-3 rounded shadow-md text-xs font-sans">
          <p className="font-bold border-b border-slate-700 pb-1 mb-1.5">{label}</p>
          {payload.map((p: any, i: number) => (
            <p key={i} className="flex justify-between gap-4 mt-0.5">
              <span className="text-slate-300">{p.name}:</span>
              <span className="font-semibold font-mono">{p.value.toFixed(1)}%</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-[#1E1E1E] border border-[#E5E7EB] dark:border-[#2D2D2D] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.01)] flex flex-col h-full">
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 border-b border-[#E5E7EB] dark:border-[#2D2D2D] pb-4 mb-5">
        <div>
          <h3 className="font-bold text-sm text-[#1F2937] dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#1F4E79]" />
            <span>Interactive Operational Analysis Deck</span>
          </h3>
          <p className="text-xs text-[#6B7280] dark:text-[#A0AEC0] mt-1">Multi-perspective charts dynamically refreshing with Slicer selections.</p>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap gap-1 p-1 bg-[#F5F7FA] dark:bg-[#2D2D2D] rounded-lg">
          <button
            onClick={() => setActiveTab("revenue")}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
              activeTab === "revenue"
                ? "bg-white dark:bg-[#1E1E1E] text-[#1F4E79] dark:text-[#FFFFFF] shadow-xs"
                : "text-[#6B7280] dark:text-[#A0AEC0] hover:text-[#1F2937]"
            }`}
          >
            Revenue & Expansion
          </button>
          <button
            onClick={() => setActiveTab("products")}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
              activeTab === "products"
                ? "bg-white dark:bg-[#1E1E1E] text-[#1F4E79] dark:text-[#FFFFFF] shadow-xs"
                : "text-[#6B7280] dark:text-[#A0AEC0] hover:text-[#1F2937]"
            }`}
          >
            Product Portfolio
          </button>
          <button
            onClick={() => setActiveTab("outlets")}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
              activeTab === "outlets"
                ? "bg-white dark:bg-[#1E1E1E] text-[#1F4E79] dark:text-[#FFFFFF] shadow-xs"
                : "text-[#6B7280] dark:text-[#A0AEC0] hover:text-[#1F2937]"
            }`}
          >
            Store Outlets
          </button>
          <button
            onClick={() => setActiveTab("operations")}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
              activeTab === "operations"
                ? "bg-white dark:bg-[#1E1E1E] text-[#1F4E79] dark:text-[#FFFFFF] shadow-xs"
                : "text-[#6B7280] dark:text-[#A0AEC0] hover:text-[#1F2937]"
            }`}
          >
            Risks & Spend
          </button>
        </div>
      </div>

      <div className="flex-1">
        {/* --- REVENUE TAB --- */}
        {activeTab === "revenue" && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {/* Chart 1: Weekly Sales Trend (Smooth Area Chart) */}
            <div className="border border-[#E5E7EB] dark:border-[#2D2D2D] p-4 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.01)] bg-white dark:bg-[#1E1E1E]">
              <h4 className="font-bold text-xs text-[#1F2937] dark:text-white mb-4 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-[#1F4E79]" />
                <span>1. Weekly Sales Trend (Smooth Area)</span>
              </h4>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklySalesData}>
                    <defs>
                      <linearGradient id="colorSalesArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1F4E79" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#1F4E79" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#2D2D2D" : "#E5E7EB"} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(v) => `$${v / 1000}k`} tickLine={false} />
                    <Tooltip content={<CustomTooltipCurrency />} />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Area type="monotone" dataKey="sales" name="Net Sales" stroke="#1F4E79" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSalesArea)" />
                    <Line type="monotone" dataKey="target" name="Target Sales" stroke="#F9A825" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Sales by Region (Horizontal descending) */}
            <div className="border border-[#E5E7EB] dark:border-[#2D2D2D] p-4 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.01)] bg-white dark:bg-[#1E1E1E]">
              <h4 className="font-bold text-xs text-[#1F2937] dark:text-white mb-4 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-[#3949AB]" />
                <span>2. Sales by Region (Horizontal Descending)</span>
              </h4>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={regionalSalesData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDarkMode ? "#2D2D2D" : "#E5E7EB"} />
                    <XAxis type="number" stroke="#94a3b8" fontSize={10} tickFormatter={(v) => `$${v / 1000}k`} tickLine={false} />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} tickLine={false} width={80} />
                    <Tooltip content={<CustomTooltipCurrency />} />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Bar dataKey="sales" name="Net Sales" radius={[0, 4, 4, 0]}>
                      {regionalSalesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_PALETTE[index % CHART_PALETTE.length]} />
                      ))}
                    </Bar>
                    <Bar dataKey="target" name="Target Sales" fill={isDarkMode ? "#333" : "#E5E7EB"} radius={[0, 4, 4, 0]} opacity={0.65} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 10: Sales Contribution by Region (Pie/Share) */}
            <div className="border border-[#E5E7EB] dark:border-[#2D2D2D] p-4 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.01)] bg-white dark:bg-[#1E1E1E]">
              <h4 className="font-bold text-xs text-[#1F2937] dark:text-white mb-4 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#1976D2]" />
                <span>10. Region Contribution Share (Net Sales)</span>
              </h4>
              <div className="h-72 flex flex-col justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={regionalSalesData}
                      dataKey="sales"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={90}
                      paddingAngle={4}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    >
                      {regionalSalesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_PALETTE[index % CHART_PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [formatCurrency(value), "Net Sales"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 11: Weekly Heatmap (Matrix View) */}
            <div className="border border-[#E5E7EB] dark:border-[#2D2D2D] p-4 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.01)] bg-white dark:bg-[#1E1E1E] flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-xs text-[#1F2937] dark:text-white mb-1.5 flex items-center gap-1.5">
                  <Percent className="w-4 h-4 text-[#2E7D32]" />
                  <span>11. Weekly Heatmap: Matrix Visualization</span>
                </h4>
                <p className="text-[10px] text-[#6B7280] dark:text-[#A0AEC0] mb-4">Commercial density analysis. Deep corporate green highlights maximum sales thresholds.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-[#1F2937] dark:text-[#A0AEC0] border-collapse border border-[#E5E7EB] dark:border-[#2D2D2D]">
                  <thead>
                    <tr>
                      <th className="p-2 text-left bg-[#F5F7FA] dark:bg-[#2D2D2D] border border-[#E5E7EB] dark:border-[#2D2D2D]">Week</th>
                      {activeRegions.map(reg => (
                        <th key={reg} className="p-2 text-center bg-[#F5F7FA] dark:bg-[#2D2D2D] border border-[#E5E7EB] dark:border-[#2D2D2D] font-bold">{reg}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeWeeks.map(week => (
                      <tr key={week} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                        <td className="p-2 font-semibold bg-[#F5F7FA]/50 dark:bg-[#2D2D2D]/30 border border-[#E5E7EB] dark:border-[#2D2D2D] whitespace-nowrap">{week}</td>
                        {activeRegions.map(reg => {
                          const value = heatmapGrid[week]?.[reg] || 0;
                          const intensity = maxGridSales > 0 ? value / maxGridSales : 0;
                          
                          // Rich Power BI corporate Green styling
                          const bgStyle = value > 0 ? {
                            backgroundColor: `rgba(46, 125, 50, ${Math.max(0.08, intensity * 0.85)})`,
                            color: intensity > 0.45 ? "#fff" : "inherit"
                          } : undefined;
                          return (
                            <td
                              key={reg}
                              style={bgStyle}
                              className="p-2 text-center border border-[#E5E7EB] dark:border-[#2D2D2D] font-mono font-semibold transition-all"
                              title={`${week} - ${reg}: ${formatCurrency(value)}`}
                            >
                              {value > 0 ? `$${Math.round(value / 1000)}k` : "-"}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- PRODUCTS PORTFOLIO TAB --- */}
        {activeTab === "products" && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {/* Chart 3: Category Performance (Horizontal bars) */}
            <div className="border border-[#E5E7EB] dark:border-[#2D2D2D] p-4 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.01)] bg-white dark:bg-[#1E1E1E]">
              <h4 className="font-bold text-xs text-[#1F2937] dark:text-white mb-4 flex items-center gap-1.5">
                <Store className="w-4 h-4 text-[#1F4E79]" />
                <span>3. Product Category Sales (Horizontal bars)</span>
              </h4>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryPerformanceData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDarkMode ? "#2D2D2D" : "#E5E7EB"} />
                    <XAxis type="number" stroke="#94a3b8" fontSize={10} tickFormatter={(v) => `$${v / 1000}k`} tickLine={false} />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} tickLine={false} width={100} />
                    <Tooltip content={<CustomTooltipCurrency />} />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Bar dataKey="sales" name="Net Sales" fill="#1F4E79" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 7: Discount Analysis (Column Chart) */}
            <div className="border border-[#E5E7EB] dark:border-[#2D2D2D] p-4 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.01)] bg-white dark:bg-[#1E1E1E]">
              <h4 className="font-bold text-xs text-[#1F2937] dark:text-white mb-4 flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-[#3949AB]" />
                <span>7. Promotional Discount Rate (Column Chart)</span>
              </h4>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryDiscountData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#2D2D2D" : "#E5E7EB"} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(v) => `${v}%`} tickLine={false} />
                    <Tooltip content={<CustomTooltipPercent />} />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Bar dataKey="discountRate" name="Promo Discount Rate %" fill="#3949AB" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 8: Returns (Stacked bar: Net Sales & Return Amount) */}
            <div className="border border-[#E5E7EB] dark:border-[#2D2D2D] p-4 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.01)] bg-white dark:bg-[#1E1E1E] xl:col-span-2">
              <h4 className="font-bold text-xs text-[#1F2937] dark:text-white mb-4 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-[#C62828]" />
                <span>8. Category Return Impact Analysis (Stacked Bar)</span>
              </h4>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryReturnData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#2D2D2D" : "#E5E7EB"} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(v) => `$${v / 1000}k`} tickLine={false} />
                    <Tooltip content={<CustomTooltipCurrency />} />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Bar dataKey="sales" name="Net Sales" stackId="a" fill="#1F4E79" />
                    <Bar dataKey="returns" name="Returns Volume" stackId="a" fill="#C62828" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* --- STORE OUTLETS TAB --- */}
        {activeTab === "outlets" && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {/* Chart 4: Top Stores (Leaderboard with rank) */}
            <div className="border border-[#E5E7EB] dark:border-[#2D2D2D] p-4 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.01)] bg-white dark:bg-[#1E1E1E]">
              <h4 className="font-bold text-xs text-[#1F2937] dark:text-white mb-4 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#2E7D32]" />
                <span>4. Top Store Outlets Leaderboard (Sales Ranked)</span>
              </h4>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={top10Stores} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDarkMode ? "#2D2D2D" : "#E5E7EB"} />
                    <XAxis type="number" stroke="#94a3b8" fontSize={10} tickFormatter={(v) => `$${v / 1000}k`} tickLine={false} />
                    <YAxis dataKey="displayName" type="category" stroke="#94a3b8" fontSize={10} width={135} tickLine={false} />
                    <Tooltip content={<CustomTooltipCurrency />} />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Bar dataKey="sales" name="Net Sales" fill="#2E7D32" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 5: Bottom 10 Outlets */}
            <div className="border border-[#E5E7EB] dark:border-[#2D2D2D] p-4 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.01)] bg-white dark:bg-[#1E1E1E]">
              <h4 className="font-bold text-xs text-[#1F2937] dark:text-white mb-4 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-[#C62828]" />
                <span>5. Bottom 10 Outlets (Requires Immediate Action)</span>
              </h4>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bottom10Stores} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDarkMode ? "#2D2D2D" : "#E5E7EB"} />
                    <XAxis type="number" stroke="#94a3b8" fontSize={10} tickFormatter={(v) => `$${v / 1000}k`} tickLine={false} />
                    <YAxis dataKey="displayName" type="category" stroke="#94a3b8" fontSize={10} width={135} tickLine={false} />
                    <Tooltip content={<CustomTooltipCurrency />} />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Bar dataKey="sales" name="Net Sales" fill="#C62828" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 6: Target Achievement Gauge */}
            <div className="border border-[#E5E7EB] dark:border-[#2D2D2D] p-5 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.01)] bg-white dark:bg-[#1E1E1E] xl:col-span-2 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="md:max-w-xs">
                <h4 className="font-bold text-xs text-[#1F2937] dark:text-white mb-2.5 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#1F4E79]" />
                  <span>6. Target Achievement Bullet Gauge</span>
                </h4>
                <p className="text-xs text-[#6B7280] dark:text-[#A0AEC0] leading-relaxed mb-3">
                  Consolidated target achievement against enterprise sales limits. An absolute ratio exceeding 100% signals top commercial output.
                </p>
                <div className="text-xs text-[#1F2937] dark:text-white space-y-1">
                  <p>Consolidated Net Sales: <strong className="font-semibold">{formatCurrency(totalNetSalesSum)}</strong></p>
                  <p>Consolidated Target: <strong className="font-semibold">{formatCurrency(totalTargetSalesSum)}</strong></p>
                </div>
              </div>

              {/* Gauge */}
              <div className="w-56 h-36 relative flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={gaugeData}
                      dataKey="value"
                      startAngle={180}
                      endAngle={0}
                      innerRadius={65}
                      outerRadius={85}
                      cx="50%"
                      cy="100%"
                    >
                      {gaugeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => [`${v.toFixed(1)}%`, "Ratio"]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute bottom-1 text-center">
                  <span className="text-3xl font-extrabold tracking-tight text-[#1F2937] dark:text-white">
                    {totalAchievementRatio.toFixed(1)}%
                  </span>
                  <p className="text-[9px] text-[#6B7280] dark:text-[#A0AEC0] uppercase font-bold tracking-widest mt-0.5">Target Met</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- OPERATIONS TAB --- */}
        {activeTab === "operations" && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            {/* Chart 9: Stockout Risk Distribution */}
            <div className="border border-[#E5E7EB] dark:border-[#2D2D2D] p-4 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.01)] bg-white dark:bg-[#1E1E1E]">
              <h4 className="font-bold text-xs text-[#1F2937] dark:text-white mb-4 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-[#C62828]" />
                <span>9. Stockout Risk Distribution</span>
              </h4>
              <div className="h-72 flex flex-col justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stockoutRiskData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={3}
                      label={({ value }) => `${value} units`}
                    >
                      {stockoutRiskData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [formatInteger(value), "Outlet Count"]} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 10: Customer Ratings Donut */}
            <div className="border border-[#E5E7EB] dark:border-[#2D2D2D] p-4 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.01)] bg-white dark:bg-[#1E1E1E]">
              <h4 className="font-bold text-xs text-[#1F2937] dark:text-white mb-4 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#2E7D32]" />
                <span>10. Customer Satisfaction Ratings (Donut)</span>
              </h4>
              <div className="h-72 flex flex-col justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={customerRatingsData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={3}
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {customerRatingsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [formatInteger(value), "Stores Count"]} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 12: Marketing Spend vs Net Sales Correlation (Scatter Plot) */}
            <div className="border border-[#E5E7EB] dark:border-[#2D2D2D] p-4 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.01)] bg-white dark:bg-[#1E1E1E]">
              <h4 className="font-bold text-xs text-[#1F2937] dark:text-white mb-4 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-[#1976D2]" />
                <span>12. Marketing Spend vs Net Sales Correlation</span>
              </h4>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 15, right: 15, bottom: 15, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#2D2D2D" : "#E5E7EB"} />
                    <XAxis type="number" dataKey="marketingSpend" name="Promo Spend" stroke="#94a3b8" fontSize={9} tickFormatter={(v) => `$${v}`} label={{ value: "Campaign Spend ($)", position: "insideBottom", offset: -5, fontSize: 9 }} />
                    <YAxis type="number" dataKey="sales" name="Sales" stroke="#94a3b8" fontSize={9} tickFormatter={(v) => `$${v / 1000}k`} label={{ value: "Net Sales ($)", angle: -90, position: "insideLeft", offset: 0, fontSize: 9 }} />
                    <ZAxis dataKey="name" name="Campaign Segment" />
                    <Tooltip cursor={{ strokeDasharray: "3 3" }} formatter={(value: any, name: string) => {
                      if (name === "Sales" || name === "Promo Spend") return [formatCurrency(Number(value)), name];
                      return [value, name];
                    }} />
                    <Scatter name="Campaign Correlation" data={scatterData} fill="#1F4E79" opacity={0.7} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
