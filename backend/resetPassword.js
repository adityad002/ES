require('dotenv').config();
const bcrypt = require('bcrypt');
const { pool } = require('./db');

async function resetAdminPassword() {
  try {
    // Hash the new password
    const newPassword = 'password';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    console.log('New hashed password generated');
    
    // Update the admin user's password
    const [result] = await pool.query(
      'UPDATE users SET password = ? WHERE email = ?',
      [hashedPassword, 'admin@example.com']
    );
    
    if (result.affectedRows > 0) {
      console.log('Admin password reset successfully to "password"');
    } else {
      console.log('Admin user not found. Creating admin user...');
      
      // Create admin user if it doesn't exist
      await pool.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Admin User', 'admin@example.com', hashedPassword, 'admin']
      );
      
      console.log('Admin user created with password "password"');
    }
  } catch (error) {
    console.error('Error resetting admin password:', error);
  } finally {
    // Close the connection
    await pool.end();
  }
}

resetAdminPassword(); 