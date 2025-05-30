import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Button, Table, Modal, Form, Spinner, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaSearch } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { teacherService } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import './TeachersPage.css';

const TeachersPage = () => {
  const { user } = useContext(AuthContext);
  const [teachers, setTeachers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });

  // Fetch teachers data
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setIsLoading(true);
        const response = await teacherService.getAll();
        setTeachers(response.data.teachers || []);
      } catch (error) {
        console.error('Error fetching teachers:', error);
        toast.error('Failed to load teachers');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeachers();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Add new teacher
  const handleAddTeacher = async (e) => {
    e.preventDefault();
    try {
      const response = await teacherService.create(formData);

      setTeachers([...teachers, response.data.data]);
      setShowAddModal(false);
      resetForm();
      toast.success('Teacher added successfully');
    } catch (error) {
      console.error('Error adding teacher:', error);
      toast.error('Failed to add teacher');
    }
  };

  // Edit teacher
  const handleEditTeacher = async (e) => {
    e.preventDefault();
    try {
      const response = await teacherService.update(selectedTeacher.id, formData);

      setTeachers(teachers.map(teacher =>
        teacher.id === selectedTeacher.id ? response.data.data : teacher
      ));
      setShowEditModal(false);
      resetForm();
      toast.success('Teacher updated successfully');
    } catch (error) {
      console.error('Error updating teacher:', error);
      toast.error('Failed to update teacher');
    }
  };

  // Delete teacher
  const handleDeleteTeacher = async () => {
    try {
      await teacherService.delete(selectedTeacher.id);

      setTeachers(teachers.filter(teacher => teacher.id !== selectedTeacher.id));
      setShowDeleteModal(false);
      toast.success('Teacher deleted successfully');
    } catch (error) {
      console.error('Error deleting teacher:', error);
      toast.error('Failed to delete teacher');
    }
  };

  // Open edit modal with teacher data
  const openEditModal = (teacher) => {
    setSelectedTeacher(teacher);
    setFormData({
      name: teacher.name,
      email: teacher.email
    });
    setShowEditModal(true);
  };

  // Open delete confirmation modal
  const openDeleteModal = (teacher) => {
    setSelectedTeacher(teacher);
    setShowDeleteModal(true);
  };

  // Reset form after submit
  const resetForm = () => {
    setFormData({
      name: '',
      email: ''
    });
  };

  // Filter teachers based on search term
  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container fluid className="teachers-page">
      <h1 className="page-title">Teachers</h1>

      <Card className="mb-4">
        <Card.Body>
          <Row className="align-items-center mb-3">
            <Col md={6}>
              <div className="search-box">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search teachers..."
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
                  onClick={() => setShowAddModal(true)}
                >
                  <FaPlus className="me-2" />
                  Add Teacher
                </Button>
              )}
            </Col>
          </Row>

          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Loading teachers...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeachers.length > 0 ? (
                    filteredTeachers.map((teacher, index) => (
                      <tr key={teacher.id} className="teacher-row">
                        <td>{index + 1}</td>
                        <td>{teacher.name}</td>
                        <td>
                          <div className="d-flex justify-content-between align-items-center">
                            <span>{teacher.email}</span>
                            <div className="action-buttons">
                              <OverlayTrigger
                                placement="top"
                                overlay={<Tooltip>Edit</Tooltip>}
                              >
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-0 me-3 text-primary"
                                  onClick={() => openEditModal(teacher)}
                                >
                                  <FaEdit />
                                </Button>
                              </OverlayTrigger>

                              {user?.role === 'admin' && (
                                <OverlayTrigger
                                  placement="top"
                                  overlay={<Tooltip>Delete</Tooltip>}
                                >
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="p-0 text-danger"
                                    onClick={() => openDeleteModal(teacher)}
                                  >
                                    <FaTrash />
                                  </Button>
                                </OverlayTrigger>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="text-center py-4">
                        No teachers found
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Add Teacher Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Teacher</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddTeacher}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Add Teacher
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit Teacher Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Teacher</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditTeacher}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Changes
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
          Are you sure you want to delete the teacher "{selectedTeacher?.name}"? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteTeacher}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default TeachersPage; 