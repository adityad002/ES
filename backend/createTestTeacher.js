require('dotenv').config();
const { pool } = require('./db');

async function createTestTeacher() {
  try {
    // Insert a test teacher
    const [result] = await pool.query(
      'INSERT INTO teachers (name, email, created_at) VALUES (?, ?, NOW())',
      ['John Smith', 'john.smith@example.com']
    );
    
    console.log('Test teacher created successfully');
    console.log('Teacher ID:', result.insertId);
    
    // Insert another test teacher
    const [result2] = await pool.query(
      'INSERT INTO teachers (name, email, created_at) VALUES (?, ?, NOW())',
      ['Jane Doe', 'jane.doe@example.com']
    );
    
    console.log('Second test teacher created successfully');
    console.log('Teacher ID:', result2.insertId);
    
  } catch (error) {
    console.error('Error creating test teacher:', error);
  } finally {
    // Close the connection
    await pool.end();
  }
}

createTestTeacher(); 