# Coach Registration Guide

This guide explains how the coach registration system works and how to use it.

## Overview

The Clay Target Tracker application now supports two types of registration:

1. **Self-Registration**: Shooters can register themselves for tournaments
2. **Coach Registration**: Coaches can register multiple shooters at once (bulk registration)

## User Roles

### Shooter
- Default role for all users
- Can register themselves for tournaments
- Can enter their own scores
- Can join/leave teams
- Gets a shooter profile automatically upon signup

### Coach
- Can register multiple shooters for tournaments (bulk registration)
- Can view all available shooters in the system
- Can search and filter shooters
- Can select specific shooters or select all
- Does NOT get a shooter profile (coaches don't compete)
- Cannot register themselves as a shooter

### Admin
- Has all permissions of both Shooter and Coach
- Can perform bulk registrations
- Can manage tournaments
- Future: Additional administrative capabilities

## How to Sign Up as a Coach

1. Navigate to the signup page
2. Fill in your name, email, and password
3. In the "I am a" dropdown, select **Coach**
4. You'll see a description: "Coaches can register multiple shooters for tournaments"
5. Click "Sign Up"

## Using Coach Registration

### Step 1: Access the Coach Registration Panel

1. Log in as a coach
2. Navigate to any tournament with status "Upcoming"
3. At the top of the tournament page, you'll see the "Coach Registration" panel
4. This panel only appears for coaches on upcoming tournaments

### Step 2: Search and Select Shooters

The coach registration panel includes:

- **Search Bar**: Search shooters by name, email, or team
- **Select All Button**: Select all shooters matching your search
- **Clear Button**: Deselect all shooters
- **Shooter List**: Scrollable list showing:
  - Checkbox for selection
  - Shooter name
  - Email address
  - Team affiliation (if any)

### Step 3: Register Selected Shooters

1. Check the boxes next to the shooters you want to register
2. The button will show how many shooters are selected
3. Click "Register X Shooter(s)"
4. You'll see a success message showing:
   - How many shooters were successfully registered
   - How many were already registered (if any)

### Features

#### Smart Filtering
- Already registered shooters are automatically hidden from the list
- If all shooters are registered, you'll see a message: "All shooters are already registered"

#### Search Functionality
- Search works across:
  - Shooter names
  - Email addresses
  - Team names
- Real-time filtering as you type
- Case-insensitive search

#### Bulk Selection
- **Select All**: Selects all shooters currently visible (respects search filter)
- **Clear**: Deselects all shooters
- Selection count is always visible

#### Validation
- Cannot submit without selecting at least one shooter
- Prevents duplicate registrations automatically
- Shows clear error messages if something goes wrong

## Self-Registration (Shooters)

Shooters can still register themselves:

1. Browse to a tournament detail page
2. Click "Register for Tournament" button
3. Confirmation appears immediately
4. Can only register if not already registered

## Visual Indicators

### Navbar Badge
- Coaches see a "Coach" badge next to their name
- Admins see an "Admin" badge
- Helps identify role at a glance

### Role Selection on Signup
- Clear dropdown with role options
- Descriptive text explaining each role
- User-friendly interface

## API Endpoints

### Bulk Registration
```http
POST /api/registrations/bulk
Content-Type: application/json

{
  "tournamentId": "tournament_id_here",
  "shooterIds": ["shooter_id_1", "shooter_id_2", "..."]
}
```

**Response:**
```json
{
  "message": "Successfully registered X shooter(s)",
  "registered": 5,
  "alreadyRegistered": 2,
  "total": 7
}
```

**Authorization:**
- Requires authentication
- User must have role "coach" or "admin"
- Returns 403 if user is not authorized

### Individual Registration
```http
POST /api/registrations
Content-Type: application/json

{
  "tournamentId": "tournament_id_here",
  "shooterId": "shooter_id_here"
}
```

**Authorization:**
- Requires authentication
- Shooter must belong to current user
- Prevents duplicate registrations

## Use Cases

### Youth Team Coach
A coach managing a youth clay target team can:
1. Create tournaments for their team
2. Register all team members at once
3. Track team performance through the leaderboard
4. View individual and team statistics

### Club Administrator
A club admin running regular shoots can:
1. Set up tournament as admin
2. Register all pre-registered shooters in bulk
3. Allow walk-ins to self-register
4. Mix and match registration methods

### Individual Shooter
An individual shooter can:
1. Browse available tournaments
2. Self-register for events
3. Enter scores independently
4. Compete with or without a team

## Permissions Matrix

| Action | Shooter | Coach | Admin |
|--------|---------|-------|-------|
| Self-register for tournaments | ✅ | ❌ | ✅* |
| Bulk register others | ❌ | ✅ | ✅ |
| Create tournaments | ✅ | ✅ | ✅ |
| Enter own scores | ✅ | ❌ | ✅* |
| View leaderboards | ✅ | ✅ | ✅ |
| Join teams | ✅ | ❌ | ✅* |
| Create teams | ✅ | ✅ | ✅ |

*Admin can do these only if they also have a shooter profile

## Best Practices

### For Coaches
1. **Search First**: Use the search feature to find specific shooters quickly
2. **Review Selection**: Double-check your selection count before submitting
3. **Team Registration**: You can select all members of a team by searching for the team name
4. **Early Registration**: Register shooters early for better tournament planning

### For Shooters
1. **Self-Register Early**: Register yourself as soon as tournaments are announced
2. **Update Team Info**: Keep your team affiliation up to date
3. **Check Tournament Status**: Only upcoming tournaments allow registration

## Troubleshooting

### "Only coaches and admins can perform bulk registration"
- Your account is not set to coach role
- Contact admin or create a new account with coach role

### "Shooter is not in the list"
- They may already be registered (check registered shooters section)
- They may not have a shooter account (they need to sign up as a shooter)
- Clear your search filter to see all shooters

### "Failed to register shooters"
- Check your internet connection
- Ensure tournament is still "Upcoming" status
- Try selecting fewer shooters at once
- Refresh the page and try again

## Future Enhancements

Potential future features for coach registration:

- [ ] Coach-specific dashboards
- [ ] Team roster management
- [ ] Bulk score entry by coaches
- [ ] Coach can view scores of their registered shooters
- [ ] Email notifications to registered shooters
- [ ] Import shooter lists from CSV
- [ ] Registration approval workflow
- [ ] Waitlist management
- [ ] Payment processing integration

## Database Schema

### User Model
```prisma
model User {
  role String @default("shooter") // shooter, coach, admin
}
```

### Registration Flow
1. Coach selects shooters (must have shooter profiles)
2. System checks for existing registrations
3. Creates new registration records
4. Returns summary of results
5. Page refreshes to show updated registrations

## Security Considerations

- **Role Verification**: Backend validates user role on every request
- **Authorization**: Only coaches/admins can access bulk registration endpoint
- **Ownership**: Shooters can only self-register their own profile
- **Duplicate Prevention**: Database constraints prevent duplicate registrations
- **Session Management**: All actions require valid authenticated session

## Support

For issues or questions:
1. Check this documentation
2. Review the QUICKSTART.md guide
3. Open an issue on GitHub
4. Contact your system administrator

