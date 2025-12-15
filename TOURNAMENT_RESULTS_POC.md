# Tournament Results POC - Excel Direct Download

## Overview
This is a proof-of-concept (POC) system for displaying tournament results by downloading and parsing Excel spreadsheets directly from a public URL (e.g., OneDrive share link). This system is **separate** from the existing tournament scoring and results features in the application.

## Architecture

### Data Flow
1. Tournament scores are stored in an Excel spreadsheet (e.g., OneDrive)
2. The file is shared with a public download link
3. The app fetches the Excel file directly via HTTP
4. The app parses it using the xlsx library
5. Components display various analytics and leaderboards

### Components

#### Core Files
- **`lib/useScoresTable.ts`** - React hook to fetch and parse Excel file
- **`lib/models.ts`** - TypeScript interfaces for Score data

#### UI Components
- **`components/TournamentDashboard.tsx`** - Main dashboard container
- **`components/Leaderboard.tsx`** - Individual shooter leaderboard with filtering
- **`components/TeamHOA.tsx`** - Team High Overall Average (HOA) rankings
- **`components/DisciplineBreakdown.tsx`** - Statistics by discipline
- **`components/StationAnalytics.tsx`** - Performance analysis by station

## Excel Spreadsheet Format

### Required Columns
The Excel sheet should have the following column headers in the first row:

| Column | Type | Description |
|--------|------|-------------|
| Shooter | String | Shooter name |
| Team | String | Team name |
| Gender | String | "Men" or "Ladies" |
| Division | String | "Novice", "Intermediate", "JV", "Varsity", or "Collegiate" |
| Discipline | String | e.g., "Trap", "Skeet", "Sporting Clays" |
| Round | Number | Round number |
| TargetsThrown | Number | Total targets thrown |
| TargetsHit | Number | Total targets hit |
| StationBreakdown | String | Optional: "5,5,4,4,5" (hits per station) |
| Field | String | Optional: Field identifier |
| Time | String | Optional: Time slot |
| Notes | String | Optional: Additional notes |

### Example Data
```
| Shooter      | Team    | Gender | Division | Discipline | Round | TargetsThrown | TargetsHit | StationBreakdown |
|--------------|---------|--------|----------|------------|-------|---------------|------------|------------------|
| John Doe     | Eagles  | Men    | Varsity  | Trap       | 1     | 25            | 23         | 5,5,4,5,4       |
| Jane Smith   | Eagles  | Ladies | Varsity  | Trap       | 1     | 25            | 24         | 5,5,5,4,5       |
```

## Setup Instructions

### 1. Create Excel File
Create an Excel file with your tournament data following the format above.

### 2. Share the File (OneDrive Example)
1. Upload your Excel file to OneDrive
2. Right-click the file and select "Share"
3. Choose "Anyone with the link can view"
4. Copy the share link
5. Modify the link to force download by adding `?download=1` at the end
   - Example: `https://1drv.ms/x/c/YOUR-ID/FILE-ID?download=1`

### 3. Configure Environment Variables
Add to your `.env.local` file:
```env
# Excel File Configuration
NEXT_PUBLIC_EXCEL_DOWNLOAD_URL=https://your-download-url-here?download=1
NEXT_PUBLIC_EXCEL_SHEET_NAME=Sheet1
```

**Optional:** If not specified, defaults are:
- URL: Uses the provided example URL
- Sheet Name: `Sheet1`

### 4. Restart Development Server
```bash
npm run dev
```

## Usage

### Access the Results Page
When logged in:
- Click "Results (POC)" in the navigation bar
- Or navigate directly to `/results`

### Custom Implementation
```typescript
import { TournamentDashboard } from '@/components/TournamentDashboard';

export default function ResultsPage() {
  return (
    <div>
      <h1>Tournament Results</h1>
      <TournamentDashboard />
    </div>
  );
}
```

### Custom Leaderboard
```typescript
import { Leaderboard } from '@/components/Leaderboard';
import { useScoresTable } from '@/lib/useScoresTable';

export default function VarsityLadiesPage() {
  const { data, loading, error } = useScoresTable();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <Leaderboard
      scores={data}
      discipline="Trap"
      division="Varsity"
      gender="Ladies"
      limit={20}
    />
  );
}
```

## Features

### Leaderboard
- Filter by discipline, division, and gender
- Aggregate scores across multiple rounds
- Display hits, targets, and percentage
- Configurable result limit

### Team HOA
- Aggregate team scores
- Sort by total hits
- Calculate team percentages
- Filter by discipline/division/gender

### Discipline Breakdown
- Show statistics per discipline
- Count unique shooters and rounds
- Calculate averages
- Total hits and targets

### Station Analytics
- Analyze performance by station (for Trap/Skeet)
- Parse station breakdown from scores
- Calculate average hits per station
- Identify weak stations

## Advantages Over Graph API Approach

✅ **No Azure AD Setup** - No app registration needed
✅ **No Authentication** - Works with public download links
✅ **Simple Configuration** - Just a URL and sheet name
✅ **Works Anywhere** - Any accessible Excel file URL
✅ **Fast Setup** - Minutes instead of hours
✅ **No Permissions** - No Graph API permissions to configure

## How to Get OneDrive Download Link

### Method 1: Share Link (Recommended)
1. Right-click file in OneDrive → "Share"
2. Set to "Anyone with the link can view"
3. Copy the link
4. Add `?download=1` to the end

### Method 2: Embed Link
1. Right-click file in OneDrive → "Embed"
2. Look for the download URL in the iframe code
3. Extract the direct download URL

## Troubleshooting

### "Failed to download Excel file"
- Check that the download URL is correct and publicly accessible
- Ensure `?download=1` is at the end of the URL
- Try accessing the URL directly in a browser to verify it downloads

### "Sheet not found"
- Verify the sheet name matches exactly (case-sensitive)
- Check that `NEXT_PUBLIC_EXCEL_SHEET_NAME` is set correctly
- The hook will list available sheets in the error message

### "No scores found"
- Ensure the Excel file has data in the specified sheet
- Check that column headers match exactly
- Verify the first row contains headers, not data

### Missing or Incorrect Data
- Check that all required columns are present
- Verify column names match exactly (case-sensitive)
- Ensure numeric fields (Round, TargetsThrown, TargetsHit) contain numbers

## Data Refresh

The POC currently fetches data on component mount. To refresh:
1. Reload the page
2. Navigate away and back to `/results`

**Future Enhancement:** Add a manual refresh button or automatic polling.

## Separation from Existing System

This POC is completely separate from the existing tournament scoring system. It:
- Uses different data sources (Excel download vs database)
- Has no authentication requirements
- Lives in separate components
- Doesn't interfere with existing functionality

Both systems can coexist, and you can choose which one to use for each tournament.

## Technical Details

### Libraries Used
- **xlsx** - Excel file parsing (SheetJS)
- **React** - UI components and hooks
- **TypeScript** - Type safety

### Performance Considerations
- Excel file is fetched on every page load
- Consider adding caching for production use
- Large files (>5MB) may take longer to download and parse
- Current implementation is client-side only

### Security Notes
- Download link must be publicly accessible
- No authentication or authorization
- Anyone with the link can view the data
- Don't use for sensitive/private data without proper access controls

## Future Enhancements

Potential improvements for production use:
- Add data caching with React Query or SWR
- Add refresh button for manual updates
- Add polling for automatic updates
- Support multiple tournaments/files
- Add server-side caching
- Add data validation and error recovery
- Support password-protected files
- Add export functionality
- Add comparison views (year-over-year)
- Mobile-optimized views
