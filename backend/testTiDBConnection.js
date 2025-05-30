const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a connection with the same configuration as in db.js
async function testTiDBConnection() {
  console.log('Testing TiDB Cloud connection...');
  console.log(`Host: ${process.env.DB_HOST}`);
  console.log(`Port: ${process.env.DB_PORT}`);
  console.log(`User: ${process.env.DB_USER}`);
  console.log(`Database: ${process.env.DB_NAME}`);
  
  try {
    // Create connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: {
        rejectUnauthorized: true
      }
    });
    
    console.log('✅ Successfully connected to TiDB Cloud!');
    
    // Run a simple query to test the connection
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Query executed successfully:', rows);
    
    // Try to show tables if database exists
    try {
      const [tables] = await connection.execute('SHOW TABLES');
      console.log('✅ Database tables:');
      if (tables.length === 0) {
        console.log('   No tables found. Database exists but is empty.');
      } else {
        tables.forEach(table => {
          console.log(`   - ${Object.values(table)[0]}`);
        });
      }
    } catch (err) {
      console.error('❌ Error listing tables:', err.message);
    }
    
    // Close the connection
    await connection.end();
    console.log('Connection closed.');
    
  } catch (error) {
    console.error('❌ TiDB Connection error:', error.message);
    console.error('Full error:', error);
  }
}

// Execute the test
testTiDBConnection();