# AWS Deployment Guide - Clay Target Tracker

## 🚀 Deploy to AWS Amplify (Recommended - Lowest Cost)

### Cost Estimate
- **Free Tier**: First 12 months
- **After Free Tier**: $1-5/month for small usage
- **Database**: SQLite on EFS (~$0.30/month) or RDS (~$15/month)

---

## Prerequisites

1. AWS Account (create at https://aws.amazon.com)
2. GitHub repository (you already have this)
3. Your code pushed to GitHub

---

## Method 1: AWS Amplify + SQLite (Cheapest Option)

### Step 1: Prepare Your Repository

1. **Create amplify.yml** in your project root:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
        - npx prisma generate
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

2. **Update your build script** (already done)

3. **Set up environment variables file** `.env.production`:

```bash
DATABASE_URL="file:/mnt/efs/dev.db"
```

### Step 2: Deploy to AWS Amplify

1. **Go to AWS Amplify Console**
   - Navigate to: https://console.aws.amazon.com/amplify/
   - Click **"New app" → "Host web app"**

2. **Connect GitHub**
   - Select **GitHub**
   - Click **"Connect to GitHub"**
   - Authorize AWS Amplify
   - Select your repository: `claytargettracker`
   - Select branch: `main`

3. **Configure Build Settings**
   - Amplify will auto-detect Next.js
   - Build command: `npm run build`
   - Output directory: `.next`
   
4. **Add Environment Variables**
   Click "Advanced settings" and add:
   ```
   DATABASE_URL=file:./dev.db
   NODE_ENV=production
   ```

5. **Deploy**
   - Click **"Save and deploy"**
   - Wait 5-10 minutes for first deployment
   - Your app will be live at: `https://[app-id].amplifyapp.com`

### Step 3: Set Up Database (SQLite)

**Option A: Simple SQLite (No Persistence Between Builds)**
- Already configured!
- Database resets on each deployment
- Good for testing
- **Cost**: $0

**Option B: SQLite on EFS (Persistent, Cheap)**

1. **Create EFS File System**:
   ```bash
   aws efs create-file-system \
     --performance-mode generalPurpose \
     --throughput-mode bursting \
     --encrypted \
     --tags Key=Name,Value=claytarget-db
   ```

2. **Mount EFS to Amplify**:
   - In Amplify Console → App Settings → Environment variables
   - Add: `DATABASE_URL=file:/mnt/efs/dev.db`
   
3. **Run migrations**:
   - Add to `amplify.yml` preBuild:
   ```yaml
   preBuild:
     commands:
       - npm ci
       - npx prisma generate
       - npx prisma migrate deploy
   ```

**Cost**: ~$0.30/month for 1GB

---

## Method 2: AWS Amplify + RDS PostgreSQL (Better for Production)

### Step 1: Create RDS Database

1. **Go to RDS Console**: https://console.aws.amazon.com/rds/

2. **Create Database**:
   - Click **"Create database"**
   - Choose **PostgreSQL**
   - Template: **Free tier** (db.t3.micro)
   - DB instance identifier: `claytarget-db`
   - Master username: `postgres`
   - Master password: `[create strong password]`
   - Storage: 20 GB (free tier)
   - Public access: **No**
   - VPC security group: Create new
   - Database name: `claytargetdb`

3. **Wait for creation** (~5-10 minutes)

4. **Get connection string**:
   - Click on your database
   - Copy the **Endpoint**
   - Format: `postgresql://postgres:[password]@[endpoint]:5432/claytargetdb`

### Step 2: Update Prisma Schema

Update `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Step 3: Configure Amplify

1. **Add environment variable** in Amplify Console:
   ```
   DATABASE_URL=postgresql://postgres:[password]@[endpoint]:5432/claytargetdb
   ```

2. **Update amplify.yml** to run migrations:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
           - npx prisma generate
           - npx prisma migrate deploy
       build:
         commands:
           - npm run build
   ```

3. **Redeploy** (Amplify auto-deploys on push)

**Cost**: 
- First 12 months: **Free**
- After: ~$15-20/month

---

## Method 3: AWS Elastic Beanstalk (Alternative)

### Pros:
- More control
- Can use SQLite easily
- Free tier available

### Cons:
- More complex setup
- Requires Docker knowledge

### Quick Setup:

1. **Install EB CLI**:
   ```bash
   pip install awsebcli
   ```

2. **Initialize**:
   ```bash
   eb init -p node.js claytarget-tracker --region us-east-1
   ```

3. **Create environment**:
   ```bash
   eb create claytarget-env
   ```

4. **Deploy**:
   ```bash
   eb deploy
   ```

**Cost**: ~$5-10/month

---

## Method 4: AWS ECS Fargate (For Scale)

### When to Use:
- High traffic expected
- Need auto-scaling
- Want containerization

### Cost:
- ~$10-15/month minimum
- Scales with usage

### Setup Guide:
See separate `AWS_ECS_DEPLOYMENT.md` if needed.

---

## Comparison Table

| Method | Setup Time | Monthly Cost | Best For | Database Options |
|--------|------------|--------------|----------|------------------|
| **Amplify + SQLite** | 10 min | $1-3 | Testing, Low traffic | SQLite (local) |
| **Amplify + EFS** | 20 min | $2-5 | Small prod apps | SQLite (persistent) |
| **Amplify + RDS** | 30 min | $0-20 | Production | PostgreSQL |
| **Elastic Beanstalk** | 45 min | $5-10 | Control needed | Any |
| **ECS Fargate** | 2 hours | $10-15 | High scale | Any |

---

## Recommended Path

### For Your Use Case (Clay Target Tournaments):

**Start Here**: AWS Amplify + SQLite (Method 1)
- ✅ Cheapest option
- ✅ Easiest setup
- ✅ Auto-deploy from GitHub
- ✅ Can upgrade to RDS later

**Upgrade When**:
- More than 100 users
- Need data persistence across deploys
- Multiple tournaments running

**Then Upgrade To**: AWS Amplify + RDS PostgreSQL (Method 2)

---

## Post-Deployment Steps

### 1. Set Up Custom Domain (Optional)

In Amplify Console:
1. Go to **Domain management**
2. Add your domain
3. Amplify provides SSL automatically

**Cost**: Domain registration (~$12/year)

### 2. Set Up Monitoring

Amplify includes:
- ✅ Access logs
- ✅ Performance metrics
- ✅ Error tracking

### 3. Initialize Database

After first deployment, run seed script:
```bash
# SSH into Amplify or use RDS client
npx prisma migrate deploy
npx ts-node scripts/seed.ts
```

---

## Continuous Deployment

Once set up, any push to `main` branch will:
1. ✅ Trigger automatic build
2. ✅ Run Prisma migrations
3. ✅ Deploy new version
4. ✅ Zero downtime

---

## Cost Optimization Tips

1. **Use AWS Free Tier** (first 12 months)
2. **Start with SQLite** (upgrade when needed)
3. **Use Amplify free tier**: 1000 build minutes/month
4. **Enable caching** in amplify.yml
5. **Use RDS Free Tier**: db.t3.micro for 12 months
6. **Monitor usage** in AWS Cost Explorer

### Expected Costs (After Free Tier):

**Scenario 1: Small Tournament (< 50 users)**
- Amplify: $2/month
- SQLite on EFS: $0.30/month
- **Total**: ~$3/month

**Scenario 2: Medium Tournament (100-500 users)**
- Amplify: $5/month
- RDS db.t3.micro: $15/month
- **Total**: ~$20/month

**Scenario 3: Large Organization (1000+ users)**
- Amplify: $10/month
- RDS db.t3.small: $35/month
- EFS backups: $2/month
- **Total**: ~$50/month

---

## Troubleshooting

### Build Fails
- Check build logs in Amplify Console
- Verify environment variables
- Ensure `DATABASE_URL` is set

### Database Connection Issues
- Check security groups (RDS)
- Verify connection string
- Ensure migrations ran

### Performance Issues
- Enable caching in amplify.yml
- Consider upgrading RDS instance
- Use CloudFront CDN (Amplify includes this)

---

## Next Steps

1. ✅ Push your code to GitHub
2. ✅ Follow Method 1 above
3. ✅ Test your deployment
4. ✅ Set up custom domain (optional)
5. ✅ Monitor costs in AWS Console

---

## Need Help?

- **AWS Amplify Docs**: https://docs.amplify.aws/
- **RDS Setup Guide**: https://docs.aws.amazon.com/rds/
- **Prisma with PostgreSQL**: https://www.prisma.io/docs/concepts/database-connectors/postgresql

Your app is ready to deploy! Choose Method 1 (Amplify + SQLite) to get started in 10 minutes.

