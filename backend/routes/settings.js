const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all settings routes - require authentication
router.use(authMiddleware.protect);

/**
 * @route   GET /api/settings
 * @desc    Get all system settings
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const [settings] = await pool.query('SELECT * FROM settings WHERE id = 1');
    
    if (settings.length === 0) {
      // If no settings found, return default values
      return res.status(200).json({
        success: true,
        settings: {
          periodsPerDay: 8,
          workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          startTime: "09:00:00",
          endTime: "16:00:00",
          lunchBreak: { enabled: true, period: 4, duration: 30 },
          shortBreaks: [],
          classDuration: 50,
          academic_year: new Date().getFullYear()
        }
      });
    }
    
    // Parse JSON fields
    const settingsData = settings[0];
    if (settingsData.workingDays && typeof settingsData.workingDays === 'string') {
      settingsData.workingDays = JSON.parse(settingsData.workingDays);
    }
    
    if (settingsData.lunchBreak && typeof settingsData.lunchBreak === 'string') {
      settingsData.lunchBreak = JSON.parse(settingsData.lunchBreak);
    }
    
    if (settingsData.shortBreaks && typeof settingsData.shortBreaks === 'string') {
      settingsData.shortBreaks = JSON.parse(settingsData.shortBreaks);
    }
    
    res.status(200).json({
      success: true,
      settings: settingsData
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving settings'
    });
  }
});

/**
 * @route   PUT /api/settings
 * @desc    Update system settings
 * @access  Private (Admin only)
 */
router.put('/', authMiddleware.authorize('admin'), async (req, res) => {
  try {
    // Log the full request body for debugging
    console.log('Settings update - Request body:', req.body);
    
    const {
      periodsPerDay,
      workingDays,
      startTime,
      endTime,
      lunchBreak,
      shortBreaks,
      classDuration,
      academic_year
    } = req.body;
    
    // Log the extracted values for debugging
    console.log('Settings update - Extracted values:', {
      periodsPerDay,
      workingDays: Array.isArray(workingDays) ? workingDays : 'Not an array',
      startTime,
      endTime,
      lunchBreak: typeof lunchBreak === 'object' ? 'Valid object' : lunchBreak,
      shortBreaks: Array.isArray(shortBreaks) ? `Array with ${shortBreaks.length} items` : shortBreaks,
      classDuration,
      academic_year
    });
    
    // Validate required fields
    if (!periodsPerDay || !workingDays || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required settings'
      });
    }
    
    // Prepare data for storage - stringify JSON values
    const workingDaysString = JSON.stringify(workingDays);
    const lunchBreakString = lunchBreak ? JSON.stringify(lunchBreak) : null;
    const shortBreaksString = shortBreaks ? JSON.stringify(shortBreaks) : '[]';
    
    // Check if settings exist
    let existingSettings;
    try {
      [existingSettings] = await pool.query('SELECT * FROM settings WHERE id = 1');
    } catch (dbError) {
      console.error('Database error when checking settings:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Database error when checking settings',
        error: dbError.message
      });
    }
    
    let result;
    let queryParams;
    
    try {
      if (existingSettings.length === 0) {
        // Insert new settings
        queryParams = [1, periodsPerDay, workingDaysString, startTime, endTime, lunchBreakString, shortBreaksString, classDuration, academic_year];
        console.log('Settings update - Insert query params:', queryParams);
        
        [result] = await pool.query(
          'INSERT INTO settings (id, periodsPerDay, workingDays, startTime, endTime, lunchBreak, shortBreaks, classDuration, academic_year, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
          queryParams
        );
      } else {
        // Update existing settings
        queryParams = [periodsPerDay, workingDaysString, startTime, endTime, lunchBreakString, shortBreaksString, classDuration, academic_year];
        console.log('Settings update - Update query params:', queryParams);
        
        // First check if the shortBreaks column exists
        try {
          const [columns] = await pool.query('SHOW COLUMNS FROM settings LIKE "shortBreaks"');
          if (columns.length === 0) {
            console.log('Adding missing shortBreaks column...');
            await pool.query("ALTER TABLE settings ADD COLUMN shortBreaks JSON DEFAULT ('[]') AFTER lunchBreak");
            console.log('shortBreaks column added successfully!');
          }
        } catch (columnError) {
          console.error('Error checking or adding shortBreaks column:', columnError);
        }
        
        // Now perform the update
        [result] = await pool.query(
          'UPDATE settings SET periodsPerDay = ?, workingDays = ?, startTime = ?, endTime = ?, lunchBreak = ?, shortBreaks = ?, classDuration = ?, academic_year = ?, updated_at = NOW() WHERE id = 1',
          queryParams
        );
      }
    } catch (queryError) {
      console.error('Database error when updating settings:', queryError);
      return res.status(500).json({
        success: false,
        message: 'Database error when updating settings',
        error: queryError.message
      });
    }
    
    // Log the query result for debugging
    console.log('Settings update - Query result:', result);
    
    // Return updated settings
    const updatedSettings = {
      periodsPerDay,
      workingDays,
      startTime,
      endTime,
      lunchBreak,
      shortBreaks,
      classDuration,
      academic_year
    };
    
    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      settings: updatedSettings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating settings',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/settings/working-days
 * @desc    Get only working days settings
 * @access  Private
 */
router.get('/working-days', async (req, res) => {
  try {
    const [settings] = await pool.query('SELECT workingDays FROM settings WHERE id = 1');
    
    let workingDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    
    if (settings.length > 0 && settings[0].workingDays) {
      workingDays = typeof settings[0].workingDays === 'string' 
        ? JSON.parse(settings[0].workingDays) 
        : settings[0].workingDays;
    }
    
    res.status(200).json({
      success: true,
      workingDays
    });
  } catch (error) {
    console.error('Get working days error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving working days'
    });
  }
});

/**
 * @route   PUT /api/settings/working-days
 * @desc    Update only working days settings
 * @access  Private (Admin only)
 */
router.put('/working-days', authMiddleware.authorize('admin'), async (req, res) => {
  try {
    const { workingDays } = req.body;
    
    if (!workingDays || !Array.isArray(workingDays)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid working days array'
      });
    }
    
    const workingDaysString = JSON.stringify(workingDays);
    
    // Check if settings exist and update or create as needed
    const [existingSettings] = await pool.query('SELECT * FROM settings WHERE id = 1');
    
    if (existingSettings.length === 0) {
      await pool.query(
        'INSERT INTO settings (id, workingDays, updated_at) VALUES (?, ?, NOW())',
        [1, workingDaysString]
      );
    } else {
      await pool.query(
        'UPDATE settings SET workingDays = ?, updated_at = NOW() WHERE id = 1',
        [workingDaysString]
      );
    }
    
    res.status(200).json({
      success: true,
      message: 'Working days updated successfully',
      workingDays
    });
  } catch (error) {
    console.error('Update working days error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating working days'
    });
  }
});

/**
 * @route   GET /api/settings/periods
 * @desc    Get periods settings (periodsPerDay, startTime, endTime, lunchBreak, shortBreaks, classDuration)
 * @access  Private
 */
router.get('/periods', async (req, res) => {
  try {
    const [settings] = await pool.query(
      'SELECT periodsPerDay, startTime, endTime, lunchBreak, shortBreaks, classDuration FROM settings WHERE id = 1'
    );
    
    let periodsSettings = {
      periodsPerDay: 8,
      startTime: "09:00:00",
      endTime: "16:00:00",
      lunchBreak: { enabled: true, period: 4, duration: 30 },
      shortBreaks: [],
      classDuration: 50
    };
    
    if (settings.length > 0) {
      const settingsData = settings[0];
      
      // Parse JSON fields if they exist
      if (settingsData.lunchBreak && typeof settingsData.lunchBreak === 'string') {
        settingsData.lunchBreak = JSON.parse(settingsData.lunchBreak);
      }
      
      if (settingsData.shortBreaks && typeof settingsData.shortBreaks === 'string') {
        settingsData.shortBreaks = JSON.parse(settingsData.shortBreaks);
      }
      
      periodsSettings = {
        periodsPerDay: settingsData.periodsPerDay || periodsSettings.periodsPerDay,
        startTime: settingsData.startTime || periodsSettings.startTime,
        endTime: settingsData.endTime || periodsSettings.endTime,
        lunchBreak: settingsData.lunchBreak || periodsSettings.lunchBreak,
        shortBreaks: settingsData.shortBreaks || periodsSettings.shortBreaks,
        classDuration: settingsData.classDuration || periodsSettings.classDuration
      };
    }
    
    res.status(200).json({
      success: true,
      ...periodsSettings
    });
  } catch (error) {
    console.error('Get periods settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving periods settings'
    });
  }
});

/**
 * @route   PUT /api/settings/reset
 * @desc    Reset all settings to default values
 * @access  Private (Admin only)
 */
router.put('/reset', authMiddleware.authorize('admin'), async (req, res) => {
  try {
    const defaultSettings = {
      periodsPerDay: 8,
      workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      startTime: "09:00:00",
      endTime: "16:00:00",
      lunchBreak: { enabled: true, period: 4, duration: 30 },
      shortBreaks: [],
      classDuration: 50,
      academic_year: new Date().getFullYear()
    };
    
    // Prepare data for storage
    const workingDaysString = JSON.stringify(defaultSettings.workingDays);
    const lunchBreakString = JSON.stringify(defaultSettings.lunchBreak);
    const shortBreaksString = JSON.stringify(defaultSettings.shortBreaks);
    
    // Update or insert default settings
    const [existingSettings] = await pool.query('SELECT * FROM settings WHERE id = 1');
    
    if (existingSettings.length === 0) {
      await pool.query(
        'INSERT INTO settings (id, periodsPerDay, workingDays, startTime, endTime, lunchBreak, shortBreaks, classDuration, academic_year, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
        [1, defaultSettings.periodsPerDay, workingDaysString, defaultSettings.startTime, defaultSettings.endTime, lunchBreakString, shortBreaksString, defaultSettings.classDuration, defaultSettings.academic_year]
      );
    } else {
      await pool.query(
        'UPDATE settings SET periodsPerDay = ?, workingDays = ?, startTime = ?, endTime = ?, lunchBreak = ?, shortBreaks = ?, classDuration = ?, academic_year = ?, updated_at = NOW() WHERE id = 1',
        [defaultSettings.periodsPerDay, workingDaysString, defaultSettings.startTime, defaultSettings.endTime, lunchBreakString, shortBreaksString, defaultSettings.classDuration, defaultSettings.academic_year]
      );
    }
    
    res.status(200).json({
      success: true,
      message: 'Settings reset to default values',
      settings: defaultSettings
    });
  } catch (error) {
    console.error('Reset settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while resetting settings'
    });
  }
});

module.exports = router;
