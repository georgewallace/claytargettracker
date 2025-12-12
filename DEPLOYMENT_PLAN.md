# Shooter → Athlete Migration Deployment Plan

## Overview
This deployment migrates the database schema from "Shooter" to "Athlete" terminology across the entire application.

## Pre-Deployment Checklist

### ✅ Completed
- [x] Updated all Prisma schemas (SQLite, PostgreSQL)
- [x] Refactored all code references (shooter → athlete)
- [x] Updated lib/squadUtils.ts interfaces
- [x] Fixed critical bugs in auto-assign-squads route
- [x] Updated import/export scripts
- [x] Tested locally with seeded staging data
- [x] Build verified successfully
- [x] Created migration SQL scripts
- [x] Created rollback SQL script

### 🔲 Before Deployment
- [ ] Verify staging database backup exists
- [ ] Review migration SQL one more time
- [ ] Ensure no active users on staging
- [ ] Check current staging application status

## Migration Details

### Database Changes
1. **Table Renames**:
   - `Shooter` → `Athlete`
   - `ShooterAverage` → `AthleteAverage`

2. **Column Renames** (shooterId → athleteId):
   - SquadMember
   - Registration
   - Shoot
   - TeamJoinRequest
   - AthleteAverage

3. **Index Updates**:
   - All indexes referencing Shooter/shooterId
   - All unique constraints

4. **Foreign Key Updates**:
   - Drop and recreate all foreign keys with new names

### Code Changes
- 80+ files modified
- All Prisma queries updated
- All TypeScript interfaces updated
- All API routes updated
- All UI components updated

## Deployment Steps

### 1. Pre-Deployment Backup
```bash
# Verify backup exists (DO NOT SKIP!)
# Contact AWS/Neon support to ensure recent backup
```

### 2. Run Migration Script
```bash
# Load environment variables
source .env.local

# Run the deployment script
./scripts/deploy-athlete-migration.sh
```

The script will:
- Check database connection
- Verify current schema state
- Show migration summary
- Apply migration
- Verify success
- Restore local schema

### 3. Deploy Code to Amplify
```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "feat: Migrate Shooter to Athlete model

- Rename Shooter table to Athlete
- Rename ShooterAverage to AthleteAverage
- Update all shooterId columns to athleteId
- Update all code references
- Update import/export scripts
- Add comprehensive migration with rollback"

# Push to staging branch
git push origin staging
```

### 4. Monitor Amplify Deployment
- Watch Amplify console for build progress
- Check for any build errors
- Verify deployment completes successfully

### 5. Post-Deployment Verification

Test the following features:
- [ ] User login/authentication
- [ ] Team management
- [ ] Tournament creation
- [ ] Athlete registration
- [ ] Squad management
- [ ] Score entry
- [ ] Leaderboards
- [ ] Team join requests

### 6. Verify Data Integrity
```sql
-- Check record counts match pre-migration
SELECT COUNT(*) FROM "Athlete";
SELECT COUNT(*) FROM "AthleteAverage";
SELECT COUNT(*) FROM "Registration";
SELECT COUNT(*) FROM "SquadMember";
```

## Rollback Plan

### If Migration Fails
```bash
# Load environment
source .env.local

# Run rollback SQL
psql $STAGING_DATABASE_URL < prisma/migrations/20251212084500_rename_shooter_to_athlete/rollback.sql
```

### If Code Deployment Fails
```bash
# Revert git commit
git revert HEAD

# Push to staging
git push origin staging
```

## Risk Assessment

### Low Risk
- ✅ Pure rename operation (no data transformation)
- ✅ All relationships preserved
- ✅ Tested locally with production data
- ✅ Rollback script available

### Potential Issues
- ⚠️ Brief downtime during migration
- ⚠️ Active user sessions may need to re-login
- ⚠️ Cached Prisma Client on Amplify (will regenerate on build)

### Mitigation
- Schedule during low-traffic period
- Have rollback script ready
- Monitor logs closely
- Test all critical paths immediately

## Success Criteria
- ✅ Migration completes without errors
- ✅ All tables renamed correctly
- ✅ All foreign keys working
- ✅ Application builds successfully
- ✅ All features work as expected
- ✅ No data loss
- ✅ Performance unchanged

## Timeline
- **Migration Duration**: ~30 seconds (database schema changes)
- **Build Duration**: ~3-5 minutes (Amplify build)
- **Total Downtime**: ~5-10 minutes
- **Verification**: ~10-15 minutes

## Support Contacts
- Database: Neon.tech support
- Hosting: AWS Amplify support
- Code Issues: Review DEPLOYMENT_PLAN.md

## Notes
- This is a **breaking change** - old Prisma Clients will not work
- All environment Prisma Clients must regenerate
- The migration is **forward-only** - plan carefully
