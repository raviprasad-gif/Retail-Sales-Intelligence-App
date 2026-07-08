/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import * as XLSX from "xlsx";
import { MergedRetailRow, KPIStats, FilterState } from "./types";
import { parseExcelFile, mergeDatasets, generateSampleFiles, formatCurrency, formatInteger } from "./utils/excel";
import { calculateAnalyticalSummary } from "./utils/insights";
import { ExportHeader } from "./components/ExportHeader";
import { DataUploader } from "./components/DataUploader";
import { SidebarFilters } from "./components/SidebarFilters";
import { KPICard } from "./components/KPICard";
import { Database, Layout, RefreshCw, UploadCloud, Server } from "lucide-react";

// Lazy loaded heavy visual components for optimized initial paint and SEO performance
const DashboardCharts = lazy(() => import("./components/DashboardCharts").then(m => ({ default: m.DashboardCharts })));
const InsightsPanel = lazy(() => import("./components/InsightsPanel").then(m => ({ default: m.InsightsPanel })));

export default function App() {
  const [mergedData, setMergedData] = useState<MergedRetailRow[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);

  // Filter Selection States
  const [selectedWeeks, setSelectedWeeks] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedStoreFormats, setSelectedStoreFormats] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Theme support
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const handleToggleDarkMode = () => {
    if (isDarkMode) {
      setIsDarkMode(false);
      localStorage.setItem("theme", "light");
      document.documentElement.classList.remove("dark");
    } else {
      setIsDarkMode(true);
      localStorage.setItem("theme", "dark");
      document.documentElement.classList.add("dark");
    }
  };

  // Precompile lists of unique values for dropdowns/checkboxes from loaded data
  const availableFilters = useMemo<FilterState>(() => {
    if (mergedData.length === 0) {
      return { weeks: [], regions: [], stores: [], cities: [], storeFormats: [], categories: [] };
    }

    const weeks = new Set<string>();
    const regions = new Set<string>();
    const stores = new Set<string>();
    const cities = new Set<string>();
    const formats = new Set<string>();
    const categories = new Set<string>();

    mergedData.forEach(row => {
      weeks.add(row.week);
      regions.add(row.region);
      stores.add(row.storeName);
      cities.add(row.city);
      formats.add(row.storeFormat);
      categories.add(row.category);
    });

    const alphaNumSort = (a: string, b: string) => {
      const aNum = parseInt(a.replace(/^\D+/g, ""), 10);
      const bNum = parseInt(b.replace(/^\D+/g, ""), 10);
      return !isNaN(aNum) && !isNaN(bNum) ? aNum - bNum : a.localeCompare(b);
    };

    return {
      weeks: Array.from(weeks).sort(alphaNumSort),
      regions: Array.from(regions).sort(),
      stores: Array.from(stores).sort(),
      cities: Array.from(cities).sort(),
      storeFormats: Array.from(formats).sort(),
      categories: Array.from(categories).sort()
    };
  }, [mergedData]);

  // Set all filters as active on load
  useEffect(() => {
    if (mergedData.length > 0) {
      setSelectedWeeks(availableFilters.weeks);
      setSelectedRegions(availableFilters.regions);
      setSelectedStores(availableFilters.stores);
      setSelectedCities(availableFilters.cities);
      setSelectedStoreFormats(availableFilters.storeFormats);
      setSelectedCategories(availableFilters.categories);
    }
  }, [mergedData, availableFilters]);

  // Process data merging
  const handleDataLoaded = (salesRows: any[], storeRows: any[]) => {
    const { data, errors } = mergeDatasets(salesRows, storeRows);
    if (errors.length > 0) {
      console.warn("Dataset merge encountered anomalies:", errors);
    }
    setMergedData(data);
  };

  // Instantly initializes the dashboard using demo values
  const handleLoadDemoData = () => {
    const { salesUrl, storeUrl } = generateSampleFiles();
    
    Promise.all([
      fetch(salesUrl).then(r => r.arrayBuffer()),
      fetch(storeUrl).then(r => r.arrayBuffer())
    ]).then(([salesArr, storeArr]) => {
      const salesWb = XLSX.read(salesArr, { type: "array" });
      const storeWb = XLSX.read(storeArr, { type: "array" });
      
      const salesJson = XLSX.utils.sheet_to_json(salesWb.Sheets[salesWb.SheetNames[0]]);
      const storeJson = XLSX.utils.sheet_to_json(storeWb.Sheets[storeWb.SheetNames[0]]);

      handleDataLoaded(salesJson, storeJson);
    }).catch(err => {
      console.error("Failed to load demo:", err);
    });
  };

  // Handle resets
  const handleResetAllData = () => {
    setMergedData([]);
    setSelectedWeeks([]);
    setSelectedRegions([]);
    setSelectedStores([]);
    setSelectedCities([]);
    setSelectedStoreFormats([]);
    setSelectedCategories([]);
  };

  // Handles dynamic filter changes
  const handleFilterChange = (dimension: string, selectedValues: string[]) => {
    switch (dimension) {
      case "weeks":
        setSelectedWeeks(selectedValues);
        break;
      case "regions":
        setSelectedRegions(selectedValues);
        break;
      case "stores":
        setSelectedStores(selectedValues);
        break;
      case "cities":
        setSelectedCities(selectedValues);
        break;
      case "storeFormats":
        setSelectedStoreFormats(selectedValues);
        break;
      case "categories":
        setSelectedCategories(selectedValues);
        break;
    }
  };

  const handleResetFilters = () => {
    setSelectedWeeks(availableFilters.weeks);
    setSelectedRegions(availableFilters.regions);
    setSelectedStores(availableFilters.stores);
    setSelectedCities(availableFilters.cities);
    setSelectedStoreFormats(availableFilters.storeFormats);
    setSelectedCategories(availableFilters.categories);
  };

  // Calculate dynamic filtered rows
  const filteredData = useMemo(() => {
    return mergedData.filter(row => {
      return (
        selectedWeeks.includes(row.week) &&
        selectedRegions.includes(row.region) &&
        selectedStores.includes(row.storeName) &&
        selectedCities.includes(row.city) &&
        selectedStoreFormats.includes(row.storeFormat) &&
        selectedCategories.includes(row.category)
      );
    });
  }, [
    mergedData,
    selectedWeeks,
    selectedRegions,
    selectedStores,
    selectedCities,
    selectedStoreFormats,
    selectedCategories
  ]);

  // Aggregate Key KPI Stats dynamically over filtered datasets
  const kpiStats = useMemo<KPIStats>(() => {
    if (filteredData.length === 0) {
      return {
        netSales: 0,
        grossSales: 0,
        targetSales: 0,
        targetAchievement: 0,
        avgTransactionValue: 0,
        returnRate: 0,
        discountRate: 0,
        conversionRate: 0,
        stockoutLevel: "Low"
      };
    }

    let netSalesSum = 0;
    let grossSalesSum = 0;
    let targetSalesSum = 0;
    let transactionsSum = 0;
    let footfallSum = 0;
    let returnAmountSum = 0;
    let discountAmountSum = 0;
    let lowInventoryCount = 0;

    filteredData.forEach(row => {
      netSalesSum += row.netSales;
      grossSalesSum += row.grossSales;
      targetSalesSum += row.targetSales;
      transactionsSum += row.transactions;
      footfallSum += row.footfall;
      returnAmountSum += row.returnAmount;
      discountAmountSum += row.discountAmount;
      if (row.inventoryStatus === "Low") {
        lowInventoryCount++;
      }
    });

    const targetAchievement = targetSalesSum > 0 ? (netSalesSum / targetSalesSum) * 100 : 100;
    const avgTransactionValue = transactionsSum > 0 ? netSalesSum / transactionsSum : 0;
    const returnRate = netSalesSum > 0 ? (returnAmountSum / netSalesSum) * 100 : 0;
    const discountRate = grossSalesSum > 0 ? (discountAmountSum / grossSalesSum) * 100 : 0;
    const conversionRate = footfallSum > 0 ? (transactionsSum / footfallSum) * 100 : 0;

    const stockoutRatio = lowInventoryCount / filteredData.length;
    let stockoutLevel: "Low" | "Medium" | "High" = "Low";
    if (stockoutRatio > 0.2) stockoutLevel = "High";
    else if (stockoutRatio > 0.1) stockoutLevel = "Medium";

    return {
      netSales: netSalesSum,
      grossSales: grossSalesSum,
      targetSales: targetSalesSum,
      targetAchievement,
      avgTransactionValue,
      returnRate,
      discountRate,
      conversionRate,
      stockoutLevel
    };
  }, [filteredData]);

  // Local analytical summary engine
  const analyticalSummary = useMemo(() => {
    return calculateAnalyticalSummary(filteredData, kpiStats);
  }, [filteredData, kpiStats]);

  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#121212] font-sans text-[#1F2937] dark:text-[#FFFFFF] transition-colors duration-300">
      {mergedData.length === 0 ? (
        // Microsoft Fabric Onboarding Portal screen
        <div className="flex flex-col items-center justify-center min-h-screen p-6 sm:p-12 relative overflow-hidden">
          {/* Subtle design shapes to feel like premium BI software workspace */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-[#1F4E79]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#3949AB]/5 rounded-full blur-3xl" />

          <div className="max-w-2xl w-full text-center space-y-8 relative z-10">
            <div className="inline-flex p-4 bg-[#1F4E79]/10 dark:bg-white/5 rounded-2xl text-[#1F4E79] dark:text-emerald-400 border border-[#1F4E79]/20 dark:border-white/10 mb-2 shadow-xs">
              <Database className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1F2937] dark:text-white">
                Power BI Executive Analytics Portal
              </h1>
              <p className="text-sm text-[#6B7280] dark:text-[#A0AEC0] mt-3.5 max-w-lg mx-auto leading-relaxed">
                Import sales and store datasets to analyze dynamic revenue profiles, target achievement records, promotional leaks, and supply chain threats.
              </p>
            </div>

            <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-2xl border border-[#E5E7EB] dark:border-[#2D2D2D] shadow-md text-left">
              <h3 className="font-bold text-xs text-[#1F2937] dark:text-white uppercase tracking-wider mb-3.5 flex items-center gap-2">
                <Layout className="w-4 h-4 text-[#1F4E79]" />
                <span>Onboarding Data Handlers</span>
              </h3>
              <p className="text-xs text-[#6B7280] dark:text-[#A0AEC0] leading-relaxed mb-4">
                To run the review console, drag and drop two structured XLSX worksheets simultaneously, or load the pre-configured enterprise demonstration model immediately below.
              </p>
              
              <DataUploader
                onDataLoaded={handleDataLoaded}
                onDemoLoaded={handleLoadDemoData}
                isDataActive={false}
              />
            </div>

            <div className="flex justify-center items-center gap-6 text-[11px] text-[#6B7280] dark:text-[#A0AEC0] font-medium pt-2">
              <span className="flex items-center gap-1.5"><Server className="w-3.5 h-3.5" /> Client Engine Parsing</span>
              <span>•</span>
              <span>Secure Sandboxed Session</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col min-h-screen">
          {/* Top Sticky Export Ribbon Bar */}
          <ExportHeader
            filteredData={filteredData}
            kpiStats={kpiStats}
            isDarkMode={isDarkMode}
            onToggleDarkMode={handleToggleDarkMode}
            onResetAllData={handleResetAllData}
          />

          <div className="flex-1 flex flex-col lg:flex-row relative">
            {/* Collapsible Left Slicers Panel */}
            <SidebarFilters
              availableWeeks={availableFilters.weeks}
              availableRegions={availableFilters.regions}
              availableStores={availableFilters.stores}
              availableCities={availableFilters.cities}
              availableStoreFormats={availableFilters.storeFormats}
              availableCategories={availableFilters.categories}

              selectedWeeks={selectedWeeks}
              selectedRegions={selectedRegions}
              selectedStores={selectedStores}
              selectedCities={selectedCities}
              selectedStoreFormats={selectedStoreFormats}
              selectedCategories={selectedCategories}

              onFilterChange={handleFilterChange}
              onResetFilters={handleResetFilters}
              isOpen={filtersOpen}
              onToggleCollapse={() => setFiltersOpen(!filtersOpen)}
            />

            {/* Dashboard Content Container */}
            <main
              id="dashboard-body"
              className="flex-1 p-4 sm:p-6 lg:p-7 space-y-6 overflow-y-auto bg-[#F5F7FA] dark:bg-[#121212]"
            >
              
              {/* KPIs Summary Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                
                {/* 1. Net Sales KPI */}
                <KPICard
                  title="Net Sales Volume"
                  value={formatCurrency(kpiStats.netSales)}
                  iconName="DollarSign"
                  colorClass="text-[#1F4E79]"
                  subtitle={`Gross valuation: ${formatCurrency(kpiStats.grossSales)}`}
                  badge={{
                    text: `${filteredData.length} records active`,
                    isPositive: true
                  }}
                />

                {/* 2. Target Achievement KPI */}
                <KPICard
                  title="Target Achievement Ratio"
                  value={`${kpiStats.targetAchievement.toFixed(1)}%`}
                  iconName="Goal"
                  colorClass={kpiStats.targetAchievement >= 100 ? "text-[#2E7D32]" : "text-[#F9A825]"}
                  subtitle={`Sales Target: ${formatCurrency(kpiStats.targetSales)}`}
                  progress={kpiStats.targetAchievement}
                />

                {/* 3. Average Transaction Value KPI */}
                <KPICard
                  title="Average Transaction Value"
                  value={formatCurrency(kpiStats.avgTransactionValue)}
                  iconName="ShoppingCart"
                  colorClass="text-[#3949AB]"
                  subtitle="Average spending per checkout"
                  badge={{
                    text: "Premium Segment",
                    isPositive: true
                  }}
                />

                {/* 4. Return Rate KPI */}
                <KPICard
                  title="Product Return Rate"
                  value={`${kpiStats.returnRate.toFixed(2)}%`}
                  iconName="RotateCcw"
                  colorClass={kpiStats.returnRate > 5 ? "text-[#C62828]" : "text-[#6B7280]"}
                  subtitle={`Total Return Amount: ${formatCurrency(filteredData.reduce((acc, row) => acc + row.returnAmount, 0))}`}
                  badge={{
                    text: kpiStats.returnRate > 5 ? "Elevated Returns" : "Optimal Limit",
                    isPositive: kpiStats.returnRate <= 5
                  }}
                />

                {/* 5. Discount Rate KPI */}
                <KPICard
                  title="Promotional Discount Rate"
                  value={`${kpiStats.discountRate.toFixed(2)}%`}
                  iconName="Percent"
                  colorClass="text-[#3949AB]"
                  subtitle={`Total Discounts Given: ${formatCurrency(filteredData.reduce((acc, row) => acc + row.discountAmount, 0))}`}
                />

                {/* 6. Conversion Rate KPI */}
                <KPICard
                  title="Footfall Conversion Rate"
                  value={`${kpiStats.conversionRate.toFixed(2)}%`}
                  iconName="TrendingUp"
                  colorClass="text-[#2E7D32]"
                  subtitle={`${formatInteger(filteredData.reduce((acc, row) => acc + row.transactions, 0))} checkouts out of ${formatInteger(filteredData.reduce((acc, row) => acc + row.footfall, 0))} visits`}
                />

                {/* 7. Stockout Indicator KPI */}
                <KPICard
                  title="Stockout Threat Level"
                  value={kpiStats.stockoutLevel}
                  iconName="ShieldAlert"
                  colorClass={
                    kpiStats.stockoutLevel === "High"
                      ? "text-[#C62828]"
                      : kpiStats.stockoutLevel === "Medium"
                      ? "text-[#F9A825]"
                      : "text-[#2E7D32]"
                  }
                  subtitle="Stores experiencing low-stock limits"
                  badge={{
                    text: kpiStats.stockoutLevel === "High" ? "Action Required" : "Stable Status",
                    isPositive: kpiStats.stockoutLevel !== "High"
                  }}
                />

                {/* Custom Card for Filter Status Info */}
                <div className="bg-white dark:bg-[#1E1E1E] border border-[#E5E7EB] dark:border-[#2D2D2D] rounded-xl p-5 shadow-[0_2px_4px_rgba(0,0,0,0.02)] flex flex-col justify-center text-center">
                  <span className="text-[11px] font-semibold text-[#6B7280] dark:text-[#A0AEC0] uppercase tracking-wider block mb-1">
                    Dataset Coverage
                  </span>
                  <div className="flex justify-center gap-1.5 items-baseline text-[#1F2937] dark:text-white">
                    <span className="text-3xl font-bold font-sans">{filteredData.length}</span>
                    <span className="text-xs text-[#6B7280] dark:text-[#A0AEC0] font-medium">/ {mergedData.length} rows</span>
                  </div>
                  <p className="text-[11px] text-[#6B7280] dark:text-[#A0AEC0] mt-1.5 leading-tight">
                    Visualizing {( (filteredData.length / mergedData.length) * 100 ).toFixed(0)}% of the master commercial repository.
                  </p>
                </div>

              </div>

              {/* Dynamic Analytical Insights Panel */}
              <div id="insights-deck">
                <Suspense fallback={
                  <div className="bg-white dark:bg-[#1E1E1E] border border-[#E5E7EB] dark:border-[#2D2D2D] rounded-xl p-6 shadow-xs animate-pulse h-64 flex items-center justify-center">
                    <div className="text-center space-y-3">
                      <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#1F4E79] dark:text-emerald-400" />
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Assembling Executive AI Report...</p>
                    </div>
                  </div>
                }>
                  <InsightsPanel
                    summary={analyticalSummary}
                    overallStats={kpiStats}
                    filterState={{
                      weeks: selectedWeeks,
                      regions: selectedRegions,
                      stores: selectedStores,
                      cities: selectedCities,
                      storeFormats: selectedStoreFormats,
                      categories: selectedCategories
                    }}
                  />
                </Suspense>
              </div>

              {/* 12 Interactive Visualizations deck */}
              <div id="charts-deck" className="h-full">
                <Suspense fallback={
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
                    {[1, 2, 3, 4].map(n => (
                      <div key={n} className="bg-white dark:bg-[#1E1E1E] border border-[#E5E7EB] dark:border-[#2D2D2D] rounded-xl p-6 h-80 flex items-center justify-center">
                        <div className="text-center space-y-2">
                          <Layout className="w-6 h-6 mx-auto text-gray-300" />
                          <div className="h-2 w-24 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto" />
                        </div>
                      </div>
                    ))}
                  </div>
                }>
                  <DashboardCharts filteredData={filteredData} />
                </Suspense>
              </div>

            </main>
          </div>
        </div>
      )}
    </div>
  );
}
