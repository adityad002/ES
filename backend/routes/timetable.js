const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all timetable routes
router.use(authMiddleware.protect);

/**
 * @route   GET /api/timetable
 * @desc    Get all timetable data
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const [timetableData] = await pool.query(`
      SELECT ts.*, sa.subject_id, sa.teacher_id, sa.class_name, 
             s.name as subject_name, s.code as subject_code, s.is_lab, 
             s.semester, t.name as teacher_name,
             sa.id as assignment_id
      FROM timetable_slots ts
      JOIN subject_assignments sa ON ts.assignment_id = sa.id
      JOIN subjects s ON sa.subject_id = s.id
      JOIN teachers t ON sa.teacher_id = t.id
      ORDER BY ts.day, ts.period
    `);

    // Group by day and period
    const timetable = {};

    timetableData.forEach(slot => {
      if (!timetable[slot.day]) {
        timetable[slot.day] = {};
      }

      if (!timetable[slot.day][slot.period]) {
        timetable[slot.day][slot.period] = [];
      }

      timetable[slot.day][slot.period].push({
        id: slot.id,
        subject: {
          id: slot.subject_id,
          name: slot.subject_name,
          code: slot.subject_code,
          is_lab: !!slot.is_lab
        },
        teacher: {
          id: slot.teacher_id,
          name: slot.teacher_name
        },
        class_name: slot.class_name,
        assignment_id: slot.assignment_id
      });
    });

    res.status(200).json({
      success: true,
      data: timetable
    });
  } catch (error) {
    console.error('Get timetable error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving timetable'
    });
  }
});

/**
 * @route   GET /api/timetable/semester/:semester
 * @desc    Get timetable data for a specific semester
 * @access  Private
 */
router.get('/semester/:semester', async (req, res) => {
  try {
    const semester = req.params.semester;

    const [timetableData] = await pool.query(`
      SELECT ts.*, sa.subject_id, sa.teacher_id, sa.class_name, 
             s.name as subject_name, s.code as subject_code, s.is_lab, 
             s.semester, t.name as teacher_name,
             sa.id as assignment_id
      FROM timetable_slots ts
      JOIN subject_assignments sa ON ts.assignment_id = sa.id
      JOIN subjects s ON sa.subject_id = s.id
      JOIN teachers t ON sa.teacher_id = t.id
      WHERE s.semester = ?
      ORDER BY ts.day, ts.period
    `, [semester]);

    // Group by class, day and period
    const timetables = {};

    // Process the data and group it
    timetableData.forEach(slot => {
      const className = slot.class_name;

      if (!timetables[className]) {
        timetables[className] = {};
      }

      if (!timetables[className][slot.day]) {
        timetables[className][slot.day] = {};
      }

      timetables[className][slot.day][slot.period] = {
        id: slot.id,
        subject: {
          id: slot.subject_id,
          name: slot.subject_name,
          code: slot.subject_code,
          is_lab: !!slot.is_lab // Ensure boolean
        },
        teacher: {
          id: slot.teacher_id,
          name: slot.teacher_name
        },
        assignment_id: slot.assignment_id
      };
    });

    res.status(200).json({
      success: true,
      data: timetables
    });
  } catch (error) {
    console.error('Get semester timetable error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving semester timetable'
    });
  }
});

/**
 * @route   GET /api/timetable/teacher/:teacherId
 * @desc    Get timetable data for a specific teacher
 * @access  Private
 */
router.get('/teacher/:teacherId', async (req, res) => {
  try {
    const teacherId = req.params.teacherId;

    const [timetableData] = await pool.query(`
      SELECT ts.*, sa.subject_id, sa.teacher_id, sa.class_name, s.name as subject_name, 
      s.code as subject_code, s.is_lab, t.name as teacher_name
      FROM timetable_slots ts
      JOIN subject_assignments sa ON ts.assignment_id = sa.id
      JOIN subjects s ON sa.subject_id = s.id
      JOIN teachers t ON sa.teacher_id = t.id
      WHERE sa.teacher_id = ?
      ORDER BY ts.day, ts.period
    `, [teacherId]);

    // Group by day and period
    const timetable = {};

    timetableData.forEach(slot => {
      if (!timetable[slot.day]) {
        timetable[slot.day] = {};
      }

      timetable[slot.day][slot.period] = {
        id: slot.id,
        subject: {
          id: slot.subject_id,
          name: slot.subject_name,
          code: slot.subject_code,
          is_lab: slot.is_lab
        },
        class_name: slot.class_name
      };
    });

    res.status(200).json({
      success: true,
      data: timetable
    });
  } catch (error) {
    console.error('Get teacher timetable error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving teacher timetable'
    });
  }
});

/**
 * @route   POST /api/timetable/generate
 * @desc    Generate timetable based on semester data
 * @access  Private (Admin only)
 */
router.post('/generate', authMiddleware.authorize('admin'), async (req, res) => {
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    console.log('Starting timetable generation process...');

    // Step 1: Load settings from database
    const [settingsResult] = await connection.query('SELECT * FROM settings WHERE id = 1');
    if (settingsResult.length === 0) {
      throw new Error('Settings not found');
    }

    const settings = settingsResult[0];

    // Parse workingDays with better error handling
    let workingDays;
    try {
      if (typeof settings.workingDays === 'string') {
        try {
          // Try parsing as JSON
          workingDays = JSON.parse(settings.workingDays);
        } catch (e) {
          // If not JSON, try as comma-separated string
          workingDays = settings.workingDays.split(',');
        }
      } else if (Array.isArray(settings.workingDays)) {
        // Already an array
        workingDays = settings.workingDays;
      } else {
        // Default to standard weekdays
        console.log('Could not determine working days format, using default weekdays');
        workingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      }
    } catch (e) {
      console.log('Error parsing working days, using default weekdays');
      workingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    }

    const periodsPerDay = settings.periodsPerDay;

    // Step 2: Load subjects with teacher assignments
    const [subjects] = await connection.query(`
      SELECT s.*, t.name as teacher_name, t.email as teacher_email 
      FROM subjects s
      LEFT JOIN teachers t ON s.teacher_id = t.id
      ORDER BY s.semester, s.is_lab DESC, s.hours_per_week DESC
    `);

    // Step 3: Group subjects by semester
    const subjectsBySemester = {};
    const subjectsByTeacher = {};

    subjects.forEach(subject => {
      // Group by semester
      if (!subjectsBySemester[subject.semester]) {
        subjectsBySemester[subject.semester] = [];
      }
      subjectsBySemester[subject.semester].push(subject);

      // Group by teacher for conflict detection
      if (subject.teacher_id) {
        if (!subjectsByTeacher[subject.teacher_id]) {
          subjectsByTeacher[subject.teacher_id] = [];
        }
        subjectsByTeacher[subject.teacher_id].push(subject);
      }
    });

    // Clear existing timetable data
    await connection.query('DELETE FROM timetable_slots');
    console.log('Cleared existing timetable data');

    // Load all teachers
    const [teachers] = await connection.query('SELECT * FROM teachers');
    console.log(`Loaded ${teachers.length} teachers`);

    // Initialize global teacher availability to track across all sections and semesters
    const globalTeacherAvailability = initializeTeacherAvailability(teachers, workingDays, periodsPerDay);
    console.log('Initialized global teacher availability tracking');

    // Process each semester
    for (const semester of Object.keys(subjectsBySemester)) {
      const semesterSubjects = subjectsBySemester[semester];

      console.log(`Processing semester ${semester} with ${semesterSubjects.length} subjects`);

      // Generate for each section
      for (const section of ['A', 'B']) {
        console.log(`Generating timetable for section ${semester}${section}`);

        await generateTimetableForSection(
          connection,
          semester,
          section,
          semesterSubjects,
          teachers,
          settings,
          workingDays,
          periodsPerDay,
          globalTeacherAvailability // Pass global teacher availability
        );
      }
    }

    await connection.commit();
    console.log('Timetable generation completed successfully');

    res.status(200).json({
      success: true,
      message: 'Timetables generated successfully'
    });
  } catch (error) {
    console.error('Timetable generation error:', error);
    if (connection) {
      try {
        await connection.rollback();
        console.log('Transaction rolled back due to error');
      } catch (rollbackError) {
        console.error('Error during rollback:', rollbackError);
      }
    }

    res.status(500).json({
      success: false,
      message: `Error generating timetable: ${error.message}`,
      error: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  } finally {
    if (connection) {
      try {
        connection.release();
      } catch (releaseError) {
        console.error('Error releasing connection:', releaseError);
      }
    }
  }
});

/**
 * @route   DELETE /api/timetable/all
 * @desc    Clear all timetable data
 * @access  Private (Admin only)
 */
router.delete('/all', authMiddleware.authorize('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM timetable_slots');

    res.status(200).json({
      success: true,
      message: 'All timetable data cleared successfully'
    });
  } catch (error) {
    console.error('Clear timetable error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while clearing timetable data'
    });
  }
});

/**
 * Generate timetable for a specific semester and section
 */
async function generateTimetableForSection(
  connection, semester, section, subjects, teachers, settings,
  workingDays, periodsPerDay, teacherAvailability
) {
  try {
    // Initialize empty timetable
    const timetable = initializeEmptyTimetable(workingDays, periodsPerDay);

    // Add breaks to timetable
    addBreaksToTimetable(timetable, settings, workingDays);

    // Schedule lab subjects first (they need 2 consecutive periods)
    const labSubjects = subjects.filter(subject => subject.is_lab);

    console.log(`Scheduling ${labSubjects.length} lab subjects for ${semester}${section}`);

    for (const labSubject of labSubjects) {
      await scheduleLabSubject(
        connection, timetable, labSubject, teacherAvailability, workingDays, semester, section
      );
    }

    // Then schedule regular subjects
    const regularSubjects = subjects.filter(subject => !subject.is_lab);

    console.log(`Scheduling ${regularSubjects.length} regular subjects for ${semester}${section}`);

    for (const regularSubject of regularSubjects) {
      await scheduleRegularSubject(
        connection, timetable, regularSubject, teacherAvailability,
        workingDays, periodsPerDay, semester, section
      );
    }

    return true;
  } catch (error) {
    console.error(`Error generating timetable for ${semester}${section}:`, error);
    throw error;
  }
}

/**
 * Initialize empty timetable structure
 */
function initializeEmptyTimetable(workingDays, periodsPerDay) {
  const timetable = {};

  workingDays.forEach(day => {
    timetable[day] = Array(periodsPerDay).fill(null);
  });

  return timetable;
}

/**
 * Add breaks to timetable based on settings
 */
function addBreaksToTimetable(timetable, settings, workingDays) {
  // Add lunch break
  if (settings.lunchBreak) {
    try {
      const lunchBreak = typeof settings.lunchBreak === 'string' ?
        JSON.parse(settings.lunchBreak) : settings.lunchBreak;

      if (lunchBreak.enabled) {
        // Use the period directly from settings without subtracting 1
        // This ensures the lunch break appears in the period specified in settings
        const period = lunchBreak.period; // Already storing 1-indexed period in the database

        workingDays.forEach(day => {
          timetable[day][period] = { type: 'break', name: 'Lunch Break' };
        });
      }
    } catch (e) {
      console.log('Could not parse lunch break settings, skipping');
    }
  }

  // Add short breaks
  if (settings.shortBreaks) {
    try {
      const shortBreaks = typeof settings.shortBreaks === 'string' ?
        JSON.parse(settings.shortBreaks) : settings.shortBreaks;

      if (Array.isArray(shortBreaks)) {
        shortBreaks.forEach(breakObj => {
          if (breakObj.enabled) {
            const period = breakObj.period; // Already storing 1-indexed period in the database

            workingDays.forEach(day => {
              timetable[day][period] = { type: 'break', name: 'Break' };
            });
          }
        });
      }
    } catch (e) {
      console.log('Could not parse short breaks settings, skipping');
    }
  }
}

/**
 * Initialize teacher availability tracking
 */
function initializeTeacherAvailability(teachers, workingDays, periodsPerDay) {
  const teacherAvailability = {};

  teachers.forEach(teacher => {
    teacherAvailability[teacher.id] = {};

    workingDays.forEach(day => {
      teacherAvailability[teacher.id][day] = Array(periodsPerDay).fill(true);
    });
  });

  return teacherAvailability;
}

/**
 * Schedule a lab subject (needs consecutive periods)
 */
async function scheduleLabSubject(connection, timetable, subject, teacherAvailability, workingDays, semester, section) {
  const hoursPerWeek = subject.hours_per_week || 2; // Default to 2 for labs
  let scheduledHours = 0;

  try {
    if (!subject.teacher_id) {
      console.log(`Lab subject ${subject.name} (ID: ${subject.id}) has no assigned teacher. Skipping.`);
      return;
    }

    console.log(`Scheduling lab subject: ${subject.name} (ID: ${subject.id}, hours: ${hoursPerWeek})`);

    // Lab sessions are typically scheduled as double periods
    const sessionsNeeded = Math.ceil(hoursPerWeek / 2);
    console.log(`Sessions needed for lab: ${sessionsNeeded}`);

    for (let session = 0; session < sessionsNeeded; session++) {
      // Try to find a suitable slot for a double period
      let scheduled = false;

      // First try to schedule at the last periods of the day
      // Randomize days to avoid bunching all labs on the same day
      const shuffledDays = [...workingDays].sort(() => 0.5 - Math.random());

      // Check at the last periods of each day first
      for (const day of shuffledDays) {
        if (scheduled) break;

        // Get the last two periods of the day
        const lastPeriod = timetable[day].length - 1;
        const secondLastPeriod = lastPeriod - 1;

        // Check if both last periods are free
        if (secondLastPeriod >= 0 && // Make sure we have at least 2 periods
          timetable[day][secondLastPeriod] === null &&
          timetable[day][lastPeriod] === null) {

          // Check teacher availability for both periods
          if (teacherAvailability[subject.teacher_id][day][secondLastPeriod] &&
            teacherAvailability[subject.teacher_id][day][lastPeriod]) {

            console.log(`Found last-period slot for lab: ${day}, periods ${secondLastPeriod + 1} and ${lastPeriod + 1}`);

            // Schedule the lab for double period
            const subjectData = {
              ...subject,
              is_double_period: true,
              period_count: 2
            };

            // Mark slots in timetable
            timetable[day][secondLastPeriod] = subjectData;
            timetable[day][lastPeriod] = subjectData;

            // Mark teacher as unavailable
            teacherAvailability[subject.teacher_id][day][secondLastPeriod] = false;
            teacherAvailability[subject.teacher_id][day][lastPeriod] = false;

            // Create assignment in DB if it doesn't exist
            try {
              const [assignmentCheck] = await connection.query(
                'SELECT id FROM subject_assignments WHERE subject_id = ? AND teacher_id = ? AND class_name = ?',
                [subject.id, subject.teacher_id, `${semester}${section}`]
              );

              let assignmentId;

              if (assignmentCheck.length > 0) {
                assignmentId = assignmentCheck[0].id;
                console.log(`Found existing assignment ID: ${assignmentId}`);
              } else {
                console.log(`Creating new assignment for subject ${subject.id}, teacher ${subject.teacher_id}, class ${semester}${section}`);
                const [assignmentResult] = await connection.query(
                  'INSERT INTO subject_assignments (subject_id, teacher_id, class_name, hours_per_week) VALUES (?, ?, ?, ?)',
                  [subject.id, subject.teacher_id, `${semester}${section}`, hoursPerWeek]
                );
                assignmentId = assignmentResult.insertId;
                console.log(`Created new assignment with ID: ${assignmentId}`);
              }

              // Save to timetable_slots table
              console.log(`Inserting timetable slots for day ${day}, periods ${secondLastPeriod} and ${lastPeriod}`);
              await connection.query(
                'INSERT INTO timetable_slots (assignment_id, day, period) VALUES (?, ?, ?), (?, ?, ?)',
                [assignmentId, day, secondLastPeriod, assignmentId, day, lastPeriod]
              );

              scheduled = true;
              scheduledHours += 2;
            } catch (dbError) {
              console.error(`Database error while scheduling lab subject ${subject.name}:`, dbError);
              throw dbError; // Re-throw to be caught by the outer try-catch
            }

            if (scheduledHours >= hoursPerWeek) {
              break;
            }
          }
        }
      }

      // If lab couldn't be scheduled at the last periods, try any available consecutive periods
      if (!scheduled) {
        for (const day of shuffledDays) {
          if (scheduled) break;

          for (let period = 0; period < timetable[day].length - 1; period++) {
            // We need two consecutive free periods
            if (timetable[day][period] !== null || timetable[day][period + 1] !== null) {
              continue;
            }

            // Check teacher availability for both periods
            if (!teacherAvailability[subject.teacher_id][day][period] ||
              !teacherAvailability[subject.teacher_id][day][period + 1]) {
              continue;
            }

            // Schedule the lab for double period
            const subjectData = {
              ...subject,
              is_double_period: true,
              period_count: 2
            };

            // Mark slots in timetable
            timetable[day][period] = subjectData;
            timetable[day][period + 1] = subjectData;

            // Mark teacher as unavailable
            teacherAvailability[subject.teacher_id][day][period] = false;
            teacherAvailability[subject.teacher_id][day][period + 1] = false;

            // Create assignment in DB if it doesn't exist
            try {
              const [assignmentCheck] = await connection.query(
                'SELECT id FROM subject_assignments WHERE subject_id = ? AND teacher_id = ? AND class_name = ?',
                [subject.id, subject.teacher_id, `${semester}${section}`]
              );

              let assignmentId;

              if (assignmentCheck.length > 0) {
                assignmentId = assignmentCheck[0].id;
                console.log(`Found existing assignment ID: ${assignmentId}`);
              } else {
                console.log(`Creating new assignment for subject ${subject.id}, teacher ${subject.teacher_id}, class ${semester}${section}`);
                const [assignmentResult] = await connection.query(
                  'INSERT INTO subject_assignments (subject_id, teacher_id, class_name, hours_per_week) VALUES (?, ?, ?, ?)',
                  [subject.id, subject.teacher_id, `${semester}${section}`, hoursPerWeek]
                );
                assignmentId = assignmentResult.insertId;
                console.log(`Created new assignment with ID: ${assignmentId}`);
              }

              // Save to timetable_slots table
              console.log(`Inserting timetable slots for day ${day}, periods ${period} and ${period + 1}`);
              await connection.query(
                'INSERT INTO timetable_slots (assignment_id, day, period) VALUES (?, ?, ?), (?, ?, ?)',
                [assignmentId, day, period, assignmentId, day, period + 1]
              );

              scheduled = true;
              scheduledHours += 2;
            } catch (dbError) {
              console.error(`Database error while scheduling lab subject ${subject.name}:`, dbError);
              throw dbError; // Re-throw to be caught by the outer try-catch
            }

            if (scheduledHours >= hoursPerWeek) {
              break;
            }
          }
        }
      }

      if (!scheduled) {
        console.warn(`Could not schedule all sessions for lab subject ${subject.name}. Conflicts detected.`);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error(`Error scheduling lab subject ${subject.name}:`, error);
    return false;
  }
}

/**
 * Schedule a regular subject
 */
async function scheduleRegularSubject(connection, timetable, subject, teacherAvailability, workingDays, periodsPerDay, semester, section) {
  try {
    const hoursPerWeek = subject.hours_per_week || 4; // Default to 4 for regular subjects
    let scheduledHours = 0;

    if (!subject.teacher_id) {
      console.log(`Subject ${subject.name} has no assigned teacher. Skipping.`);
      return false;
    }

    // Create assignment in DB if it doesn't exist
    const [assignmentCheck] = await connection.query(
      'SELECT id FROM subject_assignments WHERE subject_id = ? AND teacher_id = ? AND class_name = ?',
      [subject.id, subject.teacher_id, `${semester}${section}`]
    );

    let assignmentId;

    if (assignmentCheck.length > 0) {
      assignmentId = assignmentCheck[0].id;
    } else {
      const [assignmentResult] = await connection.query(
        'INSERT INTO subject_assignments (subject_id, teacher_id, class_name, hours_per_week) VALUES (?, ?, ?, ?)',
        [subject.id, subject.teacher_id, `${semester}${section}`, hoursPerWeek]
      );
      assignmentId = assignmentResult.insertId;
    }

    while (scheduledHours < hoursPerWeek) {
      let scheduled = false;

      // Distribute classes evenly across the week by shuffling days
      const shuffledDays = [...workingDays].sort(() => 0.5 - Math.random());

      for (const day of shuffledDays) {
        if (scheduled) break;

        // For regular subjects, prefer to spread them out across different days
        // Count how many periods are already scheduled for this subject on this day
        let periodsOnThisDay = 0;
        for (let p = 0; p < timetable[day].length; p++) {
          if (timetable[day][p] && timetable[day][p].id === subject.id) {
            periodsOnThisDay++;
          }
        }

        // If we already have this subject on this day, try another day first
        if (periodsOnThisDay > 0 && scheduledHours < hoursPerWeek - 1) {
          continue;
        }

        for (let period = 0; period < periodsPerDay; period++) {
          if (timetable[day][period] !== null) {
            continue;
          }

          if (!teacherAvailability[subject.teacher_id][day][period]) {
            continue;
          }

          // Schedule the subject
          timetable[day][period] = subject;

          // Mark teacher as unavailable
          teacherAvailability[subject.teacher_id][day][period] = false;

          // Save to timetable_slots table
          await connection.query(
            'INSERT INTO timetable_slots (assignment_id, day, period) VALUES (?, ?, ?)',
            [assignmentId, day, period]
          );

          scheduled = true;
          scheduledHours++;
          break;
        }
      }

      if (!scheduled) {
        console.warn(`Could not schedule all periods for subject ${subject.name}. Conflicts detected.`);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error(`Error scheduling regular subject ${subject.name}:`, error);
    return false;
  }
}

/**
 * @route   GET /api/timetable/stats
 * @desc    Get timetable statistics for dashboard
 * @access  Private
 */
router.get('/stats', async (req, res) => {
  try {
    // Count total classes scheduled
    const [totalResult] = await pool.query(`
      SELECT COUNT(*) as total FROM timetable_slots
    `);

    // Count classes per day
    const [dayStatsResult] = await pool.query(`
      SELECT day, COUNT(*) as count FROM timetable_slots
      GROUP BY day
      ORDER BY FIELD(day, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')
    `);

    // Get stats by subject type
    const [subjectTypeResult] = await pool.query(`
      SELECT s.is_lab, COUNT(*) as count 
      FROM timetable_slots ts
      JOIN subject_assignments sa ON ts.assignment_id = sa.id
      JOIN subjects s ON sa.subject_id = s.id
      GROUP BY s.is_lab
    `);

    // Transform the data for easier consumption on frontend
    const dayStats = {};
    const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    // Initialize with zeros
    daysOrder.forEach(day => {
      dayStats[day] = 0;
    });

    // Fill in actual values
    dayStatsResult.forEach(stat => {
      dayStats[stat.day] = parseInt(stat.count);
    });

    // Format subject type stats
    const subjectTypeStats = {
      regular: 0,
      lab: 0
    };

    subjectTypeResult.forEach(stat => {
      if (stat.is_lab === 1) {
        subjectTypeStats.lab = parseInt(stat.count);
      } else {
        subjectTypeStats.regular = parseInt(stat.count);
      }
    });

    res.status(200).json({
      success: true,
      data: {
        totalClasses: parseInt(totalResult[0].total),
        byDay: dayStats,
        byType: subjectTypeStats
      }
    });
  } catch (error) {
    console.error('Get timetable stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving timetable statistics'
    });
  }
});

// Export the router
module.exports = router;