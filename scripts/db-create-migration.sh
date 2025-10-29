#!/bin/bash
# Create a new migration file (for PostgreSQL/staging)
# This creates migration files that can be applied to staging/production

if [ -z "$1" ]; then
    echo "❌ Error: Migration name required"
    echo "Usage: npm run db:create:migration your-migration-name"
    exit 1
fi

echo "📝 Creating migration: $1"

# Ensure we're using PostgreSQL schema
if [ -f "prisma/schema-postgres.prisma" ]; then
    cp prisma/schema-postgres.prisma prisma/schema.prisma
fi

# Get staging database URL
STAGING_URL=$(grep STAGING_DATABASE_URL .env.local | cut -d '=' -f2- | tr -d '"')

if [ -z "$STAGING_URL" ]; then
    echo "❌ Error: STAGING_DATABASE_URL not found in .env.local"
    exit 1
fi

# Create migration
DATABASE_URL="$STAGING_URL" npx prisma migrate dev --name "$1"

# Regenerate client
npx prisma generate

echo "✅ Migration created: $1"
echo "💡 Apply to staging with: npm run db:migrate:staging"

