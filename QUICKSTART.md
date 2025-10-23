# Quick Start Guide

Get up and running with Clay Target Tracker in minutes!

## Installation

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## First Steps

### 1. Create an Account

1. Navigate to [http://localhost:3000](http://localhost:3000)
2. Click "Sign Up" in the navigation bar
3. Enter your name, email, and password
4. You'll be automatically logged in and redirected to the home page

### 2. Create a Team (Optional)

1. Click "Teams" in the navigation
2. Enter a team name in the "Create New Team" section
3. Click "Create Team"
4. Join the team by clicking "Join Team" on the team card

### 3. Create a Tournament

1. Click "Create Tournament" in the navigation or on the home page
2. Fill in the tournament details:
   - **Name**: e.g., "Spring Championship 2025"
   - **Location**: e.g., "Springfield Gun Club"
   - **Date**: Select a date and time
   - **Status**: Choose "Upcoming", "Active", or "Completed"
   - **Description**: Add optional details about the tournament
3. Click "Create Tournament"

### 4. Register for a Tournament

1. From the home page, click on a tournament card
2. On the tournament detail page, click "Register for Tournament"
3. You'll see a confirmation that you're registered

### 5. Enter Scores

1. Navigate to a tournament you're registered for
2. Click "Enter Scores"
3. For each station (default 5 stations):
   - Enter the number of targets hit
   - Optionally adjust the total targets (default 25)
4. View your total score and percentage at the bottom
5. Click "Save Scores"

### 6. View Results

1. After scores are entered, return to the tournament detail page
2. View the leaderboard showing all shooters ranked by score
3. See individual shooter scores, teams, and percentages

## Coach Features

### Manage Your Team Roster

If you're a coach, you can manage your team roster:

1. **Navigate to "My Team"** in the navigation bar
2. **View Current Roster** - See all shooters on your team
3. **Add Shooters**:
   - Search for available shooters
   - Click "Add to Team" next to a shooter's name
   - They're instantly added to your roster
4. **Remove Shooters**:
   - Click "Remove" next to a shooter's name
   - Confirm the removal
5. **Bulk Register Your Team**:
   - Go to any upcoming tournament
   - Use the Coach Registration panel
   - Select your team members
   - Register them all at once!

## Database Management

### View Database Contents

```bash
npm run db:studio
```

This opens Prisma Studio at [http://localhost:5555](http://localhost:5555) where you can view and edit data.

### Reset Database

```bash
npm run db:reset
```

This will delete all data and recreate the database schema.

### Run Migrations

```bash
npm run db:migrate
```

Apply database schema changes.

## Project Structure

```
├── app/
│   ├── api/              # Backend API routes
│   ├── tournaments/      # Tournament pages
│   ├── teams/            # Team pages
│   ├── login/            # Authentication pages
│   └── signup/
├── components/           # Reusable UI components
├── lib/                  # Utilities and helpers
└── prisma/              # Database schema and migrations
```

## Tips

- **Independent Shooters**: Shooters don't need to be on a team to participate
- **Score Updates**: You can re-enter scores for any tournament you're registered for
- **Team Management**: Switch teams at any time from the Teams page
- **Tournament Status**: Set tournaments to "Active" during the event and "Completed" when finished

## Common Tasks

### Add Another User

1. Log out (click "Logout" in the navigation)
2. Click "Sign Up"
3. Create a new account
4. Register for tournaments and enter scores

### Manage Multiple Tournaments

Create multiple tournaments with different dates and statuses to simulate a full tournament season.

### Team Competition

1. Create multiple teams
2. Have different users join different teams
3. Enter scores for each team member
4. View team representation in the leaderboard

## Need Help?

Check the main [README.md](README.md) for detailed documentation or open an issue on GitHub.

## Happy Shooting! 🎯

