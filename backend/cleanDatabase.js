require('dotenv').config();
const { pool } = require('./db');

async function cleanDatabase() {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    console.log('Starting database cleanup...');
    
    // Delete timetable slots first (due to foreign key constraints)
    const [timetableResult] = await connection.query('DELETE FROM timetable_slots');
    console.log(`Deleted ${timetableResult.affectedRows} timetable slots`);
    
    // Delete subject assignments
    const [assignmentsResult] = await connection.query('DELETE FROM subject_assignments');
    console.log(`Deleted ${assignmentsResult.affectedRows} subject assignments`);
    
    // Delete teacher availability
    const [availabilityResult] = await connection.query('DELETE FROM teacher_availability');
    console.log(`Deleted ${availabilityResult.affectedRows} teacher availability records`);
    
    // Delete subjects
    const [subjectsResult] = await connection.query('DELETE FROM subjects');
    console.log(`Deleted ${subjectsResult.affectedRows} subjects`);
    
    // Delete teachers
    const [teachersResult] = await connection.query('DELETE FROM teachers');
    console.log(`Deleted ${teachersResult.affectedRows} teachers`);
    
    // Reset auto-increment counters
    await connection.query('ALTER TABLE teachers AUTO_INCREMENT = 1');
    await connection.query('ALTER TABLE subjects AUTO_INCREMENT = 1');
    await connection.query('ALTER TABLE subject_assignments AUTO_INCREMENT = 1');
    await connection.query('ALTER TABLE timetable_slots AUTO_INCREMENT = 1');
    await connection.query('ALTER TABLE teacher_availability AUTO_INCREMENT = 1');
    
    console.log('Auto-increment counters reset');
    
    // Commit the transaction
    await connection.commit();
    console.log('Database cleanup completed successfully');
    
  } catch (error) {
    // Rollback transaction if any error occurs
    if (connection) {
      await connection.rollback();
    }
    console.error('Error during database cleanup:', error);
  } finally {
    // Release connection
    if (connection) {
      connection.release();
    }
    // Close pool
    await pool.end();
  }
}

cleanDatabase(); 