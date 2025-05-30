const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all subject assignment routes
router.use(authMiddleware.protect);

/**
 * @route   GET /api/subject-assignments
 * @desc    Get all subject assignments
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const [assignments] = await pool.query(`
      SELECT sa.*, s.name as subject_name, s.code as subject_code, 
             t.name as teacher_name, t.email as teacher_email
      FROM subject_assignments sa
      JOIN subjects s ON sa.subject_id = s.id
      JOIN teachers t ON sa.teacher_id = t.id
      ORDER BY sa.class_name, s.name
    `);
    
    // Format subject codes to remove trailing zeros
    const formattedAssignments = assignments.map(assignment => ({
      ...assignment,
      subject_code: assignment.subject_code.toString().replace(/0+$/, '')
    }));
    
    res.status(200).json({
      success: true,
      count: formattedAssignments.length,
      data: formattedAssignments
    });
  } catch (error) {
    console.error('Get subject assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving subject assignments'
    });
  }
});

/**
 * @route   GET /api/subject-assignments/:id
 * @desc    Get subject assignment by ID
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const [assignments] = await pool.query(`
      SELECT sa.*, s.name as subject_name, s.code as subject_code, 
             t.name as teacher_name, t.email as teacher_email
      FROM subject_assignments sa
      JOIN subjects s ON sa.subject_id = s.id
      JOIN teachers t ON sa.teacher_id = t.id
      WHERE sa.id = ?
    `, [req.params.id]);
    
    if (assignments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Subject assignment not found'
      });
    }
    
    // Format subject code to remove trailing zeros
    const formattedAssignment = {
      ...assignments[0],
      subject_code: assignments[0].subject_code.toString().replace(/0+$/, '')
    };
    
    res.status(200).json({
      success: true,
      data: formattedAssignment
    });
  } catch (error) {
    console.error('Get subject assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving subject assignment'
    });
  }
});

/**
 * @route   POST /api/subject-assignments
 * @desc    Create a new subject assignment
 * @access  Private (Admin only)
 */
router.post('/', authMiddleware.authorize('admin'), async (req, res) => {
  try {
    const { subject_id, teacher_id, class_name, hours_per_week } = req.body;
    
    // Validate required fields
    if (!subject_id || !teacher_id || !class_name || !hours_per_week) {
      return res.status(400).json({
        success: false,
        message: 'Please provide subject_id, teacher_id, class_name, and hours_per_week'
      });
    }
    
    // Begin transaction
    await pool.query('START TRANSACTION');
    
    // Check if subject exists
    const [subjects] = await pool.query('SELECT * FROM subjects WHERE id = ?', [subject_id]);
    
    if (subjects.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }
    
    // Check if teacher exists
    const [teachers] = await pool.query('SELECT * FROM teachers WHERE id = ?', [teacher_id]);
    
    if (teachers.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }
    
    // Check if assignment already exists
    const [existingAssignments] = await pool.query(
      'SELECT * FROM subject_assignments WHERE subject_id = ? AND teacher_id = ? AND class_name = ?',
      [subject_id, teacher_id, class_name]
    );
    
    if (existingAssignments.length > 0) {
      await pool.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Subject assignment already exists for this subject, teacher, and class'
      });
    }
    
    // Create subject assignment
    const [result] = await pool.query(
      'INSERT INTO subject_assignments (subject_id, teacher_id, class_name, hours_per_week) VALUES (?, ?, ?, ?)',
      [subject_id, teacher_id, class_name, hours_per_week]
    );
    
    // Get the created assignment with related data
    const [newAssignment] = await pool.query(`
      SELECT sa.*, s.name as subject_name, s.code as subject_code, 
             t.name as teacher_name, t.email as teacher_email
      FROM subject_assignments sa
      JOIN subjects s ON sa.subject_id = s.id
      JOIN teachers t ON sa.teacher_id = t.id
      WHERE sa.id = ?
    `, [result.insertId]);
    
    // Commit transaction
    await pool.query('COMMIT');
    
    // Format subject code to remove trailing zeros
    const formattedAssignment = {
      ...newAssignment[0],
      subject_code: newAssignment[0].subject_code.toString().replace(/0+$/, '')
    };
    
    res.status(201).json({
      success: true,
      message: 'Subject assignment created successfully',
      data: formattedAssignment
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Create subject assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating subject assignment'
    });
  }
});

/**
 * @route   PUT /api/subject-assignments/:id
 * @desc    Update subject assignment
 * @access  Private (Admin only)
 */
router.put('/:id', authMiddleware.authorize('admin'), async (req, res) => {
  try {
    const { subject_id, teacher_id, class_name, hours_per_week } = req.body;
    
    // Validate required fields
    if (!subject_id || !teacher_id || !class_name || !hours_per_week) {
      return res.status(400).json({
        success: false,
        message: 'Please provide subject_id, teacher_id, class_name, and hours_per_week'
      });
    }
    
    // Begin transaction
    await pool.query('START TRANSACTION');
    
    // Check if assignment exists
    const [existingAssignments] = await pool.query(
      'SELECT * FROM subject_assignments WHERE id = ?',
      [req.params.id]
    );
    
    if (existingAssignments.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Subject assignment not found'
      });
    }
    
    // Check if subject exists
    const [subjects] = await pool.query('SELECT * FROM subjects WHERE id = ?', [subject_id]);
    
    if (subjects.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }
    
    // Check if teacher exists
    const [teachers] = await pool.query('SELECT * FROM teachers WHERE id = ?', [teacher_id]);
    
    if (teachers.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }
    
    // Check if another assignment with the same combination exists
    const [duplicateAssignments] = await pool.query(
      'SELECT * FROM subject_assignments WHERE subject_id = ? AND teacher_id = ? AND class_name = ? AND id != ?',
      [subject_id, teacher_id, class_name, req.params.id]
    );
    
    if (duplicateAssignments.length > 0) {
      await pool.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Another subject assignment already exists for this subject, teacher, and class'
      });
    }
    
    // Update subject assignment
    await pool.query(
      'UPDATE subject_assignments SET subject_id = ?, teacher_id = ?, class_name = ?, hours_per_week = ? WHERE id = ?',
      [subject_id, teacher_id, class_name, hours_per_week, req.params.id]
    );
    
    // Get the updated assignment with related data
    const [updatedAssignment] = await pool.query(`
      SELECT sa.*, s.name as subject_name, s.code as subject_code, 
             t.name as teacher_name, t.email as teacher_email
      FROM subject_assignments sa
      JOIN subjects s ON sa.subject_id = s.id
      JOIN teachers t ON sa.teacher_id = t.id
      WHERE sa.id = ?
    `, [req.params.id]);
    
    // Commit transaction
    await pool.query('COMMIT');
    
    // Format subject code to remove trailing zeros
    const formattedAssignment = {
      ...updatedAssignment[0],
      subject_code: updatedAssignment[0].subject_code.toString().replace(/0+$/, '')
    };
    
    res.status(200).json({
      success: true,
      message: 'Subject assignment updated successfully',
      data: formattedAssignment
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Update subject assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating subject assignment'
    });
  }
});

/**
 * @route   DELETE /api/subject-assignments/:id
 * @desc    Delete subject assignment
 * @access  Private (Admin only)
 */
router.delete('/:id', authMiddleware.authorize('admin'), async (req, res) => {
  try {
    // Begin transaction
    await pool.query('START TRANSACTION');
    
    // Check if assignment exists
    const [existingAssignments] = await pool.query(
      'SELECT * FROM subject_assignments WHERE id = ?',
      [req.params.id]
    );
    
    if (existingAssignments.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Subject assignment not found'
      });
    }
    
    // Check for dependencies in timetable
    const [timetableSlots] = await pool.query(
      'SELECT * FROM timetable_slots WHERE assignment_id = ?',
      [req.params.id]
    );
    
    if (timetableSlots.length > 0) {
      // Delete timetable slots first
      await pool.query('DELETE FROM timetable_slots WHERE assignment_id = ?', [req.params.id]);
    }
    
    // Delete subject assignment
    await pool.query('DELETE FROM subject_assignments WHERE id = ?', [req.params.id]);
    
    // Commit transaction
    await pool.query('COMMIT');
    
    res.status(200).json({
      success: true,
      message: 'Subject assignment deleted successfully'
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Delete subject assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting subject assignment'
    });
  }
});

/**
 * @route   GET /api/subject-assignments/by-teacher/:teacherId
 * @desc    Get subject assignments by teacher ID
 * @access  Private
 */
router.get('/by-teacher/:teacherId', async (req, res) => {
  try {
    const [assignments] = await pool.query(`
      SELECT sa.*, s.name as subject_name, s.code as subject_code, 
             t.name as teacher_name, t.email as teacher_email
      FROM subject_assignments sa
      JOIN subjects s ON sa.subject_id = s.id
      JOIN teachers t ON sa.teacher_id = t.id
      WHERE sa.teacher_id = ?
      ORDER BY s.name, sa.class_name
    `, [req.params.teacherId]);
    
    res.status(200).json({
      success: true,
      count: assignments.length,
      data: assignments
    });
  } catch (error) {
    console.error('Get teacher assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving teacher assignments'
    });
  }
});

/**
 * @route   GET /api/subject-assignments/by-subject/:subjectId
 * @desc    Get subject assignments by subject ID
 * @access  Private
 */
router.get('/by-subject/:subjectId', async (req, res) => {
  try {
    const [assignments] = await pool.query(`
      SELECT sa.*, s.name as subject_name, s.code as subject_code, 
             t.name as teacher_name, t.email as teacher_email
      FROM subject_assignments sa
      JOIN subjects s ON sa.subject_id = s.id
      JOIN teachers t ON sa.teacher_id = t.id
      WHERE sa.subject_id = ?
      ORDER BY sa.class_name, t.name
    `, [req.params.subjectId]);
    
    res.status(200).json({
      success: true,
      count: assignments.length,
      data: assignments
    });
  } catch (error) {
    console.error('Get subject assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving subject assignments'
    });
  }
});

/**
 * @route   GET /api/subject-assignments/by-class/:className
 * @desc    Get subject assignments by class name
 * @access  Private
 */
router.get('/by-class/:className', async (req, res) => {
  try {
    const [assignments] = await pool.query(`
      SELECT sa.*, s.name as subject_name, s.code as subject_code, 
             t.name as teacher_name, t.email as teacher_email
      FROM subject_assignments sa
      JOIN subjects s ON sa.subject_id = s.id
      JOIN teachers t ON sa.teacher_id = t.id
      WHERE sa.class_name = ?
      ORDER BY s.name, t.name
    `, [req.params.className]);
    
    res.status(200).json({
      success: true,
      count: assignments.length,
      data: assignments
    });
  } catch (error) {
    console.error('Get class assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving class assignments'
    });
  }
});

module.exports = router; 