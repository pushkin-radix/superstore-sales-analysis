"""
02_eda_and_export.py
Performs exploratory data analysis on the cleaned Superstore data
and exports all findings as JSON for the interactive dashboard.
"""

import pandas as pd
import sqlite3
import json

DB_PATH = "../data/superstore.db"
OUTPUT_PATH = "../dashboard/data.json"


def main():
    conn = sqlite3.connect(DB_PATH)
    df = pd.read_sql("SELECT * FROM orders", conn)
    conn.close()

    df["order_date"] = pd.to_datetime(df["order_date"])

    output = {}

    # --- KPIs ---
    output["kpis"] = {
        "total_orders": int(df["order_id"].nunique()),
        "total_revenue": round(df["sales"].sum(), 2),
        "total_profit": round(df["profit"].sum(), 2),
        "margin_pct": round(df["profit"].sum() / df["sales"].sum() * 100, 2),
        "avg_order_value": round(df["sales"].sum() / df["order_id"].nunique(), 2),
        "total_customers": int(df["customer_id"].nunique()),
        "date_range": f"{df['order_date'].min().strftime('%b %Y')} – {df['order_date'].max().strftime('%b %Y')}",
    }

    # --- Revenue by year ---
    yearly = df.groupby("order_year").agg(
        revenue=("sales", "sum"), profit=("profit", "sum"), orders=("order_id", "nunique")
    ).reset_index()
    yearly["yoy_growth_pct"] = (yearly["revenue"].pct_change() * 100).round(2)
    output["yearly"] = yearly.round(2).to_dict(orient="records")

    # --- Monthly trend (for line chart) ---
    monthly = df.groupby("order_year_month").agg(revenue=("sales", "sum")).reset_index()
    monthly = monthly.sort_values("order_year_month")
    monthly["mom_growth_pct"] = (monthly["revenue"].pct_change() * 100).round(2)
    output["monthly"] = monthly.round(2).to_dict(orient="records")

    # --- Category / sub-category performance ---
    cat = df.groupby(["category", "sub_category"]).agg(
        revenue=("sales", "sum"), profit=("profit", "sum"), orders=("order_id", "nunique"),
        avg_discount_pct=("discount", "mean")
    ).reset_index()
    cat["margin_pct"] = (cat["profit"] / cat["revenue"] * 100).round(2)
    cat["avg_discount_pct"] = (cat["avg_discount_pct"] * 100).round(1)
    cat = cat.sort_values("revenue", ascending=False)
    output["categories"] = cat.round(2).to_dict(orient="records")

    # --- Category totals (for pie/donut) ---
    cat_totals = df.groupby("category").agg(revenue=("sales", "sum"), profit=("profit", "sum")).reset_index()
    output["category_totals"] = cat_totals.round(2).to_dict(orient="records")

    # --- Top 10 products ---
    top_products = df.groupby(["product_name", "category"]).agg(
        revenue=("sales", "sum"), profit=("profit", "sum"), units=("quantity", "sum")
    ).reset_index().sort_values("revenue", ascending=False).head(10)
    output["top_products"] = top_products.round(2).to_dict(orient="records")

    # --- Regional performance ---
    regional = df.groupby("region").agg(
        revenue=("sales", "sum"), profit=("profit", "sum"), customers=("customer_id", "nunique"),
        orders=("order_id", "nunique")
    ).reset_index()
    regional["margin_pct"] = (regional["profit"] / regional["revenue"] * 100).round(2)
    output["regional"] = regional.round(2).sort_values("revenue", ascending=False).to_dict(orient="records")

    # --- Segment analysis ---
    segment = df.groupby("segment").agg(
        revenue=("sales", "sum"), customers=("customer_id", "nunique"), orders=("order_id", "nunique")
    ).reset_index()
    segment["revenue_per_customer"] = (segment["revenue"] / segment["customers"]).round(2)
    output["segments"] = segment.round(2).sort_values("revenue", ascending=False).to_dict(orient="records")

    # --- Top 10 customers ---
    top_customers = df.groupby(["customer_name", "segment", "region"]).agg(
        revenue=("sales", "sum"), profit=("profit", "sum"), orders=("order_id", "nunique")
    ).reset_index().sort_values("revenue", ascending=False).head(10)
    output["top_customers"] = top_customers.round(2).to_dict(orient="records")

    # --- Unprofitable sub-categories ---
    unprofitable = cat[cat["profit"] < 0].sort_values("profit")
    output["unprofitable"] = unprofitable.round(2).to_dict(orient="records")

    # --- Discount impact buckets ---
    def discount_bucket(d):
        if d == 0:
            return "0% (no discount)"
        elif d <= 0.2:
            return "1-20%"
        elif d <= 0.4:
            return "21-40%"
        else:
            return "40%+"

    df["discount_bucket"] = df["discount"].apply(discount_bucket)
    discount_impact = df.groupby("discount_bucket").agg(
        orders=("order_id", "nunique"), revenue=("sales", "sum"), profit=("profit", "sum")
    ).reset_index()
    discount_impact["margin_pct"] = (discount_impact["profit"] / discount_impact["revenue"] * 100).round(2)
    bucket_order = {"0% (no discount)": 0, "1-20%": 1, "21-40%": 2, "40%+": 3}
    discount_impact["sort"] = discount_impact["discount_bucket"].map(bucket_order)
    discount_impact = discount_impact.sort_values("sort").drop(columns="sort")
    output["discount_impact"] = discount_impact.round(2).to_dict(orient="records")

    # --- Shipping mode ---
    ship = df.groupby("ship_mode").agg(
        avg_days=("shipping_days", "mean"), orders=("order_id", "nunique"), revenue=("sales", "sum")
    ).reset_index()
    output["shipping"] = ship.round(2).to_dict(orient="records")

    # Save (replace NaN with None so it serializes as valid JSON null)
    import math

    def clean_nan(obj):
        if isinstance(obj, float) and math.isnan(obj):
            return None
        if isinstance(obj, dict):
            return {k: clean_nan(v) for k, v in obj.items()}
        if isinstance(obj, list):
            return [clean_nan(v) for v in obj]
        return obj

    output = clean_nan(output)

    with open(OUTPUT_PATH, "w") as f:
        json.dump(output, f, indent=2, default=str)

    print(f"Exported dashboard data to {OUTPUT_PATH}")
    print(f"\nKPIs: {output['kpis']}")


if __name__ == "__main__":
    main()
