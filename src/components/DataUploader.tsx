/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Upload, FileText, CheckCircle2, AlertTriangle, Download, Database, Check, RefreshCw } from "lucide-react";
import { parseExcelFile, validateExcelSheet, SALES_REQUIRED_COLS, STORE_REQUIRED_COLS, generateSampleFiles, FileValidationReport } from "../utils/excel";

interface DataUploaderProps {
  onDataLoaded: (salesRows: any[], storeRows: any[]) => void;
  onDemoLoaded: () => void;
  isDataActive: boolean;
}

export const DataUploader: React.FC<DataUploaderProps> = ({
  onDataLoaded,
  onDemoLoaded,
  isDataActive
}) => {
  const [salesFile, setSalesFile] = useState<{ name: string; size: number } | null>(null);
  const [storeFile, setStoreFile] = useState<{ name: string; size: number } | null>(null);
  const [salesData, setSalesData] = useState<any[] | null>(null);
  const [storeData, setStoreData] = useState<any[] | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationReport, setValidationReport] = useState<FileValidationReport | null>(null);
  const [dragActive, setDragActive] = useState<"sales" | "store" | null>(null);

  // Download template files
  const { salesUrl, storeUrl } = generateSampleFiles();

  const handleDrag = (e: React.DragEvent, type: "sales" | "store") => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(type);
    } else if (e.type === "dragleave") {
      setDragActive(null);
    }
  };

  const processFile = async (file: File, type: "sales" | "store") => {
    setLoading(true);
    setError(null);
    setValidationReport(null);
    try {
      if (!file.name.endsWith(".xlsx")) {
        throw new Error("Invalid format. Please upload standard Excel sheets strictly in .xlsx format.");
      }

      const { headers, rows } = await parseExcelFile(file);
      const required = type === "sales" ? SALES_REQUIRED_COLS : STORE_REQUIRED_COLS;
      
      const report = validateExcelSheet(file.name, headers, rows, required);
      setValidationReport(report);

      if (!report.isValid) {
        throw new Error(`The file "${file.name}" failed mandatory validation checks. Please correct the schema issues below.`);
      }

      const dataToUse = report.correctedRows || rows;

      if (type === "sales") {
        setSalesFile({ name: file.name, size: file.size });
        setSalesData(dataToUse);
        const storeToUse = storeData || [];
        onDataLoaded(dataToUse, storeToUse);
      } else {
        setStoreFile({ name: file.name, size: file.size });
        setStoreData(dataToUse);
        const salesToUse = salesData || [];
        onDataLoaded(salesToUse, dataToUse);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setDragActive(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, type: "sales" | "store") => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0], type);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: "sales" | "store") => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0], type);
    }
  };

  const handleResetUploader = () => {
    setSalesFile(null);
    setStoreFile(null);
    setSalesData(null);
    setStoreData(null);
    setError(null);
    setValidationReport(null);
    onDataLoaded([], []);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            Connect Retail Sales Datasets
          </h2>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-2 max-w-xl mx-auto">
            Upload store masters and weekly transaction data to merge, process KPIs, and dynamically model sales intelligence.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl flex items-start gap-3 text-left">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-rose-700 dark:text-rose-400">
                Upload & Integrity Blocked
              </p>
              <p className="text-xs text-rose-600 dark:text-rose-400">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Dynamic Validation Report UI */}
        {validationReport && (
          <div className={`mb-6 p-5 border rounded-xl text-left space-y-4 transition-all ${
            validationReport.isValid
              ? "bg-emerald-50/10 dark:bg-emerald-950/5 border-emerald-200/50 dark:border-emerald-900/20"
              : "bg-amber-50/60 dark:bg-amber-950/10 border-amber-200/50 dark:border-amber-900/30"
          }`}>
            <div className={`flex items-center gap-2 font-bold text-sm ${
              validationReport.isValid ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"
            }`}>
              {validationReport.isValid ? (
                <Check className="w-5 h-5 text-emerald-500 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              )}
              <span>Spreadsheet Validation Audit Logs: {validationReport.fileName} {validationReport.isValid && " (All Issues Auto-Resolved! ✨)"}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-2xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${validationReport.fileTypeOk ? "bg-emerald-500" : "bg-rose-500"}`} />
                <span>File Extension: {validationReport.fileTypeOk ? ".xlsx Verified" : "Not .xlsx"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${validationReport.missingColumns.length === 0 ? "bg-emerald-500" : "bg-rose-500"}`} />
                <span>Columns Matching: {validationReport.missingColumns.length === 0 ? "Columns Perfect" : `${validationReport.missingColumns.length} Missing`}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${validationReport.duplicateColumns.length === 0 ? "bg-emerald-500" : "bg-amber-500"}`} />
                <span>Duplicate Columns: {validationReport.duplicateColumns.length === 0 ? "None" : `${validationReport.duplicateColumns.length} Found`}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${validationReport.missingStoreIdsCount === 0 ? "bg-emerald-500" : "bg-rose-500"}`} />
                <span>Blank Store IDs: {validationReport.missingStoreIdsCount === 0 ? "None" : `${validationReport.missingStoreIdsCount} Found`}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${validationReport.blankRequiredValuesCount === 0 ? "bg-emerald-500" : "bg-amber-500"}`} />
                <span>Blank Cell Check: {validationReport.blankRequiredValuesCount === 0 ? "All Fields Filled" : `${validationReport.blankRequiredValuesCount} Blanks Auto-Resolved`}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${validationReport.duplicateRowsCount === 0 ? "bg-emerald-500" : "bg-amber-500"}`} />
                <span>Row Redundancy: {validationReport.duplicateRowsCount === 0 ? "Unique Dataset" : `${validationReport.duplicateRowsCount} Duplicates`}</span>
              </div>
            </div>

            {/* Smart Self-Correction & Auto-Remediation Logs Section */}
            {validationReport.remediations && validationReport.remediations.length > 0 && (
              <div className="p-3.5 bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/15 dark:border-emerald-900/30 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                  <span className="inline-flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 rounded-full w-4 h-4 text-3xs font-bold font-mono">i</span>
                  <span>Smart Auto-Remediation Active ({validationReport.remediations.length} corrections applied)</span>
                </div>
                <p className="text-2xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  The application has dynamically corrected minor formatting issues to prevent chart calculation crashes. The parsed data is fully safe to use.
                </p>
                <div className="max-h-40 overflow-y-auto space-y-1.5 border border-slate-100 dark:border-slate-800/60 rounded-lg p-2 bg-white/40 dark:bg-slate-950/40">
                  {validationReport.remediations.map((rem, i) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between text-2xs gap-1 border-b border-slate-100/40 dark:border-slate-800/30 pb-1 last:border-0 last:pb-0">
                      <div className="font-mono text-slate-600 dark:text-slate-400">
                        <span className="font-bold text-slate-800 dark:text-slate-300">Row {rem.row}:</span>{" "}
                        <span className="px-1 py-0.5 bg-slate-100/60 dark:bg-slate-800/60 rounded font-semibold text-slate-500 dark:text-slate-400">{rem.col}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="text-slate-400 text-3xs line-through">"{rem.original}"</span>
                        <span className="text-emerald-500 font-bold">➔</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30 px-1 rounded">"{rem.corrected}"</span>
                        <span className="text-3xs text-slate-400 italic">({rem.reason})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {validationReport.missingColumns.length > 0 && (
              <div className="p-3 bg-white dark:bg-slate-950 border border-amber-200/40 rounded-lg">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Missing Columns Highlighted:</p>
                <div className="flex flex-wrap gap-1.5">
                  {validationReport.missingColumns.map((col, i) => (
                    <span key={i} className="text-2xs font-mono font-bold px-1.5 py-0.5 bg-rose-50 text-rose-600 rounded border border-rose-100">
                      {col}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {validationReport.invalidDataTypes.length > 0 && !validationReport.isValid && (
              <div className="p-3 bg-white dark:bg-slate-950 border border-amber-200/40 rounded-lg">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Data Type Mismatches:</p>
                <ul className="list-disc pl-4 space-y-1 text-2xs text-slate-600 dark:text-slate-400 font-mono">
                  {validationReport.invalidDataTypes.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="p-3 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300 rounded-lg text-xs leading-relaxed border border-emerald-100 dark:border-emerald-950">
              <span className="font-bold">💡 Resolving validation errors:</span> Download our official pre-structured template files below. Copy your business rows into the template columns, matching the exact spelling and casing, and re-upload. Keep numbers clean without currency symbols or commas.
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Section 1: Weekly Sales Upload */}
          <div
            className={`border-2 border-dashed rounded-2xl p-6 transition-all duration-200 relative flex flex-col items-center justify-center text-center h-64 ${
              dragActive === "sales"
                ? "border-emerald-500 bg-emerald-50/10"
                : salesFile
                ? "border-emerald-200 bg-emerald-50/5 dark:border-emerald-900/20 dark:bg-emerald-950/5"
                : "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700"
            }`}
            onDragEnter={(e) => handleDrag(e, "sales")}
            onDragLeave={(e) => handleDrag(e, "sales")}
            onDragOver={(e) => handleDrag(e, "sales")}
            onDrop={(e) => handleDrop(e, "sales")}
          >
            {salesFile ? (
              <div className="flex flex-col items-center gap-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-2 animate-bounce" />
                <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm break-all max-w-[200px]">
                  {salesFile.name}
                </span>
                <span className="text-xs text-slate-400">
                  {(salesFile.size / 1024).toFixed(1)} KB
                </span>
                <button
                  onClick={() => {
                    setSalesFile(null);
                    setSalesData(null);
                    onDataLoaded([], storeData || []);
                  }}
                  className="mt-2 text-xs text-rose-500 hover:underline cursor-pointer"
                >
                  Remove File
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                <div>
                  <label className="cursor-pointer font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                    Browse Weekly Sales
                    <input
                      type="file"
                      accept=".xlsx"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, "sales")}
                    />
                  </label>
                  <p className="text-xs text-slate-400 mt-1">or drag & drop spreadsheet</p>
                </div>
                <div className="mt-4 flex flex-col items-center">
                  <span className="text-2xs font-bold tracking-wider text-slate-400 uppercase bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md">
                    retail_weekly_sales.xlsx
                  </span>
                  <a
                    href={salesUrl}
                    download="retail_weekly_sales.xlsx"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-500 font-medium"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Template
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Store Master Upload */}
          <div
            className={`border-2 border-dashed rounded-2xl p-6 transition-all duration-200 relative flex flex-col items-center justify-center text-center h-64 ${
              dragActive === "store"
                ? "border-emerald-500 bg-emerald-50/10"
                : storeFile
                ? "border-emerald-200 bg-emerald-50/5 dark:border-emerald-900/20 dark:bg-emerald-950/5"
                : "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700"
            }`}
            onDragEnter={(e) => handleDrag(e, "store")}
            onDragLeave={(e) => handleDrag(e, "store")}
            onDragOver={(e) => handleDrag(e, "store")}
            onDrop={(e) => handleDrop(e, "store")}
          >
            {storeFile ? (
              <div className="flex flex-col items-center gap-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-2 animate-bounce" />
                <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm break-all max-w-[200px]">
                  {storeFile.name}
                </span>
                <span className="text-xs text-slate-400">
                  {(storeFile.size / 1024).toFixed(1)} KB
                </span>
                <button
                  onClick={() => {
                    setStoreFile(null);
                    setStoreData(null);
                    onDataLoaded(salesData || [], []);
                  }}
                  className="mt-2 text-xs text-rose-500 hover:underline cursor-pointer"
                >
                  Remove File
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <FileText className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                <div>
                  <label className="cursor-pointer font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                    Browse Store Master
                    <input
                      type="file"
                      accept=".xlsx"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, "store")}
                    />
                  </label>
                  <p className="text-xs text-slate-400 mt-1">or drag & drop spreadsheet</p>
                </div>
                <div className="mt-4 flex flex-col items-center">
                  <span className="text-2xs font-bold tracking-wider text-slate-400 uppercase bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md">
                    store_master.xlsx
                  </span>
                  <a
                    href={storeUrl}
                    download="store_master.xlsx"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-500 font-medium"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Template
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Informational Guidance */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg text-emerald-500">
              <Database className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Want to see the dashboard immediately?
              </p>
              <p className="text-2xs text-slate-400 dark:text-slate-500 mt-0.5">
                Prepopulate our secure database with realistic sales values for instant verification.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {(error || validationReport) && (
              <button
                onClick={handleResetUploader}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Uploader</span>
              </button>
            )}
            <button
              onClick={onDemoLoaded}
              disabled={loading}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Load Demo Datasets</span>
            </button>
          </div>
        </div>

        {loading && (
          <div className="mt-6 flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-400">Uploading and validating datasets...</span>
          </div>
        )}
      </div>
    </div>
  );
};
