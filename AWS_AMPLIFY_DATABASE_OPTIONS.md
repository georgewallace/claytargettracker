# AWS Amplify Database Options for Clay Target Tracker

## ⚠️ Current Problem

**SQLite doesn't work with AWS Amplify Hosting because:**
- AWS Lambda (which Amplify uses for SSR) has ephemeral storage
- SQLite requires a persistent file on disk
- Each Lambda invocation gets a clean slate - no database persistence

## ✅ Solution Options

### Option 1: PostgreSQL with AWS RDS (Recommended)

**Pros:**
- ✅ Works perfectly with Amplify
- ✅ AWS RDS Free Tier available (750 hrs/month for 12 months)
- ✅ Persistent, scalable, production-ready
- ✅ Minimal code changes needed

**Cost:** FREE for first year (20GB storage, db.t3.micro instance)

**Steps:**
1. Create RDS PostgreSQL instance in AWS Console
2. Update `prisma/schema.prisma` datasource to PostgreSQL
3. Update `DATABASE_URL` environment variable in Amplify
4. Run migrations
5. Deploy

### Option 2: Keep SQLite + Deploy Elsewhere

**If you want to keep SQLite:**
- Deploy to **Vercel**, **Railway**, **Fly.io**, or **Digital Ocean App Platform**
- These platforms support persistent file systems
- Much simpler for SQLite-based apps

### Option 3: Serverless PostgreSQL (Neon, PlanetScale)

**Pros:**
- ✅ Generous free tiers
- ✅ No infrastructure management
- ✅ Works with Amplify
- ✅ Global edge database

**Services:**
- **Neon** (PostgreSQL) - 3GB free
- **PlanetScale** (MySQL) - 5GB free, 1B reads/month

## 💡 Recommended Action

**For Development/Testing:** Use Neon PostgreSQL free tier
**For Production:** Use AWS RDS PostgreSQL

Both require minimal changes:
1. Update datasource in `schema.prisma`
2. Set `DATABASE_URL` environment variable
3. Run `npx prisma migrate deploy`

## Implementation Guide - PostgreSQL

### 1. Update schema.prisma

```prisma
datasource db {
  provider = "postgresql"  // Changed from sqlite
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-3.0.x"]
}
```

### 2. Create new migration

```bash
# This will create a new migration for PostgreSQL
npx prisma migrate dev --name init_postgresql
```

### 3. Set up database

**Option A: Neon (Easiest)**
1. Sign up at https://neon.tech
2. Create new project
3. Copy connection string
4. Format: `postgresql://user:password@host/database?sslmode=require`

**Option B: AWS RDS**
1. Create RDS PostgreSQL instance in AWS Console
2. Use `db.t3.micro` (free tier eligible)
3. Note the endpoint, username, password
4. Format: `postgresql://username:password@endpoint:5432/database`

### 4. Update Amplify Environment Variables

In AWS Amplify Console:
1. Go to your app → Environment variables
2. Add: `DATABASE_URL` = `your_postgresql_connection_string`
3. Save and redeploy

### 5. Run migrations in Amplify

Update `amplify.yml`:

```yaml
preBuild:
  commands:
    - nvm install 20
    - nvm use 20
    - npm ci
    - npx prisma generate
    - npx prisma migrate deploy  # Will use DATABASE_URL from env vars
```

## Why This Solves the Prisma Binary Issue

PostgreSQL uses a network connection (TCP), not a file on disk:
- ✅ No need for persistent file storage
- ✅ Works perfectly in serverless/Lambda environment
- ✅ Prisma binaries work correctly
- ✅ Scalable and production-ready

## Next Steps

**Decision Point:** Do you want to:
1. **Switch to PostgreSQL** (I can help you do this in 5 minutes)
2. **Deploy elsewhere** to keep SQLite

Let me know and I'll update the code accordingly!

