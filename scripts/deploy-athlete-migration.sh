#!/bin/bash
# Deploy the Shooter -> Athlete migration to staging
# This script includes safety checks and rollback capability

set -e  # Exit on error

echo "🚀 Athlete Migration Deployment Script"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if STAGING_DATABASE_URL is set
if [ -z "$STAGING_DATABASE_URL" ]; then
  echo -e "${RED}❌ Error: STAGING_DATABASE_URL environment variable not set${NC}"
  echo "Please set it in .env.local and source it"
  exit 1
fi

echo "✅ Environment variables loaded"
echo ""

# Step 1: Backup current database
echo "📦 Step 1: Creating database backup..."
echo "⚠️  IMPORTANT: Make sure you have a recent backup of your staging database!"
read -p "Do you have a recent backup? (yes/no): " -n 3 -r
echo
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
  echo -e "${RED}❌ Deployment cancelled. Please create a backup first.${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Backup confirmed${NC}"
echo ""

# Step 2: Test database connection
echo "🔌 Step 2: Testing database connection..."
npx prisma db execute --schema prisma/schema-postgres.prisma --stdin <<< "SELECT 1;" > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Database connection successful${NC}"
else
  echo -e "${RED}❌ Database connection failed${NC}"
  exit 1
fi
echo ""

# Step 3: Check current schema
echo "🔍 Step 3: Checking current database schema..."
echo "Looking for Shooter table..."
SHOOTER_EXISTS=$(npx prisma db execute --schema prisma/schema-postgres.prisma --stdin <<< "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Shooter');" 2>&1 | grep -o 't\|f' || echo 'f')
if [ "$SHOOTER_EXISTS" = "t" ]; then
  echo -e "${GREEN}✅ Shooter table found - migration needed${NC}"
else
  echo -e "${YELLOW}⚠️  Shooter table not found - checking for Athlete table...${NC}"
  ATHLETE_EXISTS=$(npx prisma db execute --schema prisma/schema-postgres.prisma --stdin <<< "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Athlete');" 2>&1 | grep -o 't\|f' || echo 'f')
  if [ "$ATHLETE_EXISTS" = "t" ]; then
    echo -e "${YELLOW}⚠️  Athlete table already exists - migration may have already been applied${NC}"
    read -p "Continue anyway? (yes/no): " -n 3 -r
    echo
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
      echo "Deployment cancelled"
      exit 0
    fi
  fi
fi
echo ""

# Step 4: Show migration summary
echo "📋 Step 4: Migration Summary"
echo "----------------------------"
echo "This migration will:"
echo "  • Rename 'Shooter' table → 'Athlete'"
echo "  • Rename 'ShooterAverage' table → 'AthleteAverage'"
echo "  • Rename 'shooterId' columns → 'athleteId' in:"
echo "    - SquadMember"
echo "    - Registration"
echo "    - Shoot"
echo "    - TeamJoinRequest"
echo "    - AthleteAverage"
echo "  • Update all indexes and constraints"
echo ""
echo -e "${YELLOW}⚠️  This is a STRUCTURAL change to the database${NC}"
echo -e "${YELLOW}⚠️  All foreign keys and indexes will be recreated${NC}"
echo ""

# Step 5: Confirmation
read -p "Are you ready to proceed with the migration? (yes/no): " -n 3 -r
echo
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
  echo "Deployment cancelled"
  exit 0
fi
echo ""

# Step 6: Run the migration
echo "🔄 Step 6: Running migration..."
echo "Copying postgres schema to main schema.prisma..."
cp prisma/schema-postgres.prisma prisma/schema.prisma

echo "Applying migration..."
npx prisma migrate deploy --schema prisma/schema.prisma

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Migration applied successfully!${NC}"
else
  echo -e "${RED}❌ Migration failed!${NC}"
  echo -e "${YELLOW}To rollback, run:${NC}"
  echo "psql \$STAGING_DATABASE_URL < prisma/migrations/20251212084500_rename_shooter_to_athlete/rollback.sql"
  exit 1
fi
echo ""

# Step 7: Verify migration
echo "🔍 Step 7: Verifying migration..."
ATHLETE_EXISTS=$(npx prisma db execute --schema prisma/schema.prisma --stdin <<< "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Athlete');" 2>&1 | grep -o 't\|f' || echo 'f')
SHOOTER_EXISTS=$(npx prisma db execute --schema prisma/schema.prisma --stdin <<< "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Shooter');" 2>&1 | grep -o 't\|f' || echo 'f')

if [ "$ATHLETE_EXISTS" = "t" ] && [ "$SHOOTER_EXISTS" = "f" ]; then
  echo -e "${GREEN}✅ Verification successful!${NC}"
  echo "  ✅ Athlete table exists"
  echo "  ✅ Shooter table removed"
else
  echo -e "${RED}❌ Verification failed!${NC}"
  echo "  Athlete table exists: $ATHLETE_EXISTS"
  echo "  Shooter table exists: $SHOOTER_EXISTS"
  exit 1
fi
echo ""

# Step 8: Restore local schema
echo "🔄 Step 8: Restoring local SQLite schema..."
cp prisma/schema-sqlite.prisma prisma/schema.prisma
echo -e "${GREEN}✅ Local schema restored${NC}"
echo ""

# Step 9: Deploy updated code to Amplify
echo "🚀 Step 9: Deploy to AWS Amplify"
echo "Run the following command to deploy the updated code:"
echo ""
echo -e "${YELLOW}git add .${NC}"
echo -e "${YELLOW}git commit -m 'feat: Migrate Shooter to Athlete model'${NC}"
echo -e "${YELLOW}git push origin staging${NC}"
echo ""

echo "========================================="
echo -e "${GREEN}✅ Migration deployment complete!${NC}"
echo "========================================="
echo ""
echo "Next steps:"
echo "  1. Test the staging application thoroughly"
echo "  2. Verify all features work with the new Athlete model"
echo "  3. Check logs for any errors"
echo ""
echo "If you need to rollback:"
echo "  psql \$STAGING_DATABASE_URL < prisma/migrations/20251212084500_rename_shooter_to_athlete/rollback.sql"
echo ""
