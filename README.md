# Smart Academic Scheduler

Smart Academic Scheduler is a comprehensive web application for educational institutions to manage academic schedules, timetables, teachers, and subjects efficiently.

## Repository Structure

- `backend/` - Node.js Express server with API endpoints
- `client/` - React frontend application
- `render.yaml` - Configuration file for Render deployment

## Features

- User authentication with role-based access (Admin, Teacher, Staff)
- Teacher management
- Subject and class management
- Timetable generation and visualization
- System settings and configuration
- Responsive design for all devices

## Technology Stack

- **Frontend**: React, React Bootstrap, Chart.js
- **Backend**: Node.js, Express
- **Database**: TiDB Cloud
- **Hosting**: Render

## Local Development Setup

### Prerequisites

- Node.js (v14 or newer)
- npm (v6 or newer)
- Git

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/adityad002/ES.git
   cd ES
   ```

2. Install dependencies:
   ```
   npm run install-all
   ```

3. Set up environment variables:
   - Create a `.env` file in the `backend` directory based on `.env.example`
   - Configure your database connection

4. Run the application in development mode:
   ```
   npm run dev
   ```

## Database Setup

The application uses TiDB Cloud for database storage.

1. Set up a TiDB Cloud account
2. Create a database cluster
3. Run the setup script to initialize your database:
   ```
   cd backend
   node setup-tidb.js
   ```

## Deployment to Render

### Backend Deployment

1. Push your code to GitHub
2. Log in to your Render account
3. Create a new Web Service
4. Connect your GitHub repository
5. Configure your service:
   - **Name**: smart-academic-scheduler-backend
   - **Environment**: Node
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && node index.js`
   - **Health Check Path**: `/api/health`

6. Add your environment variables:
   - `DB_HOST` - Your TiDB host
   - `DB_PORT` - Your TiDB port
   - `DB_USER` - Your TiDB username
   - `DB_PASSWORD` - Your TiDB password
   - `DB_NAME` - Your database name
   - `JWT_SECRET` - Secret for JWT tokens
   - `JWT_EXPIRES_IN` - Token expiration time (e.g., "24h")
   - `PORT` - Application port (Render will provide this)

7. Deploy your service

### Frontend Deployment (Optional)

1. Create another Web Service on Render
2. Configure:
   - **Name**: smart-academic-scheduler-frontend
   - **Environment**: Node
   - **Build Command**: `cd client && npm install && npm run build`
   - **Start Command**: `npx serve -s client/build -l $PORT`

3. Add environment variable:
   - `REACT_APP_API_URL` - URL of your backend service

For detailed deployment instructions, see `RENDER_DEPLOYMENT.md`.

## Testing Your Deployment

Run the pre-deployment test script to verify your configuration:

```
cd backend
node test-render-deploy.js
```

## Default Admin Access

After initialization, access the system with:
- Email: admin@example.com
- Password: password

Remember to change these credentials after first login.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.