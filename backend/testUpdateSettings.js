const { pool } = require('./db');

async function testUpdateSettings() {
  try {
    console.log('Testing settings update...');

    // Sample settings data
    const sampleSettings = {
      periodsPerDay: 8,
      workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      startTime: "09:00:00",
      endTime: "16:00:00",
      lunchBreak: { enabled: true, period: 4, duration: 30 },
      shortBreaks: [
        { startTime: "10:45:00", duration: 15 }
      ],
      classDuration: 50,
      academic_year: 2025
    };

    // First, check if the settings table structure is correct
    console.log('Checking settings table structure...');
    const [columns] = await pool.query('SHOW COLUMNS FROM settings');
    console.log('Settings table columns:');
    columns.forEach(col => {
      console.log(` - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });

    // Check if shortBreaks column exists
    const shortBreaksColumn = columns.find(col => col.Field === 'shortBreaks');
    if (!shortBreaksColumn) {
      console.log('❌ shortBreaks column is missing! Adding it...');
      await pool.query("ALTER TABLE settings ADD COLUMN shortBreaks JSON DEFAULT ('[]') AFTER lunchBreak");
      console.log('✅ shortBreaks column added successfully!');
    } else {
      console.log('✅ shortBreaks column exists.');
    }

    // Prepare the data for update
    const workingDaysString = JSON.stringify(sampleSettings.workingDays);
    const lunchBreakString = JSON.stringify(sampleSettings.lunchBreak);
    const shortBreaksString = JSON.stringify(sampleSettings.shortBreaks);

    // Check if settings record exists
    const [existingSettings] = await pool.query('SELECT * FROM settings WHERE id = 1');
    
    if (existingSettings.length === 0) {
      console.log('❌ No settings record found! Creating default...');
      await pool.query(
        'INSERT INTO settings (id, periodsPerDay, workingDays, startTime, endTime, lunchBreak, shortBreaks, classDuration, academic_year) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [1, sampleSettings.periodsPerDay, workingDaysString, sampleSettings.startTime, sampleSettings.endTime, lunchBreakString, shortBreaksString, sampleSettings.classDuration, sampleSettings.academic_year]
      );
      console.log('✅ Default settings created successfully!');
    } else {
      console.log('Settings record exists, updating...');
      
      // Log existing settings
      console.log('Current settings:');
      const settingsData = existingSettings[0];
      if (settingsData.workingDays && typeof settingsData.workingDays === 'string') {
        settingsData.workingDays = JSON.parse(settingsData.workingDays);
      }
      if (settingsData.lunchBreak && typeof settingsData.lunchBreak === 'string') {
        settingsData.lunchBreak = JSON.parse(settingsData.lunchBreak);
      }
      if (settingsData.shortBreaks && typeof settingsData.shortBreaks === 'string') {
        settingsData.shortBreaks = JSON.parse(settingsData.shortBreaks);
      }
      console.log(settingsData);
      
      // Update settings
      try {
        const [result] = await pool.query(
          'UPDATE settings SET periodsPerDay = ?, workingDays = ?, startTime = ?, endTime = ?, lunchBreak = ?, shortBreaks = ?, classDuration = ?, academic_year = ?, updated_at = NOW() WHERE id = 1',
          [sampleSettings.periodsPerDay, workingDaysString, sampleSettings.startTime, sampleSettings.endTime, lunchBreakString, shortBreaksString, sampleSettings.classDuration, sampleSettings.academic_year]
        );
        console.log('✅ Settings updated successfully!', result);
      } catch (updateError) {
        console.error('❌ Error updating settings:', updateError.message);
        
        // Try to diagnose the issue
        if (updateError.message.includes('Unknown column')) {
          console.log('The error indicates a missing column. Make sure all columns in the query match the database schema.');
        } else if (updateError.message.includes('Data too long')) {
          console.log('The error indicates that the data is too large for the column. Check your JSON data size.');
        }
      }
    }
    
    // Retrieve the updated settings
    const [updatedSettings] = await pool.query('SELECT * FROM settings WHERE id = 1');
    console.log('Updated settings from database:');
    console.log(updatedSettings[0]);

  } catch (error) {
    console.error('Error in test:', error);
  } finally {
    // Close the pool
    await pool.end();
    console.log('Test completed.');
  }
}

testUpdateSettings(); 