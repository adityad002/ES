const jwt = require('jsonwebtoken');
const { pool } = require('../db');
require('dotenv').config();

// Middleware to protect routes
exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // Get token from header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
      console.log('Token extracted from Authorization header');
    }
    
    // Check if token exists
    if (!token) {
      console.log('No token provided in request');
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
    
    try {
      // Verify token
      console.log('Attempting to verify token...');
      console.log('JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 'undefined');
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token verified successfully. User ID:', decoded.id);
      
      // Check if user still exists
      const [users] = await pool.query(
        'SELECT id, name, email, role FROM users WHERE id = ?',
        [decoded.id]
      );
      
      if (users.length === 0) {
        console.log('User not found in database. ID:', decoded.id);
        return res.status(401).json({
          success: false,
          message: 'The user belonging to this token no longer exists'
        });
      }
      
      console.log('User authenticated successfully:', users[0].email);
      
      // Set user in request
      req.user = users[0];
      next();
    } catch (error) {
      console.error('Token verification failed:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in authentication middleware'
    });
  }
};

// Middleware to restrict access to certain roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      console.log(`Access denied: User role ${req.user.role} not in allowed roles: ${roles.join(', ')}`);
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
}; 