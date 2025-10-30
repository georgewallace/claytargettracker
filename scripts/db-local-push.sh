#!/bin/bash
# Push schema changes to local SQLite database
# Use this for local development instead of migrations

echo "🔄 Pushing schema to local SQLite database..."

# Copy SQLite schema to main schema
cp prisma/schema-sqlite.prisma prisma/schema.prisma

# Push to database (no migration files created)
DATABASE_URL="file:./prisma/dev.db" npx prisma db push

# Regenerate client
npx prisma generate

echo "✅ Local database updated!"
echo "💡 Remember: This doesn't create migration files"
echo "💡 For staging/production, use: npm run db:migrate:staging"

