# HAA/HOA Configuration Implementation

## Overview
Implement configurable HAA (High All-Around) and HOA (High Over All) place counts based on TournamentTracker.xlsx Tournament Setup sheet configuration.

## Current State
The tournament model has basic HAA/HOA settings:
- `enableHOA: boolean`
- `enableHAA: boolean`
- `hoaSeparateGender: boolean`
- `haaCoreDisciplines: string | null`
- `hoaExcludesHAA: boolean`
- `haaExcludesDivision: boolean`

The leaderboard currently shows hardcoded top 3 for all categories.

## Excel Configuration Reference
From TournamentTracker.xlsx "Tournament Setup" sheet:

### HAA Configuration (Rows 16-20)
- Places for HAA (combined): 0
- Places for HAA Men: 2
- Places for HAA Lady: 2
- Total HAA Places: 4

### HOA Configuration (Rows 22-26)
- Places for HOA (combined): 0 for each discipline
- Places for HOA Men: 2 each for Skeet/Trap/Sporting
- Places for HOA Lady: 2 each for Skeet/Trap/Sporting
- Note: "You can do HOA, HOA Men, and HOA Lady"

## Tasks

### 1. Add HAA/HOA place configuration fields to tournament model
- [ ] Add `haaPlacesCombined: number` (default: 0)
- [ ] Add `haaPlacesMen: number` (default: 0)
- [ ] Add `haaPlacesLady: number` (default: 0)
- [ ] Add `hoaPlacesCombined: number` (default: 0)
- [ ] Add `hoaPlacesMen: number` (default: 0)
- [ ] Add `hoaPlacesLady: number` (default: 0)
- [ ] Consider if discipline-specific HOA place counts are needed

### 2. Update tournament setup form with HAA place counts
- [ ] Add input fields for HAA combined places
- [ ] Add input fields for HAA men places
- [ ] Add input fields for HAA lady places
- [ ] Show/hide based on `hoaSeparateGender` setting
- [ ] Add validation (must be >= 0)

### 3. Update tournament setup form with HOA place counts per discipline
- [ ] Add input fields for HOA combined places
- [ ] Add input fields for HOA men places
- [ ] Add input fields for HOA lady places
- [ ] Show/hide based on `hoaSeparateGender` setting
- [ ] Consider if per-discipline counts are needed or if one count applies to all

### 4. Update leaderboard to show configurable number of places
- [ ] Update Podium view HAA section to use configured place counts
- [ ] Update Podium view HOA section to use configured place counts
- [ ] Change from hardcoded `.slice(0, 3)` to use tournament config
- [ ] Handle case when places = 0 (don't show section)
- [ ] Update medal display logic (only show 🥇🥈🥉 for top 3, then numbers)

### 5. Add database migration for new HAA/HOA configuration fields
- [ ] Create Prisma migration for new tournament fields
- [ ] Add default values for existing tournaments (0 or current behavior)
- [ ] Test migration on development database
- [ ] Update TypeScript types

### 6. Test HAA/HOA configuration with different place counts
- [ ] Test with 0 places (section should not show)
- [ ] Test with 2 places (as per Excel example)
- [ ] Test with 3+ places
- [ ] Test combined vs gender-separated modes
- [ ] Test with Excel import to verify configuration matches

## Notes
- The current implementation shows top 3 for everything
- The Excel suggests configurable place counts (0, 2, etc.)
- Need to decide if HOA place counts are per-discipline or tournament-wide
- Consider backward compatibility for existing tournaments

## Excel File Information

### File Location
`/Users/georgewallace/elastic-repos/claytargettracker/TournamentTracker.xlsx`

### How to Read the Excel File
```javascript
const XLSX = require('xlsx');
const workbook = XLSX.readFile('/path/to/TournamentTracker.xlsx');

// Get sheet names
console.log('Available sheets:', workbook.SheetNames);

// Read a specific sheet
const setupSheet = workbook.Sheets['Tournament Setup'];

// Convert to JSON (array of arrays)
const data = XLSX.utils.sheet_to_json(setupSheet, { header: 1, defval: null });

// Access specific cells
// Row 17 (index 16), Column B (index 1) = Places for HAA
const haaPlacesCombined = data[16][1];

// Row 18, Column B = Places for HAA Men
const haaPlacesMen = data[17][1];

// Row 19, Column B = Places for HAA Lady
const haaPlacesLady = data[18][1];

// Row 24, Column B = Places for HOA Men (Skeet)
// Row 24, Column C = Places for HOA Men (Trap)
// Row 24, Column D = Places for HOA Men (Sporting)
const hoaMenSkeet = data[23][1];
const hoaMenTrap = data[23][2];
const hoaMenSporting = data[23][3];
```

### Sheet Structure

#### Tournament Setup Sheet
Contains tournament configuration including:

**HAA Section (Rows 16-20):**
- Row 16: Headers ["HAA", "# of Places"]
- Row 17: ["Places for HAA", 0]
- Row 18: ["Places for HAA Men", 2]
- Row 19: ["Places for HAA Lady", 2]
- Row 20: ["Total HAA Places", 4]

**HOA Section (Rows 22-26):**
- Row 22: Headers ["HOA Events", "# of Skeet Places", "# of Trap Places", "# of Sporting Places"]
- Row 23: ["Places for HOA", 0, 0, 0, "You can do HOA, HOA Men, and HOA Lady"]
- Row 24: ["Places for HOA Men", 2, 2, 2]
- Row 25: ["Places for HOA Lady", 2, 2, 2]
- Row 26: ["Total HOA Places", 4, 4, 4]

**Events Section (Rows 1-4):**
- Row 1: ["Events", "Tournament Events", "Fees"]
- Row 2: ["Skeet", "X", 40]
- Row 3: ["Trap", "X", 40]
- Row 4: ["Sporting Clays", "X", 40]

### Cell Reference Guide
Zero-indexed row/column access:
- Row 17 in Excel = index 16 in array
- Row 18 in Excel = index 17 in array
- Column A = index 0
- Column B = index 1
- Column C = index 2
- Column D = index 3

### Other Sheets
- **Team Setup**: Team information (ID, name, head coach, contact info)
- **Individual Setup**: Athlete information (ID, name, birthdate, gender, team, events)
- **Shooter-Squad Assignment**: Squad assignments per discipline
- **Squad Listing**: Squad definitions
- **Tournament List**: Full tournament data with scores

### Reading Cell Values
```javascript
// Method 1: Using sheet_to_json with header: 1
const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
const value = data[rowIndex][colIndex];

// Method 2: Direct cell access
const cellAddress = 'B17'; // Column B, Row 17
const cell = sheet[cellAddress];
const value = cell ? cell.v : null;

// Method 3: Using encode/decode
const cellRef = XLSX.utils.encode_cell({r: 16, c: 1}); // Row 17, Column B
const cell = sheet[cellRef];
const value = cell ? cell.v : null;
```
