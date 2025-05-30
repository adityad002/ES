import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Alert, Navbar, Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock } from 'react-icons/fa';
import './ContactPage.css';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  
  const [formStatus, setFormStatus] = useState({
    submitted: false,
    success: false,
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simple validation
    if (!formData.name || !formData.email || !formData.message) {
      setFormStatus({
        submitted: true,
        success: false,
        message: 'Please fill in all required fields.'
      });
      setIsSubmitting(false);
      return;
    }
    
    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          access_key: 'a138e010-40ee-48b8-93dd-7e42e43d17bd',
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message
        })
      });

      const result = await response.json();

      if (result.success) {
        setFormStatus({
          submitted: true,
          success: true,
          message: 'Thank you for your message! We will get back to you soon.'
        });
        // Clear form
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: ''
        });
      } else {
        throw new Error(result.message || 'Something went wrong');
      }
    } catch (error) {
      setFormStatus({
        submitted: true,
        success: false,
        message: error.message || 'Failed to send message. Please try again later.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-page">
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
              <Nav.Link as={Link} to="/contact" className="nav-link active">Contact</Nav.Link>
              <div className="ms-3 auth-buttons">
                <Button as={Link} to="/login" variant="outline-primary" className="me-2">Log In</Button>
                <Button as={Link} to="/login" variant="primary" onClick={() => document.querySelector('#register-toggle')?.click()}>Register</Button>
              </div>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Contact Hero Section */}
      <section className="contact-hero">
        <Container>
          <Row className="justify-content-center text-center">
            <Col lg={8}>
              <h1>Get in Touch</h1>
              <p className="lead">
                Have questions about EduScheduler? We're here to help.
                Fill out the form below and our team will get back to you as soon as possible.
              </p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Contact Form & Info Section */}
      <section className="contact-section">
        <Container>
          <Row>
            <Col lg={8} className="mb-4 mb-lg-0">
              <div className="contact-form-card">
                <h2>Send us a Message</h2>
                
                {formStatus.submitted && (
                  <Alert variant={formStatus.success ? 'success' : 'danger'}>
                    {formStatus.message}
                  </Alert>
                )}
                
                <Form onSubmit={handleSubmit}>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Your Name*</Form.Label>
                        <Form.Control 
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          disabled={isSubmitting}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Email Address*</Form.Label>
                        <Form.Control 
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          disabled={isSubmitting}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Subject</Form.Label>
                    <Form.Control 
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-4">
                    <Form.Label>Your Message*</Form.Label>
                    <Form.Control 
                      as="textarea"
                      rows={5}
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                    />
                  </Form.Group>
                  
                  <Button 
                    variant="primary" 
                    type="submit" 
                    className="submit-btn"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </Button>
                </Form>
              </div>
            </Col>
            
            <Col lg={4}>
              <div className="contact-info-card">
                <h2>Contact Information</h2>
                <p>Feel free to reach out to us through any of the following channels.</p>
                
                <div className="contact-item">
                  <div className="contact-icon">
                    <FaMapMarkerAlt />
                  </div>
                  <div className="contact-details">
                    <h5>Our Location</h5>
                    <p>Acharya Institutes<br />Bengaluru, Karnataka 560107, India</p>
                  </div>
                </div>
                
                <div className="contact-item">
                  <div className="contact-icon">
                    <FaPhone />
                  </div>
                  <div className="contact-details">
                    <h5>Phone Number</h5>
                    <p>+91 9474926535</p>
                  </div>
                </div>
                
                <div className="contact-item">
                  <div className="contact-icon">
                    <FaEnvelope />
                  </div>
                  <div className="contact-details">
                    <h5>Email Address</h5>
                    <p>adityal.23.bmca@acharya.ac.in<br />support@eduscheduler.com</p>
                  </div>
                </div>
                
                <div className="contact-item">
                  <div className="contact-icon">
                    <FaClock />
                  </div>
                  <div className="contact-details">
                    <h5>Business Hours</h5>
                    <p>Monday - Friday: 9:00 AM - 5:00 PM<br />Saturday & Sunday: Closed</p>
                  </div>
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

export default ContactPage; 