# 📊 Retail Sales Intelligence Console

[![React 19](https://img.shields.io/badge/React-v19.0-20232A?logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-v6.0-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Zustand](https://img.shields.io/badge/Zustand-v5.0-brown?logo=react&logoColor=white)](https://zustand.docs.pmnd.rs/)
[![TanStack Table](https://img.shields.io/badge/TanStack_Table-v8-FF4154?logo=react&logoColor=white)](https://tanstack.com/table)
[![Tests Passing](https://img.shields.io/badge/Vitest-passing-brightgreen?logo=vitest&logoColor=white)](https://vitest.dev/)
[![Deployment: Cloudflare Pages](https://img.shields.io/badge/Deployment-Cloudflare_Pages-orange?logo=cloudflare&logoColor=white)](https://pages.cloudflare.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

An enterprise-grade, fully browser-based Business Intelligence (BI) console designed for retail analysts, supply chain planners, and business executives. Upload raw weekly sales spreadsheets and master store configurations to instantly execute multi-dimensional relational joins, run 11 rigorous data audits, evaluate inventory stockout risks, visualize analytical metrics via 12 high-impact charts, and receive bespoke strategic recommendations from an automated AI Consultant.

Designed with **offline-first reliability**, the system is **100% serverless** and executes all validation, joins, and aggregations directly in the browser using SheetJS (`xlsx`). Strategic AI consultation is executed via client-side Gemini API integration utilizing `@google/genai` with a secure offline fallback heuristics engine, ensuring full functionality with zero backend overhead.

---

## 📌 Table of Contents

1. [🚀 Key Features](#-key-features)
2. [🗺️ System Architecture & Data Flow](#️-system-architecture--data-flow)
3. [📂 Project Directory Structure](#-project-directory-structure)
4. [📋 Data Model & Column Requirements](#-data-model--column-requirements)
5. [🛡️ Validation Engine (11 Critical Audits)](#️-validation-engine-11-critical-audits)
6. [🧮 Mathematical Calculations & Metrics](#-mathematical-calculations--metrics)
7. [🚨 Inventory Stockout Risk Model](#-inventory-stockout-risk-model)
8. [💻 Local Installation & Quickstart](#-local-installation--quickstart)
9. [🧪 Testing Suite Guide](#-testing-suite-guide)
10. [🚀 Production Deployment & Cloudflare Pages](#-production-deployment--cloudflare-pages)
11. [🧠 AI Strategic Consultant & Offline Fallbacks](#-ai-strategic-consultant--offline-fallbacks)
12. [📝 Analytical Assumptions & Real-World Limitations](#-analytical-assumptions--real-world-limitations)
13. [🔮 Future Roadmap & Enhancements](#-future-roadmap--enhancements)
14. [📄 License & Credits](#-license--credits)

---

## 🚀 Key Features

*   **⚡ 100% Client-Side Processing**: Leverages SheetJS (`xlsx`) to parse large spreadsheets fully in the user's browser, keeping sensitive corporate datasets secure and private with zero server roundtrips.
*   **🛡️ Multi-Dimensional Auditing**: Evaluates uploaded sheets using 11 rigorous schema and type checks, printing detailed interactive warning logs for dirty rows instead of failing silently.
*   **🔗 Relational Data Merging**: Joins weekly transactional sales datasets with store master data on a shared `store_id` index dynamically in the browser.
*   **📊 12 Interactive Visualizations**:
    1.  **Weekly Sales Trend**: Dynamic progress timeline matching against target metrics.
    2.  **Sales by Region**: Vertical bar chart mapping regional volume distributions.
    3.  **Product Category Performance**: Horizontal layout highlighting category earnings.
    4.  **Store Leaderboard (Top 10)**: Fast-paced ranking of outlets beating sales targets.
    5.  **Underperforming Stores (Bottom 10)**: Bottom-ranked outlets prioritized for intervention.
    6.  **Region Target Achievement**: Circular visual dial analyzing budget goals.
    7.  **Category Discount Analysis**: Dual-axis chart highlighting margin dilution.
    8.  **Category Return Rate**: Return valuations indexed against total sales per category.
    9.  **Store Inventory Stockout Risk**: Distribution card evaluating supply chain health.
    10. **Sales Contribution by Region**: Clean proportional visual donut chart.
    11. **Heatmap: Week vs Region Sales**: Grid of sales density across fiscal periods.
    12. **Transactions vs Net Sales Scatter**: Visual scatter representation charting consumer basket size correlation.
*   **💾 High-Fidelity Multi-Format Exporter**: Export filtered BI grids to formatted **Excel (.xlsx)** or **CSV**, save metric indices to **CSV**, generate executive summaries in **TXT**, snapshot visual charts as **PNG**, or render the entire BI deck as a presentation-ready **PDF**.
*   **🧠 Client-Side AI Strategic Consultant**: Integrates with Google GenAI using the ultra-fast `gemini-3.5-flash` model directly from the client when configured with an API key, fallback-protected by local consultant-grade rule heuristics.

---

## 🗺️ System Architecture & Data Flow

The console enforces a strict Single Page Application (SPA) architecture. Raw datasets are loaded into client-side memory, validated, merged, and run through a heuristic math engine. All operations happen in-browser.

```
       +--------------------------------------------------------------+
       |                         USER BROWSER                         |
       |                                                              |
       |   +-----------------------+      +-----------------------+   |
       |   |      XLSX Sheets      |      |   Dimension Filters   |   |
       |   |   (Weekly & Master)   |      |   (Region/Store/Wk)   |   |
       |   +-----------+-----------+      +-----------+-----------+   |
       |               |                              |               |
       |               v                              v               |
       |   +------------------------------------------------------+   |
       |   |                  React State Manager                 |   |
       |   |     - Zustand Global State Management                |   |
       |   |     - Validates schemas & types in memory (SheetJS)  |   |
       |   |     - Merges tables dynamically on `store_id`        |   |
       |   |     - Aggregates multi-dimensional BI indicators     |   |
       |   +-----------+------------------------------+-----------+   |
       |               |                              |               |
       |               v                              v               |
       |   +-----------------------+      +-----------------------+   |
       |   |  12 Recharts Panel    |      |  AI Insights Viewer   |   |
       |   |  (D3 Responsive SVG)  |      |   (Local / Gemini)    |   |
       |   +-----------------------+      +-----------+-----------+   |
       |                                              |               |
       +----------------------------------------------|---------------+
                                                      | (Secure Client-Side SDK)
                                                      v
                                        +---------------------------+
                                        |  Google Gemini AI Engine  |
                                        |      (gemini-3.5-flash)   |
                                        +---------------------------+
```

---

## 📂 Project Directory Structure

```
Retail-Sales-Intelligence/
├── .env.example              # Template environment variables (Gemini API keys)
├── .gitignore                # Production exclusions (node_modules, builds, logs)
├── LICENSE                   # Open-source license terms (MIT)
├── package.json              # App dependencies, engines, and NPM build scripts
├── vite.config.ts            # Vite client-side configuration with env injection
├── tsconfig.json             # TypeScript rules and compiler configuration
│
├── docs/                     # Detailed Product Documentation
│   ├── Architecture.md       # Full architectural schema and data flow maps
│   ├── BusinessLogic.md      # Detailed metric guidelines & formula structures
│   ├── ValidationRules.md    # 11 validation assertions and data correction steps
│   ├── DeploymentGuide.md    # Production deployment and static hosting configurations
│   ├── TestingGuide.md       # Test matrix & manual verification checklist
│   └── PromptHistory.md      # Historical logs documenting development phases
│
├── public/                   # Static mock templates and system templates
│
└── src/                      # Source Code Directory
    ├── main.tsx              # DOM element mount initialization
    ├── App.tsx               # Master app shell, global states, and layout framework
    ├── types.ts              # Global strongly-typed interface definitions
    ├── index.css             # Unified CSS containing Tailwind v4 rules & font faces
    │
    ├── components/           # Reusable Client-Side React Modules
    │   ├── DataUploader.tsx    # Drag-and-drop parsing dashboard with live validation logs
    │   ├── SidebarFilters.tsx  # Sticky collapsible dimension and segment selectors
    │   ├── KPICard.tsx         # Analytical visual metric widget with trend meters
    │   ├── DashboardCharts.tsx # 12 Recharts data rendering engines (D3 graphics)
    │   ├── InsightsPanel.tsx   # Local business heuristics + AI Strategic Consultant
    │   └── ExportHeader.tsx    # Multi-format exports bar (PDF/PNG/XLSX/CSV)
    │
    ├── utils/                # Functional Utility Libraries
    │   ├── excel.ts            # Auditing validator, SheetJS parsers, template generator
    │   └── insights.ts         # Diagnostic outlier engines & strategic heuristics
    │
    └── tests/                # Automated Testing Suite
        ├── excel.test.ts       # Vitest spreadsheet validation and parsing tests
        └── dataModel.test.ts   # Vitest business metrics calculation tests
```

---

## 📋 Data Model & Column Requirements

The application requires exactly **two** Microsoft Excel files (`.xlsx`) to perform data joins. The column definitions must match the following specifications:

### 1. Weekly Sales Sheet (`retail_weekly_sales.xlsx`)

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `week_start_date` | Date / String | Mandatory | The start date of the reporting period. Parses ISO strings or serial numbers. |
| `region` | String | Mandatory | Regional sales division (e.g., North, South, West, Midwest). |
| `store_id` | String | Mandatory | Alphanumeric unique key matching a store record. |
| `store_name` | String | Mandatory | Name of the specific physical location. |
| `city` | String | Mandatory | Store city. |
| `store_format` | String | Mandatory | Store tier structure (e.g., Hypermarket, Supermarket, Boutique, Express). |
| `product_category`| String | Mandatory | Segment of inventory (e.g., Electronics, Apparel, Groceries, Home Goods). |
| `footfall` | Integer | $\ge 0$ | The physical count of customers entering the store. |
| `transactions` | Integer | $\ge 0$ | Total successful transactions. |
| `units_sold` | Integer | $\ge 0$ | Total count of individual products checked out. |
| `gross_sales` | Numeric | $\ge 0$ | Total revenue computed before discounts. |
| `discount_amount` | Numeric | $\ge 0$ | Total volume of promotional markdown adjustments. |
| `net_sales` | Numeric | $\ge 0$ | Actual earned revenue ($\text{gross\_sales} - \text{discount\_amount}$). |
| `sales_target` | Numeric | $> 0$ | Expected net revenue quota set for the period. |
| `inventory_on_hand`| Integer | $\ge 0$ | Current counts of physical products remaining in stock. |
| `stockouts` | Integer | $\ge 0$ | Count of item types that went out of stock during the week. |
| `returns_amount` | Numeric | $\ge 0$ | Total refund value processed for returned products. |
| `customer_rating` | Numeric | $1.0 \le x \le 5.0$ | Cumulative customer survey satisfaction score. |
| `marketing_spend` | Numeric | $\ge 0$ | Advertising capital spent in support of local operations. |

### 2. Store Master Reference (`store_master.xlsx`)

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `store_id` | String | Unique Key | Unique store reference matches (Primary join key for merging). |
| `store_name` | String | Mandatory | Master location title. |
| `region` | String | Mandatory | Registered territory. |
| `city` | String | Mandatory | Designated city. |
| `store_format` | String | Mandatory | Retail format class. |

---

## 🛡️ Validation Engine (11 Critical Audits)

Before merging datasets or displaying figures, the system runs raw sheet arrays through an 11-step validation workflow designed to ensure total mathematical and analytical integrity:

1.  **File Inclusion Test**: Verifies both files are loaded into active browser slots.
2.  **File Format Assertion**: Enforces that uploaded files contain the `.xlsx` extension.
3.  **Mandatory Headers Verification**: Inspects files to confirm all required columns are present.
4.  **Exact Column Matching**: Ensures header names match exactly in spelling and capitalization.
5.  **De-Duplication Check**: Confirms header rows do not contain redundant column listings.
6.  **Store ID Sanitization**: Scans all sales records to flag entries containing empty `store_id` fields.
7.  **Required Cells Scan**: Scans essential data paths for blank or empty rows.
8.  **Strict Numeric Guard**: Validates that all mathematical cells contain pure numbers (reformatting common placeholders like `"N/A"`, `"-"`, or `"null"` dynamically).
9.  **Chronological Formatting**: Parses and converts dates from various Excel formats into standardized ISO layouts.
10. **Row Repetition Audit**: Detects and reports exact duplicate sales rows.
11. **Orphan Records Join Check**: Flags any rows in the sales sheet reference whose `store_id` does not match an entry in the `store_master.xlsx`.

If validation issues are found, the application pauses rendering, showcases an interactive **Audit Log Console**, details the exact row indices containing the errors, and provides steps to repair them.

---

## 🧮 Mathematical Calculations & Metrics

The business intelligence engine calculates KPIs at runtime based on the following formulations:

*   **Net Sales ($S_{net}$)**:
    $$\text{Net Sales} = \sum (\text{net\_sales})$$
*   **Gross Sales ($S_{gross}$)**:
    $$\text{Gross Sales} = \sum (\text{gross\_sales})$$
*   **Target Achievement Rate ($A_{target}$)**:
    $$\text{Target Achievement \%} = \left( \frac{\sum(\text{net\_sales})}{\sum(\text{sales\_target})} \right) \times 100$$
*   **Average Transaction Value ($ATV$)**:
    $$\text{ATV} = \frac{\sum(\text{net\_sales})}{\sum(\text{transactions})}$$
*   **Store Conversion Rate ($R_{conv}$)**:
    $$\text{Conversion Rate \%} = \left( \frac{\sum(\text{transactions})}{\sum(\text{footfall})} \right) \times 100$$
*   **Discount Margin Rate ($R_{disc}$)**:
    $$\text{Discount Rate \%} = \left( \frac{\sum(\text{discount\_amount})}{\sum(\text{gross\_sales})} \right) \times 100$$
*   **Return Loss Rate ($R_{ret}$)**:
    $$\text{Return Rate \%} = \left( \frac{\sum(\text{returns\_amount})}{\sum(\text{net\_sales})} \right) \times 100$$
*   **Average Customer Satisfaction Rating ($\mu_{sat}$)**:
    $$\mu_{sat} = \frac{1}{N} \sum_{i=1}^{N} (\text{customer\_rating}_i)$$
*   **Return on Marketing Investment ($ROMI$)**:
    $$\text{ROMI Ratio} = \frac{\sum(\text{net\_sales})}{\sum(\text{marketing\_spend})}$$

---

## 🚨 Inventory Stockout Risk Model

Supply chain indicators evaluate and label inventory threats on a line-by-line level using specific parameters:

```
                       [ Row Inventory Stock Record Evaluated ]
                                          |
                        +-----------------+-----------------+
                        |                                   |
                        v                                   v
              [ Is Inventory < 200? ]             [ Is Stockouts > 5? ]
              [  Or Stockouts > 5?  ]             [  And Inventory > 500? ]
                        |                                   |
             +----------+----------+                        |
             | YES                 | NO                     |
             v                     v                        v
      +--------------+     [ Is Inventory Between ]         |
      |  HIGH RISK   |     [   200 and 500?       ]         |
      +--------------+               |                      |
                             +-------+-------+              |
                             | YES           | NO           v
                             v               v        +-------------+
                      +--------------+ +------------+ |  LOW RISK   |
                      | MEDIUM RISK  | |  LOW RISK  | +-------------+
                      +--------------+ +------------+
```

*   **🔴 High Risk**: Physical inventory on hand falls below **200 units** or the store registers more than **5 stockout incidents** in a week.
*   **🟡 Medium Risk**: Physical inventory on hand ranges between **200 and 500 units** (inclusive).
*   **🟢 Low Risk**: Physical inventory is healthy, with more than **500 units** on hand.

---

## 💻 Local Installation & Quickstart

Follow these instructions to clone, install, and run the complete application environment locally.

### Prerequisites

Ensure you have the following software installed:
*   **Node.js**: `v18.0.0` or higher (recommended: `v20.x`)
*   **NPM**: `v9.0.0` or higher

### Step 1: Clone the Repository & Install Dependencies
```bash
git clone https://github.com/your-organization/retail-sales-intelligence.git
cd retail-sales-intelligence
npm install
```

### Step 2: Configure Environment Variables
Copy the `.env.example` file to `.env` in the project root:
```bash
cp .env.example .env
```
Open `.env` and configure your API keys if you wish to use Gemini client-side:
```env
# Google Gemini API key used for the client-side AI Consultant (optional)
GEMINI_API_KEY="your_actual_gemini_api_key_here"
```

### Step 3: Run the Development Server
Start the Vite dev server on port `3000`:
```bash
npm run dev
```

### Step 4: Access the Interface
Open your web browser and navigate to:
```
http://localhost:3000
```
*(You will see a prompt to download sample data sheets directly from the uploader card to help you test the interface immediately!)*

---

## 🧪 Testing Suite Guide

Our application includes rigorous TypeScript unit and integration test suites powered by **Vitest** that validate analytical calculations, validation error catching, and join structures.

### Execute Automated Test Suites
You can run the full analytical verification test blocks via:

```bash
# Verify static type-safety across all components
npm run lint

# Run the Vitest unit & integration tests
npm test
```

### Output of Test Assertions:
```
✓ src/tests/excel.test.ts (5 tests)
✓ src/tests/dataModel.test.ts (3 tests)

 Test Files  2 passed (2)
      Tests  8 passed (8)
   Start at  10:40:25
   Duration  1.28s
```

---

## 🚀 Production Deployment & Cloudflare Pages

Since the application is 100% serverless, the build outputs are entirely static assets. This makes the app perfectly optimized for high-performance edge deployment on **Cloudflare Pages** with fast global response times and absolute security.

### 📊 Build Configuration Summary
*   **Build Command**: `npm run build` (runs Vite production compilation and assets bundle pipeline)
*   **Output Directory**: `dist` (contains highly optimized, minified HTML, JS, CSS, and media assets)
*   **Node.js Version Recommendation**: `v18.0.0` or higher (recommended: `v20.x` or `v22.x` for faster bundler execution)
*   **Compatibility Date**: `2026-07-08` (configured in `wrangler.toml` for standard runtime rules)

### ⚡ Assets & Performance Optimization Features
*   **Tree Shaking & Code Splitting**: Built-in tree shaking via Rollup. Key modules (React core, Recharts D3 engine, SheetJS xlsx, Google GenAI SDK) are split into standalone cached vendor files using Vite manual chunk configurations.
*   **Minification**: Code is minified via Esbuild, reducing the core bundle sizes by up to 70% and accelerating initial paint metrics.
*   **Lazy Loading**: Heavy dashboards and intelligence report sections are lazily loaded using `React.lazy()` and `Suspense` with custom skeleton feedback blocks.
*   **Security & Edge Compression**: Native Brotli/Gzip compression on Cloudflare edge servers paired with a secure Content Security Policy (CSP), clickjacking, and XSS protection headers loaded from `/public/_headers`.
*   **Installable PWA**: Modern PWA metadata defined in `/public/manifest.json` combined with static pre-caching via the service worker `/public/sw.js` for offline fallback support.

---

### 🗺️ Step-by-Step Cloudflare Pages Deployment Guide

Follow this guide to build, test, and deploy your console to Cloudflare Pages.

#### 1. Install Dependencies
Before running builds or local tests, make sure all package requirements are satisfied:
```bash
# Clean install all standard and development dependencies
npm ci
```

#### 2. Build Locally
Verify that the project compiles cleanly under production rules:
```bash
# Build the production bundle
npm run build
```
This will compile assets and put them in the `/dist` directory. You should verify that `/dist` contains `index.html`, `_headers`, `_redirects`, `manifest.json`, and the split JS/CSS files inside `/dist/assets/`.

#### 3. Test Locally
You can run the full automated test suite or spin up a local preview server before deploying:
```bash
# Run the Vitest unit/integration test assertions
npm test

# Spin up a local production-mimic preview server on port 3000
npx vite preview --port 3000
```

#### 4. Deploy using Cloudflare Pages Dashboard (Continuous Deployment)
This is the recommended path as it triggers a new edge build automatically whenever you push code to GitHub:
1.  Log in to your **Cloudflare Dashboard** and navigate to **Workers & Pages**.
2.  Click **Create application** > **Pages** > **Connect to Git**.
3.  Choose your GitHub account and repository.
4.  Configure the **Build settings**:
    *   **Framework preset**: `Vite` (or None)
    *   **Build command**: `npm run build`
    *   **Build output directory**: `dist`
5.  Set your Node version environment variable in the Cloudflare page setup to ensure build compatibility:
    *   In the Pages settings under **Environment variables**, add a variable named `NODE_VERSION` with the value `20.0.0` or higher.
6.  Click **Save and Deploy**. Cloudflare will compile and serve your app globally.

#### 5. Deploy using Wrangler CLI
If you prefer terminal-based manual deployments, you can deploy using Cloudflare's Wrangler CLI:
```bash
# Login to your Cloudflare account from terminal
npx wrangler login

# Deploy your compiled build output directory directly
npx wrangler pages deploy dist --project-name=retail-sales-intelligence
```

#### 6. Connect GitHub Repository
Connecting your repository creates automatic preview builds for every pull request and production updates for merges:
1. In Cloudflare Pages, go to **Settings** > **Builds & Deployments**.
2. Under **Configure Git**, connect your repository branch (e.g., `main`).
3. Set up build triggers to target only changes made outside documentation folders to optimize build queues.

#### 7. Configure Environment Variables
If you want to use the Google Gemini API client-side, you must configure the environment secret:
1. Go to your Pages project in the Cloudflare Dashboard and navigate to **Settings** > **Environment variables**.
2. Add your environment variables under **Production** (and optionally **Preview**):
    *   `GEMINI_API_KEY`: `your_actual_google_ai_studio_api_key_here`
3. *Note: Since this is a client-side Vite application, Vite embeds variables prefixed with `VITE_` or variables declared during compile-time. Because our `vite.config.ts` explicitly maps `process.env.GEMINI_API_KEY` to `process.env` during compilation, setting `GEMINI_API_KEY` in the Cloudflare environment variables makes it available securely in the built client files.*

#### 8. Configure Custom Domain
1. In your Pages project, select the **Custom domains** tab.
2. Click **Set up a custom domain**.
3. Enter your domain name (e.g., `retail-bi.yourcompany.com`).
4. Cloudflare will automatically configure the required DNS records and provision a free, secure SSL certificate.

#### 9. Troubleshooting Common Deployment Issues
*   **Issue: Blank screen on deep subroutes**
    *   *Solution*: Ensure the `/public/_redirects` file is uploaded correctly containing `/* /index.html 200`. This maps all routing fallbacks back to the SPA router.
*   **Issue: "Vite command not found" or build environment failures**
    *   *Solution*: Ensure your Node.js version is set correctly in the Cloudflare Dashboard settings using `NODE_VERSION` (value `20.x`).
*   **Issue: Gemini API calls return "Blocked by Content Security Policy (CSP)"**
    *   *Solution*: Check your `/public/_headers` file. Ensure `connect-src` includes `https://generativelanguage.googleapis.com` and `https://*.googleapis.com`.
*   **Issue: PWA is not triggering the install prompt**
    *   *Solution*: PWAs require a secure HTTPS connection (provided automatically by Cloudflare) and a registered service worker. Ensure `sw.js` and `manifest.json` are present in your `dist/` root directory and can be accessed via `/sw.js` and `/manifest.json`.

---

---

## 🧠 AI Strategic Consultant & Offline Fallbacks

The AI Strategic Consultant acts as your virtual Chief Operating Officer. When datasets are merged, the client extracts business insights (such as high-return lines, failing stores, advertising anomalies, and critical stockouts).

```
[ Datasets Ingested ] ===> [ Heuristics Analyzer Runs ] ===> [ Outliers Extracted ]
                                                                      |
                                           +-------------------------+-------------------------+
                                           |                                                   |
                             [ Is GEMINI_API_KEY Set? ]                                        |
                                           |                                                   |
                        +------------------+------------------+                                |
                        | YES                                 | NO                             v
                        v                                     v                        +---------------+
             [ GoogleGenAI Browser SDK ]           [ Static Heuristic Engine ]         | Return Rates, |
             [ Direct API Generation ]             [ Generates Local Report ]          | Deficit Lists,|
                        |                                     |                        | Stockout Warns|
                        v                                     v                        +---------------+
               +-----------------+                   +-----------------+                       |
               | Gemini Generates|                   | Local Heuristic |                       |
               | Executive Deck  |                   | Insights Render |<======================+
               +-----------------+                   +-----------------+
```

### 1. Online Mode (Gemini API Connected)
*   **Model**: `gemini-3.5-flash` via `@google/genai` library.
*   **Security Notice**: Running Gemini client-side uses the key provided during build/compilation (`GEMINI_API_KEY`). Ensure your build platform protects secrets.
*   **Action**: Transmits computed business metrics to Gemini directly, returning a highly customized executive summary, supply chain intervention recommendations, and a marketing spend reallocation matrix.

### 2. Offline Mode (Fallback Heuristics)
*   **Action**: If `GEMINI_API_KEY` is missing, the application automatically triggers the local intelligence module (`src/utils/insights.ts`).
*   **Output**: Renders an executive brief showing key outliers, target deficits, high return-rate lines, and critical stockouts.

---

## 📝 Analytical Assumptions & Real-World Limitations

### Analytical Assumptions
1.  **Fiscal Calendar Formatting**: Dates are mapped to dynamic fiscal weeks using the ISO-8601 week conversion standard (`YYYY-WW`). For example, the start date `"2026-05-01"` converts to Fiscal Period `"2026-18"`.
2.  **Stockout Assessment**: Inventory risk flags are evaluated per row; aggregate inventory calculations assume that stock numbers represent weekly end-of-period counts.
3.  **Data Currency**: The primary currency is uniform across all files.

### Technical Limitations
1.  **Client Memory Limits**: Client-side parsing via SheetJS handles files up to **100,000 rows** efficiently. Files larger than 20MB may experience minor interface lag during loading.
2.  **API Rate Boundaries**: Large tables analyzed with the AI Consultant are summarized into structured metrics before being sent to the LLM to stay within the API's input token limits.
3.  **Local Storage**: Data filters and merged lists are held in React state and do not persist across page reloads.

---

## 🔮 Future Roadmap & Enhancements

*   **🔮 Predictive Inventory Forecasting**: Add a local linear regression forecasting module to predict product stock depletion.
*   **🗄️ Relational Database Sync**: Add support for saving data to cloud databases (PostgreSQL/Firestore) for team collaboration.
*   **🔔 Intelligent Supply Chain Alerts**: Add SMS/Email alert integrations (via Twilio/SendGrid) to notify team members about stockouts.
*   **🛰️ Interactive Store Maps**: Add Google Maps widgets to map and filter metrics by exact physical location.

---

## 📄 License & Credits

Distributed under the MIT License. See `LICENSE` for details.

*Special thanks to SheetJS for spreadsheet parsing, Recharts for robust visualizations, and Google Gemini for strategic consulting insights.*
