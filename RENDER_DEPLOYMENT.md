# Deploying the Smart Academic Scheduler to Render

This guide walks you through the process of deploying your Smart Academic Scheduler application to Render with your existing TiDB Cloud database.

## Prerequisites

- Your code has been pushed to GitHub (https://github.com/adityad002/ES.git)
- You have a TiDB Cloud account with a running database
- You have your TiDB Cloud database credentials

## Step 1: Create a Render Account

1. Go to [render.com](https://render.com/)
2. Sign up for a free account (you can sign up with your GitHub account)

## Step 2: Connect to GitHub

1. In the Render dashboard, click on "New +"
2. Select "Web Service"
3. Connect your GitHub account if you haven't already
4. Select your repository (adityad002/ES)

## Step 3: Configure the Backend Service

1. Enter the following settings:
   - **Name**: smart-academic-scheduler-backend
   - **Environment**: Node
   - **Region**: Choose the region closest to your TiDB Cloud instance
   - **Branch**: main
   - **Root Directory**: (leave empty)
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && node index.js`
   - **Plan**: Free tier

2. Expand the "Advanced" section and click on "Add Environment Variable"

3. Add the following environment variables:
   - `DB_HOST` = gateway01.ap-southeast-1.prod.aws.tidbcloud.com
   - `DB_PORT` = 4000
   - `DB_USER` = 3nDfVgE8AiykFrg.root
   - `DB_PASSWORD` = (your TiDB password - mark this as secret)
   - `DB_NAME` = es
   - `PORT` = 10000
   - `JWT_SECRET` = (generate a random string or let Render generate one)
   - `JWT_EXPIRES_IN` = 24h

4. Under "Health Check Path", enter: `/api/health`

5. Click "Create Web Service"

## Step 4: Deploy the Frontend Service (Optional - if you want to host frontend on Render too)

1. In the Render dashboard, click on "New +" again
2. Select "Web Service"
3. Select your repository again

4. Enter the following settings:
   - **Name**: smart-academic-scheduler-frontend
   - **Environment**: Node
   - **Region**: Same as backend
   - **Branch**: main
   - **Root Directory**: (leave empty)
   - **Build Command**: `cd client && npm install && npm run build`
   - **Start Command**: `npx serve -s client/build -l $PORT`
   - **Plan**: Free tier

5. Add the following environment variable:
   - `REACT_APP_API_URL` = (URL of your backend service, which you'll get after the backend is deployed)

6. Click "Create Web Service"

## Step 5: Update Client Configuration

After deployment, you'll need to update your frontend to point to the new backend URL. If you're hosting the frontend on Render, this is set through the environment variable above. If you're hosting it elsewhere, update the API base URL accordingly.

## Step 6: Test Your Deployment

1. Wait for both services to deploy
2. Visit your backend URL + "/api/health" to verify the backend is running
3. Try logging in with your admin credentials (default: admin@example.com / password)

## Troubleshooting

If your deployment fails, check the following:

1. **Database Connection**: Ensure your TiDB credentials are correct and that your database allows connections from Render's IP range. You may need to update TiDB's firewall settings.

2. **Environment Variables**: Double-check all environment variables are correctly set.

3. **Build Errors**: Check the build logs in Render for any errors during the build process.

4. **Service Logs**: Review the service logs in Render to diagnose any runtime issues.

5. **JSON Column Errors**: If you encounter SQL syntax errors related to JSON columns, you may need to run the fix script after deployment:
   - Open the Render console for your backend service
   - Run: `npm run fix-json`
   - This will fix any JSON column syntax issues in your TiDB database

## Important Notes

- The free tier of Render will spin down your service after 15 minutes of inactivity, which means the first request after inactivity might be slow.
- For production use, consider upgrading to a paid tier to avoid service spin-down.
- Always keep your database credentials secure and never commit them to your repository.

## Additional Resources

- [Render Dashboard](https://dashboard.render.com)
- [Render Documentation](https://render.com/docs)
- [TiDB Cloud Documentation](https://docs.pingcap.com/tidbcloud)