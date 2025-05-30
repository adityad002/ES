const { pool } = require('./db');

async function testDBConnection() {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('✅ Connected to database successfully!');

    // Get tables
    const [tables] = await connection.query('SHOW TABLES');
    console.log('\nTables in the database:');
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`- ${tableName}`);
    });

    // Check if subjects table has data
    const [subjects] = await connection.query('SELECT COUNT(*) as count FROM subjects');
    console.log(`\nSubjects in database: ${subjects[0].count}`);

    // Check if teachers table has data
    const [teachers] = await connection.query('SELECT COUNT(*) as count FROM teachers');
    console.log(`Teachers in database: ${teachers[0].count}`);

    // Check settings
    const [settings] = await connection.query('SELECT * FROM settings LIMIT 1');
    if (settings.length > 0) {
      console.log('\nSettings from database:');
      console.log(`- Periods per day: ${settings[0].periodsPerDay}`);
      console.log(`- Working days: ${settings[0].workingDays}`);
      console.log(`- Class duration: ${settings[0].classDuration} minutes`);
    } else {
      console.log('\n⚠️ No settings found in database');
    }

    console.log('\n✅ Database is ready for timetable generation!');
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    if (connection) connection.release();
    process.exit();
  }
}

testDBConnection(); 