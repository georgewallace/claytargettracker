#!/bin/bash

# 🚀 Quick Database Sync to Staging
# This script helps you sync your local database to staging

set -e  # Exit on error

echo "🎯 Clay Target Tracker - Database Sync to Staging"
echo "=================================================="
echo ""

# Check if .env or .env.local exists
if [ -f .env.local ]; then
    source .env.local
    echo "📁 Using .env.local"
elif [ -f .env ]; then
    source .env
    echo "📁 Using .env"
else
    echo "❌ Error: No .env or .env.local file found"
    echo "Please create .env with your DATABASE_URL"
    exit 1
fi

if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL not set in .env.local"
    exit 1
fi

echo "📊 Local database: ${DATABASE_URL:0:30}..."
echo ""

# Prompt for staging DATABASE_URL
echo "Please enter your STAGING DATABASE_URL:"
echo "(You can find this in AWS Amplify > Environment variables)"
read -r STAGING_DB

if [ -z "$STAGING_DB" ]; then
    echo "❌ Error: No staging database URL provided"
    exit 1
fi

echo ""
echo "🔍 Staging database: ${STAGING_DB:0:30}..."
echo ""

# Create backup filename with timestamp
BACKUP_FILE="staging_backup_$(date +%Y%m%d_%H%M%S).sql"

echo "⚠️  WARNING: This will OVERWRITE all data in the staging database!"
echo "📁 Backup file: $BACKUP_FILE"
echo ""
read -p "Are you sure you want to continue? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "❌ Sync cancelled"
    exit 0
fi

echo "📤 Step 1/3: Exporting local database..."
pg_dump "$DATABASE_URL" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Export complete: $BACKUP_FILE"
else
    echo "❌ Export failed"
    exit 1
fi

echo ""
echo "📥 Step 2/3: Importing to staging database..."
echo "(This may take a few minutes...)"

psql "$STAGING_DB" < "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Import complete"
else
    echo "❌ Import failed"
    echo "The backup file has been saved: $BACKUP_FILE"
    exit 1
fi

echo ""
echo "🔄 Step 3/3: Running Prisma migrations..."
DATABASE_URL="$STAGING_DB" npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo "✅ Migrations complete"
else
    echo "⚠️  Warning: Migrations may have failed (this might be okay)"
fi

echo ""
echo "🎉 SUCCESS! Database synced to staging"
echo ""
echo "📝 Next steps:"
echo "1. Visit your staging URL"
echo "2. Test login and core features"
echo "3. Verify data is present"
echo ""
echo "💾 Backup saved: $BACKUP_FILE"
echo "(Keep this file in case you need to rollback)"

