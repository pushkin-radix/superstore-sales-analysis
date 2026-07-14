-- ============================================================
-- Superstore Sales Analysis — SQL Queries
-- Database: superstore.db (SQLite)
-- Table: orders
-- ============================================================

-- 1. OVERALL KPIs
-- Total revenue, profit, order count, and average order value
SELECT
    COUNT(DISTINCT order_id)           AS total_orders,
    ROUND(SUM(sales), 2)               AS total_revenue,
    ROUND(SUM(profit), 2)              AS total_profit,
    ROUND(SUM(profit) / SUM(sales) * 100, 2) AS overall_margin_pct,
    ROUND(SUM(sales) / COUNT(DISTINCT order_id), 2) AS avg_order_value
FROM orders;


-- 2. REVENUE BY YEAR (year-over-year growth)
SELECT
    order_year,
    ROUND(SUM(sales), 2) AS revenue,
    ROUND(SUM(profit), 2) AS profit,
    COUNT(DISTINCT order_id) AS orders
FROM orders
GROUP BY order_year
ORDER BY order_year;


-- 3. MONTH-OVER-MONTH REVENUE GROWTH
-- Uses a self-join style window function to compute % change vs previous month
WITH monthly AS (
    SELECT
        order_year_month,
        SUM(sales) AS revenue
    FROM orders
    GROUP BY order_year_month
)
SELECT
    order_year_month,
    ROUND(revenue, 2) AS revenue,
    ROUND(
        (revenue - LAG(revenue) OVER (ORDER BY order_year_month))
        / LAG(revenue) OVER (ORDER BY order_year_month) * 100
    , 2) AS mom_growth_pct
FROM monthly
ORDER BY order_year_month;


-- 4. TOP 10 PRODUCTS BY REVENUE
SELECT
    product_name,
    category,
    sub_category,
    ROUND(SUM(sales), 2) AS revenue,
    ROUND(SUM(profit), 2) AS profit,
    SUM(quantity) AS units_sold
FROM orders
GROUP BY product_name, category, sub_category
ORDER BY revenue DESC
LIMIT 10;


-- 5. REVENUE & PROFIT BY CATEGORY AND SUB-CATEGORY
SELECT
    category,
    sub_category,
    ROUND(SUM(sales), 2) AS revenue,
    ROUND(SUM(profit), 2) AS profit,
    ROUND(SUM(profit) / SUM(sales) * 100, 2) AS margin_pct,
    COUNT(DISTINCT order_id) AS orders
FROM orders
GROUP BY category, sub_category
ORDER BY revenue DESC;


-- 6. REGIONAL PERFORMANCE
SELECT
    region,
    ROUND(SUM(sales), 2) AS revenue,
    ROUND(SUM(profit), 2) AS profit,
    ROUND(SUM(profit) / SUM(sales) * 100, 2) AS margin_pct,
    COUNT(DISTINCT customer_id) AS unique_customers,
    COUNT(DISTINCT order_id) AS orders
FROM orders
GROUP BY region
ORDER BY revenue DESC;


-- 7. CUSTOMER SEGMENT ANALYSIS
SELECT
    segment,
    COUNT(DISTINCT customer_id) AS unique_customers,
    COUNT(DISTINCT order_id) AS total_orders,
    ROUND(SUM(sales), 2) AS revenue,
    ROUND(SUM(sales) / COUNT(DISTINCT customer_id), 2) AS revenue_per_customer
FROM orders
GROUP BY segment
ORDER BY revenue DESC;


-- 8. TOP 10 CUSTOMERS BY LIFETIME VALUE
SELECT
    customer_name,
    segment,
    region,
    COUNT(DISTINCT order_id) AS total_orders,
    ROUND(SUM(sales), 2) AS lifetime_revenue,
    ROUND(SUM(profit), 2) AS lifetime_profit
FROM orders
GROUP BY customer_name, segment, region
ORDER BY lifetime_revenue DESC
LIMIT 10;


-- 9. UNPROFITABLE SUB-CATEGORIES (where the business is losing money)
SELECT
    category,
    sub_category,
    ROUND(SUM(sales), 2) AS revenue,
    ROUND(SUM(profit), 2) AS total_loss,
    ROUND(AVG(discount) * 100, 1) AS avg_discount_pct
FROM orders
GROUP BY category, sub_category
HAVING SUM(profit) < 0
ORDER BY total_loss ASC;


-- 10. SHIPPING MODE EFFICIENCY
SELECT
    ship_mode,
    ROUND(AVG(shipping_days), 1) AS avg_shipping_days,
    COUNT(DISTINCT order_id) AS orders,
    ROUND(SUM(sales), 2) AS revenue
FROM orders
GROUP BY ship_mode
ORDER BY avg_shipping_days;


-- 11. DISCOUNT IMPACT ON PROFITABILITY
-- Buckets orders into discount ranges to show how discounting erodes margin
SELECT
    CASE
        WHEN discount = 0 THEN '0% (no discount)'
        WHEN discount <= 0.2 THEN '1-20%'
        WHEN discount <= 0.4 THEN '21-40%'
        ELSE '40%+'
    END AS discount_bucket,
    COUNT(DISTINCT order_id) AS orders,
    ROUND(SUM(sales), 2) AS revenue,
    ROUND(SUM(profit), 2) AS profit,
    ROUND(SUM(profit) / SUM(sales) * 100, 2) AS margin_pct
FROM orders
GROUP BY discount_bucket
ORDER BY MIN(discount);
