const { pool } = require('./db');

async function generateTimetable() {
  let connection;
  try {
    console.log('🔄 Starting timetable generation process...');
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Step 1: Load settings
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
        console.log('  ⚠️ Could not determine working days format, using default weekdays');
        workingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      }
    } catch (e) {
      console.log('  ⚠️ Error parsing working days, using default weekdays');
      workingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    }

    const periodsPerDay = settings.periodsPerDay;
    console.log(`✅ Loaded settings: ${workingDays.length} working days, ${periodsPerDay} periods per day`);
    console.log(`  Working days: ${workingDays.join(', ')}`);

    // Step 2: Load teachers
    const [teachers] = await connection.query('SELECT * FROM teachers');
    console.log(`✅ Loaded ${teachers.length} teachers`);

    // Step 3: Load subjects with teacher assignments
    const [subjects] = await connection.query(`
      SELECT s.*, t.name as teacher_name, t.email as teacher_email 
      FROM subjects s
      LEFT JOIN teachers t ON s.teacher_id = t.id
      ORDER BY s.semester, s.is_lab DESC, s.hours_per_week DESC
    `);
    console.log(`✅ Loaded ${subjects.length} subjects`);

    // Step 4: Group subjects by semester
    const subjectsBySemester = {};
    subjects.forEach(subject => {
      if (!subjectsBySemester[subject.semester]) {
        subjectsBySemester[subject.semester] = [];
      }
      subjectsBySemester[subject.semester].push(subject);
    });

    const semesters = Object.keys(subjectsBySemester);
    console.log(`✅ Found ${semesters.length} semesters: ${semesters.join(', ')}`);

    // Step 5: Clear existing timetable
    await connection.query('DELETE FROM timetable_slots');
    console.log('✅ Cleared existing timetable data');

    // Initialize teacher availability globally
    const globalTeacherAvailability = initializeTeacherAvailability(teachers, workingDays, periodsPerDay);
    console.log('✅ Initialized global teacher availability tracking');

    // Step 6: Generate for each semester
    for (const semester of semesters) {
      console.log(`\n🔄 Generating timetable for semester ${semester}...`);

      const semesterSubjects = subjectsBySemester[semester];
      console.log(`- Found ${semesterSubjects.length} subjects for semester ${semester}`);

      // Get lab subjects for this semester
      const labSubjects = semesterSubjects.filter(subject => subject.is_lab);
      console.log(`- Found ${labSubjects.length} lab subjects for semester ${semester}`);

      // Get regular subjects for this semester
      const regularSubjects = semesterSubjects.filter(subject => !subject.is_lab);
      console.log(`- Found ${regularSubjects.length} regular subjects for semester ${semester}`);

      // Generate for each section
      for (const section of ['A', 'B']) {
        console.log(`\n  🔄 Processing section ${section}...`);

        // Initialize timetable
        const timetable = initializeEmptyTimetable(workingDays, periodsPerDay);

        // Add breaks
        addBreaksToTimetable(timetable, settings, workingDays);
        console.log(`  ✅ Added breaks to timetable`);

        // DETERMINISTIC LAB SCHEDULING: Force labs to be scheduled at fixed slots
        if (labSubjects.length > 0) {
          console.log(`  🔬 Using DETERMINISTIC lab scheduling for section ${section}`);
          const success = await forceScheduleLabSubjects(
            connection, timetable, labSubjects, globalTeacherAvailability,
            workingDays, semester, section
          );
          console.log(`  ${success ? '✅' : '❌'} Deterministic lab scheduling ${success ? 'succeeded' : 'failed'}`);
        } else {
          console.log(`  ⚠️ No lab subjects found for semester ${semester}`);
        }

        // Schedule regular subjects
        let regularScheduleCount = 0;
        for (const subject of regularSubjects) {
          if (await scheduleRegularSubject(
            connection, timetable, subject, globalTeacherAvailability,
            workingDays, periodsPerDay, semester, section
          )) {
            regularScheduleCount++;
          }
        }
        console.log(`  ✅ Scheduled ${regularScheduleCount}/${regularSubjects.length} regular subjects`);
      }
    }

    await connection.commit();
    console.log('\n✅ Timetable generation completed successfully!');

    // Count the generated slots
    const [countResult] = await connection.query('SELECT COUNT(*) as count FROM timetable_slots');
    console.log(`✅ Generated ${countResult[0].count} timetable slots in total`);

    // VERIFICATION: Check if labs were scheduled properly
    await verifyLabScheduling(connection);

  } catch (error) {
    console.error('\n❌ Error generating timetable:', error);
    if (connection) await connection.rollback();
  } finally {
    if (connection) connection.release();
    process.exit();
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
        const period = lunchBreak.period; // Already storing 1-indexed period in the database

        workingDays.forEach(day => {
          timetable[day][period] = { type: 'break', name: 'Lunch Break' };
        });
      }
    } catch (e) {
      console.log('  ⚠️ Could not parse lunch break settings, skipping');
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
      console.log('  ⚠️ Could not parse short breaks settings, skipping');
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
  try {
    const hoursPerWeek = subject.hours_per_week || 2; // Default to 2 for labs
    let scheduledHours = 0;

    if (!subject.teacher_id) {
      console.log(`  ⚠️ Lab subject ${subject.name} has no assigned teacher. Skipping.`);
      return false;
    }

    console.log(`  🔬 Scheduling lab subject: ${subject.name} (ID: ${subject.id}) for ${semester}${section}, needs ${hoursPerWeek} hours`);

    // Lab sessions are typically scheduled as double periods
    const sessionsNeeded = Math.ceil(hoursPerWeek / 2);
    console.log(`  📊 Lab sessions needed: ${sessionsNeeded}, each session is 2 continuous periods`);

    for (let session = 0; session < sessionsNeeded; session++) {
      // Try to find a suitable slot for a double period
      let scheduled = false;

      // First attempt: Try to schedule at the last periods of the day
      console.log(`  🔄 Attempt 1: Scheduling lab at last periods of the day for session ${session + 1}/${sessionsNeeded}`);
      scheduled = await tryScheduleLabAtLastPeriods(
        connection, timetable, subject, teacherAvailability,
        workingDays, semester, section, scheduledHours
      );

      // Second attempt: Try with regular scheduling logic if last periods not available
      if (!scheduled) {
        console.log(`  🔄 Attempt 2: Regular scheduling for lab session ${session + 1}/${sessionsNeeded}`);
        scheduled = await tryScheduleLabRegular(
          connection, timetable, subject, teacherAvailability,
          workingDays, semester, section, scheduledHours
        );
      }

      // Third attempt: If still not scheduled, try after lunch
      if (!scheduled) {
        console.log(`  🔄 Attempt 3: Scheduling lab after lunch for session ${session + 1}/${sessionsNeeded}`);
        scheduled = await tryScheduleLabAfterLunch(
          connection, timetable, subject, teacherAvailability,
          workingDays, semester, section, scheduledHours
        );
      }

      if (!scheduled) {
        console.log(`  ⚠️ Could not schedule lab subject ${subject.name} in semester ${semester}${section}. Conflicts detected.`);
        return false;
      }

      scheduledHours += 2; // Each successful session adds 2 hours
    }

    console.log(`  ✅ Successfully scheduled all ${scheduledHours} hours for lab subject ${subject.name}`);
    return true;
  } catch (error) {
    console.error(`  ❌ Error scheduling lab subject ${subject.name}:`, error);
    return false;
  }
}

/**
 * Helper function to try scheduling a lab subject at the last periods of the day
 */
async function tryScheduleLabAtLastPeriods(connection, timetable, subject, teacherAvailability, workingDays, semester, section, scheduledHours) {
  // Randomize days to avoid bunching all labs on the same day
  const shuffledDays = [...workingDays].sort(() => 0.5 - Math.random());

  for (const day of shuffledDays) {
    // Get the last two periods of the day
    const lastPeriodIndex = timetable[day].length - 1;
    const secondLastPeriodIndex = lastPeriodIndex - 1;

    // Check if these are the last two valid periods (not breaks, etc.)
    if (secondLastPeriodIndex < 0) {
      console.log(`  ⚠️ Not enough periods in the day for ${day}`);
      continue;
    }

    // Check if both periods are free
    if (timetable[day][secondLastPeriodIndex] !== null || timetable[day][lastPeriodIndex] !== null) {
      console.log(`  ⚠️ Last periods for ${day} are not free`);
      continue;
    }

    // Check teacher availability for both periods
    if (!teacherAvailability[subject.teacher_id][day][secondLastPeriodIndex] ||
      !teacherAvailability[subject.teacher_id][day][lastPeriodIndex]) {
      console.log(`  ⚠️ Teacher not available for last periods on ${day}`);
      continue;
    }

    console.log(`  ✅ Found last-periods slot for lab: ${day}, periods ${secondLastPeriodIndex + 1}-${lastPeriodIndex + 1} for subject ${subject.name}`);

    // Schedule the lab in this slot
    await scheduleLabInSlot(connection, timetable, subject, teacherAvailability,
      day, secondLastPeriodIndex, semester, section, scheduledHours);

    return true;
  }

  console.log(`  ⚠️ No suitable last-periods slots found for lab subject ${subject.name} in section ${section}`);
  return false;
}

/**
 * Helper function to try scheduling a lab subject using the regular algorithm
 */
async function tryScheduleLabRegular(connection, timetable, subject, teacherAvailability, workingDays, semester, section, scheduledHours) {
  // Randomize days to avoid bunching all labs on the same day
  const shuffledDays = [...workingDays].sort(() => 0.5 - Math.random());

  for (const day of shuffledDays) {
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

      console.log(`  ✅ Found slot for lab: ${day}, periods ${period + 1}-${period + 2} for subject ${subject.name}`);

      // Schedule the lab in this slot
      await scheduleLabInSlot(connection, timetable, subject, teacherAvailability,
        day, period, semester, section, scheduledHours);

      return true;
    }
  }

  return false;
}

/**
 * Helper function to try scheduling a lab subject after lunch
 */
async function tryScheduleLabAfterLunch(connection, timetable, subject, teacherAvailability, workingDays, semester, section, scheduledHours) {
  // Identify lunch period - typically this would be period 4 (index 3) in a school day
  // Either read from settings or use middle of the day
  let lunchPeriod = null;

  // Find lunch break in timetable if it exists
  for (let period = 0; period < timetable[workingDays[0]].length; period++) {
    if (timetable[workingDays[0]][period] &&
      timetable[workingDays[0]][period].type === 'break' &&
      timetable[workingDays[0]][period].name === 'Lunch Break') {
      lunchPeriod = period;
      break;
    }
  }

  // If no lunch break found, use middle of the day
  if (lunchPeriod === null) {
    lunchPeriod = Math.floor(timetable[workingDays[0]].length / 2) - 1;
  }

  console.log(`  🍽️ Identified lunch period as period ${lunchPeriod + 1}`);

  // For section A, try Tuesday and Thursday first
  // For section B, try Monday, Wednesday, Friday first
  let orderedDays;
  if (section === 'A') {
    // Section A: Prioritize Tuesday, Thursday, then other days
    const priorityDays = workingDays.filter(day => day === 'Tuesday' || day === 'Thursday');
    const otherDays = workingDays.filter(day => day !== 'Tuesday' && day !== 'Thursday');
    orderedDays = [...priorityDays, ...otherDays];
  } else {
    // Section B: Prioritize Monday, Wednesday, Friday, then other days
    const priorityDays = workingDays.filter(day => day === 'Monday' || day === 'Wednesday' || day === 'Friday');
    const otherDays = workingDays.filter(day => day !== 'Monday' && day !== 'Wednesday' && day !== 'Friday');
    orderedDays = [...priorityDays, ...otherDays];
  }

  console.log(`  🔍 Trying to schedule lab for section ${section} with priority days: ${orderedDays.slice(0, 2).join(', ')}`);

  // First attempt: Try to schedule IMMEDIATELY after lunch on priority days
  for (const day of orderedDays) {
    // Check if slots immediately after lunch are available
    const postLunchPeriod = lunchPeriod + 1;

    if (postLunchPeriod < timetable[day].length - 1 &&
      timetable[day][postLunchPeriod] === null &&
      timetable[day][postLunchPeriod + 1] === null &&
      teacherAvailability[subject.teacher_id][day][postLunchPeriod] &&
      teacherAvailability[subject.teacher_id][day][postLunchPeriod + 1]) {

      console.log(`  ✅ Found IDEAL after-lunch slot for lab (Section ${section}): ${day}, periods ${postLunchPeriod + 1}-${postLunchPeriod + 2} for subject ${subject.name}`);

      // Schedule the lab in this slot
      await scheduleLabInSlot(connection, timetable, subject, teacherAvailability,
        day, postLunchPeriod, semester, section, scheduledHours);

      return true;
    }
  }

  // Second attempt: Try any free periods after lunch
  for (const day of orderedDays) {
    // Start from lunch period and look for two consecutive free periods
    for (let period = lunchPeriod + 1; period < timetable[day].length - 1; period++) {
      // Skip if either period is occupied
      if (timetable[day][period] !== null || timetable[day][period + 1] !== null) {
        continue;
      }

      // Skip if teacher isn't available for both periods
      if (!teacherAvailability[subject.teacher_id][day][period] ||
        !teacherAvailability[subject.teacher_id][day][period + 1]) {
        continue;
      }

      console.log(`  ✅ Found after-lunch slot for lab (Section ${section}): ${day}, periods ${period + 1}-${period + 2} for subject ${subject.name}`);

      // Schedule the lab in this slot
      await scheduleLabInSlot(connection, timetable, subject, teacherAvailability,
        day, period, semester, section, scheduledHours);

      return true;
    }
  }

  console.log(`  ⚠️ No suitable after-lunch slots found for lab subject ${subject.name} in section ${section}`);
  return false;
}

/**
 * Helper function to schedule a lab in a specific slot once found
 */
async function scheduleLabInSlot(connection, timetable, subject, teacherAvailability, day, period, semester, section, scheduledHours) {
  try {
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
    const [assignmentCheck] = await connection.query(
      'SELECT id FROM subject_assignments WHERE subject_id = ? AND teacher_id = ? AND class_name = ?',
      [subject.id, subject.teacher_id, `${semester}${section}`]
    );

    let assignmentId;

    if (assignmentCheck.length > 0) {
      assignmentId = assignmentCheck[0].id;
      console.log(`  📝 Using existing assignment ID: ${assignmentId}`);
    } else {
      const [assignmentResult] = await connection.query(
        'INSERT INTO subject_assignments (subject_id, teacher_id, class_name, hours_per_week) VALUES (?, ?, ?, ?)',
        [subject.id, subject.teacher_id, `${semester}${section}`, subject.hours_per_week || 2]
      );
      assignmentId = assignmentResult.insertId;
      console.log(`  📝 Created new assignment with ID: ${assignmentId}`);
    }

    // First, check if slots already exist
    const [existingSlots] = await connection.query(
      'SELECT * FROM timetable_slots WHERE assignment_id = ? AND day = ? AND (period = ? OR period = ?)',
      [assignmentId, day, period, period + 1]
    );

    if (existingSlots.length > 0) {
      console.log(`  ⚠️ Slots already exist for this assignment. Skipping insertion.`);
      return true;
    }

    // Save to timetable_slots table - storing both periods with the same assignment ID
    console.log(`  💾 Inserting lab slots: ${day}, periods ${period + 1} and ${period + 2} with assignment ID ${assignmentId}`);
    await connection.query(
      'INSERT INTO timetable_slots (assignment_id, day, period) VALUES (?, ?, ?), (?, ?, ?)',
      [assignmentId, day, period, assignmentId, day, period + 1]
    );
    console.log(`  ✅ Successfully saved lab slots for ${day}, periods ${period + 1}-${period + 2}`);

    return true;
  } catch (error) {
    console.error(`  ❌ Error scheduling lab slot:`, error);
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
      console.log(`  ⚠️ Subject ${subject.name} has no assigned teacher. Skipping.`);
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
        console.log(`  ⚠️ Could not schedule all periods for subject ${subject.name} in semester ${semester}${section}. Conflicts detected.`);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error(`  ❌ Error scheduling regular subject ${subject.name}:`, error);
    return false;
  }
}

/**
 * Verify that labs were scheduled properly in the timetable
 */
async function verifyLabScheduling(connection) {
  try {
    console.log('\n📊 VERIFICATION: Checking lab scheduling...');

    // Get all lab subjects
    const [labSubjects] = await connection.query(`
      SELECT id, name, code, semester, teacher_id 
      FROM subjects 
      WHERE is_lab = 1
    `);

    console.log(`Found ${labSubjects.length} lab subjects in the database`);

    // Check if these labs are scheduled in the timetable
    const [scheduledLabs] = await connection.query(`
      SELECT 
        ts.day, 
        ts.period,
        sa.class_name,
        s.id as subject_id,
        s.name as subject_name,
        t.name as teacher_name,
        COUNT(*) as periods_scheduled
      FROM 
        timetable_slots ts
        JOIN subject_assignments sa ON ts.assignment_id = sa.id
        JOIN subjects s ON sa.subject_id = s.id
        JOIN teachers t ON sa.teacher_id = t.id
      WHERE 
        s.is_lab = 1
      GROUP BY 
        s.id, sa.class_name, ts.day
      ORDER BY 
        sa.class_name, ts.day, ts.period
    `);

    console.log(`\n📝 Lab Scheduling Summary:`);

    if (scheduledLabs.length === 0) {
      console.log('❌ NO LABS WERE SCHEDULED!');
      console.log('\nDiagnostic Info:');

      // Check for teacher availability conflicts
      const [teacherConflicts] = await connection.query(`
        SELECT 
          t.id, 
          t.name,
          COUNT(*) as subject_count
        FROM 
          subjects s
          JOIN teachers t ON s.teacher_id = t.id
        WHERE 
          s.is_lab = 1
        GROUP BY 
          t.id
      `);

      console.log(`Teacher assignments for labs:`);
      for (const teacher of teacherConflicts) {
        console.log(`- Teacher ${teacher.name} (ID: ${teacher.id}) assigned to ${teacher.subject_count} lab subjects`);
      }

      // Check timetable for any slots (to verify timetable generation works at all)
      const [anySlots] = await connection.query(`
        SELECT COUNT(*) as count FROM timetable_slots
      `);

      console.log(`\nTotal slots in timetable: ${anySlots[0].count}`);
    } else {
      console.log(`✅ Successfully scheduled ${scheduledLabs.length} lab sessions`);

      // Show the scheduled labs
      const labsBySection = {};

      scheduledLabs.forEach(lab => {
        if (!labsBySection[lab.class_name]) {
          labsBySection[lab.class_name] = [];
        }

        labsBySection[lab.class_name].push(lab);
      });

      for (const [section, labs] of Object.entries(labsBySection)) {
        console.log(`\nSection ${section}:`);
        labs.forEach(lab => {
          console.log(`- ${lab.subject_name} (Teacher: ${lab.teacher_name}) - ${lab.day}, Period ${lab.period + 1}${lab.periods_scheduled > 1 ? ` to ${lab.period + lab.periods_scheduled}` : ''}`);
        });
      }
    }
  } catch (error) {
    console.error('Error during lab verification:', error);
  }
}

/**
 * Force schedule lab subjects at predetermined times based on section
 */
async function forceScheduleLabSubjects(connection, timetable, labSubjects, teacherAvailability, workingDays, semester, section) {
  try {
    // For each section, we'll use the last two periods of specific days
    // Define the last period index
    const periodsPerDay = timetable[workingDays[0]].length;
    const lastPeriodIndex = periodsPerDay - 1;
    const secondLastPeriodIndex = periodsPerDay - 2;

    // Define fixed lab days and periods for each section - using last two periods
    const labSlots = {
      'A': [
        { day: 'Tuesday', period: secondLastPeriodIndex }, // Tuesday last periods
        { day: 'Thursday', period: secondLastPeriodIndex } // Thursday last periods
      ],
      'B': [
        { day: 'Monday', period: secondLastPeriodIndex }, // Monday last periods
        { day: 'Wednesday', period: secondLastPeriodIndex } // Wednesday last periods
      ]
    };

    // Get slots for this section
    const sectionSlots = labSlots[section] || [];

    if (sectionSlots.length === 0) {
      console.log(`  ⚠️ No predefined lab slots for section ${section}`);
      return false;
    }

    console.log(`  📋 Predefined lab slots for section ${section}:`);
    sectionSlots.forEach(slot => {
      console.log(`  - ${slot.day}, period ${slot.period + 1}-${slot.period + 2} (last periods of the day)`);
    });

    // Schedule each lab in a predetermined slot
    let labsScheduled = 0;

    // Try to schedule each lab subject
    for (let i = 0; i < labSubjects.length; i++) {
      const subject = labSubjects[i];
      const slot = sectionSlots[i % sectionSlots.length]; // Cycle through available slots

      if (!slot) {
        console.log(`  ⚠️ No slot available for lab subject ${subject.name}`);
        continue;
      }

      // Check if the slot is available
      if (timetable[slot.day][slot.period] !== null ||
        timetable[slot.day][slot.period + 1] !== null) {
        console.log(`  ⚠️ Slot ${slot.day}, period ${slot.period + 1}-${slot.period + 2} is already occupied`);
        continue;
      }

      // Check teacher availability
      if (!subject.teacher_id) {
        console.log(`  ⚠️ Subject ${subject.name} has no assigned teacher`);
        continue;
      }

      // Force the teacher to be available for this slot (override any conflicts)
      teacherAvailability[subject.teacher_id][slot.day][slot.period] = true;
      teacherAvailability[subject.teacher_id][slot.day][slot.period + 1] = true;

      console.log(`  🔨 Forcing lab subject ${subject.name} into slot ${slot.day}, period ${slot.period + 1}-${slot.period + 2} (last periods)`);

      // Schedule the lab in this slot
      await scheduleLabInSlot(
        connection, timetable, subject, teacherAvailability,
        slot.day, slot.period, semester, section, 0
      );

      labsScheduled++;
    }

    console.log(`  ✅ Successfully scheduled ${labsScheduled}/${labSubjects.length} lab subjects in last periods of the day`);
    return labsScheduled > 0;
  } catch (error) {
    console.error(`  ❌ Error in deterministic lab scheduling:`, error);
    return false;
  }
}

// Run the generation
generateTimetable(); 