/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { AnalyticsSummary } from "../utils/insights";
import { Sparkles, Brain, AlertTriangle, Lightbulb, TrendingUp, Store, ChevronRight, CheckCircle, Flame, Target, DollarSign } from "lucide-react";
import { formatCurrency, formatPercent } from "../utils/excel";
import { FilterState, KPIStats } from "../types";

interface InsightsPanelProps {
  summary: AnalyticsSummary;
  overallStats: KPIStats;
  filterState: FilterState;
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({ summary, overallStats, filterState }) => {
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"executive" | "trends" | "anomalies" | "targets">("executive");

  const handleGenerateAIReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const kpis = {
        netSalesFormatted: formatCurrency(overallStats.netSales),
        targetSalesFormatted: formatCurrency(overallStats.targetSales),
        targetAchievement: overallStats.targetAchievement,
        totalTransactions: overallStats.avgTransactionValue > 0 ? Math.round(overallStats.netSales / overallStats.avgTransactionValue) : 0,
        totalFootfall: Math.round((overallStats.avgTransactionValue > 0 ? overallStats.netSales / overallStats.avgTransactionValue : 0) / (overallStats.conversionRate / 100)),
        conversionRate: overallStats.conversionRate,
        avgTransactionValueFormatted: formatCurrency(overallStats.avgTransactionValue),
        returnRate: overallStats.returnRate,
        returnAmountFormatted: formatCurrency(overallStats.netSales * (overallStats.returnRate / 100)),
        discountRate: overallStats.discountRate,
        discountAmountFormatted: formatCurrency(overallStats.grossSales * (overallStats.discountRate / 100)),
        deficitFormatted: formatCurrency(Math.max(0, overallStats.targetSales - overallStats.netSales)),
        stockoutLevel: overallStats.stockoutLevel
      };

      const key = process.env.GEMINI_API_KEY;
      if (!key) {
        // Return beautiful, realistic, fallback content if Gemini key isn't provided yet
        const offlineReport = `## ⚠️ Offline BI Insights Mode

The **GEMINI_API_KEY** was not found in the client build environment. Displaying advanced analytical insights calculated locally from your active dataset:

### 📈 Current Performance & Momentum
- **Net Sales:** ${kpis.netSalesFormatted}
- **Target Achievement:** ${kpis.targetAchievement.toFixed(1)}% (Deficit of ${kpis.deficitFormatted})
- **Footfall & Conversions:** ${kpis.conversionRate.toFixed(1)}% conversion on a total footfall of ${kpis.totalFootfall}.
- **Value Efficiency:** Average Transaction Value is **${kpis.avgTransactionValueFormatted}** with promotional discount dilution at **${kpis.discountRate.toFixed(1)}%**.

### 🔍 Priority Opportunities & Bottlenecks
1. **Underperforming Store Focus:** The lowest performing store is **${summary.bestStore && summary.worstStore ? summary.worstStore.name : "N/A"}** with sales of **${summary.worstStore ? formatCurrency(summary.worstStore.sales) : "$0"}**. Immediate operational reviews are advised.
2. **Sales Deficit Capture:** Meeting targets at stores missing their goals represents an immediate recapture opportunity of **${summary.largestOpportunity ? (summary.largestOpportunity.includes("$") ? summary.largestOpportunity.split("of ").pop() || "$0" : "$0") : "$0"}**.
3. **Product Return Mitigation:** Categories with high return volumes (like "${summary.categoriesReturns && summary.categoriesReturns[0] ? summary.categoriesReturns[0].category : "Apparel"}") should undergo qualitative audit reviews immediately to limit inventory write-downs.

*Configure your Google AI Studio API key to unlock complete strategic recommendations and real-time market forecasting.*`;

        // Simulate a slight natural loading delay to mimic consultant thinking process
        await new Promise((resolve) => setTimeout(resolve, 1200));
        setAiReport(offlineReport);
        return;
      }

      // We have an API key! Let's instantiate and query Google GenAI client-side.
      // SECURITY WARNING: Exposing GEMINI_API_KEY in client bundle is only acceptable for client-side-only apps at user's request.
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          }
        }
      });

      const prompt = `
You are a senior Retail Business Intelligence consultant. Generate an extremely polished, professional, and strategic Retail Sales Performance report based on the following real-time aggregated retail data:

KPI Metrics:
- Net Sales: ${kpis.netSalesFormatted}
- Target Sales: ${kpis.targetSalesFormatted}
- Target Achievement: ${kpis.targetAchievement.toFixed(1)}%
- Total Transactions: ${kpis.totalTransactions}
- Total Footfall: ${kpis.totalFootfall}
- Conversion Rate: ${kpis.conversionRate.toFixed(1)}%
- Average Transaction Value: ${kpis.avgTransactionValueFormatted}
- Return Rate: ${kpis.returnRate.toFixed(1)}% (Return Amount: ${kpis.returnAmountFormatted})
- Discount Rate: ${kpis.discountRate.toFixed(1)}% (Discount Amount: ${kpis.discountAmountFormatted})
- Overall Stockout Risk Status: ${kpis.stockoutLevel}

Key Store & Region Highlights:
- Best Performing Region: ${summary.bestRegion.name} (Sales: $${summary.bestRegion.sales.toLocaleString()})
- Worst Performing Region: ${summary.worstRegion.name} (Sales: $${summary.worstRegion.sales.toLocaleString()})
- Best Performing Store: ${summary.bestStore.name} (Sales: $${summary.bestStore.sales.toLocaleString()})
- Worst Performing Store: ${summary.worstStore.name} (Sales: $${summary.worstStore.sales.toLocaleString()})
- Store Target Deficits: ${summary.storesMissingTarget.slice(0, 3).map((s: any) => `${s.name} is only at ${s.achievement.toFixed(1)}% achievement (Sales: $${s.netSales.toLocaleString()} vs Target: $${s.targetSales.toLocaleString()})`).join(", ")}
- Top Category by Returns: ${summary.categoriesReturns[0]?.category || "N/A"} (Returns: $${summary.categoriesReturns[0]?.returnAmount.toLocaleString()}, Rate: ${summary.categoriesReturns[0]?.returnRate.toFixed(1)}%)
- Top Category by Discounts: ${summary.categoriesDiscounts[0]?.category || "N/A"} (Discount Rate: ${summary.categoriesDiscounts[0]?.discountRate.toFixed(1)}%)
- Highest Stockout Risk Region: ${summary.regionsStockout[0]?.region || "N/A"} (Ratio: ${summary.regionsStockout[0]?.stockoutRatio.toFixed(1)}% in-stock deficit)

Filters currently active:
- Selected Weeks: ${filterState.weeks.join(", ") || "All Weeks"}
- Selected Regions: ${filterState.regions.join(", ") || "All Regions"}
- Selected Stores: ${filterState.stores.join(", ") || "All Stores"}
- Selected Cities: ${filterState.cities.join(", ") || "All Cities"}
- Selected Store Formats: ${filterState.storeFormats.join(", ") || "All Formats"}
- Selected Categories: ${filterState.categories.join(", ") || "All Categories"}

Generate a detailed report formatted in clean Markdown. The report MUST include the following clear sections with standard bullet points:
1. **Executive Performance Assessment**: Contextualize the target achievement of ${kpis.targetAchievement.toFixed(1)}% and sales momentum. Highlight region strengths and conversion health.
2. **Operational Vulnerabilities & Deficits**: Specifically address stores missing their targets (especially ${summary.worstStore.name}) and the stockout risk of ${summary.regionsStockout[0]?.region || "None"}.
3. **Margin Dilution & Quality Deficits**: Analyze categories with highest return amounts and promotional discount levels. Give concrete feedback on Apparel returns or Electronics discounting.
4. **Strategic Actions & Immediate Recommendations**: Provide 4 highly actionable, clear, specific retail management recommendations to immediately boost conversion, optimize regional logistics, or recapture sales deficit.

Tone: Professional, analytical, executive-ready, highly competent. Avoid any clinical AI preamble or greeting, jump straight into the report.
`;

      const result = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      setAiReport(result.text || "Failed to generate report from Gemini API.");
    } catch (err: any) {
      setError(err.message || "An unknown error occurred during report generation.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Safe custom Markdown parsing function to render lists, subheadings, and bold elements elegantly in React 19.
   */
  const renderMarkdown = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      let trimmed = line.trim();

      // Headers
      if (trimmed.startsWith("### ")) {
        return (
          <h4 key={idx} className="text-sm font-bold text-[#1F2937] dark:text-white mt-4 mb-2 flex items-center gap-2">
            <span className="w-1 h-3 bg-[#1F4E79] rounded-sm inline-block"></span>
            {trimmed.replace("### ", "")}
          </h4>
        );
      }
      if (trimmed.startsWith("## ")) {
        return (
          <h3 key={idx} className="text-base font-bold text-[#1F4E79] dark:text-[#A0AEC0] mt-5 mb-2.5 border-b border-[#E5E7EB] dark:border-[#2D2D2D] pb-1">
            {trimmed.replace("## ", "")}
          </h3>
        );
      }
      if (trimmed.startsWith("# ")) {
        return (
          <h2 key={idx} className="text-lg font-extrabold text-[#1F2937] dark:text-white mt-6 mb-3">
            {trimmed.replace("# ", "")}
          </h2>
        );
      }

      // Bullets
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        const content = trimmed.substring(2);
        return (
          <li key={idx} className="ml-4 list-disc text-xs text-[#6B7280] dark:text-[#A0AEC0] mb-1.5 leading-relaxed">
            {parseBoldText(content)}
          </li>
        );
      }

      // Ordered list items
      if (/^\d+\.\s/.test(trimmed)) {
        const content = trimmed.replace(/^\d+\.\s/, "");
        return (
          <li key={idx} className="ml-4 list-decimal text-xs text-[#6B7280] dark:text-[#A0AEC0] mb-1.5 leading-relaxed">
            {parseBoldText(content)}
          </li>
        );
      }

      // Empty line
      if (trimmed === "") {
        return <div key={idx} className="h-1.5"></div>;
      }

      // Regular paragraph
      return (
        <p key={idx} className="text-xs text-[#6B7280] dark:text-[#A0AEC0] mb-2 leading-relaxed">
          {parseBoldText(trimmed)}
        </p>
      );
    });
  };

  /**
   * Parse double asterisks (**) for bold texts
   */
  const parseBoldText = (text: string) => {
    const parts = text.split(/\*\*([\s\S]*?)\*\*/g);
    if (parts.length === 1) return text;
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="font-bold text-[#1F2937] dark:text-[#FFFFFF]">{part}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      
      {/* LOCAL DYNAMIC HEURISTICS SUMMARY */}
      <div className="xl:col-span-2 bg-white dark:bg-[#1E1E1E] border border-[#E5E7EB] dark:border-[#2D2D2D] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.01)] flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 border-b border-[#E5E7EB] dark:border-[#2D2D2D] pb-3.5">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-[#1F4E79] dark:text-[#A0AEC0]" />
              <h3 className="font-bold text-sm tracking-tight text-[#1F2937] dark:text-white">
                Executive Sales Performance Desk
              </h3>
            </div>
            {/* Custom Interactive Tab Bar */}
            <div className="flex flex-wrap gap-1 bg-[#F3F4F6] dark:bg-zinc-800 p-0.5 rounded-lg border border-[#E5E7EB] dark:border-[#2D2D2D]/80">
              <button
                onClick={() => setActiveTab("executive")}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "executive"
                    ? "bg-white dark:bg-[#2D2D2D] text-[#1F4E79] dark:text-white shadow-xs"
                    : "text-[#6B7280] dark:text-[#A0AEC0] hover:text-[#1F2937] dark:hover:text-white"
                }`}
              >
                <Brain className="w-3.5 h-3.5" />
                <span>Executive Audit</span>
              </button>
              <button
                onClick={() => setActiveTab("trends")}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "trends"
                    ? "bg-white dark:bg-[#2D2D2D] text-[#1F4E79] dark:text-white shadow-xs"
                    : "text-[#6B7280] dark:text-[#A0AEC0] hover:text-[#1F2937] dark:hover:text-white"
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Trend Patterns</span>
              </button>
              <button
                onClick={() => setActiveTab("anomalies")}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "anomalies"
                    ? "bg-white dark:bg-[#2D2D2D] text-[#1F4E79] dark:text-white shadow-xs"
                    : "text-[#6B7280] dark:text-[#A0AEC0] hover:text-[#1F2937] dark:hover:text-white"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Anomalies</span>
              </button>
              <button
                onClick={() => setActiveTab("targets")}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "targets"
                    ? "bg-white dark:bg-[#2D2D2D] text-[#1F4E79] dark:text-white shadow-xs"
                    : "text-[#6B7280] dark:text-[#A0AEC0] hover:text-[#1F2937] dark:hover:text-white"
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                <span>Target Deficits</span>
              </button>
            </div>
          </div>

          {/* TAB CONTENT PANEL */}
          <div className="min-h-[250px]">
            {activeTab === "executive" && (
              <div className="space-y-5">
                {/* 4 Cards Subgrid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Card: Regional Performance */}
                  <div className="p-4 bg-[#F5F7FA] dark:bg-[#2D2D2D]/30 rounded-lg border border-[#E5E7EB]/70 dark:border-[#2D2D2D]/60 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-[#1F4E79]" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] dark:text-[#A0AEC0]">Regional Performance</span>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#1F4E79]/10 text-[#1F4E79] font-bold uppercase tracking-wide">High</span>
                      </div>
                      <div className="space-y-1.5 text-xs text-[#6B7280] dark:text-[#A0AEC0]">
                        <div className="flex justify-between gap-2">
                          <span>Best Performing Region:</span>
                          <strong className="text-[#1F2937] dark:text-[#FFFFFF] font-semibold">{summary.bestRegion.name} ({formatCurrency(summary.bestRegion.sales)})</strong>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span>Worst Performing Region:</span>
                          <strong className="text-[#1F2937] dark:text-[#FFFFFF] font-semibold">{summary.worstRegion.name} ({formatCurrency(summary.worstRegion.sales)})</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card: Top & Bottom Outlets */}
                  <div className="p-4 bg-[#F5F7FA] dark:bg-[#2D2D2D]/30 rounded-lg border border-[#E5E7EB]/70 dark:border-[#2D2D2D]/60 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2">
                          <Store className="w-4 h-4 text-[#3949AB]" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] dark:text-[#A0AEC0]">Store Outlet Outliers</span>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#3949AB]/10 text-[#3949AB] font-bold uppercase tracking-wide">Medium</span>
                      </div>
                      <div className="space-y-1.5 text-xs text-[#6B7280] dark:text-[#A0AEC0]">
                        <div className="flex justify-between gap-2">
                          <span>Best Performing Store:</span>
                          <strong className="text-[#1F2937] dark:text-[#FFFFFF] font-semibold truncate max-w-[130px]" title={summary.bestStore.name}>{summary.bestStore.name}</strong>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span>Worst Performing Store:</span>
                          <strong className="text-[#1F2937] dark:text-[#FFFFFF] font-semibold truncate max-w-[130px]" title={summary.worstStore.name}>{summary.worstStore.name}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card: Quality & Returns */}
                  <div className="p-4 bg-[#F5F7FA] dark:bg-[#2D2D2D]/30 rounded-lg border border-[#E5E7EB]/70 dark:border-[#2D2D2D]/60 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-[#C62828]" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] dark:text-[#A0AEC0]">Quality & Margin Leakage</span>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#C62828]/10 text-[#C62828] font-bold uppercase tracking-wide">Critical</span>
                      </div>
                      <div className="space-y-1.5 text-xs text-[#6B7280] dark:text-[#A0AEC0]">
                        <div className="flex justify-between gap-2">
                          <span>Highest Return Category:</span>
                          <strong className="text-[#1F2937] dark:text-[#FFFFFF] font-semibold">{summary.categoriesReturns[0]?.category || "None"} ({summary.categoriesReturns[0]?.returnRate.toFixed(1)}%)</strong>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span>Highest Discount Category:</span>
                          <strong className="text-[#1F2937] dark:text-[#FFFFFF] font-semibold">{summary.categoriesDiscounts[0]?.category || "None"} ({summary.categoriesDiscounts[0]?.discountRate.toFixed(1)}%)</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card: Inventory Stockout Risks */}
                  <div className="p-4 bg-[#F5F7FA] dark:bg-[#2D2D2D]/30 rounded-lg border border-[#E5E7EB]/70 dark:border-[#2D2D2D]/60 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2">
                          <Flame className="w-4 h-4 text-[#F9A825]" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] dark:text-[#A0AEC0]">Operational Risks</span>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#F9A825]/10 text-[#F9A825] font-bold uppercase tracking-wide">Critical</span>
                      </div>
                      <div className="space-y-1.5 text-xs text-[#6B7280] dark:text-[#A0AEC0]">
                        <div className="flex justify-between gap-2">
                          <span>Highest Stockout Region:</span>
                          <strong className="text-[#1F2937] dark:text-[#FFFFFF] font-semibold">{summary.regionsStockout[0]?.region || "None"} ({summary.regionsStockout[0]?.stockoutRatio.toFixed(1)}% risk)</strong>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span>Stores Missing Target:</span>
                          <strong className="text-[#1F2937] dark:text-[#FFFFFF] font-semibold text-[#C62828] dark:text-red-400">{summary.storesMissingTarget.length} outlets</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Executive Consulting Paragraphs */}
                <div className="p-4 bg-slate-50 dark:bg-black/10 border border-[#E5E7EB]/70 dark:border-[#2D2D2D]/60 rounded-lg">
                  <h4 className="text-xs font-bold text-[#1F4E79] dark:text-white uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5" />
                    <span>Executive Performance Audit Statement</span>
                  </h4>
                  <div className="space-y-3.5 text-xs text-[#6B7280] dark:text-[#A0AEC0] leading-relaxed">
                    {renderMarkdown(summary.executiveSummary)}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "trends" && (
              <div className="space-y-3.5 animate-fadeIn">
                <div className="p-4 bg-[#F5F7FA] dark:bg-zinc-800/10 rounded-lg border border-[#E5E7EB] dark:border-[#2D2D2D] mb-2">
                  <h4 className="text-xs font-bold text-[#1F2937] dark:text-white uppercase tracking-wider mb-1">
                    Macro Commercial & Operational Trends
                  </h4>
                  <p className="text-[11px] text-[#6B7280] dark:text-[#A0AEC0]">
                    Longitudinal trajectory analysis extracted from current segment filters.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {summary.trends.map((trend, i) => (
                    <div key={i} className="p-3.5 bg-white dark:bg-[#1E1E1E] rounded-lg border border-[#E5E7EB]/70 dark:border-[#2D2D2D]/60 text-xs flex gap-3 items-start shadow-2xs hover:border-[#1F4E79]/50 dark:hover:border-zinc-500 transition-colors">
                      <div className="p-1.5 bg-[#1F4E79]/10 text-[#1F4E79] dark:text-[#A0AEC0] rounded-md shrink-0">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div className="text-[#6B7280] dark:text-[#A0AEC0] leading-relaxed mt-0.5">
                        {renderMarkdown(trend)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "anomalies" && (
              <div className="space-y-3.5 animate-fadeIn">
                <div className="p-4 bg-[#C62828]/5 dark:bg-red-900/10 rounded-lg border border-red-200/50 dark:border-red-900/20 mb-2">
                  <h4 className="text-xs font-bold text-[#C62828] dark:text-red-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Operational & Margin Anomalies Log</span>
                  </h4>
                  <p className="text-[11px] text-[#6B7280] dark:text-[#A0AEC0]">
                    Automated outlier detection flagging efficiency deficits, promotional dilution, or return leakage.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {summary.anomalies.map((anomaly, i) => {
                    const isStable = anomaly.startsWith("**Stable");
                    return (
                      <div
                        key={i}
                        className={`p-3.5 rounded-lg border text-xs flex gap-3 items-start shadow-2xs transition-colors ${
                          isStable
                            ? "bg-white dark:bg-[#1E1E1E] border-[#E5E7EB]/70 dark:border-[#2D2D2D]/60"
                            : "bg-[#C62828]/5 dark:bg-[#C62828]/5 border-red-100 dark:border-red-900/30 hover:border-red-300 dark:hover:border-red-800"
                        }`}
                      >
                        <div
                          className={`p-1.5 rounded-md shrink-0 ${
                            isStable
                              ? "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400"
                              : "bg-[#C62828]/10 text-[#C62828]"
                          }`}
                        >
                          {isStable ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                        </div>
                        <div className="text-[#6B7280] dark:text-[#A0AEC0] leading-relaxed mt-0.5">
                          {renderMarkdown(anomaly)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === "targets" && (
              <div className="space-y-3.5 animate-fadeIn">
                <div className="p-4 bg-[#1F4E79]/5 dark:bg-blue-950/10 rounded-lg border border-[#1F4E79]/25 dark:border-blue-900/20 mb-2">
                  <h4 className="text-xs font-bold text-[#1F4E79] dark:text-blue-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Target className="w-4 h-4" />
                    <span>Target Deficit & Recapture Audit</span>
                  </h4>
                  <p className="text-[11px] text-[#6B7280] dark:text-[#A0AEC0]">
                    Diagnostics on specific outlets trailing targets by more than 5%.
                  </p>
                </div>
                <div className="p-4 bg-white dark:bg-[#1E1E1E] rounded-lg border border-[#E5E7EB] dark:border-[#2D2D2D] text-xs space-y-4">
                  <div className="text-[#6B7280] dark:text-[#A0AEC0] leading-relaxed">
                    {renderMarkdown(summary.targetMissExplanation)}
                  </div>
                  
                  {summary.storesMissingTarget.length > 0 && (
                    <div className="space-y-3 pt-2.5 border-t border-[#E5E7EB] dark:border-[#2D2D2D]">
                      <h5 className="font-bold text-[10px] text-[#1F2937] dark:text-white uppercase tracking-wider">
                        Outlets Performance Tracking & Goal Distance
                      </h5>
                      <div className="space-y-2.5">
                        {summary.storesMissingTarget.slice(0, 4).map((store, i) => (
                          <div key={i} className="space-y-1">
                            <div className="flex justify-between text-[11px] font-semibold text-[#1F2937] dark:text-white">
                              <span>{store.name}</span>
                              <span className="font-mono">{store.achievement.toFixed(1)}% achieved</span>
                            </div>
                            <div className="w-full bg-[#E5E7EB] dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-[#C62828] h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, store.achievement)}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[10px] text-[#6B7280] dark:text-[#A0AEC0]">
                              <span>Sales: {formatCurrency(store.netSales)}</span>
                              <span>Target: {formatCurrency(store.targetSales)} (Deficit: {formatCurrency(store.targetSales - store.netSales)})</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Dynamic Opportunity Statement */}
          <div className="mt-5 p-4 bg-[#2E7D32]/5 dark:bg-[#2E7D32]/10 border border-[#2E7D32]/20 rounded-lg flex items-start gap-3">
            <Lightbulb className="w-4.5 h-4.5 text-[#2E7D32] shrink-0 mt-0.5" />
            <div>
              <h5 className="text-[10px] font-bold uppercase tracking-wider text-[#2E7D32] dark:text-emerald-400 mb-1 flex items-center gap-1.5">
                <span>Top Recapture Opportunity</span>
                <span className="text-[8px] bg-[#2E7D32]/15 px-1 rounded">Strategic Action</span>
              </h5>
              <p className="text-xs text-[#1F2937] dark:text-[#A0AEC0] leading-relaxed font-medium">
                {summary.largestOpportunity}
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Recommendations List */}
        <div className="mt-5 border-t border-[#E5E7EB] dark:border-[#2D2D2D] pt-4">
          <h4 className="font-bold text-xs text-[#1F2937] dark:text-white mb-3.5 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-[#2E7D32]" />
            <span>Targeted Commercial Tactics & Recommendations</span>
          </h4>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5">
            {summary.recommendations.map((rec, i) => (
              <li key={i} className="flex gap-2 text-xs text-[#6B7280] dark:text-[#A0AEC0] leading-normal items-start">
                <ChevronRight className="w-3.5 h-3.5 text-[#1F4E79] shrink-0 mt-0.5" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* AI STRATEGIC CONSULTANT ADVISOR PANEL */}
      <div className="bg-gradient-to-br from-[#1F4E79]/5 to-[#3949AB]/5 dark:from-[#1E1E1E] dark:to-[#1E1E1E] border border-[#E5E7EB] dark:border-[#2D2D2D] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.01)] flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4 border-b border-[#E5E7EB]/50 dark:border-[#2D2D2D]/60 pb-3">
            <Sparkles className="w-4.5 h-4.5 text-[#1F4E79] dark:text-emerald-400" />
            <h3 className="font-bold text-sm tracking-tight text-[#1F2937] dark:text-white">
              AI Strategic Consulting Advisor
            </h3>
          </div>
          <p className="text-xs text-[#6B7280] dark:text-[#A0AEC0] leading-relaxed mb-4">
            Generate an executive consulting analysis using Google Gemini. Our models cross-examine target achievements, return leakage, and regional stockout distributions to draft diagnostic actions.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-[#C62828]/10 border border-[#C62828]/20 rounded-lg text-xs text-[#C62828] dark:text-red-400">
              {error}
            </div>
          )}

          {aiReport && (
            <div className="max-h-80 overflow-y-auto bg-white dark:bg-black/20 border border-[#E5E7EB] dark:border-[#2D2D2D] p-4 rounded-lg shadow-inner scrollbar-thin scrollbar-thumb-slate-200">
              <div className="text-left font-sans prose dark:prose-invert">
                {renderMarkdown(aiReport)}
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 pt-3.5 border-t border-[#E5E7EB] dark:border-[#2D2D2D]">
          <button
            onClick={handleGenerateAIReport}
            disabled={loading}
            className="w-full py-2.5 bg-[#1F4E79] hover:bg-[#3949AB] disabled:bg-[#1F4E79]/50 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Formulating Advisor Insights...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>{aiReport ? "Re-Generate Strategic Report" : "Generate Strategic AI Report"}</span>
              </>
            )}
          </button>
        </div>
      </div>

    </div>
  );
};
