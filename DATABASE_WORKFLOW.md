# Database Development Workflow

This document explains how to work with SQLite locally and PostgreSQL for staging/production.

## Overview

- **Local Development**: Uses **SQLite** for fast, file-based development
- **Staging/Production**: Uses **PostgreSQL** for production deployments

## Quick Reference

### Local Development (SQLite)

```bash
# Push schema changes to local SQLite DB
npm run db:push

# Open Prisma Studio to view data
npm run db:studio

# Seed test data
npm run db:seed
```

### Staging Deployment (PostgreSQL)

```bash
# Create a migration file (when you change schema)
npm run db:create:migration add_team_logo

# Apply migrations to staging database
npm run db:migrate:staging
```

## Detailed Workflows

### 1. Local Development Workflow

When developing locally, you use SQLite with `db:push`:

```bash
# 1. Make changes to prisma/schema-sqlite.prisma
# 2. Push changes to your local SQLite database
npm run db:push

# 3. Continue developing
npm run dev
```

**What happens:**
- Schema changes are pushed directly to `prisma/dev.db`
- No migration files are created
- Prisma client is regenerated
- Fast iteration for development

### 2. Deploying to Staging Workflow

When you're ready to deploy changes to staging:

```bash
# 1. Make sure your PostgreSQL schema matches SQLite
#    (schema-postgres.prisma should already have your changes)

# 2. Create a migration file
npm run db:create:migration add_your_feature_name

# 3. Apply the migration to staging
npm run db:migrate:staging

# 4. Commit the migration files
git add prisma/migrations
git commit -m "Add database migration: add_your_feature_name"

# 5. Deploy to staging
git push origin staging
```

**What happens:**
- Migration files are created in `prisma/migrations/`
- Changes are applied to staging PostgreSQL database
- Prisma client is regenerated
- Your deployment will automatically apply these migrations

### 3. Making Schema Changes

#### Step-by-Step Process:

1. **Edit both schema files** (keep them in sync):
   - `prisma/schema-sqlite.prisma` (for local dev)
   - `prisma/schema-postgres.prisma` (for staging/production)

2. **Test locally**:
   ```bash
   npm run db:push
   npm run dev
   # Test your changes
   ```

3. **Create migration for staging**:
   ```bash
   npm run db:create:migration descriptive_name
   ```

4. **Apply to staging**:
   ```bash
   npm run db:migrate:staging
   ```

5. **Commit everything**:
   ```bash
   git add prisma/
   git commit -m "Add feature: descriptive_name"
   git push
   ```

## Common Commands

### Local Development

| Command | Description |
|---------|-------------|
| `npm run db:push` | Push schema changes to local SQLite |
| `npm run db:studio` | Open Prisma Studio to browse data |
| `npm run db:seed` | Seed test data |
| `npm run dev` | Start Next.js dev server |

### Staging/Production

| Command | Description |
|---------|-------------|
| `npm run db:create:migration <name>` | Create a new migration file |
| `npm run db:migrate:staging` | Apply migrations to staging |
| `npm run db:generate` | Regenerate Prisma client |

## File Structure

```
prisma/
├── schema.prisma           # Active schema (auto-switched by scripts)
├── schema-sqlite.prisma    # SQLite schema for local dev
├── schema-postgres.prisma  # PostgreSQL schema for staging/prod
├── migrations/             # Migration files (for PostgreSQL only)
└── dev.db                  # Local SQLite database file
```

## Environment Variables

### `.env` (tracked in git, defaults)
```env
DATABASE_URL="file:./prisma/dev.db"
```

### `.env.local` (not tracked, local overrides)
```env
DATABASE_URL="file:./prisma/dev.db"
STAGING_DATABASE_URL="postgresql://..."
PRODUCTION_DATABASE_URL="postgresql://..."
```

## Troubleshooting

### "Unknown argument" error in staging

**Problem**: You added a field to the schema but staging doesn't recognize it.

**Solution**:
```bash
npm run db:create:migration add_the_field
npm run db:migrate:staging
```

### Local database is out of sync

**Solution**:
```bash
npm run db:push
```

### Migration failed on staging

**Solution**:
```bash
# Check the error message
# Often you need to manually fix data before migration can run
# Connect to staging DB and fix issues, then retry
npm run db:migrate:staging
```

### Schema files out of sync

**Problem**: Your SQLite and PostgreSQL schemas have different fields.

**Solution**: Manually edit both `schema-sqlite.prisma` and `schema-postgres.prisma` to match. The only difference should be:
- `provider = "sqlite"` vs `provider = "postgresql"`
- Any PostgreSQL-specific features (arrays, JSON, etc.)

## Best Practices

1. **Always sync both schemas**: When you change the schema, update both SQLite and PostgreSQL versions
2. **Test locally first**: Use `npm run db:push` to test changes before creating migrations
3. **Descriptive migration names**: Use clear names like `add_team_logo` or `add_user_roles`
4. **Commit migrations**: Always commit migration files so they're applied in production
5. **One migration per feature**: Don't bundle multiple unrelated changes
6. **Backup before major changes**: Especially on staging/production

## Current Setup

Your project is now configured with:
- ✅ SQLite for local development (fast, no external DB needed)
- ✅ PostgreSQL for staging and production (robust, scalable)
- ✅ Easy-to-use npm scripts for both workflows
- ✅ Separate schema files to avoid conflicts
- ✅ Migration system for staging/production deployments

## Next Steps

To apply the current pending change (team logo):

```bash
# 1. Push to local SQLite first
npm run db:push

# 2. Test locally
npm run dev

# 3. Create migration for staging
npm run db:create:migration add_team_logo

# 4. Apply to staging
npm run db:migrate:staging
```

