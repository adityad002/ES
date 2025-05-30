import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Button, Navbar, Nav } from 'react-bootstrap';
import { FaCalendarAlt, FaBook, FaUsers, FaChartLine } from 'react-icons/fa';
import './HomePage.css';

const HomePage = () => {
  return (
    <div className="home-page">
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
              <Nav.Link as={Link} to="/features" className="nav-link">Features</Nav.Link>
              <Nav.Link as={Link} to="/manual" className="nav-link">User Manual</Nav.Link>
              <Nav.Link as={Link} to="/contact" className="nav-link">Contact</Nav.Link>
              <div className="ms-3 auth-buttons">
                <Button as={Link} to="/login" variant="outline-primary" className="me-2">Log In</Button>
                <Button as={Link} to="/login" variant="primary" onClick={() => document.querySelector('#register-toggle').click()}>Register</Button>
              </div>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Hero Section */}
      <section className="hero-section">
        <Container>
          <Row className="align-items-center">
            <Col lg={6} className="hero-content">
              <h1>Smart Scheduling for Educational Institutions</h1>
              <p className="hero-description">
                EduScheduler simplifies timetable management, optimizes resource allocation, 
                and enhances productivity for schools, colleges, and universities.
              </p>
              <div className="hero-buttons">
                <Button as={Link} to="/login" variant="primary" className="me-3">Get Started</Button>
                <Button as={Link} to="/manual" variant="outline-secondary">Learn More</Button>
              </div>
            </Col>
            <Col lg={6} className="hero-image">
              <img 
                src="/images/eduscheduler_logo.png" 
                alt="EduScheduler Interface" 
                className="img-fluid" 
              />
            </Col>
          </Row>
        </Container>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <Container>
          <h2 className="section-title text-center mb-5">Powerful Features</h2>
          <Row>
            <Col md={6} lg={3} className="feature-card">
              <div className="card h-100">
                <div className="card-body text-center">
                  <div className="feature-icon">
                    <FaCalendarAlt />
                  </div>
                  <h3>Smart Timetabling</h3>
                  <p>Generate conflict-free schedules with automated timetable generation and management.</p>
                </div>
              </div>
            </Col>
            <Col md={6} lg={3} className="feature-card">
              <div className="card h-100">
                <div className="card-body text-center">
                  <div className="feature-icon">
                    <FaUsers />
                  </div>
                  <h3>Teacher Management</h3>
                  <p>Efficiently manage teacher workloads, specializations, and availability.</p>
                </div>
              </div>
            </Col>
            <Col md={6} lg={3} className="feature-card">
              <div className="card h-100">
                <div className="card-body text-center">
                  <div className="feature-icon">
                    <FaBook />
                  </div>
                  <h3>Subject Handling</h3>
                  <p>Organize subjects, curricula, and academic requirements with ease.</p>
                </div>
              </div>
            </Col>
            <Col md={6} lg={3} className="feature-card">
              <div className="card h-100">
                <div className="card-body text-center">
                  <div className="feature-icon">
                    <FaChartLine />
                  </div>
                  <h3>Analytics Dashboard</h3>
                  <p>Make data-driven decisions with comprehensive scheduling analytics.</p>
                </div>
              </div>
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

export default HomePage; 