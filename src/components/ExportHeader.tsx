/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Download, FileDown, Image, FileText, Printer, Moon, Sun, Database, User, ShieldAlert } from "lucide-react";
import * as XLSX from "xlsx";
import { toPng, toCanvas } from "html-to-image";
import { jsPDF } from "jspdf";
import { MergedRetailRow, KPIStats } from "../types";
import { formatCurrency, formatPercent, formatInteger } from "../utils/excel";

interface ExportHeaderProps {
  filteredData: MergedRetailRow[];
  kpiStats: KPIStats;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onResetAllData: () => void;
}

export const ExportHeader: React.FC<ExportHeaderProps> = ({
  filteredData,
  kpiStats,
  isDarkMode,
  onToggleDarkMode,
  onResetAllData
}) => {
  const [exporting, setExporting] = useState<string | null>(null);

  /**
   * Action 1: Export Filtered Data as Excel Sheet (.xlsx)
   */
  const handleExportDataExcel = () => {
    try {
      setExporting("excel");
      const exportRows = filteredData.map(row => ({
        "Store ID": row.storeId,
        "Store Name": row.storeName,
        "Region": row.region,
        "City": row.city,
        "Store Format": row.storeFormat,
        "Week": row.week,
        "Date": row.dateStr,
        "Category": row.category,
        "Net Sales": row.netSales,
        "Target Sales": row.targetSales,
        "Gross Sales": row.grossSales,
        "Transactions": row.transactions,
        "Footfall": row.footfall,
        "Return Amount": row.returnAmount,
        "Discount Amount": row.discountAmount,
        "Stockout Risk": row.inventoryStatus === "Low" ? "High Risk" : row.inventoryStatus === "Medium" ? "Medium Risk" : "Low Risk"
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Filtered Retail Sales");

      // Set nice column widths
      const maxColWidths = Object.keys(exportRows[0] || {}).map(key => ({
        wch: Math.max(key.length + 2, 12)
      }));
      worksheet["!cols"] = maxColWidths;

      XLSX.writeFile(workbook, `filtered_retail_sales_${new Date().toISOString().slice(0,10)}.xlsx`);
    } catch (err) {
      console.error("Failed to export Excel:", err);
    } finally {
      setExporting(null);
    }
  };

  /**
   * Action 2: Export KPI Summary as CSV
   */
  const handleExportKPISummary = () => {
    try {
      setExporting("kpi");
      const csvLines = [
        "Retail Sales Intelligence App - KPI Summary Report",
        `Generated Date,${new Date().toISOString().split("T")[0]}`,
        `Filtered Records Count,${filteredData.length}`,
        "",
        "Business Metric,Value,Context/Formula",
        `Net Sales,${formatCurrency(kpiStats.netSales)},Net generated sales`,
        `Gross Sales,${formatCurrency(kpiStats.grossSales)},Net Sales + Discount Amount`,
        `Target Sales,${formatCurrency(kpiStats.targetSales)},Corporate sales goals`,
        `Target Achievement,${kpiStats.targetAchievement.toFixed(2)}%,(Net Sales / Target Sales) x 100`,
        `Sales Deficit,${formatCurrency(Math.max(0, kpiStats.targetSales - kpiStats.netSales))},Gap to target`,
        `Average Transaction Value,${formatCurrency(kpiStats.avgTransactionValue)},Net Sales / Transactions`,
        `Return Rate,${kpiStats.returnRate.toFixed(2)}%,(Return Amount / Net Sales) x 100`,
        `Discount Rate,${kpiStats.discountRate.toFixed(2)}%,(Discount Amount / Gross Sales) x 100`,
        `Conversion Rate,${kpiStats.conversionRate.toFixed(2)}%,(Transactions / Footfall) x 100`,
        `Stockout Threat Level,${kpiStats.stockoutLevel},Consolidated inventory status`
      ];

      const csvContent = "data:text/csv;charset=utf-8," + csvLines.map(e => e).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `kpi_summary_brief_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to export KPIs:", err);
    } finally {
      setExporting(null);
    }
  };

  /**
   * Action 3: Export Business Insights Summary as Text Brief
   */
  const handleExportInsightsBrief = () => {
    try {
      setExporting("insights");
      
      const title = "RETAIL SALES INTELLIGENCE - STRATEGIC EXECUTIVE BRIEF\n======================================================\n";
      const metadata = `Generated Date: ${new Date().toISOString().split("T")[0]}\nActive Dataset Records: ${filteredData.length}\n`;
      
      const metricsText = `\nKEY METRICS SUMMARY:\n- Net Sales: ${formatCurrency(kpiStats.netSales)}\n- Achievement of Target: ${kpiStats.targetAchievement.toFixed(1)}%\n- Conversion Rate: ${kpiStats.conversionRate.toFixed(1)}%\n- Average Transaction Value: ${formatCurrency(kpiStats.avgTransactionValue)}\n- Return Rate: ${kpiStats.returnRate.toFixed(1)}%\n- Discount Rate: ${kpiStats.discountRate.toFixed(1)}%\n- Stockout Indicator: ${kpiStats.stockoutLevel}\n`;

      const instructionNote = "\nCONFIDENTIAL BUSINESS INTEL REPORT. INTEGRATE INTO COMMERCIAL REVIEW PROCESSES.\n";

      const fileContent = title + metadata + metricsText + instructionNote;
      const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `executive_retail_brief_${new Date().toISOString().slice(0,10)}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to export insights text:", err);
    } finally {
      setExporting(null);
    }
  };

  /**
   * Action 4: Export Charts element as PNG image
   */
  const handleExportChartsPNG = async () => {
    try {
      setExporting("png");
      const deckElement = document.getElementById("charts-deck") || document.getElementById("root");
      if (!deckElement) return;

      const imageUri = await toPng(deckElement, {
        pixelRatio: 2,
        backgroundColor: isDarkMode ? "#121212" : "#ffffff",
        cacheBust: true,
      });

      const link = document.createElement("a");
      link.href = imageUri;
      link.download = `sales_charts_deck_${new Date().toISOString().slice(0,10)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to capture charts PNG:", err);
    } finally {
      setExporting(null);
    }
  };

  /**
   * Action 5: Export Full Dashboard as PDF
   */
  const handleExportDashboardPDF = async () => {
    try {
      setExporting("pdf");
      const dashboardElement = document.getElementById("dashboard-body") || document.getElementById("root");
      if (!dashboardElement) return;

      const canvas = await toCanvas(dashboardElement, {
        pixelRatio: 1.5,
        backgroundColor: isDarkMode ? "#121212" : "#F5F7FA",
        cacheBust: true,
      });

      const imgWidth = 210; // A4 standard width in mm
      const pageHeight = 295; // A4 standard height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      const doc = new jsPDF("p", "mm", "a4");
      let position = 0;

      doc.addImage(canvas.toDataURL("image/png"), "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        doc.addPage();
        doc.addImage(canvas.toDataURL("image/png"), "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      doc.save(`retail_sales_dashboard_report_${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (err) {
      console.error("Failed to export PDF:", err);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="bg-[#1F4E79] dark:bg-[#1E1E1E] text-white border-b border-[#E5E7EB] dark:border-[#2D2D2D] px-6 py-3.5 sticky top-0 z-40 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
      
      {/* Brand & Stats Header */}
      <div className="flex items-center gap-3.5 w-full sm:w-auto">
        <div className="p-2 bg-white/10 dark:bg-white/5 rounded-lg border border-white/10 font-bold text-xs tracking-wider flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-300" />
          <span className="font-extrabold text-white text-sm">Power BI</span>
        </div>
        <div className="h-6 w-px bg-white/20 hidden sm:block" />
        <div>
          <h1 className="font-bold text-base text-white tracking-tight leading-none">
            Executive Retail Sales Intelligence Dashboard
          </h1>
          <p className="text-[10px] text-slate-300/90 mt-1.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Active Model Coverage: {filteredData.length} records</span>
          </p>
        </div>
      </div>

      {/* Export & Actions Controls */}
      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
        
        {/* Toggle Theme */}
        <button
          onClick={onToggleDarkMode}
          title="Toggle Canvas Theme (Light / Dark)"
          className="p-2 text-white/80 hover:text-white hover:bg-white/10 dark:hover:bg-[#2D2D2D] rounded-lg transition-all border border-white/10 dark:border-[#2D2D2D] cursor-pointer"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-[#F9A825]" /> : <Moon className="w-4 h-4 text-emerald-300" />}
        </button>

        {/* Action 1: Filtered Excel */}
        <button
          onClick={handleExportDataExcel}
          disabled={exporting !== null}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/25 text-white border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-55"
        >
          {exporting === "excel" ? (
            <div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5 text-emerald-300" />
          )}
          <span className="hidden md:inline">Dataset XLSX</span>
        </button>

        {/* Action 2: KPI Summary */}
        <button
          onClick={handleExportKPISummary}
          disabled={exporting !== null}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/25 text-white border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-55"
        >
          {exporting === "kpi" ? (
            <div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <FileDown className="w-3.5 h-3.5 text-emerald-300" />
          )}
          <span className="hidden md:inline">KPIs CSV</span>
        </button>

        {/* Action 3: Insights text */}
        <button
          onClick={handleExportInsightsBrief}
          disabled={exporting !== null}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/25 text-white border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-55"
        >
          {exporting === "insights" ? (
            <div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <FileText className="w-3.5 h-3.5 text-emerald-300" />
          )}
          <span className="hidden md:inline">Report TXT</span>
        </button>

        {/* Action 4: Charts PNG */}
        <button
          onClick={handleExportChartsPNG}
          disabled={exporting !== null}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/25 text-white border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-55"
        >
          {exporting === "png" ? (
            <div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Image className="w-3.5 h-3.5 text-emerald-300" />
          )}
          <span className="hidden md:inline">Charts PNG</span>
        </button>

        {/* Action 5: Dashboard PDF */}
        <button
          onClick={handleExportDashboardPDF}
          disabled={exporting !== null}
          className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[#2E7D32] hover:bg-[#1E5A22] text-white flex items-center gap-1.5 shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-55"
        >
          {exporting === "pdf" ? (
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Printer className="w-3.5 h-3.5" />
          )}
          <span>PDF Report</span>
        </button>

        {/* Reset / Change Datasets */}
        <button
          onClick={onResetAllData}
          className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[#C62828] hover:bg-[#9E1B1B] text-white transition-all cursor-pointer"
        >
          Reset Dataset
        </button>

        {/* Circular Executive Profile Badge */}
        <div className="h-8 w-px bg-white/20 ml-1 hidden sm:block" />
        <div 
          className="w-8 h-8 rounded-full bg-white/10 dark:bg-white/5 border border-white/20 text-[#2E7D32] dark:text-emerald-400 bg-emerald-50 flex items-center justify-center font-bold text-xs select-none shadow-inner"
          title="Ravi Prasad <ravi.prasad@tigeranalytics.com>"
        >
          RP
        </div>

      </div>
    </div>
  );
};
