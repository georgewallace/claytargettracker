# Database Rules & Workflow Summary

This document provides a quick reference for the database workflow rules that are now enforced in the workspace.

## 🚨 Critical Rules

### 1. Never Deploy Schema Changes Without Migrations

If you modify `prisma/schema-sqlite.prisma` or `prisma/schema-postgres.prisma`, you **MUST** create migrations before deploying to staging:

```bash
npm run db:create:migration your_change_name
npm run db:migrate:staging
git add prisma/migrations/
git commit -m "Add database migration: your_change_name"
```

### 2. Keep Both Schema Files in Sync

When editing Prisma schemas, always edit BOTH:
- `prisma/schema-sqlite.prisma` (local development)
- `prisma/schema-postgres.prisma` (staging/production)

The only difference should be the `provider` line.

### 3. Don't Edit schema.prisma Directly

`prisma/schema.prisma` is auto-managed by scripts. Always edit the `-sqlite` or `-postgres` versions.

### 4. Test Locally First

Always test schema changes locally with `npm run db:push` before creating migrations for staging.

## 📋 Workspace Files Created

1. **`.cursorrules`** - Cursor AI rules for enforcing workflow
2. **`database_migration.md`** - Complete migration guide
3. **`DATABASE_WORKFLOW.md`** - Detailed workflow documentation
4. **`DEPLOYMENT_CHECKLIST.md`** - Pre-deployment checklist
5. **Schema files:**
   - `prisma/schema-sqlite.prisma` - Local development
   - `prisma/schema-postgres.prisma` - Staging/production
6. **Scripts:**
   - `scripts/db-local-push.sh` - Push to local SQLite
   - `scripts/db-create-migration.sh` - Create migrations
   - `scripts/db-migrate-staging.sh` - Apply to staging
   - `scripts/db-resolve-staging.sh` - Fix migration drift

## 🔄 Quick Workflows

### Local Development
```bash
# Edit schema-sqlite.prisma
npm run db:push
npm run dev
```

### Deploy to Staging
```bash
# Edit both schema files
npm run db:create:migration feature_name
npm run db:migrate:staging
git add prisma/
git commit -m "Add migration: feature_name"
git push origin staging
```

## 📚 Documentation Hierarchy

1. **Quick reference**: This file (DATABASE_RULES_SUMMARY.md)
2. **Deployment steps**: DEPLOYMENT_CHECKLIST.md
3. **Complete workflow**: DATABASE_WORKFLOW.md
4. **Migration guide**: database_migration.md
5. **README**: README.md (Development section)

## ✅ How Rules Are Enforced

### Cursor AI Integration

The `.cursorrules` file tells Cursor AI to:
- Always check for schema changes before deployments
- Remind about creating migrations
- Verify both schema files are in sync
- Follow the proper deployment workflow

### Git Hooks (Optional)

You can add a pre-push hook to verify migrations:

```bash
#!/bin/bash
# .git/hooks/pre-push

# Check if schema files have uncommitted migrations
if git diff --cached --name-only | grep -q "schema-postgres.prisma"; then
  echo "⚠️  Schema changes detected!"
  echo "Did you create a migration with 'npm run db:create:migration'?"
  read -p "Continue? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi
```

### Manual Review

Before every staging deployment:
1. Check `DEPLOYMENT_CHECKLIST.md`
2. Verify migrations in `prisma/migrations/`
3. Test locally with `npm run db:push`

## 🎯 Benefits of This Workflow

1. **Fast Local Development**
   - SQLite is instant, no external DB needed
   - No migration files during development
   - Quick iteration cycles

2. **Safe Staging Deployments**
   - Proper migration history
   - Easy rollback if needed
   - No "Unknown argument" errors

3. **Clear Audit Trail**
   - Every schema change documented in migrations
   - Migration history matches database state
   - Easy to review what changed and when

4. **Prevents Common Errors**
   - No more drift issues
   - No more "column already exists" errors
   - No more Prisma client sync issues

## 🔧 Troubleshooting

### I forgot to create a migration before pushing

```bash
# Create the migration now
npm run db:create:migration missed_change

# Apply to staging
npm run db:migrate:staging

# Commit and push
git add prisma/migrations/
git commit -m "Add missed migration: missed_change"
git push origin staging
```

### I edited schema.prisma instead of schema-sqlite.prisma

```bash
# Copy your changes to the correct files
# Then reset schema.prisma
git checkout prisma/schema.prisma

# The scripts will regenerate it correctly
npm run db:push
```

### Staging deployment failed with database error

```bash
# Check the error message
# Usually it's a missing migration

# Create and apply migration
npm run db:create:migration fix_staging
npm run db:migrate:staging

# Commit and redeploy
git add prisma/migrations/
git commit -m "Fix staging migration"
git push origin staging
```

## 📖 Related Documentation

- **Team Logo Implementation**: TEAM_LOGO_IMPLEMENTATION.md
- **Staging Deployment**: STAGING_DEPLOYMENT_GUIDE.md
- **Troubleshooting**: TROUBLESHOOTING.md
- **Features**: FEATURES.md

## 🎓 Training & Onboarding

When onboarding new developers:

1. **Read these files in order:**
   - README.md (Overview)
   - DATABASE_RULES_SUMMARY.md (This file)
   - DATABASE_WORKFLOW.md (Details)
   - DEPLOYMENT_CHECKLIST.md (Process)

2. **Practice the workflow:**
   - Make a test schema change
   - Run `npm run db:push` locally
   - Create a test migration
   - Apply to staging (with supervision)

3. **Review `.cursorrules`:**
   - Understand what Cursor AI will enforce
   - See how rules help prevent errors

---

**Remember:** These rules exist to make your life easier, not harder. They prevent hours of debugging and ensure smooth deployments! 🚀

