# AWS S3 Setup Guide for Team Logo Uploads

This guide will walk you through setting up AWS S3 for storing team logos in production/staging.

## Why S3?

AWS Amplify has a read-only filesystem (except `/tmp`), making it impossible to store uploaded files locally. S3 provides:
- ✅ Unlimited storage
- ✅ High availability & durability
- ✅ Cost-effective (~$0.023/GB/month)
- ✅ Direct public URL access
- ✅ No payload size limits

---

## Step 1: Create an S3 Bucket

1. **Go to AWS Console**: https://console.aws.amazon.com/s3/
2. **Click "Create bucket"**
3. **Configure bucket**:
   - **Bucket name**: `claytargettracker-uploads` (must be globally unique)
   - **AWS Region**: Choose closest to your users (e.g., `us-east-1`)
   - **Block Public Access**: **UNCHECK "Block all public access"**
     - ⚠️ We need this to allow public read access to logos
     - Check the acknowledgment box
   - Leave other settings as default
4. **Click "Create bucket"**

---

## Step 2: Configure Bucket Policy (Public Read Access)

1. **Open your bucket** in the S3 console
2. **Go to "Permissions" tab**
3. **Scroll to "Bucket policy"**
4. **Click "Edit"**
5. **Paste this policy** (replace `YOUR-BUCKET-NAME` with your actual bucket name):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    }
  ]
}
```

6. **Click "Save changes"**

---

## Step 3: Enable CORS (Cross-Origin Resource Sharing)

1. **Still in "Permissions" tab**
2. **Scroll to "Cross-origin resource sharing (CORS)"**
3. **Click "Edit"**
4. **Paste this configuration**:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

5. **Click "Save changes"**

---

## Step 4: Create IAM User for Programmatic Access

1. **Go to IAM Console**: https://console.aws.amazon.com/iam/
2. **Click "Users"** → **"Create user"**
3. **User name**: `claytargettracker-s3-uploader`
4. **Select "Attach policies directly"**
5. **Click "Create policy"** (opens new tab)
6. **In the new tab**:
   - Click **"JSON"** tab
   - Paste this policy (replace `YOUR-BUCKET-NAME`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    }
  ]
}
```

7. **Click "Next"**
8. **Policy name**: `ClayTargetTracker-S3-Upload-Policy`
9. **Click "Create policy"**
10. **Go back to the user creation tab**
11. **Refresh the policy list** and search for `ClayTargetTracker-S3-Upload-Policy`
12. **Check the policy** and click "Next"
13. **Click "Create user"**

---

## Step 5: Generate Access Keys

1. **Click on your new user** (`claytargettracker-s3-uploader`)
2. **Go to "Security credentials" tab**
3. **Click "Create access key"**
4. **Select "Application running outside AWS"**
5. **Click "Next"** → **"Create access key"**
6. **IMPORTANT**: Copy both:
   - **Access key ID** (e.g., `AKIAIOSFODNN7EXAMPLE`)
   - **Secret access key** (e.g., `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`)
   
   ⚠️ **You won't be able to see the secret key again!**

---

## Step 6: Add Environment Variables to AWS Amplify

1. **Go to AWS Amplify Console**: https://console.aws.amazon.com/amplify/
2. **Select your app** (`claytargettracker`)
3. **Click "Environment variables"** (left sidebar)
4. **Click "Manage variables"**
5. **Add these variables**:

⚠️ **Note**: AWS Amplify doesn't allow variables starting with `AWS_`, so we use `S3_` prefix instead.

| Variable | Value | Example |
|----------|-------|---------|
| `S3_ACCESS_KEY_ID` | Your access key ID | `AKIAIOSFODNN7EXAMPLE` |
| `S3_SECRET_ACCESS_KEY` | Your secret access key | `wJalrXUt...EXAMPLEKEY` |
| `S3_BUCKET` | Your bucket name | `claytargettracker-uploads` |
| `S3_REGION` | Your bucket region | `us-east-1` |

6. **Click "Save"**

---

## Step 7: Add Environment Variables Locally (Optional - for testing)

Create or update `.env.local`:

```bash
# S3 Configuration (for local testing with S3)
S3_ACCESS_KEY_ID=your-access-key-id
S3_SECRET_ACCESS_KEY=your-secret-access-key
S3_BUCKET=claytargettracker-uploads
S3_REGION=us-east-1
```

⚠️ **Never commit `.env.local` to Git!** (already in `.gitignore`)

**Note**: If these variables are NOT set locally, the app will use the local filesystem (`public/uploads/teams/`) instead, which is fine for development.

---

## Step 8: Deploy and Test

1. **Commit and push your changes**:
```bash
git add .
git commit -m "Add S3 integration for team logo uploads"
git push origin staging
```

2. **Wait for AWS Amplify to deploy** (check the Amplify console)

3. **Test the upload**:
   - Go to your staging site
   - Navigate to `/teams/my-team`
   - Upload a team logo (up to 5MB)
   - Verify the logo displays correctly

---

## Verification Checklist

- ✅ S3 bucket created
- ✅ Bucket policy allows public read access
- ✅ CORS configured
- ✅ IAM user created with correct policy
- ✅ Access keys generated
- ✅ Environment variables added to Amplify
- ✅ Code deployed to staging
- ✅ Logo upload tested and working

---

## How It Works

### Local Development (No S3)
- Files are saved to `public/uploads/teams/`
- Served directly by Next.js
- No AWS credentials needed

### Staging/Production (S3)
- Files are uploaded to S3 via AWS SDK
- Public URLs returned (e.g., `https://your-bucket.s3.us-east-1.amazonaws.com/team-logos/...`)
- Old logos are automatically deleted when new ones are uploaded

---

## Cost Estimate

For a small to medium-sized shooting club:
- **Storage**: ~$0.023/GB/month
- **Requests**: ~$0.0004 per 1,000 GET requests
- **Data transfer**: First 100GB/month free, then ~$0.09/GB

**Example**: 100 teams × 1MB logos = 100MB = ~$0.002/month 💰

---

## Troubleshooting

### "S3 is not configured" Error
- **Cause**: Environment variables not set
- **Fix**: Check Step 6 - ensure all 4 variables (`S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET`, `S3_REGION`) are set in Amplify

### "Access Denied" Error
- **Cause**: IAM policy is too restrictive
- **Fix**: Verify the policy in Step 4 includes `PutObject`, `GetObject`, `DeleteObject`, and `PutObjectAcl`

### "Bucket does not exist" Error
- **Cause**: Wrong bucket name or region
- **Fix**: Double-check `S3_BUCKET` and `S3_REGION` match your S3 console

### Logos Not Displaying
- **Cause**: Bucket policy not configured for public read
- **Fix**: Verify Step 2 - bucket policy must allow public `GetObject`

### CORS Errors
- **Cause**: CORS not configured
- **Fix**: Verify Step 3 - CORS must allow your domain

---

## Security Best Practices

1. ✅ **Use IAM user with minimal permissions** (only S3 upload/delete)
2. ✅ **Validate file types** (already implemented - images only)
3. ✅ **Validate file sizes** (already implemented - 5MB max)
4. ✅ **Use environment variables** for credentials (never hardcode)
5. ✅ **Rotate access keys periodically** (every 90 days recommended)
6. ⚠️ **Consider S3 signed URLs** for private uploads (future enhancement)

---

## Optional: S3 Lifecycle Rules (Clean up old logos)

To automatically delete old logos after they're replaced:

1. Go to your S3 bucket
2. Click "Management" tab → "Create lifecycle rule"
3. Name: "Delete old team logos"
4. Apply to prefix: `team-logos/`
5. Add transition: "Delete expired delete markers" after 30 days
6. This keeps costs low by removing orphaned files

---

## Support

If you encounter issues:
1. Check AWS CloudWatch Logs in Amplify Console
2. Verify environment variables are set correctly
3. Test locally with `.env.local` first
4. Check S3 bucket permissions and CORS

For AWS-specific issues, see: https://docs.aws.amazon.com/s3/

