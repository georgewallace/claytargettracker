# Score Entry System

## Overview

The score entry system allows coaches and admins to enter scores for shooters in a tournament. This document covers the implementation for **Skeet and Trap** scoring (Sporting Clays and 5-Stand will have different scoring methods to be implemented later).

---

## Features

### ✅ **Squad-Based Scoring**
- Select a squad from any time slot
- All shooters in the squad are displayed in a table
- Easy-to-use table format for rapid score entry

### ✅ **Multi-Round Support**
- Skeet and Trap support up to **4 rounds** per shooter
- Each round has a max score of **25 targets**
- Automatic total calculation across all rounds

### ✅ **Score Validation**
- Scores are limited to 0-25 per round
- Real-time total calculation
- Input validation prevents invalid entries

### ✅ **Score Persistence**
- Scores are automatically loaded when a squad is selected
- Save scores with a single button click
- Scores are linked to the shooter, discipline, and date

---

## User Interface

### **Access Score Entry**
1. Navigate to a tournament details page
2. Click **"Enter Scores"** button (visible to coaches and admins)
3. Select a discipline from the tabs
4. Choose a squad from the list

### **Score Entry Table**
**Spreadsheet-Style Design** for Easy Copy/Paste:

```
┌─────────────┬──────┬────┬────┬────┬────┬───────┐
│ Shooter     │ Team │ R1 │ R2 │ R3 │ R4 │ Total │
├─────────────┼──────┼────┼────┼────┼────┼───────┤
│ John Doe    │ RMCB │ 23 │ 24 │ 22 │ 25 │  94   │
│ Jane Smith  │ RMCB │ 25 │ 23 │ 24 │ 24 │  96   │
└─────────────┴──────┴────┴────┴────┴────┴───────┘
```

**Features:**
- ✅ **Compact Design** - Tight spacing like a spreadsheet
- ✅ **Easy Copy/Paste** - Tab between cells, paste from Excel/Sheets
- ✅ **Auto-Select** - Click a cell to select all text
- ✅ **Keyboard Friendly** - Tab/Enter navigation
- ✅ **Visual Feedback** - Yellow highlight on focus
- ✅ **Auto-Calculate** - Total updates in real-time
- ✅ **Alternating Rows** - Easier to read
- ✅ **Monospace Numbers** - Better alignment
- ✅ **Empty Cells OK** - Leave blank if not shot yet

**Usage:**
1. Click any cell to enter a score (0-25)
2. Press Tab to move to next cell
3. Empty cells are treated as 0 for totals
4. Save button at top and bottom of table

---

## Database Schema

### **Shoot Model**
```prisma
model Shoot {
  id           String   @id @default(cuid())
  tournamentId String
  shooterId    String
  disciplineId String
  date         DateTime
  scores       Score[]
  
  tournament Tournament @relation(...)
  shooter    Shooter    @relation(...)
  discipline Discipline @relation(...)
}
```

### **Score Model**
```prisma
model Score {
  id           String @id @default(cuid())
  shootId      String
  station      Int    // Used as "Round Number" for Skeet/Trap
  targets      Int    // Number of targets hit (0-25)
  totalTargets Int    // Total targets available (25)
  
  shoot Shoot @relation(...)
}
```

### **How Rounds Work**
- For **Skeet/Trap**: `station` = round number (1, 2, 3, 4)
- For **Sporting Clays** (future): `station` = actual station number

---

## API Endpoints

### `GET /api/tournaments/[id]/scores`
**Fetch existing scores for a squad**

**Query Parameters:**
- `squadId`: ID of the squad
- `disciplineId`: ID of the discipline

**Response:**
```json
[
  {
    "id": "shoot_123",
    "shooterId": "shooter_456",
    "disciplineId": "discipline_789",
    "date": "2025-12-29T00:00:00.000Z",
    "scores": [
      { "station": 1, "targets": 23, "totalTargets": 25 },
      { "station": 2, "targets": 24, "totalTargets": 25 }
    ]
  }
]
```

---

### `POST /api/tournaments/[id]/scores`
**Save scores for shooters**

**Request Body:**
```json
{
  "scores": [
    {
      "shooterId": "shooter_456",
      "disciplineId": "discipline_789",
      "date": "2025-12-29T00:00:00.000Z",
      "rounds": [
        { "station": 1, "targets": 23, "totalTargets": 25 },
        { "station": 2, "targets": 24, "totalTargets": 25 },
        { "station": 3, "targets": 22, "totalTargets": 25 },
        { "station": 4, "targets": 25, "totalTargets": 25 }
      ]
    }
  ]
}
```

**Response:**
```json
{
  "message": "Scores saved successfully"
}
```

**Behavior:**
- Creates a `Shoot` record if one doesn't exist
- Deletes existing scores for the shoot
- Creates new score records for each round
- This allows updating scores by re-submitting

---

## Files

### **Pages**
- `app/tournaments/[id]/scores/page.tsx` - Server component, fetches tournament and squad data
- `app/tournaments/[id]/scores/ScoreEntry.tsx` - Client component, score entry UI

### **API Routes**
- `app/api/tournaments/[id]/scores/route.ts` - GET (fetch scores) and POST (save scores)

### **Updated Files**
- `app/tournaments/[id]/page.tsx` - Added "Enter Scores" button for coaches/admins

---

## Workflow

### **For Coaches/Admins**
1. **Navigate to tournament** → Click "Enter Scores"
2. **Select discipline** → Choose Skeet or Trap from tabs
3. **Select squad** → Click on a squad card
4. **Enter scores** → Type scores in the table (0-25 per round)
5. **Save** → Click "Save Scores" button
6. **Success!** → Scores are saved and can be edited anytime

---

## Future Enhancements

### 🎯 **Sporting Clays Scoring** (To Be Implemented)
- Different table format with stations (1-12+)
- Variable targets per station
- Station-based scoring instead of rounds

### 🎯 **5-Stand Scoring** (To Be Implemented)
- Similar to Sporting Clays but with 5 stations
- Multiple rounds per station

### 🎯 **Score History**
- View shooter's historical scores across tournaments
- Performance trends and statistics

### 🎯 **Mobile Optimization**
- Responsive table for smaller screens
- Touch-friendly input fields
- Quick entry mode for mobile devices

### 🎯 **Bulk Entry**
- Copy/paste from spreadsheets
- Quick entry mode for rapid data input

---

## Testing

### **Test Score Entry**
1. Create a tournament with Skeet discipline
2. Add time slots and squads
3. Assign shooters to squads
4. Go to "Enter Scores"
5. Select a squad
6. Enter scores for each round
7. Save and verify scores persist
8. Edit scores and re-save
9. View scores on tournament details page (leaderboard)

---

## Notes

- Only **coaches** and **admins** can enter scores
- Scores are tied to the **date** of the time slot
- Multiple rounds can be entered in a single session
- Scores can be edited anytime by re-entering the squad
- Empty rounds are not saved (only rounds with values)


