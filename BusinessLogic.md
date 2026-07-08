# Business Logic Guide - Retail Sales Intelligence App

This document outlines the core business logic, algebraic formulations, and metric derivations implemented in the Retail Sales Intelligence Application.

## 1. Primary KPI Formulas

The application aggregates sales records dynamically. For any active set of filtered rows, the following formulations are calculated:

### A. Net Sales Volume
Sum of all net sales figures in the filtered set.
$$\text{Net Sales} = \sum (\text{row.netSales})$$

### B. Target Achievement %
$$\text{Target Achievement \%} = \left( \frac{\sum \text{Net Sales}}{\sum \text{Target Sales}} \right) \times 100$$
- **Interpretation:** Tells the executive whether the business unit is currently operating ahead of or behind targeted goals. If $\ge 100\%$, progress is green; otherwise, amber.

### C. Average Transaction Value (ATV)
$$\text{Average Transaction Value} = \frac{\sum \text{Net Sales}}{\sum \text{Transactions}}$$
- **Interpretation:** Denotes spend density per transaction, assisting managers in analyzing the effectiveness of cross-selling.

### D. Return Rate %
$$\text{Return Rate \%} = \left( \frac{\sum \text{Return Amount}}{\sum \text{Net Sales}} \right) \times 100$$
- **Interpretation:** Evaluates quality control or sizing discrepancies. Values exceeding $5.0\%$ are flagged as "Elevated" in red.

### E. Discount Rate %
$$\text{Discount Rate \%} = \left( \frac{\sum \text{Discount Amount}}{\sum \text{Gross Sales}} \right) \times 100$$
- **Formula Detail:** Gross Sales is dynamically calculated as $\text{Net Sales} + \text{Discount Amount}$. This represents total list value before promos.

### F. Footfall Conversion Rate %
$$\text{Conversion Rate \%} = \left( \frac{\sum \text{Transactions}}{\sum \text{Footfall}} \right) \times 100$$
- **Interpretation:** Evaluates store associate effectiveness, traffic quality, and merchandising layouts.

### G. Stockout Threat Level
Calculated by dividing the count of records carrying a low inventory availability flag by the total number of records.
- **High Stockout Risk:** Ratio $> 20\%$ of filtered products.
- **Medium Stockout Risk:** Ratio $> 10\%$ of filtered products.
- **Low Stockout Risk:** Else.

---

## 2. Dynamic Insights Heuristics
If no Gemini API Key is active, a local commercial heuristic compiler runs instantly on the client, determining:
- **Top Outlet Outliers:** Sorting the grouped sales totals to find top and bottom retail performers.
- **Leakage Triggers:** Highlights which categories suffer from the largest discount dilution and return claims.
- **Sales Recapture Deficit:** Calculates the total currency gap represented by stores underperforming their targets, creating a concrete financial target for managers.
