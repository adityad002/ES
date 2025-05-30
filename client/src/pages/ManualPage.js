import React from 'react';
import { Container, Row, Col, Nav, Navbar, Button, Tab } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaBook, FaCalendarAlt, FaChalkboardTeacher, FaUserCog, FaUsers, FaQuestionCircle } from 'react-icons/fa';
import './ManualPage.css';

const ManualPage = () => {
  return (
    <div className="manual-page">
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
              <Nav.Link as={Link} to="/manual" className="nav-link active">User Manual</Nav.Link>
              <Nav.Link as={Link} to="/contact" className="nav-link">Contact</Nav.Link>
              <div className="ms-3 auth-buttons">
                <Button as={Link} to="/login" variant="outline-primary" className="me-2">Log In</Button>
                <Button as={Link} to="/login" variant="primary" onClick={() => document.querySelector('#register-toggle')?.click()}>Register</Button>
              </div>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Manual Hero Section */}
      <section className="manual-hero">
        <Container>
          <Row className="justify-content-center">
            <Col lg={8} className="text-center">
              <FaBook className="manual-icon" />
              <h1>EduScheduler User Manual</h1>
              <p className="lead">
                Comprehensive documentation to help you get the most out of EduScheduler.
              </p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Documentation Section */}
      <section className="docs-section">
        <Container>
          <Tab.Container id="left-tabs-example" defaultActiveKey="getting-started">
            <Row>
              <Col md={3}>
                <div className="docs-sidebar">
                  <Nav variant="pills" className="flex-column">
                    <Nav.Item>
                      <Nav.Link eventKey="getting-started">
                        <FaBook className="sidebar-icon" /> Getting Started
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="timetable">
                        <FaCalendarAlt className="sidebar-icon" /> Timetable Management
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="teachers">
                        <FaChalkboardTeacher className="sidebar-icon" /> Teacher Management
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="students">
                        <FaUsers className="sidebar-icon" /> Student Groups
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="settings">
                        <FaUserCog className="sidebar-icon" /> Settings & Configuration
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="faq">
                        <FaQuestionCircle className="sidebar-icon" /> FAQ
                      </Nav.Link>
                    </Nav.Item>
                  </Nav>
                </div>
              </Col>
              <Col md={9}>
                <Tab.Content className="docs-content">
                  <Tab.Pane eventKey="getting-started">
                    <div className="content-section">
                      <h2>Getting Started with EduScheduler</h2>
                      <p className="mb-4">
                        Welcome to EduScheduler, your complete solution for educational timetable management. 
                        This guide will help you get started with the basic features of the system.
                      </p>
                      
                      <h3>Account Setup</h3>
                      <p>
                        To start using EduScheduler, you need to create an account or log in if you already have one. 
                        Here's how to get set up:
                      </p>
                      <ol>
                        <li>Navigate to the login page by clicking "Log In" in the top menu</li>
                        <li>To create a new account, click "Sign up" on the login page</li>
                        <li>Fill in your name, email address, and password</li>
                        <li>Click "Sign up" to create your account</li>
                        <li>Once logged in, you'll be directed to the dashboard</li>
                      </ol>
                      
                      <h3>Dashboard Overview</h3>
                      <p>
                        The dashboard is your central hub for monitoring and accessing all EduScheduler features:
                      </p>
                      <ul>
                        <li><strong>Quick Actions:</strong> Common tasks for quick access</li>
                        <li><strong>Statistics:</strong> Overview of your scheduling data</li>
                        <li><strong>Recent Activity:</strong> Recent changes to your schedules</li>
                        <li><strong>Sidebar Navigation:</strong> Access to all main features</li>
                      </ul>
                      
                      <h3>Initial Configuration</h3>
                      <p>
                        Before creating your first timetable, we recommend setting up the following:
                      </p>
                      <ol>
                        <li>Enter your institution details in Settings</li>
                        <li>Set up the academic year structure</li>
                        <li>Configure class periods and timings</li>
                        <li>Add teachers and their availability</li>
                        <li>Create student groups/classes</li>
                        <li>Set up subjects and courses</li>
                      </ol>
                      
                      <p>
                        Once these basics are set up, you're ready to start generating and managing timetables!
                      </p>
                    </div>
                  </Tab.Pane>
                  
                  <Tab.Pane eventKey="timetable">
                    <div className="content-section">
                      <h2>Timetable Management</h2>
                      <p className="mb-4">
                        The timetable module is the core of EduScheduler. Here's how to create and manage timetables effectively.
                      </p>
                      
                      <h3>Creating a New Timetable</h3>
                      <p>
                        To create a new timetable:
                      </p>
                      <ol>
                        <li>Navigate to the Timetable section from the sidebar</li>
                        <li>Click "Create New Timetable"</li>
                        <li>Select the academic term</li>
                        <li>Choose manual creation or automatic generation</li>
                        <li>Follow the wizard to complete the setup</li>
                      </ol>
                      
                      <h3>Automatic Timetable Generation</h3>
                      <p>
                        EduScheduler can automatically generate optimized timetables based on your constraints:
                      </p>
                      <ul>
                        <li>Set teacher availability and preferences</li>
                        <li>Define room constraints and capacities</li>
                        <li>Configure subject requirements</li>
                        <li>Specify break periods</li>
                        <li>Set maximum class loads per day</li>
                      </ul>
                      
                      <h3>Manual Adjustments</h3>
                      <p>
                        To manually adjust a timetable:
                      </p>
                      <ol>
                        <li>Open the timetable view</li>
                        <li>Click on a cell to edit</li>
                        <li>Drag and drop classes to move them</li>
                        <li>Right-click for additional options</li>
                        <li>Use the conflict detector to identify and resolve issues</li>
                      </ol>
                      
                      <h3>Viewing Options</h3>
                      <p>
                        EduScheduler offers multiple views of your timetable:
                      </p>
                      <ul>
                        <li><strong>Class View:</strong> Timetable for each student group</li>
                        <li><strong>Teacher View:</strong> Individual schedules for teachers</li>
                        <li><strong>Room View:</strong> Occupancy schedules for rooms</li>
                        <li><strong>Subject View:</strong> When each subject is taught</li>
                      </ul>
                      
                      <h3>Publishing and Sharing</h3>
                      <p>
                        Once your timetable is finalized:
                      </p>
                      <ol>
                        <li>Click "Publish" to make it official</li>
                        <li>Use the export options (PDF, Excel, iCal) to share</li>
                        <li>Generate individual timetables for teachers and classes</li>
                        <li>Send notifications to inform stakeholders</li>
                      </ol>
                    </div>
                  </Tab.Pane>
                  
                  <Tab.Pane eventKey="teachers">
                    <div className="content-section">
                      <h2>Teacher Management</h2>
                      <p className="mb-4">
                        Efficiently manage your teaching staff with EduScheduler's teacher module.
                      </p>
                      
                      <h3>Adding Teachers</h3>
                      <p>To add a new teacher to the system:</p>
                      <ol>
                        <li>Navigate to the Teachers section</li>
                        <li>Click "Add New Teacher"</li>
                        <li>Enter personal and contact details</li>
                        <li>Specify teaching subjects and qualifications</li>
                        <li>Set weekly availability patterns</li>
                        <li>Configure maximum teaching hours</li>
                        <li>Save the teacher profile</li>
                      </ol>
                      
                      <h3>Managing Teacher Workload</h3>
                      <p>Balance teaching loads effectively:</p>
                      <ul>
                        <li>View workload distribution charts</li>
                        <li>Set minimum and maximum teaching hours</li>
                        <li>Configure free periods requirements</li>
                        <li>Track and balance non-teaching duties</li>
                      </ul>
                      
                      <h3>Setting Availability</h3>
                      <p>Define when teachers are available to teach:</p>
                      <ol>
                        <li>Open the teacher's profile</li>
                        <li>Go to the "Availability" tab</li>
                        <li>Use the weekly grid to set available times</li>
                        <li>Set recurring patterns or specific exceptions</li>
                        <li>Save the availability settings</li>
                      </ol>
                      
                      <h3>Teacher Preferences</h3>
                      <p>Accommodate teacher preferences for better satisfaction:</p>
                      <ul>
                        <li>Preferred teaching times</li>
                        <li>Preferred rooms or facilities</li>
                        <li>Subject preferences</li>
                        <li>Class/grade level preferences</li>
                      </ul>
                      
                      <h3>Reporting</h3>
                      <p>Generate insights about your teaching staff:</p>
                      <ul>
                        <li>Individual teacher schedules</li>
                        <li>Workload distribution reports</li>
                        <li>Subject expertise coverage</li>
                        <li>Teacher utilization analysis</li>
                      </ul>
                    </div>
                  </Tab.Pane>
                  
                  <Tab.Pane eventKey="students">
                    <div className="content-section">
                      <h2>Student Group Management</h2>
                      <p>Learn how to organize and manage student groups efficiently.</p>
                      
                      <h3>Creating Student Groups</h3>
                      <p>Effectively organize your student population:</p>
                      <ol>
                        <li>Go to the Students section</li>
                        <li>Click "Create New Group"</li>
                        <li>Name the group (e.g., "Grade 10A")</li>
                        <li>Specify the academic year/grade</li>
                        <li>Set the group size</li>
                        <li>Assign subjects for this group</li>
                        <li>Save the group configuration</li>
                      </ol>
                      
                      <h3>Assigning Subjects</h3>
                      <p>Link appropriate subjects to each student group:</p>
                      <ul>
                        <li>Select from the curriculum for that grade level</li>
                        <li>Specify hours per week for each subject</li>
                        <li>Configure any special requirements (lab access, etc.)</li>
                        <li>Set subject priorities for scheduling</li>
                      </ul>
                      
                      <h3>Managing Group Splits</h3>
                      <p>Handle sub-groups for specialized subjects:</p>
                      <ol>
                        <li>Select a student group</li>
                        <li>Go to "Group Splits"</li>
                        <li>Create sub-groups (e.g., language options)</li>
                        <li>Assign students to each sub-group</li>
                        <li>Link sub-groups to specific subjects</li>
                      </ol>
                    </div>
                  </Tab.Pane>
                  
                  <Tab.Pane eventKey="settings">
                    <div className="content-section">
                      <h2>Settings & Configuration</h2>
                      <p>Customize EduScheduler to match your institution's specific needs.</p>
                      
                      <h3>General Settings</h3>
                      <ul>
                        <li><strong>Institution Details:</strong> Name, address, logo</li>
                        <li><strong>Academic Calendar:</strong> Terms, holidays, special days</li>
                        <li><strong>Daily Schedule:</strong> Period times, breaks</li>
                        <li><strong>User Management:</strong> Accounts, permissions</li>
                        <li><strong>Notification Settings:</strong> Email, alerts</li>
                      </ul>
                      
                      <h3>Timetable Configuration</h3>
                      <ul>
                        <li><strong>Scheduling Rules:</strong> Constraints, priorities</li>
                        <li><strong>Room Management:</strong> Facilities, capacities</li>
                        <li><strong>Subject Settings:</strong> Categories, requirements</li>
                        <li><strong>Scheduling Algorithm:</strong> Optimization preferences</li>
                      </ul>
                      
                      <h3>System Preferences</h3>
                      <ul>
                        <li><strong>Display Options:</strong> Theme, layout, default views</li>
                        <li><strong>Data Export/Import:</strong> Format settings</li>
                        <li><strong>Integration Settings:</strong> APIs, external systems</li>
                        <li><strong>Backup Configuration:</strong> Schedule, retention</li>
                      </ul>
                    </div>
                  </Tab.Pane>
                  
                  <Tab.Pane eventKey="faq">
                    <div className="content-section">
                      <h2>Frequently Asked Questions</h2>
                      
                      <div className="faq-item">
                        <h4>How do I resolve scheduling conflicts?</h4>
                        <p>
                          Scheduling conflicts are highlighted in red in the timetable view. To resolve them:
                        </p>
                        <ol>
                          <li>Click on the conflicted cell to see details</li>
                          <li>Use the conflict resolution wizard</li>
                          <li>Review suggested alternatives</li>
                          <li>Select the best option to resolve the conflict</li>
                          <li>Apply the changes</li>
                        </ol>
                      </div>
                      
                      <div className="faq-item">
                        <h4>Can I import existing teacher and student data?</h4>
                        <p>
                          Yes, EduScheduler supports importing data from various formats:
                        </p>
                        <ul>
                          <li>CSV/Excel imports for bulk data</li>
                          <li>Integration with common SIS systems</li>
                          <li>Manual data entry for smaller datasets</li>
                        </ul>
                        <p>
                          Go to Settings {'>'}  Import/Export to access these features.
                        </p>
                      </div>
                      
                      <div className="faq-item">
                        <h4>How do I handle mid-year schedule changes?</h4>
                        <p>
                          For mid-year changes:
                        </p>
                        <ol>
                          <li>Create a copy of your current timetable</li>
                          <li>Make necessary adjustments to the copy</li>
                          <li>Use the comparison tool to review changes</li>
                          <li>Generate change reports for affected teachers/classes</li>
                          <li>Publish the new version with an effective date</li>
                        </ol>
                      </div>
                      
                      <div className="faq-item">
                        <h4>How can I optimize room usage?</h4>
                        <p>
                          To optimize room usage:
                        </p>
                        <ul>
                          <li>Set accurate room capacities and facilities</li>
                          <li>Use the room utilization report to identify underused spaces</li>
                          <li>Enable the "optimize room allocation" option in the scheduler</li>
                          <li>Set room priorities for subjects with special requirements</li>
                          <li>Review the room heat map to visualize usage patterns</li>
                        </ul>
                      </div>
                      
                      <div className="faq-item">
                        <h4>How do I create a timetable for the next academic year?</h4>
                        <p>
                          To prepare for a new academic year:
                        </p>
                        <ol>
                          <li>Go to Settings {'>'}  Academic Years</li>
                          <li>Add the new academic year</li>
                          <li>Use the "Roll Forward" wizard</li>
                          <li>Select which data to carry forward</li>
                          <li>Update teacher assignments and student groups</li>
                          <li>Generate new timetables based on the updated data</li>
                        </ol>
                      </div>
                    </div>
                  </Tab.Pane>
                </Tab.Content>
              </Col>
            </Row>
          </Tab.Container>
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

export default ManualPage; 