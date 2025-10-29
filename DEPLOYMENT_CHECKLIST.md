# Staging Deployment Checklist

Use this checklist before every staging deployment to ensure nothing is missed.

## Pre-Deployment Checks

### 1. Database Schema Changes

- [ ] **Did you modify any Prisma schema files?**
  - If YES, continue to next checks
  - If NO, skip to "Code Changes" section

- [ ] **Both schema files updated?**
  - [ ] `prisma/schema-sqlite.prisma` updated
  - [ ] `prisma/schema-postgres.prisma` updated
  - [ ] Schemas are in sync (except provider line)

- [ ] **Tested locally?**
  ```bash
  npm run db:push
  npm run dev
  # Test your changes thoroughly
  ```

- [ ] **Created migration?**
  ```bash
  npm run db:create:migration descriptive_name
  # Check output for success message
  ```

- [ ] **Applied to staging database?**
  ```bash
  npm run db:migrate:staging
  # Verify: "All migrations have been successfully applied"
  ```

- [ ] **Migration files committed?**
  ```bash
  git status
  # Should see: prisma/migrations/TIMESTAMP_descriptive_name/
  git add prisma/migrations/
  git commit -m "Add database migration: descriptive_name"
  ```

- [ ] **No migration errors?**
  - Check console output for any red error messages
  - Verify Prisma client regenerated successfully

### 2. Code Changes

- [ ] **All TypeScript files compile?**
  ```bash
  npm run build
  # Check for type errors
  ```

- [ ] **No linter errors?**
  ```bash
  npm run lint
  # Fix any critical issues
  ```

- [ ] **New dependencies installed?**
  - [ ] Added to `package.json`
  - [ ] Ran `npm install`
  - [ ] `package-lock.json` updated

- [ ] **Environment variables updated?**
  - [ ] Check if `.env.local` needs updates
  - [ ] Document any new env vars in README
  - [ ] Staging environment configured with new vars

### 3. Feature Testing

- [ ] **Tested locally?**
  - [ ] Feature works as expected
  - [ ] No console errors
  - [ ] Mobile responsive
  - [ ] Works for all user roles (shooter/coach/admin)

- [ ] **Database changes tested?**
  - [ ] New fields populated correctly
  - [ ] Migrations don't break existing data
  - [ ] Foreign keys and relations work

- [ ] **API endpoints tested?**
  - [ ] New routes return correct data
  - [ ] Error handling works
  - [ ] Authentication/authorization correct

### 4. Documentation

- [ ] **Updated relevant docs?**
  - [ ] README.md updated if workflow changed
  - [ ] Created/updated feature summary docs
  - [ ] Updated FEATURES.md if applicable

- [ ] **Deployment notes documented?**
  - [ ] Any manual steps needed?
  - [ ] Any data migration scripts to run?
  - [ ] Any one-time configuration changes?

### 5. Git Status

- [ ] **All changes committed?**
  ```bash
  git status
  # Should show: "nothing to commit, working tree clean"
  ```

- [ ] **Commit messages clear?**
  - Descriptive commit messages
  - Reference any issue numbers
  - Explain what changed and why

- [ ] **On correct branch?**
  ```bash
  git branch
  # Should show: * staging
  ```

- [ ] **Pulled latest changes?**
  ```bash
  git pull origin staging
  # Resolve any conflicts
  ```

## Deployment Commands

Once all checks pass:

```bash
# Final verification
git status
git log -1  # Check last commit

# Push to staging
git push origin staging

# Monitor deployment
# (Watch AWS Amplify console or deployment logs)
```

## Post-Deployment Verification

After deployment completes:

- [ ] **Site loads without errors?**
  - Visit staging URL
  - Check browser console for errors
  - Verify no 500 errors

- [ ] **Database connection works?**
  - Login works
  - Data displays correctly
  - CRUD operations function

- [ ] **New features working?**
  - Test the specific features you deployed
  - Verify on mobile and desktop
  - Test all user roles

- [ ] **No regressions?**
  - Spot-check existing features
  - Verify nothing broke
  - Check critical user flows

## Rollback Plan

If something goes wrong:

1. **Revert code changes:**
   ```bash
   git revert HEAD
   git push origin staging
   ```

2. **Revert database (if needed):**
   ```bash
   # Contact admin or use backup
   # See TROUBLESHOOTING.md for details
   ```

3. **Document the issue:**
   - What went wrong?
   - What was the impact?
   - How was it fixed?

## Common Issues

### "Unknown argument" Error
**Cause:** Prisma client out of sync with schema

**Fix:**
```bash
npm run db:create:migration fix_schema
npm run db:migrate:staging
```

### Migration Drift Error
**Cause:** Database has changes not in migration history

**Fix:**
```bash
bash scripts/db-resolve-staging.sh
npm run db:create:migration your_change
```

### Build Fails on Staging
**Cause:** Environment variables missing or wrong

**Fix:**
- Check Amplify environment variables
- Verify `DATABASE_URL` points to staging PostgreSQL
- Check all required env vars are set

### Database Connection Fails
**Cause:** Wrong DATABASE_URL or network issue

**Fix:**
- Verify `STAGING_DATABASE_URL` is correct
- Check database is accessible
- Verify SSL mode and credentials

## Quick Reference

| Check | Command |
|-------|---------|
| Test locally | `npm run dev` |
| Create migration | `npm run db:create:migration <name>` |
| Apply to staging | `npm run db:migrate:staging` |
| Build | `npm run build` |
| Lint | `npm run lint` |
| Check status | `git status` |
| Deploy | `git push origin staging` |

## Documentation References

- **Database workflow:** `database_migration.md`
- **Full workflow guide:** `DATABASE_WORKFLOW.md`
- **Troubleshooting:** `TROUBLESHOOTING.md`
- **Features list:** `FEATURES.md`

---

**Remember:** Take your time with the checklist. A few extra minutes of verification can prevent hours of debugging in production!

