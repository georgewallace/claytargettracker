#!/bin/bash
# Deploy to staging with database migrations
# This script creates and applies database migrations for staging deployment

set -e  # Exit on error

echo "🚀 Starting staging deployment process..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if migration name is provided
if [ -z "$1" ]; then
    echo -e "${RED}❌ Error: Migration name required${NC}"
    echo "Usage: npm run deploy:staging <migration-name>"
    echo "Example: npm run deploy:staging add-feature-toggles"
    exit 1
fi

MIGRATION_NAME="$1"

# Step 1: Ensure PostgreSQL schema is active
echo "📝 Step 1: Switching to PostgreSQL schema..."
if [ -f "prisma/schema-postgres.prisma" ]; then
    cp prisma/schema-postgres.prisma prisma/schema.prisma
    echo -e "${GREEN}✓ PostgreSQL schema activated${NC}"
else
    echo -e "${RED}❌ Error: schema-postgres.prisma not found${NC}"
    exit 1
fi
echo ""

# Step 2: Get staging database URL
echo "🔐 Step 2: Loading staging database credentials..."
STAGING_URL=$(grep STAGING_DATABASE_URL .env.local | cut -d '=' -f2- | tr -d '"')

if [ -z "$STAGING_URL" ]; then
    echo -e "${RED}❌ Error: STAGING_DATABASE_URL not found in .env.local${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Staging credentials loaded${NC}"
echo ""

# Step 3: Create migration
echo "📦 Step 3: Creating migration: $MIGRATION_NAME"
DATABASE_URL="$STAGING_URL" npx prisma migrate dev --name "$MIGRATION_NAME"
echo ""

# Step 4: Apply migration to staging
echo "🔄 Step 4: Applying migration to staging database..."
DATABASE_URL="$STAGING_URL" npx prisma migrate deploy
echo -e "${GREEN}✓ Migration applied to staging${NC}"
echo ""

# Step 5: Regenerate Prisma client
echo "⚙️  Step 5: Regenerating Prisma client..."
npx prisma generate
echo -e "${GREEN}✓ Prisma client regenerated${NC}"
echo ""

# Step 6: Ask if user wants to commit and push
echo "📤 Step 6: Git commit and push"
read -p "Do you want to commit migration files and push to trigger deployment? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Add migration files
    git add prisma/migrations/
    git add prisma/schema-postgres.prisma

    # Commit with descriptive message
    git commit -m "Database migration: $MIGRATION_NAME"

    # Push to trigger deployment
    echo "Pushing to staging branch..."
    CURRENT_BRANCH=$(git branch --show-current)
    git push origin "$CURRENT_BRANCH"

    echo -e "${GREEN}✓ Changes committed and pushed${NC}"
else
    echo -e "${YELLOW}⚠️  Skipped git commit/push${NC}"
    echo "You can commit manually later with:"
    echo "  git add prisma/migrations/ prisma/schema-postgres.prisma"
    echo "  git commit -m 'Database migration: $MIGRATION_NAME'"
    echo "  git push"
fi
echo ""

# Step 7: Restore SQLite schema for local development
echo "🔄 Step 7: Restoring SQLite schema for local development..."
if [ -f "prisma/schema-sqlite.prisma" ]; then
    cp prisma/schema-sqlite.prisma prisma/schema.prisma
    echo -e "${GREEN}✓ SQLite schema restored${NC}"
fi
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Staging deployment process complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Summary:"
echo "  • Migration created: $MIGRATION_NAME"
echo "  • Applied to staging database"
echo "  • Local environment restored"
echo ""
echo "Next steps:"
echo "  1. Monitor staging deployment (if auto-deploys on git push)"
echo "  2. Test the changes on staging"
echo "  3. Verify database changes are working correctly"
echo ""
