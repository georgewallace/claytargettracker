# Live Leaderboard System

## Overview

The live leaderboard provides real-time tournament standings with multiple championship categories. It displays top 3 individuals, top 3 squads, and championship titles (HAA and HOA) with automatic refresh capabilities.

---

## Features

### ✅ **Championship Categories**

#### 1. **HOA - High Over All** 👑
**Definition**: Combines scores from **ALL disciplines and events** in the tournament.

- **Golden trophy color scheme**
- Includes every discipline: Trap, Skeet, Sporting Clays, 5-Stand, etc.
- The shooter with the highest total across all events wins HOA
- Shows total score and number of disciplines participated

**Example**:
```
🥇 John Doe (RMCB • Senior)
   Score: 392 (4 disciplines)
```

---

#### 2. **HAA - High All-Around** 🎯
**Definition**: Combines scores from **core disciplines** only (Trap, Skeet, Sporting Clays).

- **Purple trophy color scheme**
- Requires participation in at least **2 core disciplines**
- **Exclusion Rule**: If a shooter wins HOA, they are **excluded from HAA in their division**
- This prevents double-awarding and encourages competition across more shooters

**Example**:
```
🥇 Jane Smith (RMCB • Junior Varsity)
   Score: 285 (3 core disciplines)
```

**Why the exclusion rule?**
- HOA is the ultimate championship (all events)
- Winning HOA already recognizes overall excellence
- Excluding HOA winners from HAA gives other shooters a chance to win
- Creates more competitive balance and recognition opportunities

---

#### 3. **Top 3 Individuals** 🏅
- **Blue color scheme**
- Overall tournament leaders
- Total combined score across all participated disciplines
- Shows placement medals (🥇🥈🥉)

---

#### 4. **Top 3 Squads** 👥
- **Green color scheme**
- Combined scores of all squad members
- Shows squad name, team affiliation, and member names
- Encourages team collaboration

---

## User Interface

### **Two View Modes**

#### 1. **🏆 Podium View** (Default)
- Shows **Top 3** in each category
- Perfect for quick glance at leaders
- Great for projection/large screens
- Color-coded championship cards

#### 2. **📊 Full Standings View**
- Shows **ALL shooters** ranked by total score
- **Expandable rows** to see discipline breakdowns
- Click any shooter to view:
  - Individual discipline scores
  - Score breakdown by discipline
  - Total across all disciplines
- Medal emojis for top 3, rankings for rest (#4, #5, etc.)

### **Visual Design**
- **Dark gradient background** (gray-900 → indigo-900 → purple-900)
- **Glass-morphism cards** with backdrop blur
- **Color-coded categories** for easy identification
- **Medal emojis** for 1st, 2nd, 3rd place
- **Large, bold numbers** for scores
- **Responsive grid layout** (2 columns on desktop, 1 on mobile)
- **Expandable shooter details** with discipline breakdowns

### **Auto-Refresh**
- ✅ **Automatic refresh every 30 seconds** (default on)
- 🟢 Green pulsing dot indicates active refresh
- ⏸️ Pause/Resume button to control refresh
- Perfect for live display on monitors/projectors

### **View Toggle**
- Switch between **Podium** and **Full Standings** views
- Toggle buttons at top right
- State persists until page reload

---

## Access

### **Who Can View**
- **Everyone** - Leaderboard is public to all users
- No authentication required (can be viewed by spectators)

### **How to Access**
1. Navigate to tournament details page
2. Click **"🏆 Leaderboard"** button (yellow button at top)
3. View live standings

---

## Calculation Logic

### **Individual Scores**
```typescript
// For each shooter
totalScore = sum of all scores across all disciplines
disciplineCount = number of disciplines participated
```

### **Squad Scores**
```typescript
// For each squad
squadTotal = sum of all member scores
memberCount = number of shooters in squad
```

### **HOA Calculation**
```typescript
hoaScore = sum of ALL discipline scores
// Top 3 shooters with highest hoaScore
```

### **HAA Calculation**
```typescript
// Core disciplines: Trap, Skeet, Sporting Clays
haaScore = sum of CORE discipline scores only
// Must have at least 2 core disciplines
// Exclude HOA winners from HAA in their division
```

### **Exclusion Rule Implementation**
```typescript
// Get HOA winners
const hoaWinners = getTopHOA()

// For HAA calculation
const haaEligibleShooters = allShooters.filter(shooter => {
  // Exclude if this shooter won HOA in their division
  return !hoaWinners.some(winner => 
    winner.shooterId === shooter.shooterId && 
    winner.division === shooter.division
  )
})
```

---

## Display Format

### **Card Structure**
```
┌─────────────────────────────────────────┐
│ 👑 HOA - High Over All                  │
│ All Disciplines Combined                │
├─────────────────────────────────────────┤
│ 🥇  John Doe              392           │
│     RMCB • Senior       4 disciplines   │
├─────────────────────────────────────────┤
│ 🥈  Jane Smith            385           │
│     RMCB • JV           4 disciplines   │
├─────────────────────────────────────────┤
│ 🥉  Bob Johnson           378           │
│     Independent         3 disciplines   │
└─────────────────────────────────────────┘
```

---

## Technical Details

### **Files**
- `app/tournaments/[id]/leaderboard/page.tsx` - Server component (data fetching)
- `app/tournaments/[id]/leaderboard/Leaderboard.tsx` - Client component (display & refresh)

### **Data Flow**
1. Server fetches tournament with all shoots, scores, and squads
2. Client component calculates standings
3. Auto-refresh triggers `router.refresh()` every 30s
4. Server re-fetches latest data
5. Client recalculates and displays updated standings

### **Performance**
- Calculations happen client-side for instant updates
- Server-side data fetching ensures fresh data
- Efficient filtering and sorting algorithms
- Optimized for tournaments with 100+ shooters

---

## Championship Rules Summary

| Category | Events Included | Requirements | Exclusions |
|----------|----------------|--------------|------------|
| **HOA** | ALL disciplines | 1+ discipline | None |
| **HAA** | Core disciplines only | 2+ core disciplines | HOA winners (same division) |
| **Top 3 Individual** | ALL disciplines | 1+ discipline | None |
| **Top 3 Squad** | ALL squad member scores | 1+ member with scores | None |

---

## Examples

### **Scenario 1: Shooter Wins HOA**
```
John Doe (Senior Division)
- HOA Score: 392 (all disciplines)
- HAA Score: 285 (core disciplines)

Result:
✅ Wins HOA
❌ Excluded from HAA in Senior Division
✅ Can still appear in Top 3 Overall
```

### **Scenario 2: Different Divisions**
```
John Doe (Senior) - HOA Winner
Jane Smith (JV) - Can win HAA

Result:
✅ John wins HOA
✅ Jane can win HAA (different division)
```

### **Scenario 3: Squad Scoring**
```
Squad A: RMCB Team
- Member 1: 98
- Member 2: 95
- Member 3: 92
- Member 4: 89
Squad Total: 374

Squad B: Mixed Team
- Member 1: 100
- Member 2: 100
- Member 3: 90
Squad Total: 290

Result: Squad A wins (higher total)
```

---

## Future Enhancements

### 🎯 **Potential Features**
- [ ] Division-specific leaderboards
- [ ] Historical comparison (vs. previous tournaments)
- [ ] Export to PDF for printing
- [ ] Share on social media
- [ ] Detailed breakdowns per discipline
- [ ] Live updates via WebSockets (instead of polling)
- [ ] Configurable refresh interval
- [ ] Full-screen "stadium display" mode
- [ ] QR code for spectator access

---

## Testing

### **Test Scenarios**
1. ✅ View leaderboard with no scores (should show "No scores yet")
2. ✅ Enter scores and verify calculations
3. ✅ Verify HOA winners are excluded from HAA
4. ✅ Test auto-refresh functionality
5. ✅ Verify responsive design on mobile
6. ✅ Test with large number of shooters (100+)
7. ✅ Verify squad totals are accurate

---

## Notes

- Leaderboard updates automatically every 30 seconds by default
- Medal emojis (🥇🥈🥉) provide visual hierarchy
- Color coding helps distinguish categories quickly
- Great for projection on large screens during tournaments
- No authentication required - perfect for spectators


