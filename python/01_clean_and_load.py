"""
01_clean_and_load.py
Cleans the raw Superstore CSV and loads it into a SQLite database
for SQL-based analysis. This mirrors a real analyst workflow:
raw extract -> cleaning -> structured database -> querying.
"""

import pandas as pd
import sqlite3
import os

RAW_PATH = "../data/superstore.csv"
DB_PATH = "../data/superstore.db"
CLEAN_CSV_PATH = "../data/superstore_clean.csv"

def main():
    print("Loading raw data...")
    df = pd.read_csv(RAW_PATH, encoding="latin-1")
    print(f"Raw shape: {df.shape}")

    # --- Cleaning steps ---

    # 1. Drop rows that are entirely empty across key business fields
    #    (806 rows in the raw file have no order/customer/product data at all)
    before = len(df)
    df = df.dropna(subset=["Order ID", "Order Date", "Sales"])
    print(f"Dropped {before - len(df)} rows with missing core fields")

    # 2. Standardize column names (snake_case, no spaces) for SQL friendliness
    df.columns = [
        c.strip().lower().replace(" ", "_").replace("-", "_")
        for c in df.columns
    ]

    # 3. Parse dates properly
    df["order_date"] = pd.to_datetime(df["order_date"], format="%m/%d/%Y", errors="coerce")
    df["ship_date"] = pd.to_datetime(df["ship_date"], format="%m/%d/%Y", errors="coerce")

    # 4. Drop any rows where date parsing still failed
    before = len(df)
    df = df.dropna(subset=["order_date"])
    print(f"Dropped {before - len(df)} rows with unparseable dates")

    # 5. Deduplicate exact duplicate rows
    before = len(df)
    df = df.drop_duplicates()
    print(f"Dropped {before - len(df)} exact duplicate rows")

    # 6. Add derived time columns used throughout the analysis
    df["order_year"] = df["order_date"].dt.year
    df["order_month"] = df["order_date"].dt.month
    df["order_year_month"] = df["order_date"].dt.to_period("M").astype(str)

    # 7. Add derived business metrics
    df["profit_margin"] = (df["profit"] / df["sales"]).round(4)
    df["shipping_days"] = (df["ship_date"] - df["order_date"]).dt.days

    # 8. Sanity-cap: remove negative/zero sales rows (data entry errors)
    before = len(df)
    df = df[df["sales"] > 0]
    print(f"Dropped {before - len(df)} rows with non-positive sales")

    print(f"\nFinal cleaned shape: {df.shape}")
    print(f"Date range: {df['order_date'].min().date()} to {df['order_date'].max().date()}")

    # Save cleaned CSV (useful as a standalone deliverable)
    df.to_csv(CLEAN_CSV_PATH, index=False)
    print(f"\nSaved cleaned CSV to {CLEAN_CSV_PATH}")

    # Load into SQLite for SQL analysis
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
    conn = sqlite3.connect(DB_PATH)
    df.to_sql("orders", conn, index=False, if_exists="replace")
    conn.close()
    print(f"Loaded into SQLite database at {DB_PATH}")

    # Quick validation query
    conn = sqlite3.connect(DB_PATH)
    result = pd.read_sql("SELECT COUNT(*) as row_count, SUM(sales) as total_sales FROM orders", conn)
    conn.close()
    print("\nValidation check:")
    print(result)


if __name__ == "__main__":
    main()
