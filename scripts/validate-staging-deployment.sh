#!/bin/bash
# Validate staging deployment readiness
# Run this before pushing to staging to catch issues early

set -e  # Exit on error

echo "🔍 Validating staging deployment readiness..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Function to print error
error() {
    echo -e "${RED}❌ ERROR: $1${NC}"
    ERRORS=$((ERRORS + 1))
}

# Function to print warning
warning() {
    echo -e "${YELLOW}⚠️  WARNING: $1${NC}"
    WARNINGS=$((WARNINGS + 1))
}

# Function to print success
success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print info
info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Checking Schema Files"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if both schema files exist
if [ ! -f "prisma/schema-sqlite.prisma" ]; then
    error "prisma/schema-sqlite.prisma not found"
else
    success "SQLite schema exists"
fi

if [ ! -f "prisma/schema-postgres.prisma" ]; then
    error "prisma/schema-postgres.prisma not found"
else
    success "PostgreSQL schema exists"
fi

# Check if schemas are in sync (compare model definitions)
if [ -f "prisma/schema-sqlite.prisma" ] && [ -f "prisma/schema-postgres.prisma" ]; then
    # Extract model definitions (ignoring datasource/generator differences)
    SQLITE_MODELS=$(grep -A 1000 "^model " prisma/schema-sqlite.prisma | grep -v "provider\|url")
    POSTGRES_MODELS=$(grep -A 1000 "^model " prisma/schema-postgres.prisma | grep -v "provider\|url")

    if [ "$SQLITE_MODELS" != "$POSTGRES_MODELS" ]; then
        warning "Schema files may be out of sync - review model definitions"
        info "This is just a warning - some differences are expected (e.g., @db.Text vs String)"
    else
        success "Schema files appear to be in sync"
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. Checking Migration Files"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if migrations directory exists and has files
if [ ! -d "prisma/migrations" ]; then
    warning "No migrations directory found"
elif [ -z "$(ls -A prisma/migrations)" ]; then
    warning "Migrations directory is empty"
else
    MIGRATION_COUNT=$(find prisma/migrations -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')
    success "Found $MIGRATION_COUNT migration(s)"

    # Check if latest migration is committed
    if git diff --quiet HEAD -- prisma/migrations/; then
        success "All migrations are committed"
    else
        error "Uncommitted migrations found - commit them before deploying"
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. Checking Git Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "staging" ]; then
    warning "You are on branch '$CURRENT_BRANCH', not 'staging'"
    info "Make sure you intended to deploy from this branch"
else
    success "On staging branch"
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    error "Uncommitted changes detected - commit or stash them first"
    git status --short
else
    success "No uncommitted changes"
fi

# Check if branch is up to date with remote
if git rev-parse @{u} > /dev/null 2>&1; then
    LOCAL=$(git rev-parse @)
    REMOTE=$(git rev-parse @{u})
    BASE=$(git merge-base @ @{u})

    if [ "$LOCAL" = "$REMOTE" ]; then
        success "Branch is up to date with remote"
    elif [ "$LOCAL" = "$BASE" ]; then
        warning "Remote has changes you don't have - consider pulling first"
    elif [ "$REMOTE" = "$BASE" ]; then
        info "You have local commits to push"
    else
        warning "Branches have diverged - resolve conflicts before pushing"
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. Checking Environment Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if .env.local exists (for local database URL)
if [ -f ".env.local" ]; then
    success ".env.local exists"

    # Check for STAGING_DATABASE_URL
    if grep -q "STAGING_DATABASE_URL" .env.local; then
        success "STAGING_DATABASE_URL configured"
    else
        warning "STAGING_DATABASE_URL not found in .env.local"
    fi
else
    warning ".env.local not found - local environment may not be configured"
fi

# Check amplify.yml
if [ -f "amplify.yml" ]; then
    success "amplify.yml exists"

    # Check if it copies the PostgreSQL schema
    if grep -q "schema-postgres.prisma" amplify.yml; then
        success "amplify.yml configured to use PostgreSQL schema"
    else
        error "amplify.yml not configured to use PostgreSQL schema"
        info "Add: cp prisma/schema-postgres.prisma prisma/schema.prisma"
    fi
else
    error "amplify.yml not found - deployment may fail"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. Running Build Test (Optional)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$SKIP_BUILD_TEST" = "true" ]; then
    info "Skipping build test (SKIP_BUILD_TEST=true)"
else
    read -p "Run a local build test? This may take a few minutes. (y/N) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        info "Running build test..."

        # Save current schema
        if [ -f "prisma/schema.prisma" ]; then
            cp prisma/schema.prisma prisma/schema.prisma.backup
        fi

        # Copy PostgreSQL schema
        cp prisma/schema-postgres.prisma prisma/schema.prisma

        # Run build
        if npm run build 2>&1 | tee /tmp/build-test.log; then
            success "Build test passed!"
        else
            error "Build test failed - check errors above"
            ERRORS=$((ERRORS + 1))
        fi

        # Restore schema
        if [ -f "prisma/schema.prisma.backup" ]; then
            mv prisma/schema.prisma.backup prisma/schema.prisma
        else
            cp prisma/schema-sqlite.prisma prisma/schema.prisma
        fi
    else
        info "Skipping build test"
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Ready to deploy to staging.${NC}"
    echo ""
    echo "Next steps:"
    echo "  git push origin staging"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  $WARNINGS warning(s) found, but no errors.${NC}"
    echo ""
    read -p "Continue with deployment? (y/N) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}Proceeding with deployment...${NC}"
        echo "Run: git push origin staging"
        exit 0
    else
        echo "Deployment cancelled."
        exit 1
    fi
else
    echo -e "${RED}❌ $ERRORS error(s) found!${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠️  $WARNINGS warning(s) found.${NC}"
    fi
    echo ""
    echo "Please fix the errors above before deploying to staging."
    exit 1
fi
