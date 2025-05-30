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
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 3001;
console.log(`Attempting to start server on port ${PORT}`);
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}`);
});
