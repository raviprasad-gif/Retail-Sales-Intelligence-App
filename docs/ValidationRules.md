# Retail Sales Intelligence App - Data Validation Rules

This document specifies the data validation framework, mandatory columns list, cell type constraints, and correction pathways when data errors occur.

---

## 📋 Mandatory Upload Files & Columns

To protect calculations from data type errors and schema mismatches, the application strictly requires exactly two files matching the schemas below:

### 1. `retail_weekly_sales.xlsx` (19 Columns Required)

| Column Name | Required Type | Business Role |
| :--- | :--- | :--- |
| `week_start_date` | Date / Excel Date | Start date of the retail monitoring week |
| `region` | Text String | Geographical market (e.g. North, West, South) |
| `store_id` | Text String | Unique alphanumeric identifier for store outlets |
| `store_name` | Text String | Descriptive name of the retail outlet |
| `city` | Text String | City location of the outlet |
| `store_format` | Text String | Format segment (e.g., Hypermarket, Express, Supermarket) |
| `product_category` | Text String | Main category designation (e.g., Apparel, Electronics) |
| `footfall` | Positive Integer | Total number of visitor entries |
| `transactions` | Positive Integer | Total number of check-out purchases |
| `units_sold` | Positive Integer | Number of items checked out |
| `gross_sales` | Positive Number | Revenue before discounts are subtracted |
| `discount_amount` | Positive Number | Total value of coupons and discounts applied |
| `net_sales` | Positive Number | Final earned revenue |
| `sales_target` | Positive Number | Target net sales goal for the store-category combination |
| `inventory_on_hand` | Positive Integer | Quantity of items physically in-stock |
| `stockouts` | Positive Integer | Number of days or incidents where item went out-of-stock |
| `returns_amount` | Positive Number | Value of items returned by consumers |
| `customer_rating` | Number (1.0 to 5.0) | Customer review satisfaction score |
| `marketing_spend` | Positive Number | Promotional capital allocated for marketing |

### 2. `store_master.xlsx` (5 Columns Required)

| Column Name | Required Type | Business Role |
| :--- | :--- | :--- |
| `store_id` | Text String | Primary key matching sales rows |
| `store_name` | Text String | Master registered store title |
| `region` | Text String | Designated territory |
| `city` | Text String | Designated city |
| `store_format` | Text String | Target retail format |

---

## 🛡️ Detailed Validation Checks

Upon uploading, the file goes through the following validation checks in sequence:

1. **Format Sufficiency Check**: Verifies that the file is strictly an Excel file containing a `.xlsx` extension. Standard CSVs, text files, or zip documents are blocked.
2. **Mandatory Header Match Check**: Compares parsed worksheet keys against our required array. If any header is missing, the upload is halted and missing headers are printed explicitly.
3. **Redundancy Headers Check**: Inspects the sheet for duplicate column headers. Duplicate headers can cause database corruption and are blocked.
4. **Missing Store ID Audit**: Flags row indexes where `store_id` is blank or omitted. Since `store_id` is the primary key used to join the two files, missing store IDs block dataset merging.
5. **Blank cell inspection**: Scans all mandatory columns for blank or null cells. 
6. **Strict Numeric Verification**: Verifies that numerical columns contain only numbers and are not corrupted by symbols, string comments (e.g., `"N/A"`), or currency labels (e.g., `"$10,000"`).
7. **Temporal Parsing Verification**: Confirms that `week_start_date` rows contain actual Excel serial dates or parsable ISO string dates.
8. **Line-item Redundancy Audit**: Reports the total count of duplicate rows present in the file (identical values in all columns).
9. **Relational Joining Audit**: Verifies that every `store_id` in the sales report matches a master record in the store master sheet. Any orphan records are flagged as errors.

---

## 🛠️ Step-by-Step Remediation Pathway

If validation fails, the application remains fully responsive:
1. **Locate Error Banner**: Check the dynamic audit logs at the top of the uploader to see exactly which rules failed (e.g., missing columns, row indexes with bad values, or blank items).
2. **Download Correct Template**: Click the **Download Template** button beneath the corresponding file upload block to download a pre-formatted template spreadsheet.
3. **Copy-Paste Data**: Copy your business data into the template, keeping the exact headers intact. Ensure numeric columns are clean numbers without symbols (`$`, `%`, or `,`).
4. **Re-upload**: Reset the uploader and drag your corrected files in. The dashboard will instantly refresh with your figures!
