# Prompt History - Retail Sales Intelligence App

This document details the iterative design and system prompt workflow applied to generate and optimize the Retail Sales Intelligence Application.

## 1. Initial Prompt
The user requested a full-stack dashboard allowing business users to upload retail spreadsheets (`retail_weekly_sales.xlsx` and `store_master.xlsx`), automatically validate and merge columns, generate interactive charts, and calculate strategic retail KPIs, along with dynamic insights powered by local heuristics and Gemini AI.

## 2. Prompt Improvements
- **Explicit Schema Enforcement**: Instructed the generator to enforce standard required headers (`Store ID`, `Week`, `Net Sales`, etc.) and automatically report missing/malformed keys.
- **Embedded Excel Template Generators**: Added a client-side Excel template writer using SheetJS (`xlsx`) so that end users can immediately download and inspect matching schemas without leaving the application.
- **Visual Grid Clustering**: Modularized the 12 requested visualizations into responsive, clickable analytical tabs to prevent grid layout congestion.

## 3. Bug Fix Prompts
- **ES Module Alignment**: Fixed CommonJS `require` calls inside ESM-based Vite files, transitioning to top-level `* as XLSX` imports.
- **React 19 Compatibility**: Replaced external Markdown dependencies prone to peer-dependency warnings with a highly robust custom regex parser that translates `#`, `##`, `###`, `-`, and bold `**` characters into Tailwind structures.

## 4. Optimization Prompts
- **Lazy AI Initialization**: Configured the server-side `@google/genai` client to initialize lazily, preventing startup crashes if `GEMINI_API_KEY` is temporarily unconfigured, and adding fallback heuristics.
- **Visual Harmony**: Enforced cohesive semantic colors across all 12 charts (e.g. Indigo for Net Sales, Emerald for Top Stores, Rose for Bottom Stores and Risks) to maintain an executive-ready look.

## 5. Final Prompt
"Build a production-quality Retail Sales Intelligence dashboard incorporating Express-Vite full-stack middleware, SheetJS validations, 12 interactive Recharts visualizations, automatic dynamic insights, and PDF/PNG export capability."
