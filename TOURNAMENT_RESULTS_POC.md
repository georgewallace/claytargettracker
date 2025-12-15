# Tournament Results POC - OneDrive Integration

## Overview
This is a proof-of-concept (POC) system for displaying tournament results by connecting to Excel spreadsheets stored in OneDrive using Microsoft Graph API. This system is **separate** from the existing tournament scoring and results features in the application.

## Architecture

### Data Flow
1. Tournament scores are stored in an Excel spreadsheet on OneDrive (`/Tournaments/2025/Scores.xlsx`)
2. The spreadsheet has a table named `ScoresTable` with structured data
3. The app authenticates with Microsoft Graph API using MSAL
4. The app fetches data from the spreadsheet in real-time
5. Components display various analytics and leaderboards

### Components

#### Core Files
- **`lib/authConfig.ts`** - Microsoft Authentication Library (MSAL) configuration
- **`lib/graphClient.ts`** - Microsoft Graph API client for fetching data
- **`lib/models.ts`** - TypeScript interfaces for Score data
- **`lib/useScoresTable.ts`** - React hook to fetch scores from Excel table

#### UI Components
- **`components/TournamentDashboard.tsx`** - Main dashboard container
- **`components/Leaderboard.tsx`** - Individual shooter leaderboard with filtering
- **`components/TeamHOA.tsx`** - Team High Overall Average (HOA) rankings
- **`components/DisciplineBreakdown.tsx`** - Statistics by discipline
- **`components/StationAnalytics.tsx`** - Performance analysis by station

## Excel Spreadsheet Format

### Table: ScoresTable
The Excel table should have the following columns:

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

### 1. Azure AD App Registration
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations** > **New registration**
3. Configure:
   - Name: "Clay Target Tracker Results"
   - Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
   - Redirect URI:
     - Type: Single-page application (SPA)
     - URI: `http://localhost:3000` (dev) and your production URL
4. After creation, note the **Application (client) ID** and **Directory (tenant) ID**

### 2. API Permissions
Add the following Microsoft Graph permissions:
- `User.Read` (Delegated)
- `Files.Read` (Delegated)
- `Files.Read.All` (Delegated)

Grant admin consent if required.

### 3. Environment Variables
Add to your `.env.local` file:
```env
NEXT_PUBLIC_AZURE_CLIENT_ID=your-client-id-here
NEXT_PUBLIC_AZURE_TENANT_ID=your-tenant-id-here
```

### 4. OneDrive Setup
1. Create the Excel file: `/Tournaments/2025/Scores.xlsx` in your OneDrive
2. Create a table named `ScoresTable` with the columns listed above
3. Populate with tournament data

## Usage

### Basic Implementation
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

## Authentication Flow
1. User attempts to access results
2. If not authenticated, MSAL triggers popup login
3. User signs in with Microsoft account
4. Token is acquired and cached
5. Graph API calls use the cached token
6. Token is refreshed automatically when expired

## Limitations & Future Enhancements
- **POC Status**: This is a proof of concept, not production-ready
- **Read-Only**: Currently only reads data, doesn't write back to Excel
- **Single File**: Hardcoded to one specific Excel file
- **No Caching**: Fetches data on every load (consider adding React Query)
- **Error Handling**: Basic error handling, could be more robust

### Potential Enhancements
- Support multiple tournament files
- Add data caching with React Query
- Real-time updates with webhooks
- Export functionality
- Comparison views (year-over-year)
- Mobile-optimized views
- Admin interface to configure file paths

## Security Considerations
- All authentication happens client-side via MSAL
- Tokens are stored in localStorage
- User must have access to the OneDrive file
- No server-side secrets required
- Follows Microsoft's recommended SPA authentication pattern

## Troubleshooting

### "Failed to fetch time slots"
- Check that Azure app registration is configured correctly
- Verify API permissions are granted
- Ensure redirect URI matches your app URL

### "Graph error 404"
- Verify the Excel file path is correct
- Check that the table name matches exactly
- Ensure the file is in your OneDrive

### "Authentication failed"
- Clear browser cache and localStorage
- Check that environment variables are set
- Verify tenant ID and client ID are correct

## Separation from Existing System
This POC is completely separate from the existing tournament scoring system in the app. It:
- Uses different data sources (Excel vs database)
- Has its own authentication (Microsoft vs existing auth)
- Lives in separate components
- Doesn't interfere with existing functionality

Both systems can coexist, and you can choose which one to use for each tournament.
