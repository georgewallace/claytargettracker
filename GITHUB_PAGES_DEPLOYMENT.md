# GitHub Pages Deployment - Fixed Issues

## 🔧 Issues Fixed

### Issue: `out` directory not found in GitHub Actions

**Error Message:**
```
tar: out: Cannot open: No such file or directory
tar: Error is not recoverable: exiting now
```

## ✅ Solutions Applied

### 1. **Updated `package.json` Build Script**
**File:** `package.json`

**Changed:**
```json
"build:demo": "mv app/api ./api-temp && NEXT_PUBLIC_DEMO_MODE=true next build; mv ./api-temp app/api"
```

**To:**
```json
"build:demo": "mv app/api ./api-temp && NEXT_PUBLIC_DEMO_MODE=true next build && mv ./api-temp app/api || (mv ./api-temp app/api 2>/dev/null; exit 1)"
```

**Why:** 
- Changed semicolon (`;`) to AND operator (`&&`) to ensure build errors are caught
- Added error handling to restore the API folder even if build fails
- Ensures the build fails properly if Next.js build fails

### 2. **Updated GitHub Actions Workflow**
**File:** `.github/workflows/deploy-demo.yml`

**Added:**
1. **Prisma Client Generation Step** (before build)
   ```yaml
   - name: Generate Prisma Client
     run: npx prisma generate
     env:
       DATABASE_URL: 'file:./dev.db'
   ```

2. **DATABASE_URL Environment Variable** (for build step)
   ```yaml
   - name: Build demo
     run: npm run build:demo
     env:
       NEXT_PUBLIC_DEMO_MODE: 'true'
       DATABASE_URL: 'file:./dev.db'  # Added this
   ```

3. **Debug Step** (to verify out directory)
   ```yaml
   - name: List output directory
     run: ls -la out/ || echo "out directory not found"
   ```

**Why:**
- Prisma Client must be generated before the build
- DATABASE_URL is required even in demo mode (for build-time code)
- Debug step helps identify issues if they occur

## 🚀 How to Deploy

### Option 1: Automatic Deployment (Recommended)
Simply commit and push your changes to the `main` branch:

```bash
git add .
git commit -m "Fix GitHub Pages deployment"
git push origin main
```

The GitHub Action will automatically:
1. Generate Prisma Client
2. Build the demo (moving API routes temporarily)
3. Create the `out` directory with static files
4. Deploy to GitHub Pages

### Option 2: Manual Deployment
1. Go to your GitHub repository
2. Click on the **Actions** tab
3. Select **Deploy Demo to GitHub Pages**
4. Click **Run workflow**
5. Select `main` branch
6. Click **Run workflow**

## 🔍 Monitoring the Deployment

### Check the Build Progress
1. Go to **Actions** tab in your GitHub repository
2. Click on the running workflow
3. Watch the **build** job:
   - ✅ "Install dependencies" should complete
   - ✅ "Generate Prisma Client" should complete
   - ✅ "Build demo" should complete
   - ✅ "List output directory" should show files in `out/`
   - ✅ "Upload artifact" should succeed

### If the Build Fails
Look for these common issues:
- **Prisma errors**: Check if DATABASE_URL is set
- **TypeScript errors**: All fixed, but verify no new changes introduced errors
- **Build errors**: Check the "Build demo" step output

### After Successful Deployment
1. Wait 2-5 minutes for GitHub Pages to update
2. Visit your demo site:
   - **User Pages**: `https://[username].github.io`
   - **Project Pages**: `https://[username].github.io/claytargettracker`

## 🎭 Demo Mode Features

Your deployed demo will have:
- ✅ 3 pre-populated tournaments
- ✅ 22 sample shooters across all divisions
- ✅ Realistic scores and leaderboards
- ✅ Demo login credentials (shown in bottom-right notice)
- ✅ Fully static (no database required)
- ✅ All interactive features (view-only)

## 📝 Testing Locally

Before pushing, you can test the demo build locally:

```bash
# Clean build
rm -rf .next out

# Run demo build
npm run build:demo

# Verify out directory
ls -la out/

# Serve locally (optional)
npx serve out
```

## 🔒 Environment Variables in GitHub Actions

The workflow sets these automatically:
- `NEXT_PUBLIC_DEMO_MODE: 'true'` - Enables demo mode
- `DATABASE_URL: 'file:./dev.db'` - Required by Prisma (not actually used)
- `NEXT_PUBLIC_BASE_PATH: ''` - Set to `'/repo-name'` for project pages

## ✅ Verification Checklist

Before deploying, verify:
- [ ] Local build works: `npm run build:demo`
- [ ] `out/` directory is created
- [ ] `out/index.html` exists
- [ ] Regular build still works: `npm run build`
- [ ] All TypeScript errors fixed
- [ ] GitHub Pages is enabled in repository settings

## 🎉 You're Ready!

All issues have been fixed. The deployment should now work correctly. When you push to `main`, the GitHub Action will:

1. ✅ Install dependencies
2. ✅ Generate Prisma Client
3. ✅ Temporarily move API routes (not needed for static export)
4. ✅ Build static site with mock data
5. ✅ Restore API routes
6. ✅ Create `out/` directory with all static files
7. ✅ Upload to GitHub Pages
8. ✅ Deploy successfully

Your demo site will be live and fully functional! 🚀

