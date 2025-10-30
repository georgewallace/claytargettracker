#!/bin/bash
# Apply schema changes to staging PostgreSQL database
# Creates and applies migrations

echo "🔄 Applying migrations to staging PostgreSQL database..."

# Use PostgreSQL schema (the current one)
if [ -f "prisma/schema-postgres.prisma" ]; then
    cp prisma/schema-postgres.prisma prisma/schema.prisma
fi

# Get staging database URL from .env.local
STAGING_URL=$(grep STAGING_DATABASE_URL .env.local | cut -d '=' -f2- | tr -d '"')

if [ -z "$STAGING_URL" ]; then
    echo "❌ Error: STAGING_DATABASE_URL not found in .env.local"
    exit 1
fi

# Apply pending migrations
DATABASE_URL="$STAGING_URL" npx prisma migrate deploy

# Regenerate client
npx prisma generate

echo "✅ Staging database migrated!"

