#!/bin/bash
set -e

# Use PostgreSQL 17 tools
PG_DUMP="/opt/homebrew/opt/postgresql@17/bin/pg_dump"
PSQL="/opt/homebrew/opt/postgresql@17/bin/psql"

echo "=== Copying Production Data to Staging ==="
echo ""
echo "This script will:"
echo "1. Export data from production database"
echo "2. Import data into staging database"
echo ""

# Check if pg_dump and psql are available
if [ ! -f "$PG_DUMP" ]; then
    echo "ERROR: pg_dump not found at $PG_DUMP"
    echo "Please install PostgreSQL 17 client tools:"
    echo "  brew install postgresql@17"
    exit 1
fi

echo "Using pg_dump version:"
$PG_DUMP --version

# Get connection strings
read -p "Enter PRODUCTION database URL: " PROD_URL
read -p "Enter STAGING database URL: " STAGING_URL

echo ""
echo "Step 1: Dumping production database..."
$PG_DUMP "$PROD_URL" --no-owner --no-acl --clean --if-exists > prod_dump.sql

echo "Step 2: Importing into staging database..."
$PSQL "$STAGING_URL" < prod_dump.sql

echo ""
echo "✅ Production data successfully copied to staging!"
echo ""
echo "Cleaning up dump file..."
rm prod_dump.sql

echo "✅ Done!"
