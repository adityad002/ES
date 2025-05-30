/**
 * Deployment Diagnostic Script
 * Run this script to diagnose common deployment issues
 */

const axios = require('axios');
require('dotenv').config();

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function diagnoseDeployment() {
  console.log(`${colors.cyan}==================================${colors.reset}`);
  console.log(`${colors.cyan}  Deployment Diagnostic Tool     ${colors.reset}`);
  console.log(`${colors.cyan}==================================${colors.reset}`);

  // Get the deployment URL from command line or environment
  const deploymentUrl = process.argv[2] || process.env.DEPLOYMENT_URL;
  
  if (!deploymentUrl) {
    console.log(`${colors.red}Usage: node diagnose-deployment.js <deployment-url>${colors.reset}`);
    console.log(`${colors.yellow}Example: node diagnose-deployment.js https://your-app.onrender.com${colors.reset}`);
    process.exit(1);
  }

  console.log(`${colors.blue}Testing deployment at: ${deploymentUrl}${colors.reset}\n`);

  const tests = [
    {
      name: 'Root endpoint',
      url: deploymentUrl,
      expected: 'should return service info'
    },
    {
      name: 'Health check',
      url: `${deploymentUrl}/api/health`,
      expected: 'should return healthy status'
    },
    {
      name: 'Debug routes',
      url: `${deploymentUrl}/api/debug/routes`,
      expected: 'should list all available routes'
    },
    {
      name: 'Auth endpoint structure',
      url: `${deploymentUrl}/api/auth/login`,
      method: 'POST',
      data: {},
      expected: 'should return validation error (not 404)'
    },
    {
      name: 'Settings endpoint',
      url: `${deploymentUrl}/api/settings`,
      expected: 'should return settings or auth error'
    }
  ];

  for (const test of tests) {
    await runTest(test);
  }

  console.log(`\n${colors.cyan}Diagnostic Summary:${colors.reset}`);
  console.log(`${colors.yellow}If any tests failed with 404 errors, check:${colors.reset}`);
  console.log(`1. Environment variables are set correctly on Render`);
  console.log(`2. Build command completed successfully`);
  console.log(`3. Start command is correct: "cd backend && node index.js"`);
  console.log(`4. Health check path is set to: "/api/health"`);
  console.log(`5. Service is not spinning down (check Render logs)`);
}

async function runTest(test) {
  try {
    console.log(`${colors.blue}Testing: ${test.name}${colors.reset}`);
    
    const config = {
      method: test.method || 'GET',
      url: test.url,
      timeout: 30000,
      validateStatus: () => true // Accept any status code
    };

    if (test.data) {
      config.data = test.data;
      config.headers = { 'Content-Type': 'application/json' };
    }

    const response = await axios(config);
    
    if (response.status === 404) {
      console.log(`${colors.red}❌ FAILED (404): ${test.url}${colors.reset}`);
      console.log(`   Response: ${response.data?.message || 'Endpoint not found'}`);
    } else if (response.status >= 500) {
      console.log(`${colors.red}❌ SERVER ERROR (${response.status}): ${test.url}${colors.reset}`);
      console.log(`   Error: ${response.data?.message || 'Internal server error'}`);
    } else if (response.status >= 400) {
      console.log(`${colors.yellow}⚠️  CLIENT ERROR (${response.status}): ${test.url}${colors.reset}`);
      console.log(`   This might be expected for endpoints requiring auth or data`);
      console.log(`   Response: ${JSON.stringify(response.data, null, 2).substring(0, 200)}...`);
    } else {
      console.log(`${colors.green}✅ SUCCESS (${response.status}): ${test.url}${colors.reset}`);
      if (test.name === 'Debug routes' && response.data?.routes) {
        console.log(`   Found ${response.data.routes.length} routes`);
        response.data.routes.forEach(route => {
          console.log(`     ${route.methods.join(', ')} ${route.path}`);
        });
      } else {
        console.log(`   Response: ${JSON.stringify(response.data, null, 2).substring(0, 200)}...`);
      }
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.log(`${colors.red}❌ CONNECTION FAILED: ${test.url}${colors.reset}`);
      console.log(`   Error: ${error.message}`);
      console.log(`   Check if the service is running and URL is correct`);
    } else if (error.code === 'ECONNABORTED') {
      console.log(`${colors.red}❌ TIMEOUT: ${test.url}${colors.reset}`);
      console.log(`   Service might be starting up or under heavy load`);
    } else {
      console.log(`${colors.red}❌ ERROR: ${test.url}${colors.reset}`);
      console.log(`   Error: ${error.message}`);
    }
  }
  console.log('');
}

// Additional helper function to test local environment
async function testLocalEnvironment() {
  console.log(`${colors.cyan}Testing Local Environment...${colors.reset}\n`);
  
  const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];
  let allPresent = true;
  
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      console.log(`${colors.red}❌ Missing: ${varName}${colors.reset}`);
      allPresent = false;
    } else {
      const value = varName.includes('PASSWORD') || varName.includes('SECRET') ? '***' : process.env[varName];
      console.log(`${colors.green}✅ ${varName}: ${value}${colors.reset}`);
    }
  });
  
  if (!allPresent) {
    console.log(`${colors.yellow}\nSome environment variables are missing. Make sure they're set on Render.${colors.reset}`);
  }
}

// Check if we're testing local environment
if (process.argv[2] === '--local') {
  testLocalEnvironment();
} else {
  diagnoseDeployment();
}