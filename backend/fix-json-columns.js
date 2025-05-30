/**
 * Fix JSON Columns Script
 * This script fixes JSON column issues in TiDB after deployment
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const fixJsonColumns = async () => {
  let connection;
  
  try {
    console.log('Connecting to TiDB...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: {
        rejectUnauthorized: true
      }
    });
    
    console.log('✅ Connected to TiDB successfully');
    
    // Check if settings table exists
    const [tables] = await connection.query("SHOW TABLES LIKE 'settings'");
    
    if (tables.length === 0) {
      console.log('Creating settings table...');
      await connection.query(`
        CREATE TABLE settings (
          id INT PRIMARY KEY DEFAULT 1,
          periodsPerDay INT DEFAULT 8,
          workingDays JSON,
          startTime TIME DEFAULT '09:00:00',
          endTime TIME DEFAULT '16:00:00',
          lunchBreak JSON,
          shortBreaks JSON,
          classDuration INT DEFAULT 50,
          academic_year INT DEFAULT 2023,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          CHECK (id = 1)
        )
      `);
      console.log('✅ Settings table created');
    }
    
    // Check if default settings exist
    const [settings] = await connection.query('SELECT * FROM settings WHERE id = 1');
    
    if (settings.length === 0) {
      console.log('Inserting default settings...');
      await connection.query(`
        INSERT INTO settings (id, periodsPerDay, workingDays, startTime, endTime, lunchBreak, shortBreaks, classDuration, academic_year) 
        VALUES (1, 8, CAST(? AS JSON), '09:00:00', '16:00:00', CAST(? AS JSON), CAST(? AS JSON), 50, YEAR(CURRENT_DATE()))
      `, [
        JSON.stringify(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]),
        JSON.stringify({"enabled": true, "period": 4, "duration": 30}),
        JSON.stringify([])
      ]);
      console.log('✅ Default settings created');
    } else {
      console.log('Settings already exist, checking JSON columns...');
      
      // Update JSON columns if they're null or invalid
      const setting = settings[0];
      let needsUpdate = false;
      const updates = {};
      
      if (!setting.workingDays) {
        updates.workingDays = JSON.stringify(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
        needsUpdate = true;
      }
      
      if (!setting.lunchBreak) {
        updates.lunchBreak = JSON.stringify({"enabled": true, "period": 4, "duration": 30});
        needsUpdate = true;
      }
      
      if (!setting.shortBreaks) {
        updates.shortBreaks = JSON.stringify([]);
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        const updateFields = Object.keys(updates).map(key => `${key} = CAST(? AS JSON)`).join(', ');
        const values = Object.values(updates);
        
        await connection.query(`UPDATE settings SET ${updateFields} WHERE id = 1`, values);
        console.log('✅ JSON columns updated');
      } else {
        console.log('✅ JSON columns are already properly set');
      }
    }
    
    // Check if admin user exists
    const [users] = await connection.query('SELECT * FROM users WHERE role = "admin" LIMIT 1');
    
    if (users.length === 0) {
      console.log('Creating admin user...');
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('password', 10);
      
      await connection.query(`
        INSERT INTO users (name, email, password, role) 
        VALUES ('Admin User', 'admin@example.com', ?, 'admin')
      `, [hashedPassword]);
      
      console.log('✅ Default admin user created (email: admin@example.com, password: password)');
    } else {
      console.log('✅ Admin user already exists');
    }
    
    console.log('\n🎉 Database JSON columns fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing JSON columns:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('Connection closed.');
    }
  }
};

// Run the fix
fixJsonColumns().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});