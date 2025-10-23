# Disciplines System Guide

## Overview

The Clay Target Tracker now supports multiple shooting disciplines per tournament, allowing shooters to compete in:
- **Sporting Clays**
- **5-Stand**
- **Skeet**
- **Trap**

Shooters can register for multiple disciplines within a single tournament, and their scores are tracked separately for each discipline over time.

---

## Key Features

### 1. **Tournament Creation with Disciplines**
When creating a tournament, organizers can:
- Select one or more disciplines to offer
- Each tournament can include all four disciplines or any subset

**How it works:**
- Navigate to "Create Tournament"
- Select which disciplines to include (at least one required)
- All selected disciplines will be available for shooter registration

### 2. **Shooter Registration**
Shooters can choose which disciplines they want to compete in:

**Self-Registration:**
- Click "Register for Tournament" on tournament detail page
- Select one or more disciplines from available options
- System tracks self-selected disciplines

**Coach-Led Bulk Registration:**
- Coaches can register multiple shooters at once
- Select disciplines that apply to all selected shooters
- System tracks these as coach-assigned disciplines

### 3. **Score Entry by Discipline**
When entering scores:
- If registered for multiple disciplines, select which discipline to enter scores for
- Each discipline maintains its own score record
- Standard 5-station scoring (targets hit / total targets per station)

**How to enter scores:**
1. Navigate to tournament detail page
2. Click "Enter My Scores"
3. Select discipline (if registered for multiple)
4. Enter targets hit for each of 5 stations
5. Submit scores

### 4. **Leaderboards with Discipline Tabs**
Tournament leaderboards now support discipline filtering:
- **"All Disciplines" tab**: Shows all shoots across all disciplines
- **Individual discipline tabs**: Filter by specific discipline
- Rankings update in real-time based on total targets hit

**Features:**
- 🥇🥈🥉 medals for top 3 finishers
- Color-coded highlighting for podium positions
- Shows shooter name, team, score, and percentage
- Separate rankings per discipline

### 5. **Shooter History Page**
New dedicated history page (`/history`) shows:
- Complete shooting history across all tournaments
- Statistics by discipline:
  - Total number of shoots
  - Total score (targets hit / total possible)
  - Average percentage
- Detailed table of all shoots with:
  - Date, tournament name, discipline
  - Score and percentage
  - Color-coded performance badges
  - Station-by-station breakdown

---

## Database Structure

### Core Models

**Discipline** - The four shooting disciplines
- `id`, `name`, `displayName`, `description`
- Seeded on first migration

**TournamentDiscipline** - Links tournaments to available disciplines
- Many-to-many relationship between Tournament and Discipline

**RegistrationDiscipline** - Tracks which disciplines each shooter registered for
- Links Registration to Discipline
- `assignedBy` field tracks if coach assigned or self-selected

**Shoot** - Individual shooting session
- Unique combination of Tournament + Shooter + Discipline
- Links to multiple Score records
- Allows historical tracking of progress

**Score** - Individual station scores
- Links to Shoot (not directly to Tournament/Shooter)
- One score per station per shoot
- Unique constraint on `[shootId, station]`

### Data Flow

```
Tournament
  ├─ has many TournamentDisciplines
  │    └─ linked to Discipline
  │
  ├─ has many Registrations
  │    ├─ linked to Shooter
  │    └─ has many RegistrationDisciplines
  │         ├─ linked to Discipline
  │         └─ tracks assignedBy (coach or self)
  │
  └─ has many Shoots
       ├─ linked to Shooter
       ├─ linked to Discipline
       └─ has many Scores (one per station)
```

---

## API Endpoints

### Tournament Creation
**POST /api/tournaments**
```json
{
  "name": "Spring Championship",
  "location": "Springfield Gun Club",
  "date": "2025-04-15T09:00:00",
  "disciplineIds": ["discipline-id-1", "discipline-id-2"]
}
```

### Shooter Registration
**POST /api/registrations**
```json
{
  "tournamentId": "tournament-id",
  "shooterId": "shooter-id",
  "disciplineIds": ["discipline-id-1", "discipline-id-2"]
}
```

### Bulk Registration (Coaches)
**POST /api/registrations/bulk**
```json
{
  "tournamentId": "tournament-id",
  "shooterIds": ["shooter-1", "shooter-2"],
  "disciplineIds": ["discipline-id-1"]
}
```

### Score Entry
**POST /api/shoots**
```json
{
  "tournamentId": "tournament-id",
  "shooterId": "shooter-id",
  "disciplineId": "discipline-id",
  "scores": [
    { "station": 1, "targets": 23, "totalTargets": 25 },
    { "station": 2, "targets": 22, "totalTargets": 25 },
    // ... stations 3-5
  ]
}
```

---

## Usage Examples

### Example 1: Creating a Multi-Discipline Tournament
```typescript
// Tournament with all 4 disciplines
{
  name: "National Championship 2025",
  location: "State Shooting Complex",
  date: "2025-06-01",
  disciplineIds: [
    "sporting_clays_id",
    "five_stand_id",
    "skeet_id",
    "trap_id"
  ]
}
```

### Example 2: Shooter Registers for Multiple Disciplines
1. Shooter navigates to tournament
2. Clicks "Register for Tournament"
3. Selects: Sporting Clays ✓, 5-Stand ✓, Skeet ✗, Trap ✗
4. Submits registration
5. Can now enter scores for Sporting Clays and 5-Stand

### Example 3: Coach Bulk Registers Team
1. Coach navigates to tournament
2. Sees "Coach Registration" panel
3. Selects disciplines: Trap ✓
4. Searches and selects 5 team members
5. Clicks "Register Selected Shooters"
6. All 5 shooters registered for Trap with coach assignment

### Example 4: Viewing Discipline-Specific Leaderboard
1. Navigate to tournament detail page
2. Scroll to leaderboard section
3. Click "Sporting Clays" tab
4. View rankings for only Sporting Clays shoots
5. See top performers highlighted with medals

---

## Migration Guide

### Updating Existing Tournaments

If you have existing tournaments without disciplines:

1. **Database seeding** already populated 4 disciplines
2. **Existing tournaments** will need disciplines assigned manually via Prisma Studio or scripts
3. **Existing registrations** will need RegistrationDiscipline entries created
4. **Existing scores** need to be migrated to new Shoot/Score structure

### Manual Fix Script Example
```javascript
// scripts/migrate-existing-data.js
const { prisma } = require('../lib/prisma')

async function migrateData() {
  // Get all tournaments without disciplines
  const tournaments = await prisma.tournament.findMany({
    include: { disciplines: true }
  })
  
  const sportingClays = await prisma.discipline.findUnique({
    where: { name: 'sporting_clays' }
  })
  
  for (const tournament of tournaments) {
    if (tournament.disciplines.length === 0) {
      // Default to Sporting Clays
      await prisma.tournamentDiscipline.create({
        data: {
          tournamentId: tournament.id,
          disciplineId: sportingClays.id
        }
      })
    }
  }
}

migrateData()
```

---

## Best Practices

### For Tournament Organizers
1. **Always select at least one discipline** when creating tournaments
2. **Consider offering all four disciplines** for larger events
3. **Check registrations by discipline** to ensure balanced participation

### For Coaches
1. **Discuss with shooters** before bulk registering them for disciplines
2. **Use discipline selection thoughtfully** - don't overwhelm shooters
3. **Review team registrations** in the "My Team" page

### For Shooters
1. **Only register for disciplines you plan to shoot**
2. **Enter scores promptly** after completing each discipline
3. **Use "My History" page** to track progress over time
4. **View discipline-specific leaderboards** to see your rankings

---

## Troubleshooting

### "No disciplines available for tournament"
- Tournament organizer didn't select any disciplines
- Contact admin to update tournament configuration

### "Shooter not registered for this discipline"
- Can't enter scores for disciplines not registered for
- Register for additional disciplines (if still open)

### "Scores not appearing in leaderboard"
- Ensure scores were saved successfully
- Refresh the page
- Check correct discipline tab is selected

### "Can't see discipline tabs in leaderboard"
- Tournament only has one discipline (tabs hidden)
- No shoots have been entered yet

---

## Future Enhancements

Potential future features:
- [ ] Allow coaches to modify shooter discipline assignments
- [ ] Add discipline-specific team rankings
- [ ] Export discipline statistics to CSV
- [ ] Add discipline badges/achievements
- [ ] Compare performance across disciplines
- [ ] Set personal goals per discipline
- [ ] Add discipline-specific round types (e.g., 100-target sporting clays)

---

## Support

For questions or issues with the disciplines system:
1. Check this guide first
2. Review the [Troubleshooting Guide](TROUBLESHOOTING.md)
3. Check [Features Documentation](FEATURES.md)
4. Contact your system administrator

