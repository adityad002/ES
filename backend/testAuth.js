require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { pool } = require('./db');

async function testLogin() {
  console.log('Testing JWT configuration...');
  console.log('JWT_SECRET:', process.env.JWT_SECRET);
  console.log('JWT_EXPIRES_IN:', process.env.JWT_EXPIRES_IN);
  
  console.log('\nTesting with admin credentials...');
  try {
    // Find the user
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', ['admin@example.com']);
    
    if (users.length === 0) {
      console.log('Admin user not found.');
      
      // Let's create an admin user if it doesn't exist
      console.log('Creating admin user...');
      const hashedPassword = await bcrypt.hash('password', 10);
      
      await pool.query(`
        INSERT INTO users (name, email, password, role) 
        VALUES ('Admin User', 'admin@example.com', ?, 'admin')
      `, [hashedPassword]);
      
      console.log('Admin user created successfully.');
      
      // Get the newly created user
      const [newUsers] = await pool.query('SELECT * FROM users WHERE email = ?', ['admin@example.com']);
      if (newUsers.length === 0) {
        throw new Error('Failed to create admin user');
      }
      
      console.log('Admin user details:');
      console.log({
        id: newUsers[0].id,
        name: newUsers[0].name,
        email: newUsers[0].email,
        role: newUsers[0].role
      });
      
      return;
    }
    
    const user = users[0];
    console.log('Admin user details:');
    console.log({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });
    
    // Test password matching
    console.log('\nTesting password matching...');
    const passwordMatch = await bcrypt.compare('password', user.password);
    console.log('Password match:', passwordMatch);
    
    if (!passwordMatch) {
      // Reset password if it doesn't match
      console.log('Resetting admin password...');
      const hashedPassword = await bcrypt.hash('password', 10);
      
      await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);
      
      console.log('Admin password reset successfully.');
    }
    
    // Generate JWT token
    console.log('\nGenerating JWT token...');
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    console.log('Generated token:', token);
    
    // Verify the token
    console.log('\nVerifying JWT token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);
    
    console.log('\nLogin test completed successfully.');
  } catch (error) {
    console.error('Login test error:', error);
  } finally {
    // Close the connection
    pool.end();
  }
}

testLogin(); 