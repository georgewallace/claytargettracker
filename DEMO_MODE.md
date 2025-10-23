# Demo Mode - GitHub Pages Deployment

## Overview

The Clay Target Tracker application includes a **Demo Mode** that allows you to deploy a fully functional demonstration version to GitHub Pages. This demo uses simulated data and doesn't require a database, making it perfect for showcasing the application.

## Features

### Demo Mode Capabilities
- ✅ **Fully Functional UI** - All pages and components work
- ✅ **Simulated Data** - 48 mock shooters across 5 divisions
- ✅ **Live Tournament** - Active "Spring Championship 2025" with scores
- ✅ **Multiple Roles** - Test as Admin, Coach, or Shooter
- ✅ **No Database Required** - All data is in-memory
- ✅ **GitHub Pages Ready** - Static export for easy hosting
- ✅ **Visual Indicator** - Floating notice shows demo status

### What's Included in Demo Data

#### Users
- **Admin Account**: `admin@demo.com` / `demo`
- **Coach Account**: `coach@demo.com` / `demo`
- **Shooter Account**: `shooter@demo.com` / `demo`

#### Tournaments
1. **Spring Championship 2025** (Active)
   - Location: Demo Shooting Range
   - Dates: March 15-16, 2025
   - Disciplines: Sporting Clays, Skeet, Trap
   - 22 registered shooters with scores
   - Multiple squads and time slots

2. **Fall Invitational 2024** (Completed)
   - Historical tournament data

3. **Summer Classic 2025** (Upcoming)
   - Future tournament for registration testing

#### Shooters
- **22 Diverse Shooters** across all divisions:
  - 4 Novice (Grades 4-6)
  - 5 Intermediate (Grades 7-8)
  - 4 Junior Varsity (Grade 9)
  - 6 Senior (Grades 10-12)
  - 3 College

#### Scores
- **Realistic scores** generated for each discipline
- **Recent updates** - First 6 shooters have scores updated 1 minute ago (for testing live highlights)
- **Complete datasets** - All shooters have scores in all disciplines

## Setup Instructions

### Step 1: Enable GitHub Pages

1. Go to your GitHub repository
2. Click **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions**
4. Save the settings

### Step 2: Configure Base Path (If Needed)

#### For User/Organization Pages (username.github.io)
No configuration needed! The default settings will work.

#### For Project Pages (username.github.io/repo-name)
Edit `.github/workflows/deploy-demo.yml`:

```yaml
- name: Build demo
  run: npm run build:demo
  env:
    NEXT_PUBLIC_DEMO_MODE: 'true'
    NEXT_PUBLIC_BASE_PATH: '/claytargettracker'  # Change to your repo name
```

### Step 3: Deploy

#### Automatic Deployment
The demo will automatically deploy when you push to the `main` branch.

```bash
git add .
git commit -m "Enable demo mode"
git push origin main
```

#### Manual Deployment
You can also trigger deployment manually:

1. Go to **Actions** tab in GitHub
2. Select **Deploy Demo to GitHub Pages**
3. Click **Run workflow**
4. Select `main` branch
5. Click **Run workflow**

### Step 4: Access Your Demo

After deployment completes (2-5 minutes):
- **User Pages**: https://username.github.io
- **Project Pages**: https://username.github.io/claytargettracker

## Local Development

### Run Demo Mode Locally

```bash
npm run demo:dev
```

This starts the dev server with `NEXT_PUBLIC_DEMO_MODE=true`, using all mock data instead of the database.

### Build Demo Locally

```bash
npm run build:demo
```

This creates a static export in the `out/` directory that you can preview:

```bash
npx serve out
```

## How Demo Mode Works

### Environment Variable
Demo mode is controlled by the `NEXT_PUBLIC_DEMO_MODE` environment variable:

```bash
NEXT_PUBLIC_DEMO_MODE=true
```

### Mock Data
All data is stored in `lib/demoData.ts`:
- **Users, Teams, Shooters** - Pre-defined accounts and profiles
- **Tournaments** - 3 tournaments in different states
- **Disciplines** - Sporting Clays, Skeet, Trap, 5-Stand
- **Scores** - Generated scores with realistic values
- **Time Slots & Squads** - Complete scheduling data

### Static Export
Next.js configuration (`next.config.mjs`) automatically enables static export when in demo mode:

```javascript
output: process.env.NEXT_PUBLIC_DEMO_MODE === 'true' ? 'export' : undefined
```

### Demo Notice
A floating notice in the bottom-right corner indicates demo mode:
- Shows demo status
- Lists available demo accounts
- Can be dismissed by users
- Includes login credentials

## Limitations

### What Doesn't Work in Demo Mode

1. **Data Persistence** - Changes are not saved (page reload resets data)
2. **Authentication** - Login is simulated (no real password checking)
3. **API Routes** - All replaced with client-side mock data
4. **Database Operations** - No database queries are executed
5. **File Uploads** - Not available in static mode
6. **Real-time Updates** - No WebSocket or Server-Sent Events

### What DOES Work

1. **All UI Components** - Full visual experience
2. **Navigation** - All routes and pages
3. **Leaderboards** - Live scoring displays
4. **Score Entry** - Forms and validation (UI only)
5. **Squad Management** - Drag-and-drop interface
6. **Tournament Management** - All CRUD operations (UI only)
7. **Role Switching** - Test different user roles

## Customization

### Adding More Demo Data

Edit `lib/demoData.ts`:

```typescript
// Add more shooters
export const demoShooters = [
  ...existing shooters,
  {
    id: 'new-shooter',
    userId: 'new-user',
    // ... other fields
  }
]

// Add more tournaments
export const demoTournaments = [
  ...existing tournaments,
  {
    id: 'new-tournament',
    name: 'My Custom Tournament',
    // ... other fields
  }
]
```

### Changing Demo Credentials

In `lib/demoData.ts`:

```typescript
export const demoUsers = [
  {
    id: 'demo-admin-1',
    email: 'your-email@example.com',
    name: 'Your Name',
    role: 'admin',
    // ...
  }
]
```

### Customizing Demo Notice

Edit `components/DemoModeNotice.tsx` to change:
- Position (currently bottom-right)
- Colors and styling
- Message content
- Display duration

## Troubleshooting

### Deployment Fails

**Problem**: GitHub Actions fails during build

**Solutions**:
1. Check `.github/workflows/deploy-demo.yml` syntax
2. Verify `NEXT_PUBLIC_DEMO_MODE` is set to `'true'`
3. Ensure `node_modules` is not committed
4. Check for TypeScript errors: `npm run lint`

### 404 Errors on GitHub Pages

**Problem**: Pages show 404 after deployment

**Solutions**:
1. Verify GitHub Pages is enabled in repository settings
2. Check if `NEXT_PUBLIC_BASE_PATH` is set correctly
3. Ensure `.nojekyll` file exists in `public/` directory
4. Wait a few minutes for GitHub Pages cache to clear

### Blank Page After Deployment

**Problem**: Site loads but shows blank page

**Solutions**:
1. Check browser console for errors
2. Verify `trailingSlash: true` in `next.config.mjs`
3. Check if `basePath` is configured correctly
4. Clear browser cache and hard refresh

### Demo Notice Doesn't Appear

**Problem**: Demo mode notice is not visible

**Solutions**:
1. Verify `NEXT_PUBLIC_DEMO_MODE` is `'true'` (string, not boolean)
2. Check browser console for errors
3. Ensure `DemoModeNotice` is imported in `app/layout.tsx`
4. Try clearing browser cache

## Advanced Configuration

### Custom Domain

To use a custom domain with GitHub Pages:

1. Add `CNAME` file to `public/` directory:
   ```
   demo.yourdomain.com
   ```

2. Configure DNS with your domain provider:
   - Add `CNAME` record pointing to `username.github.io`

3. Update GitHub Pages settings to use custom domain

### Environment-Specific Builds

Create multiple demo configurations:

```json
// package.json
{
  "scripts": {
    "build:demo:staging": "NEXT_PUBLIC_DEMO_MODE=true NEXT_PUBLIC_API_URL=https://staging-api.example.com next build",
    "build:demo:production": "NEXT_PUBLIC_DEMO_MODE=true NEXT_PUBLIC_API_URL=https://api.example.com next build"
  }
}
```

### Analytics Integration

Add analytics to demo site in `app/layout.tsx`:

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head>
        {isDemoMode() && (
          <script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
        )}
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
```

## Best Practices

### For Demonstrations

1. **Create a Demo Script** - Plan a walkthrough showing key features
2. **Use Multiple Accounts** - Show different user perspectives
3. **Highlight Key Features** - Focus on unique functionality
4. **Explain Limitations** - Be transparent about demo vs. production

### For Development

1. **Keep Demo Data Updated** - Reflect latest features
2. **Test Before Deploying** - Run `npm run demo:dev` locally
3. **Document Changes** - Update demo data comments
4. **Version Control** - Tag demo releases in git

### For Users

1. **Provide Clear Instructions** - Link to this documentation
2. **List Demo Credentials** - Make login information obvious
3. **Set Expectations** - Explain what is/isn't functional
4. **Collect Feedback** - Use demo to gather user input

## Example Workflow

### Complete Deployment Process

```bash
# 1. Make sure your code is ready
git status

# 2. Test demo mode locally
npm run demo:dev

# 3. Build demo to verify no errors
npm run build:demo

# 4. Commit and push
git add .
git commit -m "Update demo mode"
git push origin main

# 5. Monitor deployment
# Go to GitHub Actions tab and watch the workflow

# 6. Test deployed demo
# Visit https://username.github.io and verify functionality

# 7. Share with stakeholders
# Send demo link for feedback
```

## Resources

- **GitHub Pages Docs**: https://docs.github.com/en/pages
- **Next.js Static Export**: https://nextjs.org/docs/app/building-your-application/deploying/static-exports
- **GitHub Actions**: https://docs.github.com/en/actions

## Support

If you encounter issues with demo mode:

1. Check this documentation
2. Review `lib/demoData.ts` for data structure
3. Inspect browser console for errors
4. Check GitHub Actions logs for deployment issues
5. Verify environment variables are set correctly

## Summary

Demo mode provides a powerful way to showcase the Clay Target Tracker application without requiring database setup or hosting infrastructure. It's perfect for:

- **Presentations** - Show the app to stakeholders
- **Testing** - Verify new features work correctly
- **Demonstrations** - Let users explore the interface
- **Development** - Work on UI without database

The static export means ultra-fast loading, no server costs, and the ability to host on any static hosting platform!

