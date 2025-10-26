# 🔒 Security & Rate Limiting Setup

This document explains the security features implemented in Clay Target Tracker and how to configure them.

## ✅ Features Implemented

### 1. Rate Limiting
Prevents abuse by limiting the number of requests from a single IP/user:

- **Authentication Routes** (login/signup): 5 attempts per 15 minutes
- **Password Reset**: 3 attempts per hour  
- **Score Entry**: 100 submissions per hour
- **Team Creation**: 10 per hour
- **Tournament Creation**: 5 per hour
- **General API**: 200 requests per minute

### 2. Security Headers
All API responses include security headers to protect against common vulnerabilities:

- `X-Frame-Options`: Prevents clickjacking
- `X-Content-Type-Options`: Prevents MIME sniffing
- `X-XSS-Protection`: XSS protection for older browsers
- `Referrer-Policy`: Controls referrer information
- `Permissions-Policy`: Restricts browser features
- `Content-Security-Policy`: Prevents XSS and injection attacks

### 3. CSRF Protection
Validates that requests come from the expected origin to prevent Cross-Site Request Forgery attacks.

### 4. Input Validation
- Email format validation
- Password strength requirements (min 8 chars, 1 letter, 1 number)
- Input sanitization to remove potentially dangerous content
- Length limits on all text inputs

## 🚀 Setup Instructions

### Option 1: Production Setup with Upstash (Recommended)

**Step 1: Create Upstash Account**
1. Go to [https://upstash.com](https://upstash.com)
2. Sign up for a free account
3. Create a new Redis database

**Step 2: Get Credentials**
1. In your Upstash dashboard, select your database
2. Copy the `UPSTASH_REDIS_REST_URL`
3. Copy the `UPSTASH_REDIS_REST_TOKEN`

**Step 3: Add to Environment Variables**

Add these to your `.env` file:

```env
# Upstash Redis for Rate Limiting (Optional - gracefully falls back if not set)
UPSTASH_REDIS_REST_URL="https://your-db.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token-here"
```

**Step 4: Restart Your App**
```bash
npm run dev
```

### Option 2: Development Mode (Default)

**No configuration needed!**  

The rate limiting system gracefully falls back to allow all requests if Upstash is not configured. This is perfect for local development.

Security headers and input validation still work without Upstash.

## 📊 How It Works

### Rate Limiting
1. Each request is identified by user ID (if authenticated) or IP address
2. The system tracks requests using a sliding window algorithm
3. When limit is exceeded, returns 429 status with `retryAfter` info
4. Rate limit headers included in all responses:
   - `X-RateLimit-Limit`: Maximum requests allowed
   - `X-RateLimit-Remaining`: Requests remaining
   - `X-RateLimit-Reset`: Unix timestamp when limit resets

### CSRF Protection
- Validates `origin` header matches expected host
- Falls back to `referer` header if origin not present
- Only validates POST, PUT, DELETE, PATCH requests

### Input Sanitization
- Removes `<script>` tags
- Removes `javascript:` protocol
- Removes event handlers (onclick, etc.)
- Validates email with regex
- Checks password strength

## 🧪 Testing Rate Limits

**Test login rate limit (5 per 15 min):**
```bash
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
  echo "\n"
done
```

You should see:
- First 5 requests: Normal error responses
- 6th request: 429 Too Many Requests

**Check rate limit headers:**
```bash
curl -i -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'
```

Look for these headers:
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Reset: 1234567890
```

## 🔧 Customizing Rate Limits

Edit `/lib/ratelimit.ts` to adjust limits:

```typescript
export const rateLimiters = {
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '15 m'), // 10 attempts per 15 min
    // ...
  }),
  // ...
}
```

## 🛡️ Security Best Practices

### For Production:
1. ✅ Set up Upstash Redis for rate limiting
2. ✅ Use HTTPS (handled by Amplify/Vercel automatically)
3. ✅ Keep dependencies updated: `npm audit`
4. ✅ Monitor rate limit analytics in Upstash dashboard
5. ⚠️ Consider adding:
   - Email verification on signup
   - 2FA for admin accounts
   - Account lockout after failed logins
   - IP blocking for persistent attackers

### Password Requirements:
- Minimum 8 characters
- At least one letter
- At least one number
- Maximum 100 characters

### API Security:
- All responses include security headers
- CSRF validation on state-changing operations
- Input sanitization on all user input
- Email format validation
- SQL injection protection (via Prisma ORM)

## 📈 Monitoring

### With Upstash:
- View rate limit analytics in Upstash dashboard
- Track which endpoints are being hit most
- Identify potential abuse patterns

### Without Upstash:
- Monitor server logs for suspicious activity
- Track failed login attempts in application logs
- Use application monitoring tools (Sentry, etc.)

## 🚨 Troubleshooting

**Problem: Rate limit triggers too quickly**
- Solution: Adjust limits in `/lib/ratelimit.ts`
- Note: Limit applies per IP or per user

**Problem: Can't login from shared network**
- Solution: Rate limits are per IP, shared networks hit limits faster
- Consider: Using user-based limits instead of IP-based

**Problem: CSRF validation failing**
- Check: Request includes proper `origin` or `referer` header
- Check: Not making cross-origin requests without proper CORS setup

**Problem: Rate limiting not working**
- Check: Upstash credentials are set correctly
- Check: `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in `.env`
- Check: Application restarted after adding env vars

## 📚 Additional Resources

- [Upstash Rate Limiting Docs](https://upstash.com/docs/redis/features/ratelimiting)
- [OWASP Security Guidelines](https://owasp.org/www-project-top-ten/)
- [MDN Security Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#security)

## 💰 Cost

- **Upstash Free Tier**: 10,000 requests/day
- **Perfect for**: Small to medium applications
- **Upgrade when**: Exceeding 10K requests/day (rare for most apps)

---

**Status**: ✅ Fully Implemented
**Last Updated**: October 26, 2025

