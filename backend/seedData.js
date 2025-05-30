/**
 * Seed data script for Smart Academic Scheduler
 * Run this script to populate initial data in the database
 */

const { pool } = require('./db');
const bcrypt = require('bcrypt');

async function seedDatabase() {
  console.log('Starting database seeding...');
  
  try {
    // Begin transaction
    await pool.query('START TRANSACTION');
    
    // Check if admin user exists, create if not
    const [adminUsers] = await pool.query("SELECT * FROM users WHERE role = 'admin'");
    
    if (adminUsers.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await pool.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Admin User', 'admin@example.com', hashedPassword, 'admin']
      );
      
      console.log('✅ Admin user created successfully');
    } else {
      console.log('Admin user already exists. Skipping...');
    }
    
    // Seed some sample teachers
    const sampleTeachers = [
      { name: 'John Smith', email: 'john.smith@example.com' },
      { name: 'Sarah Johnson', email: 'sarah.johnson@example.com' },
      { name: 'Robert Davis', email: 'robert.davis@example.com' },
      { name: 'Emily Wilson', email: 'emily.wilson@example.com' },
      { name: 'Michael Brown', email: 'michael.brown@example.com' }
    ];
    
    for (const teacher of sampleTeachers) {
      // Check if teacher already exists
      const [existingTeacher] = await pool.query('SELECT * FROM teachers WHERE email = ?', [teacher.email]);
      
      if (existingTeacher.length === 0) {
        await pool.query(
          'INSERT INTO teachers (name, email, created_at) VALUES (?, ?, NOW())',
          [teacher.name, teacher.email]
        );
        
        console.log(`✅ Teacher '${teacher.name}' created successfully`);
      } else {
        console.log(`Teacher with email '${teacher.email}' already exists. Skipping...`);
      }
    }
    
    // Seed some sample subjects
    const sampleSubjects = [
      { name: 'Mathematics', code: 'MATH101', hours_per_week: 5 },
      { name: 'Computer Science', code: 'CS101', hours_per_week: 4 },
      { name: 'Physics', code: 'PHYS101', hours_per_week: 4 },
      { name: 'Chemistry', code: 'CHEM101', hours_per_week: 3 },
      { name: 'English', code: 'ENG101', hours_per_week: 3 }
    ];
    
    for (const subject of sampleSubjects) {
      // Check if subject already exists
      const [existingSubject] = await pool.query('SELECT * FROM subjects WHERE code = ?', [subject.code]);
      
      if (existingSubject.length === 0) {
        await pool.query(
          'INSERT INTO subjects (name, code, hours_per_week, created_at) VALUES (?, ?, ?, NOW())',
          [subject.name, subject.code, subject.hours_per_week]
        );
        
        console.log(`✅ Subject '${subject.name}' created successfully`);
      } else {
        console.log(`Subject with code '${subject.code}' already exists. Skipping...`);
      }
    }
    
    // Apply default settings if not exist
    const [settingsCheck] = await pool.query('SELECT * FROM settings WHERE id = 1');
    
    if (settingsCheck.length === 0) {
      const defaultWorkingDays = JSON.stringify(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
      const defaultLunchBreak = JSON.stringify({ enabled: true, period: 4, duration: 30 });
      
      await pool.query(`
        INSERT INTO settings (id, periodsPerDay, workingDays, startTime, endTime, lunchBreak, academic_year) 
        VALUES (1, 8, ?, '09:00:00', '16:00:00', ?, YEAR(CURDATE()))
      `, [defaultWorkingDays, defaultLunchBreak]);
      
      console.log('✅ Default settings applied successfully');
    } else {
      console.log('Settings already exist. Skipping...');
    }
    
    // Commit all changes
    await pool.query('COMMIT');
    
    console.log('Database seeding completed successfully! 🎉');
  } catch (error) {
    // Rollback on error
    await pool.query('ROLLBACK');
    console.error('❌ Error seeding database:', error);
  } finally {
    // Close the pool
    process.exit();
  }
}

// Run the seed function
seedDatabase(); 