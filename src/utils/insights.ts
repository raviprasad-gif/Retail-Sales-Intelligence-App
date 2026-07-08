/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MergedRetailRow, KPIStats } from "../types";
import { formatCurrency, formatPercent } from "./excel";

export interface AnalyticsSummary {
  bestRegion: { name: string; sales: number };
  worstRegion: { name: string; sales: number };
  bestStore: { id: string; name: string; sales: number };
  worstStore: { id: string; name: string; sales: number };
  storesMissingTarget: Array<{ id: string; name: string; achievement: number; netSales: number; targetSales: number }>;
  categoriesReturns: Array<{ category: string; returnAmount: number; returnRate: number }>;
  categoriesDiscounts: Array<{ category: string; discountAmount: number; discountRate: number }>;
  regionsStockout: Array<{ region: string; stockoutRatio: number }>;
  weeklyTrend: Array<{ week: string; sales: number; growthRate: number }>;
  largestOpportunity: string;
  recommendations: string[];
  executiveSummary: string;
  trends: string[];
  anomalies: string[];
  targetMissExplanation: string;
}

/**
 * Calculates a complete analytical summary from a filtered list of retail rows
 */
export function calculateAnalyticalSummary(rows: MergedRetailRow[], overallStats: KPIStats): AnalyticsSummary {
  if (rows.length === 0) {
    return {
      bestRegion: { name: "N/A", sales: 0 },
      worstRegion: { name: "N/A", sales: 0 },
      bestStore: { id: "N/A", name: "N/A", sales: 0 },
      worstStore: { id: "N/A", name: "N/A", sales: 0 },
      storesMissingTarget: [],
      categoriesReturns: [],
      categoriesDiscounts: [],
      regionsStockout: [],
      weeklyTrend: [],
      largestOpportunity: "No data available to identify sales opportunities.",
      recommendations: ["Upload retail sales and store master data to generate strategic recommendations."],
      executiveSummary: "Please upload your sales and store data files to generate a comprehensive BI consultant executive summary.",
      trends: ["No data loaded. Please upload datasets to analyze structural growth trends."],
      anomalies: ["No anomalies can be identified without active dataset segments."],
      targetMissExplanation: "No active target deficit evaluations can be performed without loaded sales targets."
    };
  }

  // Groupings helper maps
  const regionSalesMap = new Map<string, number>();
  const storeSalesMap = new Map<string, { name: string; sales: number; target: number }>();
  const categoryReturnsMap = new Map<string, { returns: number; sales: number }>();
  const categoryDiscountsMap = new Map<string, { discounts: number; gross: number }>();
  
  // Stockout calculations
  // Inventory Status: "Low" means high stockout risk (low availability).
  // Let's count "Low" items by region.
  const regionStockoutMap = new Map<string, { lowCount: number; totalCount: number }>();

  // Weekly sales
  const weeklySalesMap = new Map<string, number>();

  rows.forEach(row => {
    // 1. Region Sales
    regionSalesMap.set(row.region, (regionSalesMap.get(row.region) || 0) + row.netSales);

    // 2. Store Sales & Target
    const storeObj = storeSalesMap.get(row.storeId) || { name: row.storeName, sales: 0, target: 0 };
    storeObj.sales += row.netSales;
    storeObj.target += row.targetSales;
    storeSalesMap.set(row.storeId, storeObj);

    // 3. Category Returns
    const catReturn = categoryReturnsMap.get(row.category) || { returns: 0, sales: 0 };
    catReturn.returns += row.returnAmount;
    catReturn.sales += row.netSales;
    categoryReturnsMap.set(row.category, catReturn);

    // 4. Category Discounts
    const catDiscount = categoryDiscountsMap.get(row.category) || { discounts: 0, gross: 0 };
    catDiscount.discounts += row.discountAmount;
    catDiscount.gross += row.grossSales;
    categoryDiscountsMap.set(row.category, catDiscount);

    // 5. Stockout Ratio
    const regStock = regionStockoutMap.get(row.region) || { lowCount: 0, totalCount: 0 };
    regStock.totalCount += 1;
    if (row.inventoryStatus === "Low") {
      regStock.lowCount += 1;
    }
    regionStockoutMap.set(row.region, regStock);

    // 6. Weekly sales
    weeklySalesMap.set(row.week, (weeklySalesMap.get(row.week) || 0) + row.netSales);
  });

  // Calculate Best/Worst Region
  let bestRegion = { name: "None", sales: -Infinity };
  let worstRegion = { name: "None", sales: Infinity };
  regionSalesMap.forEach((sales, name) => {
    if (sales > bestRegion.sales) bestRegion = { name, sales };
    if (sales < worstRegion.sales) worstRegion = { name, sales };
  });

  // Calculate Best/Worst Store & Stores Missing Target
  let bestStore = { id: "None", name: "None", sales: -Infinity };
  let worstStore = { id: "None", name: "None", sales: Infinity };
  const storesMissingTarget: AnalyticsSummary["storesMissingTarget"] = [];

  storeSalesMap.forEach((data, id) => {
    if (data.sales > bestStore.sales) {
      bestStore = { id, name: data.name, sales: data.sales };
    }
    if (data.sales < worstStore.sales) {
      worstStore = { id, name: data.name, sales: data.sales };
    }

    const achievement = data.target > 0 ? (data.sales / data.target) * 100 : 100;
    if (achievement < 95) {
      storesMissingTarget.push({
        id,
        name: data.name,
        achievement,
        netSales: data.sales,
        targetSales: data.target
      });
    }
  });

  // Sort missing target list by largest deficit
  storesMissingTarget.sort((a, b) => a.achievement - b.achievement);

  // Category Returns
  const categoriesReturns: AnalyticsSummary["categoriesReturns"] = [];
  categoryReturnsMap.forEach((val, category) => {
    categoriesReturns.push({
      category,
      returnAmount: val.returns,
      returnRate: val.sales > 0 ? (val.returns / val.sales) * 100 : 0
    });
  });
  categoriesReturns.sort((a, b) => b.returnAmount - a.returnAmount);

  // Category Discounts
  const categoriesDiscounts: AnalyticsSummary["categoriesDiscounts"] = [];
  categoryDiscountsMap.forEach((val, category) => {
    categoriesDiscounts.push({
      category,
      discountAmount: val.discounts,
      discountRate: val.gross > 0 ? (val.discounts / val.gross) * 100 : 0
    });
  });
  categoriesDiscounts.sort((a, b) => b.discountRate - a.discountRate);

  // Region Stockouts
  const regionsStockout: AnalyticsSummary["regionsStockout"] = [];
  regionStockoutMap.forEach((val, region) => {
    regionsStockout.push({
      region,
      stockoutRatio: val.totalCount > 0 ? (val.lowCount / val.totalCount) * 100 : 0
    });
  });
  regionsStockout.sort((a, b) => b.stockoutRatio - a.stockoutRatio);

  // Weekly Trend
  const weeklyTrend: AnalyticsSummary["weeklyTrend"] = [];
  const sortedWeeks = Array.from(weeklySalesMap.keys()).sort((a, b) => {
    // Basic sorting for "Week 21", "Week 22" or numeric weeks
    const aNum = parseInt(a.replace(/^\D+/g, ""), 10);
    const bNum = parseInt(b.replace(/^\D+/g, ""), 10);
    if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
    return a.localeCompare(b);
  });

  sortedWeeks.forEach((week, index) => {
    const currentSales = weeklySalesMap.get(week) || 0;
    let growthRate = 0;
    if (index > 0) {
      const prevSales = weeklySalesMap.get(sortedWeeks[index - 1]) || 0;
      growthRate = prevSales > 0 ? ((currentSales - prevSales) / prevSales) * 100 : 0;
    }
    weeklyTrend.push({
      week,
      sales: currentSales,
      growthRate
    });
  });

  // Calculate Largest Sales Opportunity
  let largestOpportunity = "";
  if (storesMissingTarget.length > 0) {
    const topDeficit = storesMissingTarget[0];
    const deficitAmount = topDeficit.targetSales - topDeficit.netSales;
    largestOpportunity = `Rebuilding sales momentum at "${topDeficit.name}" (${topDeficit.id}) which is operating at only ${topDeficit.achievement.toFixed(1)}% of targets. Meeting this store's targets represents a direct sales recapture of ${formatCurrency(deficitAmount)}.`;
  } else {
    largestOpportunity = "All stores are matching or exceeding 95% of sales targets. Focus on scaling the best performers and improving product inventory availability.";
  }

  // Core Key Business Recommendations
  const recommendations: string[] = [];
  
  // 1. Deficit recommendation
  if (storesMissingTarget.length > 0) {
    recommendations.push(
      `Deploy localized promotions and support teams to ${storesMissingTarget[0].name} to bridge its ${formatPercent(100 - storesMissingTarget[0].achievement)} target gap.`
    );
  }

  // 2. High returns recommendation
  if (categoriesReturns.length > 0 && categoriesReturns[0].returnRate > 5) {
    recommendations.push(
      `Review product quality control and customer reviews for category "${categoriesReturns[0].category}" due to an elevated return rate of ${categoriesReturns[0].returnRate.toFixed(1)}%.`
    );
  }

  // 3. High discounts recommendation
  if (categoriesDiscounts.length > 0 && categoriesDiscounts[0].discountRate > 15) {
    recommendations.push(
      `Optimize pricing strategy for "${categoriesDiscounts[0].category}". High promotional discounts of ${categoriesDiscounts[0].discountRate.toFixed(1)}% are diluting margins.`
    );
  }

  // 4. Stockout risk recommendation
  if (regionsStockout.length > 0 && regionsStockout[0].stockoutRatio > 15) {
    recommendations.push(
      `Audit regional replenishment schedules in "${regionsStockout[0].region}" where stockout risks affect ${regionsStockout[0].stockoutRatio.toFixed(1)}% of store items.`
    );
  }

  // Standard fallback recommendations
  if (recommendations.length < 3) {
    recommendations.push("Implement real-time inventory triggers to prevent stockouts of high-velocity items.");
    recommendations.push("Establish a loyalty discount tier for lower-conversion segments to boost transaction frequency.");
  }

  // ----- ADVANCED BI PROGRAMMATIC INSIGHTS GENERATION -----
  const deficitAmountValue = Math.max(0, overallStats.targetSales - overallStats.netSales);
  const totalFootfall = rows.reduce((sum, r) => sum + r.footfall, 0);
  const totalTransactions = rows.reduce((sum, r) => sum + r.transactions, 0);
  const totalReturns = rows.reduce((sum, r) => sum + r.returnAmount, 0);
  const totalDiscounts = rows.reduce((sum, r) => sum + r.discountAmount, 0);

  const execSummaryPar1 = `Our comprehensive financial performance audit shows that net sales volume reached **${formatCurrency(overallStats.netSales)}** against an overall target of **${formatCurrency(overallStats.targetSales)}**, yielding an overall target achievement rate of **${overallStats.targetAchievement.toFixed(1)}%**. This indicates a net target gap of **${formatCurrency(deficitAmountValue)}**. Regionally, commercial performance remains highly uneven; the **${bestRegion.name}** region is leading with a total sales volume of **${formatCurrency(bestRegion.sales)}**, while the **${worstRegion.name}** region is lagging in market penetration, recording only **${formatCurrency(worstRegion.sales)}** in net sales.`;

  const execSummaryPar2 = `From an operational conversion standpoint, our stores logged a collective footfall of **${totalFootfall.toLocaleString()}** customer visits, which translated into **${totalTransactions.toLocaleString()}** registered checkout transactions—yielding an overall checkout conversion efficiency of **${overallStats.conversionRate.toFixed(2)}%**. Pricing and transaction sizing remains a crucial lever, with the average checkout size establishing a baseline at **${formatCurrency(overallStats.avgTransactionValue)}**. However, gross margin retention continues to face headwinds from promo dilution, with markdowns eroding gross profits by **${overallStats.discountRate.toFixed(2)}%** (representing **${formatCurrency(totalDiscounts)}** in promo costs), while post-purchase returns further depleted net sales by **${overallStats.returnRate.toFixed(2)}%** (costing **${formatCurrency(totalReturns)}** in returns leakage).`;

  const execSummaryPar3 = `Looking ahead, structural risks are concentrated in supply chain fulfillment and localized store execution. A total of **${storesMissingTarget.length}** active outlets have failed to reach their 95% target threshold. These localized misses are closely correlated with elevated inventory risks, as stockouts affect **${regionsStockout[0]?.stockoutRatio.toFixed(1) || "0.0"}%** of product catalogs in the high-threat **${regionsStockout[0]?.region || "N/A"}** region. Resolving these fulfillment blockages and deploying targeted local marketing support to underperforming stores represents our single largest revenue-recovery opportunity.`;

  const executiveSummary = `${execSummaryPar1}\n\n${execSummaryPar2}\n\n${execSummaryPar3}`;

  // Calculate detailed Trends
  const trends: string[] = [];
  const avgWeeklySales = weeklyTrend.reduce((sum, w) => sum + w.sales, 0) / (weeklyTrend.length || 1);
  const avgWeeklyGrowth = weeklyTrend.length > 1
    ? weeklyTrend.slice(1).reduce((sum, w) => sum + w.growthRate, 0) / (weeklyTrend.length - 1)
    : 0;

  trends.push(`**Growth & Revenue Trajectory**: Sales analyzed across **${weeklyTrend.length}** distinct weeks demonstrate an average weekly baseline of **${formatCurrency(avgWeeklySales)}**, with an average period-over-period growth velocity of **${avgWeeklyGrowth.toFixed(2)}%**.`);
  
  if (overallStats.conversionRate < 1.5) {
    trends.push(`**Traffic-to-Purchase Bottleneck**: The conversion efficiency of **${overallStats.conversionRate.toFixed(2)}%** is structurally low. This highlights an inability to fully capitalize on organic footfall, pointing to potential issues with pricing, localized store design, or staff availability.`);
  } else {
    trends.push(`**Traffic-to-Purchase Conversion**: Store footfall conversion is currently operating at a healthy **${overallStats.conversionRate.toFixed(2)}%** rate. This indicates solid customer intent, strong local layout flow, and effective visual merchandising.`);
  }

  trends.push(`**Promo Elasticity & Margin Impact**: Promotional discounts average **${overallStats.discountRate.toFixed(2)}%** across all products, supporting an average transaction value of **${formatCurrency(overallStats.avgTransactionValue)}**. Continuing to rely heavily on discount-driven traffic risks permanently anchoring customer price expectations and compressing margin profiles.`);

  trends.push(`**Operational Supply Line Risk**: Overall inventory availability stands at a **${overallStats.stockoutLevel}** risk level. High-frequency item depletion in key regions is actively dampening top-line conversion and driving purchase frustration.`);

  // Calculate Anomaly insights
  const anomalies: string[] = [];

  // Group by store for anomaly detection
  const storeSalesMapEntries = Array.from(storeSalesMap.entries());
  const storeDataList = storeSalesMapEntries.map(([id, val]) => {
    const storeRows = rows.filter(r => r.storeId === id);
    const footfall = storeRows.reduce((sum, r) => sum + r.footfall, 0);
    const transactions = storeRows.reduce((sum, r) => sum + r.transactions, 0);
    const conversion = footfall > 0 ? (transactions / footfall) * 100 : 0;
    return { id, name: val.name, sales: val.sales, target: val.target, footfall, transactions, conversion };
  });

  const avgStoreConversion = storeDataList.reduce((acc, s) => acc + s.conversion, 0) / (storeDataList.length || 1);
  const avgStoreFootfall = storeDataList.reduce((acc, s) => acc + s.footfall, 0) / (storeDataList.length || 1);

  // 1. Paradoxical Store: High footfall but exceptionally low conversion
  const conversionAnomalyStore = storeDataList.find(s => s.footfall > avgStoreFootfall * 0.8 && s.conversion < avgStoreConversion * 0.7);
  if (conversionAnomalyStore) {
    anomalies.push(`**Footfall-Conversion Divergence**: Store **${conversionAnomalyStore.name}** logged strong visitor traffic (${conversionAnomalyStore.footfall.toLocaleString()} visits) but converted at only **${conversionAnomalyStore.conversion.toFixed(2)}%** (more than 30% below average). This identifies a critical disconnect in localized inventory matching, queue lengths, or service staff scaling.`);
  }

  // 2. High Return Anomaly
  const worstReturnCategory = categoriesReturns[0];
  if (worstReturnCategory && worstReturnCategory.returnRate > 5) {
    anomalies.push(`**High Product Returns Deficit**: The **${worstReturnCategory.category}** product segment exhibits an elevated post-purchase return rate of **${worstReturnCategory.returnRate.toFixed(1)}%**, which has leaked **${formatCurrency(worstReturnCategory.returnAmount)}** back to buyers. This return volume is significantly above industry norms and requires immediate product quality or catalog labeling audits.`);
  }

  // 3. Margin Leakage Anomaly
  const worstDiscountCategory = categoriesDiscounts[0];
  if (worstDiscountCategory && worstDiscountCategory.discountRate > 12) {
    anomalies.push(`**Markdown Dilution Vulnerability**: Gross margins in the **${worstDiscountCategory.category}** category are facing severe margin erosion, with a promotional markdown rate of **${worstDiscountCategory.discountRate.toFixed(1)}%**. High markdowns are failing to trigger proportional volume growth, signifying a risk of margin leakage without transactional upside.`);
  }

  // 4. Stockout Induced Underperformance Anomaly
  const stockoutAffectedStore = storesMissingTarget.find(s => {
    const storeRows = rows.filter(r => r.storeId === s.id);
    const regions = Array.from(new Set(storeRows.map(r => r.region)));
    const hasHighStockoutReg = regions.some(reg => {
      const regionObj = regionsStockout.find(ro => ro.region === reg);
      return regionObj && regionObj.stockoutRatio > 15;
    });
    return hasHighStockoutReg;
  });

  if (stockoutAffectedStore) {
    anomalies.push(`**Supply-Fulfillment Bottleneck**: Store **${stockoutAffectedStore.name}** is operating at a target deficit of **${formatCurrency(stockoutAffectedStore.targetSales - stockoutAffectedStore.netSales)}** (${stockoutAffectedStore.achievement.toFixed(1)}% achievement). This underperformance is directly correlated with localized supply chain disruptions, as the store resides in a region experiencing a **${regionsStockout[0]?.stockoutRatio.toFixed(1)}%** stockout risk.`);
  }

  if (anomalies.length === 0) {
    anomalies.push("**Stable Operations Baseline**: No major performance anomalies detected across the current filters. Store conversion metrics, discount ratios, and product returns conform closely to corporate benchmark profiles.");
  }

  // Calculate detailed Target Miss Explanation
  let targetMissExplanation = "";
  if (storesMissingTarget.length > 0) {
    const totalDeficitAllStores = storesMissingTarget.reduce((sum, s) => sum + (s.targetSales - s.netSales), 0);
    targetMissExplanation = `A total of **${storesMissingTarget.length}** store outlets failed to reach the 95% target achievement baseline. Collectively, this store-level performance gap represents **${formatCurrency(totalDeficitAllStores)}** in unrealized commercial revenue.\n\n`;

    storesMissingTarget.slice(0, 3).forEach((store) => {
      const storeDeficit = store.targetSales - store.netSales;
      const storeRows = rows.filter(r => r.storeId === store.id);
      const storeFootfall = storeRows.reduce((sum, r) => sum + r.footfall, 0);
      const storeTransactions = storeRows.reduce((sum, r) => sum + r.transactions, 0);
      const storeConversion = storeFootfall > 0 ? (storeTransactions / storeFootfall) * 100 : 0;
      
      let storeDriver = "This target miss is primarily driven by ";
      if (storeConversion < overallStats.conversionRate * 0.9) {
        storeDriver += `depressed transaction conversion of **${storeConversion.toFixed(2)}%** (compared to the filtered average of ${overallStats.conversionRate.toFixed(2)}%), indicating store layout friction or staffing deficits.`;
      } else {
        const storeRowsWithLowStock = storeRows.filter(r => r.inventoryStatus === "Low").length;
        const storeStockoutRatio = storeRows.length > 0 ? (storeRowsWithLowStock / storeRows.length) * 100 : 0;
        if (storeStockoutRatio > 15) {
          storeDriver += `elevated stockout levels affecting **${storeStockoutRatio.toFixed(1)}%** of item inventories, which blocked immediate purchase availability.`;
        } else {
          storeDriver += `smaller basket sizes and promotional dilution, with average transaction values failing to hit target levels.`;
        }
      }

      targetMissExplanation += `* **${store.name} (${store.id})**: Achieved only **${store.achievement.toFixed(1)}%** of its target sales of **${formatCurrency(store.targetSales)}**, generating a direct deficit of **${formatCurrency(storeDeficit)}**. ${storeDriver}\n`;
    });
  } else {
    targetMissExplanation = `All store outlets are currently performing within healthy bounds, exceeding 95% of their commercial sales targets. The collective sales target was achieved with a surplus of **${formatCurrency(Math.abs(overallStats.targetSales - overallStats.netSales))}** across all stores. Focus should shift from deficit recapture to margin optimization and defensive stock buffers.`;
  }

  return {
    bestRegion,
    worstRegion,
    bestStore,
    worstStore,
    storesMissingTarget,
    categoriesReturns,
    categoriesDiscounts,
    regionsStockout,
    weeklyTrend,
    largestOpportunity,
    recommendations,
    executiveSummary,
    trends,
    anomalies,
    targetMissExplanation
  };
}
