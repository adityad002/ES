const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all teacher routes
router.use(authMiddleware.protect);

/**
 * @route   GET /api/teachers
 * @desc    Get all teachers
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/teachers route called');
    const [teachers] = await pool.query('SELECT * FROM teachers ORDER BY name');
    
    console.log(`Found ${teachers.length} teachers`);

    // Make the response format consistent with other endpoints that use 'data'
    res.status(200).json({
      success: true,
      data: teachers,
      teachers: teachers // Keep this for backward compatibility
    });
  } catch (error) {
    console.error('Get all teachers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving teachers'
    });
  }
});

/**
 * @route   GET /api/teachers/:id
 * @desc    Get single teacher by ID
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const [teachers] = await pool.query('SELECT * FROM teachers WHERE id = ?', [req.params.id]);

    if (teachers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    res.status(200).json({
      success: true,
      data: teachers[0]
    });
  } catch (error) {
    console.error('Get teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving teacher'
    });
  }
});

/**
 * @route   POST /api/teachers
 * @desc    Create new teacher
 * @access  Private (Admin only)
 */
router.post('/', authMiddleware.authorize('admin'), async (req, res) => {
  try {
    const { name, email } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name and email'
      });
    }

    // Check if teacher with same email already exists
    const [existingTeachers] = await pool.query('SELECT * FROM teachers WHERE email = ?', [email]);

    if (existingTeachers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Teacher with this email already exists'
      });
    }

    // Insert the new teacher
    const [result] = await pool.query(
      'INSERT INTO teachers (name, email, created_at) VALUES (?, ?, NOW())',
      [name, email]
    );

    // Get the created teacher
    const [newTeacher] = await pool.query('SELECT * FROM teachers WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Teacher created successfully',
      data: newTeacher[0]
    });
  } catch (error) {
    console.error('Create teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating teacher'
    });
  }
});

/**
 * @route   PUT /api/teachers/:id
 * @desc    Update teacher
 * @access  Private (Admin only)
 */
router.put('/:id', authMiddleware.authorize('admin'), async (req, res) => {
  try {
    const { name, email } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name and email'
      });
    }

    // Check if teacher exists
    const [existingTeachers] = await pool.query('SELECT * FROM teachers WHERE id = ?', [req.params.id]);

    if (existingTeachers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Check if email is already used by another teacher
    const [emailCheckResult] = await pool.query(
      'SELECT * FROM teachers WHERE email = ? AND id != ?',
      [email, req.params.id]
    );

    if (emailCheckResult.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use by another teacher'
      });
    }

    // Update the teacher
    await pool.query(
      'UPDATE teachers SET name = ?, email = ?, updated_at = NOW() WHERE id = ?',
      [name, email, req.params.id]
    );

    // Get the updated teacher
    const [updatedTeacher] = await pool.query('SELECT * FROM teachers WHERE id = ?', [req.params.id]);

    res.status(200).json({
      success: true,
      message: 'Teacher updated successfully',
      data: updatedTeacher[0]
    });
  } catch (error) {
    console.error('Update teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating teacher'
    });
  }
});

/**
 * @route   DELETE /api/teachers/:id
 * @desc    Delete teacher
 * @access  Private (Admin only)
 */
router.delete('/:id', authMiddleware.authorize('admin'), async (req, res) => {
  try {
    // Begin transaction
    await pool.query('START TRANSACTION');

    // Check if teacher exists
    const [existingTeachers] = await pool.query('SELECT * FROM teachers WHERE id = ?', [req.params.id]);

    if (existingTeachers.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Check for dependencies (subject assignments)
    const [assignments] = await pool.query(
      'SELECT * FROM subject_assignments WHERE teacher_id = ?',
      [req.params.id]
    );

    if (assignments.length > 0) {
      await pool.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Cannot delete teacher with assigned subjects. Remove assignments first.'
      });
    }

    // Delete teacher availability
    await pool.query('DELETE FROM teacher_availability WHERE teacher_id = ?', [req.params.id]);

    // Delete the teacher
    await pool.query('DELETE FROM teachers WHERE id = ?', [req.params.id]);

    // Commit transaction
    await pool.query('COMMIT');

    res.status(200).json({
      success: true,
      message: 'Teacher deleted successfully'
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Delete teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting teacher'
    });
  }
});

/**
 * @route   GET /api/teachers/:id/availability
 * @desc    Get teacher availability
 * @access  Private
 */
router.get('/:id/availability', async (req, res) => {
  try {
    // Check if teacher exists
    const [teachers] = await pool.query('SELECT * FROM teachers WHERE id = ?', [req.params.id]);

    if (teachers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Get working days from settings
    const [settings] = await pool.query('SELECT workingDays FROM settings WHERE id = 1');

    let workingDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    if (settings.length > 0 && settings[0].workingDays) {
      workingDays = typeof settings[0].workingDays === 'string'
        ? JSON.parse(settings[0].workingDays)
        : settings[0].workingDays;
    }

    // Get periods settings
    const [periodsSettings] = await pool.query(
      'SELECT periodsPerDay FROM settings WHERE id = 1'
    );

    const periodsPerDay = periodsSettings.length > 0 ?
      periodsSettings[0].periodsPerDay : 8;

    // Get teacher availability
    const [availability] = await pool.query(
      'SELECT day, period FROM teacher_availability WHERE teacher_id = ?',
      [req.params.id]
    );

    // Format availability as a map
    const availabilityMap = {};

    // Initialize with all periods available
    workingDays.forEach(day => {
      availabilityMap[day] = Array(periodsPerDay).fill(true);
    });

    // Mark unavailable periods
    availability.forEach(slot => {
      if (availabilityMap[slot.day] && slot.period <= periodsPerDay) {
        availabilityMap[slot.day][slot.period - 1] = false;
      }
    });

    res.status(200).json({
      success: true,
      teacher_id: req.params.id,
      teacher_name: teachers[0].name,
      availability: availabilityMap
    });
  } catch (error) {
    console.error('Get teacher availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving teacher availability'
    });
  }
});

/**
 * @route   PUT /api/teachers/:id/availability
 * @desc    Update teacher availability
 * @access  Private (Admin only)
 */
router.put('/:id/availability', authMiddleware.authorize('admin'), async (req, res) => {
  try {
    const { availability } = req.body;

    if (!availability || typeof availability !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Please provide availability data'
      });
    }

    // Check if teacher exists
    const [teachers] = await pool.query('SELECT * FROM teachers WHERE id = ?', [req.params.id]);

    if (teachers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Begin transaction
    await pool.query('START TRANSACTION');

    // Clear existing availability
    await pool.query('DELETE FROM teacher_availability WHERE teacher_id = ?', [req.params.id]);

    // Insert unavailable slots
    const unavailableSlots = [];

    Object.entries(availability).forEach(([day, periods]) => {
      periods.forEach((isAvailable, periodIndex) => {
        // If not available, add to unavailable slots
        if (!isAvailable) {
          unavailableSlots.push([req.params.id, day, periodIndex + 1]);
        }
      });
    });

    if (unavailableSlots.length > 0) {
      // Prepare bulk insert
      const placeholders = unavailableSlots.map(() => '(?, ?, ?)').join(', ');
      const values = unavailableSlots.flat();

      await pool.query(
        `INSERT INTO teacher_availability (teacher_id, day, period) VALUES ${placeholders}`,
        values
      );
    }

    // Commit transaction
    await pool.query('COMMIT');

    res.status(200).json({
      success: true,
      message: 'Teacher availability updated successfully',
      teacher_id: req.params.id,
      availability
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Update teacher availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating teacher availability'
    });
  }
});

/**
 * @route   GET /api/teachers/search
 * @desc    Search teachers by name
 * @access  Private
 */
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;

    let sqlQuery = 'SELECT * FROM teachers WHERE 1=1';
    const params = [];

    if (query) {
      sqlQuery += ' AND name LIKE ?';
      params.push(`%${query}%`);
    }

    sqlQuery += ' ORDER BY name ASC';

    const [teachers] = await pool.query(sqlQuery, params);

    res.status(200).json({
      success: true,
      count: teachers.length,
      data: teachers
    });
  } catch (error) {
    console.error('Search teachers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching teachers'
    });
  }
});

/**
 * @route   GET /api/teachers/workload
 * @desc    Get teachers workload analysis
 * @access  Private (Admin only)
 */
router.get('/workload', authMiddleware.authorize('admin'), async (req, res) => {
  try {
    // Get working days from settings
    const [settingsResult] = await pool.query('SELECT workingDays FROM settings WHERE id = 1');

    let workingDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    if (settingsResult.length > 0 && settingsResult[0].workingDays) {
      workingDays = typeof settingsResult[0].workingDays === 'string'
        ? JSON.parse(settingsResult[0].workingDays)
        : settingsResult[0].workingDays;
    }

    // Get teacher workloads
    const [workloadResult] = await pool.query(`
      SELECT 
        t.id,
        t.name,
        COUNT(sa.id) as total_assignments,
        SUM(sa.hours_per_week) as total_teaching_hours
      FROM 
        teachers t
      LEFT JOIN 
        subject_assignments sa ON t.id = sa.teacher_id
      GROUP BY 
        t.id
      ORDER BY 
        t.name ASC
    `);

    // Get daily workload distribution
    const [dailyDistribution] = await pool.query(`
      SELECT 
        ts.day,
        COUNT(*) as total_periods,
        COUNT(DISTINCT ts.assignment_id) as unique_assignments
      FROM 
        timetable_slots ts
      GROUP BY 
        ts.day
      ORDER BY 
        FIELD(ts.day, ${workingDays.map(() => '?').join(', ')})
    `, workingDays);

    res.status(200).json({
      success: true,
      data: {
        teachers: workloadResult,
        dailyDistribution: dailyDistribution
      }
    });
  } catch (error) {
    console.error('Get teacher workload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving teacher workload'
    });
  }
});

/**
 * @route   POST /api/teachers/bulk
 * @desc    Import multiple teachers
 * @access  Private (Admin only)
 */
router.post('/bulk', authMiddleware.authorize('admin'), async (req, res) => {
  try {
    const { teachers } = req.body;

    if (!teachers || !Array.isArray(teachers) || teachers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of teachers'
      });
    }

    // Begin transaction
    await pool.query('START TRANSACTION');

    const results = {
      success: [],
      failures: []
    };

    // Process each teacher
    for (const teacher of teachers) {
      const { name, email } = teacher;

      // Validate required fields
      if (!name || !email) {
        results.failures.push({
          teacher,
          reason: 'Missing required fields (name, email)'
        });
        continue;
      }

      try {
        // Check if teacher with same email already exists
        const [existingTeachers] = await pool.query('SELECT * FROM teachers WHERE email = ?', [email]);

        if (existingTeachers.length > 0) {
          results.failures.push({
            teacher,
            reason: 'Email already exists'
          });
          continue;
        }

        // Insert the new teacher
        const [result] = await pool.query(
          'INSERT INTO teachers (name, email, created_at) VALUES (?, ?, NOW())',
          [name, email]
        );

        results.success.push({
          id: result.insertId,
          ...teacher
        });
      } catch (error) {
        results.failures.push({
          teacher,
          reason: `Database error: ${error.message}`
        });
      }
    }

    // Commit transaction
    await pool.query('COMMIT');

    res.status(201).json({
      success: true,
      message: `Imported ${results.success.length} teachers successfully, ${results.failures.length} failed`,
      results
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Bulk import teachers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while importing teachers'
    });
  }
});

/**
 * Helper function to fix teachers table schema
 * This can be called manually when needed
 */
async function fixTeachersTable() {
  try {
    console.log('Starting teachers table update...');

    // First, make all columns nullable to avoid constraint issues
    console.log('Making columns nullable...');
    await pool.query(`
      ALTER TABLE teachers 
      MODIFY department VARCHAR(100) NULL,
      MODIFY maxHoursPerDay INT NULL,
      MODIFY totalMaxHoursPerWeek INT NULL
    `);
    console.log('Columns made nullable successfully');

    // Now drop the columns we don't need
    console.log('Dropping unnecessary columns...');
    await pool.query(`
      ALTER TABLE teachers
      DROP COLUMN department,
      DROP COLUMN maxHoursPerDay,
      DROP COLUMN totalMaxHoursPerWeek
    `);
    console.log('Unnecessary columns dropped successfully');

    // Verify the table structure
    console.log('Verifying final table structure...');
    const [columns] = await pool.query(`SHOW COLUMNS FROM teachers`);
    console.log('Current table structure:');
    columns.forEach(col => {
      console.log(`${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    console.log('Teachers table update completed successfully!');
    return true;
  } catch (error) {
    console.error('Error fixing teachers table:', error);
    return false;
  }
}

// Add a route to run the fix function
router.post('/fix-schema', authMiddleware.authorize('admin'), async (req, res) => {
  try {
    const success = await fixTeachersTable();
    if (success) {
      res.status(200).json({
        success: true,
        message: 'Teachers table schema fixed successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to fix teachers table schema'
      });
    }
  } catch (error) {
    console.error('Fix schema error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fixing schema'
    });
  }
});

module.exports = router;
