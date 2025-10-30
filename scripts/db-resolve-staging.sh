#!/bin/bash
# Resolve migration drift issues on staging
# This marks migrations as applied without actually running them
# Use when your database already has the changes but migration history is out of sync

echo "🔧 Resolving migration drift on staging database..."

# Use PostgreSQL schema
if [ -f "prisma/schema-postgres.prisma" ]; then
    cp prisma/schema-postgres.prisma prisma/schema.prisma
fi

# Get staging database URL
STAGING_URL=$(grep STAGING_DATABASE_URL .env.local | cut -d '=' -f2- | tr -d '"')

if [ -z "$STAGING_URL" ]; then
    echo "❌ Error: STAGING_DATABASE_URL not found in .env.local"
    exit 1
fi

echo "This will mark all migrations as applied without running them."
echo "Use this only when your database already has the schema changes."
echo ""

# Mark migrations as applied
DATABASE_URL="$STAGING_URL" npx prisma migrate resolve --applied 20251024212402_add_tournament_discipline_config

# Try to apply new migrations
DATABASE_URL="$STAGING_URL" npx prisma migrate deploy

# Regenerate client
npx prisma generate

echo "✅ Migration drift resolved!"

