# Staging Deployment Workflow

This guide ensures **flawless deployments to staging** every time.

## 🚀 Quick Start

For most deployments, just run:

```bash
npm run deploy:staging <migration-name>
```

This automates everything and ensures your deployment will succeed.

## 📋 Complete Workflow

### 1️⃣ Making Database Schema Changes

When you need to add/modify database fields:

```bash
# 1. Edit BOTH schema files with the SAME changes
vim prisma/schema-sqlite.prisma      # For local development
vim prisma/schema-postgres.prisma    # For staging/production

# 2. Test locally
npm run db:push

# 3. Create migration and deploy to staging
npm run deploy:staging add-new-feature

# 4. When prompted, say 'y' to commit and push
```

### 2️⃣ Making Code-Only Changes

When you're only changing code (no database changes):

```bash
# 1. Make your code changes

# 2. Test locally
npm run dev

# 3. Validate before pushing
npm run validate:staging

# 4. Commit and push
git add .
git commit -m "Your changes"
git push origin staging
```

## 🛡️ Automatic Protection

### Pre-Push Hook

The repository has an automatic pre-push hook that validates your deployment **before** it reaches staging:

✅ Checks schema files are in sync
✅ Verifies migrations are committed
✅ Ensures no uncommitted changes
✅ Validates amplify.yml configuration

The hook runs automatically when you push to the `staging` branch.

### Manual Validation

You can also run validation manually:

```bash
npm run validate:staging
```

This checks:
- Schema file synchronization
- Migration files status
- Git status and branch
- Environment configuration
- Optional: Local build test

### Bypass (Emergency Only)

If you absolutely need to skip validation (not recommended):

```bash
git push --no-verify
```

## 🔧 Setup (One-Time)

If you're setting up a new clone of the repository:

```bash
# Install git hooks
npm run setup:hooks
```

This is a one-time setup that installs the pre-push validation hook.

## 📁 Understanding Schema Files

The project uses **two schema files**:

| File | Purpose | Database |
|------|---------|----------|
| `schema-sqlite.prisma` | Local development | SQLite |
| `schema-postgres.prisma` | Staging/Production | PostgreSQL |
| `schema.prisma` | Auto-generated | (Don't edit directly) |

### Why Two Schemas?

- **Local**: SQLite for fast development without needing PostgreSQL
- **Staging**: PostgreSQL for production-like environment
- **Important**: Both must have the SAME models/fields

### How Deployment Works

1. **Local**: Uses SQLite schema automatically
2. **Staging**: `amplify.yml` copies PostgreSQL schema before build
3. **Build**: Prisma generates types from the correct schema

## 🎯 Best Practices

### ✅ DO

- ✅ Update both schema files with the same changes
- ✅ Test locally with `npm run db:push` first
- ✅ Run `npm run validate:staging` before pushing
- ✅ Use descriptive migration names
- ✅ Commit migration files
- ✅ Review Amplify deployment logs

### ❌ DON'T

- ❌ Edit `schema.prisma` directly (it's auto-generated)
- ❌ Update only one schema file
- ❌ Skip local testing
- ❌ Push without committing migrations
- ❌ Use `--no-verify` unless absolutely necessary

## 🔄 Complete Example Workflow

Here's a real example of adding a new field:

```bash
# Step 1: Edit SQLite schema
vim prisma/schema-sqlite.prisma
# Add: favoriteColor String?

# Step 2: Test locally
npm run db:push
npm run dev
# Test the changes in your browser

# Step 3: Edit PostgreSQL schema (same change)
vim prisma/schema-postgres.prisma
# Add: favoriteColor String?

# Step 4: Deploy to staging
npm run deploy:staging add-user-favorite-color

# The script will:
# - Switch to PostgreSQL schema
# - Create migration
# - Apply to staging database
# - Prompt you to commit and push
# - Restore SQLite schema

# Step 5: Say 'y' when prompted to commit/push
# The pre-push hook will validate everything automatically

# Step 6: Monitor deployment
# Check AWS Amplify console for build status
```

## 🚨 Troubleshooting

### "Schema files out of sync"

**Problem**: The two schema files have different models/fields.

**Solution**:
```bash
# Compare the files
diff prisma/schema-sqlite.prisma prisma/schema-postgres.prisma

# Update the out-of-sync file to match
# Then run validation again
npm run validate:staging
```

### "Uncommitted migrations"

**Problem**: Migration files exist but aren't committed to git.

**Solution**:
```bash
# Commit the migration files
git add prisma/migrations/
git commit -m "Migration: description"
```

### "Build fails with TypeScript errors"

**Problem**: Prisma types don't include new fields.

**Solution**: This should be fixed now! The `amplify.yml` copies the PostgreSQL schema before generating types.

If it still happens:
1. Verify `amplify.yml` has the schema copy command
2. Check that both schema files have the new fields
3. Review Amplify build logs for errors

### "Migration already exists"

**Problem**: You've already created a migration but need to recreate it.

**Solution**:
```bash
# Delete the migration folder
rm -rf prisma/migrations/YYYYMMDDHHMMSS_migration-name

# Create it again
npm run deploy:staging new-migration-name
```

## 📊 Deployment Checklist

Before every staging push:

- [ ] Both schema files updated
- [ ] Local testing complete
- [ ] Migrations created and committed
- [ ] No uncommitted changes
- [ ] Validation passed (`npm run validate:staging`)
- [ ] Ready to push

## 🔗 Related Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) - General deployment guide
- [README.md](./README.md) - Project overview
- [amplify.yml](./amplify.yml) - AWS Amplify configuration

## 💡 Pro Tips

1. **Run validation early**: Run `npm run validate:staging` before you start working to catch issues early

2. **Use the deploy script**: The `deploy:staging` script automates the entire process and reduces errors

3. **Monitor deployments**: Keep the Amplify console open to catch issues immediately

4. **Test locally first**: Always test with SQLite locally before deploying to staging

5. **Descriptive names**: Use clear migration names like `add-user-email-verification` instead of `update-schema`

## 🆘 Need Help?

If you encounter issues:

1. Run `npm run validate:staging` to see what's wrong
2. Check the [Troubleshooting](#-troubleshooting) section above
3. Review Amplify deployment logs in AWS Console
4. Check that `amplify.yml` is configured correctly

---

**Remember**: The automated tools are here to help you. Trust the validation scripts and follow the workflow for flawless deployments! 🎯
