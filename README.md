# Clay Target Tracker

A comprehensive web application for tracking clay target shooting tournaments, managing scores, and organizing teams.

## 🎭 Try the Demo

**See it in action!** Try our demo mode with simulated data:

```bash
npm run demo:dev
```

Login with: `admin@demo.com` / `demo` (or `coach@demo.com` or `shooter@demo.com`)

**Or deploy to GitHub Pages**: See [DEMO_QUICKSTART.md](./DEMO_QUICKSTART.md)

## Features

### 🎯 Tournament Management
- Create and manage tournaments
- View tournament listings with status (upcoming, active, completed)
- Tournament detail pages with comprehensive information
- Real-time leaderboards with rankings

### 👥 Shooter Registration
- User authentication (signup/login)
- Register for tournaments
- Track registration status
- View registered shooters per tournament

### 📊 Score Tracking
- Enter scores for multiple stations
- Customizable target counts per station
- Automatic score calculations and percentages
- Persistent score storage and updates

### 🏆 Team Management
- Create and join teams
- Team listings with member counts
- Independent shooter support (no team required)
- Easy team switching

### 🎓 Coach Features
- Dedicated coach role for team managers
- Bulk registration of shooters
- Search and filter shooters by name, email, or team
- Select all/clear functionality for quick registration
- Real-time registration status

### 📖 Help System
- Comprehensive in-app help documentation
- Searchable help topics
- Role-based guidance (Shooter, Coach, Admin)
- Step-by-step tutorials
- Troubleshooting guides
- Mobile-friendly help interface

### 📱 Modern UI/UX
- Responsive design for all devices
- Clean, intuitive interface
- Real-time updates
- Beautiful gradients and animations

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite (via Prisma ORM)
- **Authentication**: Custom session-based auth with bcrypt
- **Date Handling**: date-fns
- **Form Handling**: React Hook Form with Zod validation

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd claytargettracker
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
# The database is already initialized with migrations
# To reset or recreate the database:
DATABASE_URL="file:./dev.db" npx prisma migrate reset
```

4. Generate Prisma Client:
```bash
DATABASE_URL="file:./dev.db" npx prisma generate
```

5. Run the development server:
```bash
DATABASE_URL="file:./dev.db" npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Schema

### Models

- **User**: Authentication and user information
- **Shooter**: Shooter profile linked to user
- **Team**: Team information
- **Tournament**: Tournament details and metadata
- **Registration**: Links shooters to tournaments
- **Score**: Individual station scores for shooters

### Relationships

- Users have one Shooter profile
- Shooters can belong to one Team (optional)
- Tournaments have many Registrations and Scores
- Shooters have many Registrations and Scores

## Key Features Explained

### Tournament Workflow

1. **Create Tournament**: Authenticated users can create tournaments with name, location, date, and description
2. **Register**: Shooters register for upcoming tournaments
3. **Enter Scores**: Registered shooters enter scores for each station (typically 5 stations)
4. **View Results**: Leaderboards automatically calculate and rank shooters by total score

### Score Entry

- Default: 5 stations, 25 targets each (customizable)
- Input validation ensures scores don't exceed total targets
- Real-time calculation of totals and percentages
- Scores can be updated after initial entry

### Team System

- Teams are optional - shooters can compete independently
- Each shooter can be on one team at a time
- Teams are displayed in leaderboards and registrations
- Easy team creation and membership management

## Project Structure

```
claytargettracker/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── tournaments/  # Tournament endpoints
│   │   ├── registrations/# Registration endpoints
│   │   ├── scores/       # Score endpoints
│   │   └── teams/        # Team endpoints
│   ├── tournaments/      # Tournament pages
│   ├── teams/            # Team pages
│   ├── login/            # Login page
│   ├── signup/           # Signup page
│   └── page.tsx          # Home page
├── components/           # Reusable components
├── lib/                  # Utility functions
│   ├── prisma.ts        # Prisma client
│   ├── auth.ts          # Authentication utilities
│   └── session.ts       # Session management
└── prisma/
    └── schema.prisma     # Database schema
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Tournaments
- `POST /api/tournaments` - Create tournament

### Registrations
- `POST /api/registrations` - Register for tournament (self-registration)
- `POST /api/registrations/bulk` - Register multiple shooters (coaches only)

### Scores
- `POST /api/scores` - Submit/update scores

### Teams
- `GET /api/teams` - List all teams
- `POST /api/teams` - Create team
- `POST /api/teams/join` - Join team
- `POST /api/teams/leave` - Leave team

## Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

## Development

### Running Migrations

```bash
DATABASE_URL="file:./dev.db" npx prisma migrate dev
```

### Prisma Studio (Database GUI)

```bash
DATABASE_URL="file:./dev.db" npx prisma studio
```

### Build for Production

```bash
npm run build
```

## Help & Documentation

### Accessing Help

- **In-App Help**: Click "Help" in the navigation bar
- **Comprehensive Guide**: See [HELP.md](./HELP.md)
- **Help System Documentation**: See [HELP_SYSTEM_README.md](./HELP_SYSTEM_README.md)

### Updating Documentation

To sync documentation from source files:

```bash
npm run help:sync
```

This consolidates all user-facing markdown files into `HELP.md`.

### Documentation Files

- **User Guides**: `HELP.md`, `QUICKSTART.md`, `FEATURES.md`
- **Feature Guides**: `DISCIPLINES_GUIDE.md`, `SQUAD_MANAGEMENT_GUIDE.md`, `SCHEDULE_MANAGEMENT_GUIDE.md`
- **Role-Specific**: `COACH_TEAM_MANAGEMENT.md`, `SCORE_ENTRY.md`, `TOURNAMENT_EDITING.md`
- **Technical**: `HELP_SYSTEM_README.md`, deployment guides

## Future Enhancements

- [ ] Video tutorials in help system
- [ ] Interactive onboarding wizard
- [ ] Admin dashboard for tournament management
- [ ] Email notifications for tournament updates
- [ ] Export results to PDF/CSV
- [ ] Photo uploads for shooters and teams
- [ ] Advanced statistics and analytics
- [ ] Mobile app
- [ ] Payment integration for entry fees
- [ ] Tournament brackets and eliminations

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue on GitHub.
