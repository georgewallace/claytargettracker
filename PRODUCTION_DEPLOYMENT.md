# Production Deployment Guide

## ✅ Status: Code Deployed to Main Branch

The code has been merged from staging to main and pushed to GitHub. AWS Amplify will automatically build and deploy to production.

---

## 📋 Steps to Complete Production Deployment

### 1. Wait for AWS Amplify Build

1. Go to your AWS Amplify console
2. Select your app (main branch)
3. Wait for the build to complete (usually 5-10 minutes)
4. Verify the build succeeds

### 2. Get Your Production Database URL

You need your production database URL from Neon.tech or your database provider.

**Format:**
```
postgresql://username:password@host/database?sslmode=require
```

### 3. Copy Data from Staging to Production

Once you have your production database URL, run:

```bash
# Set environment variables
export STAGING_DATABASE_URL="postgresql://neondb_owner:npg_cmYpQBg2e8NM@ep-wispy-hall-a4g4c6su-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
export PRODUCTION_DATABASE_URL="your-production-database-url-here"

# Run the copy script
npx tsx scripts/copy-staging-to-production.ts
```

### 4. Verify Production

After the data is copied:

1. Visit your production URL
2. Verify all tournaments are visible
3. Test key features:
   - Squad management
   - Auto-assign squads
   - Leaderboards
   - Shooter profiles
   - Team history

---

## 🎯 What Will Be Copied

The script will copy **ALL** data from staging to production:

- ✅ 4 Disciplines
- ✅ 32 Users (with hashed passwords)
- ✅ 8 Teams
- ✅ 26 Shooters
- ✅ 11 Tournaments
- ✅ 145 Time Slots
- ✅ 38 Squads
- ✅ 161 Squad Members
- ✅ 218 Registrations
- ✅ 660 Shoots
- ✅ 4,618 Scores
- ✅ Team Join Requests

---

## 🔒 Security Notes

- All passwords are already hashed with bcrypt
- Shooter passwords are set to "demo" (hashed)
- Admin/coach passwords remain as configured
- Database connections use SSL

---

## 🚨 Important

**Before running the copy script:**
1. Make sure AWS Amplify build is complete
2. Verify production database is accessible
3. Consider backing up production database if it has existing data
4. The script will UPSERT data (update if exists, create if not)

---

## 📞 Need Help?

If you encounter any issues:
1. Check AWS Amplify build logs
2. Verify database connection strings
3. Ensure all environment variables are set correctly in Amplify console

