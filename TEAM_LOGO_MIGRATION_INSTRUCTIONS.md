# 🖼️ Team Logo Feature - Database Migration Required

## ⚠️ Important: Migration Needed

Before the team logo feature can be used, you need to run a database migration.

## 📝 Migration Steps

### Step 1: Run the Migration
```bash
# Make sure your DATABASE_URL is set correctly in .env
# For example:
# DATABASE_URL="postgresql://user:password@host:port/database"

npx prisma migrate dev --name add_team_logo
```

### Step 2: Regenerate Prisma Client
```bash
npx prisma generate
```

### Step 3: Restart Development Server
```bash
npm run dev
```

## 🔧 What Changed

### Database Schema
Added `logoUrl` field to the `Team` model:
```prisma
model Team {
  id        String   @id @default(cuid())
  name      String
  logoUrl   String?  // NEW FIELD - URL/path to team logo
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  coaches      TeamCoach[]
  shooters     Shooter[]
  joinRequests TeamJoinRequest[]
}
```

## 📁 New Files Created

1. **`components/TeamLogo.tsx`** - Reusable team logo component
2. **`app/teams/my-team/TeamLogoUpload.tsx`** - Logo upload interface
3. **`app/api/teams/[id]/logo/route.ts`** - API for logo upload/delete

## ✨ Features Added

- Team logo upload in team management page
- Team logos displayed next to shooter names in tournaments
- Team logos in registration lists
- Team logos in leaderboards
- Fallback to team initial if no logo

## 🚀 Usage

### For Coaches/Admins
1. Go to "Teams" → "My Team"
2. Look for the "Team Logo" section
3. Click "Upload Logo" to select an image
4. Logo will be displayed throughout the app

### Supported Formats
- JPEG, PNG, GIF, WebP
- Maximum file size: 5MB
- Recommended: Square image, at least 200x200px

## 📊 Display Locations

Team logos are now shown in:
- ✅ Tournament registration lists
- ✅ Tournament detail pages
- ✅ Leaderboards
- ✅ Team management page
- ✅ Squad displays (when squad is full team)

## 🔒 Permissions

- Only team coaches and admins can upload/remove team logos
- Team logos are publicly visible once uploaded

---

**Run the migration first before using the feature!**

