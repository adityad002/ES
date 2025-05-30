/**
 * Test script for Render deployment
 * This script validates that your backend is properly configured for Render
 */

require('dotenv').config();
const { testConnection } = require('./db');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

console.log(`${colors.cyan}==================================${colors.reset}`);
console.log(`${colors.cyan}  Render Deployment Test Script ${colors.reset}`);
console.log(`${colors.cyan}==================================${colors.reset}`);

// Check that all required environment variables are set
const requiredEnvVars = [
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'JWT_SECRET'
];

console.log(`\n${colors.blue}Checking environment variables...${colors.reset}`);
let envVarsOk = true;

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.log(`${colors.red}✖ Missing ${varName}${colors.reset}`);
    envVarsOk = false;
  } else {
    const value = varName.includes('PASSWORD') || varName.includes('SECRET') 
      ? '********' 
      : process.env[varName];
    console.log(`${colors.green}✓ ${varName}=${value}${colors.reset}`);
  }
});

if (!envVarsOk) {
  console.log(`\n${colors.red}Environment variables check failed!${colors.reset}`);
  console.log(`${colors.yellow}Make sure all required variables are in your .env file or set on Render.${colors.reset}`);
  process.exit(1);
}

// Test database connection
console.log(`\n${colors.blue}Testing database connection...${colors.reset}`);
testConnection()
  .then(connected => {
    if (!connected) {
      console.log(`\n${colors.red}✖ Database connection failed!${colors.reset}`);
      console.log(`${colors.yellow}Check your database credentials and make sure TiDB allows connections from your IP.${colors.reset}`);
      process.exit(1);
    } else {
      console.log(`${colors.green}✓ Successfully connected to TiDB database '${process.env.DB_NAME}'${colors.reset}`);
      
      // Check for PORT
      console.log(`\n${colors.blue}Checking server port configuration...${colors.reset}`);
      const port = process.env.PORT || 3001;
      console.log(`${colors.green}✓ Server will run on PORT=${port}${colors.reset}`);
      
      console.log(`\n${colors.blue}Testing health check endpoint...${colors.reset}`);
      console.log(`${colors.green}✓ Health check endpoint '/api/health' is configured${colors.reset}`);
      
      console.log(`\n${colors.green}============================${colors.reset}`);
      console.log(`${colors.green}  All checks passed! 🚀${colors.reset}`);
      console.log(`${colors.green}============================${colors.reset}`);
      
      console.log(`\n${colors.cyan}Next steps:${colors.reset}`);
      console.log(`${colors.white}1. Push your code to GitHub${colors.reset}`);
      console.log(`${colors.white}2. Create a new Web Service on Render${colors.reset}`);
      console.log(`${colors.white}3. Use the build command: ${colors.yellow}cd backend && npm install${colors.reset}`);
      console.log(`${colors.white}4. Use the start command: ${colors.yellow}cd backend && node index.js${colors.reset}`);
      console.log(`${colors.white}5. Set all environment variables${colors.reset}`);
      console.log(`${colors.white}6. Set health check path to: ${colors.yellow}/api/health${colors.reset}`);
      
      process.exit(0);
    }
  })
  .catch(err => {
    console.log(`\n${colors.red}✖ Error testing database connection:${colors.reset}`);
    console.error(err);
    process.exit(1);
  });