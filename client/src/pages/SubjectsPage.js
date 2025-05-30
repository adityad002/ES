import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Button, Table, Modal, Form, Spinner, Badge } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaFlask, FaChalkboardTeacher } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { subjectService, teacherService } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import './SubjectsPage.css';

const SubjectsPage = () => {
  const { user } = useContext(AuthContext);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLabSubject, setIsLabSubject] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    hours_per_week: 4,
    semester: 1,
    is_lab: false,
    teacher_id: ''
  });
  const [formMode, setFormMode] = useState('add');
  const [showModal, setShowModal] = useState(false);

  // Fetch subjects data and teachers
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [subjectsResponse, teachersResponse] = await Promise.all([
          subjectService.getAll(),
          teacherService.getAll()
        ]);

        setSubjects(subjectsResponse.data.subjects || []);
        
        // Check the response and use the correct field
        console.log('Teachers API response:', teachersResponse.data);
        const teacherData = teachersResponse.data.teachers || teachersResponse.data.data || [];
        setTeachers(teacherData);
        
        if (teacherData.length === 0) {
          console.warn('No teachers found in the API response');
        } else {
          console.log(`Found ${teacherData.length} teachers`);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle form field changes
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'code') {
      // For code field, don't do any special processing - store as is
      setFormData({
        ...formData,
        [name]: value
      });
    } else if (name === 'hours_per_week' || name === 'semester') {
      // Handle numeric fields
      setFormData({
        ...formData,
        [name]: type === 'number' ? parseInt(value, 10) || '' : value
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };

  // Prepare form for adding or editing a subject
  const handleAddOrEditSubject = (subject = null) => {
    if (subject) {
      // Edit mode
      setFormData({
        ...subject,
        teacher_id: subject.teacher_id ? subject.teacher_id.toString() : ''
      });
      setFormMode('edit');
    } else {
      // Add mode
      setFormData({
        name: '',
        code: '',
        hours_per_week: 4,
        semester: 1,
        is_lab: false,
        teacher_id: ''
      });
      setFormMode('add');
    }

    setSelectedSubject(subject);
    setIsLabSubject(subject?.is_lab || false);
    setShowModal(true);
  };

  // Open delete confirmation modal
  const openDeleteModal = (subject) => {
    setSelectedSubject(subject);
    setShowDeleteModal(true);
  };

  // Delete subject
  const handleDeleteSubject = async () => {
    try {
      await subjectService.delete(selectedSubject.id);

      setSubjects(subjects.filter(subject => subject.id !== selectedSubject.id));
      setShowDeleteModal(false);
      toast.success('Subject deleted successfully');
    } catch (error) {
      console.error('Error deleting subject:', error);
      toast.error('Failed to delete subject');
    }
  };

  // Reset form after submit
  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      hours_per_week: 4,
      semester: 1,
      is_lab: false,
      teacher_id: ''
    });
    setIsLabSubject(false);
  };

  // Save subject (create or update)
  const handleSaveSubject = async (e) => {
    e.preventDefault();
    try {
      let response;

      if (formMode === 'add') {
        // Add new subject
        response = await subjectService.create(formData);
        setSubjects([...subjects, response.data.data]);
        toast.success('Subject added successfully');
      } else {
        // Update existing subject
        response = await subjectService.update(selectedSubject.id, formData);
        setSubjects(subjects.map(subject =>
          subject.id === selectedSubject.id ? response.data.data : subject
        ));
        toast.success('Subject updated successfully');
      }

      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error(`Error ${formMode === 'add' ? 'adding' : 'updating'} subject:`, error);
      toast.error(`Failed to ${formMode === 'add' ? 'add' : 'update'} subject`);
    }
  };

  // Filter subjects based on search term
  const filteredSubjects = subjects.filter(subject =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get teacher name by ID
  const getTeacherName = (teacherId, subject) => {
    if (!teacherId) return "-";

    // First check if the subject has a teacher_name from the backend join
    if (subject && subject.teacher_name) {
      return subject.teacher_name;
    }

    // Fallback to finding the teacher in the teachers array
    const teacher = teachers.find(t => t.id === parseInt(teacherId));
    return teacher ? teacher.name : "-";
  };

  return (
    <Container fluid className="subjects-page">
      <h1 className="page-title">Subjects</h1>

      <Card className="mb-4">
        <Card.Body>
          <Row className="align-items-center mb-3">
            <Col md={6}>
              <div className="search-box">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search subjects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </Col>
            <Col md={6} className="text-md-end">
              {user?.role === 'admin' && (
                <Button
                  variant="primary"
                  onClick={() => handleAddOrEditSubject()}
                >
                  <FaPlus className="me-2" />
                  Add Subject
                </Button>
              )}
            </Col>
          </Row>

          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Loading subjects...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th width="5%">#</th>
                    <th width="15%">Code</th>
                    <th width="25%">Name</th>
                    <th width="10%">Type</th>
                    <th width="15%">Teacher</th>
                    <th width="10%" className="text-center">Semester</th>
                    <th width="10%" className="text-center">Hours/Week</th>
                    <th width="20%" className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubjects.length > 0 ? (
                    filteredSubjects.map((subject, index) => (
                      <tr key={subject.id} className="subject-row">
                        <td>{index + 1}</td>
                        <td>
                          <span className="code-badge">
                            {subject.code}
                            {subject.is_lab && <FaFlask className="ms-1 lab-icon" />}
                          </span>
                        </td>
                        <td>{subject.name}</td>
                        <td>
                          {subject.is_lab ? (
                            <Badge bg="info">Lab</Badge>
                          ) : (
                            <Badge bg="light" text="dark">Regular</Badge>
                          )}
                        </td>
                        <td>
                          {subject.teacher_id ? (
                            <Badge bg="success" className="d-flex align-items-center">
                              <FaChalkboardTeacher className="me-1" />
                              {getTeacherName(subject.teacher_id, subject)}
                            </Badge>
                          ) : (
                            <Badge bg="light" text="dark">Unassigned</Badge>
                          )}
                        </td>
                        <td className="text-center">
                          <Badge bg="info" className="semester-badge">{subject.semester || 1}</Badge>
                        </td>
                        <td className="text-center">{subject.hours_per_week}</td>
                        <td>
                          <div className="d-flex justify-content-end">
                            <div className="action-buttons">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                className="me-2"
                                onClick={() => handleAddOrEditSubject(subject)}
                              >
                                <FaEdit className="me-1" />
                                Edit
                              </Button>

                              {user?.role === 'admin' && (
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => openDeleteModal(subject)}
                                >
                                  <FaTrash className="me-1" />
                                  Delete
                                </Button>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center py-4">
                        No subjects found
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Add/Edit Subject Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {formMode === 'add' ? 'Add New Subject' : 'Edit Subject'}
            {formData.is_lab && <FaFlask className="ms-2" />}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveSubject}>
          <Modal.Body>
            <Form.Group controlId="subjectForm.Lab" className="mb-3">
              <Form.Check
                type="checkbox"
                label="Is Lab Subject"
                name="is_lab"
                checked={formData.is_lab}
                onChange={handleFormChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Subject Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Subject Code</Form.Label>
              <Form.Control
                type="text"
                name="code"
                value={formData.code}
                onChange={handleFormChange}
                required
              />
              <Form.Text className="text-muted">
                {formData.is_lab && "Add 'L' suffix for lab subjects (e.g., CS101L)"}
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                <FaChalkboardTeacher className="me-1" />
                Default Teacher
              </Form.Label>
              <Form.Select
                name="teacher_id"
                value={formData.teacher_id}
                onChange={handleFormChange}
              >
                <option value="">Select a teacher (optional)</option>
                {teachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                Assign a default teacher to this subject
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Semester</Form.Label>
              <Form.Control
                type="number"
                name="semester"
                value={formData.semester}
                onChange={handleFormChange}
                required
                min="1"
                max="8"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Hours Per Week</Form.Label>
              <Form.Control
                type="number"
                name="hours_per_week"
                value={formData.hours_per_week}
                onChange={handleFormChange}
                required
                min="1"
                max="10"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {formMode === 'add' ? 'Add' : 'Save Changes'}
              {formData.is_lab && <FaFlask className="ms-2" />}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the subject "{selectedSubject?.name}"? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteSubject}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default SubjectsPage; 