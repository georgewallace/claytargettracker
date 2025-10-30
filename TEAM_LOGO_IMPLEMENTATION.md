# Team Logo Implementation Summary

This document summarizes the team logo feature and the database workflow improvements.

## Team Logo Feature

### Overview
Teams can now upload custom logos that display throughout the application, including:
- Tournament registration lists
- Leaderboards (individual and squad)
- Team management pages

### Components Created

#### 1. `components/TeamLogo.tsx`
A reusable component to display team logos with fallback:
- Shows team logo image if available
- Falls back to first letter of team name with gradient background
- Supports different sizes: `sm`, `md`, `lg`

#### 2. `app/teams/my-team/TeamLogoUpload.tsx`
Upload interface for coaches:
- Drag-and-drop file upload
- File type validation (PNG, JPG, GIF, WebP)
- File size limit (5MB)
- Upload progress indicator
- Preview with remove option

#### 3. `app/api/teams/[id]/logo/route.ts`
API endpoints for logo management:
- **POST**: Upload team logo
  - Validates file type and size
  - Saves to `public/uploads/teams/`
  - Updates team record with logo URL
  - Only coaches of the team or admins can upload
- **DELETE**: Remove team logo
  - Deletes file from filesystem
  - Clears logo URL from database
  - Only coaches of the team or admins can delete

### Database Changes

Added `logoUrl` field to `Team` model:
```prisma
model Team {
  id        String   @id @default(cuid())
  name      String
  logoUrl   String?  // URL/path to team logo
  // ... other fields
}
```

Migration created: `20251029150716_add_team_logo`

### Integration Points

1. **Tournament Registration Page** (`app/tournaments/[id]/page.tsx`)
   - Shows team logo next to each registered shooter
   - Only displays if shooter belongs to a team

2. **Leaderboard** (`app/tournaments/[id]/leaderboard/Leaderboard.tsx`)
   - Added `teamLogoUrl` to `ShooterScore` and `SquadScore` interfaces
   - Logos appear next to shooter names in individual standings
   - Logos appear next to squad names for full-team squads

3. **Team Management** (`app/teams/my-team/page.tsx`)
   - Coaches can upload/remove team logo
   - Logo preview displayed prominently

### File Storage

Team logos are stored in:
```
public/uploads/teams/
```

File naming convention:
```
{teamId}-{timestamp}.{extension}
```

Example: `cm123abc-1698765432000.png`

### Permissions

- **Upload Logo**: Team coaches and admins only
- **Delete Logo**: Team coaches and admins only
- **View Logo**: Everyone (public)

## Database Workflow Improvements

### Problem Solved

Previously, the app had issues with:
- Schema conflicts between local (SQLite desired) and staging (PostgreSQL)
- Manual database migrations causing drift
- Complex deployment process

### Solution Implemented

Created a dual-database workflow:
- **Local Development**: SQLite (fast, no external DB needed)
- **Staging/Production**: PostgreSQL (robust, scalable)

### New Files Created

#### 1. Schema Files
- `prisma/schema.prisma` - Active schema (auto-switched by scripts)
- `prisma/schema-sqlite.prisma` - SQLite schema for local dev
- `prisma/schema-postgres.prisma` - PostgreSQL schema for staging/prod

#### 2. Database Scripts
- `scripts/db-local-push.sh` - Push schema to local SQLite
- `scripts/db-create-migration.sh` - Create migration for staging
- `scripts/db-migrate-staging.sh` - Apply migrations to staging
- `scripts/db-resolve-staging.sh` - Fix migration drift issues

#### 3. Documentation
- `DATABASE_WORKFLOW.md` - Complete guide for database operations

### New NPM Scripts

```json
{
  "db:push": "bash scripts/db-local-push.sh",
  "db:migrate:staging": "bash scripts/db-migrate-staging.sh",
  "db:create:migration": "bash scripts/db-create-migration.sh"
}
```

### Workflow

#### Local Development
```bash
# Make schema changes to prisma/schema-sqlite.prisma
npm run db:push        # Apply to local SQLite
npm run dev            # Start development server
```

#### Deploying to Staging
```bash
# Make schema changes to both schema files
npm run db:create:migration your_change_name  # Create migration
npm run db:migrate:staging                    # Apply to staging
git add prisma/migrations                     # Commit migrations
git commit -m "Add migration: your_change_name"
git push origin staging                       # Deploy
```

### Benefits

1. **Fast Local Development**
   - No PostgreSQL installation required locally
   - Instant schema pushes with SQLite
   - No migration files cluttering git during development

2. **Safe Staging Deployments**
   - Proper migration history for PostgreSQL
   - Easy rollback if needed
   - Clear audit trail of schema changes

3. **No More Drift Issues**
   - Automatic drift resolution
   - Clear separation of local vs staging
   - Scripts handle environment switching

## Testing

### Test Team Logo Upload

1. Login as a coach
2. Navigate to "My Team"
3. Upload a logo (PNG/JPG, under 5MB)
4. Verify logo appears on team page
5. Register team members for a tournament
6. Check tournament page - logos should appear
7. Check leaderboard - logos should appear

### Test Database Workflow

1. Make a schema change locally
2. Run `npm run db:push`
3. Verify change in local SQLite
4. Run `npm run db:create:migration test_change`
5. Run `npm run db:migrate:staging`
6. Verify change in staging PostgreSQL

## Files Modified

### New Files
- `components/TeamLogo.tsx`
- `app/teams/my-team/TeamLogoUpload.tsx`
- `app/api/teams/[id]/logo/route.ts`
- `prisma/schema-sqlite.prisma`
- `prisma/schema-postgres.prisma`
- `scripts/db-local-push.sh`
- `scripts/db-create-migration.sh`
- `scripts/db-migrate-staging.sh`
- `scripts/db-resolve-staging.sh`
- `DATABASE_WORKFLOW.md`
- `TEAM_LOGO_IMPLEMENTATION.md` (this file)

### Modified Files
- `prisma/schema.prisma` - Added `logoUrl` to Team model
- `package.json` - Updated database scripts
- `app/teams/my-team/page.tsx` - Added TeamLogoUpload component
- `app/tournaments/[id]/page.tsx` - Integrated TeamLogo display
- `app/tournaments/[id]/leaderboard/Leaderboard.tsx` - Added teamLogoUrl to interfaces

### Migration Files
- `prisma/migrations/20251029150716_add_team_logo/migration.sql`

## Future Enhancements

1. **Image Optimization**
   - Automatically resize/compress uploaded images
   - Generate multiple sizes (thumbnail, full)
   - Use Next.js Image component for optimization

2. **Logo Gallery**
   - Pre-designed logo templates
   - School logo library
   - Custom color schemes

3. **Bulk Operations**
   - Upload logos for multiple teams (admin)
   - Export/import team data with logos

4. **Enhanced Display**
   - Logo watermark on score sheets
   - Logo in printed reports
   - Logo in email notifications

## Notes

- Logo uploads are stored in `public/uploads/teams/` directory
- Old logos are automatically deleted when new ones are uploaded
- Logos are publicly accessible (no authentication required to view)
- Maximum file size: 5MB
- Supported formats: PNG, JPG, GIF, WebP
- Database migrations are now applied to staging PostgreSQL
- Local development uses SQLite for speed

