# Deployment Guide

This guide explains how to deploy database changes to staging when using Prisma with SQLite locally and PostgreSQL in staging.

## Quick Start

When you make database schema changes, use this single command to deploy to staging:

```bash
npm run deploy:staging <migration-name>
```

Example:
```bash
npm run deploy:staging add-user-preferences
```

## What This Does

The `deploy:staging` script automates the entire deployment process:

1. ✅ Switches to PostgreSQL schema
2. ✅ Creates a migration file
3. ✅ Applies migration to staging database
4. ✅ Regenerates Prisma client
5. ✅ Optionally commits and pushes to git
6. ✅ Restores SQLite schema for local development

## Workflow

### Making Schema Changes

1. **Edit the SQLite schema** (for local development):
   ```bash
   # Edit this file:
   prisma/schema-sqlite.prisma
   ```

2. **Test locally**:
   ```bash
   npm run db:push
   ```

3. **Make the same changes to PostgreSQL schema**:
   ```bash
   # Edit this file to match your SQLite changes:
   prisma/schema-postgres.prisma
   ```

4. **Deploy to staging**:
   ```bash
   npm run deploy:staging <descriptive-migration-name>
   ```

5. **When prompted, choose to commit and push** (or do it manually later)

### Example: Adding a New Field

```bash
# 1. Edit schema-sqlite.prisma
# Add: favoriteColor String?

# 2. Test locally
npm run db:push

# 3. Edit schema-postgres.prisma
# Add the same field: favoriteColor String?

# 4. Deploy to staging
npm run deploy:staging add-user-favorite-color

# 5. Say 'y' when asked to commit/push
```

## Available Commands

### For Local Development (SQLite)
```bash
npm run db:push              # Apply schema changes to local DB (no migration files)
npm run db:studio            # Open Prisma Studio
npm run db:seed              # Seed test data
```

### For Staging (PostgreSQL)
```bash
npm run deploy:staging <name>        # Full deployment workflow (recommended)
npm run db:create:migration <name>   # Create migration only (manual workflow)
npm run db:migrate:staging           # Apply existing migrations only
```

## Manual Workflow (Alternative)

If you prefer manual control:

```bash
# 1. Create migration
npm run db:create:migration add-new-field

# 2. Apply to staging
npm run db:migrate:staging

# 3. Commit migration files
git add prisma/migrations/ prisma/schema-postgres.prisma
git commit -m "Migration: add-new-field"
git push
```

## Migration Files

Migrations are stored in:
```
prisma/migrations/
  └─ 20241211123456_add_user_preferences/
     └─ migration.sql
```

**Important:** Always commit migration files to git! They're needed for:
- Applying changes to staging/production
- Tracking database evolution
- Rolling back if needed

## Troubleshooting

### "STAGING_DATABASE_URL not found"
Add your staging database URL to `.env.local`:
```env
STAGING_DATABASE_URL="postgresql://user:password@host:5432/database"
```

### Schema out of sync
If you get schema mismatch errors:
1. Make sure both `schema-sqlite.prisma` and `schema-postgres.prisma` have the same changes
2. Run `npm run db:push` locally first to test
3. Then run `npm run deploy:staging`

### Migration conflicts
If multiple people are working on schemas:
1. Pull latest migrations: `git pull`
2. Apply to your staging: `npm run db:migrate:staging`
3. Create your new migration: `npm run deploy:staging`

## Best Practices

1. ✅ **Always test locally first** with `npm run db:push`
2. ✅ **Use descriptive migration names** (e.g., "add-user-email-verification")
3. ✅ **Commit migration files** to git
4. ✅ **Update both schemas** (SQLite and PostgreSQL) with the same changes
5. ✅ **Review migration SQL** before applying to production

## Schema Files

- **`schema-sqlite.prisma`** - Local development (SQLite)
- **`schema-postgres.prisma`** - Staging/Production (PostgreSQL)
- **`schema.prisma`** - Auto-generated, don't edit directly

The deployment scripts automatically copy the right schema file to `schema.prisma` when needed.

## Production Deployment

For production, use the same process but with production database URL:
```bash
# Add to .env.local or .env.production:
PRODUCTION_DATABASE_URL="postgresql://..."

# Then modify scripts to use PRODUCTION_DATABASE_URL
```

---

**Need Help?** Check the Prisma docs: https://www.prisma.io/docs/concepts/components/prisma-migrate
