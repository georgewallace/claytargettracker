# 🚀 Staging Deployment Guide

## ✅ Code Deployment - COMPLETE!

Your code has been successfully pushed to the `staging` branch and AWS Amplify will automatically deploy it.

**Git Commit:** `b60f561`
**Branch:** `staging`
**Status:** Pushed to origin

### Monitor Deployment
1. Go to AWS Amplify Console
2. Select your app
3. Watch the `staging` branch build
4. Deployment typically takes 5-10 minutes

---

## 📊 Database Sync to Staging

You have several options to sync your local database to staging:

### Option 1: Using Neon.tech Console (RECOMMENDED)

**Steps:**
1. Log into [Neon.tech Console](https://console.neon.tech)
2. Select your project
3. Go to your production/main branch
4. Click "Restore" or "Copy" to staging branch
5. Confirm the operation

**Pros:**
- ✅ Fast and reliable
- ✅ No local tools needed
- ✅ Built-in backup
- ✅ No downtime

### Option 2: Using pg_dump and psql

**Prerequisites:**
```bash
# Install PostgreSQL client tools if not already installed
brew install postgresql
```

**Export Local Database:**
```bash
# Get your local DATABASE_URL from .env.local
export LOCAL_DB="your-local-database-url"

# Export to SQL file
pg_dump "$LOCAL_DB" > local_backup_$(date +%Y%m%d_%H%M%S).sql
```

**Import to Staging:**
```bash
# Get your staging DATABASE_URL from AWS Amplify environment variables
export STAGING_DB="your-staging-database-url"

# Import the backup
psql "$STAGING_DB" < local_backup_YYYYMMDD_HHMMSS.sql
```

**Pros:**
- ✅ Full control over the process
- ✅ Can review SQL before importing
- ✅ Works with any PostgreSQL database

**Cons:**
- ⚠️ Requires local PostgreSQL tools
- ⚠️ Manual process
- ⚠️ Overwrites staging data

### Option 3: Using Prisma Migrate

**Note:** This only syncs schema, not data.

```bash
# Push schema to staging
DATABASE_URL="your-staging-database-url" npx prisma db push

# Seed data (if you have seed scripts)
DATABASE_URL="your-staging-database-url" npm run db:seed-history
```

**Pros:**
- ✅ Schema changes are version controlled
- ✅ Can run seed scripts

**Cons:**
- ⚠️ Doesn't copy existing data
- ⚠️ Only useful for schema changes

### Option 4: Using Neon CLI

**Install Neon CLI:**
```bash
npm install -g neonctl
```

**Authenticate:**
```bash
neonctl auth
```

**Copy Branch:**
```bash
# List branches
neonctl branches list

# Create staging branch from main (if doesn't exist)
neonctl branches create --name staging --parent main

# Or reset staging to match main
neonctl branches reset staging --parent main
```

**Pros:**
- ✅ Command-line control
- ✅ Fast branch operations
- ✅ Can automate

---

## 🔍 Verify Deployment

### 1. Check AWS Amplify Build
```
✅ Build started
✅ Backend updated
✅ Frontend deployed
✅ No errors in logs
```

### 2. Test Staging URL
Visit your staging URL and verify:
- [ ] Site loads correctly
- [ ] Login works
- [ ] Tournament creation works
- [ ] Squad management loads
- [ ] Auto-assign modal shows new options
- [ ] Field dropdown in "Add Time Slot" works
- [ ] Modals work (remove shooter, delete squad)
- [ ] Dates display correctly

### 3. Check Database Connection
```bash
# Test staging database connection
DATABASE_URL="your-staging-database-url" npx prisma db pull
```

### 4. Verify Data
- [ ] Tournaments exist
- [ ] Shooters exist
- [ ] Teams exist
- [ ] Historical data exists
- [ ] Squads and time slots exist

---

## 🐛 Troubleshooting

### Build Fails in Amplify
1. Check build logs in Amplify console
2. Verify environment variables are set
3. Check for TypeScript errors
4. Ensure `DATABASE_URL` is correct

### Database Connection Issues
1. Verify `DATABASE_URL` format: `postgresql://user:pass@host/db?sslmode=require`
2. Check Neon.tech console for database status
3. Verify IP allowlist (if configured)
4. Test connection locally first

### Data Not Showing
1. Verify database sync completed
2. Check Prisma schema matches database
3. Run migrations if needed: `npx prisma migrate deploy`
4. Clear Next.js cache: Delete `.next` folder and rebuild

### Auto-Assign Not Working
1. Check browser console for errors
2. Verify API route is accessible: `/api/tournaments/[id]/auto-assign-squads`
3. Check that shooters have teams (or enable "include without teams")
4. Verify time slots exist for the discipline

---

## 📝 Post-Deployment Checklist

- [ ] Code deployed to staging
- [ ] Database synced to staging
- [ ] Staging site loads correctly
- [ ] Login/authentication works
- [ ] Core features tested:
  - [ ] Tournament creation with discipline config
  - [ ] Time slot creation
  - [ ] Squad auto-assign with new options
  - [ ] Manual squad management (drag-drop)
  - [ ] Score entry
  - [ ] Leaderboard display
- [ ] New features tested:
  - [ ] Auto-assign options (include without teams/divisions)
  - [ ] Delete existing squads toggle (default unchecked)
  - [ ] Field dropdown in time slot creation
  - [ ] Squad renaming
  - [ ] Remove shooter modal
  - [ ] Delete squad modal
- [ ] No console errors
- [ ] No broken links
- [ ] Mobile responsive

---

## 🎯 Next Steps

Once staging is verified:
1. Test thoroughly with real-world scenarios
2. Get user feedback
3. Fix any issues found
4. Merge staging → main for production deployment

---

## 📞 Support

If you encounter issues:
1. Check AWS Amplify build logs
2. Check browser console for errors
3. Check Neon.tech database status
4. Review `SQUAD_AUTO_ASSIGN_IMPROVEMENTS.md` for technical details

---

## 🎉 What's New in This Deployment

### Auto-Assign Improvements
- ✅ New options to include shooters without teams/divisions
- ✅ Delete existing squads now unchecked by default
- ✅ Detailed failure reporting with specific reasons
- ✅ Better team-only squad protection
- ✅ Strict discipline rule enforcement

### UI/UX Enhancements
- ✅ Modals replace popups (remove shooter, delete squad)
- ✅ Field dropdown for time slot creation
- ✅ Inline squad renaming
- ✅ Cleaner squad interface (removed "+ Add Squad" button)

### Bug Fixes
- ✅ Fixed timezone issues across all pages
- ✅ Fixed auto-assign creating multiple squads per slot
- ✅ Fixed team-only squad violations
- ✅ Fixed date display inconsistencies

See `SQUAD_AUTO_ASSIGN_IMPROVEMENTS.md` for complete details.

