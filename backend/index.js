/**
 * Smart Academic Scheduler Backend Server
 * Main server file with Express and database setup
 */

const express = require('express');
const cors = require('cors');
const { testConnection } = require('./db');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const settingsRoutes = require('./routes/settings');
const teachersRoutes = require('./routes/teachers');
const subjectsRoutes = require('./routes/subjects');
const timetableRoutes = require('./routes/timetable');
const subjectAssignmentsRoutes = require('./routes/subjectAssignments');

// Initialize express app
const app = express();

// Set up middleware
app.use(cors());
app.use(express.json());

// Add at the top of the file
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Keep the process running instead of crashing
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Keep the process running instead of crashing
});

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Request headers:', req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request body:', req.body);
  }
  next();
});

// Test database connection
testConnection()
  .then(connected => {
    if (!connected) {
      console.error('Unable to connect to database. Check your credentials and make sure MySQL is running.');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Error testing database connection:', err);
    process.exit(1);
  });

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/teachers', teachersRoutes);
app.use('/api/subjects', subjectsRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/subject-assignments', subjectAssignmentsRoutes);

// Health check endpoint for Render
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    message: 'Service is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3001,
    database: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      name: process.env.DB_NAME
    }
  });
});

// Debug endpoint to list all routes
app.get('/api/debug/routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          routes.push({
            path: handler.route.path,
            methods: Object.keys(handler.route.methods)
          });
        }
      });
    }
  });
  res.json({
    message: 'Available routes',
    routes: routes,
    totalRoutes: routes.length
  });
});

// Basic root route
app.get('/', (req, res) => {
  res.json({
    message: 'Smart Academic Scheduler API',
    status: 'Running',
    version: '1.0.0'
  });
});

// Handle 404 errors
app.use((req, res) => {
  console.log(`404 Error: ${req.method} ${req.url} not found`);
  res.status(404).json({
    success: false,
    message: `Endpoint not found: ${req.method} ${req.url}`,
    availableEndpoints: [
      'GET /',
      'GET /api/health',
      'GET /api/debug/routes',
      'POST /api/auth/login',
      'GET /api/auth/me',
      'GET /api/settings',
      'GET /api/teachers',
      'GET /api/subjects',
      'GET /api/timetable',
      'GET /api/subject-assignments'
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  console.error('Error stack:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Server error',
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = process.env.PORT || 3001;
console.log(`Attempting to start server on port ${PORT}`);
console.log('Environment variables:');
console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`- DB_HOST: ${process.env.DB_HOST}`);
console.log(`- DB_PORT: ${process.env.DB_PORT}`);
console.log(`- DB_NAME: ${process.env.DB_NAME}`);
console.log(`- JWT_SECRET: ${process.env.JWT_SECRET ? 'Set' : 'Not set'}`);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Debug routes: http://localhost:${PORT}/api/debug/routes`);
});
