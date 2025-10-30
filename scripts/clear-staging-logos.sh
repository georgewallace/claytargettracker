#!/bin/bash
# Clear large team logos from staging database

echo "🔍 Clearing team logos from staging database..."

# Use the staging DATABASE_URL from environment or prompt
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable not set"
  echo "Please set your staging DATABASE_URL:"
  echo "  export DATABASE_URL='postgresql://...'"
  exit 1
fi

# Run the clear script with staging database
npx tsx scripts/clear-large-logos.ts

echo "✅ Done! You can now re-upload a compressed logo (max 500KB)"
