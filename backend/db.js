const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a pool connection for better performance with multiple connections
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '12345678',
  database: process.env.DB_NAME || 'es',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: true
  }
});

// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
    
    // Set up tables if they don't exist
    await setupDatabase();
    
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    return false;
  }
}

// Create necessary tables if they don't exist
async function setupDatabase() {
  try {
    // Create users table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'teacher', 'staff') NOT NULL DEFAULT 'staff',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Create settings table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
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
    
    // Create teachers table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS teachers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Create teacher_availability table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS teacher_availability (
        id INT AUTO_INCREMENT PRIMARY KEY,
        teacher_id INT NOT NULL,
        day VARCHAR(10) NOT NULL,
        period INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
        UNIQUE KEY unique_teacher_day_period (teacher_id, day, period)
      )
    `);
    
    // Create subjects table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subjects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(50) NOT NULL UNIQUE,
        hours_per_week INT DEFAULT 4,
        semester INT DEFAULT 1,
        is_lab BOOLEAN DEFAULT FALSE,
        teacher_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL
      )
    `);
    
    // Create subject_assignments table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subject_assignments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        subject_id INT NOT NULL,
        teacher_id INT NOT NULL,
        class_name VARCHAR(50) NOT NULL,
        hours_per_week INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
        FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
        UNIQUE KEY unique_subject_teacher_class (subject_id, teacher_id, class_name)
      )
    `);
    
    // Create timetable_slots table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS timetable_slots (
        id INT AUTO_INCREMENT PRIMARY KEY,
        assignment_id INT NOT NULL,
        day VARCHAR(10) NOT NULL,
        period INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (assignment_id) REFERENCES subject_assignments(id) ON DELETE CASCADE,
        UNIQUE KEY unique_day_period_assignment (day, period, assignment_id)
      )
    `);
    
    // Check if settings exist, create default if not
    const [settingsCheck] = await pool.query('SELECT * FROM settings WHERE id = 1');
    
    if (settingsCheck.length === 0) {
      await pool.query(`
        INSERT INTO settings (id, periodsPerDay, workingDays, startTime, endTime, lunchBreak, shortBreaks, classDuration, academic_year) 
        VALUES (1, 8, CAST('["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]' AS JSON), '09:00:00', '16:00:00', 
                CAST('{"enabled": true, "period": 4, "duration": 30}' AS JSON), CAST('[]' AS JSON), 50, YEAR(CURDATE()))
      `);
      
      console.log('⚙️ Default settings created');
    }
    
    // Check if admin user exists, create it if not
    const [users] = await pool.query('SELECT * FROM users WHERE role = "admin" LIMIT 1');
    
    if (users.length === 0) {
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('password', 10);
      
      await pool.query(`
        INSERT INTO users (name, email, password, role) 
        VALUES ('Admin User', 'admin@example.com', ?, 'admin')
      `, [hashedPassword]);
      
      console.log('👤 Default admin user created');
    }
    
    console.log('📋 Database tables setup completed');
  } catch (error) {
    console.error('❌ Error setting up database tables:', error.message);
  }
}

module.exports = {
  pool,
  testConnection
};
