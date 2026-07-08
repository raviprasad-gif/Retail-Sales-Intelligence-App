# Retail Sales Intelligence App - Architectural Reference

This document provides a technical specification of the system architecture, file structure, data flow, and components of the Retail Sales Intelligence Application.

---

## 🛠 Architectural Overview

The application is structured as a full-stack Node/React dashboard using **Vite** for the client, **Express** for the server, and **Tailwind CSS (v4)** for visual elements. It runs entirely offline without relying on persistent external databases or forced cloud services.

```
+--------------------------------------------------------------+
|                         Web Browser                          |
|                                                              |
|   +-----------------------+      +-----------------------+   |
|   |   DataUploader Component |   |   SidebarFilters Component|   |
|   +-----------+-----------+      +-----------+-----------+   |
|               |                              |               |
|               v                              v               |
|   +------------------------------------------------------+   |
|   |                   React State Manager                |   |
|   |    - Merges spreadsheets on store_id                 |   |
|   |    - Computes KPIs, trends, and stockout threats     |   |
|   +-----------+------------------------------+-----------+   |
|               |                              |               |
|               v                              v               |
|   +-----------------------+      +-----------------------+   |
|   |   DashboardCharts (D3) |      |   InsightsPanel (AI)  |   |
|   +-----------------------+      +-----------+-----------+   |
|                                              |               |
+----------------------------------------------|---------------+
                                               | (Proxy Route)
                                               v
+--------------------------------------------------------------+
|                       Express Server                         |
|   - Serves React Static Bundle (Production mode)              |
|   - Maps /api/analyze to Gemini SDK client (Server-side)      |
+--------------------------------------------------------------+
```

---

## 📂 Folder Structure

The code layout is strictly modular, allowing easy modification of styles, metrics calculations, charts, or upload components:

```
Retail-Sales-Intelligence/
├── .env.example            # Sample server configurations (e.g. GEMINI_API_KEY)
├── .gitignore              # Files ignored by git (such as node_modules and builds)
├── README.md               # Primary launch guide and system overview
├── LICENSE                 # MIT License file
├── requirements.txt        # Python dependency placeholder (optional deployment types)
├── package.json            # Node project configuration and run scripts
├── server.ts               # Express entrypoint serving Vite SPA and proxying Gemini AI
├── vite.config.ts          # Vite build config
│
├── docs/                   # Complete Product Documentation
│   ├── Architecture.md     # System architecture reference
│   ├── BusinessLogic.md    # Metrics formulation & formulas
│   ├── ValidationRules.md  # File validation & Excel audit logs
│   ├── DeploymentGuide.md  # Continuous deployment and container setup
│   ├── TestingGuide.md     # Unit, integration, and QA cases
│   └── PromptHistory.md    # Model prompting and iteration logs
│
├── public/                 # Static assets and template spreadsheets
│
└── src/                    # App source code
    ├── main.tsx            # React entrypoint
    ├── App.tsx             # Root dashboard controller & state manager
    ├── index.css           # Global Tailwind v4 stylesheet with Inter / JetBrains fonts
    ├── types.ts            # Core TypeScript interface definitions
    │
    ├── components/         # Reusable UI Modules
    │   ├── DataUploader.tsx    # Drag-and-drop XLS parsing and report generation
    │   ├── SidebarFilters.tsx  # Sticky collapsable multi-dimension filters
    │   ├── KPICard.tsx         # Responsive metrics block with progress overlays
    │   ├── DashboardCharts.tsx # 12 Recharts visualisations
    │   ├── InsightsPanel.tsx   # Local heuristics + AI Strategic Consultant
    │   └── ExportHeader.tsx    # PDF / PNG / XLSX / CSV export controls
    │
    └── utils/              # Calculation & Utility engines
        ├── excel.ts        # Column checks, sheet parser, templates generator
        └── insights.ts     # Business outliers, deficit finders, suggestions
```

---

## 🔒 Security & Offline Support

1. **Client-Side Data Integrity**: Raw spreadsheets uploaded by the user are never stored on any remote cloud server. All parsing, validation, merging, filtering, and metric aggregations occur directly within the browser tab using Javascript buffers.
2. **Proxy Security for API Keys**: The user's Google AI Studio/Gemini API keys are never leaked to the client browser. All AI strategic consulting is proxied through the server-side `/api/analyze` REST route. If no key is set, the application operates in 100% Offline Heuristic Mode, showing locally calculated strategic observations without throwing errors or crashing.
