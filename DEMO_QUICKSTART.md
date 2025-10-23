# Demo Mode Quick Start

## 🎭 Try Demo Mode in 2 Minutes

### Option 1: Run Locally

```bash
# Clone the repository
git clone https://github.com/yourusername/claytargettracker.git
cd claytargettracker

# Install dependencies
npm install

# Run in demo mode
npm run demo:dev
```

Visit http://localhost:3000 and login with:
- `admin@demo.com` / `demo`
- `coach@demo.com` / `demo`
- `shooter@demo.com` / `demo`

### Option 2: Deploy to GitHub Pages

1. **Fork this repository** on GitHub

2. **Enable GitHub Pages**:
   - Go to Settings → Pages
   - Source: GitHub Actions
   - Save

3. **Configure (if project pages)**:
   - Edit `.github/workflows/deploy-demo.yml`
   - Set `NEXT_PUBLIC_BASE_PATH: '/your-repo-name'`

4. **Push to trigger deployment**:
   ```bash
   git push origin main
   ```

5. **Access your demo**:
   - User pages: `https://username.github.io`
   - Project pages: `https://username.github.io/repo-name`

## 🎯 What to Explore

### As Admin (`admin@demo.com`)
1. View the **Spring Championship 2025** tournament
2. Check the **Leaderboard** with live scores
3. Click **Manage Squads** to see squad assignments
4. Try **Edit Tournament** to see admin controls

### As Coach (`coach@demo.com`)
1. Visit **My Team** to see your roster
2. Go to **Tournaments** and register shooters
3. Use **Manage Squads** to assign shooters to time slots
4. Click **Enter Scores** to see the score entry interface

### As Shooter (`shooter@demo.com`)
1. Browse **Tournaments** (see "✓ Registered" badge)
2. View tournament details
3. Check your scores on the **Leaderboard**
4. Visit **Teams** to request joining a team

## 🔧 Environment Variables

To run demo mode locally, you can either use:

### Method 1: npm script (recommended)
```bash
npm run demo:dev
```

### Method 2: Manual environment variable
```bash
NEXT_PUBLIC_DEMO_MODE=true npm run dev
```

### Method 3: Create .env.local
```env
NEXT_PUBLIC_DEMO_MODE=true
DATABASE_URL="file:./dev.db"
```

Then run:
```bash
npm run dev
```

## 📦 What's Included

- **48 Shooters** across 5 divisions
- **3 Tournaments** (Upcoming, Active, Completed)
- **Live Scores** with recent updates
- **Squads & Time Slots** with realistic scheduling
- **Teams** with coaches and roster management

## 💡 Demo vs. Production

| Feature | Demo Mode | Production |
|---------|-----------|------------|
| Data | Mock (in-memory) | PostgreSQL/SQLite |
| Authentication | Simulated | Real password verification |
| API Routes | Client-side | Server-side |
| Data Persistence | No (resets on reload) | Yes (database) |
| Deployment | Static (GitHub Pages) | Server-side (Vercel, etc.) |
| Cost | Free | Depends on hosting |

## 📝 Full Documentation

See [DEMO_MODE.md](./DEMO_MODE.md) for complete documentation including:
- Detailed setup instructions
- Troubleshooting guide
- Customization options
- Advanced configuration
- Best practices

## 🤝 Contributing

Found a bug in demo mode? Want to add more demo data?
1. Fork the repository
2. Make your changes to `lib/demoData.ts`
3. Test with `npm run demo:dev`
4. Submit a pull request

## 📫 Questions?

- Check [DEMO_MODE.md](./DEMO_MODE.md) for detailed docs
- Review [lib/demoData.ts](./lib/demoData.ts) for data structure
- Open an issue on GitHub

