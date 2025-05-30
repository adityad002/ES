# Troubleshooting Guide for Render Deployment

## Common Issues and Solutions

### 1. "Endpoint not found" Error

**Symptoms:**
- Getting 404 errors when accessing API endpoints
- Frontend can't connect to backend
- All API calls return "endpoint not found"

**Possible Causes & Solutions:**

#### A. Backend Service Not Running
**Check:**
1. Go to your Render dashboard
2. Check if your backend service shows as "Live"
3. Look at the deployment logs for errors

**Solution:**
- If service failed to start, check the build and deploy logs
- Ensure all environment variables are set correctly
- Verify the start command is: `cd backend && node index.js`

#### B. Incorrect API URL in Frontend
**Check:**
- Frontend is trying to connect to wrong URL
- Environment variable `REACT_APP_API_URL` is incorrect

**Solution:**
1. Set `REACT_APP_API_URL` to: `https://your-backend-service-name.onrender.com/api`
2. Make sure to include `/api` at the end
3. Use `https://` not `http://`
4. Redeploy frontend after changing environment variables

#### C. CORS Issues
**Symptoms:**
- Browser console shows CORS errors
- Requests blocked by browser

**Solution:**
Check that your backend has CORS properly configured:
```javascript
app.use(cors()); // Should be in index.js
```

#### D. Health Check Path Issues
**Check:**
- Health check path in Render is set to `/api/health`
- Health check endpoint is working

**Test:**
Visit: `https://your-backend-service.onrender.com/api/health`

### 2. Database Connection Issues

**Symptoms:**
- Server starts but database operations fail
- "Database connection error" in logs

**Solutions:**

#### A. Check Environment Variables
Ensure these are set in Render:
- `DB_HOST`: Your TiDB host
- `DB_PORT`: 4000 (for TiDB)
- `DB_USER`: Your TiDB username
- `DB_PASSWORD`: Your TiDB password (mark as secret)
- `DB_NAME`: Your database name

#### B. TiDB Firewall Settings
- Ensure your TiDB cluster allows connections from Render
- Check TiDB Cloud firewall rules
- Consider allowing all IPs temporarily for testing

#### C. SSL Connection Issues
- TiDB requires SSL connections
- Verify SSL configuration in your connection code

### 3. Service Spinning Down (Free Tier)

**Symptoms:**
- First request after inactivity is very slow
- Service becomes unresponsive after 15 minutes

**Solutions:**
- This is normal behavior for Render free tier
- Consider upgrading to paid tier for production
- Implement a ping service to keep it alive (not recommended)

### 4. Build Failures

**Common Build Issues:**

#### A. Missing Dependencies
**Solution:**
- Ensure `package.json` has all required dependencies
- Check that build command is: `cd backend && npm install`

#### B. Node Version Issues
**Solution:**
- Specify Node version in `package.json`:
```json
"engines": {
  "node": ">=14.0.0"
}
```

#### C. Build Timeout
**Solution:**
- Simplify build process
- Remove unnecessary dependencies
- Use `npm ci` instead of `npm install` for faster builds

### 5. Environment Variable Issues

**Check Environment Variables:**
1. In Render dashboard, go to your service
2. Click "Environment" tab
3. Verify all variables are set correctly
4. Check that sensitive variables are marked as "Secret"

**Common Mistakes:**
- Forgetting to set `PORT` (Render provides this automatically)
- Setting wrong database credentials
- Missing `JWT_SECRET`
- Incorrect `REACT_APP_API_URL` format

### 6. Route Registration Issues

**Symptoms:**
- Some endpoints work, others don't
- Inconsistent 404 errors

**Check:**
1. Verify all routes are imported in `index.js`
2. Check route paths match expected URLs
3. Ensure middleware is correctly applied

### 7. JSON Column Database Errors

**Symptoms:**
- SQL syntax errors during database setup
- "You have an error in your SQL syntax" messages

**Solution:**
Run the fix script:
```bash
npm run fix-json
```

## Diagnostic Tools

### 1. Health Check
Visit: `https://your-service.onrender.com/api/health`

Should return:
```json
{
  "status": "healthy",
  "message": "Service is running",
  "timestamp": "2023-...",
  "environment": "production",
  "port": 10000
}
```

### 2. Debug Routes
Visit: `https://your-service.onrender.com/api/debug/routes`

This will list all registered routes in your application.

### 3. Diagnostic Script
Run locally to test your deployed service:
```bash
node backend/diagnose-deployment.js https://your-service.onrender.com
```

### 4. Check Service Logs
1. Go to Render dashboard
2. Select your service
3. Click "Logs" tab
4. Look for error messages and stack traces

## Step-by-Step Debugging Process

1. **Verify Service Status**
   - Check Render dashboard
   - Ensure service is "Live" and "Healthy"

2. **Test Health Endpoint**
   - Visit `/api/health`
   - Should return 200 status

3. **Check Environment Variables**
   - Verify all required variables are set
   - Check database connection details

4. **Test Database Connection**
   - Run JSON fix script if needed
   - Check TiDB connectivity

5. **Verify Route Registration**
   - Visit `/api/debug/routes`
   - Check that your routes are listed

6. **Test Frontend Connection**
   - Check `REACT_APP_API_URL` is correct
   - Verify CORS is working

7. **Check Service Logs**
   - Look for error messages
   - Check for any uncaught exceptions

## Getting Help

If you're still experiencing issues:

1. **Check Service Logs** in Render dashboard
2. **Run Diagnostic Script** with your deployed URL
3. **Verify Environment Variables** are exactly as specified
4. **Test Database Connection** separately
5. **Check TiDB Cloud Settings** for any firewall or connection restrictions

## Common Environment Variable Values

For reference, here are the typical environment variables:

```
DB_HOST=gateway01.ap-southeast-1.prod.aws.tidbcloud.com
DB_PORT=4000
DB_USER=your-tidb-username
DB_PASSWORD=your-tidb-password (mark as secret)
DB_NAME=es
JWT_SECRET=your-random-secret (mark as secret)
JWT_EXPIRES_IN=24h
PORT=(automatically provided by Render)
```

For frontend:
```
REACT_APP_API_URL=https://your-backend-service.onrender.com/api
```

Remember: Always redeploy after changing environment variables!