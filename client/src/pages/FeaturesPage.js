import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { 
  FaCalendarAlt, 
  FaUsers, 
  FaBook, 
  FaChartLine, 
  FaClock, 
  FaMobileAlt, 
  FaLock, 
  FaBell, 
  FaClipboardList, 
  FaUsersCog, 
  FaChalkboardTeacher,
  FaFileExport
} from 'react-icons/fa';
import './FeaturesPage.css';

// Navbar component from HomePage to maintain consistent navigation
import { Navbar, Nav } from 'react-bootstrap';

const FeaturesPage = () => {
  return (
    <div className="features-page">
      {/* Navigation Bar */}
      <Navbar bg="white" expand="lg" className="home-navbar">
        <Container>
          <Navbar.Brand as={Link} to="/" className="brand">
            <img
              src="/images/eduscheduler_logo.png"
              width="50"
              height="50"
              className="d-inline-block align-top me-2 rounded-circle"
              alt="EduScheduler Logo"
            />
            <span className="brand-text">EduScheduler</span>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="home-navbar-nav" />
          <Navbar.Collapse id="home-navbar-nav">
            <Nav className="ms-auto">
              <Nav.Link as={Link} to="/" className="nav-link">Home</Nav.Link>
              <Nav.Link as={Link} to="/features" className="nav-link active">Features</Nav.Link>
              <Nav.Link as={Link} to="/manual" className="nav-link">User Manual</Nav.Link>
              <Nav.Link as={Link} to="/contact" className="nav-link">Contact</Nav.Link>
              <div className="ms-3 auth-buttons">
                <Button as={Link} to="/login" variant="outline-primary" className="me-2">Log In</Button>
                <Button as={Link} to="/login" variant="primary" onClick={() => document.querySelector('#register-toggle')?.click()}>Register</Button>
              </div>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Hero Section */}
      <section className="features-hero">
        <Container>
          <Row className="justify-content-center text-center">
            <Col lg={8}>
              <h1>Comprehensive Features for Educational Scheduling</h1>
              <p className="lead">
                Discover how EduScheduler simplifies complex educational timetabling with its powerful features.
              </p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Main Features Section */}
      <section className="main-features">
        <Container>
          <h2 className="section-title text-center mb-5">Core Features</h2>
          <Row className="mb-5">
            <Col md={6} lg={4} className="mb-4">
              <Card className="feature-card h-100">
                <Card.Body>
                  <div className="feature-icon-wrapper mb-4">
                    <FaCalendarAlt className="feature-icon" />
                  </div>
                  <Card.Title>Intelligent Timetable Generation</Card.Title>
                  <Card.Text>
                    Automatically create conflict-free schedules based on constraints like teacher availability, room capacity, subject requirements, and more.
                  </Card.Text>
                  <ul className="feature-list">
                    <li>Constraint-based scheduling</li>
                    <li>Conflict detection and resolution</li>
                    <li>Resource optimization</li>
                    <li>Custom scheduling rules</li>
                  </ul>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6} lg={4} className="mb-4">
              <Card className="feature-card h-100">
                <Card.Body>
                  <div className="feature-icon-wrapper mb-4">
                    <FaChalkboardTeacher className="feature-icon" />
                  </div>
                  <Card.Title>Teacher Management</Card.Title>
                  <Card.Text>
                    Efficiently manage your teaching staff, their workloads, specializations, and availability patterns.
                  </Card.Text>
                  <ul className="feature-list">
                    <li>Teacher profiles and qualifications</li>
                    <li>Workload balancing</li>
                    <li>Availability management</li>
                    <li>Preference settings</li>
                  </ul>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6} lg={4} className="mb-4">
              <Card className="feature-card h-100">
                <Card.Body>
                  <div className="feature-icon-wrapper mb-4">
                    <FaBook className="feature-icon" />
                  </div>
                  <Card.Title>Subject Management</Card.Title>
                  <Card.Text>
                    Organize academic subjects, set requirements, and manage curriculum details with ease.
                  </Card.Text>
                  <ul className="feature-list">
                    <li>Subject creation and organization</li>
                    <li>Curriculum mapping</li>
                    <li>Credit and hour management</li>
                    <li>Prerequisites handling</li>
                  </ul>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6} lg={4} className="mb-4">
              <Card className="feature-card h-100">
                <Card.Body>
                  <div className="feature-icon-wrapper mb-4">
                    <FaUsers className="feature-icon" />
                  </div>
                  <Card.Title>Student Group Management</Card.Title>
                  <Card.Text>
                    Manage classes, cohorts, and student groups to ensure proper scheduling for all students.
                  </Card.Text>
                  <ul className="feature-list">
                    <li>Class and section creation</li>
                    <li>Group-specific scheduling</li>
                    <li>Cohort progression tracking</li>
                    <li>Group capacity management</li>
                  </ul>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6} lg={4} className="mb-4">
              <Card className="feature-card h-100">
                <Card.Body>
                  <div className="feature-icon-wrapper mb-4">
                    <FaClipboardList className="feature-icon" />
                  </div>
                  <Card.Title>Resource Allocation</Card.Title>
                  <Card.Text>
                    Optimize the use of physical resources like classrooms, labs, and equipment.
                  </Card.Text>
                  <ul className="feature-list">
                    <li>Room allocation and management</li>
                    <li>Resource booking system</li>
                    <li>Facility requirements matching</li>
                    <li>Equipment scheduling</li>
                  </ul>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6} lg={4} className="mb-4">
              <Card className="feature-card h-100">
                <Card.Body>
                  <div className="feature-icon-wrapper mb-4">
                    <FaChartLine className="feature-icon" />
                  </div>
                  <Card.Title>Analytics Dashboard</Card.Title>
                  <Card.Text>
                    Gain insights into your scheduling efficiency, resource utilization, and more.
                  </Card.Text>
                  <ul className="feature-list">
                    <li>Resource utilization metrics</li>
                    <li>Teacher workload analysis</li>
                    <li>Schedule efficiency reports</li>
                    <li>Custom data visualizations</li>
                  </ul>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Advanced Features Section */}
      <section className="advanced-features">
        <Container>
          <h2 className="section-title text-center mb-5">Advanced Features</h2>
          <Row>
            <Col md={6} lg={4} className="mb-4">
              <Card className="feature-card h-100">
                <Card.Body>
                  <div className="feature-icon-wrapper mb-4">
                    <FaClock className="feature-icon" />
                  </div>
                  <Card.Title>Automatic Break Scheduling</Card.Title>
                  <Card.Text>
                    Automatically schedule lunch periods, recess, and other breaks based on your institution's needs.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6} lg={4} className="mb-4">
              <Card className="feature-card h-100">
                <Card.Body>
                  <div className="feature-icon-wrapper mb-4">
                    <FaBell className="feature-icon" />
                  </div>
                  <Card.Title>Notifications and Reminders</Card.Title>
                  <Card.Text>
                    Keep stakeholders informed about schedule changes, assignments, and upcoming events.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6} lg={4} className="mb-4">
              <Card className="feature-card h-100">
                <Card.Body>
                  <div className="feature-icon-wrapper mb-4">
                    <FaFileExport className="feature-icon" />
                  </div>
                  <Card.Title>Export and Integration</Card.Title>
                  <Card.Text>
                    Export schedules to various formats and integrate with popular calendar systems.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6} lg={4} className="mb-4">
              <Card className="feature-card h-100">
                <Card.Body>
                  <div className="feature-icon-wrapper mb-4">
                    <FaMobileAlt className="feature-icon" />
                  </div>
                  <Card.Title>Mobile Accessibility</Card.Title>
                  <Card.Text>
                    Access and manage schedules on the go with our responsive design that works on all devices.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6} lg={4} className="mb-4">
              <Card className="feature-card h-100">
                <Card.Body>
                  <div className="feature-icon-wrapper mb-4">
                    <FaUsersCog className="feature-icon" />
                  </div>
                  <Card.Title>Role-Based Access Control</Card.Title>
                  <Card.Text>
                    Define custom roles and permissions to control who can view or modify different aspects of the system.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6} lg={4} className="mb-4">
              <Card className="feature-card h-100">
                <Card.Body>
                  <div className="feature-icon-wrapper mb-4">
                    <FaLock className="feature-icon" />
                  </div>
                  <Card.Title>Data Security</Card.Title>
                  <Card.Text>
                    Protect your institution's data with secure authentication, encryption, and regular backups.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <Container>
          <Row>
            <Col md={4}>
              <h4>EduScheduler</h4>
              <p>Smart timetable management for educational institutions</p>
            </Col>
            <Col md={4}>
              <h4>Quick Links</h4>
              <ul className="footer-links">
                <li><Link to="/">Home</Link></li>
                <li><Link to="/features">Features</Link></li>
                <li><Link to="/manual">User Manual</Link></li>
                <li><Link to="/contact">Contact</Link></li>
              </ul>
            </Col>
            <Col md={4}>
              <h4>Contact Us</h4>
              <p>Email: adityal.23.bmca@acharya.ac.in</p>
              <p>Phone: +91 9474926535</p>
            </Col>
          </Row>
          <div className="text-center mt-4">
            <p>&copy; {new Date().getFullYear()} EduScheduler. All rights reserved.</p>
          </div>
        </Container>
      </footer>
    </div>
  );
};

export default FeaturesPage; 