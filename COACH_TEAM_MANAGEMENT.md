# Coach Team Management Guide

## Overview

Coaches can now be assigned to teams and manage their team roster directly. This allows coaches to:
- Be officially associated with a team
- Add shooters to their team
- Remove shooters from their team
- View team roster at a glance
- Bulk register their team for tournaments

## How It Works

### Team-Coach Relationship

- Each team can have **one coach** (or none)
- Each coach can coach **one team** at a time
- Coaches are assigned to teams (not just generic coaches)

### Roles

**Coach Role:**
- Can be assigned to a team
- Can add/remove shooters to/from their team
- Can bulk register shooters for tournaments
- Cannot compete as a shooter

**Shooter Role:**
- Can be on one team at a time
- Can self-register for tournaments
- Can join/leave teams (or coach can manage)

## Getting Started as a Coach

### 1. Become a Coach

You can become a coach in two ways:

**Option A: Sign up as a coach**
1. Go to the signup page
2. Select "Coach" from the role dropdown
3. Complete registration

**Option B: Convert existing account** (requires admin/script):
```bash
DATABASE_URL="file:./dev.db" node scripts/update-user-role.js your@email.com coach
```

### 2. Get Assigned to a Team

**Option A: Existing Team** (requires admin/script):
```bash
DATABASE_URL="file:./dev.db" node scripts/assign-team-coach.js your@email.com "Team Name"
```

**Option B: Create Team via UI** (future feature)
- Currently teams are created by any user
- Coach assignment requires script

### 3. Access Your Team

Once assigned as a coach:
1. **Logout and login again** to refresh your session
2. Look for the **"Coach" badge** next to your name
3. Click **"My Team"** in the navigation
4. You'll see your team management dashboard

## Managing Your Team Roster

### Add Shooters to Your Team

1. Navigate to **"My Team"**
2. Scroll to **"Add Shooters to Team"** section
3. Use the search bar to find shooters
4. Click **"Add to Team"** next to the shooter you want
5. They're instantly added to your roster!

**Features:**
- Search by name or email
- See current team affiliation
- Only see available shooters
- Instant roster updates

### Remove Shooters from Your Team

1. Navigate to **"My Team"**
2. In the **"Current Roster"** section
3. Click **"Remove"** next to the shooter
4. Confirm the action
5. Shooter is removed (but still exists as a shooter)

**Note:** Removed shooters become independent (no team) but can join another team or rejoin yours later.

### View Your Roster

The **"Current Roster"** section shows:
- Shooter names
- Email addresses
- Total count
- Quick remove action

## Bulk Tournament Registration

As a coach, you can register your entire team for tournaments:

1. Navigate to any **"Upcoming"** tournament
2. See the **"Coach Registration"** panel at the top
3. Search or select shooters (including your team)
4. Use **Select All** to quickly select multiple shooters
5. Click **"Register X Shooters"**
6. All selected shooters are registered!

**Pro Tips:**
- Search for your team name to filter to your roster
- Use "Select All" after searching for your team
- Already registered shooters are hidden automatically

## Database Schema

```prisma
model User {
  role        String  @default("shooter")
  coachedTeam Team?
}

model Team {
  coachId String? @unique
  coach   User?   @relation(fields: [coachId], references: [id])
  shooters Shooter[]
}

model Shooter {
  teamId String?
  team   Team?   @relation(fields: [teamId], references: [id])
}
```

## API Endpoints

### Manage Coaching Position

**Become coach of a team:**
```http
POST /api/teams/manage
{
  "teamId": "team_id_here"
}
```

**Leave coaching position:**
```http
DELETE /api/teams/manage
```

### Manage Roster

**Add shooter to your team:**
```http
POST /api/teams/add-shooter
{
  "shooterId": "shooter_id_here"
}
```

**Remove shooter from your team:**
```http
POST /api/teams/remove-shooter
{
  "shooterId": "shooter_id_here"
}
```

## Example Workflow

### Setting Up a Youth Team

1. **Admin creates team**: "Youth Clay Target Team"
2. **Assign coach**: 
   ```bash
   node scripts/assign-team-coach.js coach@school.edu "Youth Clay Target Team"
   ```
3. **Coach logs in** (logout/login to refresh)
4. **Coach clicks "My Team"**
5. **Coach adds students** to the roster one by one
6. **Tournament time**: Coach bulk registers the team
7. **Students compete** and scores are tracked
8. **View team performance** on leaderboards

### Managing Multiple Seasons

- Coach stays assigned to the team
- Add/remove shooters as roster changes
- Keep team name consistent across seasons
- Track historical performance by team

## Permissions Matrix

| Action | Shooter | Coach | Admin |
|--------|---------|-------|-------|
| Be assigned to team | ✅ | ✅ | ✅ |
| Add shooters to team | ❌ | ✅ (their team) | ✅ |
| Remove shooters from team | ❌ | ✅ (their team) | ✅ |
| View team roster | ✅ | ✅ | ✅ |
| Bulk register team | ❌ | ✅ | ✅ |
| Self-join team | ✅ | ❌ | ✅* |

*Admin can if they also have a shooter profile

## Current Limitations

1. **One team per coach**: Coaches can only coach one team at a time
2. **Script required**: Assigning coach to team requires running a script
3. **No unregister**: Coaches can register but not unregister shooters from tournaments
4. **No team creation UI**: Teams must be created through existing UI or scripts

## Future Enhancements

- [ ] Coach can create their own team
- [ ] Coach can transfer coaching duties
- [ ] Coach dashboard with team statistics
- [ ] Coach can view all team members' scores
- [ ] Email notifications to team members
- [ ] Multi-team coaching support
- [ ] Team roster history
- [ ] Import roster from CSV

## Troubleshooting

### "You're not coaching a team yet"
- You haven't been assigned to a team
- Run the assign script or contact admin

### Can't see "My Team" link
- Your role is not "coach"
- Logout and login again after role change
- Check for the "Coach" badge in navbar

### Can't add shooter to team
- Shooter might already be on another team
- Ask them to leave their current team first
- Or use the "Add" button which will move them

### Changes not showing
- Refresh the page
- Check browser console for errors
- Verify your session is fresh (logout/login)

## Example: RMCB Team Setup

For your specific case with gvwallace@live.com and RMCB:

```bash
# Already done for you!
✅ Updated gvwallace@live.com to coach role
✅ Assigned George Wallace as coach of team "RMCB"
```

**Next steps for you:**
1. **Logout and login** at http://localhost:3000
2. Look for **"Coach" badge** next to your name
3. Click **"My Team"** in the navigation
4. Start adding shooters to RMCB!

## Support

For questions or issues:
- Review this documentation
- Check COACH_REGISTRATION.md for bulk registration
- Check TROUBLESHOOTING.md for common issues
- Open a GitHub issue

---

**Status: ✅ Fully Implemented and Ready to Use**

Your account (gvwallace@live.com) is now:
- ✅ Coach role
- ✅ Assigned to team RMCB
- ✅ Ready to manage your team roster!

Just logout and login to see the changes! 🎯

