# Superstore Sales Analysis — Data Analyst Portfolio Project

![Status](https://img.shields.io/badge/status-complete-brightgreen)
![SQL](https://img.shields.io/badge/SQL-SQLite-blue)
![Python](https://img.shields.io/badge/Python-pandas-3776AB?logo=python&logoColor=white)

**[Live Dashboard Demo](https://pushkin-radix.github.io/superstore-sales-analysis/)**

End-to-end retail sales analysis using the classic Superstore dataset, demonstrating the full Data Analyst pipeline: raw data → SQL → Python → interactive dashboard → written insights.

## What's in this project

| Folder | Contents |
|---|---|
| `data/` | Raw CSV, cleaned CSV, and SQLite database |
| `sql/` | All analysis queries (KPIs, MoM growth, top products, regional breakdown, discount impact) |
| `python/` | Cleaning script + EDA/export script |
| `dashboard/` | Self-contained interactive HTML dashboard (open `index.html` directly, no server needed) |
| `outputs/` | Screenshots and the written insights summary |

## The dataset

- **Source:** Superstore Sales dataset (a widely-used retail dataset for analytics practice)
- **Size:** 10,800 raw rows → 9,994 cleaned rows after removing incomplete/invalid records
- **Span:** January 2015 – December 2018
- **Fields:** Order/ship dates, customer info, product category/sub-category, region, sales, profit, discount, quantity

## Pipeline

### 1. Data Cleaning (`python/01_clean_and_load.py`)
- Removed 806 rows with missing core fields (no order ID, date, or sales value)
- Parsed and validated date fields
- Removed exact duplicates
- Added derived columns: profit margin, shipping days, year/month breakdowns
- Loaded the cleaned data into a SQLite database for SQL querying

### 2. SQL Analysis (`sql/analysis_queries.sql`)
11 queries covering:
- Overall KPIs (revenue, profit, AOV, margin)
- Year-over-year and month-over-month growth
- Top products and top customers by revenue
- Category/sub-category profitability
- Regional and customer segment performance
- Unprofitable sub-categories
- Discount impact on margin
- Shipping mode efficiency

### 3. Python EDA (`python/02_eda_and_export.py`)
Runs the same analysis in pandas, computes additional derived metrics, and exports everything as structured JSON for the dashboard.

### 4. Interactive Dashboard (`dashboard/index.html`)
A self-contained dashboard (no internet connection or server required — just open the file) with:
- KPI summary row
- Monthly revenue trend + annual revenue/profit comparison
- Category and sub-category profitability breakdown
- Regional and customer segment analysis
- Top 10 products and top 10 customers tables
- Discount-vs-margin analysis with a clear business recommendation
- A written insights summary

## Key findings

1. **Discounting is the single biggest driver of profit loss.** Orders with no discount run a ~29.5% margin; orders discounted 40%+ run a **-77.4% margin** — the business loses money on the majority of heavily discounted orders.
2. **Furniture sub-categories (Tables, Bookcases) are net-unprofitable** despite meaningful revenue, driven by high average discount rates (21–26%).
3. **The West region leads on both revenue and margin** (14.9%), while Central lags on profitability despite solid order volume — a candidate for deeper regional discount-policy review.
4. **Revenue grew every year from 2016–2018** (+29.5% in 2017, +20.4% in 2018), but profit growth has not consistently kept pace, pointing back to discount strategy as the lever to fix.

## How to view it

Just open `dashboard/index.html` in any browser — it's fully self-contained (Chart.js and all data are bundled locally, no internet connection required).

To re-run the analysis pipeline yourself:

```bash
cd python
python3 01_clean_and_load.py
python3 02_eda_and_export.py
```

## Tech used

- **SQL** (SQLite) — querying and aggregation
- **Python** (pandas) — data cleaning, EDA, derived metrics
- **JavaScript / Chart.js** — interactive dashboard visualization
- **HTML/CSS** — dashboard layout and design

## License

This project is licensed under the MIT License — feel free to reuse the code with attribution.
