# Shoot-Off System - Phase 3 Complete ✅

## Summary

**Phase 3: Tie Detection & Shoot-Off Creation** has been successfully implemented! The system now automatically detects ties on the leaderboard and allows admins to initiate shoot-offs with a single click.

## What Was Implemented

### 1. Updated Leaderboard Page (`app/tournaments/[id]/leaderboard/page.tsx`)

**Changes:**
- ✅ Import `getCurrentUser` for admin checks
- ✅ Fetch `shootOffs` with participants, winners, and rounds
- ✅ Determine if current user is admin or tournament creator
- ✅ Pass `isAdmin` prop to Leaderboard component

### 2. Updated Leaderboard Component (`Leaderboard.tsx`)

**Changes:**
- ✅ Updated `Tournament` interface to include shoot-off configuration
- ✅ Added `isAdmin` prop to component
- ✅ Implemented `detectTies()` function with comprehensive logic:
  - Parses `shootOffTriggers` from tournament settings
  - Checks for perfect score requirement
  - Groups shooters by score
  - Identifies ties at configured positions (1st, 2nd, 3rd, top 5, top 10)
  - Excludes ties that already have pending/in-progress shoot-offs
  - Returns list of detected ties with position, shooters, and description
- ✅ Integrated `TieAlert` component into leaderboard display

**Tie Detection Logic:**
```typescript
const detectTies = () => {
  if (!tournament.enableShootOffs || !tournament.shootOffTriggers) {
    return []
  }

  const triggers = JSON.parse(tournament.shootOffTriggers) as string[]
  
  // Sort shooters by score
  // Check perfect score requirement
  // Group by score
  // Find ties at configured positions
  // Exclude existing shoot-offs
  // Return tie objects
}
```

### 3. New Component: `TieAlert.tsx`

Created a beautiful alert component to display ties and initiate shoot-offs:

**Features:**
- ✅ Eye-catching yellow alert design with warning icon
- ✅ Displays tie description (position, number of shooters, score)
- ✅ Lists all tied shooters with their names, teams, and scores
- ✅ "Initiate Shoot-Off" button for admins
- ✅ Loading state during shoot-off creation
- ✅ Error handling and display
- ✅ Info message for non-admins
- ✅ Responsive design
- ✅ Multiple tie alerts stack vertically

**UI Design:**
```
┌─────────────────────────────────────────────────────────┐
│ ⚠️  🏆 Shoot-Off Required                               │
│                                                         │
│ 1st Place - 2 shooters tied at 195 points             │
│                                                         │
│ ┌─────────────────────────────────────────────┐       │
│ │ 1. John Smith (Hawks)       195 pts        │  [Init]│
│ │ 2. Jane Doe (Eagles)        195 pts        │       │
│ └─────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

### 4. API Endpoint: `/api/tournaments/[id]/shoot-offs`

Created comprehensive API for shoot-off management:

**POST - Create Shoot-Off:**
- ✅ Validates input (position, 2+ shooters)
- ✅ Checks tournament exists
- ✅ Verifies admin/creator permissions
- ✅ Calculates shooter scores to verify tie
- ✅ Ensures all shooters have same score
- ✅ Creates `ShootOff` record with status 'pending'
- ✅ Creates `ShootOffParticipant` records for each shooter
- ✅ Uses tournament's shoot-off format
- ✅ Generates descriptive name
- ✅ Returns created shoot-off with participants

**GET - List Shoot-Offs:**
- ✅ Fetches all shoot-offs for tournament
- ✅ Includes participants, rounds, scores, winner, discipline
- ✅ Orders by position (1st, 2nd, 3rd, etc.)

**Request Format:**
```json
{
  "position": 1,
  "shooterIds": ["shooter1", "shooter2"],
  "disciplineId": "optional-discipline-id"
}
```

**Response Format:**
```json
{
  "id": "shootoff123",
  "tournamentId": "tournament456",
  "position": 1,
  "status": "pending",
  "format": "sudden_death",
  "description": "1st Place Shoot-Off - 2 shooters tied at 195 points",
  "participants": [
    {
      "id": "participant1",
      "shooterId": "shooter1",
      "tiedScore": 195,
      "finalPlace": null,
      "eliminated": false,
      "shooter": {
        "user": {
          "name": "John Smith"
        }
      }
    }
  ]
}
```

## User Flow

### For Admins/Tournament Creators:

1. **Navigate to Leaderboard**
   - Go to `/tournaments/[id]/leaderboard`
   
2. **See Tie Alerts**
   - Yellow alert boxes appear at top of leaderboard
   - Shows which positions have ties
   - Lists all tied shooters with scores

3. **Initiate Shoot-Off**
   - Click "Initiate Shoot-Off" button
   - System validates tie
   - Creates shoot-off record
   - Button shows loading state
   - Page refreshes to show shoot-off created

4. **Confirmation**
   - Alert disappears (tie is now managed)
   - Shoot-off appears in tournament's shoot-off list
   - Can proceed to manage shoot-off

### For Regular Users/Shooters:

1. **View Tie Alerts**
   - See yellow alert boxes
   - Know that a shoot-off is required
   - See who is tied

2. **Wait for Admin**
   - Message: "Tournament admin will initiate the shoot-off"
   - No action required

## Tie Detection Rules

The system detects ties based on tournament configuration:

### Trigger Types:
- **1st Place** - Tied for first place
- **2nd Place** - Tied for second place  
- **3rd Place** - Tied for third place
- **Top 5** - Any ties in top 5 positions
- **Top 10** - Any ties in top 10 positions
- **Perfect Scores** - Only if at least one shooter has perfect score

### Perfect Score Logic:
- If `shootOffRequiresPerfect` is enabled
- System checks if any tied shooter has perfect score
- Perfect = disciplineCount × 100 (assuming 100 per discipline)
- If no perfect scores, NO shoot-offs are triggered
- Useful for championship rounds

### Exclusion Logic:
- Ties that already have a pending/in-progress shoot-off are excluded
- Prevents duplicate shoot-offs for the same tie
- Checks participant match to ensure accuracy

## Technical Implementation

### Database Queries:
```typescript
// Fetch tournament with shoot-offs
tournament = await prisma.tournament.findUnique({
  where: { id },
  include: {
    shootOffs: {
      include: {
        participants: {
          include: {
            shooter: {
              include: {
                user: true
              }
            }
          }
        },
        winner: {
          include: {
            user: true
          }
        }
      }
    }
  }
})
```

### Permission Checks:
```typescript
const isAdmin = user?.role === 'admin' || tournament.createdById === user?.id
const canManage = user.role === 'admin' || tournament.createdById === user.id
```

## Files Created

1. **`app/api/tournaments/[id]/shoot-offs/route.ts`** - API endpoints (180 lines)
2. **`components/TieAlert.tsx`** - Tie alert UI component (135 lines)

## Files Modified

1. **`app/tournaments/[id]/leaderboard/page.tsx`**
   - Added getCurrentUser import
   - Added shootOffs to tournament query
   - Added isAdmin calculation
   - Passed isAdmin to Leaderboard

2. **`app/tournaments/[id]/leaderboard/Leaderboard.tsx`**
   - Updated Tournament interface (6 new fields)
   - Added isAdmin prop
   - Added detectTies() function (85 lines)
   - Imported and integrated TieAlert component

## Testing Checklist

- [ ] **NEEDS TESTING:** Tie detection works correctly
  - [ ] 2-way ties detected
  - [ ] 3-way ties detected
  - [ ] Multiple ties at different positions
  - [ ] Perfect score requirement honored

- [ ] **NEEDS TESTING:** Shoot-off creation
  - [ ] Button click creates shoot-off
  - [ ] Loading state displays
  - [ ] Error messages show correctly
  - [ ] Page refreshes after creation

- [ ] **NEEDS TESTING:** Permissions
  - [ ] Only admins see "Initiate" button
  - [ ] Regular users see info message
  - [ ] API rejects non-admin requests

- [ ] **NEEDS TESTING:** Edge cases
  - [ ] No ties = no alerts
  - [ ] Shoot-offs disabled = no alerts
  - [ ] Existing shoot-off = no duplicate alert
  - [ ] Different trigger combinations work

## Known Limitations

1. **Score Calculation** - Perfect score assumes 100 points per discipline
   - May need refinement for disciplines with different max scores
   - Currently: `maxPossible = disciplineCount × 100`

2. **Discipline-Specific Shoot-Offs** - Not yet implemented
   - Can pass `disciplineId` to API
   - But UI doesn't support selecting discipline yet

3. **Tie Grouping** - Detects ties by overall score only
   - Doesn't consider division-specific ties yet
   - All shooters at same score are grouped together

## Next Steps

### Phase 4: Shoot-Off Management Interface

1. Create `/tournaments/[id]/shoot-offs` page
   - List all shoot-offs for tournament
   - Status indicators (pending, in-progress, completed)
   - Quick actions for each shoot-off

2. Create `/tournaments/[id]/shoot-offs/[shootOffId]` page
   - Detailed shoot-off view
   - Participant list with current standings
   - Start/manage rounds
   - Declare winner

**Estimated Effort:** 4-5 hours

### Phase 5: Score Entry & Round Management

1. Create round management interface
2. Implement score entry for each round
3. Auto-elimination logic
4. Winner declaration
5. Update leaderboard with final placements

**Estimated Effort:** 3-4 hours

## Progress Update

- ✅ **Phase 1:** Database Schema (Complete)
- ✅ **Phase 2:** Tournament Settings UI (Complete)
- ✅ **Phase 3:** Tie Detection & Creation (Complete)
- ⏳ **Phase 4:** Management Interface (Next - 4-5 hours)
- ⏳ **Phase 5:** Score Entry (3-4 hours)
- ⏳ **Phase 6:** Leaderboard Integration (2-3 hours)
- ⏳ **Phase 7:** Testing & Polish (2-3 hours)

**Overall: 43% complete** (3/7 phases)

---

**Phase 3 Status:** ✅ COMPLETE  
**Total Lines Added:** ~400 lines  
**Ready for Testing:** YES 🎉

