# Retail Sales Intelligence App - Business Calculations Specification

This document details the exact retail formulas, indicators, and stocking rules coded into the application.

---

## 📈 Metric & KPI Formulations

The dashboard aggregates rows filtered in real time by dimensions selected in the sidebar (Week, Region, Store, City, Format, Category). The calculations are formulated as follows:

### 1. Net Sales Volume
$$ \text{Net Sales} = \sum (\text{net\_sales}) $$
The total valuation of goods sold net of discounts and refunds.

### 2. Gross Sales Volume
$$ \text{Gross Sales} = \sum (\text{gross\_sales}) $$
The initial list-price valuation of goods before promotional discount rates are applied.
In terms of calculation consistency:
$$ \text{gross\_sales} = \text{net\_sales} + \text{discount\_amount} $$

### 3. Target Achievement Ratio (%)
$$ \text{Target Achievement \%} = \left( \frac{\sum \text{net\_sales}}{\sum \text{sales\_target}} \right) \times 100 $$
Tracks overall commercial effectiveness relative to regional sales goals. Values $\ge 100\%$ display with emerald success styling, while deficits below $95\%$ are highlighted for review.

### 4. Average Transaction Value (ATV)
$$ \text{ATV} = \frac{\sum \text{net\_sales}}{\sum \text{transactions}} $$
Represents the average amount spent by customers per completed check-out.

### 5. Footfall Conversion Rate (%)
$$ \text{Conversion Rate} = \left( \frac{\sum \text{transactions}}{\sum \text{footfall}} \right) \times 100 $$
Represents store capability in converting visiting foot traffic into paying transactions.

### 6. Promotional Discount Rate (%)
$$ \text{Discount Rate} = \left( \frac{\sum \text{discount\_amount}}{\sum \text{gross\_sales}} \right) \times 100 $$
Reflects profit margin erosion due to price cuts and loyalty promotions.

### 7. Product Return Rate (%)
$$ \text{Return Rate} = \left( \frac{\sum \text{returns\_amount}}{\sum \text{net\_sales}} \right) \times 100 $$
The percentage of net sales lost due to client returns. High return rates indicate possible product quality issues or description inaccuracies.

### 8. Average Customer Rating
$$ \text{Average Customer Rating} = \text{AVG}(\text{customer\_rating}) $$
Unweighted average customer satisfaction score (between 1.0 and 5.0).

### 9. Marketing Spend
$$ \text{Marketing Spend} = \sum (\text{marketing\_spend}) $$
The absolute volume of capital deployed into regional advertising and influencer marketing.

---

## 🚨 Stockout Risk Rules

The stockout risk of any given item record is evaluated individually at the row-level based on physical inventory buffers and transactional sales trends:

| Stockout Risk Status | Conditions & Business Constraints |
| :--- | :--- |
| **High** | `inventory_on_hand` < 200 **OR** `stockouts` > 5 |
| **Medium** | `inventory_on_hand` $\ge$ 200 **AND** `inventory_on_hand` $\le$ 500 |
| **Low** | `inventory_on_hand` > 500 |

*   **High Stockout Risk** indicates a high operational threat where immediate restocking is needed to prevent lost sales.
*   **Medium Stockout Risk** indicates a warning buffer.
*   **Low Stockout Risk** is stable and indicates healthy supply availability.
