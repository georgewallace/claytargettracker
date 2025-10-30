# Database Migration Guide for Staging Deployments

**⚠️ IMPORTANT: Follow this process when deploying schema changes to staging.**

## Workflow Overview

This project uses:
- **SQLite** for local development (fast iteration)
- **PostgreSQL** for staging and production (robust, scalable)

## Required Steps Before Deploying to Staging

### 1. Create Migration Files

If you've made schema changes, you **MUST** create a migration file:

```bash
npm run db:create:migration descriptive_name
```

**Example migration names:**
- `add_team_logo`
- `add_user_roles`
- `update_tournament_fields`

This command will:
- Switch to the PostgreSQL schema
- Connect to staging database
- Create a migration file in `prisma/migrations/`
- Apply the migration to staging immediately

### 2. Apply Migration to Staging

If migrations already exist but haven't been applied:

```bash
npm run db:migrate:staging
```

This ensures all pending migrations are applied to the staging PostgreSQL database.

### 3. Verify Migration Success

Check the output for:
- ✅ "All migrations have been successfully applied"
- ❌ Any error messages about drift or conflicts

### 4. Commit Migration Files

**CRITICAL:** Always commit the migration files:

```bash
git add prisma/migrations/
git commit -m "Add database migration: descriptive_name"
```

Without committing migrations, production deployments will fail.

### 5. Push to Staging

```bash
git push origin staging
```

## Migration Drift Issues

If you see an error about "drift detected" or "migration already applied":

```bash
# This script will resolve drift automatically
npm run db:create:migration your_change_name
```

The script handles:
- Marking existing changes as applied
- Creating new migration files
- Syncing migration history

## Local Development Workflow

For local development, use the simpler push workflow:

```bash
# Edit prisma/schema-sqlite.prisma
npm run db:push    # Fast, no migration files
npm run dev        # Continue developing
```

**Note:** `npm run db:push` does NOT create migration files. It's only for local development.

## Pre-Deployment Checklist

Before pushing to staging, verify:

- [ ] Schema changes made to both `prisma/schema-sqlite.prisma` AND `prisma/schema-postgres.prisma`
- [ ] Tested changes locally with `npm run db:push`
- [ ] Created migration with `npm run db:create:migration <name>`
- [ ] Applied migration to staging with `npm run db:migrate:staging`
- [ ] Migration files committed to git
- [ ] No migration errors in console output
- [ ] Prisma client regenerated (happens automatically in scripts)

## Common Errors and Solutions

### Error: "Unknown argument `fieldName`"

**Cause:** Prisma client not regenerated after schema change.

**Solution:**
```bash
npm run db:create:migration add_field_name
npm run db:migrate:staging
```

### Error: "Migration failed - column already exists"

**Cause:** Database has changes that don't match migration history (drift).

**Solution:**
```bash
# Resolve the drift
bash scripts/db-resolve-staging.sh

# Then create your new migration
npm run db:create:migration your_change_name
```

### Error: "Migration not found"

**Cause:** Migration files not committed or lost.

**Solution:**
- Check `prisma/migrations/` directory
- Commit any missing migration files
- Recreate migration if necessary

### Error: "Database URL not found"

**Cause:** `STAGING_DATABASE_URL` not in `.env.local`

**Solution:**
- Verify `.env.local` contains `STAGING_DATABASE_URL`
- Check the URL format: `postgresql://user:pass@host/dbname`

## Environment Variables

Ensure `.env.local` contains:

```env
# Local development (SQLite)
DATABASE_URL="file:./prisma/dev.db"

# Staging (PostgreSQL)
STAGING_DATABASE_URL="postgresql://..."

# Production (PostgreSQL)
PRODUCTION_DATABASE_URL="postgresql://..."
```

## Schema File Management

### Two Schema Files

1. **`prisma/schema-sqlite.prisma`** - Local development
   - Uses `provider = "sqlite"`
   - All standard Prisma features

2. **`prisma/schema-postgres.prisma`** - Staging/Production
   - Uses `provider = "postgresql"`
   - May have PostgreSQL-specific features

### Keep Schemas in Sync

When making changes:
1. Edit **both** schema files
2. Keep them identical except for the provider
3. Test with SQLite locally first
4. Create migration for PostgreSQL

### Active Schema

`prisma/schema.prisma` is automatically managed by scripts:
- Local scripts → copy from `schema-sqlite.prisma`
- Staging scripts → copy from `schema-postgres.prisma`

**Do not edit `schema.prisma` directly** - it will be overwritten.

## Quick Reference

| Task | Command |
|------|---------|
| Local schema push | `npm run db:push` |
| Create migration | `npm run db:create:migration <name>` |
| Apply to staging | `npm run db:migrate:staging` |
| Fix drift issues | `bash scripts/db-resolve-staging.sh` |
| Open database UI | `npm run db:studio` |
| Regenerate client | `npm run db:generate` |

## Best Practices

1. **Always test locally first** - Use `npm run db:push` to verify changes work
2. **Descriptive migration names** - Use clear names that describe the change
3. **One feature per migration** - Don't bundle unrelated changes
4. **Commit migrations immediately** - Don't let migration files go uncommitted
5. **Review migration SQL** - Check `prisma/migrations/*/migration.sql` before deploying
6. **Backup before major changes** - Especially for production deployments
7. **Keep schemas in sync** - Edit both SQLite and PostgreSQL schemas together

## Troubleshooting Flow

```
Schema change needed
    ↓
Edit schema-sqlite.prisma + schema-postgres.prisma
    ↓
Test locally: npm run db:push
    ↓
Works? → YES → Create migration: npm run db:create:migration <name>
    ↓              ↓
    NO ← Fix issues
                   ↓
              Migration successful?
                   ↓
              YES → Commit: git add prisma/migrations/
                   ↓
                   Deploy: git push origin staging
                   ↓
              NO → Check error
                   ↓
                   Drift? → npm run db:create:migration <name>
                   ↓
                   Other? → Review error message and fix
```

## Additional Resources

- Full workflow guide: `DATABASE_WORKFLOW.md`
- Prisma documentation: https://www.prisma.io/docs/
- Migration reference: https://www.prisma.io/docs/concepts/components/prisma-migrate

---

**Remember:** Schema changes require migrations for staging/production. Always run `npm run db:create:migration` before deploying!

