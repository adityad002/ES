const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all subject routes
router.use(authMiddleware.protect);

/**
 * @route   GET /api/subjects
 * @desc    Get all subjects
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const [subjects] = await pool.query(`
      SELECT s.*, t.name as teacher_name 
      FROM subjects s
      LEFT JOIN teachers t ON s.teacher_id = t.id
      ORDER BY s.name
    `);

    res.status(200).json({
      success: true,
      subjects: subjects
    });
  } catch (error) {
    console.error('Get all subjects error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving subjects'
    });
  }
});

/**
 * @route   GET /api/subjects/:id
 * @desc    Get a subject by ID
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const [subjects] = await pool.query(`
      SELECT s.*, t.name as teacher_name, t.email as teacher_email 
      FROM subjects s
      LEFT JOIN teachers t ON s.teacher_id = t.id
      WHERE s.id = ?
    `, [req.params.id]);

    if (subjects.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Format subject code to remove trailing zeros
    const formattedSubject = {
      ...subjects[0],
      code: subjects[0].code.toString().replace(/0+$/, '')
    };

    res.status(200).json({
      success: true,
      data: formattedSubject
    });
  } catch (error) {
    console.error('Get subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving subject'
    });
  }
});

/**
 * @route   POST /api/subjects
 * @desc    Create a new subject
 * @access  Private (Admin only)
 */
router.post('/', authMiddleware.authorize('admin'), async (req, res) => {
  try {
    let { name, code, hours_per_week, semester, is_lab, teacher_id } = req.body;

    // Don't modify the code format - use it as provided by user
    console.log('Creating subject with code:', code);

    // Validate required fields
    if (!name || !code || !semester) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, code, and semester'
      });
    }

    // Check if subject with same code already exists
    const [existingSubjects] = await pool.query('SELECT * FROM subjects WHERE code = ?', [code]);

    if (existingSubjects.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Subject with this code already exists'
      });
    }

    // Check if teacher exists if teacher_id is provided
    if (teacher_id) {
      const [teacherExists] = await pool.query('SELECT id FROM teachers WHERE id = ?', [teacher_id]);

      if (teacherExists.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'The specified teacher does not exist'
        });
      }
    }

    // Insert the new subject
    const [result] = await pool.query(
      'INSERT INTO subjects (name, code, hours_per_week, semester, is_lab, teacher_id) VALUES (?, ?, ?, ?, ?, ?)',
      [name, code, hours_per_week || 4, semester, is_lab || false, teacher_id || null]
    );

    // Get the created subject
    const [newSubject] = await pool.query('SELECT * FROM subjects WHERE id = ?', [result.insertId]);
    
    console.log('Subject created with ID:', result.insertId, 'and code:', newSubject[0].code);

    res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      data: newSubject[0]
    });
  } catch (error) {
    console.error('Create subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating subject'
    });
  }
});

/**
 * @route   PUT /api/subjects/:id
 * @desc    Update a subject
 * @access  Private (Admin only)
 */
router.put('/:id', authMiddleware.authorize('admin'), async (req, res) => {
  try {
    let { name, code, hours_per_week, semester, is_lab, teacher_id } = req.body;

    // Don't modify the code format - use it as provided by user
    console.log('Updating subject with code:', code);

    // Validate required fields
    if (!name || !code || !semester) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, code, and semester'
      });
    }

    // Check if subject exists
    const [existingSubjects] = await pool.query('SELECT * FROM subjects WHERE id = ?', [req.params.id]);

    if (existingSubjects.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Check if code is already used by another subject
    const [codeCheckResult] = await pool.query(
      'SELECT * FROM subjects WHERE code = ? AND id != ?',
      [code, req.params.id]
    );

    if (codeCheckResult.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Code already in use by another subject'
      });
    }

    // Check if teacher exists if teacher_id is provided
    if (teacher_id) {
      const [teacherExists] = await pool.query('SELECT id FROM teachers WHERE id = ?', [teacher_id]);

      if (teacherExists.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'The specified teacher does not exist'
        });
      }
    }

    // Update the subject
    await pool.query(
      'UPDATE subjects SET name = ?, code = ?, hours_per_week = ?, semester = ?, is_lab = ?, teacher_id = ? WHERE id = ?',
      [name, code, hours_per_week || 4, semester, is_lab || false, teacher_id || null, req.params.id]
    );

    // Get the updated subject
    const [updatedSubject] = await pool.query('SELECT * FROM subjects WHERE id = ?', [req.params.id]);
    
    console.log('Subject updated with ID:', req.params.id, 'and code:', updatedSubject[0].code);

    res.status(200).json({
      success: true,
      message: 'Subject updated successfully',
      data: updatedSubject[0]
    });
  } catch (error) {
    console.error('Update subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating subject'
    });
  }
});

/**
 * @route   DELETE /api/subjects/:id
 * @desc    Delete a subject
 * @access  Private (Admin only)
 */
router.delete('/:id', authMiddleware.authorize('admin'), async (req, res) => {
  try {
    // Begin transaction
    await pool.query('START TRANSACTION');

    // Check if subject exists
    const [existingSubjects] = await pool.query('SELECT * FROM subjects WHERE id = ?', [req.params.id]);

    if (existingSubjects.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Check for dependencies (subject assignments)
    const [assignments] = await pool.query(
      'SELECT * FROM subject_assignments WHERE subject_id = ?',
      [req.params.id]
    );

    if (assignments.length > 0) {
      await pool.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Cannot delete subject with existing assignments. Remove assignments first.'
      });
    }

    // Delete the subject
    await pool.query('DELETE FROM subjects WHERE id = ?', [req.params.id]);

    // Commit transaction
    await pool.query('COMMIT');

    res.status(200).json({
      success: true,
      message: 'Subject deleted successfully'
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Delete subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting subject'
    });
  }
});

// Export the router
module.exports = router;
