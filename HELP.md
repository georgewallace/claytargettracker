# Clay Target Tracker - Help Guide

Welcome to the Clay Target Tracker help system! This guide covers everything you need to know about using the application.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [User Roles](#user-roles)
3. [Tournaments](#tournaments)
4. [Disciplines](#disciplines)
5. [Registration](#registration)
6. [Teams](#teams)
7. [Squad Management](#squad-management)
8. [Score Entry](#score-entry)
9. [Leaderboards](#leaderboards)
10. [Shooter Profiles & History](#shooter-profiles--history)
11. [Coach Features](#coach-features)
12. [Admin Features](#admin-features)

---

## Getting Started

### Creating an Account

1. Click **"Sign Up"** in the navigation bar
2. Enter your information:
   - **Name**: Your full name
   - **Email**: Your email address
   - **Password**: Choose a secure password
   - **Role**: Select your role (Shooter, Coach, or Admin)
3. Click **"Sign Up"**
4. You'll be automatically logged in

### Logging In

1. Click **"Login"** in the navigation bar
2. Enter your email and password
3. Click **"Login"**

---

## User Roles

### Shooter
- **Can do**:
  - Register for tournaments
  - Join teams
  - View their shooting history and statistics
  - Update their profile information
  - View leaderboards
- **Cannot do**:
  - Enter scores for others
  - Manage squads
  - Create tournaments

### Coach
- **Can do**:
  - Everything a shooter can do
  - Manage their team roster (add/remove shooters)
  - Bulk register team members for tournaments
  - Enter scores for all shooters
  - View team history and statistics
  - Manage squads for tournaments
- **Cannot do**:
  - Create tournaments
  - Manage other teams

### Admin
- **Can do**:
  - Everything a coach can do
  - Create and edit tournaments
  - Manage all teams
  - Delete registrations
  - Access all administrative features
- **Full control** over the application

---

## Tournaments

### Viewing Tournaments

- **Home Page**: Shows all tournaments in a grid layout
- **Filter by Status**:
  - 🟢 **Upcoming**: Future tournaments
  - 🔵 **Active**: Currently running
  - ⚪ **Completed**: Past tournaments
- **Click any tournament** to view details

### Creating a Tournament (Admin Only)

1. Click **"Create Tournament"** in the navigation
2. Fill in the details:
   - **Name**: Tournament name
   - **Location**: Venue or address
   - **Start Date**: When the tournament begins
   - **End Date**: When the tournament ends
   - **Status**: Upcoming, Active, or Completed
   - **Description**: Optional details
3. **Select Disciplines**: Choose which shooting disciplines to offer
4. **Configure Each Discipline**:
   - **Trap/Skeet**: Number of rounds (1-4)
   - **5-Stand**: Number of targets (25, 50, 75, 100)
   - **Sporting Clays**: Number of targets (50-100) and stations (5-20)
5. Click **"Create Tournament"**

### Editing a Tournament (Admin/Creator Only)

1. Go to the tournament detail page
2. Click **"Edit Tournament"**
3. Make your changes
4. Click **"Save Changes"**

**Important Notes**:
- You can add disciplines at any time
- You can remove disciplines if no scores have been entered
- You can add rounds/targets if the tournament is upcoming or active
- You cannot reduce rounds/targets if scores exist

---

## Disciplines

The application supports four shooting disciplines:

### 🎯 Trap
- **Description**: Shooters stand 16 yards behind a trap house that throws targets away from them
- **Scoring**: 25 targets per round, up to 4 rounds
- **Typical Duration**: 30-60 minutes per round

### 🎯 Skeet
- **Description**: Shooters rotate through 8 stations in a semi-circle, with targets thrown from high and low houses
- **Scoring**: 25 targets per round (8 stations), up to 4 rounds
- **Typical Duration**: 30-60 minutes per round

### 🎯 Sporting Clays
- **Description**: Shooters move through various stations that simulate hunting scenarios
- **Scoring**: Variable targets (50-100) across multiple stations (5-20)
- **Typical Duration**: 2-3 hours

### 🎯 5-Stand
- **Description**: Five shooting stations with targets thrown from various machines
- **Scoring**: 25-100 targets
- **Typical Duration**: 30-60 minutes

---

## Registration

### Self-Registration (Shooters)

1. Navigate to a tournament detail page
2. Click **"Register for Tournament"**
3. Select which disciplines you want to compete in
4. Click **"Register"**
5. You're now registered!

### Bulk Registration (Coaches)

1. Navigate to a tournament detail page
2. In the **"Coach Registration"** section:
   - Select disciplines for your team
   - Search for shooters or select your team members
   - Use **"Select All"** to quickly select multiple shooters
3. Click **"Register X Shooters"**

### Viewing Registrations

- On the tournament detail page, scroll to **"Registered Shooters"**
- See who's registered and for which disciplines
- Filter by discipline if needed

---

## Teams

### Creating a Team

1. Click **"Teams"** in the navigation
2. Enter a team name in the **"Create New Team"** section
3. Click **"Create Team"**

### Joining a Team

**Option 1: Browse Teams**
1. Go to the **"Teams"** page
2. Find a team you want to join
3. Click **"Request to Join"**
4. Enter a message for the coach
5. Wait for approval (if coach exists) or join immediately

**Option 2: Coach Adds You**
- A coach can add you directly to their team

### Leaving a Team

1. Go to the **"Teams"** page
2. Find your current team
3. Click **"Leave Team"**
4. Confirm the action

### Team-Only Squads

- Some squads may be marked as **"Team Only"**
- Only members of that specific team can be added to these squads
- Helps keep teams together during competition

---

## Squad Management

### What are Squads?

Squads are groups of shooters assigned to specific time slots during a tournament. They help organize when and where shooters compete.

### Accessing Squad Management (Coach/Admin Only)

1. Navigate to a tournament detail page
2. Click **"Manage Squads"**

### Understanding the Interface

**Left Sidebar**: Unassigned Shooters
- Grouped by division (Novice, Intermediate, JV, Senior, College)
- Shows team affiliation
- Color-coded by division

**Main Area**: Time Slots and Squads
- Organized by date and time
- Shows discipline and field/station
- Displays squads with capacity (e.g., "3/5")

### Creating Time Slots

**Option 1: Generate Multiple Slots**
1. Click **"Generate Time Slots"**
2. Configure:
   - Discipline
   - Date
   - Start and end times
   - Slot duration (30 min, 1 hr, 2 hrs, 3 hrs)
   - Squad capacity (typically 5)
   - Field/station number
3. Preview the slots
4. Click **"Generate"**

**Option 2: Add Individual Slot**
1. Click **"+ Add Time Slot"**
2. Fill in details
3. Click **"Add Time Slot"**

### Creating Squads

1. Find the time slot where you want to add a squad
2. Enter a squad name (e.g., "Squad A", "Novice 1")
3. Click **"+ Add Squad"**
4. Optionally mark as **"Team Only"** to restrict to one team

### Assigning Shooters to Squads

**Method 1: Drag and Drop**
1. Find the shooter in the left sidebar
2. Click and drag the shooter card
3. Drop onto the desired squad
4. Release to assign

**Method 2: Auto-Assign**
1. Click **"Auto-Assign Squads"**
2. Configure options:
   - ☑️ **Keep teams together**: Squad teammates from the same team
   - ☑️ **Keep divisions together**: Group by skill level
   - ☑️ **Keep teams close in time**: Minimize time between team members' slots
   - ☑️ **Delete existing squads**: Clear current assignments first
   - ☑️ **Include shooters without teams**: Assign independent shooters
   - ☑️ **Include shooters without divisions**: Assign shooters without division info
3. Click **"Auto-Assign"**
4. Review the results

### Removing Shooters from Squads

1. Find the shooter in a squad
2. Click the **×** next to their name
3. Confirm the removal
4. They return to the unassigned list

### Renaming Squads

1. Click the **pencil icon** next to the squad name
2. Enter a new name
3. Click **"Save"** or press Enter
4. Squad names must be unique within a discipline

### Deleting Squads

1. Click the **trash icon** on a squad card
2. Confirm the deletion
3. All shooters return to unassigned

### Moving Entire Squads

1. Drag the squad card by its header
2. Drop onto a different time slot
3. The entire squad moves together

**Important Rules**:
- **Trap**: One squad per field per time slot
- **Skeet**: One squad per time slot
- **5-Stand**: One squad per time slot
- **Sporting Clays**: Multiple squads allowed per time slot
- Auto-assign respects these rules automatically

---

## Score Entry

### Accessing Score Entry (Coach/Admin Only)

1. Navigate to a tournament detail page
2. Click **"Enter Scores"**

### Entering Scores for Trap/Skeet

1. Select the **discipline tab** (Trap or Skeet)
2. Choose a **squad** from the list
3. A spreadsheet-style table appears with all shooters
4. Enter scores for each round:
   - **Round 1-4**: Enter targets hit (0-25)
   - Leave blank if not shot yet
   - Total calculates automatically
5. Click **"Save Scores"** at the top or bottom

**Tips**:
- Press **Tab** to move between cells
- Click a cell to select all text for quick editing
- Empty cells are treated as 0
- You can copy/paste from Excel or Google Sheets

### Entering Scores for Sporting Clays/5-Stand

1. Select the **discipline tab**
2. Choose a **squad**
3. Enter scores by station:
   - Each station shows targets hit / total targets
   - Adjust total targets if needed
4. Click **"Save Scores"**

### Editing Scores

1. Return to the score entry page
2. Select the same squad
3. Existing scores will load automatically
4. Make your changes
5. Click **"Save Scores"** to update

---

## Leaderboards

### Viewing Leaderboards

1. Navigate to a tournament detail page
2. Scroll to the **"Leaderboard"** section
3. Use the **discipline tabs** to filter results:
   - **All Disciplines**: Combined view
   - **Individual tabs**: Filter by specific discipline

### Understanding the Leaderboard

- **Rank**: Position (1st, 2nd, 3rd, etc.)
- **Medals**: 🥇 Gold, 🥈 Silver, 🥉 Bronze for top 3
- **Name**: Shooter's name
- **Team**: Team affiliation (if any)
- **Score**: Targets hit / Total targets
- **Percentage**: Accuracy percentage
- **Highlighted rows**: Top 3 performers

### High All-Around (HAA)

- Shows top performers across **all disciplines**
- Must have competed in multiple disciplines
- Calculated by total percentage across all shoots

---

## Shooter Profiles & History

### Viewing Your Profile

1. Click **"Profile"** in the navigation
2. View your information and statistics

### Editing Your Profile

1. Go to your profile page
2. Click **"Edit Profile"**
3. Update your information:
   - Birth date
   - Gender
   - Grade (6-12, College)
   - Classifications (NSCA, ATA, NSSA)
   - Organization numbers (ATA, NSCA, NSSA)
4. Click **"Save Changes"**

**Note**: Your division is automatically calculated based on your grade:
- **Novice**: Grades 6-7
- **Intermediate**: Grade 8
- **Junior Varsity**: Grades 9-10
- **Senior**: Grades 11-12
- **College**: College/Trade School

### Viewing Your History

1. Click **"My History"** in the navigation (Shooters only)
2. View your complete shooting history

**Features**:
- **Statistics by Discipline**: Total shoots, average score, best performance
- **Performance Graphs**: Visual trends over time with division average comparison
- **Time Filters**: View Last 30 Days, 3 Months, 6 Months, 1 Year, or All Time
- **Detailed Table**: All shoots with dates, tournaments, scores
- **Filter by Discipline**: Focus on specific disciplines

### Viewing Another Shooter's Profile

1. Click on a shooter's name anywhere in the app
2. View their public profile with:
   - Basic information
   - Shooting statistics
   - Performance graphs
   - Division average comparison

---

## Coach Features

### Managing Your Team Roster

1. Click **"My Team"** in the navigation
2. View your current roster

**Adding Shooters**:
1. Search for shooters in the **"Add Shooters to Team"** section
2. Click **"Add to Team"** next to a shooter
3. They're instantly added to your roster
4. Note: Only shows shooters not already on another team

**Removing Shooters**:
1. Find the shooter in your roster
2. Click **"Remove"**
3. Confirm the action

### Viewing Team History

1. Click **"Teams"** → **"Team History"** in the navigation
2. View your team's performance:
   - **All Shooters**: Combined team statistics
   - **Individual Shooters**: Select a specific team member
   - **Filter by Discipline**: Focus on specific disciplines
   - **Time Filters**: Adjust the date range
   - **Performance Graphs**: Team average line for comparison
   - **Statistics Cards**: Quick overview of performance

### Bulk Registration

See the [Registration](#registration) section above.

### Managing Squads

See the [Squad Management](#squad-management) section above.

### Entering Scores

See the [Score Entry](#score-entry) section above.

---

## Admin Features

### Creating Tournaments

See the [Tournaments](#tournaments) section above.

### Editing Tournaments

See the [Tournaments](#tournaments) section above.

### Managing Coaches

1. Click **"Teams"** → **"Manage Coaches"** in the navigation
2. View all coaches and their team assignments
3. Assign or remove coaches from teams

**Note**: This feature requires admin access.

### Removing Registrations

1. Navigate to a tournament detail page
2. Find the shooter in the **"Registered Shooters"** list
3. Click **"Remove"** next to their name
4. Review the warning (if they have scores)
5. Choose whether to delete their scores
6. Confirm the removal

---

## Tips & Best Practices

### For Tournament Organizers

1. **Plan Ahead**: Set up your tournament with all disciplines before opening registration
2. **Create Time Slots Early**: Use the smart generation feature to quickly create multiple slots
3. **Use Auto-Assign**: Let the system handle squad assignments based on your preferences
4. **Monitor Registrations**: Check regularly to ensure balanced participation across disciplines

### For Coaches

1. **Keep Your Roster Updated**: Add/remove shooters as your team changes
2. **Communicate with Your Team**: Let them know which tournaments you're registering them for
3. **Use Team-Only Squads**: Keep your team together during competition
4. **Review Team History**: Track your team's progress over time

### For Shooters

1. **Update Your Profile**: Keep your information current for accurate division placement
2. **Register Early**: Don't wait until the last minute
3. **Enter Scores Promptly**: Help keep leaderboards up-to-date
4. **Track Your Progress**: Use the history page to see your improvement

### Squad Management Best Practices

1. **Create Time Slots First**: Before creating squads
2. **Use Consistent Naming**: "Squad A", "Squad B" or "Novice 1", "Senior 2"
3. **Balance Squads**: Try to fill squads to capacity before creating new ones
4. **Keep Teams Together**: Use team-only squads or auto-assign with team grouping
5. **Consider Skill Levels**: Group similar divisions when appropriate

---

## Troubleshooting

### Can't Register for Tournament

**Possible Issues**:
- Tournament is completed
- You're already registered
- Tournament has no disciplines selected
- You're not logged in

**Solution**: Check tournament status, verify you're logged in, contact admin if issue persists

### Scores Not Showing

**Possible Issues**:
- Scores weren't saved properly
- Wrong discipline tab selected
- Browser cache issue

**Solution**: Refresh the page, verify correct discipline, re-enter scores if needed

### Can't See Squad Management

**Possible Issues**:
- You're not a coach or admin
- Tournament doesn't have time slots yet
- You're not logged in

**Solution**: Verify your role, create time slots first, ensure you're logged in

### Auto-Assign Not Working

**Possible Issues**:
- Not enough time slots for all shooters
- Discipline rules prevent assignment (e.g., one squad per time slot for Skeet)
- All available squads are team-only and shooters are from different teams

**Solution**: Create more time slots, review auto-assign feedback message, adjust squad settings

### Profile Changes Not Saving

**Possible Issues**:
- Invalid data (e.g., birth date in wrong format)
- Session expired
- Network issue

**Solution**: Check all fields are filled correctly, log out and back in, try again

---

## Keyboard Shortcuts

### Score Entry Table
- **Tab**: Move to next cell
- **Shift+Tab**: Move to previous cell
- **Enter**: Move down one row
- **Escape**: Cancel editing

### General
- **Ctrl/Cmd + S**: Save (when in forms)
- **Escape**: Close modals

---

## Mobile Usage

The application is fully responsive and works on mobile devices:

- **Navigation**: Use the hamburger menu (☰) on mobile
- **Tables**: Scroll horizontally if needed
- **Drag & Drop**: Use touch gestures for squad management
- **Forms**: All forms are mobile-optimized

---

## Getting Help

If you encounter issues not covered in this guide:

1. **Check Your Role**: Ensure you have the necessary permissions
2. **Refresh the Page**: Many issues are resolved by refreshing
3. **Clear Browser Cache**: Sometimes cached data causes problems
4. **Try Another Browser**: Rule out browser-specific issues
5. **Contact Your Admin**: They can help with account and permission issues

---

## Glossary

- **Discipline**: A type of clay target shooting (Trap, Skeet, Sporting Clays, 5-Stand)
- **Squad**: A group of shooters assigned to a specific time slot
- **Time Slot**: A scheduled period when shooting occurs
- **Division**: Skill/age category (Novice, Intermediate, JV, Senior, College)
- **Shoot**: A single shooting session for one discipline
- **Round**: One complete set of targets (typically 25 for Trap/Skeet)
- **Station**: A shooting position (varies by discipline)
- **HAA**: High All-Around - top performers across multiple disciplines
- **Team-Only Squad**: A squad restricted to members of a specific team

---

## Version Information

**Last Updated**: October 2025
**Application Version**: 2.0

---

**Need more help?** Contact your system administrator or tournament organizer.

